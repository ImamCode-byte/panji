import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { fmt, Icon, Stepper, Switch } from '../components/ui';
import { canJudge } from '../lib/access';
import { eligible, hhmm } from '../lib/progress';
import { contestScore, instMax, reps, scoreMax } from '../lib/scoring';
import { useApp } from '../lib/store';
import type { ContestDef, ScoreData, ScoreRec } from '../lib/types';

const toNum = (s: string) => (s.trim() === '' ? null : parseFloat(s.replace(',', '.')));
const str = (n: number | null | undefined) => (n == null ? '' : String(n));

export default function ScoreForm() {
  const { key = '', teamId = '' } = useParams();
  const { me, cfg, teams, scores, st, profiles, saveScore, removeScore, toast } = useApp();
  const nav = useNavigate();
  const def = cfg.contests.find((c) => c.key === key);
  const team = teams.find((t) => t.id === teamId);
  const existing = scores.find((s) => s.team_id === teamId && s.contest === key);
  if (!def || !team || !canJudge(me, key)) return <Navigate to={`/app/input/${key}`} replace />;
  return <Form key={`${key}-${teamId}-${existing?.updated_at ?? 'new'}`} def={def} teamId={teamId} existing={existing}
    onDone={(next) => nav(next ? `/app/input/${key}/${next}` : `/app/input/${key}`, { replace: true })}
    ctx={{ me, teams, scores, st, cfg, profiles, saveScore, removeScore, toast }} nav={() => nav(`/app/input/${key}`)} />;
}

type Ctx = Pick<ReturnType<typeof useApp>, 'me' | 'teams' | 'scores' | 'st' | 'cfg' | 'profiles' | 'saveScore' | 'removeScore' | 'toast'>;
function Form({ def, teamId, existing, onDone, ctx, nav }: { def: ContestDef; teamId: string; existing?: ScoreRec; onDone: (next?: string) => void; ctx: Ctx; nav: () => void }) {
  const { me, teams, scores, st, cfg, profiles, saveScore, removeScore, toast } = ctx;
  const team = teams.find((t) => t.id === teamId)!;
  const [vals, setVals] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(def.criteria.map((c) => [c.id, Array.from({ length: reps(c) }, (_, i) => str(existing?.data.c?.[c.id]?.[i]))])));
  const [pen, setPen] = useState<Record<string, number>>(() => ({ ...(existing?.data.p ?? {}) }));
  const [tm, setTm] = useState(str(existing?.data.t?.m)); const [ts, setTs] = useState(str(existing?.data.t?.s));
  const [dq, setDq] = useState(existing?.dq ?? false); const [note, setNote] = useState(existing?.note ?? '');
  const [busy, setBusy] = useState(false);

  const bad = (c: (typeof def.criteria)[number], i: number) => {
    const n = toNum(vals[c.id][i]); if (n == null) return false;
    return !Number.isFinite(n) || n < 0 || n > instMax(c) || (!!c.int && !Number.isInteger(n));
  };
  const empties = def.criteria.reduce((a, c) => a + vals[c.id].filter((v) => v.trim() === '').length, 0) + (def.time && !tm.trim() && !ts.trim() ? 1 : 0);
  const invalid = def.criteria.some((c) => vals[c.id].some((_, i) => bad(c, i))) || (!!def.time && (Number(tm || 0) < 0 || Number(ts || 0) > 59 || Number(ts || 0) < 0));

  const data: ScoreData = useMemo(() => ({
    c: Object.fromEntries(def.criteria.map((c) => [c.id, vals[c.id].map(toNum)])),
    p: Object.fromEntries(Object.entries(pen).filter(([, v]) => v > 0)),
    ...(def.time && (tm.trim() || ts.trim()) ? { t: { m: Number(tm) || 0, s: Number(ts) || 0 } } : {}),
  }), [vals, pen, tm, ts, def]);
  const cs = contestScore(def, { data, dq });
  const max = scoreMax(def);

  const nextTeam = () => {
    const list = eligible(def.key, teams, st, cfg);
    const after = list.filter((t) => t.no > team.no && !scores.some((s) => s.contest === def.key && s.team_id === t.id));
    return after[0]?.id;
  };
  const save = async () => {
    if (invalid) { toast('Ada isian di luar batas nilai', 'err'); return; }
    setBusy(true);
    try {
      const r = await saveScore({ team_id: teamId, contest: def.key, data: dq ? { c: {}, p: {} } : data, dq, note: note.trim() });
      toast(r === 'queued' ? 'Disimpan di perangkat, menunggu sinyal' : empties && !dq ? `Tersimpan · ${empties} isian masih kosong` : 'Nilai tersimpan');
      onDone(nextTeam());
    } catch (e) { toast((e as Error).message, 'err'); } finally { setBusy(false); }
  };
  const del = async () => {
    if (!confirm('Hapus nilai regu ini?')) return;
    try { await removeScore(teamId, def.key); toast('Nilai dihapus'); onDone(); } catch (e) { toast((e as Error).message, 'err'); }
  };

  const groups: [string, typeof def.criteria][] = [];
  for (const c of def.criteria) { const g = c.group ?? 'Penilaian'; const f = groups.find((x) => x[0] === g); f ? f[1].push(c) : groups.push([g, [c]]); }
  const by = existing?.updated_by === me?.id ? 'Anda' : profiles.find((p) => p.id === existing?.updated_by)?.name;

  return (
    <div className="page" style={{ paddingBottom: 150 }}>
      <button className="btn ghost sm" style={{ marginLeft: -10, marginBottom: 6 }} onClick={nav}><Icon n="back" size={18} />{def.name}</button>
      <div className="card pad row" style={{ marginBottom: 14 }}>
        <span className="noBadge" style={{ width: 48, height: 48, fontSize: 18, borderRadius: 12 }}>{String(team.no).padStart(2, '0')}</span>
        <div className="grow"><div className="disp" style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.15 }}>{team.name}</div><div className="xs muted trunc">{team.pangkalan}</div></div>
      </div>
      {existing && <p className="xs muted" style={{ marginBottom: 12 }}>Sudah dinilai{by ? ` oleh ${by}` : ''}{existing.updated_at ? ` · ${hhmm(existing.updated_at)}` : ''}</p>}
      {def.note && <p className="xs muted" style={{ marginBottom: 12 }}>{def.note}</p>}

      <div className="stack lg" style={{ maxWidth: 760 }}>
        <div className={dq ? 'dqbox' : 'card pad'}>
          <div className="row between"><div><b>Diskualifikasi</b><div className="xs muted">Nilai lomba ini menjadi 0</div></div><Switch bad on={dq} onChange={setDq} label="Diskualifikasi" /></div>
          {dq && <div className="stack" style={{ marginTop: 12 }}>
            <div className="row wrap" style={{ gap: 6 }}>{def.dqNotes.map((n) => <button key={n} type="button" className={`chip ${note === n ? 'bad' : ''}`} style={{ height: 30, cursor: 'pointer', border: 0 }} onClick={() => setNote(n)}>{n}</button>)}</div>
            <input className="input" placeholder="Alasan diskualifikasi" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>}
        </div>

        <div className={`stack lg ${dq ? 'dim' : ''}`}>
          {groups.map(([g, cs2]) => (
            <section key={g} className="card" style={{ overflow: 'hidden' }}>
              <div className="sec-t">{g}</div>
              {cs2.map((c) => (
                <div key={c.id} className="crit">
                  <div className="h"><span className="lb">{c.label}</span><span className="mx num">maks {fmt(c.max)}{c.repeat && c.agg !== 'avg' ? ` (${fmt(instMax(c))}/${(c.repeatLabels?.[0] ?? '').toLowerCase().replace(/\s?\d$/, '') || 'sesi'})` : ''}</span></div>
                  {c.hint && <div className="xs faint">{c.hint}</div>}
                  {reps(c) === 1 ? (
                    <Stepper label={c.label} max={instMax(c)} value={vals[c.id][0]} decimal={!c.int} bad={bad(c, 0)}
                      onChange={(v) => setVals((s) => ({ ...s, [c.id]: [v] }))} />
                  ) : (
                    <div className="reps">{vals[c.id].map((v, i) => (
                      <div key={i}><div className="rl">{c.repeatLabels?.[i] ?? `#${i + 1}`}</div>
                        <Stepper label={`${c.label} ${c.repeatLabels?.[i] ?? i + 1}`} max={instMax(c)} value={v} bad={bad(c, i)}
                          onChange={(nv) => setVals((s) => ({ ...s, [c.id]: s[c.id].map((x, j) => (j === i ? nv : x)) }))} /></div>
                    ))}</div>
                  )}
                </div>
              ))}
            </section>
          ))}

          {def.time && (
            <section className="card" style={{ overflow: 'hidden' }}>
              <div className="sec-t">Waktu</div>
              <div className="crit"><div className="h"><span className="lb">{def.time.label}</span></div>
                {def.time.hint && <div className="xs faint">{def.time.hint}</div>}
                <div className="reps" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div><div className="rl">Menit</div><Stepper label="Menit" max={999} decimal={false} value={tm} onChange={setTm} /></div>
                  <div><div className="rl">Detik</div><Stepper label="Detik" max={59} decimal={false} value={ts} onChange={setTs} /></div>
                </div>
              </div>
            </section>
          )}

          {def.penalties.length > 0 && (
            <section className="card" style={{ overflow: 'hidden' }}>
              <div className="sec-t">Pengurangan nilai</div>
              {def.penalties.map((p) => (
                <div key={p.id} className="crit" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <div className="grow"><div className="lb">{p.label}</div><div className="xs" style={{ color: 'var(--bad)', fontWeight: 700 }}>−{fmt(p.points)}{p.unit ? ` per ${p.unit}` : ''}</div></div>
                  {p.unit ? <div style={{ width: 150 }}><Stepper label={p.label} max={99} decimal={false} value={String(pen[p.id] ?? 0)} onChange={(v) => setPen((s) => ({ ...s, [p.id]: Number(v) || 0 }))} /></div>
                    : <Switch bad on={(pen[p.id] ?? 0) > 0} onChange={(v) => setPen((s) => ({ ...s, [p.id]: v ? 1 : 0 }))} label={p.label} />}
                </div>
              ))}
            </section>
          )}
        </div>

        <div className="field"><label htmlFor="n">Catatan juri (opsional)</label><textarea id="n" className="textarea" style={{ minHeight: 80 }} value={dq ? '' : note} disabled={dq} onChange={(e) => setNote(e.target.value)} /></div>
        {existing && me?.role === 'admin' && <button className="btn danger sm" style={{ alignSelf: 'flex-start' }} onClick={del}><Icon n="trash" size={17} />Hapus nilai</button>}
      </div>

      <div className="foot"><div className="in">
        <div className="grow">
          <div className="xs muted">{dq ? 'Diskualifikasi' : cs.penalty ? `Dikurangi ${fmt(cs.penalty)}` : 'Nilai'}</div>
          <div className="sc2 num">{fmt(cs.score)}<span className="faint" style={{ fontSize: 15, fontFamily: 'var(--f)' }}> / {fmt(max)}</span></div>
          {!dq && empties > 0 && <div className="xs" style={{ color: 'var(--accent)', fontWeight: 700 }}>{empties} isian kosong dihitung 0</div>}
        </div>
        <button className="btn primary" style={{ minWidth: 150 }} disabled={busy} onClick={save}><Icon n="check" size={18} />{busy ? 'Menyimpan…' : 'Simpan'}</button>
      </div></div>
    </div>
  );
}
