import { useMemo, useState } from 'react';
import { Empty, fmt, Icon, Rank, Seg } from '../components/ui';
import { RankTable, toLines } from '../components/RankTable';
import { useApp } from '../lib/store';

export default function Standings() {
  const { st, cfg, teams, me, publish, toast } = useApp();
  const [tab, setTab] = useState<'u' | 'l' | 'f' | 'k'>('u');
  const [q, setQ] = useState(''); const [lk, setLk] = useState('administrasi'); const [busy, setBusy] = useState(false);
  const lines = useMemo(() => toLines(st).filter((l) => `${l.name} ${l.pangkalan} ${l.no}`.toLowerCase().includes(q.toLowerCase())), [st, q]);
  const tm = new Map(teams.map((t) => [t.id, t]));
  const contests = [
    ...st.recap.map((r) => ({ v: r.key, l: r.name })),
    ...cfg.contests.filter((c) => c.stage).map((c) => ({ v: c.key, l: c.name })),
    { v: 'danton', l: 'Danton Terbaik' }, { v: 'tergiat', l: 'Regu Tergiat' },
  ].filter((x, i, a) => a.findIndex((y) => y.v === x.v) === i);
  const ranked = st.per[lk] ?? [];

  const [downloading, setDownloading] = useState(false);

  const downloadExcel = async () => {
    setDownloading(true);
    try {
      const { exportStandingsToExcel } = await import('../lib/exportExcel');
      await exportStandingsToExcel(st, cfg);
      toast('Rekapitulasi Excel (.xlsx) berhasil diunduh');
    } catch (e) {
      toast((e as Error).message, 'err');
    } finally {
      setDownloading(false);
    }
  };
  const pub = async () => { setBusy(true); try { await publish(); toast('Klasemen diterbitkan'); } catch (e) { toast((e as Error).message, 'err'); } finally { setBusy(false); } };

  return (
    <div className="page">
      <div className="page-h">
        <div><div className="eyebrow">{st.complete ? 'Final' : 'Sementara'} · {st.of} lomba</div><h1>Klasemen</h1></div>
        <div className="row"><button className="btn sm" disabled={downloading} onClick={downloadExcel}><Icon n="down" size={17} />{downloading ? 'Mengunduh…' : 'Excel (.xlsx)'}</button>
          {me?.role === 'admin' && <button className="btn accent sm" disabled={busy} onClick={pub}><Icon n="globe" size={17} />{busy ? 'Menerbitkan…' : 'Terbitkan'}</button>}</div>
      </div>
      <div className="stack lg">
        <Seg value={tab} onChange={setTab} opts={[{ v: 'u', l: 'Umum' }, { v: 'l', l: 'Per lomba' }, { v: 'f', l: 'Pangkalan favorit' }, { v: 'k', l: 'Khusus' }]} />
        {tab === 'u' && <>
          <div className="search"><Icon n="search" size={18} /><input className="input" placeholder="Cari regu atau pangkalan" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <RankTable lines={lines} recap={st.recap} provisional={!st.complete} />
          <p className="xs faint">Seri nilai total dipecah: jumlah juara 1, 2, 3 di tiap lomba, lalu urutan manual panitia (menu Regu). {!st.complete && 'Kategori sementara (belum semua lomba dinilai).'}</p>
        </>}
        {tab === 'l' && <>
          <Seg value={lk} onChange={setLk} opts={contests} />
          <div className="list">
            {ranked.map((r) => { const t = tm.get(r.teamId); if (!t) return null; return (
              <div key={r.teamId} className="li" style={{ cursor: 'default' }}><Rank n={r.rank} tie={r.tie} /><span className="noBadge">{String(t.no).padStart(2, '0')}</span>
                <div className="grow"><div className="trunc" style={{ fontWeight: 700 }}>{t.name}</div><div className="trunc xs muted">{t.pangkalan}</div></div>
                {r.tie && <span className="chip gold">Seri</span>}{r.dq ? <span className="chip bad">Diskualifikasi</span> : <b className="num">{fmt(r.score)}</b>}</div>); })}
            {!ranked.length && <Empty>Belum ada nilai untuk lomba ini.</Empty>}
          </div>
        </>}
        {tab === 'f' && <div className="list">
          {st.favorit.map((f) => <div key={f.pangkalan} className="li" style={{ cursor: 'default' }}><Rank n={f.rank} /><div className="grow"><div className="trunc" style={{ fontWeight: 700 }}>{f.pangkalan}</div><div className="xs muted trunc">{f.teams.map((t) => t.name).join(' · ')}</div></div><b className="num">{fmt(f.total)}</b></div>)}
          {!st.favorit.length && <Empty>Belum ada pangkalan dengan dua regu yang dinilai.</Empty>}
        </div>}
        {tab === 'k' && <div className="grid g2" style={{ alignItems: 'start' }}>
          {[['danton', 'Danton Terbaik'], ['tergiat', 'Regu Tergiat']].map(([k, n]) => (
            <div key={k} className="card"><div className="sec-t" style={{ borderRadius: '14px 14px 0 0' }}>{n}</div>
              {(st.per[k] ?? []).slice(0, 3).map((r) => { const t = tm.get(r.teamId)!; return <div key={r.teamId} className="li" style={{ cursor: 'default' }}><Rank n={r.rank} tie={r.tie} /><div className="grow"><div className="trunc" style={{ fontWeight: 700 }}>{t.name}</div><div className="xs muted trunc">{t.pangkalan}</div></div><b className="num">{fmt(r.score)}</b></div>; })}
              {!(st.per[k] ?? []).length && <Empty>Belum ada nilai.</Empty>}
            </div>))}
        </div>}
      </div>
    </div>
  );
}
