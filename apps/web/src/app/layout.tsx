import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { AuthButtons } from '../components/auth/auth-buttons';
import { LocaleSwitcher } from '../components/layout/locale-switcher';

export const metadata: Metadata = {
  title: 'DesignSprint™ — Arabic UX Audit',
  description: 'Audit any website for Arabic RTL quality. Get a scored report across 8 categories with fix suggestions.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'DesignSprint™ — Arabic UX Audit',
    description: 'Is your website ready for Arabic users? Get a 100-point Arabic UX score in under 60 seconds.',
    type: 'website',
    siteName: 'DesignSprint™',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DesignSprint™ — Arabic UX Audit',
    description: 'Scored report across 8 Arabic UX categories. Free scan, no signup required.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Providers>
        {/* ── Ambient background ───────────────────────────── */}
        <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: -1, overflow: 'hidden', pointerEvents: 'none' }}>
          {/* Orbs — brand red tones */}
          <div className="orb" style={{
            width: 700, height: 700, top: -200, left: -200,
            background: 'radial-gradient(circle, rgba(199,5,45,0.15) 0%, transparent 70%)',
            animationDuration: '16s',
          }} />
          <div className="orb" style={{
            width: 560, height: 560, top: '40%', right: -180,
            background: 'radial-gradient(circle, rgba(155,4,35,0.12) 0%, transparent 70%)',
            animationDuration: '20s', animationDelay: '-5s',
          }} />
          <div className="orb" style={{
            width: 440, height: 440, bottom: -160, left: '35%',
            background: 'radial-gradient(circle, rgba(230,188,197,0.08) 0%, transparent 70%)',
            animationDuration: '18s', animationDelay: '-10s',
          }} />
          {/* Dot grid */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
          }} />
        </div>

        {/* ── Navigation ───────────────────────────────────── */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(26,26,46,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Logo */}
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'linear-gradient(135deg, #C7052D, #9B0423)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px',
                boxShadow: '0 2px 8px rgba(199,5,45,0.4)',
                flexShrink: 0,
              }}>DS</div>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>DesignSprint</span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 6px',
                background: 'rgba(199,5,45,0.15)', border: '1px solid rgba(199,5,45,0.3)',
                color: '#E6BCC5', borderRadius: 6, letterSpacing: '0.05em',
              }}>™</span>
            </a>

            {/* Right side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span className="arabic" style={{ fontSize: 13, color: '#64748b', display: 'none' }}>
                تدقيق تجربة المستخدم العربية
              </span>
              <style>{`@media(min-width:640px){ .nav-arabic { display: block !important; } }`}</style>
              <span className="nav-arabic arabic" style={{ fontSize: 13, color: '#64748b', display: 'none' }}>
                تدقيق تجربة المستخدم العربية
              </span>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontWeight: 600, color: '#4ade80',
                background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)',
                padding: '5px 12px', borderRadius: 999,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s ease infinite' }} />
                API Live
              </div>
              <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <a href="/methodology" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', padding: '4px 8px' }}>Methodology</a>
                <a href="/pricing" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', padding: '4px 8px' }}>Pricing</a>
              </nav>
              <LocaleSwitcher />
              <AuthButtons />
            </div>
          </div>
        </header>

        {/* ── Page content ─────────────────────────────────── */}
        {children}

        {/* ── Footer ───────────────────────────────────────── */}
        <footer style={{ marginTop: 96, borderTop: '1px solid rgba(255,255,255,0.06)', padding: '48px 24px 32px' }}>
          <div style={{ maxWidth: 1152, margin: '0 auto' }}>
            {/* Top row — 4 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32, marginBottom: 40 }}>
              {/* Brand */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #C7052D, #9B0423)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff' }}>DS</div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>DesignSprint™</span>
                </div>
                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>Automated Arabic UX auditing. 8 categories. 100-point score. Fix code included.</p>
                <p className="arabic" style={{ fontSize: 12, color: '#334155', marginTop: 8 }}>صُنع بعناية للويب العربي</p>
              </div>

              {/* Product */}
              <div>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Product</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <a href="/" style={{ fontSize: 13, color: '#475569', textDecoration: 'none' }}>Free Scan</a>
                  <a href="/methodology" style={{ fontSize: 13, color: '#475569', textDecoration: 'none' }}>Methodology</a>
                  <a href="/pricing" style={{ fontSize: 13, color: '#475569', textDecoration: 'none' }}>Pricing</a>
                  <a href="/dashboard" style={{ fontSize: 13, color: '#475569', textDecoration: 'none' }}>Dashboard</a>
                </div>
              </div>

              {/* Resources */}
              <div>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Resources</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <a href="/methodology" style={{ fontSize: 13, color: '#475569', textDecoration: 'none' }}>Scoring Guide</a>
                  <a href="https://github.com/zunaair/designsprint" style={{ fontSize: 13, color: '#475569', textDecoration: 'none' }}>GitHub</a>
                </div>
              </div>

              {/* Company */}
              <div>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Company</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 13, color: '#475569' }}>Pixelette Technologies</span>
                  <a href="mailto:hello@pixelettetech.com" style={{ fontSize: 13, color: '#475569', textDecoration: 'none' }}>hello@pixelettetech.com</a>
                  <span style={{ fontSize: 13, color: '#475569' }}>GCC Region</span>
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <p style={{ fontSize: 12, color: '#334155' }}>© 2026 DesignSprint™ by Pixelette Technologies. All rights reserved.</p>
              <p style={{ fontSize: 12, color: '#334155' }}>Free tier: 3 scans / day · 8 categories · 100 points</p>
            </div>
          </div>
        </footer>
        </Providers>
      </body>
    </html>
  );
}
