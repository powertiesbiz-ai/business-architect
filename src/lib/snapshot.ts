// Snapshot save / load / compare for the consultant meeting workflow.
//
// Each client meeting produces a downloadable JSON snapshot containing the
// complete wizard inputs plus the generated blueprint. At the next meeting
// the consultant loads the snapshot, updates what changed, regenerates, and
// the dashboard shows a "Progress Since Last Meeting" comparison.
//
// Snapshots are plain JSON files (the source of truth). A lightweight log
// in localStorage just hints how many snapshots were saved in this browser.

import type { Blueprint, WizardData } from "../types";

export const SNAPSHOT_VERSION = 1;

export interface SnapshotV1 {
  snapshotVersion: 1;
  savedAt: string; // ISO timestamp
  businessName: string;
  inputs: WizardData;
  blueprint: Blueprint;
}

export interface SnapshotLogEntry {
  savedAt: string;
  businessName: string;
}

const LOG_KEY = "business-architect-snapshot-log";

// ---------- build / download ----------

export function buildSnapshot(data: WizardData, blueprint: Blueprint): SnapshotV1 {
  return {
    snapshotVersion: 1,
    savedAt: new Date().toISOString(),
    businessName: data.vision.businessName || blueprint.businessName || "My Business",
    inputs: data,
    blueprint,
  };
}

function slug(s: string): string {
  const t = (s || "business").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return t || "business";
}

export function snapshotFilename(businessName: string, savedAt: string): string {
  const date = (savedAt || new Date().toISOString()).slice(0, 10); // YYYY-MM-DD
  return `${slug(businessName)}-blueprint-${date}.json`;
}

export function downloadSnapshot(snap: SnapshotV1): void {
  const json = JSON.stringify(snap, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = snapshotFilename(snap.businessName, snap.savedAt);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function formatSnapshotDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

// ---------- load / validate ----------

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function validateSnapshot(raw: unknown): SnapshotV1 {
  if (!isObject(raw)) throw new Error("That file doesn't contain a valid snapshot.");
  if (raw.snapshotVersion !== SNAPSHOT_VERSION) {
    throw new Error(
      `Unsupported snapshot version (${String(raw.snapshotVersion)}). This app reads version ${SNAPSHOT_VERSION} snapshots.`
    );
  }
  if (!isObject(raw.inputs) || !isObject(raw.blueprint)) {
    throw new Error("That file is missing the snapshot inputs or blueprint.");
  }
  const inputs = raw.inputs as Record<string, unknown>;
  const bp = raw.blueprint as Record<string, unknown>;
  if (!isObject(inputs.vision) || !isObject(inputs.currentState) || !isObject(inputs.futureState)) {
    throw new Error("That snapshot's inputs are incomplete (vision / current state / future state).");
  }
  if (!isObject(bp.dependencyScore) || !Array.isArray(bp.bottlenecks) || !Array.isArray(bp.completionScores)) {
    throw new Error("That snapshot's blueprint is incomplete.");
  }
  return {
    snapshotVersion: 1,
    savedAt: typeof raw.savedAt === "string" ? raw.savedAt : new Date().toISOString(),
    businessName: typeof raw.businessName === "string" ? raw.businessName : "My Business",
    inputs: raw.inputs as unknown as WizardData,
    blueprint: raw.blueprint as unknown as Blueprint,
  };
}

export function parseSnapshotFile(file: File): Promise<SnapshotV1> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      try {
        const raw = JSON.parse(String(reader.result));
        resolve(validateSnapshot(raw));
      } catch (e) {
        reject(e instanceof Error ? e : new Error("That file isn't a valid Business Architect snapshot."));
      }
    };
    reader.readAsText(file);
  });
}

// ---------- local snapshot log (convenience hint only) ----------

export function getSnapshotLog(): SnapshotLogEntry[] {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function logSnapshot(savedAt: string, businessName: string): void {
  try {
    const log = getSnapshotLog();
    log.unshift({ savedAt, businessName });
    localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(0, 50)));
  } catch {
    /* non-fatal */
  }
}

// ---------- comparison ----------

export interface MetricDelta {
  prev: string;
  curr: string;
  /** direction of change when both sides parse as numbers: "up" | "down" | null */
  direction: "up" | "down" | null;
}

export interface ScoreDelta {
  area: string;
  prev: number;
  curr: number;
  delta: number; // curr - prev
}

export interface HiringProgress {
  position: string;
  timing: string;
  status: "hired" | "pending";
}

export type BottleneckStatus = "same" | "still-present" | "resolved-new";

export interface BlueprintDelta {
  businessName: string;
  prevDate: string;
  dependency: { prev: number; curr: number; delta: number }; // delta = prev - curr; positive = improvement (less dependent)
  revenue: MetricDelta;
  employees: MetricDelta;
  ownerHours: MetricDelta;
  completionScores: ScoreDelta[];
  overallReadiness: { prev: number; curr: number; delta: number };
  prevBottleneck: string;
  currBottleneck: string;
  bottleneckStatus: BottleneckStatus;
  hiringProgress: HiringProgress[];
  newPositions: string[];
}

/** Best-effort parse of "$1.2M", "250k", "5" etc. Returns null when unparseable. */
function parseMoneyish(s: string): number | null {
  const t = (s || "").trim().replace(/[$,\s]/g, "").toLowerCase();
  if (!t) return null;
  const m = t.match(/^([\d.]+)([kmb])?$/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (isNaN(n)) return null;
  const mult = m[2] === "k" ? 1e3 : m[2] === "m" ? 1e6 : m[2] === "b" ? 1e9 : 1;
  return n * mult;
}

function metricDelta(prev: string, curr: string): MetricDelta {
  const pn = parseMoneyish(prev);
  const cn = parseMoneyish(curr);
  let direction: "up" | "down" | null = null;
  if (pn !== null && cn !== null && pn !== cn) direction = cn > pn ? "up" : "down";
  return { prev: prev || "—", curr: curr || "—", direction };
}

function normTitle(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

const FILLER_WORDS = new Set([
  "manager", "assistant", "senior", "junior", "lead", "associate", "coordinator",
  "director", "chief", "head", "the", "and", "for", "team", "capacity",
]);

function significantWords(title: string): string[] {
  return normTitle(title)
    .split(" ")
    .filter((w) => w.length > 3 && !FILLER_WORDS.has(w));
}

/** Words match when equal or one contains the other (covers Sales/Salesperson). */
function wordsMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const short = a.length <= b.length ? a : b;
  const long = a.length <= b.length ? b : a;
  return short.length >= 4 && long.includes(short);
}

function wordSetsOverlap(a: string[], b: string[]): boolean {
  return a.some((w1) => b.some((w2) => wordsMatch(w1, w2)));
}

/**
 * Heuristic: a previously-recommended hire counts as "hired" when the current
 * hat map shows a matching function now owned by someone other than the owner
 * (or "nobody"). Labeled as inferred in the UI — the consultant confirms.
 */
function inferHired(position: string, hats: { functionName: string; currentOwner: string }[]): boolean {
  const posWords = significantWords(position);
  if (posWords.length === 0) return false;
  return hats.some((h) => {
    const owner = (h.currentOwner || "").trim().toLowerCase();
    if (!owner || owner === "owner" || owner === "nobody") return false;
    const hatWords = normTitle(h.functionName).split(" ").filter((w) => w.length > 3);
    // also match on owner name containing role words (e.g. owner field "Sales Rep Maria")
    const ownerWords = normTitle(h.currentOwner).split(" ").filter((w) => w.length > 3);
    return wordSetsOverlap(posWords, hatWords) || wordSetsOverlap(posWords, ownerWords);
  });
}

function bottleneckStatus(prevTitle: string, currTitle: string, currAll: string[]): BottleneckStatus {
  const p = normTitle(prevTitle);
  const c = normTitle(currTitle);
  if (p && c && (p === c || p.includes(c) || c.includes(p))) return "same";
  const pWords = significantWords(prevTitle);
  const stillThere = currAll.some((t) => wordSetsOverlap(pWords, significantWords(t)));
  return stillThere ? "still-present" : "resolved-new";
}

export function compareBlueprints(
  prev: SnapshotV1,
  currInputs: WizardData,
  curr: Blueprint
): BlueprintDelta {
  const prevInputs = prev.inputs;
  const prevBp = prev.blueprint;

  const depPrev = prevBp.dependencyScore.current;
  const depCurr = curr.dependencyScore.current;

  const prevScores = new Map(prevBp.completionScores.map((s) => [s.area, s.score]));
  const completionScores: ScoreDelta[] = curr.completionScores.map((s) => {
    const p = prevScores.get(s.area) ?? s.score;
    return { area: s.area, prev: p, curr: s.score, delta: s.score - p };
  });
  // Include areas that disappeared from the current blueprint
  prevBp.completionScores.forEach((s) => {
    if (!completionScores.some((c) => c.area === s.area)) {
      completionScores.push({ area: s.area, prev: s.score, curr: s.score, delta: 0 });
    }
  });

  const hiringProgress: HiringProgress[] = (prevBp.hiringSequence || []).map((h) => ({
    position: h.position,
    timing: h.timing,
    status: inferHired(h.position, currInputs.currentState.hats) ? "hired" : "pending",
  }));

  const prevTitles = new Set(prevBp.orgChart.map((p) => normTitle(p.title)));
  const newPositions = curr.orgChart
    .map((p) => p.title)
    .filter((t) => !prevTitles.has(normTitle(t)));

  const prevTop = prevBp.bottlenecks[0]?.title || "";
  const currTop = curr.bottlenecks[0]?.title || "";

  return {
    businessName: curr.businessName || prev.businessName,
    prevDate: formatSnapshotDate(prev.savedAt),
    dependency: { prev: depPrev, curr: depCurr, delta: depPrev - depCurr },
    revenue: metricDelta(prevInputs.currentState.currentRevenue, currInputs.currentState.currentRevenue),
    employees: metricDelta(prevInputs.currentState.currentEmployees, currInputs.currentState.currentEmployees),
    ownerHours: metricDelta(prevInputs.currentState.ownerHoursNow, currInputs.currentState.ownerHoursNow),
    completionScores,
    overallReadiness: {
      prev: prevBp.overallReadiness,
      curr: curr.overallReadiness,
      delta: curr.overallReadiness - prevBp.overallReadiness,
    },
    prevBottleneck: prevTop,
    currBottleneck: currTop,
    bottleneckStatus: bottleneckStatus(prevTop, currTop, curr.bottlenecks.map((b) => b.title)),
    hiringProgress,
    newPositions,
  };
}
