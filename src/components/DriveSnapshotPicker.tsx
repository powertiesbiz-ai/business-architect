import { useEffect, useState } from "react";
import { useDrive, type DriveFile } from "../lib/drive";
import { validateSnapshot, formatSnapshotDate, type SnapshotV1 } from "../lib/snapshot";

/**
 * Modal listing the user's Drive snapshots (newest first).
 * On select, downloads the file content and validates it through the
 * existing snapshot path — no duplicated validation logic.
 */
export default function DriveSnapshotPicker({
  open,
  onClose,
  onLoad,
}: {
  open: boolean;
  onClose: () => void;
  onLoad: (snap: SnapshotV1) => void;
}) {
  const { status, listSnapshots, loadSnapshotContent } = useDrive();
  const [files, setFiles] = useState<DriveFile[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || status !== "connected") return;
    setLoading(true);
    setError(null);
    setFiles(null);
    listSnapshots()
      .then(setFiles)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not list snapshots."))
      .finally(() => setLoading(false));
  }, [open, status, listSnapshots]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open ]);

  if (!open) return null;

  const handleSelect = async (f: DriveFile) => {
    setDownloadingId(f.id);
    setError(null);
    try {
      const text = await loadSnapshotContent(f.id);
      const snap = validateSnapshot(JSON.parse(text));
      onLoad(snap);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "That file isn't a valid snapshot.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Load snapshot from Google Drive"
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold text-ink-900">Snapshots in Google Drive</h2>
            <p className="mt-1 text-sm text-ink-500">
              Every meeting&apos;s snapshot, newest first. Pick one to load it back into the app.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-semibold text-ink-500 hover:bg-ink-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 max-h-80 overflow-y-auto">
          {loading && <p className="py-8 text-center text-sm text-ink-500">Loading your Drive snapshots…</p>}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
          {!loading && !error && files && files.length === 0 && (
            <p className="py-8 text-center text-sm text-ink-500">
              No snapshots in Drive yet. Save your first one from the results page and it&apos;ll show up here.
            </p>
          )}
          {!loading && !error && files && files.length > 0 && (
            <ul className="space-y-2">
              {files.map((f) => (
                <li key={f.id}>
                  <button
                    onClick={() => handleSelect(f)}
                    disabled={downloadingId !== null}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-ink-200 px-4 py-3 text-left hover:border-blueprint-400 hover:bg-blueprint-50 disabled:opacity-60"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink-900">{f.name}</span>
                      <span className="block text-xs text-ink-500">
                        {formatSnapshotDate(f.modifiedTime)}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-blueprint-700">
                      {downloadingId === f.id ? "Loading…" : "Load →"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
