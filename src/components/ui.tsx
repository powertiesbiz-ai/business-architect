import type { ReactNode } from "react";

export function StepShell({ step, total, kicker, title, subtitle, children }: {
  step: number; total: number; kicker: string; title: string; subtitle?: string; children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ink-50">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-ink-500">
          <span className="text-blueprint-600">{kicker}</span>
          <span>Step {step} of {total}</span>
        </div>
        <div className="mb-8 h-1.5 overflow-hidden rounded-full bg-ink-200">
          <div className="h-full rounded-full bg-blueprint-600 transition-all" style={{ width: `${(step / total) * 100}%` }} />
        </div>
        <h1 className="font-serif text-3xl font-bold text-ink-900 md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-3 text-lg text-ink-600">{subtitle}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink-800">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-500">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-ink-300 bg-white px-4 py-2.5 text-ink-900 placeholder:text-ink-300 focus:border-blueprint-600 focus:outline-none focus:ring-2 focus:ring-blueprint-100";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputCls} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} min-h-[110px] resize-y`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={inputCls} />;
}

export function NavButtons({ onBack, onNext, nextLabel = "Continue", nextDisabled = false }: {
  onBack?: () => void; onNext: () => void; nextLabel?: string; nextDisabled?: boolean;
}) {
  return (
    <div className="mt-10 flex items-center justify-between">
      {onBack ? (
        <button onClick={onBack} className="rounded-lg border border-ink-300 px-6 py-3 font-semibold text-ink-700 hover:bg-ink-100">
          Back
        </button>
      ) : <span />}
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className="rounded-lg bg-blueprint-600 px-8 py-3 font-semibold text-white hover:bg-blueprint-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {nextLabel}
      </button>
    </div>
  );
}

export function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 70 ? "bg-emerald-600" : score >= 40 ? "bg-blueprint-500" : "bg-red-500";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-ink-700">{label}</span>
        <span className="font-bold text-ink-900">{score}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink-200">
        <div className={`${color} h-full rounded-full`} style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
      </div>
    </div>
  );
}
