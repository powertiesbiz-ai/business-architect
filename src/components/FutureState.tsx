import type { FutureStateData, HatEntry } from "../types";
import { StepShell, Field, TextInput, Select, NavButtons } from "./ui";

const DECISION_LABELS: Record<string, string> = {
  keep: "Keep — I do this",
  hire: "Hire for — someone else owns it",
  systematize: "Systematize — process/system handles it",
};

export default function FutureState({ hats, data, onChange, onBack, onBuild, building }: {
  hats: HatEntry[]; data: FutureStateData; onChange: (d: FutureStateData) => void;
  onBack: () => void; onBuild: () => void; building: boolean;
}) {
  // Seed future hats from the hat map on first render
  const decisions = data.futureHats.length
    ? data.futureHats
    : hats.map((h) => ({
        functionName: h.functionName,
        decision: (h.currentOwner.toLowerCase() === "owner" ? "hire" : "keep") as "keep" | "hire" | "systematize",
      }));

  const setDecision = (fn: string, decision: "keep" | "hire" | "systematize") => {
    const next = decisions.map((d) => (d.functionName === fn ? { ...d, decision } : d));
    onChange({ ...data, futureHats: next });
  };

  const keepCount = decisions.filter((d) => d.decision === "keep").length;

  return (
    <StepShell step={5} total={5} kicker="Grow + Legacy — Future State"
      title="Design the finished business"
      subtitle="For every hat you wear today, decide its future. The goal: everything has an owner — and most of them aren't you.">
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Desired organization size (employees)">
          <TextInput value={data.desiredOrgSize} onChange={(e) => onChange({ ...data, desiredOrgSize: e.target.value })} placeholder="e.g. 12" />
        </Field>
        <Field label="Target timeline">
          <Select value={data.targetTimeline} onChange={(e) => onChange({ ...data, targetTimeline: e.target.value })}>
            <option>6 months</option>
            <option>12 months</option>
            <option>18 months</option>
            <option>24 months</option>
            <option>36 months</option>
          </Select>
        </Field>
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-900">Keep / Hire / Systematize</h2>
          <span className="rounded-full bg-ink-100 px-3 py-1 text-sm font-semibold text-ink-700">
            Keeping {keepCount} of {decisions.length}
          </span>
        </div>
        <div className="space-y-2">
          {decisions.map((d) => (
            <div key={d.functionName} className="flex items-center gap-3 rounded-lg border border-ink-200 bg-white px-4 py-3">
              <span className="flex-1 text-sm font-medium text-ink-800">{d.functionName}</span>
              <div className="flex gap-1.5">
                {(["keep", "hire", "systematize"] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setDecision(d.functionName, opt)}
                    title={DECISION_LABELS[opt]}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                      d.decision === opt
                        ? opt === "keep"
                          ? "bg-blueprint-600 text-white"
                          : opt === "hire"
                            ? "bg-emerald-700 text-white"
                            : "bg-ink-800 text-white"
                        : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                    }`}
                  >
                    {opt === "keep" ? "Keep" : opt === "hire" ? "Hire" : "System"}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between">
        <button onClick={onBack} className="rounded-lg border border-ink-300 px-6 py-3 font-semibold text-ink-700 hover:bg-ink-100">
          Back
        </button>
        <button
          onClick={() => {
            if (!data.futureHats.length) onChange({ ...data, futureHats: decisions });
            onBuild();
          }}
          disabled={building}
          className="rounded-lg bg-blueprint-600 px-8 py-4 text-lg font-semibold text-white hover:bg-blueprint-700 disabled:opacity-50"
        >
          {building ? "Building your blueprint…" : "Build My Blueprint →"}
        </button>
      </div>
      {building && (
        <p className="mt-4 text-center text-sm text-ink-500">
          Designing your organization, economics, and roadmap — this takes about 30–60 seconds.
        </p>
      )}
    </StepShell>
  );
}
