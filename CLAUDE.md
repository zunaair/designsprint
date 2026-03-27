# CLAUDE.md — DesignSprint™ Project Guide

## Project Description

DesignSprint™ is a SaaS product that audits websites for Arabic UX quality. A user enters a website URL, the system fetches the page HTML and runs 8 categories of Arabic-specific static analysis checks, producing a scored report with prioritised fix recommendations. (Note: Originally designed for Playwright headless browser, the crawler was migrated to lightweight HTTP fetch + regex analysis for free-tier hosting compatibility.)

The core value proposition: businesses are losing Arabic-speaking customers because their websites have broken RTL layouts, bad Arabic typography, BiDi content bugs, missing Arabic fonts, clipped text, and unmirrored icons. DesignSprint diagnoses these problems automatically and generates actionable fix code.

**This is NOT a generic UX audit tool.** It is specifically and deeply focused on Arabic (and eventually all RTL) language UX. Every architectural and product decision should reinforce this specialisation.

### Target Market

- Primary: GCC region (Saudi Arabia, UAE, Qatar, Bahrain, Kuwait, Oman)
- Buyers: E-commerce companies, banks, government portals, SaaS platforms, agencies, healthcare, travel/hospitality
- Users: Product managers, marketing teams, developers, UX designers, agency consultants

### Business Model

```
Free Scan ($0)     → Score + problem count only. Email gate. Lead capture.
Starter ($49)      → Full single-page audit. All issues + fix code + PDF.
Pro ($199/mo)      → Full-site crawl (100 pages). Mobile + desktop. Competitor comparison. Monthly re-scan.
Enterprise (Custom) → Unlimited pages. API. White-label. SSO. CI/CD integration.
Fix Packs ($499-2K) → Auto-generated CSS/HTML code patches for every issue found.
Full Redesign       → Manual UX redesign by Pixelette team ($5K-$50K).
```

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Crawl Engine** | HTTP Fetch + Static Analysis (was Playwright) | Lightweight crawler using `fetch()` + regex-based checks. Migrated from Playwright for free-tier hosting. Playwright is the target for Phase 2 when hosting supports Chromium. |
| **Backend API** | NestJS (Node.js + TypeScript) | Existing team expertise. Modular architecture. Strong TypeScript support. |
| **Database** | PostgreSQL + Prisma ORM | Existing team expertise. JSON columns for flexible audit results. Prisma for type-safe queries. |
| **Job Queue** | BullMQ (Redis-backed) | Async crawl/audit jobs. Rate limiting. Retry logic. Job progress tracking. |
| **Frontend** | Next.js 14+ (App Router) + Tailwind CSS | SSR for SEO landing pages. React for dashboard. Tailwind for rapid UI. |
| **PDF Reports** | pdfkit (planned) | Generate branded PDF reports from audit results. Not yet implemented. |
| **Auth** | Clerk | Arabic locale support. Social login. SSO for enterprise tier. |
| **Payments** | Paddle | GCC VAT/tax compliance handled automatically. Subscription management. |
| **Hosting** | AWS Middle East (Bahrain) `me-south-1` | Low latency for GCC clients. PDPL data sovereignty compliance. |
| **Cache** | Redis (same instance as BullMQ) | Caching scan results. Rate limiting free tier. Session management. |
| **AI Layer (Phase 2)** | Claude API (Anthropic) | Generate human-readable fix explanations from technical audit findings. |
| **Monitoring** | Sentry (errors) + PostHog (analytics) | Error tracking + product analytics + feature flags. |

### Language

- **TypeScript everywhere.** Backend, frontend, scripts, tests. No plain JavaScript files.
- Target: ES2022+, Node.js 20 LTS.
- Strict mode enabled. No `any` types unless explicitly justified with a comment.

---

## File Structure

```
designsprint/
├── CLAUDE.md                          # This file
├── package.json                       # Root workspace config
├── turbo.json                         # Turborepo pipeline config
├── docker-compose.yml                 # Local dev: PostgreSQL + Redis
│
├── apps/
│   ├── web/                           # Next.js frontend
│   │   ├── app/                       # App Router pages
│   │   │   ├── (marketing)/           # Public pages: landing, pricing, methodology
│   │   │   ├── (dashboard)/           # Authenticated pages: scans, reports, settings
│   │   │   └── api/                   # Next.js API routes (minimal — most logic in backend)
│   │   ├── components/                # React components
│   │   │   ├── ui/                    # Shared UI primitives (buttons, cards, modals)
│   │   │   ├── scan/                  # Scan-related components (URL input, progress, results)
│   │   │   ├── report/                # Report display components (score ring, issue cards, fixes)
│   │   │   └── layout/                # Header, footer, sidebar, navigation
│   │   ├── lib/                       # Frontend utilities (API client, formatters, hooks)
│   │   └── public/                    # Static assets
│   │
│   └── api/                           # NestJS backend
│       ├── src/
│       │   ├── modules/
│       │   │   ├── scan/              # Scan orchestration (create, queue, status, results)
│       │   │   ├── audit/             # Audit engine (all 8 check categories)
│       │   │   │   ├── checks/        # Individual check modules (see Audit Checks below)
│       │   │   │   ├── scoring/       # Scoring engine (weights, thresholds, aggregation)
│       │   │   │   └── rules/         # Rule databases (icon-mirror-rules.json, arabic-fonts.json)
│       │   │   ├── crawler/           # HTTP fetch + static HTML analysis crawler
│       │   │   ├── report/            # Report generation (PDF, JSON, comparison)
│       │   │   ├── user/              # User management, subscription tier logic
│       │   │   ├── billing/           # Paddle webhook handlers, tier enforcement
│       │   │   └── fixpack/           # Fix Pack generation engine
│       │   ├── common/                # Shared decorators, guards, filters, pipes
│       │   ├── config/                # Environment config, feature flags
│       │   └── main.ts                # App bootstrap
│       ├── prisma/
│       │   ├── schema.prisma          # Database schema
│       │   └── migrations/            # Migration files
│       └── test/                      # E2E tests
│
├── packages/
│   ├── shared/                        # Shared types, constants, utilities
│   │   ├── types/                     # TypeScript interfaces shared between frontend + backend
│   │   ├── constants/                 # Scoring weights, severity thresholds, check categories
│   │   └── utils/                     # Arabic text detection regex, Unicode helpers
│   │
│   └── audit-rules/                   # Rule databases (JSON files)
│       ├── icon-mirror-rules.json     # MUST_MIRROR, MUST_NOT_MIRROR, CONTEXT_DEPENDENT
│       ├── arabic-fonts.json          # Known Arabic-capable fonts (premium, system, generic)
│       ├── scoring-weights.json       # Category weights and threshold definitions
│       └── css-physical-properties.json # Physical CSS properties that should be logical
│
├── scripts/                           # CLI utilities
│   ├── seed-db.ts                     # Seed database with test data
│   └── run-audit.ts                   # CLI tool to run audit on a URL (for testing)
│
└── docs/                              # Internal documentation
    ├── architecture.md                # System architecture diagrams
    ├── audit-checks.md                # Detailed spec for each of the 8 check categories
    ├── scoring-methodology.md         # Public-facing scoring methodology (also on website)
    └── api.md                         # API documentation for enterprise tier
```

### Audit Check Modules (apps/api/src/modules/audit/checks/)

```
checks/
├── direction.check.ts        # Check 1: HTML dir="rtl", lang="ar" attribute
├── css-logical.check.ts      # Check 2: Physical vs logical CSS properties
├── typography.check.ts       # Check 3: Letter-spacing, line-height, underline, RGBa
├── layout-mirror.check.ts    # Check 4: Navigation, sidebar, icon mirroring
├── mobile-rtl.check.ts       # Check 5: Mobile viewport RTL rendering
├── text-overflow.check.ts    # Check 6: Button/nav/badge text clipping detection
├── bidi.check.ts             # Check 7: Mixed Arabic+English content, <bdi> tags, forms
├── font-fallback.check.ts    # Check 8: Arabic font in font-family chain, font loading
└── base.check.ts             # Abstract base class all checks extend
```

Each check module exports a class that extends `BaseCheck` and implements:
- `run(input: unknown): Promise<CheckResult[]>` — executes the check (legacy check files accept unknown; production checks run inline in CrawlerService)
- `score(results: CheckResult[]): number` — calculates the category score (0 to max points)
- `fixes(results: CheckResult[]): FixSuggestion[]` — generates fix code snippets

---

## Coding Conventions

### General Rules

- **TypeScript strict mode.** No `any` unless justified with `// eslint-disable-next-line @typescript-eslint/no-explicit-any -- [reason]`.
- **No default exports** except for Next.js pages/layouts (required by framework). Use named exports everywhere else.
- **Barrel exports** via `index.ts` in each module/directory.
- **Absolute imports** using `@/` prefix in the web app and `@api/` prefix in the backend.
- **No magic numbers.** All thresholds, weights, limits go in `packages/shared/constants/` or `packages/audit-rules/`.
- **English variable names.** Arabic text only appears in test fixtures, rule databases, and user-facing content. Never in variable names or comments.

### Naming

```
Files:          kebab-case          → direction.check.ts, scan.service.ts
Classes:        PascalCase          → DirectionCheck, ScanService
Interfaces:     PascalCase + prefix → IScanResult, IAuditConfig
Types:          PascalCase          → CheckResult, SeverityLevel
Functions:      camelCase           → runDirectionCheck(), calculateScore()
Constants:      UPPER_SNAKE_CASE    → MAX_PAGES_FREE_TIER, SCORING_WEIGHTS
JSON rule keys: snake_case          → must_mirror, arabic_fonts, font_display
Database cols:  snake_case          → created_at, scan_status, audit_score
API endpoints:  kebab-case          → /api/scans, /api/scan-results/:id
```

### Backend (NestJS)

- One module per domain (scan, audit, crawler, report, user, billing, fixpack).
- Services contain business logic. Controllers are thin — validate input, call service, return response.
- Use `class-validator` decorators on all DTOs. Never trust raw input.
- All database access goes through Prisma service. No raw SQL unless performance-critical (and then document why).
- Async operations that take >5 seconds must use BullMQ job queue, not synchronous request handling.
- Queue job names follow pattern: `scan:single-page`, `scan:full-site`, `report:generate-pdf`.

### Frontend (Next.js)

- Server Components by default. Use `"use client"` only when state, effects, or browser APIs are needed.
- Data fetching in Server Components via `fetch()` or Prisma (for dashboard pages).
- Client state management: React `useState`/`useReducer` for local state. No global state library unless complexity demands it.
- All API calls from client components go through `lib/api-client.ts` (centralised fetch wrapper with auth headers).
- Components are co-located with their styles. No separate CSS files — Tailwind only.

### Testing

- **Unit tests:** Vitest. Every audit check module must have tests with real Arabic text fixtures.
- **E2E tests:** Vitest E2E tests against the API endpoints (Playwright Test planned for Phase 2).
- **Test fixtures:** Store real-world HTML snapshots of Arabic websites in `test/fixtures/`. Never mock the DOM for audit checks — test against real HTML.
- **Minimum coverage:** 80% for `audit/checks/`, 60% for everything else.

### Error Handling

- All HTTP fetch operations wrapped in try/catch with 30s timeout via AbortController. Crawler errors must not crash the job — log the error, mark the page as `SCAN_FAILED`, continue to next page.
- User-facing errors returned as structured JSON: `{ error: string, code: string, details?: object }`.
- Internal errors logged to Sentry with full context (URL being scanned, check that failed, page HTML snapshot).

---

## Key Decisions

These are architectural and product decisions that have been made. Do not revisit or override them without explicit instruction.

### Product Decisions

1. **Free tier is gated.** Free scan shows score + problem count + severity breakdown ONLY. All issue details, fix suggestions, and PDF reports are behind the paywall. Email is required even for free scan.

2. **Dual viewport scanning.** Every scan runs in BOTH desktop (1920×1080) and mobile (375×812) viewports by default. Results are reported separately. Mobile score is highlighted because 78% of GCC traffic is mobile.

3. **Scoring methodology is public.** The full scoring model (8 categories, weights, thresholds) is published on the website at `/methodology`. This is a deliberate trust-building and SEO strategy.

4. **Scoring model (100 points total):**
   - HTML Direction (dir, lang): 20 points
   - CSS Logical Properties: 20 points
   - Arabic Typography: 15 points
   - Layout Mirroring: 15 points
   - Mobile RTL: 15 points
   - BiDi Handling: 10 points
   - Text Overflow: 5 points
   - **Total: 100 points**
   - Thresholds: 0–39 Poor (red) | 40–69 Needs Work (orange) | 70–89 Good (yellow) | 90–100 Excellent (green)

5. **Fix Packs are auto-generated.** Every audit check must produce machine-readable fix suggestions (CSS code, HTML changes) that can be bundled into a Fix Pack. This is a product revenue stream, not just nice-to-have.

6. **Competitor comparison is Pro-tier only.** Free and Starter scan only the user's URL. Pro ($199/mo) allows scanning up to 3 competitor URLs alongside the user's site with side-by-side scoring.

7. **Multi-page crawling is Pro-tier only.** Free and Starter scan 1 page. Pro scans up to 100 pages. Enterprise is unlimited. Full-site scans are processed via BullMQ and the user is notified by email when complete.

### Technical Decisions

8. **HTTP static analysis (was Playwright).** Production crawler uses HTTP fetch + regex-based analysis for free-tier hosting compatibility. Playwright (Chromium/Firefox/WebKit) is the Phase 2 target when hosting supports headless browsers. The 8 check files retain Playwright-era code for their `score()` and `fixes()` methods.

9. **AWS Bahrain region (me-south-1).** All infrastructure lives in this region for GCC latency and Saudi PDPL data sovereignty compliance. Do not deploy to US/EU regions.

10. **NestJS over raw Express/Fastify.** Module system, dependency injection, and built-in validation match the complexity of this product. Existing team expertise.

11. **Prisma over raw SQL.** Type-safe database access. Audit results stored as JSON columns in PostgreSQL (`jsonb` type) for flexible schema as checks evolve.

12. **BullMQ for all async work.** Scans, PDF generation, full-site crawls, Fix Pack generation — everything that takes >5 seconds goes through the job queue. No synchronous long-running HTTP requests.

13. **Monorepo with Turborepo.** Frontend and backend in one repo. Shared types package prevents frontend/backend type drift. Single CI/CD pipeline.

14. **Arabic text detection regex:** `[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]` — covers Arabic, Arabic Supplement, Arabic Extended-A, Arabic Presentation Forms A and B. Use this EXACT regex throughout the codebase. It lives in `packages/shared/utils/arabic-detect.ts`.

15. **Icon mirroring rules are data, not code.** The `icon-mirror-rules.json` file contains three arrays: `must_mirror`, `must_not_mirror`, `context_dependent`. Each entry maps icon names/class patterns to the rule. Rules are loaded at runtime, not hardcoded. This allows updating rules without code changes.

16. **Arabic font database is data, not code.** The `arabic-fonts.json` file lists all known Arabic-capable fonts categorised as `premium_web`, `system`, and `generic`. Loaded at runtime. Updated periodically as new Arabic fonts are released.

### Design Decisions

17. **Brand colours:** Primary Red `#C7052D`, Dark `#1A1A2E`, Pink accent `#E6BCC5`. Font: Manrope (Latin) + Noto Sans Arabic (Arabic). These match Pixelette Technologies brand standards.

18. **The product website MUST be bilingual (English + Arabic).** This is eat-your-own-dog-food. If we build an Arabic UX audit tool and our own website has broken Arabic, we lose all credibility. The website itself must pass a 90+ score on our own tool.

19. **Reports are branded.** PDF reports include Pixelette logo, colour scheme, and contact details. Enterprise tier supports white-label (client's branding replaces Pixelette's).

---

## Phase Roadmap

| Phase | Timeline | What Gets Built |
|-------|----------|-----------------|
| **Phase 1: MVP** | Months 1–3 | Single-page scanner with all 8 checks. Free scan with email gate. Starter tier ($49). Landing page in EN + AR. 100 beta users. |
| **Phase 2: Scale** | Months 4–8 | Pro tier ($199/mo). Full-site crawling. Competitor comparison. PDF reports. Fix Packs. BDM outbound integration. |
| **Phase 3: Enterprise** | Months 9–18 | Enterprise tier. API access. CI/CD plugins. AI-powered fix descriptions. Browser extension. Government tenders. Hebrew/Urdu/Farsi expansion. |

---

## Common Commands

```bash
# Local development
docker compose up -d                    # Start PostgreSQL + Redis
pnpm install                            # Install all dependencies
pnpm dev                                # Start all apps (web + api) in dev mode

# Database
pnpm --filter api prisma migrate dev    # Run migrations
pnpm --filter api prisma studio         # Open Prisma Studio GUI

# Testing
pnpm test                               # Run all tests
pnpm --filter api test:e2e              # Run backend E2E tests
pnpm --filter web test                  # Run frontend tests

# Audit CLI (for development/testing)
pnpm --filter api run audit -- --url "https://example.com/ar"

# Build
pnpm build                              # Build all apps
pnpm --filter web build                 # Build frontend only
pnpm --filter api build                 # Build backend only

# Linting
pnpm lint                               # Lint all workspaces
pnpm typecheck                          # TypeScript type checking
```

---

## Important Notes for Claude

1. **Always use the Arabic detection regex from `packages/shared/utils/arabic-detect.ts`.** Do not write a new regex for detecting Arabic text. The shared one covers all Arabic Unicode blocks.

2. **Never hardcode scoring weights.** Always read from `packages/audit-rules/scoring-weights.json`. If a weight needs to change, change the JSON file, not the code.

3. **Every new audit check must implement the `BaseCheck` interface** with `run()`, `score()`, and `fixes()` methods. No exceptions.

4. **HTTP fetch is lightweight.** The crawler uses `fetch()` with a 30s timeout via AbortController. One fetch per URL. No browser context management needed in the current static analysis mode.

5. **Arabic text in test fixtures must be REAL Arabic** — not transliterated, not Lorem Ipsum, not random Unicode. Use actual Arabic sentences from real websites. Store fixtures in `test/fixtures/`.

6. **The free tier email gate is a business requirement.** Do not remove it or make it optional. Every free scan captures an email. This feeds the sales pipeline.

7. **All CSS property checks must use the COMPUTED style** (via `window.getComputedStyle()`), not the declared stylesheet. Shorthand properties, cascading, and specificity mean declared values often differ from what the browser actually applies.

8. **When generating Fix Pack code snippets, prefer CSS logical properties over physical overrides.** Suggest `margin-inline-start` not `margin-right`. The fix should work for ALL RTL languages, not just Arabic.

9. **Multi-page crawling must respect robots.txt.** Parse robots.txt before crawling. Skip disallowed paths. This prevents legal issues with enterprise clients.

10. **Rate limit the free tier aggressively.** Maximum 3 free scans per email per 24 hours. Maximum 1 concurrent scan per IP. This prevents abuse and protects server resources.
