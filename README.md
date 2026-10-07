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

## Deploy to Vercel (4 steps)

1. **Import the repo** — In Vercel, "Add New Project" → import `powertiesbiz-ai/business-architect`. Framework preset: Vite. No build config changes needed.
2. **Add the environment variables** — In Project Settings → Environment Variables, add:
   - `GEMINI_API_KEY` = your Gemini API key
   - `VITE_GOOGLE_CLIENT_ID` = your Google OAuth client ID (see below; omit to run without Drive)
3. **Deploy** — Vercel builds automatically. The `/api/generate-blueprint` function deploys with it.

## Google Drive integration (premium tier)

Free users save/load snapshots as JSON files manually. Connected users auto-save every meeting snapshot to a **"Business Architect"** folder in their own Google Drive and load any past snapshot from a picker — the full meeting history.

The app uses client-side Google Identity Services with the least-privilege `drive.file` scope (it can only manage files it created). No tokens are stored — only the user's intent to stay connected.

### One-time Google Cloud setup (Keith does this)

1. **Google Cloud Console** (console.cloud.google.com) → create a project (or reuse the Total Health OS one) → **APIs & Services → Library** → enable **Google Drive API**.
2. **APIs & Services → OAuth consent screen** → User type: External → fill in app name/support email → add `.../auth/drive.file` as a scope → add yourself as a test user. (For public launch later, this needs Google verification — same process as Total Health OS.)
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID** → Application type: **Web application** → under **Authorized JavaScript origins**, add your Vercel URL (e.g. `https://business-architect.vercel.app`). No redirect URIs needed (token flow).
4. Copy the **Client ID** → Vercel → Project Settings → Environment Variables → add `VITE_GOOGLE_CLIENT_ID` → redeploy.

If `VITE_GOOGLE_CLIENT_ID` isn't set, the Connect button shows disabled with a tooltip instead of crashing — the app works fine in manual mode.

## Local development

```bash
npm install
# create .env with GEMINI_API_KEY=... for the API route (use `vercel dev` to run API routes locally)
npm run dev
```

> Note: `npm run dev` serves the frontend only. To test `/api/generate-blueprint` locally, use `vercel dev`.
