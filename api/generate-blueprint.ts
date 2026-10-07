import type { VercelRequest, VercelResponse } from "@vercel/node";

const MODEL = "gemini-2.0-flash";

interface BlueprintRequest {
  industry: string;
  industryLabel: string;
  industryContext: string;
  vision: Record<string, string>;
  currentState: {
    currentRevenue: string;
    currentEmployees: string;
    ownerHoursNow: string;
    hats: { functionName: string; currentOwner: string }[];
    bottleneck: string;
  };
  futureState: {
    desiredOrgSize: string;
    targetTimeline: string;
    futureHats: { functionName: string; decision: string }[];
  };
}

function buildPrompt(b: BlueprintRequest): string {
  const hats = b.currentState.hats
    .map((h) => `- ${h.functionName}: currently done by ${h.currentOwner}`)
    .join("\n");
  const futureHats = b.futureState.futureHats
    .map((h) => `- ${h.functionName}: owner wants to ${h.decision}`)
    .join("\n");

  return `You are a business architecture consultant. Design a complete business blueprint that takes this owner from "the owner IS the business" to "the business is a functioning organization."

INDUSTRY: ${b.industryLabel}
INDUSTRY CONTEXT (typical functions/positions/KPIs — use as guidance, adapt to this business):
${b.industryContext}

FOUNDER VISION:
- Business name: ${b.vision.businessName || "Not provided"}
- Kind of company they want: ${b.vision.companyKind}
- Why the company exists: ${b.vision.whyExists}
- Target revenue: ${b.vision.targetRevenue}
- Target profit: ${b.vision.targetProfit}
- Target employees: ${b.vision.targetEmployees}
- Hours/week the owner wants to work: ${b.vision.ownerHours}
- Desired owner role: ${b.vision.ownerRole}
- Things they never want to do again: ${b.vision.neverAgain}
- What they enjoy and excel at: ${b.vision.enjoyExcel}
- Want to sell eventually: ${b.vision.sellEventually}
- 5-year vision: ${b.vision.fiveYearVision}

CURRENT STATE (TRUTH):
- Current revenue: ${b.currentState.currentRevenue}
- Current employees: ${b.currentState.currentEmployees}
- Owner hours/week now: ${b.currentState.ownerHoursNow}
- Hat map (who does what today):
${hats}
- Biggest bottleneck: ${b.currentState.bottleneck}

FUTURE STATE (GROW + LEGACY):
- Desired org size: ${b.futureState.desiredOrgSize}
- Target timeline: ${b.futureState.targetTimeline}
- Per-function owner intent:
${futureHats}

Return ONLY valid JSON (no markdown fences, no commentary) matching this exact schema:
{
  "businessName": string,
  "executiveSummary": string (3-5 sentences),
  "dependencyScore": { "current": number 0-100, "target": number 0-100, "explanation": string },
  "bottlenecks": [ { "title": string, "description": string, "impact": string, "recommendedFix": string } ] (2-4 items, first = the #1 constraint),
  "orgChart": [ { "title": string, "reportsTo": string } ] (reportsTo = "" for the top role; 6-14 positions),
  "positions": [ {
    "title": string, "reportsTo": string, "purpose": string (1 sentence),
    "responsibilities": string[] (5-9), "compensation": string (e.g. "$65k base + bonus, OTE $80k"),
    "costBreakdown": [ { "item": string, "annualCost": number } ] (salary, taxes ~10%, benefits, tools, recruiting, training),
    "totalAnnualCost": number, "kpis": string[] (3-6), "revenueResponsibility": string, "hirePriority": number
  } ] (one entry per orgChart position except the owner),
  "financialModel": {
    "investmentBreakdown": [ { "category": string, "amount": number } ],
    "totalInvestment": number,
    "revenueTargets": [ { "timeframe": string, "revenue": number } ] (12mo, 24mo, 36mo),
    "profitProjections": [ { "year": string, "revenue": number, "profit": number, "margin": string } ] (Year 1-3),
    "paybackMonths": number, "paybackExplanation": string
  },
  "hiringSequence": [ { "order": number, "position": string, "timing": string, "rationale": string, "expectedImpact": string } ],
  "implementationPlan": [ { "phase": string, "timeframe": string, "goal": string, "actions": string[] (4-7) } ] (5 phases: Stabilize, Delegate, Build Management, Owner Exit, Owner as CEO),
  "ownerFutureRole": { "title": string, "hoursPerWeek": string, "responsibilities": string[] (4-6), "giveUp": string[] (5-8), "closingLine": string },
  "completionScores": [ { "area": string, "score": number } ] (areas: Leadership, Sales, Marketing, Operations, Finance, People, Systems, Owner Independence),
  "overallReadiness": number 0-100,
  "risks": [ { "risk": string, "mitigation": string } ] (3-5)
}

Be specific and realistic: use real dollar figures, real timelines, real position titles for the industry. The owner dependency score should reflect how many hats the owner currently wears. The hiring sequence must be ordered by what unlocks the next bottleneck. The financial model must be internally consistent (investment -> capacity -> revenue -> profit).`;
}

function extractJson(text: string): string {
  // Strip markdown fences if the model added them anyway
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
  }
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) t = t.slice(start, end + 1);
  return t;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
  }

  const body = req.body as BlueprintRequest;
  if (!body || !body.industry) {
    return res.status(400).json({ error: "Missing blueprint input." });
  }

  const prompt = buildPrompt(body);

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 12000 },
        }),
      }
    );

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Gemini error:", resp.status, errText.slice(0, 500));
      return res.status(502).json({ error: "AI service returned an error. Please try again." });
    }

    const data = await resp.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "";

    if (!text) {
      return res.status(502).json({ error: "AI service returned an empty response. Please try again." });
    }

    let blueprint: unknown;
    try {
      blueprint = JSON.parse(extractJson(text));
    } catch {
      console.error("JSON parse failed. Raw head:", text.slice(0, 500));
      return res.status(502).json({ error: "AI response was not valid. Please try again." });
    }

    return res.status(200).json(blueprint);
  } catch (e) {
    console.error("Blueprint generation failed:", e);
    return res.status(500).json({ error: "Something went wrong generating your blueprint. Please try again." });
  }
}
