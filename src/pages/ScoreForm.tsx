import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { fmt, Icon, Stepper, Switch } from '../components/ui';
import { canJudge } from '../lib/access';
import { hhmm } from '../lib/progress';
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
    onDone={() => nav(`/app/input/${key}`, { replace: true })}
    ctx={{ me, teams, scores, st, cfg, profiles, saveScore, removeScore, toast }} nav={() => nav(`/app/input/${key}`)} />;
}

type Ctx = Pick<ReturnType<typeof useApp>, 'me' | 'teams' | 'scores' | 'st' | 'cfg' | 'profiles' | 'saveScore' | 'removeScore' | 'toast'>;
function Form({ def, teamId, existing, onDone, ctx, nav }: { def: ContestDef; teamId: string; existing?: ScoreRec; onDone: () => void; ctx: Ctx; nav: () => void }) {
  const { me, teams, scores, st, cfg, profiles, saveScore, removeScore, toast } = ctx;
  const team = teams.find((t) => t.id === teamId)!;
  const [vals, setVals] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(def.criteria.map((c) => [c.id, Array.from({ length: reps(c) }, (_, i) => str(existing?.data.c?.[c.id]?.[i]))])));
  const [pen, setPen] = useState<Record<string, number>>(() => ({ ...(existing?.data.p ?? {}) }));
  const [tm, setTm] = useState(str(existing?.data.t?.m)); const [ts, setTs] = useState(str(existing?.data.t?.s));
  const [dq, setDq] = useState(existing?.dq ?? false); const [note, setNote] = useState(existing?.note ?? '');
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isAdmin = me?.role === 'admin';
  const isSaved = !!existing;
  const bad = (c: (typeof def.criteria)[number], i: number) => {
    const n = toNum(vals[c.id][i]); if (n == null) return false;
    return !Number.isFinite(n) || n < 0 || n > instMax(c) || (!!c.int && !Number.isInteger(n));
  };
  const empties = def.criteria.reduce((a, c) => a + vals[c.id].filter((v) => v.trim() === '').length, 0) + (def.time && !tm.trim() && !ts.trim() ? 1 : 0);
  const invalid = def.criteria.some((c) => vals[c.id].some((_, i) => bad(c, i))) || (!!def.time && (Number(tm || 0) < 0 || Number(ts || 0) > 59 || Number(ts || 0) < 0));
  const isComplete = dq || empties === 0;

  // Nilai hanya terkunci bagi juri jika sudah berstatus locked (bukan draft locked: false) dan tidak sedang dibuka oleh Admin
  const isLocked = !isAdmin && isSaved && existing?.data?.locked !== false && !existing?.data?.unlocked;
  const isUnlockedByAdmin = !isAdmin && isSaved && !!existing?.data?.unlocked;
  const isDraft = !isAdmin && isSaved && existing?.data?.locked === false;

  const data: ScoreData = useMemo(() => ({
    c: Object.fromEntries(def.criteria.map((c) => [c.id, vals[c.id].map(toNum)])),
    p: Object.fromEntries(Object.entries(pen).filter(([, v]) => v > 0)),
    ...(def.time && (tm.trim() || ts.trim()) ? { t: { m: Number(tm) || 0, s: Number(ts) || 0 } } : {}),
  }), [vals, pen, tm, ts, def]);
  const cs = contestScore(def, { data, dq });
  const max = scoreMax(def);

  const handlePromptSave = () => {
    if (isLocked) return;
    if (invalid) { toast('Ada isian di luar batas nilai', 'err'); return; }
    setConfirmOpen(true);
  };

  const executeSave = async () => {
    setBusy(true);
    try {
      const willLock = isComplete; // Hanya dikunci jika seluruh kolom sudah terisi lengkap (empties === 0) atau DQ
      const payloadData: ScoreData = {
        ...(dq ? { c: {}, p: {} } : data),
        locked: willLock,
        unlocked: false,
      };
      const r = await saveScore({ team_id: teamId, contest: def.key, data: payloadData, dq, note: note.trim() });
      setConfirmOpen(false);
      if (!willLock) {
        toast(r === 'queued' ? 'Draf disimpan di perangkat (Belum dikunci)' : 'Draf tersimpan (Belum dikunci, bisa diedit lagi)');
      } else {
        toast(r === 'queued' ? 'Disimpan di perangkat & nilai dikunci' : isSaved ? 'Perubahan disimpan & nilai dikunci' : 'Nilai lengkap tersimpan & dikunci');
      }
      onDone();
    } catch (e) { toast((e as Error).message, 'err'); } finally { setBusy(false); }
  };

  const toggleAdminLock = async () => {
    if (!existing) return;
    const willUnlock = !existing.data?.unlocked;
    setBusy(true);
    try {
      await saveScore({
        team_id: teamId,
        contest: def.key,
        data: { ...existing.data, unlocked: willUnlock },
        dq: existing.dq,
        note: existing.note,
      });
      toast(willUnlock ? 'Kunci dibuka. Juri diizinkan mengubah nilai.' : 'Nilai dikunci kembali.');
    } catch (e) {
      toast((e as Error).message, 'err');
    } finally {
      setBusy(false);
    }
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
        <div className="grow"><div className="disp" style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.15 }}>{team.name}</div><div className="xs muted trunc">{team.pangkalan}{team.alamat ? ` · ${team.alamat}` : ''}</div></div>
      </div>

      <div className="row between wrap" style={{ gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <div className="xs muted">
          {existing ? (
            <>Sudah dinilai{by ? ` oleh ${by}` : ''}{existing.updated_at ? ` · ${hhmm(existing.updated_at)}` : ''}</>
          ) : (
            <span>Belum dinilai</span>
          )}
        </div>
        {isAdmin && existing && (
          <button
            type="button"
            className={`btn sm ${existing.data?.unlocked ? 'danger' : 'secondary'}`}
            onClick={toggleAdminLock}
            disabled={busy}
            style={{ height: 30, fontSize: 12 }}
          >
            <Icon n={existing.data?.unlocked ? 'lock' : 'unlock'} size={15} />
            {existing.data?.unlocked ? 'Kunci Kembali' : 'Buka Kunci (Izinkan Juri Ubah)'}
          </button>
        )}
      </div>

      {isLocked && (
        <div className="card pad" style={{ background: '#fffbeb', border: '1px solid #f59e0b', color: '#92400e', marginBottom: 14 }}>
          <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
            <div style={{ marginTop: 2 }}><Icon n="lock" size={20} /></div>
            <div>
              <b style={{ color: '#78350f', fontSize: 14 }}>Nilai Telah Dikunci</b>
              <div className="xs" style={{ marginTop: 4, lineHeight: 1.45 }}>
                Nilai regu ini sudah disimpan dan tidak dapat diubah lagi oleh juri. Jika terdapat kesalahan penginputan, hubungi <b>Admin</b> untuk meminta izin buka kunci nilai.
              </div>
            </div>
          </div>
        </div>
      )}

      {isUnlockedByAdmin && (
        <div className="card pad" style={{ background: '#f0fdf4', border: '1px solid #22c55e', color: '#166534', marginBottom: 14 }}>
          <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
            <div style={{ marginTop: 2 }}><Icon n="unlock" size={20} /></div>
            <div>
              <b style={{ color: '#14532d', fontSize: 14 }}>Izin Edit Diberikan oleh Admin</b>
              <div className="xs" style={{ marginTop: 4, lineHeight: 1.45 }}>
                Admin telah membuka kunci nilai ini. Silakan perbaiki data. Setelah menekan tombol <b>Simpan</b>, nilai akan <b>otomatis terkunci kembali</b> jika seluruh kolom telah lengkap.
              </div>
            </div>
          </div>
        </div>
      )}

      {isDraft && (
        <div className="card pad" style={{ background: '#fefce8', border: '1px solid #eab308', color: '#854d0e', marginBottom: 14 }}>
          <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
            <div style={{ marginTop: 2 }}><Icon n="pencil" size={20} /></div>
            <div>
              <b style={{ color: '#713f12', fontSize: 14 }}>Draf Nilai Sementara (Belum Dikunci)</b>
              <div className="xs" style={{ marginTop: 4, lineHeight: 1.45 }}>
                Nilai sebelumnya baru terisi sebagian sehingga belum dikunci. Anda masih bebas melengkapi kolom lainnya kapan saja. Nilai baru akan otomatis dikunci setelah seluruh kolom terisi lengkap.
              </div>
            </div>
          </div>
        </div>
      )}

      {def.note && <p className="xs muted" style={{ marginBottom: 12 }}>{def.note}</p>}

      <div className="stack lg" style={{ maxWidth: 760, ...(isLocked ? { pointerEvents: 'none', opacity: 0.62, userSelect: 'none' } : {}) }}>
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

      {createPortal(
        <div className="foot">
          <div className="in">
            <div className="grow">
              <div className="xs muted">{dq ? 'Diskualifikasi' : cs.penalty ? `Dikurangi ${fmt(cs.penalty)}` : 'Nilai'}</div>
              <div className="sc2 num">{fmt(cs.score)}<span className="faint" style={{ fontSize: 15, fontFamily: 'var(--f)' }}> / {fmt(max)}</span></div>
              {!dq && empties > 0 && <div className="xs" style={{ color: 'var(--accent)', fontWeight: 700 }}>{empties} isian belum diisi (Disimpan draf)</div>}
            </div>
            {isLocked ? (
              <button type="button" className="btn" disabled style={{ minWidth: 150, opacity: 0.8, cursor: 'not-allowed' }}>
                <Icon n="lock" size={17} /> Nilai Terkunci
              </button>
            ) : (
              <button type="button" className="btn primary" style={{ minWidth: 150 }} disabled={busy} onClick={handlePromptSave}>
                <Icon n={isComplete ? "check" : "pencil"} size={18} />
                {busy ? 'Menyimpan…' : !isComplete ? 'Simpan Draf' : isUnlockedByAdmin ? 'Simpan Perubahan' : 'Simpan & Kunci'}
              </button>
            )}
          </div>
        </div>,
        document.body
      )}

      {confirmOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div className="card pad stack" style={{ maxWidth: 440, width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <div className="row" style={{ gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 26 }}>{isComplete ? '🔒' : '📝'}</span>
              <div>
                <b style={{ fontSize: 16 }}>
                  {!isComplete
                    ? 'Simpan Draf Sementara'
                    : isSaved
                    ? 'Konfirmasi Simpan Perubahan'
                    : 'Konfirmasi Simpan & Kunci Nilai'}
                </b>
                <div className="xs muted">Regu {team.name} ({team.pangkalan}{team.alamat ? ` · ${team.alamat}` : ''})</div>
              </div>
            </div>
            <p className="sm" style={{ margin: '10px 0', lineHeight: 1.5 }}>
              {!isComplete
                ? `Masih ada ${empties} kolom nilai yang belum terisi. Nilai akan disimpan sebagai DRAF SEMENTARA dan TIDAK DIKUNCI, sehingga Anda bebas melengkapinya nanti kapan saja.`
                : isSaved
                ? `Semua nilai sudah lengkap. Setelah disimpan, nilai akan OTOMATIS TERKUNCI KEMBALI dan Anda harus meminta izin Admin lagi jika ingin mengubahnya.`
                : `Semua kolom nilai telah terisi lengkap. Setelah disimpan, nilai ini akan LANGSUNG DIKUNCI dan Anda TIDAK BISA mengubahnya lagi kecuali diizinkan oleh Admin.`}
            </p>
            <div className="row wrap between" style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)', gap: 8 }}>
              <button type="button" className="btn" onClick={() => { setConfirmOpen(false); nav(); }} disabled={busy}>
                Batal (Kembali)
              </button>
              <div className="row" style={{ gap: 8 }}>
                <button type="button" className="btn ghost sm" onClick={() => setConfirmOpen(false)} disabled={busy}>
                  Cek Lagi
                </button>
                <button type="button" className="btn primary" onClick={executeSave} disabled={busy}>
                  {busy ? 'Menyimpan…' : !isComplete ? 'Simpan Draf' : 'Oke, Simpan & Kunci'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
