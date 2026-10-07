import { INDUSTRIES } from "../data/industries";
import { StepShell, NavButtons } from "./ui";

export default function IndustrySelect({ value, onChange, onBack, onNext }: {
  value: string; onChange: (id: string) => void; onBack: () => void; onNext: () => void;
}) {
  return (
    <StepShell step={1} total={5} kicker="Blueprint Setup" title="What kind of business is this?"
      subtitle="Pick the closest match. This loads the right organizational template — everything adapts to your answers.">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {INDUSTRIES.map((ind) => (
          <button
            key={ind.id}
            onClick={() => onChange(ind.id)}
            className={`rounded-xl border-2 p-4 text-left transition ${
              value === ind.id
                ? "border-blueprint-600 bg-blueprint-50"
                : "border-ink-200 bg-white hover:border-ink-300"
            }`}
          >
            <span className={`block text-sm font-semibold ${value === ind.id ? "text-blueprint-700" : "text-ink-800"}`}>
              {ind.label}
            </span>
            <span className="mt-1 block text-xs text-ink-500">{ind.positions.length} typical roles</span>
          </button>
        ))}
      </div>
      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!value} />
    </StepShell>
  );
}
