import { useState } from "react";
import type { CurrentStateData, HatEntry } from "../types";
import { getIndustry, DEFAULT_FUNCTIONS } from "../data/industries";
import { StepShell, Field, TextInput, TextArea, NavButtons } from "./ui";

let idCounter = 0;
const nid = () => `hat-${Date.now()}-${idCounter++}`;

export function defaultHats(industryId: string): HatEntry[] {
  const ind = getIndustry(industryId);
  const fns = ind.functions.length ? ind.functions : DEFAULT_FUNCTIONS;
  return fns.map((f) => ({ id: nid(), functionName: f, currentOwner: "Owner" }));
}

export default function CurrentState({ industryId, data, onChange, onBack, onNext }: {
  industryId: string; data: CurrentStateData; onChange: (d: CurrentStateData) => void;
  onBack: () => void; onNext: () => void;
}) {
  const [newFn, setNewFn] = useState("");
  const [newOwner, setNewOwner] = useState("");

  const ensureHats = (): HatEntry[] => {
    if (data.hats.length) return data.hats;
    return defaultHats(industryId);
  };

  const hats = ensureHats();

  const setHatOwner = (id: string, owner: string) =>
    onChange({ ...data, hats: hats.map((h) => (h.id === id ? { ...h, currentOwner: owner } : h)) });

  const removeHat = (id: string) =>
    onChange({ ...data, hats: hats.filter((h) => h.id !== id) });

  const addHat = () => {
    if (!newFn.trim()) return;
    onChange({ ...data, hats: [...hats, { id: nid(), functionName: newFn.trim(), currentOwner: newOwner.trim() || "Owner" }] });
    setNewFn("");
    setNewOwner("");
  };

  const ownerHatCount = hats.filter((h) => h.currentOwner.toLowerCase() === "owner").length;

  const ready = data.currentRevenue.trim() && hats.length > 0;

  return (
    <StepShell step={3} total={5} kicker="Truth — Current State"
      title="What are you actually doing today?"
      subtitle="The most revealing question in business: who does the work? Map every function — and be honest about how many hats say 'Owner'.">
      <div className="grid gap-6 md:grid-cols-3">
        <Field label="Current annual revenue">
          <TextInput value={data.currentRevenue} onChange={(e) => onChange({ ...data, currentRevenue: e.target.value })} placeholder="e.g. $1.2M" />
        </Field>
        <Field label="Current employees">
          <TextInput value={data.currentEmployees} onChange={(e) => onChange({ ...data, currentEmployees: e.target.value })} placeholder="e.g. 5" />
        </Field>
        <Field label="Your hours per week right now">
          <TextInput value={data.ownerHoursNow} onChange={(e) => onChange({ ...data, ownerHoursNow: e.target.value })} placeholder="e.g. 60" />
        </Field>
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-900">Owner Hat Map</h2>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${ownerHatCount >= 7 ? "bg-red-100 text-red-800" : ownerHatCount >= 4 ? "bg-blueprint-100 text-blueprint-800" : "bg-emerald-100 text-emerald-800"}`}>
            {ownerHatCount} hat{ownerHatCount === 1 ? "" : "s"} on the owner
          </span>
        </div>
        <p className="mb-4 text-sm text-ink-600">
          For each function, say who actually does it today. Use <strong>Owner</strong>, an employee&apos;s name,
          or <strong>Nobody</strong> if it isn&apos;t getting done.
        </p>
        <div className="overflow-hidden rounded-xl border border-ink-200">
          <table className="w-full bg-white text-sm">
            <thead>
              <tr className="bg-ink-100 text-left text-xs uppercase tracking-wider text-ink-600">
                <th className="px-4 py-3">Function</th>
                <th className="px-4 py-3">Who does it now</th>
                <th className="w-12 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {hats.map((h) => (
                <tr key={h.id} className="border-t border-ink-100">
                  <td className="px-4 py-2.5 font-medium text-ink-800">{h.functionName}</td>
                  <td className="px-4 py-2">
                    <input
                      value={h.currentOwner}
                      onChange={(e) => setHatOwner(h.id, e.target.value)}
                      className={`w-full rounded-md border px-3 py-1.5 ${
                        h.currentOwner.toLowerCase() === "owner"
                          ? "border-blueprint-500 bg-blueprint-50 font-semibold text-blueprint-800"
                          : "border-ink-200"
                      }`}
                      placeholder="Owner / name / Nobody"
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => removeHat(h.id)} className="text-sm font-semibold text-red-600 hover:text-red-800">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={newFn}
            onChange={(e) => setNewFn(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addHat()}
            placeholder="Add a function (e.g. Social media)"
            className="flex-1 rounded-lg border border-ink-300 px-4 py-2.5 text-sm focus:border-blueprint-600 focus:outline-none"
          />
          <input
            value={newOwner}
            onChange={(e) => setNewOwner(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addHat()}
            placeholder="Who does it"
            className="w-40 rounded-lg border border-ink-300 px-4 py-2.5 text-sm focus:border-blueprint-600 focus:outline-none"
          />
          <button onClick={addHat} className="rounded-lg bg-ink-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink-900">
            Add
          </button>
        </div>
      </div>

      <div className="mt-10">
        <Field label="What is the single biggest bottleneck in the business right now?">
          <TextArea value={data.bottleneck} onChange={(e) => onChange({ ...data, bottleneck: e.target.value })}
            placeholder="e.g. I can't get estimates out fast enough — everything waits on me, and jobs stall." />
        </Field>
      </div>

      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!ready} />
    </StepShell>
  );
}
