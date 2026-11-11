import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fmt, Icon, Progress, Rank } from '../components/ui';
import { canJudge, myContests } from '../lib/access';
import { api } from '../lib/data';
import { contestProgress } from '../lib/progress';
import { useApp } from '../lib/store';

export default function Dashboard() {
  const { me, cfg, teams, scores, st, publish, toast } = useApp();
  const admin = me?.role === 'admin';
  const [pub, setPub] = useState<string | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.getSnapshot().then((s) => setPub(s?.at ?? null)).catch(() => setPub(null)); }, []);
  const list = myContests(me, cfg);
  const prog = list.map((c) => ({ c, ...contestProgress(c.key, teams, scores, st, cfg) }));
  const totalDone = prog.reduce((a, p) => a + p.done, 0), totalAll = prog.reduce((a, p) => a + p.total, 0);
  const finished = prog.filter((p) => p.total > 0 && p.done >= p.total).length;
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
  const doPublish = async () => {
    setBusy(true);
    try { await publish(); setPub(new Date().toISOString()); toast('Klasemen diterbitkan'); } catch (e) { toast((e as Error).message, 'err'); } finally { setBusy(false); }
  };
  return (
    <div className="page">
      <div className="page-h">
        <div><div className="eyebrow">{today}</div><h1>Halo, {me?.name.split(' ')[0]}</h1></div>
        <Link to="/app/input" className="btn primary"><Icon n="edit" size={18} />Input nilai</Link>
      </div>
      <div className="stack lg">
        <div className="grid g4">
          <div className="card stat"><div className="v num">{teams.length}</div><div className="l">Regu</div></div>
          <div className="card stat"><div className="v num">{finished}<span className="faint" style={{ fontSize: 20 }}>/{list.length}</span></div><div className="l">Lomba selesai</div></div>
          <div className="card stat"><div className="v num">{totalAll ? Math.round((totalDone / totalAll) * 100) : 0}<span className="faint" style={{ fontSize: 20 }}>%</span></div><div className="l">Nilai masuk</div></div>
          <div className="card stat"><div className="v" style={{ fontSize: 24, paddingTop: 6 }}>{st.complete ? 'Final' : 'Sementara'}</div><div className="l">Status klasemen</div></div>
        </div>

        {admin && (
          <div className="card pad row wrap between">
            <div className="row"><Icon n="globe" /><div><div style={{ fontWeight: 700 }}>Klasemen publik</div>
              <div className="xs muted">{pub === undefined ? '…' : pub ? `Terakhir terbit ${new Date(pub).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : 'Belum pernah diterbitkan'}</div></div></div>
            <div className="row"><Link to="/" target="_blank" className="btn sm">Buka</Link><button className="btn accent sm" disabled={busy || !teams.length} onClick={doPublish}>{busy ? 'Menerbitkan…' : 'Terbitkan sekarang'}</button></div>
          </div>
        )}

        <div className="grid g2" style={{ alignItems: 'start' }}>
          <section>
            <div className="row between" style={{ marginBottom: 8 }}><h2 className="eyebrow">Progres lomba</h2></div>
            <div className="list">
              {prog.map(({ c, done, total }) => (
                <Link key={c.key} to={`/app/input/${c.key}`} className="li" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                  <div className="row between"><b>{c.name}</b><span className="xs muted num">{done}/{total}</span></div>
                  <Progress v={total ? done / total : 0} ok={total > 0 && done >= total} />
                </Link>
              ))}
            </div>
          </section>
          <section>
            <div className="row between" style={{ marginBottom: 8 }}><h2 className="eyebrow">Posisi sementara</h2><Link to="/app/klasemen" className="xs" style={{ fontWeight: 700, color: 'var(--accent)' }}>Lihat semua</Link></div>
            <div className="list">
              {st.rows.filter((r) => r.rank > 0).slice(0, 8).map((r) => (
                <div key={r.team.id} className="li" style={{ cursor: 'default' }}>
                  <Rank n={r.rank} tie={r.tie} /><div className="grow"><div className="trunc" style={{ fontWeight: 700 }}>{r.team.name}</div><div className="trunc xs muted">{r.team.pangkalan}</div></div>
                  <b className="num">{fmt(r.total)}</b>
                </div>
              ))}
              {!st.rows.some((r) => r.done > 0) && <div className="empty">Belum ada nilai masuk.</div>}
            </div>
          </section>
        </div>
        {!admin && !list.some((c) => canJudge(me, c.key)) && <div className="card pad muted">Belum ada lomba yang ditugaskan. Hubungi admin.</div>}
      </div>
    </div>
  );
}
