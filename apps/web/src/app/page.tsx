'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Viewport = 'desktop' | 'mobile' | 'both';
const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

/* ── Mock preview data ────────────────────────────────────── */
const MOCK = {
  url: 'arabic-store.com',
  score: 71,
  grade: 'Good',
  gradeColor: '#22c55e',
  gradeGlow: 'rgba(34,197,94,0.35)',
  gradeBg: 'rgba(34,197,94,0.1)',
  gradeBd: 'rgba(34,197,94,0.28)',
  categories: [
    { label: 'Direction',    pct: 100, color: '#22c55e' },
    { label: 'CSS Logical',  pct:  60, color: '#f97316' },
    { label: 'Typography',   pct:  73, color: '#06b6d4' },
    { label: 'Layout Mirror',pct:  80, color: '#22c55e' },
    { label: 'Mobile RTL',   pct:  53, color: '#f97316' },
    { label: 'BiDi Text',    pct:  70, color: '#06b6d4' },
    { label: 'Text Overflow',pct:  40, color: '#ef4444' },
  ],
  issues: [
    { sev: 'major', sev_color: '#f97316', sev_bg: 'rgba(249,115,22,0.1)', sev_bd: 'rgba(249,115,22,0.28)', msg: 'margin-left used on 14 elements' },
    { sev: 'minor', sev_color: '#eab308', sev_bg: 'rgba(234,179,8,0.1)',  sev_bd: 'rgba(234,179,8,0.28)',  msg: 'letter-spacing: 2px on Arabic text' },
  ],
};

const CATEGORIES = [
  { key: 'direction',      icon: '🧭', label: 'Direction',     pts: 20, desc: 'html[dir=rtl] and lang=ar — the two non-negotiable baseline attributes' },
  { key: 'css-logical',   icon: '📐', label: 'CSS Logical',    pts: 20, desc: 'Replace margin-left, padding-right, float, text-align with logical equivalents' },
  { key: 'typography',    icon: '✍️', label: 'Typography',     pts: 15, desc: 'letter-spacing must be 0 for connected Arabic letterforms, line-height ≥ 1.6' },
  { key: 'layout-mirror', icon: '🪞', label: 'Layout Mirror',  pts: 15, desc: 'Nav order, sidebar position, directional icon scaleX(-1) transforms' },
  { key: 'mobile-rtl',    icon: '📱', label: 'Mobile RTL',     pts: 15, desc: 'Flex/grid direction, text alignment, viewport meta at 375×812' },
  { key: 'bidi',          icon: '↔️', label: 'BiDi Text',      pts: 10, desc: 'Mixed Arabic+Latin isolation with <bdi> and dir attributes on form inputs' },
  { key: 'text-overflow', icon: '✂️', label: 'Text Overflow',  pts:  5, desc: 'Clipped Arabic glyphs detected via scrollWidth > clientWidth' },
  { key: 'font-fallback', icon: '🔤', label: 'Font Fallback',  pts:  0, desc: 'Arabic-capable font in font-family stack verified via document.fonts API' },
];

const VIEWPORTS: { v: Viewport; icon: string; label: string; sub: string }[] = [
  { v: 'desktop', icon: '🖥',  label: 'Desktop', sub: '1920 × 1080' },
  { v: 'mobile',  icon: '📱',  label: 'Mobile',  sub: '375 × 812' },
  { v: 'both',    icon: '⚡',  label: 'Both',    sub: 'Recommended' },
];

const STEPS = [
  {
    n: '01',
    icon: '🌐',
    title: 'Enter any URL',
    desc: 'Paste a website URL and your email. Works on any publicly accessible site — no install needed.',
  },
  {
    n: '02',
    icon: '🔍',
    title: 'We scan with Playwright',
    desc: 'A real Chromium browser loads your site in both Arabic locale and mobile viewport, then runs 8 checks.',
  },
  {
    n: '03',
    icon: '📊',
    title: 'Get a scored report',
    desc: 'Receive a 100-point score, per-category breakdown, and code-level fix suggestions you can act on immediately.',
  },
];

/* ── Sub-components ───────────────────────────────────────── */

function MockPreview() {
  const r = 42, cx = 54, circ = 2 * Math.PI * r;
  const offset = circ - (MOCK.score / 100) * circ;

  return (
    <div className="enter-scale d-3" style={{
      background: 'rgba(255,255,255,0.04)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 22,
      overflow: 'hidden',
      boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
    }}>
      {/* Header strip */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(255,255,255,0.02)',
      }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#ef4444','#f59e0b','#22c55e'].map(c => (
            <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.6 }} />
          ))}
        </div>
        <div style={{
          flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#64748b',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ color: '#334155' }}>🔒</span>
          <span>designsprint.app/results/...</span>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
          background: 'rgba(199,5,45,0.15)', color: '#E6BCC5', border: '1px solid rgba(199,5,45,0.25)',
        }}>Sample</span>
      </div>

      <div style={{ padding: '20px 20px 8px' }}>
        {/* URL + status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999,
            color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)',
          }}>● completed</span>
          <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>🌐 {MOCK.url}</span>
        </div>

        {/* Score section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
          {/* Ring */}
          <div style={{ filter: `drop-shadow(0 0 14px ${MOCK.gradeGlow})`, flexShrink: 0 }}>
            <svg width="108" height="108" viewBox="0 0 108 108">
              <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={9} />
              <circle
                cx={cx} cy={cx} r={r} fill="none"
                stroke={MOCK.gradeColor} strokeWidth={9} strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={offset}
                transform={`rotate(-90 ${cx} ${cx})`}
                style={{ transition: 'stroke-dashoffset 1.2s var(--ease-smooth)' }}
              />
              <text x={cx} y={cx - 5} textAnchor="middle" fill="#f8fafc" fontSize="22" fontWeight="900" fontFamily="Inter,sans-serif">{MOCK.score}</text>
              <text x={cx} y={cx + 12} textAnchor="middle" fill="#475569" fontSize="11" fontFamily="Inter,sans-serif">/100</text>
            </svg>
          </div>

          {/* Category mini-bars */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{
              display: 'inline-block', fontSize: 11, fontWeight: 700, marginBottom: 12,
              padding: '3px 10px', borderRadius: 999,
              color: MOCK.gradeColor, background: MOCK.gradeBg, border: `1px solid ${MOCK.gradeBd}`,
            }}>{MOCK.grade}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {MOCK.categories.map(c => (
                <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, color: '#475569', width: 80, flexShrink: 0 }}>{c.label}</span>
                  <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${c.pct}%`, background: c.color, borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Issues */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Issues found</div>
          {MOCK.issues.map((iss, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
              padding: '7px 10px', borderRadius: 10,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            }}>
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 999, whiteSpace: 'nowrap',
                color: iss.sev_color, background: iss.sev_bg, border: `1px solid ${iss.sev_bd}`,
              }}>{iss.sev.toUpperCase()}</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{iss.msg}</span>
            </div>
          ))}
        </div>

        {/* Fix suggestion snippet */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14, paddingBottom: 4 }}>
          <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Suggested fix</div>
          <div style={{
            fontFamily: 'monospace', fontSize: 11, padding: '8px 12px', borderRadius: 9,
            background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', color: '#fca5a5', marginBottom: 4,
          }}>
            <span style={{ color: '#ef4444', marginRight: 8 }}>−</span>.nav {'{ margin-left: 16px; }'}
          </div>
          <div style={{
            fontFamily: 'monospace', fontSize: 11, padding: '8px 12px', borderRadius: 9,
            background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)', color: '#86efac',
          }}>
            <span style={{ color: '#22c55e', marginRight: 8 }}>+</span>.nav {'{ margin-inline-start: 16px; }'}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepCard({ step, index }: { step: typeof STEPS[0]; index: number }) {
  return (
    <div className={`enter-up d-${index + 1}`} style={{
      position: 'relative',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 20,
      padding: '28px 24px',
    }}>
      {/* Step number */}
      <div style={{
        position: 'absolute', top: 20, right: 20,
        fontSize: 11, fontWeight: 800, color: '#1e293b',
        fontFamily: 'monospace', letterSpacing: '0.05em',
      }}>{step.n}</div>

      {/* Icon */}
      <div style={{
        width: 48, height: 48, borderRadius: 14, marginBottom: 16,
        background: 'linear-gradient(135deg, rgba(199,5,45,0.15), rgba(155,4,35,0.1))',
        border: '1px solid rgba(199,5,45,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
      }}>{step.icon}</div>

      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>{step.title}</h3>
      <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65 }}>{step.desc}</p>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function HomePage() {
  const router = useRouter();
  const [url, setUrl]           = useState('');
  const [email, setEmail]       = useState('');
  const [viewport, setViewport] = useState<Viewport>('both');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/scans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, email, viewport }),
      });
      if (!res.ok) {
        const body = await res.json() as { message?: string };
        throw new Error(body.message ?? `Error ${res.status}`);
      }
      const { id } = await res.json() as { id: string };
      router.push(`/results/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <main className="container">

      {/* ═══ Hero ═══════════════════════════════════════════ */}
      <div className="hero-grid">

        {/* LEFT — text + form */}
        <div>
          {/* Badge */}
          <div className="enter-up d-0 hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24, padding: '6px 14px', borderRadius: 999, background: 'rgba(199,5,45,0.1)', border: '1px solid rgba(199,5,45,0.26)', color: '#E6BCC5', fontSize: 12, fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E6BCC5', animation: 'pulse 2s ease infinite' }} />
            Free Arabic UX Audit — No signup required
            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: 'rgba(199,5,45,0.2)', color: '#E6BCC5', border: '1px solid rgba(199,5,45,0.28)' }}>Beta</span>
          </div>

          {/* Heading */}
          <h1 className="enter-up d-1 hero-h1 hero-text" style={{ fontSize: 'clamp(38px, 5vw, 60px)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-1.5px', marginBottom: 16 }}>
            <span style={{ color: '#f8fafc' }}>Is your website</span><br />
            <span style={{ color: '#f8fafc' }}>ready for</span>{' '}
            <span className="gradient-text">Arabic users?</span>
          </h1>

          {/* Arabic */}
          <p className="arabic enter-up d-2 hero-text" style={{ fontSize: 17, color: '#94a3b8', lineHeight: 1.75, marginBottom: 12 }}>
            اكتشف مشاكل تجربة المستخدم العربية في ثوانٍ
          </p>

          <p className="enter-up d-3 hero-text" style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, marginBottom: 28, maxWidth: 480 }}>
            Scored report across <strong style={{ color: '#94a3b8', fontWeight: 600 }}>8 Arabic UX categories</strong> — RTL layout,
            typography, icon mirroring, BiDi handling and more. Powered by a real Playwright browser.
          </p>

          {/* Stats */}
          <div className="enter-up d-4 hero-stats" style={{ display: 'flex', gap: 28, marginBottom: 36, flexWrap: 'wrap' }}>
            {[
              { n: '8', l: 'Check categories' },
              { n: '100', l: 'Point scale' },
              { n: '<60s', l: 'Scan time' },
              { n: 'Free', l: '3 scans/day' },
            ].map(s => (
              <div key={s.l} style={{ textAlign: 'center' }}>
                <div className="gradient-text" style={{ fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 3, fontWeight: 500 }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* ── Form card ─────────────────────────────────── */}
          <div className="enter-up d-5" style={{
            background: 'rgba(255,255,255,0.035)',
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 22,
            padding: 28,
            boxShadow: '0 24px 64px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)',
          }}>
            <div style={{ marginBottom: 22 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', marginBottom: 3 }}>Run a free audit</h2>
              <p style={{ fontSize: 13, color: '#475569' }}>Results in under 60 seconds, no account needed</p>
            </div>

            <form onSubmit={e => { void handleSubmit(e); }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* URL */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Website URL</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, pointerEvents: 'none' }}>🌐</span>
                  <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" required className="ds-input ds-input-icon" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Email <span style={{ color: '#334155', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>· 3 free scans / day</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, pointerEvents: 'none' }}>✉️</span>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="ds-input ds-input-icon" />
                </div>
              </div>

              {/* Viewport */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Viewport</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {VIEWPORTS.map(({ v, icon, label, sub }) => {
                    const active = viewport === v;
                    return (
                      <button key={v} type="button" onClick={() => setViewport(v)} style={{
                        position: 'relative', padding: '11px 6px', borderRadius: 14, textAlign: 'center',
                        border: `1.5px solid ${active ? 'rgba(199,5,45,0.5)' : 'rgba(255,255,255,0.08)'}`,
                        background: active ? 'linear-gradient(135deg,rgba(199,5,45,0.17),rgba(155,4,35,0.11))' : 'rgba(255,255,255,0.03)',
                        boxShadow: active ? '0 0 0 1px rgba(199,5,45,0.22), 0 4px 14px rgba(199,5,45,0.12)' : 'none',
                        cursor: 'pointer', transition: 'all 0.18s',
                        color: active ? '#f1f5f9' : '#64748b',
                      }}>
                        {active && <span style={{ position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: '50%', background: '#E6BCC5' }} />}
                        <div style={{ fontSize: 18, marginBottom: 3 }}>{icon}</div>
                        <div style={{ fontSize: 11, fontWeight: 700 }}>{label}</div>
                        <div style={{ fontSize: 10, color: active ? '#94a3b8' : '#334155', marginTop: 1 }}>{sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{ display: 'flex', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)' }}>
                  <span style={{ flexShrink: 0 }}>⚠️</span>
                  <span style={{ fontSize: 13, color: '#fca5a5', lineHeight: 1.5 }}>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 4 }}>
                {loading
                  ? <><span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />Submitting…</>
                  : <>Audit this website <span style={{ opacity: 0.65 }}>→</span></>
                }
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT — mock preview */}
        <div>
          <MockPreview />
        </div>
      </div>

      {/* ═══ How it works ════════════════════════════════════ */}
      <section style={{ paddingTop: 88, paddingBottom: 88 }}>
        <div className="enter-up" style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 14,
            fontSize: 11, fontWeight: 700, color: '#C7052D', textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            <span style={{ width: 16, height: 1, background: '#C7052D', display: 'inline-block' }} />
            How it works
            <span style={{ width: 16, height: 1, background: '#C7052D', display: 'inline-block' }} />
          </div>
          <h2 className="section-h2" style={{ fontSize: 32, fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.5px', marginBottom: 8 }}>Scan in 3 steps</h2>
          <p style={{ fontSize: 15, color: '#64748b', maxWidth: 420, margin: '0 auto' }}>
            No extensions, no account, no waiting — just paste a URL
          </p>
        </div>

        <div className="steps-grid">
          {STEPS.map((s, i) => <StepCard key={s.n} step={s} index={i} />)}
        </div>
      </section>

      {/* ═══ Categories ══════════════════════════════════════ */}
      <section style={{ paddingBottom: 96 }}>
        <div className="enter-up" style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 14,
            fontSize: 11, fontWeight: 700, color: '#C7052D', textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            <span style={{ width: 16, height: 1, background: '#C7052D', display: 'inline-block' }} />
            Audit categories
            <span style={{ width: 16, height: 1, background: '#C7052D', display: 'inline-block' }} />
          </div>
          <h2 className="section-h2" style={{ fontSize: 32, fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.5px', marginBottom: 8 }}>8 checks, 100 points</h2>
          <p style={{ fontSize: 15, color: '#64748b', maxWidth: 460, margin: '0 auto' }}>
            Every category targets a real Arabic UX failure — weighted by impact on readability and usability
          </p>
        </div>

        <div className="cat-grid">
          {CATEGORIES.map((cat, i) => (
            <div key={cat.key} className={`glass-card enter-up d-${Math.min(i, 8)}`} style={{ padding: '20px', cursor: 'default' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, marginBottom: 14,
                background: 'rgba(199,5,45,0.1)', border: '1px solid rgba(199,5,45,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>{cat.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 7 }}>{cat.label}</div>
              <div style={{ marginBottom: 10 }}>
                {cat.pts > 0
                  ? <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, color: '#E6BCC5', background: 'rgba(199,5,45,0.12)', border: '1px solid rgba(199,5,45,0.22)' }}>{cat.pts} pts</span>
                  : <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, color: '#fb923c', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.22)' }}>Penalty</span>
                }
              </div>
              <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.55 }}>{cat.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Trusted By ═══════════════════════════════════════ */}
      <section style={{ paddingBottom: 80 }}>
        <div className="enter-up" style={{ textAlign: 'center', marginBottom: 36 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Built for teams who care about Arabic UX
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap', opacity: 0.4 }}>
          {['E-Commerce', 'Banking', 'Government', 'Healthcare', 'Travel', 'SaaS'].map(name => (
            <div key={name} style={{ fontSize: 14, fontWeight: 700, color: '#475569', letterSpacing: '0.05em' }}>
              {name}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Pricing ══════════════════════════════════════════ */}
      <section style={{ paddingBottom: 96 }}>
        <div className="enter-up" style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 14,
            fontSize: 11, fontWeight: 700, color: '#C7052D', textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            <span style={{ width: 16, height: 1, background: '#C7052D', display: 'inline-block' }} />
            Pricing
            <span style={{ width: 16, height: 1, background: '#C7052D', display: 'inline-block' }} />
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.5px', marginBottom: 8 }}>Simple, transparent pricing</h2>
          <p style={{ fontSize: 15, color: '#64748b', maxWidth: 420, margin: '0 auto' }}>
            Start free. Upgrade when you need the full report.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, maxWidth: 900, margin: '0 auto' }}>
          {/* Free */}
          <div className="enter-up d-0" style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20, padding: '32px 28px',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Free</div>
            <div style={{ fontSize: 42, fontWeight: 900, color: '#f8fafc', marginBottom: 4 }}>$0</div>
            <div style={{ fontSize: 13, color: '#475569', marginBottom: 24 }}>3 scans per day</div>
            {['Score + grade', 'Severity breakdown', 'Category overview', 'Email capture'].map(f => (
              <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, fontSize: 13, color: '#94a3b8' }}>
                <span style={{ color: '#4ade80' }}>✓</span> {f}
              </div>
            ))}
            <button style={{
              width: '100%', marginTop: 20, padding: '12px 0', borderRadius: 12,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>Current plan</button>
          </div>

          {/* Starter */}
          <div className="enter-up d-1" style={{
            background: 'linear-gradient(135deg, rgba(199,5,45,0.08), rgba(155,4,35,0.05))',
            border: '1.5px solid rgba(199,5,45,0.35)',
            borderRadius: 20, padding: '32px 28px', position: 'relative',
            boxShadow: '0 0 40px rgba(199,5,45,0.1)',
          }}>
            <span style={{ position: 'absolute', top: -10, right: 20, fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 999, background: 'linear-gradient(135deg, #C7052D, #9B0423)', color: '#fff', letterSpacing: '0.05em' }}>POPULAR</span>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#E6BCC5', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Starter</div>
            <div style={{ fontSize: 42, fontWeight: 900, color: '#f8fafc', marginBottom: 4 }}>$49</div>
            <div style={{ fontSize: 13, color: '#475569', marginBottom: 24 }}>one-time · single page</div>
            {['Everything in Free', 'Full issue details', 'Fix code snippets', 'PDF report download', 'AI explanations (AR + EN)', 'Re-scan after fix'].map(f => (
              <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, fontSize: 13, color: '#E6BCC5' }}>
                <span style={{ color: '#E6BCC5' }}>✓</span> {f}
              </div>
            ))}
            <button className="btn-primary" style={{ width: '100%', marginTop: 20 }}>Get started</button>
          </div>

          {/* Pro */}
          <div className="enter-up d-2" style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20, padding: '32px 28px',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Pro</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 42, fontWeight: 900, color: '#f8fafc' }}>$199</span>
              <span style={{ fontSize: 14, color: '#475569' }}>/mo</span>
            </div>
            <div style={{ fontSize: 13, color: '#475569', marginBottom: 24 }}>up to 100 pages</div>
            {['Everything in Starter', 'Full-site crawl', 'Mobile + Desktop', 'Competitor comparison', 'Monthly re-scans', 'Priority support'].map(f => (
              <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, fontSize: 13, color: '#94a3b8' }}>
                <span style={{ color: '#4ade80' }}>✓</span> {f}
              </div>
            ))}
            <button style={{
              width: '100%', marginTop: 20, padding: '12px 0', borderRadius: 12,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>Contact sales</button>
          </div>
        </div>
      </section>

      {/* ═══ CTA ══════════════════════════════════════════════ */}
      <section style={{ paddingBottom: 96, textAlign: 'center' }}>
        <div className="enter-up" style={{
          background: 'linear-gradient(135deg, rgba(199,5,45,0.1), rgba(155,4,35,0.06))',
          border: '1px solid rgba(199,5,45,0.25)',
          borderRadius: 28, padding: '56px 32px',
          boxShadow: '0 0 60px rgba(199,5,45,0.08)',
        }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.5px', marginBottom: 12 }}>
            Stop losing Arabic customers
          </h2>
          <p style={{ fontSize: 16, color: '#64748b', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.7 }}>
            78% of GCC traffic is mobile. If your Arabic UX is broken, you are losing revenue every day. Find out in 60 seconds.
          </p>
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="btn-primary" style={{ display: 'inline-flex', padding: '14px 36px', fontSize: 16 }}>
            Scan your website now →
          </a>
        </div>
      </section>
    </main>
  );
}
