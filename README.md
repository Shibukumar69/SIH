# 🌉 SamadhanSetu · समाधान सेतु

**A digital platform to crowdsource societal challenges and solve them together — citizens, government, universities and industry.**

Built for **Smart India Hackathon · Problem Statement 26043**
*Government of Jharkhand · Department of Higher & Technical Education*

> From a citizen's problem → to a verified challenge → to a university + industry collaboration → to a piloted, real-world solution. **This is the "beyond 311" story**: not just grievance redressal, but structured challenge discovery, stakeholder matching, collaborative solving, and impact tracking.

---

## ✨ What makes it win

A **rural-first** design — every feature assumes a citizen with low digital literacy and a weak internet connection can report a problem in **under one minute**.

| # | Feature | Where |
|---|---------|-------|
| 1 | **One-tap Report Problem** — 4 simple steps (category → photo → location → describe) | `ReportProblem.jsx` |
| 2 | **Complete Hindi + English** — a *real* language mode; nav, buttons, forms, statuses, dashboards all switch | `i18n/` |
| 3 | **Voice-to-text** reporting (Hindi & English, Web Speech API) | `ReportProblem.jsx` |
| 4 | **Flexible location** — GPS, search, map pin, or manual village/block/district | `LocationPicker` |
| 5 | **Save & Submit Later** — local-first store + offline outbox; partial forms never lost | `lib/api.js` |
| 6 | **Camera + Gallery** photo upload, client-side compressed | `lib/image.js` |
| 7 | **"I'm facing this too"** voting — surfaces how many citizens are affected | `VoteButton.jsx` |
| 8 | **Transparent status timeline** — 8 stages, simple IDs like `#SS-20100` | `StatusTimeline.jsx` |
| 9 | **University dashboard** — expertise-match %, form team, propose solution | `UniversityDashboard.jsx` |
| 10 | **Industry dashboard** — offer tech / mentorship / equipment / funding | `IndustryDashboard.jsx` |
| 11 | **Government dashboard** — KPIs, verify queue, priority, analytics | `GovernmentDashboard.jsx` |
| 12 | **Challenge map** — stylized Jharkhand map with district clusters | `JharkhandMap.jsx` |
| 13 | **Satisfaction + Reopen** after resolution | `ReportDetail.jsx` |

**On-device AI** keyword classifier auto-detects the category as the citizen types (offline, zero-cost, pluggable for a real ML/LLM model later).

---

## 🧱 Tech stack

- **Frontend:** React 18 · Vite 5 · TailwindCSS 3 · React Router 6 (no heavy chart/map libs — custom SVG keeps the bundle light for rural devices: **~91 KB gzipped**)
- **Backend:** Node · Express 4 · MongoDB (Mongoose 8) · JWT
- **Offline-first data layer:** every read/write hits an on-device store first, then syncs to the API when reachable. The app is **fully usable with no backend and no internet** — which also makes the live demo bulletproof.

---

## 🚀 Run it locally

### Prerequisites
- **Node.js** 18+ ([nodejs.org](https://nodejs.org))
- **MongoDB** — either a local `mongod` on `127.0.0.1:27017`, or a free **MongoDB Atlas** cluster URL.
  *(The backend is optional for a demo — see "Offline / demo mode" below.)*

### 1 — Backend API

```bash
cd server
cp .env.example .env          # then edit .env if using Atlas
npm install
npm run seed                  # load 22 demo challenges into MongoDB
npm run dev                   # API on http://localhost:4000
```

Set your MongoDB connection in `server/.env`:

```
MONGODB_URI=mongodb://127.0.0.1:27017/samadhansetu
# or Atlas:
# MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/samadhansetu
```

Health check: <http://localhost:4000/api/health> → `{ "ok": true, "db": true }`

### 2 — Frontend

```bash
cd client
npm install
npm run dev                   # app on http://localhost:5173
```

Open **<http://localhost:5173>**. The Vite dev server proxies `/api` → `http://localhost:4000`.

---

## 🎭 Demo credentials

Institutional dashboards use one-click demo sign-in — just pick a role on the **Sign In** page:

| Role | Signs in as |
|------|-------------|
| 🏛️ Government | Dept. of Higher & Technical Education, Jharkhand |
| 🎓 University | BIT Mesra |
| 🏭 Industry | Tata Steel Foundation |

*Citizens do **not** need to sign in to report or track problems.*

---

## 📶 Offline / demo mode

If MongoDB isn't running, the API still boots and returns `db: false`; the frontend detects this and transparently falls back to its **local-first store** (seeded with the same 22 demo challenges). You can also demo weak-network behaviour on stage with the floating **network toggle** (bottom-right) — report a problem while "offline" and watch it queue, then auto-sync when you flip back online.

---

## 🗂️ Project structure

```
SIH/
├── client/                       # React + Vite + Tailwind frontend
│   ├── src/
│   │   ├── pages/                # Home, ReportProblem, TrackReports, Nearby,
│   │   │                         # Challenges, ReportDetail, Login, + 3 dashboards
│   │   ├── components/           # Layout, Header, BottomNav, Charts, JharkhandMap, …
│   │   ├── context/              # Language, Network, Auth, Toast providers
│   │   ├── data/                 # categories, districts, demo seed
│   │   ├── i18n/                 # en.js + hi.js dictionaries + resolver
│   │   └── lib/                  # api (local-first), classify, geo, image, status
│   └── public/                   # logo.svg, manifest.json
└── server/                       # Express + MongoDB API
    └── src/
        ├── models/Report.js
        ├── routes/               # reports (+ stats), auth
        ├── lib/                  # seedData, stats, status (mirror the client)
        ├── db.js                 # connect + auto-seed (non-fatal)
        ├── index.js              # app entry
        └── seed.js               # `npm run seed`
```

## 🔌 API reference

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/api/health` | Liveness + DB status |
| `GET` | `/api/reports?category=&district=&status=&sort=top\|new` | List challenges |
| `GET` | `/api/reports/:id` | One challenge |
| `POST` | `/api/reports` | Create (idempotent — safe for offline replay) |
| `POST` | `/api/reports/:id/vote` | "I'm facing this too" |
| `PATCH` | `/api/reports/:id` | Update status / priority / partner assignment |
| `GET` | `/api/stats` | Aggregate KPIs for dashboards |
| `POST` | `/api/auth/login` | Role-based demo sign-in (returns JWT) |

---

*A citizen-first initiative aligned with NEP 2020.*
