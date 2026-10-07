import { useMemo, useState } from "react";
import type { OrgPosition, PositionDetail } from "../types";

function buildLevels(positions: OrgPosition[]): OrgPosition[][] {
  const byTitle = new Map(positions.map((p) => [p.title.toLowerCase(), p]));
  const childrenOf = new Map<string, OrgPosition[]>();
  const roots: OrgPosition[] = [];
  positions.forEach((p) => {
    const parent = (p.reportsTo || "").trim().toLowerCase();
    if (!parent || !byTitle.has(parent)) {
      roots.push(p);
    } else {
      const arr = childrenOf.get(parent) || [];
      arr.push(p);
      childrenOf.set(parent, arr);
    }
  });
  const levels: OrgPosition[][] = [];
  let current = roots.length ? roots : positions.slice(0, 1);
  const seen = new Set<string>();
  while (current.length && levels.length < 8) {
    levels.push(current);
    current.forEach((p) => seen.add(p.title.toLowerCase()));
    const next: OrgPosition[] = [];
    current.forEach((p) => {
      (childrenOf.get(p.title.toLowerCase()) || []).forEach((c) => {
        if (!seen.has(c.title.toLowerCase())) next.push(c);
      });
    });
    current = next;
  }
  return levels;
}

export default function OrgChart({ positions, details, onSelect }: {
  positions: OrgPosition[]; details: PositionDetail[]; onSelect: (title: string) => void;
}) {
  const levels = useMemo(() => buildLevels(positions), [positions]);
  const [selected, setSelected] = useState<string | null>(null);
  const detailByTitle = useMemo(
    () => new Map(details.map((d) => [d.title.toLowerCase(), d])),
    [details]
  );

  const pick = (title: string) => {
    setSelected(title);
    onSelect(title);
  };

  return (
    <div>
      <div className="org-scroll overflow-x-auto pb-4">
        <div className="min-w-[640px] space-y-6">
          {levels.map((level, li) => (
            <div key={li}>
              {li > 0 && (
                <div className="mb-2 flex justify-center">
                  <div className="h-6 w-px bg-ink-300" />
                </div>
              )}
              <div className="flex flex-wrap justify-center gap-3">
                {level.map((p) => {
                  const d = detailByTitle.get(p.title.toLowerCase());
                  const active = selected === p.title;
                  return (
                    <button
                      key={p.title}
                      onClick={() => pick(p.title)}
                      className={`w-44 rounded-xl border-2 p-3 text-left transition ${
                        active ? "border-blueprint-600 bg-blueprint-50 shadow-md" : "border-ink-200 bg-white hover:border-blueprint-500"
                      }`}
                    >
                      <p className="text-sm font-bold text-ink-900">{p.title}</p>
                      {p.reportsTo && <p className="mt-0.5 text-[11px] text-ink-500">→ {p.reportsTo}</p>}
                      {d && <p className="mt-1.5 text-[11px] font-semibold text-blueprint-700">{d.compensation.split(",")[0]}</p>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-1 text-center text-xs text-ink-500">Click any position for full details below.</p>
    </div>
  );
}
