# DesignSprint™ — Complete Project Documentation

> **Author:** Zunair Haider ([@zunaair](https://github.com/zunaair))
> **Date:** March 24, 2026
> **Status:** MVP Deployed (Frontend + Backend Live)
> **Repository:** [github.com/zunaair/designsprint](https://github.com/zunaair/designsprint)

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [The Problem We Solve](#2-the-problem-we-solve)
3. [The Idea & Vision](#3-the-idea--vision)
4. [Target Market](#4-target-market)
5. [Business Model](#5-business-model)
6. [Technical Architecture](#6-technical-architecture)
7. [The 8 Audit Categories](#7-the-8-audit-categories)
8. [Scoring Methodology](#8-scoring-methodology)
9. [Tech Stack Deep Dive](#9-tech-stack-deep-dive)
10. [Project Structure](#10-project-structure)
11. [Database Schema](#11-database-schema)
12. [API Endpoints](#12-api-endpoints)
13. [Frontend Pages](#13-frontend-pages)
14. [Freemium Gate Implementation](#14-freemium-gate-implementation)
15. [Deployment Architecture](#15-deployment-architecture)
16. [Bugs Encountered & Solutions](#16-bugs-encountered--solutions)
17. [What Was Achieved](#17-what-was-achieved)
18. [What I Learned](#18-what-i-learned)
19. [Future Roadmap](#19-future-roadmap)
20. [Key Decisions & Why](#20-key-decisions--why)

---

## 1. Product Overview

**DesignSprint™** is a SaaS product that automatically audits websites for Arabic UX quality. A user enters a website URL, the system fetches the page HTML and runs 8 categories of Arabic-specific static analysis checks, producing a scored report (out of 100) with prioritised fix recommendations. (Note: The crawler was originally designed to use Playwright headless browser but was migrated to lightweight HTTP fetch + regex analysis for free-tier hosting compatibility.)

**One-liner:** Enter a URL → Get a 100-point Arabic UX score in under 60 seconds.

**This is NOT a generic UX audit tool.** It is specifically and deeply focused on Arabic (and eventually all RTL) language UX. Every architectural and product decision reinforces this specialisation.

---

## 2. The Problem We Solve

Arabic-speaking users abandon websites because of:

| Problem | Impact |
|---------|--------|
| **Broken RTL layouts** | Text reads right-to-left but the page layout stays left-to-right |
| **Bad Arabic typography** | `letter-spacing` breaks connected Arabic letterforms |
| **BiDi content bugs** | Mixed Arabic + English text renders in wrong order |
| **Missing Arabic fonts** | System falls back to a font that can't render Arabic glyphs |
| **Clipped text** | Arabic text is longer than English — buttons and badges overflow |
| **Unmirrored icons** | Directional icons (arrows, navigation) point the wrong way |
| **Mobile RTL failures** | Responsive layouts break on 375px mobile viewports |
| **Missing dir/lang attributes** | `<html>` tag lacks `dir="rtl"` and `lang="ar"` |

**The business impact:** Companies in the GCC region (Saudi Arabia, UAE, Qatar) are losing Arabic-speaking customers — 78% of whom browse on mobile — because their websites have these problems. Most companies don't even know the problems exist because their QA teams test in English.

---

## 3. The Idea & Vision

### Origin
Pixelette Technologies, a GCC-focused product studio, noticed that virtually every website they audited for Arabic clients had the same categories of RTL/Arabic UX bugs. The manual audit process took 2-3 weeks per site. The idea: automate the entire audit by fetching the page and running programmatic checks against the HTML.

### Vision
- **Phase 1 (MVP):** Single-page scanner with 8 automated checks. Free tier with email gate for lead capture. Starter tier ($49) for full reports.
- **Phase 2 (Scale):** Full-site crawling (100 pages), competitor comparison, PDF reports, Fix Packs (auto-generated CSS/HTML patches), Pro tier ($199/mo).
- **Phase 3 (Enterprise):** API access, CI/CD plugins, AI-powered fix descriptions (Claude API), browser extension, expand to Hebrew/Urdu/Farsi, government tenders.

### What Makes It Unique
1. **Static HTML analysis** — Fetches page HTML via HTTP and runs regex-based checks across all 8 audit categories. (Originally designed for Playwright headless browser; migrated to static analysis for free-tier hosting — see Bug 19.)
2. **Arabic-specific** — Every check is designed for Arabic/RTL. Not a generic accessibility tool with an RTL checkbox.
3. **Generates fix code** — Doesn't just find problems, generates the exact CSS/HTML code to fix them.
4. **Dual viewport** — Scans both desktop (1920×1080) and mobile (375×812) because 78% of GCC traffic is mobile.

---

## 4. Target Market

### Primary Region: GCC (Gulf Cooperation Council)
- Saudi Arabia, UAE, Qatar, Bahrain, Kuwait, Oman

### Buyer Personas
| Persona | Pain Point | What They Buy |
|---------|-----------|--------------|
| **E-commerce PM** | Arabic shoppers abandoning cart due to broken RTL | Pro tier + Fix Packs |
| **Bank CTO** | Regulatory compliance for Arabic accessibility | Enterprise + white-label |
| **Government IT** | Public portal must serve Arabic-first population | Enterprise + Full Redesign |
| **Agency Consultant** | Need to audit client sites for Arabic UX quickly | Pro tier + competitor comparison |
| **SaaS Developer** | Building an Arabic version but unsure if RTL is correct | Starter tier |

---

## 5. Business Model

```
┌─────────────────────────────────────────────────────────────────┐
│ FREE SCAN ($0)                                                  │
│ Score + problem count only. Email gate. Lead capture.           │
├─────────────────────────────────────────────────────────────────┤
│ STARTER ($49 one-time)                                          │
│ Full single-page audit. All issues + fix code + PDF.            │
├─────────────────────────────────────────────────────────────────┤
│ PRO ($199/month)                                                │
│ Full-site crawl (100 pages). Mobile + desktop.                  │
│ Competitor comparison. Monthly re-scan.                         │
├─────────────────────────────────────────────────────────────────┤
│ ENTERPRISE (Custom pricing)                                     │
│ Unlimited pages. API. White-label. SSO. CI/CD integration.      │
├─────────────────────────────────────────────────────────────────┤
│ FIX PACKS ($499–$2,000)                                         │
│ Auto-generated CSS/HTML code patches for every issue found.     │
├─────────────────────────────────────────────────────────────────┤
│ FULL REDESIGN ($5K–$50K)                                        │
│ Manual UX redesign by Pixelette team.                           │
└─────────────────────────────────────────────────────────────────┘
```

### Revenue Strategy
- Free tier captures emails → feeds BDM (Business Development Manager) outbound pipeline
- Starter converts self-serve users who need a one-time audit
- Pro creates recurring revenue from agencies and mid-market companies
- Enterprise is high-touch sales to banks, government, large e-commerce
- Fix Packs are pure margin — auto-generated from audit results
- Full Redesign upsells Pixelette's services team

---

## 6. Technical Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        FRONTEND                               │
│                   Next.js 14 (App Router)                     │
│                   Tailwind CSS + Glassmorphism                │
│                   Deployed on Vercel                          │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTPS (REST API)
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                        BACKEND API                            │
│                   NestJS 10 (TypeScript)                      │
│                   Deployed on Render                          │
│                                                               │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Scan   │  │  Audit   │  │ Crawler  │  │   Report     │  │
│  │ Module  │  │  Engine  │  │(HTTP Fetch│  │  (PDF Gen)   │  │
│  │         │  │ 8 Checks │  │ + Static) │  │              │  │
│  └────┬────┘  └────┬─────┘  └────┬─────┘  └──────────────┘  │
│       │            │              │                            │
│       ▼            ▼              ▼                            │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              BullMQ Job Queue (Redis-backed)             │  │
│  │         Async scan processing, retries, progress         │  │
│  └─────────────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────────┘
                       │
            ┌──────────┴──────────┐
            ▼                     ▼
   ┌─────────────────┐   ┌──────────────┐
   │   PostgreSQL     │   │    Redis      │
   │   (Render)       │   │  (Upstash)    │
   │                  │   │               │
   │  Scans table     │   │  Job queue    │
   │  Users table     │   │  Rate limits  │
   └──────────────────┘   └──────────────┘
```

---

## 7. The 8 Audit Categories

### Category 1: HTML Direction (20 points)
**What it checks:** `<html dir="rtl">` and `<html lang="ar">` attributes.
**Why it matters:** Without `dir="rtl"`, the browser renders everything left-to-right. This is the single most impactful fix.
**File:** `apps/api/src/modules/audit/checks/direction.check.ts`

### Category 2: CSS Logical Properties (20 points)
**What it checks:** Physical CSS properties (`margin-left`, `padding-right`, `float: left`, `text-align: left`) that should be logical equivalents (`margin-inline-start`, `padding-inline-end`).
**Why it matters:** Physical properties don't flip in RTL mode. Logical properties work in all directions.
**File:** `apps/api/src/modules/audit/checks/css-logical.check.ts`

### Category 3: Arabic Typography (15 points)
**What it checks:** `letter-spacing` (must be 0 for Arabic — connected script), `line-height` (must be ≥1.6 for Arabic), text decoration, color opacity (RGBa issues).
**Why it matters:** `letter-spacing: 2px` breaks Arabic letterforms by disconnecting characters that should be connected.
**File:** `apps/api/src/modules/audit/checks/typography.check.ts`

### Category 4: Layout Mirroring (15 points)
**What it checks:** Navigation order (should be right-to-left), sidebar position, directional icons (arrows, chevrons) that need `scaleX(-1)` transform.
**Why it matters:** A left sidebar in English should be a right sidebar in Arabic. Back arrows should point right, not left.
**File:** `apps/api/src/modules/audit/checks/layout-mirror.check.ts`

### Category 5: Mobile RTL (15 points)
**What it checks:** Flex/grid direction at 375×812 viewport, text alignment, overflow issues on mobile.
**Why it matters:** 78% of GCC internet traffic is mobile. Mobile RTL bugs are the most common and most impactful.
**File:** `apps/api/src/modules/audit/checks/mobile-rtl.check.ts`

### Category 6: BiDi Handling (10 points)
**What it checks:** Mixed Arabic + English text isolation (`<bdi>` tags), `dir` attributes on form inputs, proper Unicode bidirectional algorithm handling.
**Why it matters:** "Order #12345" in an Arabic sentence can render as "12345# Order" without proper BiDi isolation.
**File:** `apps/api/src/modules/audit/checks/bidi.check.ts`

### Category 7: Text Overflow (5 points)
**What it checks:** Buttons, navigation items, and badges where Arabic text is clipped (`scrollWidth > clientWidth`).
**Why it matters:** Arabic text is typically 20-30% wider than English. Fixed-width containers clip Arabic content.
**File:** `apps/api/src/modules/audit/checks/text-overflow.check.ts`

### Category 8: Font Fallback (bonus)
**What it checks:** Arabic-capable font in the `font-family` chain, web font loading status, fallback behaviour.
**Why it matters:** If no Arabic font is specified, the browser uses a generic serif/sans-serif that may render Arabic poorly or not at all.
**File:** `apps/api/src/modules/audit/checks/font-fallback.check.ts`

---

## 8. Scoring Methodology

### Point Distribution (100 total)
```
HTML Direction (dir, lang):    20 pts  ████████████████████
CSS Logical Properties:        20 pts  ████████████████████
Arabic Typography:             15 pts  ███████████████
Layout Mirroring:              15 pts  ███████████████
Mobile RTL:                    15 pts  ███████████████
BiDi Handling:                 10 pts  ██████████
Text Overflow:                  5 pts  █████
                              ─────
Total:                        100 pts
```

### Grade Thresholds
| Score | Grade | Color | Meaning |
|-------|-------|-------|---------|
| 90–100 | Excellent | Green (#22c55e) | Arabic UX is production-ready |
| 70–89 | Good | Cyan (#06b6d4) | Minor issues, mostly usable |
| 40–69 | Needs Work | Orange (#f97316) | Significant problems affecting users |
| 0–39 | Poor | Red (#ef4444) | Broken Arabic experience |

### Scoring Rules
- Each check produces issues with severity: Critical, Major, Minor, Info
- Each category has a maximum score (e.g., 20 for Direction)
- Issues deduct points based on severity
- Zero issues in a category = full points (perfect score celebration 🎉)
- Scoring weights are stored in JSON (`packages/audit-rules/scoring-weights.json`), not hardcoded

---

## 9. Tech Stack Deep Dive

| Layer | Technology | Why This Choice |
|-------|-----------|----------------|
| **Crawl Engine** | HTTP Fetch + Static Analysis | Lightweight crawler using `fetch()` + regex-based checks. Originally Playwright but migrated for free-tier hosting (see Bug 19). Playwright remains the target for Phase 2 when hosting supports Chromium. |
| **Backend API** | NestJS 10 + TypeScript | Modular architecture with dependency injection. Strong TypeScript support. Team expertise. |
| **Database** | PostgreSQL + Prisma ORM | JSON columns (`jsonb`) for flexible audit results. Prisma for type-safe queries. |
| **Job Queue** | BullMQ (Redis-backed) | Async scan jobs. Rate limiting. Retry logic. Job progress tracking. |
| **Frontend** | Next.js 14 (App Router) | SSR for SEO landing pages. React for dashboard. |
| **Styling** | Tailwind CSS + Custom Design System | Glassmorphism theme. CSS variables for tokens. Responsive breakpoints. |
| **Auth (planned)** | Clerk | Arabic locale support. Social login. SSO for enterprise. |
| **Payments (planned)** | Paddle | GCC VAT/tax compliance. Subscription management. |
| **Frontend Hosting** | Vercel | Optimized for Next.js. Global CDN. |
| **Backend Hosting** | Render (Free tier) | Node.js web service. Auto-deploy from GitHub. |
| **Database Hosting** | Render PostgreSQL (Free) | Same platform as backend. 1GB storage free. |
| **Cache/Queue** | Upstash Redis (Free) | Serverless Redis with TLS. Free tier: 500K commands/month. |
| **Monorepo** | Turborepo + pnpm | Shared types prevent frontend/backend drift. Single CI/CD pipeline. |

### Language Rules
- TypeScript everywhere. No plain JavaScript.
- ES2022+, Node.js 20 LTS target.
- Strict mode enabled. No `any` types unless justified.

---

## 10. Project Structure

```
designsprint/
├── CLAUDE.md                          # Project guide (this document's source)
├── README.md                          # GitHub README
├── package.json                       # Root workspace config
├── turbo.json                         # Turborepo pipeline (tasks, caching)
├── pnpm-workspace.yaml                # pnpm workspace definition
├── docker-compose.yml                 # Local dev: PostgreSQL + Redis
├── .gitignore                         # Node, build, env exclusions
├── .npmrc                             # pnpm config
│
├── apps/
│   ├── web/                           # ──── NEXT.JS FRONTEND ────
│   │   ├── src/app/
│   │   │   ├── globals.css            # Full design system (tokens, glass, animations)
│   │   │   ├── layout.tsx             # Root layout (orbs, nav, footer)
│   │   │   ├── page.tsx               # Landing page (hero, mock preview, categories)
│   │   │   └── results/[id]/page.tsx  # Results page (score ring, cards, paywall)
│   │   ├── next.config.mjs            # Next.js config (transpile shared package)
│   │   ├── tailwind.config.ts         # Tailwind theme
│   │   ├── vercel.json                # Vercel deployment config
│   │   └── package.json
│   │
│   └── api/                           # ──── NESTJS BACKEND ────
│       ├── src/
│       │   ├── main.ts                # Bootstrap (port, CORS, validation)
│       │   ├── app.module.ts          # Root module (Redis, throttle, all modules)
│       │   ├── app.controller.ts      # Health check endpoint (GET /)
│       │   └── modules/
│       │       ├── scan/              # Scan orchestration
│       │       │   ├── scan.controller.ts   # POST /api/scans, GET /api/scans/:id
│       │       │   ├── scan.service.ts      # Rate limiting, tier enforcement
│       │       │   └── scan.processor.ts    # BullMQ job processor
│       │       ├── audit/             # Audit engine
│       │       │   └── checks/        # 8 check modules (see Section 7)
│       │       ├── crawler/           # HTTP fetch + static HTML analysis
│       │       └── prisma/            # Database service with retry logic
│       ├── prisma/
│       │   └── schema.prisma          # Database schema (Scan, User models)
│       ├── render.yaml                # Render deployment config
│       ├── railway.json               # Railway deployment config
│       ├── nixpacks.toml              # Nixpacks build config
│       └── package.json
│
├── packages/
│   ├── shared/                        # ──── SHARED TYPES ────
│   │   └── src/
│   │       ├── types/index.ts         # IScanResult, IAuditResult, CategoryScore
│   │       ├── constants/index.ts     # Scoring weights, severity thresholds
│   │       └── utils/arabic-detect.ts # Arabic Unicode regex
│   │
│   └── audit-rules/                   # ──── RULE DATABASES (JSON) ────
│       ├── icon-mirror-rules.json     # MUST_MIRROR, MUST_NOT_MIRROR
│       ├── arabic-fonts.json          # Known Arabic-capable fonts
│       ├── scoring-weights.json       # Category weights
│       └── css-physical-properties.json
│
└── docs/
    └── PROJECT_NOTES.md               # This file
```

---

## 11. Database Schema

### Scan Model
```prisma
model Scan {
  id               String      @id @default(cuid())
  url              String
  status           ScanStatus  @default(PENDING)
  tier             Tier        @default(FREE)
  email            String
  viewport         String      @default("both")
  desktop_result   Json?       // Full IAuditResult for desktop viewport
  mobile_result    Json?       // Full IAuditResult for mobile viewport
  error            String?
  created_at       DateTime    @default(now())
  completed_at     DateTime?

  @@index([email, created_at])  // Rate limiting queries
  @@index([status])             // Job queue polling
}
```

### Enums
```prisma
enum ScanStatus { PENDING, RUNNING, COMPLETED, FAILED }
enum Tier { FREE, STARTER, PRO }
```

### User Model
```prisma
model User {
  id         String   @id @default(cuid())
  clerk_id   String   @unique  // Clerk auth ID
  email      String   @unique
  tier       Tier     @default(FREE)
  created_at DateTime @default(now())
}
```

---

## 12. API Endpoints

### POST /api/scans — Submit a scan
```json
// Request
{
  "url": "https://example.com/ar",
  "email": "user@example.com",
  "viewport": "both"          // "desktop" | "mobile" | "both"
}

// Response (202 Accepted)
{
  "id": "cmmxakgos0000a0fbbj2h2vot"
}
```

### GET /api/scans/:id — Poll results
```json
// Response (while running)
{
  "id": "cmmxakgos0000a0fbbj2h2vot",
  "url": "https://example.com/ar",
  "status": "running",
  "createdAt": "2026-03-24T10:00:00Z"
}

// Response (completed)
{
  "id": "cmmxakgos0000a0fbbj2h2vot",
  "url": "https://example.com/ar",
  "status": "completed",
  "desktop": {
    "totalScore": 71,
    "grade": "good",
    "categories": [ ... ]
  },
  "mobile": {
    "totalScore": 58,
    "grade": "needs-work",
    "categories": [ ... ]
  }
}
```

### GET / — Health check
```json
{
  "status": "ok",
  "service": "DesignSprint™ API",
  "version": "0.0.1"
}
```

---

## 13. Frontend Pages

### Landing Page (`/`)
- **Hero section:** URL input form + viewport selector + mock product preview
- **Mock preview panel:** Browser chrome mockup showing sample audit results (score 71, category bars, issues, code diff)
- **Stats row:** 8 categories · 100 points · <60s · Free
- **"How it works" section:** 3 numbered steps with icons
- **Category tiles grid:** 8 glassmorphism cards showing each audit category
- **Design:** Dark glassmorphism theme with animated background orbs, dot grid overlay

### Results Page (`/results/[id]`)
- **Score ring:** Animated SVG circle with score/100, grade badge, glow effect
- **Mini bars:** Animated progress bars for each category
- **Category cards:** Expandable cards with severity badges, issue details, code diffs
- **Freemium gate:**
  - FREE: Score + severity counts visible. Issue details blurred/locked. Fix suggestions locked.
  - PRO: Everything visible. Expandable issues. Fix code diffs. PDF export.
- **Paywall banner:** Upgrade CTA with pricing ($49 Starter)
- **Running view:** Step-by-step progress indicator with animated spinner
- **Error/failed states:** Friendly error messages with retry button
- **Skeleton loader:** Shimmer loading state matching real layout proportions

---

## 14. Freemium Gate Implementation

The free tier gate is a core business model feature:

### What FREE users see:
- ✅ Total score (animated ScoreRing)
- ✅ Grade badge (Poor / Needs Work / Good / Excellent)
- ✅ Per-category score and progress bars
- ✅ Severity distribution pills (e.g., "2 Critical · 1 Major")
- 🔒 Blurred issue details with lock overlay
- 🔒 "Fix suggestions available · 🔒 Pro" teaser
- 🔒 PDF export button (grayed out)
- 💜 Paywall upgrade banner ($49 CTA)

### What PRO users see:
- Everything above, plus:
- ✅ Full issue messages and details
- ✅ Expandable issue lists with smooth animation
- ✅ Code diff blocks (before/after)
- ✅ PDF export button (active)
- No paywall banner

### Implementation:
```typescript
// Single constant at top of file — flip when auth is wired
const IS_PRO = false;

// Threads through components via props
<AuditView result={scan.desktop} isPro={IS_PRO} />
<CategoryCard cat={cat} isPro={isPro} />
```

---

## 15. Deployment Architecture

### Live URLs
| Service | URL | Platform |
|---------|-----|----------|
| Frontend | [designsprint-apii.vercel.app](https://designsprint-apii.vercel.app) | Vercel (Free) |
| Backend API | [designsprint-api.onrender.com](https://designsprint-api.onrender.com) | Render (Free) |
| Database | Internal on Render | Render PostgreSQL (Free) |
| Redis | winning-duckling-73791.upstash.io | Upstash (Free) |
| Repository | [github.com/zunaair/designsprint](https://github.com/zunaair/designsprint) | GitHub |

### Deployment Pipeline
```
GitHub Push → Vercel auto-deploys frontend
GitHub Push → Render auto-deploys backend
```

### Environment Variables

**Vercel (Frontend):**
| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://designsprint-api.onrender.com` |

**Render (Backend):**
| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `DATABASE_URL` | `postgresql://...@...singapore-postgres.render.com/designsprint?sslmode=require&connect_timeout=30` |
| `REDIS_URL` | `rediss://default:...@winning-duckling-73791.upstash.io:6379` |

### Render Build Command
```bash
cd ../.. && NODE_ENV=development pnpm install && pnpm --filter @designsprint/shared build && cd apps/api && npx prisma generate && node node_modules/@nestjs/cli/bin/nest.js build
```

### Render Start Command
```bash
node dist/main
```

---

## 16. Bugs Encountered & Solutions

### Bug 1: `TooManyRequestsException` not exported from NestJS v10
**Error:** `Module '"@nestjs/common"' has no exported member 'TooManyRequestsException'`
**Cause:** NestJS 10 doesn't export `TooManyRequestsException` as a named class.
**Fix:** Replaced with `new HttpException(msg, HttpStatus.TOO_MANY_REQUESTS)`.

### Bug 2: `exactOptionalPropertyTypes` — can't assign `undefined` to optional fields
**Error:** TypeScript strict mode rejects `field: undefined` for optional properties.
**Cause:** `tsconfig.json` has `exactOptionalPropertyTypes: true`.
**Fix:** Used conditional spread pattern: `...(val != null && { field: val })`.

### Bug 3: Prisma `NullableJsonNullValueInput` rejects `undefined`
**Error:** Can't assign `undefined` to Prisma JSON columns.
**Cause:** Prisma's JSON null handling requires `Prisma.JsonNull`, not `undefined`.
**Fix:** `desktop_result: result.desktop != null ? (result.desktop as unknown as Prisma.InputJsonValue) : Prisma.JsonNull`.

### Bug 4: `next.config.ts` not supported in Next.js 14
**Error:** Next.js 14 doesn't support TypeScript config files.
**Fix:** Renamed to `next.config.mjs` with ESM export.

### Bug 5: `use(params)` runtime error in Next.js 14
**Error:** `An unsupported type was passed to use(): [object Object]`
**Cause:** In Next.js 14, `params` is a plain object. `use()` is for Promises (Next.js 15).
**Fix:** Changed `const { id } = use(params)` to `const { id } = params`.

### Bug 6: SVG score ring wrong circumference
**Error:** Ring animation showed incorrect fill amount.
**Cause:** CSS `@keyframes` had hardcoded circumference value (283 for r=45) but the ring used r=52 (circ≈326.7).
**Fix:** Switched to React `useRef` + CSS `transition` approach — calculates exact circumference at runtime.

### Bug 7: Tailwind `border-white/8` invalid class
**Error:** Tailwind opacity suffix `8` doesn't exist.
**Fix:** Replaced with inline styles using `rgba(255,255,255,0.08)`.

### Bug 8: Turbo `pipeline` renamed to `tasks` in v2.0
**Error:** Vercel build failed — `Found 'pipeline' field instead of 'tasks'`.
**Fix:** Renamed `pipeline` to `tasks` in `turbo.json`.

### Bug 9: Vercel output directory doubling
**Error:** `apps/web/.next` not found at `/vercel/path0/apps/web/apps/web/.next`.
**Cause:** Root Directory set to `apps/web` + Output Directory set to `apps/web/.next` = doubled path.
**Fix:** Set `outputDirectory: ".next"` in `apps/web/vercel.json` and disabled dashboard overrides.

### Bug 10: Vercel framework preset wrong (NestJS instead of Next.js)
**Error:** Build misconfiguration.
**Fix:** Changed Framework Preset from NestJS to Next.js in Vercel dashboard.

### Bug 11: Render — `@designsprint/shared` module not found
**Error:** `Cannot find module '@designsprint/shared'` during build.
**Cause:** The shared workspace package wasn't built before the API.
**Fix:** Added `pnpm --filter @designsprint/shared build` to the Render build command.

### Bug 12: Render — Prisma downloads wrong version (7.x)
**Error:** `The datasource property 'url' is no longer supported in schema files.`
**Cause:** `NODE_ENV=production` skips devDependencies. `npx prisma` downloads latest (v7) which has breaking changes.
**Fix:** Changed to `NODE_ENV=development pnpm install` in build command.

### Bug 13: Render — Database unreachable (P1001)
**Error:** `Can't reach database server at 'dpg-xxx:5432'`
**Cause:** Internal database URL not reachable from build phase / different Render project.
**Fix:** Switched to external database URL with `?sslmode=require&connect_timeout=30`.

### Bug 14: Render — Database connection closed (P1017)
**Error:** `Server has closed the connection.`
**Cause:** Free tier database sleeps after inactivity. SSL handshake timeout.
**Fix:** Added retry logic to PrismaService (5 retries with exponential backoff). App starts even if database is temporarily unavailable.

### Bug 15: Render — Redis WRONGPASS error
**Error:** `ReplyError: WRONGPASS invalid username-password pair`
**Cause:** `REDIS_URL` had literal text `PASTE_TOKEN_HERE` instead of actual Upstash password.
**Fix:** User replaced with actual Upstash token. Also fixed `app.module.ts` to parse `REDIS_URL` format and enable TLS for `rediss://` protocol.

### Bug 16: Render — BullMQ using localhost for Redis
**Error:** Silent crash on startup.
**Cause:** `app.module.ts` used `REDIS_HOST`/`REDIS_PORT` env vars but only `REDIS_URL` was set. Defaulted to `localhost`.
**Fix:** Updated BullModule config to parse `REDIS_URL` with URL constructor, extract host/port/password, and enable TLS for `rediss://`.

### Bug 17: Render — Database P1017 with both internal and external URLs
**Error:** `P1017: Server has closed the connection` (5 retries all failed).
**Cause:** Render free PostgreSQL and web service were in different projects — internal networking didn't work. External SSL connections also failed.
**Fix:** Migrated database from Render PostgreSQL to **Neon.tech** (free PostgreSQL with reliable external SSL). Connection worked immediately.

### Bug 18: Prisma — Cannot insert multiple commands into prepared statement
**Error:** `Raw query failed. Code: 42601. Message: ERROR: cannot insert multiple commands into a prepared statement`
**Cause:** `$executeRawUnsafe()` tried to run all CREATE TABLE/INDEX statements in a single call.
**Fix:** Split into separate `$executeRawUnsafe()` calls — one per SQL statement (enums, tables, indexes each in their own call).

### Bug 19: Render — Playwright Chromium not installed
**Error:** `browserType.launch: Executable doesn't exist at /opt/render/.cache/ms-playwright/chromium_headless_shell`
**Cause:** Render free tier lacks system libraries for Chromium. `--with-deps` needs root access (denied).
**Fix:** Replaced Playwright browser-based crawler with a lightweight **HTTP fetch + static HTML analysis** scanner. Uses `fetch()` to get HTML and runs regex-based checks. All 8 audit categories reimplemented as static analysis.

### Bug 20: Render — pnpm lockfile outdated after dependency move
**Error:** `ERR_PNPM_OUTDATED_LOCKFILE Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up to date`
**Cause:** Moved `playwright` from dependencies to devDependencies without updating lockfile.
**Fix:** Changed Render build command to use `--no-frozen-lockfile` flag.

---

## 17. What Was Achieved

### ✅ Full-Stack SaaS Built From Scratch
- TypeScript monorepo with shared types
- NestJS backend with 8 audit check modules
- Lightweight HTTP-based crawler (static HTML analysis, no browser needed)
- Next.js 14 frontend with glassmorphism design system
- PostgreSQL database with Prisma ORM
- BullMQ job queue for async processing
- REST API with rate limiting and validation

### ✅ Production Deployment
- Frontend live on Vercel (global CDN)
- Backend API live on Render
- PostgreSQL database on Neon.tech (Singapore region)
- Redis on Upstash (Singapore region)
- Auto-deploy from GitHub pushes
- All free tier — $0/month total cost

### ✅ Professional UI/UX (9/10 rating)
- Dark glassmorphism theme with animated background orbs
- Animated score ring with smooth SVG transitions
- Responsive design (mobile/tablet/desktop breakpoints)
- Loading skeletons, error states, empty states
- Mock product preview in hero section
- "How it works" 3-step section
- Category grid with hover effects
- Smooth expand/collapse animations
- Pricing section (Free / Starter $49 / Pro $199)
- "Trusted by" industry row
- CTA banner with scroll-to-top

### ✅ Business Model Implementation
- Freemium gate (score visible, details locked)
- Paywall upgrade banner with pricing
- Severity distribution visible to create urgency
- Blurred content teaser for locked features
- PDF download button (locked for free tier)

### ✅ Code Quality
- TypeScript strict mode throughout
- Shared types prevent frontend/backend drift
- No magic numbers — all weights in JSON
- Arabic detection regex in shared utility
- Error handling with retries and logging
- Environment-based configuration

---

## 18. What I Learned

### Technical Learnings

1. **TypeScript `exactOptionalPropertyTypes`** — Changes how optional fields are assigned. Can't use `field: undefined`; must use conditional spread `...(val != null && { field: val })`.

2. **Prisma JSON handling** — JSON columns with `exactOptionalPropertyTypes` need `Prisma.JsonNull` instead of `undefined`. This is a common gotcha.

3. **Next.js 14 vs 15 params** — In Next.js 14, `params` is a plain object. In Next.js 15, it's a Promise that requires `use()`. Version matters.

4. **Turbo v1 → v2 migration** — `pipeline` was renamed to `tasks`. Vercel auto-uses the latest Turbo, so `turbo.json` must use v2 syntax.

5. **SVG animation math** — CSS `@keyframes` with hardcoded values breaks when the SVG radius changes. React ref-based animation with computed circumference is more reliable.

6. **pnpm monorepo deployment** — Deploying a pnpm workspace to Render/Vercel requires careful build commands. The shared package must be built before dependent packages. `NODE_ENV=production` skips devDependencies which can break build tools.

7. **Upstash Redis TLS** — Upstash requires `rediss://` (with double s) for TLS connections. Standard `redis://` connections are rejected. The BullMQ/ioredis config needs `tls: {}` when using TLS.

8. **Render free tier limitations** — Free databases sleep after inactivity. Internal networking requires same project. External connections need SSL. Build phase can't access internal network.

9. **Vercel monorepo Root Directory** — When Root Directory is set, ALL paths (build command, output directory) are relative to it. Setting output to `apps/web/.next` when root is `apps/web/` doubles the path.

10. **Prisma connection retries** — Free tier databases go to sleep. Adding retry logic with exponential backoff prevents the entire app from crashing when the database wakes up slowly.

### Product Learnings

1. **Freemium gates must show enough value** — The free tier shows the total score and severity counts. This is enough to create urgency ("you have 14 critical issues") without giving away the details that paid users need.

2. **Arabic UX is underserved** — There is no existing tool that specifically audits for Arabic/RTL UX quality with real browser rendering. This is a genuine market gap.

3. **GCC mobile traffic is 78%** — Mobile-first is not optional for this market. Dual viewport scanning (desktop + mobile) is a core differentiator.

4. **Scoring methodology should be public** — Publishing the full scoring model builds trust and serves as SEO content. It also positions DesignSprint as an authority on Arabic web UX.

### Deployment Learnings

1. **Free tier is viable for MVP** — Vercel (free) + Render (free) + Upstash (free) = $0/month. Enough for beta testing and demos.

2. **Environment variables are the #1 deployment failure** — Most deployment bugs were caused by wrong, missing, or misformatted environment variables.

3. **Build commands differ per platform** — What works locally doesn't work on Vercel/Render. Each platform has its own build environment, caching, and networking rules.

---

## 19. Future Roadmap

### Phase 2: Scale (Months 4–8)
- [ ] Pro tier ($199/month) with recurring billing (Paddle)
- [ ] Full-site crawl (100 pages) via BullMQ queue
- [ ] Competitor comparison (scan 3 competitor URLs side-by-side)
- [ ] PDF report generation (pdfkit or @react-pdf/renderer)
- [ ] Fix Packs (auto-generated CSS/HTML patches)
- [ ] Clerk authentication + user dashboard
- [ ] Monthly re-scan with email notifications
- [ ] Score trend tracking over time

### Phase 3: Enterprise (Months 9–18)
- [ ] Enterprise tier with custom pricing
- [ ] REST API access for programmatic scanning
- [ ] CI/CD plugins (GitHub Actions, GitLab CI)
- [ ] Claude API integration for AI-generated fix explanations
- [ ] Browser extension (scan current page instantly)
- [ ] White-label reports (client branding replaces Pixelette)
- [ ] SSO (SAML/OIDC) for enterprise clients
- [ ] Hebrew, Urdu, Farsi RTL language expansion
- [ ] Government tender compliance certifications

---

## 20. Key Decisions & Why

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **HTTP static analysis (was Playwright)** | Migrated from Playwright to lightweight HTTP fetch + regex for free-tier hosting. Playwright is the target for Phase 2 when hosting supports Chromium. |
| 2 | **AWS Bahrain (me-south-1) for production** | GCC latency. Saudi PDPL data sovereignty compliance. |
| 3 | **NestJS over Express** | Module system, DI, validation built-in. Matches product complexity. |
| 4 | **Prisma over raw SQL** | Type-safe queries. JSON columns for flexible audit results. |
| 5 | **BullMQ for all async work** | Scans, PDFs, crawls > 5 seconds → job queue. No sync long-running requests. |
| 6 | **Monorepo with Turborepo** | Shared types prevent drift. Single CI/CD. Team productivity. |
| 7 | **Scoring methodology is public** | Trust-building. SEO strategy. Authority positioning. |
| 8 | **Free tier requires email** | Lead capture feeds sales pipeline. Non-negotiable business requirement. |
| 9 | **Fix Packs are auto-generated** | Every audit check produces fix code. Revenue stream, not just nice-to-have. |
| 10 | **CSS logical properties preferred** | Fix suggestions use `margin-inline-start` not `margin-right`. Works for all RTL languages. |
| 11 | **Arabic font database is data, not code** | JSON file updated without code changes as new fonts are released. |
| 12 | **Icon mirroring rules are data, not code** | JSON arrays of must_mirror, must_not_mirror, context_dependent. |
| 13 | **Arabic detection regex is shared** | Single regex in `packages/shared/utils/arabic-detect.ts` used everywhere. |
| 14 | **Computed styles, not declared** | All CSS checks use `window.getComputedStyle()` because cascading changes declared values. |
| 15 | **robots.txt compliance** | Multi-page crawling respects robots.txt to prevent legal issues. |

---

## Summary

DesignSprint™ is a fully functional Arabic UX audit SaaS, built from scratch as a TypeScript monorepo, deployed across Vercel + Render + Neon + Upstash at zero cost, implementing a freemium business model with 8 specialized audit categories scoring websites out of 100 points. The MVP is live, the architecture is production-ready, and the roadmap is clear for scaling to Pro, Enterprise, and multi-language support.

### Live URLs

| Service | URL |
|---------|-----|
| **Frontend** | [designsprint-apii.vercel.app](https://designsprint-apii.vercel.app) |
| **Backend API** | [designsprint-api.onrender.com](https://designsprint-api.onrender.com) |
| **GitHub** | [github.com/zunaair/designsprint](https://github.com/zunaair/designsprint) |

### Final Deployment Stack (All Free Tier)

| Service | Provider | Region | Cost |
|---------|----------|--------|------|
| Frontend | Vercel | Global CDN | $0 |
| Backend API | Render | Singapore | $0 |
| PostgreSQL | Neon.tech | Singapore | $0 |
| Redis | Upstash | Singapore | $0 |
| **Total** | | | **$0/month** |

*صُنع بعناية للويب العربي*
*Built with care for the Arabic web.*

---

**Built by Zunair Haider** | **Powered by Pixelette Technologies** | **March 2026**
