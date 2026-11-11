import { DEMO, EMAIL_DOMAIN, sb } from './supabase';
import { DEFAULT_CONFIG, mergeConfig } from './contests';
import { demoScores, demoTeams } from './seed';
import type { AuditRow, Config, Profile, ScoreRec, Team } from './types';
import type { Snapshot } from './snapshot';

export interface Loaded { teams: Team[]; scores: ScoreRec[]; config: Config; profiles: Profile[] }
export class NetErr extends Error {}
const toEmail = (u: string) => (u.includes('@') ? u.trim() : `${u.trim().toLowerCase()}@${EMAIL_DOMAIN}`);
const wrap = (e: { message: string; code?: string } | null) => {
  if (!e) return;
  if (/fetch|network|timeout|load failed/i.test(e.message)) throw new NetErr(e.message);
  throw new Error(e.code === '42501' ? 'Tidak punya izin untuk aksi ini.' : e.message);
};

/* ---------- demo (localStorage) ---------- */
const LS = 'panji.demo.v2';
interface Demo { teams: Team[]; scores: ScoreRec[]; config: Config; users: (Profile & { password: string })[]; snapshot: Snapshot | null; audit: AuditRow[]; me: string | null }
function dload(): Demo {
  try { const x = localStorage.getItem(LS); if (x) return JSON.parse(x); } catch { /* ignore */ }
  const d: Demo = {
    teams: demoTeams(), scores: [], config: structuredClone(DEFAULT_CONFIG), snapshot: null, audit: [], me: null,
    users: [
      { id: 'u-admin', username: 'admin', name: 'Admin Panitia', role: 'admin', contests: [], password: 'admin' },
      { id: 'u-juri', username: 'juri', name: 'Juri Contoh', role: 'juri', contests: [], password: 'juri' },
    ],
  };
  dsave(d); return d;
}
const dsave = (d: Demo) => localStorage.setItem(LS, JSON.stringify(d));
const strip = ({ password: _p, ...p }: Demo['users'][number]): Profile => p;
let audit = 0;

export const api = {
  async session(): Promise<Profile | null> {
    if (DEMO) { const d = dload(); const u = d.users.find((x) => x.id === d.me); return u ? strip(u) : null; }
    const { data } = await sb!.auth.getSession();
    return data.session ? api.profile(data.session.user.id) : null;
  },
  async profile(id: string): Promise<Profile | null> {
    const { data } = await sb!.from('profiles').select('*').eq('id', id).maybeSingle();
    return (data as Profile) ?? null;
  },
  async signIn(username: string, password: string): Promise<Profile> {
    if (DEMO) {
      const d = dload();
      const u = d.users.find((x) => x.username === username.trim().toLowerCase() && x.password === password);
      if (!u) throw new Error('Username atau kata sandi salah.');
      d.me = u.id; dsave(d); return strip(u);
    }
    const { data, error } = await sb!.auth.signInWithPassword({ email: toEmail(username), password });
    if (error) throw new Error(/invalid/i.test(error.message) ? 'Username atau kata sandi salah.' : error.message);
    const p = await api.profile(data.user.id);
    if (!p) throw new Error('Profil akun tidak ditemukan.');
    return p;
  },
  async signOut() { if (DEMO) { const d = dload(); d.me = null; dsave(d); } else await sb!.auth.signOut(); },

  async load(admin: boolean): Promise<Loaded> {
    if (DEMO) { const d = dload(); return { teams: d.teams, scores: d.scores, config: mergeConfig(d.config), profiles: d.users.map(strip) }; }
    const [t, s, c, p] = await Promise.all([
      sb!.from('teams').select('*').order('no'),
      sb!.from('scores').select('*'),
      sb!.from('settings').select('value').eq('key', 'config').maybeSingle(),
      admin ? sb!.from('profiles').select('*') : Promise.resolve({ data: [] as Profile[], error: null }),
    ]);
    wrap(t.error); wrap(s.error);
    return { teams: (t.data ?? []) as Team[], scores: (s.data ?? []) as ScoreRec[], config: mergeConfig(c.data?.value as Config | undefined), profiles: (p.data ?? []) as Profile[] };
  },

  async saveScore(r: ScoreRec, me: Profile) {
    if (DEMO) {
      const d = dload(); const i = d.scores.findIndex((x) => x.team_id === r.team_id && x.contest === r.contest);
      const t = d.teams.find((x) => x.id === r.team_id);
      d.audit.unshift({ id: ++audit, at: new Date().toISOString(), who: me.name, team: t ? `#${t.no} ${t.name}` : r.team_id, contest: r.contest, action: i < 0 ? 'input' : 'ubah', detail: r.dq ? 'Diskualifikasi' : '' });
      const rec = { ...r, updated_by: me.id, updated_at: new Date().toISOString() };
      if (i < 0) d.scores.push(rec); else d.scores[i] = rec;
      d.audit = d.audit.slice(0, 300); dsave(d); return;
    }
    const { error } = await sb!.from('scores').upsert({ team_id: r.team_id, contest: r.contest, data: r.data, dq: r.dq, note: r.note }, { onConflict: 'team_id,contest' });
    wrap(error);
  },
  async deleteScore(team_id: string, contest: string) {
    if (DEMO) { const d = dload(); d.scores = d.scores.filter((x) => !(x.team_id === team_id && x.contest === contest)); dsave(d); return; }
    const { error } = await sb!.from('scores').delete().eq('team_id', team_id).eq('contest', contest); wrap(error);
  },

  async saveTeam(t: Omit<Team, 'id'> & { id?: string }) {
    if (DEMO) {
      const d = dload();
      if (d.teams.some((x) => x.no === t.no && x.id !== t.id)) throw new Error(`Nomor ${t.no} sudah dipakai.`);
      if (t.id) d.teams = d.teams.map((x) => (x.id === t.id ? { ...x, ...t } as Team : x));
      else d.teams.push({ ...t, id: `demo-${Date.now()}-${t.no}` } as Team);
      d.teams.sort((a, b) => a.no - b.no); dsave(d); return;
    }
    const row = { no: t.no, name: t.name, pangkalan: t.pangkalan, gudep: t.gudep, dq: t.dq, tie_order: t.tie_order };
    const { error } = t.id ? await sb!.from('teams').update(row).eq('id', t.id) : await sb!.from('teams').insert(row);
    if (error?.code === '23505') throw new Error(`Nomor ${t.no} sudah dipakai.`);
    wrap(error);
  },
  async importTeams(rows: { no: number; name: string; pangkalan: string; gudep: string }[]) {
    if (DEMO) { for (const r of rows) { const d = dload(); const ex = d.teams.find((x) => x.no === r.no); await api.saveTeam({ ...r, dq: ex?.dq ?? false, tie_order: ex?.tie_order ?? null, id: ex?.id }); } return; }
    const { error } = await sb!.from('teams').upsert(rows, { onConflict: 'no' }); wrap(error);
  },
  async deleteTeam(id: string) {
    if (DEMO) { const d = dload(); d.teams = d.teams.filter((x) => x.id !== id); d.scores = d.scores.filter((x) => x.team_id !== id); dsave(d); return; }
    const { error } = await sb!.from('teams').delete().eq('id', id); wrap(error);
  },

  async clearScores() {
    if (DEMO) { const d = dload(); d.scores = []; d.audit = []; dsave(d); return; }
    const { error } = await sb!.from('scores').delete().neq('contest', ''); wrap(error);
  },
  async saveConfig(c: Config) {
    if (DEMO) { const d = dload(); d.config = c; dsave(d); return; }
    const { error } = await sb!.from('settings').upsert({ key: 'config', value: c, updated_at: new Date().toISOString() }); wrap(error);
  },

  async getSnapshot(): Promise<Snapshot | null> {
    if (DEMO) return dload().snapshot;
    const { data } = await sb!.from('snapshot').select('data').eq('id', 1).maybeSingle();
    return (data?.data as Snapshot) ?? null;
  },
  async publish(s: Snapshot) {
    if (DEMO) { const d = dload(); d.snapshot = s; dsave(d); return; }
    const { error } = await sb!.from('snapshot').upsert({ id: 1, data: s, published_at: s.at }); wrap(error);
  },

  async audit(): Promise<AuditRow[]> {
    if (DEMO) return dload().audit;
    const [l, p, t] = await Promise.all([
      sb!.from('score_log').select('*').order('id', { ascending: false }).limit(200),
      sb!.from('profiles').select('id,name'), sb!.from('teams').select('id,no,name'),
    ]);
    wrap(l.error);
    const pm = new Map((p.data ?? []).map((x) => [x.id, x.name])), tm = new Map((t.data ?? []).map((x) => [x.id, `#${x.no} ${x.name}`]));
    return (l.data ?? []).map((x) => ({
      id: x.id, at: x.at, who: pm.get(x.who) ?? '—', team: tm.get(x.team_id) ?? '—', contest: x.contest, action: x.action,
      detail: x.new?.dq ? 'Diskualifikasi' : '',
    }));
  },

  /* ---------- akun ---------- */
  async users(call: 'POST' | 'PATCH' | 'DELETE', body: Record<string, unknown>) {
    if (DEMO) {
      const d = dload();
      if (call === 'POST') {
        const u = String(body.username ?? '').trim().toLowerCase();
        if (!/^[a-z0-9._-]{3,24}$/.test(u)) throw new Error('Username 3–24 karakter: huruf kecil, angka, titik, strip.');
        if (String(body.password ?? '').length < 6) throw new Error('Kata sandi minimal 6 karakter.');
        if (d.users.some((x) => x.username === u)) throw new Error('Username sudah dipakai.');
        d.users.push({ id: `u-${Date.now()}`, username: u, name: String(body.name || u), role: body.role === 'admin' ? 'admin' : 'juri', contests: (body.contests as string[]) ?? [], password: String(body.password) });
      } else if (call === 'PATCH') {
        d.users = d.users.map((x) => x.id === body.id ? { ...x, name: (body.name as string) ?? x.name, contests: (body.contests as string[]) ?? x.contests, password: (body.password as string) || x.password } : x);
      } else {
        if (body.id === d.me) throw new Error('Tidak bisa menghapus akun sendiri.');
        d.users = d.users.filter((x) => x.id !== body.id);
      }
      dsave(d); return;
    }
    const { data } = await sb!.auth.getSession();
    const r = await fetch(call === 'DELETE' ? `/api/users?id=${body.id}` : '/api/users', {
      method: call, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token}` },
      body: call === 'DELETE' ? undefined : JSON.stringify(body),
    }).catch(() => { throw new NetErr('Tidak ada koneksi.'); });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error ?? 'Gagal.');
  },

  /* ---------- demo only ---------- */
  fillDemo() { const d = dload(); d.scores = demoScores(d.teams, mergeConfig(d.config)); dsave(d); },
  resetDemo() { localStorage.removeItem(LS); },

  subscribe(cb: () => void): () => void {
    if (DEMO) return () => {};
    const ch = sb!.channel('live').on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, cb)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, cb)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, cb).subscribe();
    return () => { sb!.removeChannel(ch); };
  },
};
