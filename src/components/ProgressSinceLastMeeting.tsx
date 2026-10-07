import type { BlueprintDelta, ScoreDelta } from "../lib/snapshot";

function DeltaPill({ delta, invert = false }: { delta: number; invert?: boolean }) {
  if (!delta) return <span className="rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-bold text-ink-500">±0</span>;
  // invert: for metrics where DOWN is good (owner dependency, owner hours)
  const good = invert ? delta < 0 : delta > 0;
  const bad = invert ? delta > 0 : delta < 0;
  const cls = good
    ? "bg-emerald-100 text-emerald-800"
    : bad
      ? "bg-red-100 text-red-800"
      : "bg-ink-100 text-ink-500";
  const arrow = delta > 0 ? "▲" : "▼";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${cls}`}>
      {arrow} {Math.abs(delta)}
    </span>
  );
}

function MetricCard({
  label,
  prev,
  curr,
  sub,
}: {
  label: string;
  prev: string | number;
  curr: string | number;
  sub?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-ink-500">{label}</p>
      <p className="mt-2 text-sm text-ink-500">
        <span className="line-through decoration-ink-300">{prev}</span>
        <span className="mx-2 text-ink-300">→</span>
        <span className="text-xl font-bold text-ink-900">{curr}</span>
      </p>
      {sub && <div className="mt-2">{sub}</div>}
    </div>
  );
}

function ScoreRow({ s }: { s: ScoreDelta }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-white px-4 py-2.5 text-sm">
      <span className="font-medium text-ink-800">{s.area}</span>
      <span className="flex items-center gap-2">
        <span className="text-ink-400">{s.prev}%</span>
        <span className="text-ink-300">→</span>
        <span className="font-bold text-ink-900">{s.curr}%</span>
        <DeltaPill delta={s.delta} />
      </span>
    </div>
  );
}

export default function ProgressSinceLastMeeting({ delta }: { delta: BlueprintDelta }) {
  const depImproved = delta.dependency.delta > 0;
  const depWorsened = delta.dependency.delta < 0;

  const bottleneckBadge =
    delta.bottleneckStatus === "same" ? (
      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
        ⚠ STILL THE CONSTRAINT
      </span>
    ) : delta.bottleneckStatus === "still-present" ? (
      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
        ⚠ STILL ON THE LIST
      </span>
    ) : (
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
        ✓ PREVIOUS BOTTLENECK CLEARED
      </span>
    );

  const hiredCount = delta.hiringProgress.filter((h) => h.status === "hired").length;

  return (
    <section className="rounded-2xl border-2 border-blueprint-300 bg-blueprint-50 p-6 md:p-8">
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-blueprint-600">
        Meeting to meeting
      </p>
      <h2 className="font-serif text-2xl font-bold text-ink-900">Progress Since Last Meeting</h2>
      <p className="mt-1 text-sm text-ink-600">
        Compared against the {delta.prevDate} snapshot. Hiring status is inferred from the hat map —
        confirm with the owner.
      </p>

      {/* Metric deltas */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Owner dependency"
          prev={`${delta.dependency.prev}/100`}
          curr={`${delta.dependency.curr}/100`}
          sub={
            <span className="text-xs font-semibold">
              {depImproved && <span className="text-emerald-700">▼ {delta.dependency.delta} — owner is less load-bearing</span>}
              {depWorsened && <span className="text-red-700">▲ {Math.abs(delta.dependency.delta)} — dependency grew</span>}
              {!depImproved && !depWorsened && <span className="text-ink-500">No change</span>}
            </span>
          }
        />
        <MetricCard
          label="Overall readiness"
          prev={`${delta.overallReadiness.prev}%`}
          curr={`${delta.overallReadiness.curr}%`}
          sub={<DeltaPill delta={delta.overallReadiness.delta} />}
        />
        <MetricCard
          label="Revenue"
          prev={delta.revenue.prev}
          curr={delta.revenue.curr}
          sub={
            delta.revenue.direction ? (
              <span className={`text-xs font-bold ${delta.revenue.direction === "up" ? "text-emerald-700" : "text-red-700"}`}>
                {delta.revenue.direction === "up" ? "▲ growing" : "▼ declined"}
              </span>
            ) : undefined
          }
        />
        <MetricCard label="Employees" prev={delta.employees.prev} curr={delta.employees.curr} />
        <MetricCard
          label="Owner hours / week"
          prev={delta.ownerHours.prev}
          curr={delta.ownerHours.curr}
          sub={
            delta.ownerHours.direction ? (
              <span className={`text-xs font-bold ${delta.ownerHours.direction === "down" ? "text-emerald-700" : "text-red-700"}`}>
                {delta.ownerHours.direction === "down" ? "▼ owner freed up" : "▲ owner working more"}
              </span>
            ) : undefined
          }
        />
        <MetricCard
          label="Positions added to org"
          prev="—"
          curr={delta.newPositions.length > 0 ? `${delta.newPositions.length}` : "0"}
          sub={
            delta.newPositions.length > 0 ? (
              <span className="text-xs text-ink-600">{delta.newPositions.join(", ")}</span>
            ) : (
              <span className="text-xs text-ink-500">Org structure unchanged</span>
            )
          }
        />
      </div>

      {/* Bottleneck status */}
      <div className="mt-6 rounded-xl border border-ink-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-ink-900">Bottleneck status</h3>
          {bottleneckBadge}
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg bg-ink-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-500">Last meeting&apos;s #1</p>
            <p className="mt-1 text-sm font-semibold text-ink-800">{delta.prevBottleneck || "—"}</p>
          </div>
          <div className="rounded-lg bg-ink-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-500">Now the #1 constraint</p>
            <p className="mt-1 text-sm font-semibold text-ink-800">{delta.currBottleneck || "—"}</p>
          </div>
        </div>
      </div>

      {/* Hiring progress */}
      {delta.hiringProgress.length > 0 && (
        <div className="mt-6 rounded-xl border border-ink-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-ink-900">Hiring progress</h3>
            <span className="text-xs font-semibold text-ink-500">
              {hiredCount} of {delta.hiringProgress.length} filled (inferred)
            </span>
          </div>
          <ul className="mt-3 space-y-2">
            {delta.hiringProgress.map((h, i) => (
              <li key={i} className="flex items-center justify-between gap-3 rounded-lg bg-ink-50 px-4 py-2.5 text-sm">
                <span>
                  <span className="font-semibold text-ink-900">{h.position}</span>
                  <span className="ml-2 text-xs uppercase tracking-wider text-ink-500">{h.timing}</span>
                </span>
                {h.status === "hired" ? (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">✓ HIRED</span>
                ) : (
                  <span className="rounded-full bg-ink-200 px-2.5 py-0.5 text-xs font-bold text-ink-600">○ PENDING</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Completion scores */}
      <div className="mt-6">
        <h3 className="mb-3 font-bold text-ink-900">Completion scores by area</h3>
        <div className="space-y-2">
          {delta.completionScores.map((s) => <ScoreRow key={s.area} s={s} />)}
        </div>
      </div>
    </section>
  );
}
