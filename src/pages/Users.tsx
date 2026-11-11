import { useState } from 'react';
import { Icon, Sheet } from '../components/ui';
import { api } from '../lib/data';
import { useApp } from '../lib/store';
import type { Profile } from '../lib/types';

const gen = () => { const c = 'abcdefghjkmnpqrstuvwxyz23456789'; return Array.from({ length: 8 }, () => c[Math.floor(Math.random() * c.length)]).join(''); };
interface D { id?: string; username: string; name: string; password: string; role: 'juri' | 'admin'; contests: string[] }

export default function Users() {
  const { profiles, cfg, me, act, toast } = useApp();
  const [d, setD] = useState<D | null>(null); const [busy, setBusy] = useState(false); const [made, setMade] = useState<{ u: string; p: string } | null>(null);
  const cname = (k: string) => cfg.contests.find((c) => c.key === k)?.name ?? k;
  const edit = (p: Profile) => setD({ id: p.id, username: p.username, name: p.name, password: '', role: p.role, contests: p.contests });
  const toggle = (k: string) => d && setD({ ...d, contests: d.contests.includes(k) ? d.contests.filter((x) => x !== k) : [...d.contests, k] });
  const save = async () => {
    if (!d) return;
    if (d.password && d.password.trim().length > 0 && d.password.trim().length < 6) {
      return toast('Kata sandi minimal 6 karakter', 'err');
    }
    setBusy(true);
    try {
      if (d.id) {
        await act(() => api.users('PATCH', {
          id: d.id,
          name: d.name.trim(),
          contests: d.contests,
          role: d.role,
          password: d.password.trim() || undefined,
        }));
      } else {
        await act(() => api.users('POST', {
          username: d.username.trim(),
          name: d.name.trim(),
          password: d.password.trim(),
          role: d.role,
          contests: d.contests,
        }));
        setMade({ u: d.username.toLowerCase(), p: d.password.trim() });
      }
      toast('Akun tersimpan');
      setD(null);
    } catch (e) {
      toast((e as Error).message, 'err');
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!d?.id || !confirm(`Hapus akun "${d.name || d.username}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    setBusy(true);
    try {
      await act(() => api.users('DELETE', { id: d.id }));
      toast('Akun berhasil dihapus');
      setD(null);
    } catch (e) {
      toast((e as Error).message, 'err');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="page">
      <div className="page-h"><div><div className="eyebrow">{profiles.length} akun</div><h1>Akun juri</h1></div>
        <button className="btn primary sm" onClick={() => setD({ username: '', name: '', password: gen(), role: 'juri', contests: [] })}><Icon n="plus" size={17} />Tambah</button></div>
      <div className="stack">
        {made && <div className="card pad stack" style={{ background: 'var(--ok2)', borderColor: '#b9d6c1', gap: 6 }}>
          <b>Akun dibuat. Catat sekarang, kata sandi tidak ditampilkan lagi.</b>
          <div className="num">Username <b>{made.u}</b> · Kata sandi <b>{made.p}</b></div>
          <button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => { navigator.clipboard?.writeText(`${made.u} / ${made.p}`); setMade(null); }}>Salin dan tutup</button></div>}
        <div className="list">
          {profiles.map((p) => (
            <button key={p.id} className="li" onClick={() => edit(p)}>
              <span className="noBadge"><Icon n="user" size={17} /></span>
              <div className="grow"><div className="trunc" style={{ fontWeight: 700 }}>{p.name}{p.id === me?.id ? ' (Anda)' : ''}</div>
                <div className="trunc xs muted">@{p.username} · {p.role === 'admin' ? 'Admin' : p.contests.length ? p.contests.map(cname).join(', ') : 'Semua lomba'}</div></div>
              <span className={`chip ${p.role === 'admin' ? 'dark' : ''}`}>{p.role === 'admin' ? 'Admin' : 'Juri'}</span><Icon n="pencil" size={17} />
            </button>
          ))}
        </div>
        <p className="xs faint">Juri tanpa lomba terpilih dapat menilai semua lomba. Pilih lomba tertentu untuk membatasi akses.</p>
      </div>
      {d && <Sheet title={d.id ? 'Ubah akun' : 'Tambah akun'} onClose={() => setD(null)}>
        <div className="stack">
          <div className="field"><label>Nama</label><input className="input" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></div>
          <div className="field"><label>Username</label><input className="input" autoCapitalize="none" disabled={!!d.id} value={d.username} onChange={(e) => setD({ ...d, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '') })} placeholder="huruf kecil, angka" /></div>
          <div className="field"><label>{d.id ? 'Kata sandi baru (kosongkan jika tidak diubah)' : 'Kata sandi'}</label>
            <div className="row"><input className="input" value={d.password} onChange={(e) => setD({ ...d, password: e.target.value })} /><button type="button" className="btn sm" onClick={() => setD({ ...d, password: gen() })}>Acak</button></div></div>
          {d.id !== me?.id && <div className="field"><label>Peran</label><div className="seg" style={{ alignSelf: 'flex-start' }}>{(['juri', 'admin'] as const).map((r) => <button key={r} className={d.role === r ? 'on' : ''} onClick={() => setD({ ...d, role: r })}>{r === 'juri' ? 'Juri' : 'Admin'}</button>)}</div></div>}
          {d.role === 'juri' && <div className="field"><label>Lomba yang dinilai</label>
            <div className="row wrap" style={{ gap: 6 }}>
              <button type="button" className={`chip ${!d.contests.length ? 'ok' : ''}`} style={{ height: 32, border: 0, cursor: 'pointer' }} onClick={() => setD({ ...d, contests: [] })}>Semua lomba</button>
              {cfg.contests.map((c) => <button type="button" key={c.key} className={`chip ${d.contests.includes(c.key) ? 'ok' : ''}`} style={{ height: 32, border: 0, cursor: 'pointer' }} onClick={() => toggle(c.key)}>{c.name}</button>)}
            </div></div>}
          <div className="row between" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)', gap: 8 }}>
            {d.id && d.id !== me?.id ? (
              <button type="button" className="btn danger sm" onClick={remove} disabled={busy}>
                <Icon n="trash" size={16} /> Hapus Akun
              </button>
            ) : <span />}
            <button className="btn primary" disabled={busy || !d.name.trim() || (!d.id && (!d.username || d.password.length < 6))} onClick={save}>
              {busy ? 'Menyimpan…' : d.id ? 'Simpan Perubahan' : 'Buat Akun'}
            </button>
          </div>
        </div>
      </Sheet>}
    </div>
  );
}
