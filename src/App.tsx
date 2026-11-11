import { lazy, Suspense } from 'react';
import { Navigate, NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Icon, Mark } from './components/ui';
import { DevFooter } from './components/DevFooter';
import { InstallPrompt } from './components/InstallPrompt';
import { VersionBadge } from './components/VersionBadge';
import { useApp } from './lib/store';
import Login from './pages/Login';
import Public from './pages/Public';
import Dashboard from './pages/Dashboard';
import { ContestList, TeamList } from './pages/Input';
import ScoreForm from './pages/ScoreForm';
import Standings from './pages/Standings';
import Awards from './pages/Awards';
import Menu from './pages/Menu';
const Teams = lazy(() => import('./pages/Teams'));
const Settings = lazy(() => import('./pages/Settings'));
const Users = lazy(() => import('./pages/Users'));
const Audit = lazy(() => import('./pages/Audit'));
const Print = lazy(() => import('./pages/Print'));

const NAV = [
  { to: '/app', label: 'Beranda', icon: 'home', end: true, m: true },
  { to: '/app/input', label: 'Input nilai', mlabel: 'Input', icon: 'edit', m: true },
  { to: '/app/klasemen', label: 'Klasemen', icon: 'list', m: true },
  { to: '/app/juara', label: 'Juara', icon: 'trophy', m: true, admin: true },
  { to: '/app/regu', label: 'Regu', icon: 'users', admin: true },
  { to: '/app/akun', label: 'Akun juri', icon: 'user', admin: true },
  { to: '/app/riwayat', label: 'Riwayat', icon: 'refresh', admin: true },
  { to: '/app/pengaturan', label: 'Pengaturan', icon: 'sliders', admin: true },
];

function Shell() {
  const { me, booting, signOut, pending, online, demo, cfg } = useApp();
  const loc = useLocation();
  if (booting) return <div className="auth"><Mark size={56} /></div>;
  if (!me) return <Navigate to="/masuk" replace state={{ from: loc.pathname }} />;
  const admin = me.role === 'admin';
  const items = NAV.filter((n) => admin || !n.admin);
  const mobile = items.filter((n) => n.m);
  const isScoreForm = /^\/app\/input\/[^/]+\/[^/]+/.test(loc.pathname);
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand"><Mark size={40} /><div><div className="disp" style={{ fontSize: 21, fontWeight: 600, lineHeight: 1.1, color: '#fff' }}>PANJI PARISADA</div><div style={{ fontSize: 11.5, opacity: .65 }}>{cfg.event.short}</div></div></div>
        <nav>{items.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'on' : '')}><Icon n={n.icon} />{n.label}</NavLink>)}</nav>
        <div className="me">
          <div style={{ fontWeight: 700, color: '#fff' }} className="trunc">{me.name}</div>
          <div className="xs" style={{ opacity: .65, marginBottom: 10 }}>{admin ? 'Admin' : 'Juri'}</div>
          <button className="btn sm block" style={{ background: 'transparent', color: '#eadfca', borderColor: 'rgba(255,255,255,.25)' }} onClick={signOut}><Icon n="logout" size={17} />Keluar</button>
          <DevFooter variant="sidebar" />
        </div>
      </aside>
      <div className="main">
        <header className="topbar"><Mark size={32} /><div className="grow"><div className="t">PANJI PARISADA</div><div className="s">{cfg.event.short}</div></div><span className="chip dark" style={{ background: 'rgba(255,255,255,.14)' }}>{admin ? 'Admin' : 'Juri'}</span></header>
        <div className="stripe" />
        {demo && <div className="netbar demo">Mode demo · data hanya tersimpan di perangkat ini</div>}
        {!online && <div className="netbar"><Icon n="wifi" size={16} />Tidak ada sinyal. Nilai disimpan di perangkat{pending ? ` (${pending} menunggu)` : ''}.</div>}
        {online && pending > 0 && <div className="netbar"><Icon n="refresh" size={16} />Mengirim {pending} nilai tertunda…</div>}
        <Outlet />
      </div>
      {!isScoreForm && (
        <nav className="tabbar" aria-label="Navigasi">
          {mobile.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'on' : '')}><Icon n={n.icon} />{n.mlabel ?? n.label}</NavLink>)}
          <NavLink to="/app/menu" className={({ isActive }) => (isActive ? 'on' : '')}><Icon n={admin ? 'sliders' : 'user'} />{admin ? 'Kelola' : 'Saya'}</NavLink>
        </nav>
      )}
      <InstallPrompt />
    </div>
  );
}

function AdminOnly({ children }: { children: JSX.Element }) {
  const { me, booting } = useApp();
  if (booting) return <div className="auth"><Mark size={56} /></div>;
  if (!me) return <Navigate to="/masuk" replace />;
  return me.role === 'admin' ? children : <Navigate to="/app" replace />;
}
const L = ({ children }: { children: JSX.Element }) => <Suspense fallback={<div className="page"><div className="empty">Memuat…</div></div>}>{children}</Suspense>;

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Public />} />
        <Route path="/masuk" element={<Login />} />
        <Route path="/app/cetak" element={<AdminOnly><L><Print /></L></AdminOnly>} />
        <Route path="/app" element={<Shell />}>
          <Route index element={<Dashboard />} />
          <Route path="input" element={<ContestList />} />
          <Route path="input/:key" element={<TeamList />} />
          <Route path="input/:key/:teamId" element={<ScoreForm />} />
          <Route path="klasemen" element={<Standings />} />
          <Route path="juara" element={<AdminOnly><Awards /></AdminOnly>} />
          <Route path="regu" element={<AdminOnly><L><Teams /></L></AdminOnly>} />
          <Route path="akun" element={<AdminOnly><L><Users /></L></AdminOnly>} />
          <Route path="riwayat" element={<AdminOnly><L><Audit /></L></AdminOnly>} />
          <Route path="pengaturan" element={<AdminOnly><L><Settings /></L></AdminOnly>} />
          <Route path="menu" element={<Menu />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <VersionBadge />
    </>
  );
}
