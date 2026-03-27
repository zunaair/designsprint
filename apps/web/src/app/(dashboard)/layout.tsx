import { Sidebar } from '../../components/layout/sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px 40px', maxWidth: 960 }}>
        {children}
      </main>
    </div>
  );
}
