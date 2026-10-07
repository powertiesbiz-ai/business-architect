# Business Architect

**Build the Business You Actually Want** — a Business Architecture & Transformation Engine that takes a business owner from "the owner *is* the business" to "the business is a functioning organization."

Built around three pillars:

- **TRUTH** — honest current-state diagnosis: founder vision interview, hat mapping (who really does what), bottleneck analysis, owner dependency score.
- **GROW** — future-state design: recommended org structure with clickable org chart, position-by-position economics, financial model, hiring sequence.
- **LEGACY** — owner independence: implementation roadmap, "what the owner does after," business completion scores, and a downloadable DOCX blueprint.

## How it works

1. **Welcome** — the Truth. Grow. Legacy. framing
2. **Industry selection** — 16 industry templates (trades, services, retail, etc.)
3. **Founder Vision Interview** — what the owner wants to build
4. **Current State** — revenue, team, and the interactive Hat Map
5. **Future State** — keep / hire / systematize decisions per function
6. **Build My Blueprint** — Gemini generates the full structured blueprint
7. **Results dashboard** — dependency score, bottlenecks, org chart, positions, financials, hiring sequence, 30/60/90/180/365 roadmap, completion scores, DOCX download

## Tech

- Vite + React + TypeScript + Tailwind CSS
- Vercel serverless function at `/api/generate-blueprint.ts` (Gemini, server-side)
- Client-side DOCX export via the `docx` library
- No database, no auth — all user input stays in the browser (`localStorage`)

## Deploy to Vercel (3 steps)

1. **Import the repo** — In Vercel, "Add New Project" → import `powertiesbiz-ai/business-architect`. Framework preset: Vite. No build config changes needed.
2. **Add the environment variable** — In Project Settings → Environment Variables, add:
   - `GEMINI_API_KEY` = your Gemini API key
3. **Deploy** — Vercel builds automatically. The `/api/generate-blueprint` function deploys with it.

## Local development

```bash
npm install
# create .env with GEMINI_API_KEY=... for the API route (use `vercel dev` to run API routes locally)
npm run dev
```

> Note: `npm run dev` serves the frontend only. To test `/api/generate-blueprint` locally, use `vercel dev`.
