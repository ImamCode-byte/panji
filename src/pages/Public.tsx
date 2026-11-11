import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Empty, fmt, Icon, Mark, Rank, Seg } from '../components/ui';
import { RankTable } from '../components/RankTable';
import { DevFooter } from '../components/DevFooter';
import { api } from '../lib/data';
import type { Snapshot } from '../lib/snapshot';
import { useApp } from '../lib/store';

export default function Public() {
  const { me } = useApp();
  const [s, setS] = useState<Snapshot | null | undefined>(undefined);
  const [tab, setTab] = useState<'k' | 'j' | 'l' | 'f'>('k');
  const [q, setQ] = useState(''); const [lk, setLk] = useState('');
  useEffect(() => {
    let on = true; const f = () => api.getSnapshot().then((x) => on && setS(x)).catch(() => on && setS((p) => p ?? null));
    f(); const iv = setInterval(f, 30000); return () => { on = false; clearInterval(iv); };
  }, []);
  const rows = useMemo(() => (s?.rows ?? []).filter((r) => `${r.name} ${r.pangkalan} ${r.no}`.toLowerCase().includes(q.toLowerCase())), [s, q]);
  const ev = s?.event;
  const top = (s?.rows ?? []).filter((r) => r.rank >= 1 && r.rank <= 3);
  const groups = useMemo(() => { const m = new Map<string, NonNullable<typeof s>['awards']>(); (s?.awards ?? []).forEach((a) => m.set(a.group, [...(m.get(a.group) ?? []), a])); return [...m]; }, [s]);
  const pod = s?.podium.find((p) => p.key === lk) ?? s?.podium[0];

  return (
    <>
      <header className="hero">
        <div className="in">
          <div className="row between" style={{ gap: 8, alignItems: 'center' }}>
            <div className="row" style={{ gap: 8, alignItems: 'center', minWidth: 0, flex: 1 }}>
              <img src="/parisada.png" alt="Logo Parisada XXI" className="pub-logo" />
              <div style={{ minWidth: 0 }}>
                <div style={{ letterSpacing: '.08em', fontSize: 'clamp(12.5px, 3.2vw, 16px)', fontWeight: 800, color: '#fbf1de', lineHeight: 1.15 }}>
                  PANJI PARISADA
                </div>
                <div style={{ fontSize: 'clamp(9px, 2.3vw, 11px)', opacity: 0.78, color: '#eadfca', marginTop: 1, lineHeight: 1.2 }}>
                  Pusat Akumulasi Nilai, Juara & Informasi
                </div>
              </div>
            </div>
            <Link
              to={me ? '/app' : '/masuk'}
              className="btn sm"
              style={{
                background: 'transparent',
                color: '#f3e9d6',
                borderColor: 'rgba(255,255,255,.3)',
                flex: 'none',
                height: 32,
                minHeight: 32,
                padding: '0 10px',
                fontSize: 12,
              }}
            >
              {me ? 'Buka aplikasi' : 'Login'}
            </Link>
          </div>
          <div className="eyebrow" style={{ color: '#d9952b', marginTop: 26 }}>Klasemen resmi</div>
          <h1>{ev?.short ?? 'PARISADA XXI'}</h1>
          <p style={{ opacity: .8, maxWidth: 560 }}>{ev?.tema ?? 'Menjaga Budaya, Melestarikan Seni dan Raih Prestasi'}</p>
          <div className="row wrap" style={{ marginTop: 14, gap: 8 }}>
            {ev && <span className="chip" style={{ background: 'rgba(255,255,255,.12)', color: '#f3e9d6' }}>{ev.tanggal}</span>}
            {s && <span className={`chip ${s.complete ? 'ok' : 'gold'}`}>{s.complete ? 'Final' : 'Sementara'}</span>}
            {s && <span className="xs" style={{ opacity: .7 }}>Diperbarui {new Date(s.at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
          </div>
        </div>
      </header>
      <div className="stripe" style={{ display: 'block' }} />
      <main className="page" style={{ paddingBottom: 48 }}>
        {s === undefined ? <Empty>Memuat…</Empty> : !s ? (
          <div className="card pad"><Empty><Icon n="flag" size={30} /><p style={{ marginTop: 8 }}>Klasemen belum diterbitkan panitia.</p></Empty></div>
        ) : (
          <div className="stack lg">
            <Seg value={tab} onChange={setTab} opts={[{ v: 'k', l: 'Klasemen' }, { v: 'j', l: 'Juara' }, { v: 'l', l: 'Per lomba' }, { v: 'f', l: 'Pangkalan favorit' }]} />
            {tab === 'k' && <>
              {top.length > 0 && <div className="pod">{top.map((r) => (
                <div key={r.no} className={`p r${r.rank}`}><Rank n={r.rank} /><div className="grow"><div className="trunc" style={{ fontWeight: 700 }}>{r.name}</div><div className="trunc xs muted">{r.pangkalan}</div></div><div className="disp num" style={{ fontSize: 24, fontWeight: 600 }}>{fmt(r.total)}</div></div>
              ))}</div>}
              <div className="search"><Icon n="search" size={18} /><input className="input" placeholder="Cari regu atau pangkalan" value={q} onChange={(e) => setQ(e.target.value)} /></div>
              <RankTable lines={rows} recap={s.recap} provisional={!s.complete} />
              {!s.complete && <p className="xs faint">* Kategori sementara, belum semua lomba dinilai.</p>}
            </>}
            {tab === 'j' && (groups.length ? <div className="grid g2">{groups.map(([g, items]) => (
              <div key={g} className="card"><div className="sec-t" style={{ borderRadius: '14px 14px 0 0' }}>{g}</div>
                {items.map((a) => <div key={a.label} className="li" style={{ cursor: 'default' }}><Rank n={a.rank} /><div className="grow"><div style={{ fontWeight: 700 }} className="trunc">{a.name}</div><div className="xs muted trunc">{a.pangkalan}</div></div><div className="xs faint">{a.label.replace(g, '').trim() || ''}</div></div>)}
              </div>))}</div> : <Empty>Belum ada juara.</Empty>)}
            {tab === 'l' && (s.podium.length ? <>
              <Seg value={pod!.key} onChange={setLk} opts={s.podium.map((p) => ({ v: p.key, l: p.name }))} />
              <div className="list">{pod!.items.map((i) => <div key={i.no + '-' + i.rank} className="li" style={{ cursor: 'default' }}><Rank n={i.rank} /><div className="grow"><div className="trunc" style={{ fontWeight: 700 }}>{i.name}</div><div className="xs muted trunc">{i.pangkalan}</div></div><b className="num">{fmt(i.score)}</b></div>)}</div>
            </> : <Empty>Belum ada hasil lomba.</Empty>)}
            {tab === 'f' && (s.favorit.length ? <div className="list">{s.favorit.map((f) => <div key={f.pangkalan} className="li" style={{ cursor: 'default' }}><Rank n={f.rank} /><div className="grow"><div className="trunc" style={{ fontWeight: 700 }}>{f.pangkalan}</div><div className="xs muted trunc">{f.names.join(' · ')}</div></div><b className="num">{fmt(f.total)}</b></div>)}</div> : <Empty>Belum ada pangkalan dengan dua regu yang dinilai.</Empty>)}
          </div>
        )}
        <DevFooter />
      </main>
    </>
  );
}
