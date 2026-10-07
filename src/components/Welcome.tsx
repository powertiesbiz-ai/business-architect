import { useEffect, useRef, useState } from "react";
import type { SnapshotV1 } from "../lib/snapshot";
import { getSnapshotLog, parseSnapshotFile } from "../lib/snapshot";
import { useDrive } from "../lib/drive";
import DriveConnect from "./DriveConnect";
import DriveSnapshotPicker from "./DriveSnapshotPicker";

export default function Welcome({ onStart, onLoadSnapshot }: {
  onStart: () => void;
  onLoadSnapshot: (snap: SnapshotV1) => void;
}) {
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [drivePickerOpen, setDrivePickerOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { status: driveStatus, configured: driveConfigured } = useDrive();
  const driveConnected = driveStatus === "connected";

  useEffect(() => {
    setSavedCount(getSnapshotLog().length);
  }, []);

  const handleFile = async (f: File | undefined) => {
    if (!f) return;
    setLoadError(null);
    try {
      const snap = await parseSnapshotFile(f);
      onLoadSnapshot(snap);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not read that file.");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-blueprint-600">
          Business Architecture &amp; Transformation
        </p>
        <h1 className="font-serif text-4xl font-bold leading-tight text-ink-900 md:text-6xl">
          Build the Business<br />You Actually Want
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-600">
          Most owners don&apos;t have a business — they have a job they can&apos;t quit.
          This tool designs the company you want: the organization, the people, the systems,
          the economics, and the exact roadmap to get there.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-ink-200 bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-blueprint-600">Truth</p>
            <p className="mt-2 text-ink-700">An honest diagnosis of where your business really stands — hats, bottlenecks, and owner dependency.</p>
          </div>
          <div className="rounded-xl border border-ink-200 bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-blueprint-600">Grow</p>
            <p className="mt-2 text-ink-700">The future-state design: org structure, positions, financial model, and hiring plan to get there.</p>
          </div>
          <div className="rounded-xl border border-ink-200 bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-blueprint-600">Legacy</p>
            <p className="mt-2 text-ink-700">Systems, SOPs, and a roadmap that make the business run without you — an asset, not a job.</p>
          </div>
        </div>

        <div className="mt-12 rounded-xl bg-ink-900 p-8 text-white">
          <p className="font-serif text-xl italic leading-relaxed">
            &ldquo;Tell us where your business is, tell us where you want it to go, and we&apos;ll design
            the organization, people, systems, economics, and roadmap required to get there.&rdquo;
          </p>
        </div>

        <button
          onClick={onStart}
          className="mt-10 w-full rounded-lg bg-blueprint-600 px-8 py-4 text-lg font-semibold text-white hover:bg-blueprint-700 md:w-auto"
        >
          Start Your Blueprint →
        </button>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-lg border border-ink-300 bg-white px-8 py-3.5 text-base font-semibold text-ink-700 hover:bg-ink-100 md:w-auto"
          >
            📂 Load a Saved Snapshot
          </button>
          {driveConnected && (
            <button
              onClick={() => setDrivePickerOpen(true)}
              className="w-full rounded-lg border border-blueprint-600 bg-white px-8 py-3.5 text-base font-semibold text-blueprint-700 hover:bg-blueprint-50 md:w-auto"
            >
              ☁️ Load from Google Drive
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <DriveConnect />
          {!driveConnected && driveConfigured && (
            <p className="text-sm text-ink-500">Connect Google Drive to auto-save every snapshot.</p>
          )}
        </div>
        {savedCount > 0 && (
          <p className="mt-2 text-sm text-ink-500">
            {savedCount} snapshot{savedCount === 1 ? "" : "s"} saved in this browser
          </p>
        )}
        {loadError && (
          <p className="mt-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-800">
            {loadError}
          </p>
        )}
        <p className="mt-4 text-sm text-ink-500">Takes about 10 minutes. Your answers never leave your browser.</p>
      </div>
      <DriveSnapshotPicker
        open={drivePickerOpen}
        onClose={() => setDrivePickerOpen(false)}
        onLoad={onLoadSnapshot}
      />
    </div>
  );
}
