import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Icon, Mark } from '../components/ui';
import { DevFooter } from '../components/DevFooter';
import { useApp } from '../lib/store';

export default function Login() {
  const { me, signIn, demo, booting } = useApp();
  const nav = useNavigate();
  const [u, setU] = useState(''); const [p, setP] = useState(''); const [show, setShow] = useState(false);
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  if (me && !booting) return <Navigate to="/app" replace />;
  const go = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await signIn(u, p); nav('/app', { replace: true }); } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="auth">
      <form className="card" onSubmit={go}>
        <div className="row" style={{ marginBottom: 22 }}>
          <Mark size={48} />
          <div><div className="disp" style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.1 }}>PANJI PARISADA</div><div className="xs muted">Penilaian Parisada XXI</div></div>
        </div>
        <div className="stack">
          <div className="field"><label htmlFor="u">Username</label>
            <input id="u" className="input" autoCapitalize="none" autoCorrect="off" autoComplete="username" value={u} onChange={(e) => setU(e.target.value)} required autoFocus /></div>
          <div className="field"><label htmlFor="p">Kata sandi</label>
            <div style={{ position: 'relative' }}>
              <input id="p" className="input" type={show ? 'text' : 'password'} autoComplete="current-password" value={p} onChange={(e) => setP(e.target.value)} required style={{ paddingRight: 48 }} />
              <button type="button" className="btn ghost icon sm" style={{ position: 'absolute', right: 5, top: 5 }} onClick={() => setShow(!show)} aria-label="Tampilkan kata sandi"><Icon n={show ? 'eyeoff' : 'eye'} /></button>
            </div></div>
          {err && <div className="chip bad" style={{ height: 'auto', padding: '8px 11px', borderRadius: 9, whiteSpace: 'normal' }}>{err}</div>}
          <button className="btn primary block" disabled={busy}>{busy ? 'Memeriksa…' : 'Masuk'}</button>
          <Link to="/" className="btn ghost block sm">Lihat klasemen publik</Link>
          {demo && <div className="xs muted" style={{ textAlign: 'center' }}>Mode demo · coba <b>admin / admin</b> atau <b>juri / juri</b></div>}
        </div>
      </form>
      <DevFooter style={{ maxWidth: 400, marginTop: 18, width: '100%' }} />
    </div>
  );
}
