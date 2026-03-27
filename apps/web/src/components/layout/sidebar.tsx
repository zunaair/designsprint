'use client';

import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: '📊' },
  { href: '/dashboard/scans', label: 'Scan History', icon: '🔍' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: 240,
      minHeight: 'calc(100vh - 60px)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      padding: '24px 0',
      flexShrink: 0,
    }}>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 12px' }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <a
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 10,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                color: active ? '#f8fafc' : '#64748b',
                background: active ? 'rgba(199,5,45,0.12)' : 'transparent',
                border: active ? '1px solid rgba(199,5,45,0.25)' : '1px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
