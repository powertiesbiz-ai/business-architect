// Google Drive integration for Business Architect snapshots.
//
// Free users: manual JSON download / upload (see snapshot.ts).
// Connected users: save / load snapshots directly from a "Business Architect"
// folder in their own Google Drive, using the least-privilege `drive.file`
// scope (the app can only manage files it created).
//
// Auth: client-side Google Identity Services (GIS) token flow. The OAuth
// client ID comes from VITE_GOOGLE_CLIENT_ID (never hardcoded). The access
// token lives in memory only — never localStorage. Only the user's *intent*
// to stay connected persists ("business-architect-drive-intent").

import { useSyncExternalStore } from "react";
import type { SnapshotV1 } from "./snapshot";
import { snapshotFilename } from "./snapshot";

const GIS_SCRIPT = "https://accounts.google.com/gsi/client";
const DRIVE_FOLDER_NAME = "Business Architect";
const INTENT_KEY = "business-architect-drive-intent";
const SCOPE = "https://www.googleapis.com/auth/drive.file";

// ---------- minimal GIS typings (no extra dependency) ----------

interface TokenClient {
  requestAccessToken: (opts?: { prompt?: string }) => void;
}

interface GsiOAuth2 {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (resp: { access_token?: string; error?: string }) => void;
  }) => TokenClient;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: GsiOAuth2;
      };
    };
  }
}

// ---------- connection state ----------

export type DriveStatus = "unconfigured" | "disconnected" | "connecting" | "connected";

export interface DriveState {
  status: DriveStatus;
  email: string | null;
  error: string | null;
}

export interface DriveFile {
  id: string;
  name: string;
  modifiedTime: string;
  size?: string;
}

const clientId: string | undefined = import.meta.env.VITE_GOOGLE_CLIENT_ID || undefined;

let state: DriveState = {
  status: clientId ? "disconnected" : "unconfigured",
  email: null,
  error: null,
};

const listeners = new Set<() => void>();
function setState(patch: Partial<DriveState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
function getSnapshot() {
  return state;
}

export function useDrive() {
  const s = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    ...s,
    configured: !!clientId,
    connect: driveManager.connect.bind(driveManager),
    disconnect: driveManager.disconnect.bind(driveManager),
    saveSnapshotToDrive: driveManager.saveSnapshot.bind(driveManager),
    listSnapshots: driveManager.listSnapshots.bind(driveManager),
    loadSnapshotContent: driveManager.loadSnapshotContent.bind(driveManager),
    hasIntent: driveManager.hasIntent.bind(driveManager),
  };
}

// ---------- GIS script loading ----------

let gisPromise: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GIS_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gisPromise = null;
      reject(new Error("Could not load Google sign-in. Check your connection and try again."));
    };
    document.head.appendChild(script);
  });
  return gisPromise;
}

// ---------- Drive API ----------

async function driveFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = driveManager.token;
  if (!token) throw new Error("Not connected to Google Drive.");
  const resp = await fetch(input, {
    ...init,
    headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` },
  });
  if (resp.status === 401) {
    // Token expired or revoked — drop it and ask the user to reconnect.
    driveManager.handleUnauthorized();
    throw new Error("Your Google session expired. Please reconnect Google Drive.");
  }
  return resp;
}

class DriveManager {
  token: string | null = null;
  private tokenClient: TokenClient | null = null;
  private folderIdPromise: Promise<string> | null = null;
  private pendingResolve: ((token: string) => void) | null = null;
  private pendingReject: ((err: Error) => void) | null = null;

  hasIntent(): boolean {
    try {
      return localStorage.getItem(INTENT_KEY) === "1";
    } catch {
      return false;
    }
  }

  private setIntent(v: boolean) {
    try {
      if (v) localStorage.setItem(INTENT_KEY, "1");
      else localStorage.removeItem(INTENT_KEY);
    } catch {
      /* non-fatal */
    }
  }

  /** Called internally when a Drive call 401s. */
  handleUnauthorized() {
    this.token = null;
    this.folderIdPromise = null;
    setState({ status: "disconnected", email: null, error: "Session expired — please reconnect." });
  }

  async connect(): Promise<void> {
    if (!clientId) {
      setState({ error: "Google Drive isn't configured for this deployment yet." });
      return;
    }
    if (state.status === "connecting") return;
    setState({ status: "connecting", error: null });
    try {
      await loadGis();
      const oauth2 = window.google?.accounts?.oauth2;
      if (!oauth2) throw new Error("Google sign-in failed to initialize.");

      if (!this.tokenClient) {
        this.tokenClient = oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPE,
          callback: (resp) => {
            if (resp.access_token) {
              this.token = resp.access_token;
              this.pendingResolve?.(resp.access_token);
            } else {
              this.pendingReject?.(new Error(resp.error || "Google sign-in was cancelled."));
            }
            this.pendingResolve = null;
            this.pendingReject = null;
          },
        });
      }

      const token = await new Promise<string>((resolve, reject) => {
        this.pendingResolve = resolve;
        this.pendingReject = reject;
        // "" = no forced prompt; GIS shows the account chooser on first connect
        this.tokenClient!.requestAccessToken({ prompt: "" });
      });

      // Fetch the account email for display (best-effort)
      let email: string | null = null;
      try {
        const r = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r.ok) email = (await r.json()).email ?? null;
      } catch {
        /* non-fatal */
      }

      this.token = token;
      this.setIntent(true);
      setState({ status: "connected", email, error: null });

      // Warm the folder lookup so first save is fast
      void this.ensureFolder().catch(() => {});
    } catch (e) {
      setState({
        status: "disconnected",
        error: e instanceof Error ? e.message : "Could not connect to Google Drive.",
      });
      throw e;
    }
  }

  disconnect() {
    if (this.token && window.google?.accounts?.oauth2) {
      // Best-effort revoke; ignore failures
      void fetch(`https://oauth2.googleapis.com/revoke?token=${this.token}`, { method: "POST" }).catch(() => {});
    }
    this.token = null;
    this.folderIdPromise = null;
    this.setIntent(false);
    setState({ status: "disconnected", email: null, error: null });
  }

  /** Find or create the "Business Architect" folder. Cached per session. */
  async ensureFolder(): Promise<string> {
    if (this.folderIdPromise) return this.folderIdPromise;
    this.folderIdPromise = (async () => {
      const q = encodeURIComponent(
        `name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
      );
      const list = await driveFetch(
        `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)&pageSize=1`
      );
      if (!list.ok) throw new Error("Could not access Google Drive.");
      const data = await list.json();
      if (data.files?.length) return data.files[0].id as string;

      const created = await driveFetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: DRIVE_FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" }),
      });
      if (!created.ok) throw new Error("Could not create the Drive folder.");
      return ((await created.json()).id as string) ?? "";
    })();
    // Don't cache failures
    this.folderIdPromise.catch(() => {
      this.folderIdPromise = null;
    });
    return this.folderIdPromise;
  }

  /** Upload a snapshot JSON into the app folder. Always a new dated file (meeting history). */
  async saveSnapshot(snap: SnapshotV1): Promise<{ fileName: string }> {
    const folderId = await this.ensureFolder();
    const fileName = snapshotFilename(snap.businessName, snap.savedAt);
    const metadata = { name: fileName, parents: [folderId], mimeType: "application/json" };
    const content = JSON.stringify(snap, null, 2);

    const boundary = "ba-" + Math.random().toString(36).slice(2);
    const body =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify(metadata) +
      `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n` +
      content +
      `\r\n--${boundary}--`;

    const resp = await driveFetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    });
    if (!resp.ok) throw new Error("Upload to Google Drive failed.");
    return { fileName };
  }

  /** List snapshot JSONs in the app folder, newest first. */
  async listSnapshots(): Promise<DriveFile[]> {
    const folderId = await this.ensureFolder();
    const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
    const resp = await driveFetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=modifiedTime desc&fields=files(id,name,modifiedTime,size)&pageSize=50`
    );
    if (!resp.ok) throw new Error("Could not list Drive snapshots.");
    const data = await resp.json();
    return (data.files ?? []) as DriveFile[];
  }

  /** Download a snapshot file's raw JSON text. */
  async loadSnapshotContent(fileId: string): Promise<string> {
    const resp = await driveFetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`);
    if (!resp.ok) throw new Error("Could not download that snapshot.");
    return resp.text();
  }
}

export const driveManager = new DriveManager();
