# DesignSprint™ API Documentation

**Base URL:** `https://designsprint-api.onrender.com`
**Version:** 0.4.0

---

## Authentication

Most endpoints are public. Authenticated endpoints require a Clerk JWT token:

```
Authorization: Bearer <clerk_jwt_token>
```

When `CLERK_SECRET_KEY` is not configured (dev mode), the auth guard is permissive.

---

## Endpoints

### Health Check

```
GET /
```

**Auth:** Public
**Response:** `200 OK`

```json
{
  "status": "ok",
  "service": "DesignSprint™ API",
  "version": "0.4.0",
  "endpoints": { ... }
}
```

---

### Create Scan

```
POST /api/scans
```

**Auth:** Public (email required for free tier; authenticated users get tier benefits)

**Request Body:**

```json
{
  "url": "https://example.com",
  "email": "user@example.com",
  "viewport": "both"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `url` | string | Yes | Valid URL with protocol (https://) |
| `email` | string | Yes | Valid email address |
| `viewport` | string | Yes | `"desktop"`, `"mobile"`, or `"both"` |

**Response:** `202 Accepted`

```json
{
  "id": "clxyz123abc456"
}
```

**Errors:**

| Status | Code | Cause |
|--------|------|-------|
| 400 | Bad Request | Missing/invalid fields |
| 409 | Conflict | Concurrent scan already running from this IP |
| 429 | Too Many Requests | Daily scan limit exceeded for this email |

---

### Get Scan Results

```
GET /api/scans/:id
```

**Auth:** Public (tier-filtered: free users get scores only, paid users get full details)

**Response:** `200 OK`

Free tier response (issues/fixes stripped):
```json
{
  "id": "clxyz123abc456",
  "url": "https://example.com",
  "status": "completed",
  "tier": "free",
  "email": "user@example.com",
  "desktop": {
    "url": "https://example.com",
    "scannedAt": "2026-03-24T12:00:00.000Z",
    "viewport": "desktop",
    "totalScore": 72,
    "grade": "good",
    "categories": [
      { "category": "direction", "score": 20, "maxScore": 20, "issueCount": 0 },
      { "category": "css-logical", "score": 12, "maxScore": 20, "issueCount": 3 }
    ]
  },
  "createdAt": "2026-03-24T12:00:00.000Z",
  "completedAt": "2026-03-24T12:01:00.000Z"
}
```

Paid tier response (full data):
```json
{
  "id": "clxyz123abc456",
  "url": "https://example.com",
  "status": "completed",
  "tier": "starter",
  "desktop": {
    "categories": [
      {
        "category": "css-logical",
        "score": 12,
        "maxScore": 20,
        "issueCount": 3,
        "issues": [
          { "category": "css-logical", "severity": "major", "message": "margin-left used 14 times" }
        ],
        "fixes": [
          { "category": "css-logical", "description": "Replace margin-left", "before": "margin-left: 20px", "after": "margin-inline-start: 20px", "type": "css" }
        ]
      }
    ]
  }
}
```

**Statuses:** `"pending"` | `"running"` | `"completed"` | `"failed"`

**Errors:**

| Status | Code | Cause |
|--------|------|-------|
| 404 | Not Found | Scan ID does not exist |

---

### List Scans (Authenticated)

```
GET /api/scans?page=1&limit=20
```

**Auth:** Required (returns empty array if not authenticated)

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |

**Response:** `200 OK`

```json
{
  "scans": [ ... ],
  "total": 42
}
```

---

### Get User Profile

```
GET /api/user/me
```

**Auth:** Required

**Response:** `200 OK`

```json
{
  "id": "clxyz789def",
  "email": "user@example.com",
  "tier": "starter",
  "createdAt": "2026-03-01T00:00:00.000Z"
}
```

---

### Create Checkout (Billing)

```
POST /api/billing/checkout
```

**Auth:** Required

**Request Body:**

```json
{
  "plan": "starter"
}
```

| Field | Type | Values |
|-------|------|--------|
| `plan` | string | `"starter"` or `"pro"` |

**Response:** `200 OK`

```json
{
  "checkoutUrl": "https://checkout.paddle.com/..."
}
```

---

### Paddle Webhook

```
POST /api/billing/webhook
```

**Auth:** Public (verified by Paddle webhook signature)

Handles events: `subscription.created`, `subscription.updated`, `subscription.canceled`

**Response:** `200 OK`

```json
{ "received": true }
```

---

### Download PDF Report

```
GET /api/reports/:scanId/pdf
```

**Auth:** Required (Starter or Pro tier)

**Response:** `200 OK` with `Content-Type: application/pdf`

Returns binary PDF file as attachment.

**Errors:**

| Status | Code | Cause |
|--------|------|-------|
| 403 | Forbidden | Free tier — PDF requires Starter or Pro |
| 404 | Not Found | Scan not found or not completed |

---

### Get Fix Pack

```
GET /api/fixpacks/:scanId
```

**Auth:** Required (Starter or Pro tier)

**Response:** `200 OK`

```json
{
  "scanId": "clxyz123abc456",
  "url": "https://example.com",
  "generatedAt": "2026-03-24T12:05:00.000Z",
  "totalFixes": 5,
  "cssPatches": "/* DesignSprint Fix Pack — CSS */\n...",
  "htmlPatches": "<!-- DesignSprint Fix Pack — HTML -->\n...",
  "attributePatches": "<!-- DesignSprint Fix Pack — Attributes -->\n...",
  "fixes": [ ... ]
}
```

**Errors:**

| Status | Code | Cause |
|--------|------|-------|
| 403 | Forbidden | Free tier — Fix Packs require Starter or Pro |
| 404 | Not Found | Scan not found or not completed |

---

### Create Competitor Comparison

```
POST /api/comparisons
```

**Auth:** Required (Pro tier only)

**Request Body:**

```json
{
  "primaryUrl": "https://your-site.com",
  "competitorUrls": [
    "https://competitor1.com",
    "https://competitor2.com"
  ],
  "email": "user@example.com"
}
```

| Field | Type | Constraints |
|-------|------|------------|
| `primaryUrl` | string | Valid URL with protocol |
| `competitorUrls` | string[] | 1-3 valid URLs |
| `email` | string | Valid email |

**Response:** `202 Accepted`

```json
{
  "id": "clcomp789xyz"
}
```

**Errors:**

| Status | Code | Cause |
|--------|------|-------|
| 400 | Bad Request | Invalid URLs or too many competitors (max 3) |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Not Pro tier |

---

### Get Comparison Results

```
GET /api/comparisons/:id
```

**Auth:** Public (but comparison creation requires Pro)

**Response:** `200 OK`

```json
{
  "id": "clcomp789xyz",
  "primaryUrl": "https://your-site.com",
  "competitorUrls": ["https://competitor1.com", "https://competitor2.com"],
  "status": "completed",
  "primary": { ... },
  "competitors": [ ... ],
  "createdAt": "2026-03-24T12:00:00.000Z",
  "completedAt": "2026-03-24T12:02:00.000Z"
}
```

---

## Rate Limits

| Tier | Scans/Day | Concurrent | Pages/Scan |
|------|-----------|------------|------------|
| Free | 3 | 1 per IP | 1 |
| Starter | 20 | 1 per IP | 1 |
| Pro | 100 | 1 per IP | 100 |

Global throttle: 30 requests per 60 seconds per IP.

---

## Scoring

100-point scale across 8 categories:

| Category | Points |
|----------|--------|
| HTML Direction | 20 |
| CSS Logical Properties | 20 |
| Arabic Typography | 15 |
| Layout Mirroring | 15 |
| Mobile RTL | 15 |
| BiDi Handling | 10 |
| Text Overflow | 5 |
| Font Fallback | 0 (penalised in Typography) |

**Grades:** Poor (0-39) | Needs Work (40-69) | Good (70-89) | Excellent (90-100)
