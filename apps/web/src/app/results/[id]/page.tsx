'use client';

import { useEffect, useRef, useState } from 'react';
import type { IScanResult, IAuditResult, CategoryScore } from '@designsprint/shared';
import { useAuth } from '@clerk/nextjs';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

/* ── Free-tier gate ───────────────────────────────────────── */
// The API now enforces tier filtering server-side.
// IS_PRO is derived from the scan response: if issues[] arrays are present, the user has a paid tier.
function deriveIsPro(scanData: IScanResult | null): boolean {
  if (!scanData) return false;
  const audit = scanData.desktop ?? scanData.mobile;
  if (!audit?.categories?.[0]) return false;
  // Free tier responses have categories without issues[] property
  return 'issues' in audit.categories[0] && Array.isArray(audit.categories[0].issues);
}

/* ── Metadata ─────────────────────────────────────────────── */
const CAT_META: Record<string, { icon: string; label: string; desc: string }> = {
  direction:       { icon: '🧭', label: 'Direction',     desc: 'html[dir] and lang attributes' },
  'css-logical':   { icon: '📐', label: 'CSS Logical',   desc: 'Physical vs logical properties' },
  typography:      { icon: '✍️', label: 'Typography',    desc: 'Letter-spacing, line-height' },
  'layout-mirror': { icon: '🪞', label: 'Layout Mirror', desc: 'Nav order and icon flipping' },
  'mobile-rtl':    { icon: '📱', label: 'Mobile RTL',    desc: 'Flex/grid on 375px viewport' },
  'text-overflow': { icon: '✂️', label: 'Text Overflow', desc: 'Clipped Arabic characters' },
  bidi:            { icon: '↔️', label: 'BiDi Text',     desc: 'Mixed direction isolation' },
  'font-fallback': { icon: '🔤', label: 'Font Fallback', desc: 'Arabic-capable font stack' },
};

const GRADES = {
  poor:         { label: 'Poor',       color: '#ef4444', glow: 'rgba(239,68,68,0.4)',  bg: 'rgba(239,68,68,0.08)',  bd: 'rgba(239,68,68,0.25)' },
  'needs-work': { label: 'Needs Work', color: '#f97316', glow: 'rgba(249,115,22,0.4)', bg: 'rgba(249,115,22,0.08)', bd: 'rgba(249,115,22,0.25)' },
  good:         { label: 'Good',       color: '#22c55e', glow: 'rgba(34,197,94,0.4)',  bg: 'rgba(34,197,94,0.08)',  bd: 'rgba(34,197,94,0.25)' },
  excellent:    { label: 'Excellent',  color: '#06b6d4', glow: 'rgba(6,182,212,0.4)',  bg: 'rgba(6,182,212,0.08)',  bd: 'rgba(6,182,212,0.25)' },
};
type Grade = keyof typeof GRADES;

const SEV_ORDER = ['critical', 'major', 'minor', 'info'] as const;
const SEV: Record<string, { cls: string; label: string; color: string }> = {
  critical: { cls: 'sev-critical', label: 'Critical', color: '#fca5a5' },
  major:    { cls: 'sev-major',    label: 'Major',    color: '#fdba74' },
  minor:    { cls: 'sev-minor',    label: 'Minor',    color: '#fde68a' },
  info:     { cls: 'sev-info',     label: 'Info',     color: '#E6BCC5' },
};

function scoreColor(pct: number) {
  return pct >= 90 ? '#22c55e' : pct >= 70 ? '#06b6d4' : pct >= 40 ? '#f97316' : '#ef4444';
}

/* ── Score ring ───────────────────────────────────────────── */
function ScoreRing({ score, grade, size = 160 }: { score: number; grade: string; size?: number }) {
  const ref  = useRef<SVGCircleElement>(null);
  const g    = GRADES[grade as Grade] ?? GRADES['needs-work'];
  const cx   = size / 2;
  const r    = cx - 14;
  const circ = 2 * Math.PI * r;
  const target = circ - (score / 100) * circ;
  const textSize = size < 140 ? 20 : 30;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.strokeDashoffset = String(circ);
    const t = setTimeout(() => {
      el.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(0.16,1,0.3,1)';
      el.style.strokeDashoffset = String(target);
    }, 150);
    return () => clearTimeout(t);
  }, [circ, target]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ filter: `drop-shadow(0 0 ${size < 140 ? 12 : 22}px ${g.glow})` }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={size < 140 ? 8 : 11} />
          <circle ref={ref} cx={cx} cy={cx} r={r} fill="none"
            stroke={g.color} strokeWidth={size < 140 ? 8 : 11}
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ}
            transform={`rotate(-90 ${cx} ${cx})`}
          />
          <text x={cx} y={cx - 3} textAnchor="middle" fill="#f8fafc" fontSize={textSize} fontWeight="900" fontFamily="Manrope,sans-serif">{score}</text>
          <text x={cx} y={cx + (size < 140 ? 14 : 19)} textAnchor="middle" fill="#475569" fontSize={size < 140 ? 10 : 13} fontFamily="Manrope,sans-serif">/100</text>
        </svg>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 14px', borderRadius: 999, color: g.color, background: g.bg, border: `1px solid ${g.bd}`, letterSpacing: '0.02em' }}>
        {g.label}
      </span>
    </div>
  );
}

/* ── Mini bar ─────────────────────────────────────────────── */
function MiniBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(pct), 220); return () => clearTimeout(t); }, [pct]);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 12, color: '#64748b', width: 108, flexShrink: 0 }}>{label}</span>
      <div className="progress-track" style={{ flex: 1 }}>
        <div className="progress-fill" style={{ width: `${w}%`, background: color }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, width: 32, textAlign: 'right' }}>{pct}%</span>
    </div>
  );
}

/* ── Severity pill count ──────────────────────────────────── */
function SeverityDist({ issues }: { issues: CategoryScore['issues'] }) {
  const counts: Record<string, number> = {};
  for (const issue of issues) {
    counts[issue.severity] = (counts[issue.severity] ?? 0) + 1;
  }
  const active = SEV_ORDER.filter(s => (counts[s] ?? 0) > 0);
  if (active.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
      {active.map(s => (
        <span key={s} className={`badge ${SEV[s]!.cls}`}>
          {counts[s]} {SEV[s]!.label}
        </span>
      ))}
    </div>
  );
}

/* ── Paywall upgrade banner ───────────────────────────────── */
function PaywallBanner({ issueTotal }: { issueTotal: number }) {
  return (
    <div style={{
      margin: '28px 0',
      borderRadius: 20,
      border: '1px solid rgba(199,5,45,0.3)',
      background: 'linear-gradient(135deg, rgba(199,5,45,0.08) 0%, rgba(155,4,35,0.06) 100%)',
      overflow: 'hidden',
      boxShadow: '0 0 40px rgba(199,5,45,0.1)',
    }}>
      {/* Top strip */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, #C7052D, #9B0423, #E6BCC5)' }} />

      <div style={{ padding: '28px 32px', display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Left */}
        <div style={{ flex: '1 1 280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(199,5,45,0.15)', border: '1px solid rgba(199,5,45,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>🔒</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>Unlock your full report</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                {issueTotal} issues found · details hidden in free tier
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', marginBottom: 16 }}>
            {[
              '📋 All issue details + code locations',
              '💡 Fix suggestions with diff snippets',
              '📄 Branded PDF report download',
              '🔁 Re-scan after fix to verify',
              '🤖 AI-written explanations (Arabic + EN)',
              '📊 Score trend over time',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
                <span style={{ marginTop: 1 }}>{item}</span>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, color: '#334155' }}>
            One-time purchase · No subscription required for single-page audit
          </div>
        </div>

        {/* Right CTA */}
        <div style={{ flex: '0 0 auto', textAlign: 'center' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#E6BCC5', letterSpacing: '0.08em',
            textTransform: 'uppercase', marginBottom: 6,
          }}>Starter Plan</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#f8fafc', lineHeight: 1 }}>
            $49
          </div>
          <div style={{ fontSize: 12, color: '#475569', marginBottom: 20 }}>one-time · single page</div>

          <button style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: 200, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg, #C7052D 0%, #9B0423 100%)',
            color: '#fff', fontSize: 14, fontWeight: 700,
            border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(199,5,45,0.4)',
            transition: 'transform 0.18s, box-shadow 0.18s',
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(199,5,45,0.55)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = '';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(199,5,45,0.4)';
            }}
          >
            Unlock Full Report →
          </button>

          <div style={{ fontSize: 11, color: '#334155', marginTop: 10 }}>
            Also available: Pro ($199/mo) for full-site crawl
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Locked card overlay ──────────────────────────────────── */
function LockedOverlay({ count }: { count: number }) {
  return (
    <div style={{
      position: 'relative', borderRadius: 12, overflow: 'hidden',
      marginTop: 8,
    }}>
      {/* Blurred fake issues */}
      <div style={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none' }}>
        {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
          <div key={i} style={{
            marginBottom: 8, padding: '10px 12px', borderRadius: 12,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', gap: 8,
          }}>
            <div style={{ width: 56, height: 20, borderRadius: 999, background: 'rgba(249,115,22,0.25)' }} />
            <div style={{ flex: 1, height: 20, borderRadius: 6, background: 'rgba(255,255,255,0.07)' }} />
          </div>
        ))}
      </div>
      {/* Lock overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(8,8,15,0) 0%, rgba(8,8,15,0.85) 60%)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        paddingBottom: 12,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700,
          color: '#E6BCC5', background: 'rgba(199,5,45,0.15)',
          border: '1px solid rgba(199,5,45,0.3)',
          padding: '5px 12px', borderRadius: 999,
        }}>
          🔒 {count} issue{count !== 1 ? 's' : ''} hidden — unlock to view
        </div>
      </div>
    </div>
  );
}

/* ── Category card ────────────────────────────────────────── */
function CategoryCard({ cat, delay, isPro }: { cat: CategoryScore; delay: number; isPro: boolean }) {
  const [open, setOpen] = useState(false);
  const pct    = cat.maxScore > 0 ? Math.round((cat.score / cat.maxScore) * 100) : 100;
  const color  = scoreColor(pct);
  const meta   = CAT_META[cat.category] ?? { icon: '📋', label: cat.category, desc: '' };
  const noIssues = cat.issueCount === 0;

  return (
    <div className="enter-up" style={{
      animationDelay: `${delay}ms`,
      background: 'rgba(255,255,255,0.035)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 18, overflow: 'hidden',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    }}>
      {/* Top accent */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${color}, ${color}22)` }} />

      <div style={{ padding: '20px 22px 22px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12, flexShrink: 0,
              background: `${color}12`, border: `1px solid ${color}28`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>{meta.icon}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{meta.label}</div>
              <div style={{ fontSize: 11, color: noIssues ? '#4ade80' : '#94a3b8', marginTop: 2 }}>
                {noIssues
                  ? <><span>✓</span> No issues found</>
                  : <>{cat.issueCount} issue{cat.issueCount !== 1 ? 's' : ''} found</>
                }
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right', paddingTop: 2 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#f8fafc' }}>{cat.score}</span>
            <span style={{ fontSize: 13, color: '#334155' }}>/{cat.maxScore}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-track" style={{ marginBottom: 12, height: 7 }}>
          <div className="progress-fill" style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            boxShadow: `0 0 8px ${color}50`,
          }} />
        </div>

        {/* Score pct pill */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, color, background: `${color}12`, border: `1px solid ${color}26` }}>
            {pct}%
          </span>
          {isPro && cat.issues.length > 0 && (
            <button
              onClick={() => setOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 12, color: '#64748b', background: 'none', border: 'none',
                cursor: 'pointer', padding: '3px 0', transition: 'color 0.18s',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#94a3b8')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#64748b')}
            >
              {open ? 'Hide' : `Show ${cat.issues.length} issue${cat.issues.length !== 1 ? 's' : ''}`}
              <span style={{ display: 'inline-block', transition: 'transform 0.22s', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
            </button>
          )}
        </div>

        {/* Zero-issue celebration */}
        {noIssues && cat.maxScore > 0 && (
          <div style={{
            padding: '10px 14px', borderRadius: 12,
            background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.2)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>🎉</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#4ade80' }}>Perfect score!</div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 1 }}>{meta.desc}</div>
            </div>
          </div>
        )}

        {/* Severity distribution — always visible */}
        {cat.issueCount > 0 && <SeverityDist issues={cat.issues} />}

        {/* PRO: expandable issue list */}
        {isPro && (
          <div className={`expandable ${open ? 'open' : ''}`}>
            <div className="expandable-inner">
              <div style={{ paddingBottom: 4 }}>
                {cat.issues.map((issue, i) => {
                  const sev = SEV[issue.severity] ?? SEV['info']!;
                  return (
                    <div key={i} style={{
                      marginBottom: 8, padding: '10px 12px', borderRadius: 12,
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: issue.details ? 6 : 0 }}>
                        <span className={`badge ${sev.cls}`} style={{ flexShrink: 0, marginTop: 1 }}>{sev.label}</span>
                        <span style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 500, lineHeight: 1.45 }}>{issue.message}</span>
                      </div>
                      {issue.details && (
                        <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.6, marginTop: 4 }}>{issue.details}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* FREE: locked overlay */}
        {!isPro && cat.issueCount > 0 && (
          <LockedOverlay count={cat.issueCount} />
        )}

        {/* PRO: Fix suggestions */}
        {isPro && cat.fixes.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, marginTop: open ? 8 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 14 }}>💡</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>Suggested fix</span>
              <span style={{ marginLeft: 'auto', fontSize: 9, color: '#334155', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>
                {cat.fixes[0]?.type}
              </span>
            </div>
            <div className="diff-remove" style={{ marginBottom: 5 }}>
              <span style={{ color: '#ef4444', userSelect: 'none', marginRight: 8 }}>−</span>
              {cat.fixes[0]?.before}
            </div>
            <div className="diff-add">
              <span style={{ color: '#22c55e', userSelect: 'none', marginRight: 8 }}>+</span>
              {cat.fixes[0]?.after}
            </div>
            {cat.fixes.length > 1 && (
              <p style={{ fontSize: 11, color: '#334155', marginTop: 8 }}>
                +{cat.fixes.length - 1} more suggestion{cat.fixes.length > 2 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {/* FREE: locked fix teaser */}
        {!isPro && cat.fixes.length > 0 && (
          <div style={{
            marginTop: 14,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: 14,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 13 }}>💡</span>
            <span style={{ fontSize: 12, color: '#334155' }}>Fix suggestions available</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#C7052D', background: 'rgba(199,5,45,0.1)', border: '1px solid rgba(199,5,45,0.25)', padding: '3px 8px', borderRadius: 6 }}>
              🔒 Pro
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── PDF button ───────────────────────────────────────────── */
function PDFButton({ isPro }: { isPro: boolean }) {
  return (
    <button
      disabled={!isPro}
      title={isPro ? 'Download PDF report' : 'Unlock to download PDF report'}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        height: 38, padding: '0 16px', borderRadius: 10,
        fontSize: 13, fontWeight: 600,
        background: isPro ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isPro ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
        color: isPro ? '#94a3b8' : '#334155',
        cursor: isPro ? 'pointer' : 'not-allowed',
        transition: 'background 0.18s, border-color 0.18s',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 16 }}>📄</span>
      {isPro ? 'Export PDF' : '🔒 PDF'}
    </button>
  );
}

/* ── Audit view ───────────────────────────────────────────── */
function AuditView({ result, isPro }: { result: IAuditResult; isPro: boolean }) {
  const g          = GRADES[result.grade as Grade] ?? GRADES['needs-work'];
  const issueTotal = result.categories.reduce((s, c) => s + c.issueCount, 0);
  const passedCats = result.categories.filter(c => c.issueCount === 0 && c.maxScore > 0).length;

  return (
    <div className="enter-fade">
      {/* Summary card */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 22, padding: '28px 32px',
        marginBottom: 0,
        display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'center',
        boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
      }}>
        <ScoreRing score={result.totalScore} grade={result.grade} size={160} />

        <div style={{ flex: 1, minWidth: 220 }}>
          {/* Grade + meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, color: g.color, background: g.bg, border: `1px solid ${g.bd}` }}>
              {g.label}
            </span>
            <span style={{ fontSize: 13, color: '#334155' }}>
              {passedCats}/{result.categories.filter(c => c.maxScore > 0).length} categories passed
            </span>
            <div style={{ marginLeft: 'auto' }}>
              <PDFButton isPro={isPro} />
            </div>
          </div>

          <div style={{ fontSize: 30, fontWeight: 900, color: '#f8fafc', marginBottom: 4 }}>
            {result.totalScore}
            <span style={{ fontSize: 16, color: '#334155', fontWeight: 500 }}> / 100</span>
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
            Scanned {new Date(result.scannedAt).toLocaleTimeString()} · {issueTotal} issue{issueTotal !== 1 ? 's' : ''} found
          </div>

          {/* Mini bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {result.categories.filter(c => c.maxScore > 0).map(cat => {
              const pct  = Math.round((cat.score / cat.maxScore) * 100);
              const meta = CAT_META[cat.category] ?? { icon: '📋', label: cat.category, desc: '' };
              return <MiniBar key={cat.category} label={meta.label} pct={pct} color={scoreColor(pct)} />;
            })}
          </div>
        </div>
      </div>

      {/* Paywall banner (free tier only, when there are issues) */}
      {!isPro && issueTotal > 0 && <PaywallBanner issueTotal={issueTotal} />}

      {/* Category grid */}
      <div className="results-grid" style={{ marginTop: isPro ? 24 : 0 }}>
        {result.categories.map((cat, i) => (
          <CategoryCard key={cat.category} cat={cat} delay={i * 50} isPro={isPro} />
        ))}
      </div>
    </div>
  );
}

/* ── Skeleton ─────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div>
      <div style={{ display: 'flex', gap: 28, alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '28px 32px', marginBottom: 24, border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="skeleton" style={{ width: 160, height: 160, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 18, width: 100, marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 34, width: 80, marginBottom: 20 }} />
          {[100, 80, 120, 90, 70, 110, 60].map((w, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 7 }}>
              <div className="skeleton" style={{ height: 10, width: 100 }} />
              <div className="skeleton" style={{ height: 6, flex: 1, borderRadius: 999 }} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {[150, 130, 170, 140, 160, 120, 155, 145].map((h, i) => (
          <div key={i} className="skeleton" style={{ height: h, borderRadius: 18 }} />
        ))}
      </div>
    </div>
  );
}

/* ── Running steps ────────────────────────────────────────── */
const STEPS = [
  'Launching Chromium browser',
  'Loading page in Arabic locale (ar-SA)',
  'Waiting for fonts to load',
  'Running direction checks',
  'Running CSS logical property checks',
  'Running typography checks',
  'Running layout mirror checks',
  'Running mobile RTL checks',
  'Running BiDi & text overflow checks',
  'Computing scores and generating report',
];

function RunningView({ elapsed }: { elapsed: number }) {
  const active   = Math.min(Math.floor(elapsed / 5), STEPS.length - 1);
  const progress = Math.min((elapsed / (STEPS.length * 5)) * 100, 97);

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
      {/* Spinner */}
      <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 24px' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid rgba(199,5,45,0.15)' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid transparent', borderTopColor: '#C7052D', animation: 'spin 0.85s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>🔍</div>
      </div>

      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', marginBottom: 6 }}>Auditing your website…</h3>
      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Running all 8 Arabic UX checks with real browser rendering</p>

      {/* Progress bar */}
      <div className="progress-track" style={{ marginBottom: 28, height: 6 }}>
        <div className="progress-fill" style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #C7052D, #9B0423)',
          boxShadow: '0 0 10px rgba(199,5,45,0.5)',
          transition: 'width 1s var(--ease-smooth)',
        }} />
      </div>

      {/* Steps */}
      <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '16px 20px' }}>
        {STEPS.map((s, i) => {
          const done    = i < active;
          const current = i === active;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0',
              opacity: i > active + 2 ? 0.25 : 1,
              transition: 'opacity 0.4s',
            }}>
              <span style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? 'rgba(74,222,128,0.15)' : current ? 'rgba(199,5,45,0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${done ? 'rgba(74,222,128,0.35)' : current ? 'rgba(199,5,45,0.45)' : 'rgba(255,255,255,0.08)'}`,
                fontSize: done ? 11 : 7,
                color: done ? '#4ade80' : current ? '#E6BCC5' : '#334155',
                transition: 'all 0.3s',
              }}>
                {done ? '✓' : current
                  ? <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C7052D', animation: 'pulse 1.2s ease infinite' }} />
                  : ''}
              </span>
              <span style={{ fontSize: 13, color: done ? '#4ade80' : current ? '#E6BCC5' : '#334155', fontWeight: current ? 600 : 400, transition: 'color 0.3s' }}>
                {s}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function ResultsPage({ params }: { params: { id: string } }) {
  const { id }  = params;
  const [scan, setScan]       = useState<IScanResult | null>(null);
  const [err, setErr]         = useState('');
  const [tab, setTab]         = useState<'desktop' | 'mobile'>('desktop');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Get Clerk auth token — always called unconditionally (ClerkProvider always wraps)
  const { getToken } = useAuth();

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const token = await getToken();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res  = await fetch(`${API_URL}/api/scans/${id}`, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as IScanResult;
        if (!cancelled) {
          setScan(data);
          if (data.status === 'pending' || data.status === 'running') {
            setTimeout(() => { void poll(); }, 3000);
          }
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Failed to load scan');
      }
    }
    void poll();
    return () => { cancelled = true; };
  }, [id, getToken]);

  const statusStyle = (): React.CSSProperties => {
    if (scan?.status === 'completed') return { color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)' };
    if (scan?.status === 'failed')    return { color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)' };
    return { color: '#E6BCC5', background: 'rgba(199,5,45,0.1)', border: '1px solid rgba(199,5,45,0.3)' };
  };

  if (err) return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>😞</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>Could not load scan</h2>
      <p style={{ fontSize: 14, color: '#ef4444', marginBottom: 24 }}>{err}</p>
      <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 12, textDecoration: 'none', fontSize: 14, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, #C7052D, #9B0423)', boxShadow: '0 4px 20px rgba(199,5,45,0.4)' }}>
        ← Run a new scan
      </a>
    </main>
  );

  if (!scan) return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 40 }}>
      <Skeleton />
    </main>
  );

  const pending = scan.status === 'pending' || scan.status === 'running';

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>

      {/* ── Scan header ──────────────────────────────────── */}
      <div className="enter-up d-0" style={{ marginBottom: 28 }}>
        <a href="/"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569', textDecoration: 'none', marginBottom: 16, transition: 'color 0.18s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
        >
          ← New scan
        </a>

        <div style={{
          background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '18px 24px',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 6, ...statusStyle() }}>
                {pending && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E6BCC5', animation: 'pulse 1.5s ease infinite' }} />}
                {scan.status.charAt(0).toUpperCase() + scan.status.slice(1)}
              </span>
              <code style={{ fontSize: 11, color: '#1e293b', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.07)' }}>
                #{scan.id.slice(-8)}
              </code>
              {!deriveIsPro(scan) && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, color: '#94a3b8', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', letterSpacing: '0.05em' }}>
                  FREE TIER
                </span>
              )}
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', wordBreak: 'break-all', lineHeight: 1.4 }}>{scan.url}</h1>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: '#334155', marginBottom: 3 }}>Started</div>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{new Date(scan.createdAt).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* ── Running ──────────────────────────────────────── */}
      {pending && (
        <div className="enter-fade" style={{ paddingTop: 20, paddingBottom: 40 }}>
          <RunningView elapsed={elapsed} />
        </div>
      )}

      {/* ── Failed ───────────────────────────────────────── */}
      {scan.status === 'failed' && (
        <div className="enter-fade" style={{
          background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 20, padding: '48px 32px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>💥</div>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#fca5a5', marginBottom: 8 }}>Scan failed</p>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 28 }}>{scan.error ?? 'An unexpected error occurred. The URL may be unreachable or blocked.'}</p>
          <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 12, textDecoration: 'none', fontSize: 14, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, #C7052D, #9B0423)' }}>
            ← Try again
          </a>
        </div>
      )}

      {/* ── Completed ────────────────────────────────────── */}
      {scan.status === 'completed' && (
        <>
          {/* Viewport tabs */}
          {scan.desktop && scan.mobile && (
            <div className="tab-strip enter-up d-1" style={{ marginBottom: 24 }}>
              {(['desktop', 'mobile'] as const).map(v => {
                const active = tab === v;
                const s = v === 'desktop' ? scan.desktop?.totalScore : scan.mobile?.totalScore;
                return (
                  <button key={v} onClick={() => setTab(v)} className={`tab-item ${active ? 'tab-active' : ''}`}>
                    <span>{v === 'desktop' ? '🖥' : '📱'}</span>
                    <span>{v === 'desktop' ? 'Desktop' : 'Mobile'}</span>
                    {s !== undefined && (
                      <span style={{
                        fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 999,
                        background: active ? 'rgba(199,5,45,0.25)' : 'rgba(255,255,255,0.06)',
                        color: active ? '#E6BCC5' : '#475569',
                      }}>{s}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {tab === 'desktop' && scan.desktop && <AuditView result={scan.desktop} isPro={deriveIsPro(scan)} />}
          {tab === 'mobile'  && scan.mobile  && <AuditView result={scan.mobile}  isPro={deriveIsPro(scan)} />}
          {!scan.desktop && scan.mobile  && <AuditView result={scan.mobile}  isPro={deriveIsPro(scan)} />}
          {scan.desktop  && !scan.mobile && <AuditView result={scan.desktop} isPro={deriveIsPro(scan)} />}
        </>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </main>
  );
}
