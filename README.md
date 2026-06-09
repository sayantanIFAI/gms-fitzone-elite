# FitZone Elite — AI Gym Management Platform

A full-stack Gym Management Software (GMS) demo platform built for EU/UK markets. No authentication — just pick a persona and explore.

## Live Demo Personas

| Persona | Role | What they see |
|---|---|---|
| **Jim Fletcher** | Member | Attendance chart, cardio vitals, personal records, class booking, AI coach |
| **Susan Clarke** | Member | Wellness service booking (massage, physio, hydrotherapy) |
| **Akalla Mensah** | Trainer | Weekly class attendance chart, at-risk member churn table, AI retention insights |
| **David Park** | Admin | Machine health dashboard, DD defaulter list (BACS/SEPA codes), lock/unlock access |

## Architecture

```
GMS/
├── data-server/   Port 3001 — Express + node:sqlite  (data collection & REST API)
├── ai-server/     Port 3002 — Express + Anthropic SDK (AI analysis & rule-based fallback)
└── frontend/      Port 5173 — React 18 + Vite 4 + Tailwind CSS
```

## Prerequisites

- **Node.js v22+** (uses the built-in `node:sqlite` — no native compilation needed)
- **Optional:** `ANTHROPIC_API_KEY` env var for live Claude AI insights (falls back to rule-based analysis without it)

## Quick Start

### Option A — One-click (Windows)
```
double-click start-all.bat
```
Opens three terminal windows and launches the browser automatically.

### Option B — Manual (any OS)

**Terminal 1 — Data Server**
```bash
cd data-server
npm install
node server.js
# Listening on http://localhost:3001
```

**Terminal 2 — AI Server**
```bash
cd ai-server
npm install
node server.js
# Listening on http://localhost:3002
```

**Terminal 3 — Frontend**
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

> The database (`gms.db`) is created and seeded automatically on first run. No setup needed.

## AI Server — Claude Integration (Optional)

The AI server works in two modes:

- **Rule-based mode** (default): Generates structured insights from data patterns. No API key needed.
- **Claude mode**: Set `ANTHROPIC_API_KEY` for richer, conversational AI insights via `claude-sonnet-4-6`.

```bash
# AI server with Claude enabled
ANTHROPIC_API_KEY=sk-ant-... node server.js
```

## API Reference

### Data Server (port 3001)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/members` | All members |
| GET | `/api/members/stats` | Active/total count |
| GET | `/api/attendance/weekly?memberId=X` | Weekly attendance for member |
| GET | `/api/attendance/stats?memberId=X` | Attendance summary |
| POST | `/api/attendance/checkin` | Record gym visit |
| GET | `/api/classes` | All classes (filter by `?trainerId=X`) |
| GET | `/api/classes/trainer-attendance?trainerId=X` | Weekly per-class breakdown |
| GET | `/api/machines` | All machines with status |
| GET | `/api/machines/stats` | Uptime % |
| PATCH | `/api/machines/:id/status` | Update machine status |
| GET | `/api/payments/defaulters` | DD failure list |
| GET | `/api/vitals/:memberId` | Cardio/HR history |
| GET | `/api/personal-records/:memberId` | PR history |
| GET | `/api/services` | Wellness services |
| POST | `/api/services/book` | Book a service |

### AI Server (port 3002)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/churn?trainerId=X` | At-risk members with churn scores |
| GET | `/api/machine-health` | Equipment alerts + AI insight |
| GET | `/api/recommendations/:memberId` | Personalised coaching message |
| GET | `/api/insights/gym` | Admin KPI overview + flags |

## Seeded Demo Data

- **11 members** including the 4 demo personas
- **36 attendance records** for Jim with a deliberate dropoff (churn score: 90%)
- **12 machines** — 9 operational, 2 fault (Treadmill 02 E-05, Cable Machine M-12), 1 maintenance
- **3 DD defaulters** — Mark (ADDACS ×2), Emma (ARUCS ×1), Tom (MS03 ×3, access locked)
- **5 wellness services** — Swedish Massage £65, Deep Tissue £75, Sports Massage £55, Physio £80, Hydrotherapy £45

## Tech Stack

| Layer | Tech |
|---|---|
| Database | SQLite via `node:sqlite` (Node 22 built-in — no native compilation) |
| Backend | Express.js, CORS, uuid |
| AI | `@anthropic-ai/sdk` (claude-sonnet-4-6) with rule-based fallback |
| Frontend | React 18, Vite 4, Tailwind CSS 3, React Router v6 |
| Charts | Recharts |
| Icons | Lucide React |
| Dates | date-fns |

## Notes

- **Windows users:** If Vite fails with a Rollup native binary error (Windows Defender false positive), the project already pins Rollup to v3 via `package.json` overrides — `npm install` in the `frontend/` folder will resolve it cleanly.
- The database file is excluded from git (`.gitignore`). It is auto-created with full seed data on first `node server.js`.
