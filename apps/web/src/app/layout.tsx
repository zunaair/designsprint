import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DesignSprint™ — Arabic UX Audit',
  description: 'Audit any website for Arabic RTL quality. Get a scored report across 8 categories with fix suggestions.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {/* ── Ambient background ───────────────────────────── */}
        <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: -1, overflow: 'hidden', pointerEvents: 'none' }}>
          {/* Orbs */}
          <div className="orb" style={{
            width: 700, height: 700, top: -200, left: -200,
            background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
            animationDuration: '16s',
          }} />
          <div className="orb" style={{
            width: 560, height: 560, top: '40%', right: -180,
            background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)',
            animationDuration: '20s', animationDelay: '-5s',
          }} />
          <div className="orb" style={{
            width: 440, height: 440, bottom: -160, left: '35%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)',
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
          background: 'rgba(8,8,15,0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Logo */}
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px',
                boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
                flexShrink: 0,
              }}>DS</div>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>DesignSprint</span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 6px',
                background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                color: '#a5b4fc', borderRadius: 6, letterSpacing: '0.05em',
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
            </div>
          </div>
        </header>

        {/* ── Page content ─────────────────────────────────── */}
        {children}

        {/* ── Footer ───────────────────────────────────────── */}
        <footer style={{
          marginTop: 96,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '32px 24px',
        }}>
          <div style={{ maxWidth: 1152, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 7,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 800, color: '#fff',
              }}>DS</div>
              <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>DesignSprint™</span>
            </div>
            <p style={{ fontSize: 12, color: '#334155' }}>Arabic UX Audit · Playwright-powered · Free tier: 3 scans / day</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#334155' }}>
              <span className="arabic">صُنع بعناية للويب العربي</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
