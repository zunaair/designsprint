'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

interface ScanItem {
  id: string;
  url: string;
  status: string;
  tier: string;
  email: string;
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

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  completed: { color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
  running: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  pending: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  failed: { color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
};

export default function ScansPage() {
  const { getToken } = useAuth();
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 10;

  useEffect(() => {
    async function fetchScans() {
      setLoading(true);
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/api/scans?page=${page}&limit=${limit}`, {
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
  }, [getToken, page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>Scan History</h1>
          <p style={{ fontSize: 14, color: '#64748b' }}>{total} total scan{total !== 1 ? 's' : ''}</p>
        </div>
        <a href="/" style={{
          padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700,
          background: 'linear-gradient(135deg, #C7052D, #9B0423)', color: '#fff',
          textDecoration: 'none', boxShadow: '0 2px 8px rgba(199,5,45,0.3)',
        }}>
          New Scan
        </a>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 56 }} />
          ))}
        </div>
      ) : scans.length === 0 ? (
        <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontSize: 15 }}>No scans found.</p>
        </div>
      ) : (
        <>
          {/* Header row */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
            gap: 8, padding: '8px 16px', fontSize: 11, fontWeight: 700,
            color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            <span>URL</span>
            <span>Status</span>
            <span>Desktop</span>
            <span>Mobile</span>
            <span>Date</span>
          </div>

          {/* Rows */}
          {scans.map((scan) => (
            <a
              key={scan.id}
              href={`/results/${scan.id}`}
              className="glass-card"
              style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                gap: 8, padding: '14px 16px', textDecoration: 'none', marginBottom: 6,
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {scan.url.replace(/^https?:\/\//, '')}
              </span>
              <span>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                  color: STATUS_STYLES[scan.status]?.color ?? '#64748b',
                  background: STATUS_STYLES[scan.status]?.bg ?? 'transparent',
                }}>
                  {scan.status}
                </span>
              </span>
              <span style={{ fontSize: 15, fontWeight: 800, color: GRADE_COLORS[scan.desktop?.grade ?? ''] ?? '#64748b' }}>
                {scan.desktop?.totalScore ?? '—'}
              </span>
              <span style={{ fontSize: 15, fontWeight: 800, color: GRADE_COLORS[scan.mobile?.grade ?? ''] ?? '#64748b' }}>
                {scan.mobile?.totalScore ?? '—'}
              </span>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                {new Date(scan.createdAt).toLocaleDateString('en-GB')}
              </span>
            </a>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{
                  padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: page <= 1 ? '#334155' : '#f8fafc', cursor: page <= 1 ? 'default' : 'pointer',
                }}
              >
                Previous
              </button>
              <span style={{ padding: '8px 12px', fontSize: 13, color: '#64748b' }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{
                  padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: page >= totalPages ? '#334155' : '#f8fafc', cursor: page >= totalPages ? 'default' : 'pointer',
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
