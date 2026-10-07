import { useState } from "react";
import { useDrive } from "../lib/drive";

/**
 * "Connect Google Drive" button with full state handling:
 * - unconfigured (no VITE_GOOGLE_CLIENT_ID): disabled with tooltip
 * - disconnected: "Connect Google Drive" (or "Reconnect" when intent exists)
 * - connecting: spinner
 * - connected: account email + Disconnect
 */
export default function DriveConnect({ compact = false }: { compact?: boolean }) {
  const { status, email, error, configured, connect, disconnect, hasIntent } = useDrive();
  const [busy, setBusy] = useState(false);

  const handleConnect = async () => {
    setBusy(true);
    try {
      await connect();
    } catch {
      /* error already surfaced via state */
    } finally {
      setBusy(false);
    }
  };

  if (!configured) {
    return (
      <span
        title="Google Drive isn't configured for this deployment yet."
        className={`inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-ink-200 bg-ink-100 px-4 py-2.5 text-sm font-semibold text-ink-400 ${compact ? "" : ""}`}
      >
        <DriveIcon />
        Connect Google Drive
      </span>
    );
  }

  if (status === "connected") {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800">
          <DriveIcon />
          {email ?? "Google Drive connected"}
        </span>
        <button
          onClick={disconnect}
          className="rounded-lg px-2 py-2.5 text-sm font-semibold text-ink-500 underline hover:text-ink-800"
        >
          Disconnect
        </button>
      </span>
    );
  }

  const connecting = status === "connecting" || busy;
  const label = hasIntent() ? "Reconnect Google Drive" : "Connect Google Drive";

  return (
    <span className="inline-flex flex-col gap-1">
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="inline-flex items-center gap-2 rounded-lg border border-blueprint-600 bg-white px-4 py-2.5 text-sm font-semibold text-blueprint-700 hover:bg-blueprint-50 disabled:opacity-60"
      >
        {connecting ? <Spinner /> : <DriveIcon />}
        {connecting ? "Connecting…" : label}
      </button>
      {error && <span className="max-w-xs text-xs text-red-600">{error}</span>}
    </span>
  );
}

export function DriveIcon() {
  // Simple multicolor-ish triangle evoking Drive, drawn with currentColor-safe shapes
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 3h8l8 14H8L0 17l8-14z" fill="#34A853" opacity="0.9" transform="scale(0.92) translate(1,1)" />
      <path d="M16 3H8L0 17h8l8-14z" fill="#FBBC04" opacity="0.9" transform="scale(0.92) translate(1,1)" />
      <path d="M8 17h16L16 3l-8 14h0z" fill="#4285F4" opacity="0.9" transform="scale(0.92) translate(1,1)" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
