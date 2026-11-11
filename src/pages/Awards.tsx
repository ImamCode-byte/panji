import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Empty, fmt, Icon, Rank, Seg } from '../components/ui';
import { buildCerts, type CertSet } from '../lib/certs';
import { useApp } from '../lib/store';

export default function Awards() {
  const { st, cfg, teams } = useApp();
  const [tab, setTab] = useState<'k' | 'l' | 'f'>('k');
  const groups = useMemo(() => { const m = new Map<string, typeof st.awards>(); st.awards.forEach((a) => m.set(a.group, [...(m.get(a.group) ?? []), a])); return [...m]; }, [st]);
  const lomba = useMemo(() => buildCerts('lomba', st, cfg, teams), [st, cfg, teams]);
  const byCon = useMemo(() => { const m = new Map<string, typeof lomba>(); lomba.forEach((c) => { const k = c.label.replace(/^Juara [IVX]+ (Lomba )?/, ''); m.set(k, [...(m.get(k) ?? []), c]); }); return [...m]; }, [lomba]);
  const print = (set: CertSet, team?: string) => `/app/cetak?set=${set}${team ? `&team=${team}` : ''}`;
  return (
    <div className="page">
      <div className="page-h"><div><div className="eyebrow">{st.complete ? 'Final' : 'Sementara'}</div><h1>Juara</h1></div>
        <div className="row wrap"><Link className="btn sm" to={print('peserta')}><Icon n="print" size={17} />Sertifikat peserta</Link>
          <Link className="btn primary sm" to={print('semua')}><Icon n="print" size={17} />Cetak semua juara</Link></div></div>
      <div className="stack lg">
        <div className="row between wrap"><Seg value={tab} onChange={setTab} opts={[{ v: 'k', l: 'Kategori umum' }, { v: 'l', l: 'Per lomba' }, { v: 'f', l: 'Pangkalan favorit' }]} />
          <Link className="btn sm" to={print(tab === 'k' ? 'awards' : tab === 'l' ? 'lomba' : 'favorit')}><Icon n="print" size={17} />Cetak tab ini</Link></div>
        {!st.complete && <div className="card pad sm" style={{ background: 'var(--accent2)', borderColor: '#e6cf9d' }}>Nilai belum lengkap. Kategori ini masih sementara dan bisa berubah.</div>}
        {tab === 'k' && (groups.length ? <div className="grid g2" style={{ alignItems: 'start' }}>{groups.map(([g, items]) => (
          <div key={g} className="card"><div className="sec-t" style={{ borderRadius: '14px 14px 0 0' }}>{g}</div>
            {items.map((a) => <div key={a.label} className="li" style={{ cursor: 'default' }}><Rank n={a.rank} /><div className="grow"><div className="trunc" style={{ fontWeight: 700 }}>{a.team.name}</div><div className="xs muted trunc">{a.team.pangkalan} · {fmt(a.total)}</div></div>
              <Link className="btn ghost icon sm" to={print('awards', a.team.id)} aria-label="Cetak"><Icon n="print" size={17} /></Link></div>)}
          </div>))}</div> : <Empty>Belum ada nilai.</Empty>)}
        {tab === 'l' && (byCon.length ? <div className="grid g3" style={{ alignItems: 'start' }}>{byCon.map(([k, items]) => (
          <div key={k} className="card"><div className="sec-t" style={{ borderRadius: '14px 14px 0 0' }}>{k}</div>
            {items.map((c, i) => <div key={i} className="li" style={{ cursor: 'default' }}><div className="grow"><div className="trunc" style={{ fontWeight: 700 }}>{c.name}</div><div className="xs muted trunc">{c.label.match(/^Juara [IVX]+/)?.[0] ?? c.label} · {c.pangkalan}</div></div></div>)}
          </div>))}</div> : <Empty>Belum ada hasil lomba.</Empty>)}
        {tab === 'f' && <div className="list">{st.favorit.map((f) => <div key={f.pangkalan} className="li" style={{ cursor: 'default' }}><Rank n={f.rank} /><div className="grow"><div className="trunc" style={{ fontWeight: 700 }}>{f.pangkalan}</div><div className="xs muted trunc">{f.teams.map((t) => t.name).join(' · ')}</div></div><b className="num">{fmt(f.total)}</b></div>)}{!st.favorit.length && <Empty>Belum ada.</Empty>}</div>}
      </div>
    </div>
  );
}
