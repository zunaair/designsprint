# DesignSprint™ — Deployment & Setup Guide

> **For non-technical users.** Follow each step in order.

---

## What You Have Right Now

| Service | URL | Status |
|---------|-----|--------|
| **Website (Frontend)** | [designsprint-apii.vercel.app](https://designsprint-apii.vercel.app) | ✅ Live |
| **API (Backend)** | [designsprint-api.onrender.com](https://designsprint-api.onrender.com) | ⚠️ Needs redeploy |
| **Database** | Neon.tech PostgreSQL | ✅ Connected |
| **Redis** | Upstash | ✅ Connected |
| **Code** | [github.com/zunaair/designsprint](https://github.com/zunaair/designsprint) | ✅ Latest |

---

## STEP 1 — Redeploy Backend (Fixes scan error)

### What's wrong?
The database was created before Sprint 6. New columns (`scan_type`, `page_count`, `user_id`, etc.) don't exist yet. The latest code adds them automatically on startup — but you need to redeploy first.

### How to fix:
1. Go to **[dashboard.render.com](https://dashboard.render.com)**
2. Click on **`designsprint-api`**
3. Click **"Manual Deploy"** button (top right)
4. Click **"Deploy latest commit"**
5. Wait 2-3 minutes
6. You should see **"Your service is live"** in the logs

### How to verify it worked:
Open your browser and go to: `https://designsprint-api.onrender.com/`

You should see:
```json
{
  "status": "ok",
  "service": "DesignSprint™ API",
  "version": "0.4.0"
}
```

Then go to your website and try scanning any URL. It should work.

---

## STEP 2 — Add Clerk Keys (Enables Sign In / Sign Up)

### What is Clerk?
Clerk is a free login system. It gives your users "Sign In" and "Sign Up" buttons.

### How to set up:

**A. Get your keys (you already did this):**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = `pk_test_b2JsaWdpb...`
- `CLERK_SECRET_KEY` = `sk_test_...` (click eye icon on Clerk dashboard to reveal)

**B. Add SECRET key to Render (backend):**
1. Go to [dashboard.render.com](https://dashboard.render.com) → click `designsprint-api`
2. Click **"Environment"** in left sidebar
3. Click **"Edit"**
4. Click **"+ Add Environment Variable"**
5. KEY: `CLERK_SECRET_KEY`
6. VALUE: paste your `sk_test_...` key
7. Click **"Save"**

**C. Add PUBLIC key to Vercel (frontend):**
1. Go to [vercel.com](https://vercel.com) → your project → **Settings** → **Environment Variables**
2. KEY: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
3. VALUE: paste your `pk_test_...` key
4. Click **"Save"**

**D. Redeploy both:**
- Render: Manual Deploy → Deploy latest commit
- Vercel: Deployments → Redeploy (uncheck cache)

### How to verify:
Visit your website. You should see **"Sign In"** and **"Sign Up"** buttons in the top-right corner of the header.

---

## STEP 3 — Add Sentry Key (Enables Error Tracking)

### What is Sentry?
Sentry catches errors in your app and sends you alerts. Free plan: 5,000 errors/month.

### How to set up:

**A. Create account:**
1. Go to [sentry.io](https://sentry.io)
2. Click **"Sign Up"** → **"Continue with GitHub"**
3. Create a project → select **"Node.js"**
4. Copy the **DSN** (looks like: `https://abc123@o123.ingest.sentry.io/456`)

**B. Add to Render:**
1. Go to Render → `designsprint-api` → **Environment** → **Edit**
2. Add variable:
   - KEY: `SENTRY_DSN`
   - VALUE: paste the DSN
3. Save → Manual Deploy → Deploy latest commit

### How to verify:
Check Render logs after deploy. You should see:
```
Sentry initialized
```

---

## STEP 4 — Add PostHog Key (Enables Analytics)

### What is PostHog?
PostHog tracks how people use your website. Free plan: 1 million events/month.

### How to set up:

**A. Create account:**
1. Go to [posthog.com](https://posthog.com)
2. Click **"Sign Up"** → **"Continue with GitHub"**
3. Create a project
4. Copy the **API Key** (looks like: `phc_abc123xyz`)

**B. Add to Vercel:**
1. Go to Vercel → your project → **Settings** → **Environment Variables**
2. Add variable:
   - KEY: `NEXT_PUBLIC_POSTHOG_KEY`
   - VALUE: paste the API key
3. Save → Deployments → Redeploy

### How to verify:
Go to PostHog dashboard. After someone visits your website, you should see page views appearing.

---

## STEP 5 — Skip Payments For Now

Paddle (payment system) requires business verification. **Skip this for beta testing.** The "Unlock Full Report" button will show a placeholder URL — that's fine for now.

When you're ready to accept real payments:
1. Go to [paddle.com](https://paddle.com) → Sign up
2. Create products (Starter $49, Pro $199)
3. Add keys to Render: `PADDLE_API_KEY`, `PADDLE_PRICE_STARTER`, `PADDLE_PRICE_PRO`

---

## All Environment Variables — Complete List

### Render (Backend) — [dashboard.render.com](https://dashboard.render.com)

| Key | Value | Required? | What it does |
|-----|-------|-----------|-------------|
| `NODE_ENV` | `production` | Yes | Tells the app it's running live |
| `PORT` | `10000` | Yes | Port Render uses |
| `DATABASE_URL` | `postgresql://...@...neon.tech/...` | Yes | Database connection |
| `REDIS_URL` | `rediss://...@...upstash.io:6379` | Yes | Redis for job queue |
| `CLERK_SECRET_KEY` | `sk_test_...` | For login | Verifies user tokens |
| `SENTRY_DSN` | `https://...@...sentry.io/...` | For errors | Error tracking |
| `PADDLE_API_KEY` | `...` | For payments | Payment processing |
| `PADDLE_PRICE_STARTER` | `pri_...` | For payments | Starter plan price ID |
| `PADDLE_PRICE_PRO` | `pri_...` | For payments | Pro plan price ID |

### Vercel (Frontend) — [vercel.com](https://vercel.com)

| Key | Value | Required? | What it does |
|-----|-------|-----------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://designsprint-api.onrender.com` | Yes | Points frontend to backend |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_...` | For login | Clerk frontend key |
| `NEXT_PUBLIC_POSTHOG_KEY` | `phc_...` | For analytics | PostHog tracking |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` | Optional | PostHog host (default is fine) |

---

## Known Issues & Fixes

### Issue 1: "Internal server error" when scanning

**Cause:** Database is missing new columns from Sprint 6 (scan_type, page_count, etc.)

**Fix:** Redeploy Render. The latest code automatically adds missing columns on startup.

**How:** Render → `designsprint-api` → Manual Deploy → Deploy latest commit

---

### Issue 2: "Sign In" and "Sign Up" buttons don't appear

**Cause:** Clerk keys not added to environment variables.

**Fix:** Add `CLERK_SECRET_KEY` to Render AND `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to Vercel. Then redeploy both.

---

### Issue 3: Render shows "Exited with status 1" after deploy

**Cause:** Missing environment variables (DATABASE_URL or REDIS_URL).

**Fix:** Check Render → Environment tab. Make sure all 4 required variables are set:
- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `REDIS_URL`

---

### Issue 4: Vercel shows "Build Failed"

**Cause:** Usually a lockfile mismatch or missing dependency.

**Fix:** Redeploy with cache cleared: Deployments → three dots → Redeploy → uncheck "Use existing Build Cache"

---

### Issue 5: Free tier shows "Internal server error" but Pro works

**Cause:** Render free tier spins down after 15 minutes of inactivity. First request after sleep takes 30-50 seconds.

**Fix:** This is normal on free tier. Wait 30 seconds and try again. The second request will be fast.

---

## Quick Reference — What Each Service Costs

| Service | Free Plan Limit | Cost |
|---------|----------------|------|
| Vercel | Unlimited deploys, 100GB bandwidth | $0 |
| Render | 750 hours/month, spins down after inactivity | $0 |
| Neon.tech | 0.5GB storage, auto-scales | $0 |
| Upstash | 500K commands/month | $0 |
| Clerk | 10,000 users/month | $0 |
| Sentry | 5,000 errors/month | $0 |
| PostHog | 1,000,000 events/month | $0 |
| **Total** | | **$0/month** |

---

## Architecture Diagram (Simple)

```
User visits website
       ↓
   [Vercel]  ←── Next.js frontend (React pages)
       ↓
   Clicks "Scan"
       ↓
   [Render]  ←── NestJS API (processes the scan)
       ↓
   [Upstash Redis]  ←── Job queue (scan runs in background)
       ↓
   [Neon PostgreSQL]  ←── Stores results
       ↓
   User sees score + report
```

---

## What the Product Does (Summary)

1. User enters a website URL
2. System fetches the page HTML
3. Runs 8 Arabic UX checks (direction, CSS, typography, layout, mobile, BiDi, overflow, fonts)
4. Scores the page out of 100 points
5. Shows results with grade (Poor / Needs Work / Good / Excellent)
6. Free tier: score + issue count only
7. Paid tier: full issue details + fix suggestions + PDF report + Fix Pack

---

## Files in the Project

```
designsprint/
├── apps/
│   ├── api/          ← Backend (NestJS) — 8 modules
│   │   ├── scan/     ← Scan creation, queue, results
│   │   ├── audit/    ← 8 check modules + scoring
│   │   ├── crawler/  ← Fetches HTML, runs checks
│   │   ├── user/     ← User accounts
│   │   ├── billing/  ← Paddle payments
│   │   ├── report/   ← PDF generation
│   │   ├── fixpack/  ← CSS/HTML fix patches
│   │   └── prisma/   ← Database connection
│   └── web/          ← Frontend (Next.js) — 8 pages
│       ├── /                    ← Landing page
│       ├── /methodology         ← Scoring explained
│       ├── /pricing             ← Plans comparison
│       ├── /results/[id]        ← Scan results
│       ├── /dashboard           ← User overview
│       └── /dashboard/scans     ← Scan history
├── packages/
│   ├── shared/       ← Types shared between frontend + backend
│   └── audit-rules/  ← Scoring weights, font lists, CSS rules (JSON)
├── scripts/
│   ├── seed-db.ts    ← Create sample data
│   └── run-audit.ts  ← CLI scan tool
├── docs/
│   ├── api.md        ← API documentation
│   └── PROJECT_NOTES.md ← Full project documentation
└── .github/
    └── workflows/ci.yml ← Automated tests on every code push
```

---

**Built by Zunair Haider** | **Powered by Pixelette Technologies** | **March 2026**
