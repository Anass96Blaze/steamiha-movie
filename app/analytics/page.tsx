'use client';

import { useEffect, useState } from 'react';
import HeaderBrand from '@/components/HeaderBrand';
import Footer from '@/components/Footer';
import SearchModal from '@/components/SearchModal';
import { SearchModalProvider } from '@/components/SearchModalContext';

interface Stats {
  total_events: number;
  unique_sessions: number;
  page_views: number;
  session_pings: number;
  sources: Record<string, number>;
  pages: Record<string, number>;
  last_events?: Array<{ event_type: string; page: string; source?: string; ts: number; session_id: string }>;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetch('/api/analytics?action=stats', { headers: { Accept: 'application/json' } })
      .then((r) => r.json())
      .then((d: Stats) => setStats(d))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load stats'));
  }, []);

  return (
    <SearchModalProvider>
      <HeaderBrand />
      <SearchModal />
      <div id="app">
        <h1 style={{ marginTop: 80 }}>Analytics</h1>
        {error ? <p style={{ color: '#f87171' }}>{error}</p> : null}
        {!stats ? (
          <p style={{ color: '#94a3b8' }}>Loading…</p>
        ) : (
          <div style={{ display: 'grid', gap: 18, color: '#e2e8f0' }}>
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <Stat label="Total events" value={stats.total_events} />
              <Stat label="Unique sessions" value={stats.unique_sessions} />
              <Stat label="Page views" value={stats.page_views} />
              <Stat label="Session pings" value={stats.session_pings} />
            </section>

            <section>
              <h2>Sources</h2>
              <Table rows={Object.entries(stats.sources)} />
            </section>

            <section>
              <h2>Pages</h2>
              <Table rows={Object.entries(stats.pages)} />
            </section>
          </div>
        )}
        <Footer />
      </div>
    </SearchModalProvider>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ padding: 16, borderRadius: 12, background: '#111827', border: '1px solid #1f2937' }}>
      <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color: '#f8fafc' }}>{value}</div>
    </div>
  );
}

function Table({ rows }: { rows: [string, number][] }) {
  if (!rows.length) return <p style={{ color: '#94a3b8' }}>No data</p>;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#111827', borderRadius: 12, overflow: 'hidden' }}>
      <tbody>
        {rows.sort((a, b) => b[1] - a[1]).map(([k, v]) => (
          <tr key={k} style={{ borderBottom: '1px solid #1f2937' }}>
            <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>{k}</td>
            <td style={{ padding: '10px 14px', color: '#f8fafc', textAlign: 'right', fontWeight: 700 }}>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
