import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scoring Methodology — DesignSprint™',
  description: 'How we score Arabic UX quality across 8 categories totalling 100 points.',
};

const CATEGORIES = [
  { id: 'direction', label: 'HTML Direction', pts: 20, icon: '🧭', desc: 'Checks for dir="rtl" and lang="ar" on the <html> element. Without these, the browser defaults to LTR layout and screen readers cannot identify Arabic content.', checks: ['dir="rtl" on <html>', 'lang="ar" on <html>', 'No dir="ltr" override on <body>'] },
  { id: 'css-logical', label: 'CSS Logical Properties', pts: 20, icon: '📐', desc: 'Detects physical CSS properties (margin-left, padding-right, float, text-align) that should use logical equivalents (margin-inline-start, etc.) for correct RTL rendering.', checks: ['margin-left → margin-inline-start', 'padding-right → padding-inline-end', 'float: left → float: inline-start', 'text-align: left → text-align: start'] },
  { id: 'typography', label: 'Arabic Typography', pts: 15, icon: '✍️', desc: 'Arabic letterforms are connected — any letter-spacing > 0 breaks word rendering. Line-height must be ≥ 1.6 for Arabic text readability. Underlines interfere with Arabic diacritics.', checks: ['letter-spacing: 0 for Arabic text', 'line-height ≥ 1.6', 'No underline on Arabic text', 'Appropriate font-size'] },
  { id: 'layout-mirror', label: 'Layout Mirroring', pts: 15, icon: '🪞', desc: 'Navigation, sidebars, and directional icons must be mirrored for RTL. Back arrows should point right, not left. Progress bars should fill from right to left.', checks: ['Navigation order reversed', 'Sidebar position mirrored', 'Directional icons flipped (scaleX(-1))', 'Breadcrumb separator direction'] },
  { id: 'mobile-rtl', label: 'Mobile RTL', pts: 15, icon: '📱', desc: '78% of GCC traffic is mobile. Flex/grid direction, text alignment, and touch targets must work correctly at 375×812 viewport.', checks: ['Flex direction correct in RTL', 'Grid layout mirrors properly', 'Text alignment on mobile', 'No horizontal overflow'] },
  { id: 'bidi', label: 'BiDi Handling', pts: 10, icon: '↔️', desc: 'Mixed Arabic+English content needs Unicode Bidi isolation. Form inputs with Arabic labels need dir attributes. Phone numbers and email addresses must not break RTL flow.', checks: ['<bdi> tags for mixed content', 'dir="auto" on form inputs', 'Isolated LTR strings (URLs, emails)', 'Correct punctuation placement'] },
  { id: 'text-overflow', label: 'Text Overflow', pts: 5, icon: '✂️', desc: 'Arabic text is typically 20-30% wider than English. Buttons, navigation items, and badges must accommodate the extra width without clipping.', checks: ['No text clipping in buttons', 'Navigation items not truncated', 'Badge text fits container', 'Tooltip text visible'] },
  { id: 'font-fallback', label: 'Font Fallback', pts: 0, icon: '🔤', desc: 'Verifies that an Arabic-capable font exists in the font-family chain. Without one, the browser uses a system fallback that may render poorly. Issues are penalised within the Typography score.', checks: ['Arabic font in font-family stack', 'Noto Sans Arabic / Tajawal / Cairo available', 'Font loading verified'] },
];

const THRESHOLDS = [
  { grade: 'Poor', range: '0–39', color: '#EF4444', bg: 'rgba(239,68,68,0.08)', bd: 'rgba(239,68,68,0.25)' },
  { grade: 'Needs Work', range: '40–69', color: '#F97316', bg: 'rgba(249,115,22,0.08)', bd: 'rgba(249,115,22,0.25)' },
  { grade: 'Good', range: '70–89', color: '#EAB308', bg: 'rgba(234,179,8,0.08)', bd: 'rgba(234,179,8,0.25)' },
  { grade: 'Excellent', range: '90–100', color: '#22C55E', bg: 'rgba(34,197,94,0.08)', bd: 'rgba(34,197,94,0.25)' },
];

export default function MethodologyPage() {
  return (
    <main className="container" style={{ paddingTop: 60, paddingBottom: 80 }}>
      {/* Header */}
      <div className="enter-up" style={{ textAlign: 'center', marginBottom: 56 }}>
        <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 14px', borderRadius: 999, color: '#C7052D', background: 'rgba(199,5,45,0.1)', border: '1px solid rgba(199,5,45,0.25)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Transparent Scoring
        </span>
        <h1 style={{ fontSize: 40, fontWeight: 900, color: '#f8fafc', marginTop: 20, letterSpacing: '-1.5px', lineHeight: 1.15 }}>
          How We Score <span className="gradient-text">Arabic UX</span>
        </h1>
        <p style={{ fontSize: 16, color: '#64748b', maxWidth: 600, margin: '16px auto 0', lineHeight: 1.7 }}>
          Every website is evaluated across 8 categories totalling 100 points. Our methodology is fully public — transparency builds trust.
        </p>
      </div>

      {/* Grade thresholds */}
      <div className="enter-up d-1" style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 48 }}>
        {THRESHOLDS.map((t) => (
          <div key={t.grade} style={{ padding: '10px 20px', borderRadius: 12, background: t.bg, border: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: t.color }}>{t.range}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: t.color }}>{t.grade}</span>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {CATEGORIES.map((cat, i) => (
          <div key={cat.id} className="enter-up glass-card" style={{ animationDelay: `${(i + 2) * 70}ms`, padding: '28px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
              {/* Icon + title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 300px' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(199,5,45,0.08)', border: '1px solid rgba(199,5,45,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {cat.icon}
                </div>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: '#f8fafc', margin: 0 }}>{cat.label}</h2>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#C7052D' }}>{cat.pts} points</span>
                </div>
              </div>

              {/* Score badge */}
              <div style={{ fontSize: 28, fontWeight: 900, color: '#f8fafc', opacity: 0.15, flexShrink: 0 }}>
                {cat.pts}
              </div>
            </div>

            <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7, marginTop: 14, marginBottom: 16 }}>
              {cat.desc}
            </p>

            {/* What we check */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {cat.checks.map((check) => (
                <span key={check} style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}>
                  {check}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="enter-up" style={{ animationDelay: '900ms', textAlign: 'center', marginTop: 48, padding: '32px', background: 'rgba(199,5,45,0.06)', border: '1px solid rgba(199,5,45,0.2)', borderRadius: 20 }}>
        <div style={{ fontSize: 48, fontWeight: 900, color: '#C7052D' }}>100</div>
        <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>Total Points · 8 Categories · Dual Viewport (Desktop + Mobile)</div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', marginTop: 40 }}>
        <a href="/" className="btn-primary" style={{ display: 'inline-flex', width: 'auto', padding: '0 32px' }}>
          Run a Free Audit →
        </a>
      </div>
    </main>
  );
}
