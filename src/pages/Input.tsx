import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { fmt, Icon, Progress, Seg } from '../components/ui';
import { canJudge, myContests } from '../lib/access';
import { contestProgress, eligible } from '../lib/progress';
import { contestScore } from '../lib/scoring';
import { useApp } from '../lib/store';

export function ContestList() {
  const { me, cfg, teams, scores, st } = useApp();
  const list = myContests(me, cfg);
  return (
    <div className="page">
      <div className="page-h"><h1>Input nilai</h1></div>
      {!list.length && <div className="card pad muted">Belum ada lomba yang ditugaskan.</div>}
      <div className="grid g2">
        {list.map((c) => {
          const { done, total } = contestProgress(c.key, teams, scores, st, cfg);
          return (
            <Link key={c.key} to={`/app/input/${c.key}`} className="card pad stack" style={{ gap: 10 }}>
              <div className="row between"><b style={{ fontSize: 16 }}>{c.name}</b>
                {c.stage ? <span className="chip gold">MSC</span> : !c.inRecap ? <span className="chip">Terpisah</span> : null}</div>
              <div className="row"><div className="grow"><Progress v={total ? done / total : 0} ok={total > 0 && done >= total} /></div><span className="xs num muted">{done}/{total}</span></div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function TeamList() {
  const { key = '' } = useParams();
  const { me, cfg, teams, scores, st } = useApp();
  const nav = useNavigate();
  const [q, setQ] = useState(''); const [f, setF] = useState<'all' | 'todo' | 'done'>('all'); const [only, setOnly] = useState(true);
  const def = cfg.contests.find((c) => c.key === key);
  if (!def || !canJudge(me, key)) return <Navigate to="/app/input" replace />;
  const isStage = key === 'msc_semifinal' || key === 'msc_final';
  const recs = new Map(scores.filter((s) => s.contest === key).map((s) => [s.team_id, s]));
  const rankMap = new Map((st.per[key] ?? []).map((r) => [r.teamId, r.rank]));
  const rows = eligible(key, teams, st, cfg, only).filter((t) => `${t.name} ${t.pangkalan} ${t.no} ${t.alamat ?? ''}`.toLowerCase().includes(q.toLowerCase()))
    .filter((t) => (f === 'all' ? true : f === 'done' ? recs.has(t.id) : !recs.has(t.id)));
  const { done, total } = contestProgress(key, teams, scores, st, cfg);
  return (
    <div className="page">
      <div className="page-h">
        <div><button className="btn ghost sm" style={{ marginLeft: -10 }} onClick={() => nav('/app/input')}><Icon n="back" size={18} />Semua lomba</button>
          <h1>{def.name}</h1></div>
        <div style={{ minWidth: 150 }}><div className="xs muted num" style={{ textAlign: 'right', marginBottom: 4 }}>{done} dari {total} dinilai</div><Progress v={total ? done / total : 0} ok={done >= total && total > 0} /></div>
      </div>
      <div className="stack">
        <div className="search"><Icon n="search" size={18} /><input className="input" placeholder="Cari nomor, regu, pangkalan, alamat" value={q} onChange={(e) => setQ(e.target.value)} inputMode="search" /></div>
        <div className="row wrap between">
          <Seg value={f} onChange={setF} opts={[{ v: 'all', l: 'Semua' }, { v: 'todo', l: 'Belum' }, { v: 'done', l: 'Sudah' }]} />
          {isStage && <label className="row sm" style={{ gap: 8 }}>Hanya yang lolos<button type="button" role="switch" aria-checked={only} className={`switch ${only ? 'on' : ''}`} onClick={() => setOnly(!only)} /></label>}
        </div>
        {isStage && only && !total && <div className="card pad muted sm">Belum ada regu yang lolos. Selesaikan tahap sebelumnya terlebih dahulu.</div>}
        <div className="list">
          {rows.map((t) => {
            const r = recs.get(t.id); const cs = r ? contestScore(def, r) : null;
            return (
              <Link key={t.id} to={`/app/input/${key}/${t.id}`} className="li">
                <span className="noBadge">{String(t.no).padStart(2, '0')}</span>
                <div className="grow"><div className="trunc" style={{ fontWeight: 700 }}>{t.name}</div><div className="trunc xs muted">{t.pangkalan}{t.alamat ? ` · ${t.alamat}` : ''}</div></div>
                {!r ? <span className="chip">Belum</span> : cs!.dq ? <span className="chip bad">Diskualifikasi</span> : (
                  <div style={{ textAlign: 'right' }}>
                    <div className="row" style={{ gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                      {r.data?.unlocked ? (
                        <span className="chip ok" style={{ fontSize: 10, padding: '2px 6px', height: 'auto' }} title="Admin mengizinkan juri mengubah nilai">
                          <Icon n="unlock" size={12} /> Buka
                        </span>
                      ) : r.data?.locked === false || !cs!.complete ? (
                        <span className="chip gold" style={{ fontSize: 10, padding: '2px 6px', height: 'auto' }} title="Draf nilai belum dikunci">
                          <Icon n="pencil" size={12} /> Draf
                        </span>
                      ) : (
                        <span className="chip" style={{ fontSize: 10, padding: '2px 6px', height: 'auto' }} title="Nilai terkunci">
                          <Icon n="lock" size={12} /> Kunci
                        </span>
                      )}
                      <div className="num" style={{ fontWeight: 800, fontSize: 16, ...(cs!.score < 0 ? { color: 'var(--bad)' } : {}) }}>{fmt(cs!.score)}</div>
                    </div>
                    {!cs!.complete ? <span className="chip gold" style={{ height: 20, fontSize: 11 }}>Belum lengkap</span> : rankMap.get(t.id) ? <div className="xs faint">peringkat {rankMap.get(t.id)}</div> : null}
                  </div>
                )}
                <Icon n="chev" size={18} />
              </Link>
            );
          })}
          {!rows.length && <div className="empty">Tidak ada regu.</div>}
        </div>
      </div>
    </div>
  );
}
