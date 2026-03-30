import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing — DesignSprint™',
  description: 'Audit your website for Arabic UX quality. Plans from $0 to enterprise.',
};

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'See your score and issue count. Email required for lead capture.',
    cta: 'Start Free Scan',
    href: '/',
    popular: false,
    features: [
      'Score + severity breakdown',
      '3 scans / day',
      'Single page',
      'Desktop + Mobile',
    ],
    locked: [
      'Issue details + code locations',
      'Fix suggestions',
      'PDF report',
      'Full-site crawl',
      'Competitor comparison',
    ],
  },
  {
    name: 'Starter',
    price: '$49',
    period: 'one-time',
    desc: 'Full audit with all issue details, fix code, and branded PDF report.',
    cta: 'Get Started',
    href: '/#scan',
    popular: true,
    features: [
      'Everything in Free',
      'All issue details + code locations',
      'Fix suggestions with diff snippets',
      'Branded PDF report download',
      'Re-scan after fix to verify',
      '20 scans / day',
    ],
    locked: [
      'Full-site crawl (100 pages)',
      'Competitor comparison',
      'Monthly re-scan',
    ],
  },
  {
    name: 'Pro',
    price: '$199',
    period: '/month',
    desc: 'Full-site crawl, competitor comparison, monthly re-scans, API access.',
    cta: 'Go Pro',
    href: '/#scan',
    popular: false,
    features: [
      'Everything in Starter',
      'Full-site crawl (100 pages)',
      'Competitor comparison (up to 3)',
      'Monthly automated re-scan',
      '100 scans / day',
      'Score trend tracking',
      'Priority support',
    ],
    locked: [],
  },
];

export default function PricingPage() {
  return (
    <main className="container" style={{ paddingTop: 60, paddingBottom: 80 }}>
      {/* Header */}
      <div className="enter-up" style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ fontSize: 40, fontWeight: 900, color: '#f8fafc', letterSpacing: '-1.5px' }}>
          Simple, <span className="gradient-text">Transparent</span> Pricing
        </h1>
        <p style={{ fontSize: 16, color: '#64748b', marginTop: 12 }}>
          Start free. Upgrade when you need full details and fix suggestions.
        </p>
      </div>

      {/* Plan cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, maxWidth: 960, margin: '0 auto' }}>
        {PLANS.map((plan, i) => (
          <div key={plan.name} className="enter-up glass-card" style={{
            animationDelay: `${(i + 1) * 100}ms`,
            padding: '32px 28px',
            position: 'relative',
            border: plan.popular ? '2px solid rgba(199,5,45,0.5)' : undefined,
            boxShadow: plan.popular ? '0 0 40px rgba(199,5,45,0.12)' : undefined,
          }}>
            {plan.popular && (
              <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 999, background: '#C7052D', color: '#fff', letterSpacing: '0.05em' }}>
                MOST POPULAR
              </div>
            )}

            <div style={{ fontSize: 13, fontWeight: 700, color: '#E6BCC5', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
              {plan.name}
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
              <span style={{ fontSize: 40, fontWeight: 900, color: '#f8fafc' }}>{plan.price}</span>
              <span style={{ fontSize: 14, color: '#64748b' }}>{plan.period}</span>
            </div>

            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>{plan.desc}</p>

            <a href={plan.href} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '100%', height: 44, borderRadius: 10, textDecoration: 'none',
              fontSize: 14, fontWeight: 700, color: '#fff',
              background: plan.popular ? 'linear-gradient(135deg, #C7052D, #9B0423)' : 'rgba(255,255,255,0.06)',
              border: plan.popular ? 'none' : '1px solid rgba(255,255,255,0.12)',
              boxShadow: plan.popular ? '0 4px 20px rgba(199,5,45,0.35)' : 'none',
            }}>
              {plan.cta}
            </a>

            {/* Features */}
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {plan.features.map((f) => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#94a3b8' }}>
                  <span style={{ color: '#22C55E', flexShrink: 0, marginTop: 1 }}>✓</span>
                  {f}
                </div>
              ))}
              {plan.locked.map((f) => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155' }}>
                  <span style={{ flexShrink: 0, marginTop: 1 }}>🔒</span>
                  {f}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Enterprise */}
      <div className="enter-up glass-card" style={{ animationDelay: '500ms', marginTop: 32, padding: '32px 40px', maxWidth: 960, margin: '32px auto 0', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>Enterprise</div>
          <p style={{ fontSize: 14, color: '#64748b', maxWidth: 500 }}>
            Unlimited pages. API access. White-label reports. SSO. CI/CD integration. Custom pricing.
          </p>
        </div>
        <a href="mailto:hello@pixelettetech.com" style={{ padding: '12px 28px', borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none', color: '#f8fafc', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
          Contact Sales
        </a>
      </div>
    </main>
  );
}
