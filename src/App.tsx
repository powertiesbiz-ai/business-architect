import { useEffect, useState } from "react";
import Welcome from "./components/Welcome";
import IndustrySelect from "./components/IndustrySelect";
import VisionInterview from "./components/VisionInterview";
import CurrentState from "./components/CurrentState";
import FutureState from "./components/FutureState";
import ResultsDashboard from "./components/ResultsDashboard";
import { getIndustry } from "./data/industries";
import type { Blueprint, WizardData } from "./types";
import { emptyVision, emptyCurrentState, emptyFutureState } from "./types";

type Step = "welcome" | "industry" | "vision" | "current" | "future" | "results";

const STORAGE_KEY = "business-architect-wizard-v1";

function loadStored(): { data: WizardData; step: Step; blueprint: Blueprint | null } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const freshData = (): WizardData => ({
  industry: "",
  vision: emptyVision(),
  currentState: emptyCurrentState(),
  futureState: emptyFutureState(),
});

export default function App() {
  const [step, setStep] = useState<Step>("welcome");
  const [data, setData] = useState<WizardData>(freshData());
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restored] = useState(() => loadStored());

  // Restore previous session once
  useEffect(() => {
    if (restored) {
      setData(restored.data);
      setBlueprint(restored.blueprint);
      setStep(restored.blueprint ? "results" : restored.step !== "results" ? restored.step : "industry");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist wizard progress
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ data, step: step === "welcome" ? "industry" : step, blueprint }));
    } catch {
      /* storage full or unavailable — non-fatal */
    }
  }, [data, step, blueprint]);

  const buildBlueprint = async () => {
    setBuilding(true);
    setError(null);
    try {
      const ind = getIndustry(data.industry);
      const industryContext = [
        `Typical functions: ${ind.functions.join(", ")}`,
        ...ind.positions.map((p) => `- ${p.title} (reports to ${p.reportsTo || "n/a"}); KPIs: ${p.kpiHints.join(", ")}`),
      ].join("\n");

      const resp = await fetch("/api/generate-blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry: data.industry,
          industryLabel: ind.label,
          industryContext,
          vision: data.vision,
          currentState: {
            currentRevenue: data.currentState.currentRevenue,
            currentEmployees: data.currentState.currentEmployees,
            ownerHoursNow: data.currentState.ownerHoursNow,
            hats: data.currentState.hats.map((h) => ({ functionName: h.functionName, currentOwner: h.currentOwner })),
            bottleneck: data.currentState.bottleneck,
          },
          futureState: data.futureState,
        }),
      });

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        throw new Error(errBody.error || `Server error (${resp.status})`);
      }

      const result = (await resp.json()) as Blueprint;
      setBlueprint(result);
      setStep("results");
      window.scrollTo(0, 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBuilding(false);
    }
  };

  const restart = () => {
    setData(freshData());
    setBlueprint(null);
    setStep("welcome");
    setError(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
    window.scrollTo(0, 0);
  };

  const go = (s: Step) => {
    setStep(s);
    window.scrollTo(0, 0);
  };

  if (step === "welcome") return <Welcome onStart={() => go("industry")} />;

  if (step === "industry")
    return (
      <IndustrySelect
        value={data.industry}
        onChange={(industry) => setData({ ...data, industry })}
        onBack={() => go("welcome")}
        onNext={() => go("vision")}
      />
    );

  if (step === "vision")
    return (
      <VisionInterview
        data={data.vision}
        onChange={(vision) => setData({ ...data, vision })}
        onBack={() => go("industry")}
        onNext={() => go("current")}
      />
    );

  if (step === "current")
    return (
      <CurrentState
        industryId={data.industry}
        data={data.currentState}
        onChange={(currentState) => setData({ ...data, currentState })}
        onBack={() => go("vision")}
        onNext={() => go("future")}
      />
    );

  if (step === "future")
    return (
      <>
        <FutureState
          hats={data.currentState.hats}
          data={data.futureState}
          onChange={(futureState) => setData({ ...data, futureState })}
          onBack={() => go("current")}
          onBuild={buildBlueprint}
          building={building}
        />
        {error && (
          <div className="fixed bottom-6 left-1/2 w-[calc(100%-3rem)] max-w-xl -translate-x-1/2 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 shadow-lg">
            <p className="font-semibold">Couldn&apos;t build the blueprint</p>
            <p className="mt-1">{error}</p>
            <button onClick={() => setError(null)} className="mt-2 font-semibold underline">Dismiss</button>
          </div>
        )}
      </>
    );

  if (step === "results" && blueprint)
    return <ResultsDashboard blueprint={blueprint} onRestart={restart} />;

  return <Welcome onStart={() => go("industry")} />;
}
