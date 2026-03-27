'use client';

import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

interface ScanSummary {
  id: string;
  url: string;
  status: string;
  tier: string;
  desktop?: { totalScore: number; grade: string };
  mobile?: { totalScore: number; grade: string };
  createdAt: string;
}

const GRADE_COLORS: Record<string, string> = {
  poor: '#EF4444',
  'needs-work': '#F97316',
  good: '#EAB308',
  excellent: '#22C55E',
};

export default function DashboardPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchScans() {
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/api/scans?limit=5`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setScans(data.scans ?? []);
          setTotal(data.total ?? 0);
        }
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    }
    void fetchScans();
  }, [getToken]);

  return (
    <div>
      {/* Header */}
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>
        Dashboard
      </h1>
      <p style={{ fontSize: 14, color: '#64748b', marginBottom: 32 }}>
        Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
      </p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total Scans', value: total },
          { label: 'This Month', value: scans.filter(s => new Date(s.createdAt) > new Date(Date.now() - 30 * 86400000)).length },
          { label: 'Completed', value: scans.filter(s => s.status === 'completed').length },
        ].map((stat) => (
          <div key={stat.label} className="glass-card" style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>{stat.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Recent scans */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>Recent Scans</h2>
        <a href="/dashboard/scans" style={{ fontSize: 13, color: '#E6BCC5', textDecoration: 'none' }}>View all</a>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 56 }} />
          ))}
        </div>
      ) : scans.length === 0 ? (
        <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontSize: 14 }}>No scans yet. Run your first Arabic UX audit!</p>
          <a href="/" style={{
            display: 'inline-block', marginTop: 16, padding: '10px 24px', borderRadius: 10,
            background: 'linear-gradient(135deg, #C7052D, #9B0423)', color: '#fff', fontWeight: 700,
            fontSize: 14, textDecoration: 'none',
          }}>
            Start Scan
          </a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {scans.map((scan) => {
            const audit = scan.desktop ?? scan.mobile;
            const score = audit?.totalScore ?? '—';
            const grade = audit?.grade ?? '';
            return (
              <a
                key={scan.id}
                href={`/results/${scan.id}`}
                className="glass-card"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 20px', textDecoration: 'none', cursor: 'pointer',
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', marginBottom: 3 }}>
                    {scan.url}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {new Date(scan.createdAt).toLocaleDateString('en-GB')} — {scan.status}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: GRADE_COLORS[grade] ?? '#64748b' }}>
                    {score}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>
                    {grade.replace('-', ' ') || '—'}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
