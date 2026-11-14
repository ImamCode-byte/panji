import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/ui';
import { DevFooter } from '../components/DevFooter';
import { useApp } from '../lib/store';

export default function Menu() {
  const { me, signOut, reload, demo } = useApp();
  const [loggingOut, setLoggingOut] = useState(false);
  const admin = me?.role === 'admin';
  const links = [['/app/regu', 'users', 'Data regu'], ['/app/akun', 'user', 'Akun juri'], ['/app/riwayat', 'refresh', 'Riwayat perubahan'], ['/app/pengaturan', 'sliders', 'Pengaturan']];
  return (
    <div className="page">
      <div className="page-h"><h1>{admin ? 'Kelola' : 'Akun saya'}</h1></div>
      <div className="stack lg">
        <div className="card pad row"><div className="noBadge" style={{ width: 44, height: 44, borderRadius: 12 }}><Icon n="user" /></div>
          <div className="grow"><div style={{ fontWeight: 700 }}>{me?.name}</div><div className="xs muted">@{me?.username} · {admin ? 'Admin' : me?.contests.length ? `${me.contests.length} lomba ditugaskan` : 'Semua lomba'}</div></div></div>
        {admin && <div className="list">{links.map(([to, ic, l]) => <Link key={to} to={to} className="li"><Icon n={ic} /><span className="grow" style={{ fontWeight: 600 }}>{l}</span><Icon n="chev" size={18} /></Link>)}</div>}
        <button className="btn block" onClick={() => reload()}><Icon n="refresh" size={18} />Muat ulang data</button>
        <button
          className="btn danger block"
          disabled={loggingOut}
          onClick={async () => {
            setLoggingOut(true);
            await signOut();
          }}
        >
          <Icon n="logout" size={18} />
          {loggingOut ? 'Keluar…' : 'Keluar'}
        </button>
        {demo && <p className="xs faint" style={{ textAlign: 'center' }}>Mode demo aktif.</p>}
        {demo && <p className="xs faint" style={{ textAlign: 'center' }}>{me?.username} || {me?.name}</p>}
        <DevFooter />
      </div>
    </div>
  );
}
