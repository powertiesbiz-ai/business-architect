import { useState } from "react";
import type { Blueprint, PositionDetail } from "../types";
import { ScoreBar } from "./ui";
import OrgChart from "./OrgChart";
import { downloadBlueprintDocx } from "../lib/docx";

const money = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

function Section({ id, kicker, title, children }: { id: string; kicker: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-blueprint-600">{kicker}</p>
      <h2 className="mb-5 font-serif text-2xl font-bold text-ink-900">{title}</h2>
      {children}
    </section>
  );
}

function PositionCard({ p }: { p: PositionDetail }) {
  return (
    <div className="rounded-xl border border-ink-200 bg-ink-50 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-bold text-ink-900">{p.title}</h3>
        <span className="text-sm font-semibold text-blueprint-700">{money(p.totalAnnualCost)}/yr all-in</span>
      </div>
      <p className="mt-1 text-sm text-ink-500">Reports to {p.reportsTo} · Hire priority #{p.hirePriority}</p>
      <p className="mt-3 text-sm italic text-ink-700">{p.purpose}</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-ink-500">Responsibilities</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink-700">
            {p.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-ink-500">KPIs</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink-700">
            {p.kpis.map((k, i) => <li key={i}>{k}</li>)}
          </ul>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-ink-500">Annual cost breakdown</p>
          <table className="w-full text-sm">
            <tbody>
              {p.costBreakdown.map((c, i) => (
                <tr key={i} className="border-t border-ink-200">
                  <td className="py-1 text-ink-700">{c.item}</td>
                  <td className="py-1 text-right font-semibold text-ink-900">{money(c.annualCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-3">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-ink-500">Compensation</p>
            <p className="text-sm text-ink-700">{p.compensation}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-ink-500">Revenue responsibility</p>
            <p className="text-sm text-ink-700">{p.revenueResponsibility}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultsDashboard({ blueprint, onRestart }: {
  blueprint: Blueprint; onRestart: () => void;
}) {
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const bp = blueprint;
  const fm = bp.financialModel;
  const selectedDetail = selectedPosition
    ? bp.positions.find((p) => p.title === selectedPosition)
    : null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadBlueprintDocx(bp);
    } finally {
      setDownloading(false);
    }
  };

  const dep = bp.dependencyScore;

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Header */}
      <div className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blueprint-600">Business Blueprint</p>
            <h1 className="mt-1 font-serif text-3xl font-bold text-ink-900">{bp.businessName || "Your Business"}</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={onRestart} className="rounded-lg border border-ink-300 px-5 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-100">
              Start over
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="rounded-lg bg-blueprint-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blueprint-700 disabled:opacity-50"
            >
              {downloading ? "Preparing…" : "⬇ Download Blueprint (DOCX)"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        {/* Executive summary */}
        <Section id="summary" kicker="The Plan" title="Executive Summary">
          <p className="text-lg leading-relaxed text-ink-700">{bp.executiveSummary}</p>
        </Section>

        {/* Dependency score */}
        <Section id="dependency" kicker="Truth" title="Owner Dependency Score">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl bg-ink-900 p-6 text-center text-white">
              <p className="text-xs uppercase tracking-widest text-ink-300">Current</p>
              <p className="mt-1 font-serif text-6xl font-bold text-red-400">{dep.current}</p>
              <p className="mt-1 text-sm text-ink-300">out of 100</p>
            </div>
            <div className="rounded-xl bg-emerald-900 p-6 text-center text-white">
              <p className="text-xs uppercase tracking-widest text-ink-300">Target</p>
              <p className="mt-1 font-serif text-6xl font-bold text-emerald-300">{dep.target}</p>
              <p className="mt-1 text-sm text-ink-300">out of 100</p>
            </div>
          </div>
          <p className="mt-4 text-ink-700">{dep.explanation}</p>
        </Section>

        {/* Bottlenecks */}
        <Section id="bottlenecks" kicker="Truth" title="Bottleneck Analysis">
          <div className="space-y-4">
            {bp.bottlenecks.map((bn, i) => (
              <div key={i} className={`rounded-xl border-l-4 p-5 ${i === 0 ? "border-red-500 bg-red-50" : "border-ink-200 bg-ink-50"}`}>
                <div className="flex items-center gap-2">
                  {i === 0 && <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">#1 CONSTRAINT</span>}
                  <h3 className="font-bold text-ink-900">{bn.title}</h3>
                </div>
                <p className="mt-2 text-sm text-ink-700">{bn.description}</p>
                <p className="mt-2 text-sm"><span className="font-semibold text-ink-900">Impact:</span> <span className="text-ink-700">{bn.impact}</span></p>
                <p className="mt-1 text-sm"><span className="font-semibold text-blueprint-700">Recommended fix:</span> <span className="text-ink-700">{bn.recommendedFix}</span></p>
              </div>
            ))}
          </div>
        </Section>

        {/* Org chart */}
        <Section id="orgchart" kicker="Grow" title="Recommended Organization">
          <OrgChart positions={bp.orgChart} details={bp.positions} onSelect={setSelectedPosition} />
          {selectedDetail && (
            <div className="mt-6">
              <PositionCard p={selectedDetail} />
            </div>
          )}
        </Section>

        {/* All positions */}
        <Section id="positions" kicker="Grow" title="Position-by-Position">
          <div className="space-y-3">
            {bp.positions.map((p) => (
              <div key={p.title} className="overflow-hidden rounded-xl border border-ink-200">
                <button
                  onClick={() => setExpanded(expanded === p.title ? null : p.title)}
                  className="flex w-full items-center justify-between bg-white px-5 py-4 text-left hover:bg-ink-50"
                >
                  <div>
                    <span className="font-bold text-ink-900">{p.title}</span>
                    <span className="ml-3 text-sm text-ink-500">Priority #{p.hirePriority}</span>
                  </div>
                  <span className="text-sm font-semibold text-blueprint-700">{money(p.totalAnnualCost)}/yr</span>
                </button>
                {expanded === p.title && (
                  <div className="border-t border-ink-200 p-5"><PositionCard p={p} /></div>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* Financial model */}
        <Section id="financials" kicker="Grow" title="Financial Model">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink-500">Investment required</h3>
              <table className="w-full text-sm">
                <tbody>
                  {fm.investmentBreakdown.map((inv, i) => (
                    <tr key={i} className="border-t border-ink-200">
                      <td className="py-2 text-ink-700">{inv.category}</td>
                      <td className="py-2 text-right font-semibold">{money(inv.amount)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-ink-300">
                    <td className="py-2 font-bold">Total</td>
                    <td className="py-2 text-right font-bold text-blueprint-700">{money(fm.totalInvestment)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink-500">Payback</h3>
              <p className="font-serif text-5xl font-bold text-ink-900">{fm.paybackMonths}<span className="text-xl font-normal text-ink-500"> months</span></p>
              <p className="mt-3 text-sm text-ink-700">{fm.paybackExplanation}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink-500">Revenue targets</h3>
              <div className="space-y-2">
                {fm.revenueTargets.map((rt, i) => (
                  <div key={i} className="flex justify-between rounded-lg bg-ink-50 px-4 py-2.5 text-sm">
                    <span className="text-ink-600">{rt.timeframe}</span>
                    <span className="font-bold text-ink-900">{money(rt.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink-500">Profit projections</h3>
              <div className="space-y-2">
                {fm.profitProjections.map((pp, i) => (
                  <div key={i} className="rounded-lg bg-ink-50 px-4 py-2.5 text-sm">
                    <div className="flex justify-between">
                      <span className="font-semibold text-ink-800">{pp.year}</span>
                      <span className="font-bold text-emerald-700">{money(pp.profit)} <span className="font-normal text-ink-500">({pp.margin})</span></span>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-500">on {money(pp.revenue)} revenue</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Hiring sequence */}
        <Section id="hiring" kicker="Grow" title="Hiring Sequence">
          <p className="mb-5 text-sm text-ink-600">Hire in this order — each role unlocks the next bottleneck.</p>
          <div className="relative space-y-0">
            {[...bp.hiringSequence].sort((a, b) => a.order - b.order).map((h, i, arr) => (
              <div key={i} className="relative flex gap-4 pb-6">
                {i < arr.length - 1 && <div className="absolute left-[19px] top-10 h-full w-0.5 bg-ink-200" />}
                <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blueprint-600 font-bold text-white">
                  {h.order}
                </div>
                <div className="flex-1 rounded-xl border border-ink-200 bg-ink-50 p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-bold text-ink-900">{h.position}</h3>
                    <span className="text-xs font-semibold uppercase tracking-wider text-blueprint-700">{h.timing}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-ink-700"><span className="font-semibold">Why now:</span> {h.rationale}</p>
                  <p className="mt-1 text-sm text-ink-700"><span className="font-semibold">Expected impact:</span> {h.expectedImpact}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Implementation plan */}
        <Section id="roadmap" kicker="Legacy" title="Implementation Roadmap">
          <div className="space-y-4">
            {bp.implementationPlan.map((ph, i) => (
              <div key={i} className="rounded-xl border border-ink-200 p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-bold text-ink-900">{ph.phase}</h3>
                  <span className="rounded-full bg-blueprint-100 px-3 py-1 text-xs font-bold text-blueprint-800">{ph.timeframe}</span>
                </div>
                <p className="mt-1 text-sm italic text-ink-600">{ph.goal}</p>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ink-700">
                  {ph.actions.map((a, j) => <li key={j}>{a}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        {/* Owner future role */}
        <Section id="ownerrole" kicker="Legacy" title="What the Owner Does After">
          <div className="rounded-xl bg-ink-900 p-6 text-white md:p-8">
            <p className="text-xs uppercase tracking-widest text-ink-300">Your future role</p>
            <h3 className="mt-1 font-serif text-3xl font-bold">{bp.ownerFutureRole.title}</h3>
            <p className="mt-1 text-blueprint-200">{bp.ownerFutureRole.hoursPerWeek}</p>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-300">You focus on</p>
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink-100">
                  {bp.ownerFutureRole.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-red-300">You give up</p>
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink-100">
                  {bp.ownerFutureRole.giveUp.map((g, i) => <li key={i}>{g}</li>)}
                </ul>
              </div>
            </div>
            <p className="mt-6 border-t border-ink-700 pt-4 font-serif text-lg italic text-ink-100">
              {bp.ownerFutureRole.closingLine}
            </p>
          </div>
        </Section>

        {/* Completion scores */}
        <Section id="scores" kicker="Legacy" title="Business Completion Score">
          <div className="grid gap-5 md:grid-cols-2">
            {bp.completionScores.map((s, i) => <ScoreBar key={i} label={s.area} score={s.score} />)}
          </div>
          <div className="mt-6 rounded-xl bg-blueprint-50 p-5 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-blueprint-700">Overall business readiness</p>
            <p className="font-serif text-5xl font-bold text-blueprint-700">{bp.overallReadiness}%</p>
          </div>
        </Section>

        {/* Risks */}
        <Section id="risks" kicker="Truth" title="Risks & Assumptions">
          <div className="space-y-4">
            {bp.risks.map((r, i) => (
              <div key={i} className="rounded-xl border border-ink-200 bg-ink-50 p-4">
                <p className="font-semibold text-ink-900">⚠ {r.risk}</p>
                <p className="mt-1 text-sm text-ink-700"><span className="font-semibold">Mitigation:</span> {r.mitigation}</p>
              </div>
            ))}
          </div>
        </Section>

        <div className="pb-8 text-center">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="rounded-lg bg-blueprint-600 px-8 py-4 text-lg font-semibold text-white hover:bg-blueprint-700 disabled:opacity-50"
          >
            {downloading ? "Preparing…" : "⬇ Download Full Blueprint (DOCX)"}
          </button>
        </div>
      </div>
    </div>
  );
}
