# DesignSprint™ — Arabic UX Audit

> Automatically audit any website for Arabic RTL quality. Get a scored report across 8 categories with prioritised fix recommendations.

![Score](https://img.shields.io/badge/Score-100%20points-6366f1?style=flat-square)
![Stack](https://img.shields.io/badge/Stack-NestJS%20%2B%20Next.js-0ea5e9?style=flat-square)
![Language](https://img.shields.io/badge/Language-TypeScript-3178c6?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)

---

## What It Does

Arabic-speaking users abandon websites with broken RTL layouts, bad typography, BiDi bugs, and missing Arabic fonts. DesignSprint™ diagnoses these problems automatically using a real headless browser and generates actionable fix code.

**Enter a URL → Get a 100-point Arabic UX score in under 60 seconds.**

---

## 8 Audit Categories

| # | Category | Points | What It Checks |
|---|----------|--------|----------------|
| 1 | **HTML Direction** | 20 | `html[dir=rtl]` and `lang=ar` attributes |
| 2 | **CSS Logical Properties** | 20 | `margin-left` → `margin-inline-start`, physical vs logical |
| 3 | **Arabic Typography** | 15 | `letter-spacing: 0`, `line-height ≥ 1.6`, no underlines |
| 4 | **Layout Mirroring** | 15 | Nav order, sidebar position, icon `scaleX(-1)` |
| 5 | **Mobile RTL** | 15 | Flex/grid direction at 375×812 viewport |
| 6 | **BiDi Handling** | 10 | Mixed Arabic+Latin isolation, `<bdi>` tags, form inputs |
| 7 | **Text Overflow** | 5 | Clipped Arabic glyphs via `scrollWidth > clientWidth` |
| 8 | **Font Fallback** | — | Arabic-capable font in `font-family` stack |

**Score thresholds:** 0–39 Poor · 40–69 Needs Work · 70–89 Good · 90–100 Excellent

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Crawl Engine | Playwright (headless Chromium + Firefox + WebKit) |
| Backend API | NestJS 10 + TypeScript (strict mode) |
| Database | PostgreSQL 16 + Prisma ORM |
| Job Queue | BullMQ (Redis-backed) |
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Monorepo | Turborepo + pnpm workspaces |

---

## Project Structure

```
designsprint/
├── apps/
│   ├── api/                  # NestJS backend
│   │   ├── src/modules/
│   │   │   ├── audit/        # 8 check modules + scoring engine
│   │   │   ├── crawler/      # Playwright page renderer
│   │   │   └── scan/         # REST API + BullMQ job processor
│   │   └── prisma/           # Database schema + migrations
│   └── web/                  # Next.js frontend
│       └── src/app/
│           ├── page.tsx      # Landing page with mock preview
│           └── results/      # Scan results with freemium gate
├── packages/
│   ├── shared/               # TypeScript types + Arabic detection regex
│   └── audit-rules/          # icon-mirror-rules.json, arabic-fonts.json
└── docker-compose.yml        # PostgreSQL + Redis for local dev
```

---

## Getting Started

### Prerequisites
- Node.js 20 LTS
- pnpm 9+
- Docker Desktop (for PostgreSQL + Redis)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/zunaair/designsprint.git
cd designsprint

# 2. Install dependencies
pnpm install

# 3. Start PostgreSQL + Redis
docker compose up -d

# 4. Set up environment variables
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your DB credentials

# 5. Run database migrations
pnpm --filter api prisma migrate dev

# 6. Start all apps
pnpm dev
```

Open `http://localhost:3000` for the frontend and `http://localhost:3001` for the API.

---

## API Endpoints

```
POST /api/scans          Submit a URL for Arabic UX audit
GET  /api/scans/:id      Poll scan status and retrieve results
GET  /                   Health check
```

### Example

```bash
# Submit a scan
curl -X POST http://localhost:3001/api/scans \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "email": "you@example.com", "viewport": "both"}'

# Response
{ "id": "cmmxakgos0000a0fbbj2h2vot" }

# Poll for results
curl http://localhost:3001/api/scans/cmmxakgos0000a0fbbj2h2vot
```

---

## Pricing Model

| Tier | Price | What You Get |
|------|-------|-------------|
| **Free** | $0 | Score + issue count + severity breakdown. Email required. |
| **Starter** | $49 one-time | Full issue details, fix suggestions, PDF report, re-scan |
| **Pro** | $199/mo | Full-site crawl (100 pages), mobile + desktop, competitor comparison |
| **Enterprise** | Custom | Unlimited pages, API access, white-label, SSO, CI/CD integration |

---

## Target Market

- **Primary:** GCC region (Saudi Arabia, UAE, Qatar, Bahrain, Kuwait, Oman)
- **Buyers:** E-commerce, banks, government portals, SaaS platforms, agencies
- **Users:** Product managers, developers, UX designers, agency consultants

---

## Roadmap

| Phase | Timeline | Features |
|-------|----------|---------|
| **MVP** | Months 1–3 | Single-page scanner · Free + Starter tiers · EN/AR landing page |
| **Scale** | Months 4–8 | Pro tier · Full-site crawl · PDF reports · Fix Packs · Competitor comparison |
| **Enterprise** | Months 9–18 | API access · CI/CD plugins · AI fix descriptions · Hebrew/Urdu/Farsi |

---

## Built By

[Pixelette Technologies](https://pixelette.tech) — GCC-focused product studio.

*صُنع بعناية للويب العربي*
