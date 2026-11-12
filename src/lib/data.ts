import { DEMO, EMAIL_DOMAIN, sb } from './supabase';
import { DEFAULT_CONFIG, mergeConfig } from './contests';
import { demoScores, demoTeams } from './seed';
import type { AuditRow, Config, LoginLog, Profile, ScoreRec, Team } from './types';
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
interface Demo { teams: Team[]; scores: ScoreRec[]; config: Config; users: (Profile & { password: string })[]; snapshot: Snapshot | null; audit: AuditRow[]; login_logs?: LoginLog[]; me: string | null }
function dload(): Demo {
  try { const x = localStorage.getItem(LS); if (x) return JSON.parse(x); } catch { /* ignore */ }
  const d: Demo = {
    teams: demoTeams(), scores: [], config: structuredClone(DEFAULT_CONFIG), snapshot: null, audit: [], login_logs: [], me: null,
    users: [
      { id: 'u-admin', username: 'admin', name: 'Admin Developer', role: 'admin', contests: [], password: 'admin', email: 'imamdhespachito001@gmail.com' },
      { id: 'u-juri', username: 'juri', name: 'Juri Contoh', role: 'juri', contests: [], password: 'juri', email: 'juri@panji.internal' },
    ],
  };
  dsave(d); return d;
}
const dsave = (d: Demo) => localStorage.setItem(LS, JSON.stringify(d));
const strip = ({ password: _p, ...p }: Demo['users'][number]): Profile => p;
let audit = 0;

function parseDevice(): string {
  if (typeof navigator === 'undefined') return 'Tidak diketahui';
  const ua = navigator.userAgent;
  let os = 'Perangkat Lain';
  if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  let browser = 'Browser';
  if (/chrome|crios/i.test(ua) && !/edge|edg|opr/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = 'Safari';
  else if (/edg/i.test(ua)) browser = 'Edge';
  else if (/opr|opera/i.test(ua)) browser = 'Opera';

  return `${os} · ${browser}`;
}

async function fetchGeoLocation(): Promise<{ ip: string; city: string; region: string; country: string; latitude: number | null; longitude: number | null; maps_url: string }> {
  const fallback = { ip: '', city: 'Tidak diketahui', region: '', country: 'Indonesia', latitude: null as number | null, longitude: null as number | null, maps_url: '' };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://ipwho.is/', { signal: controller.signal }).catch(() => null);
    clearTimeout(timer);
    if (res && res.ok) {
      const data = await res.json();
      if (data && data.success !== false) {
        const lat = typeof data.latitude === 'number' ? data.latitude : null;
        const lon = typeof data.longitude === 'number' ? data.longitude : null;
        const maps_url = lat != null && lon != null
          ? `https://www.google.com/maps?q=${lat},${lon}`
          : data.city ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${data.city}, ${data.region || ''}`)}` : '';
        return { ip: data.ip || '', city: data.city || 'Tidak diketahui', region: data.region || '', country: data.country || 'Indonesia', latitude: lat, longitude: lon, maps_url };
      }
    }
  } catch { /* ignore */ }
  return fallback;
}

async function getDeviceGPS(): Promise<{ latitude: number; longitude: number; accuracy: number } | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return null;
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), 8000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        });
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 7500,
        maximumAge: 0,
      }
    );
  });
}

async function fetchRealLocation(): Promise<{
  ip: string;
  city: string;
  region: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  source: 'gps' | 'ip';
  maps_url: string;
}> {
  const [gps, ipInfo] = await Promise.all([
    getDeviceGPS(),
    fetchGeoLocation(),
  ]);

  if (gps) {
    const lat = gps.latitude;
    const lon = gps.longitude;
    return {
      ip: ipInfo.ip,
      city: ipInfo.city !== 'Tidak diketahui' ? ipInfo.city : 'Titik GPS Terdeteksi',
      region: ipInfo.region || '',
      country: ipInfo.country || 'Indonesia',
      latitude: lat,
      longitude: lon,
      accuracy: gps.accuracy,
      source: 'gps',
      maps_url: `https://www.google.com/maps?q=${lat},${lon}`,
    };
  }

  return {
    ...ipInfo,
    accuracy: null,
    source: 'ip',
  };
}

async function recordLogin(user: { id?: string; username: string; name: string; role: string; email?: string }) {
  try {
    const geo = await fetchRealLocation();
    const device = parseDevice();
    const email = user.email || (user.username.includes('@') ? user.username : `${user.username}@panji.internal`);
    const logItem: LoginLog = {
      id: DEMO ? `log-${Date.now()}` : 0,
      user_id: user.id,
      username: user.username,
      name: user.name,
      email,
      role: user.role,
      ip: geo.ip,
      city: geo.city,
      region: geo.region,
      country: geo.country,
      latitude: geo.latitude,
      longitude: geo.longitude,
      accuracy: geo.accuracy,
      source: geo.source,
      maps_url: geo.maps_url,
      device,
      at: new Date().toISOString(),
    };

    if (DEMO) {
      const d = dload();
      if (!d.login_logs) d.login_logs = [];
      d.login_logs.unshift(logItem);
      d.login_logs = d.login_logs.slice(0, 200);
      dsave(d);
      return;
    }

    if (sb) {
      const row: Record<string, unknown> = {
        user_id: user.id || null,
        username: user.username,
        name: user.name,
        email,
        role: user.role,
        ip: geo.ip,
        city: geo.city,
        region: geo.region,
        country: geo.country,
        latitude: geo.latitude,
        longitude: geo.longitude,
        accuracy: geo.accuracy,
        source: geo.source,
        maps_url: geo.maps_url,
        device,
      };
      let res = await sb.from('login_logs').insert(row);
      if (res.error && (res.error.message?.includes('accuracy') || res.error.message?.includes('source'))) {
        delete row.accuracy;
        delete row.source;
        res = await sb.from('login_logs').insert(row);
      }
    }
  } catch (e) {
    console.warn('Gagal mencatat login_logs:', e);
  }
}

export const api = {
  async session(): Promise<Profile | null> {
    if (DEMO) {
      const d = dload(); const u = d.users.find((x) => x.id === d.me);
      if (!u) return null;
      const prof = strip(u);
      if (prof.username === 'admin') prof.email = 'imamdhespachito001@gmail.com';
      return prof;
    }
    const { data } = await sb!.auth.getSession();
    if (!data.session) return null;
    const p = await api.profile(data.session.user.id);
    if (p && data.session.user.email) p.email = data.session.user.email;
    return p;
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
      d.me = u.id; dsave(d);
      const prof = strip(u);
      if (prof.username === 'admin') prof.email = 'imamdhespachito001@gmail.com';
      recordLogin(prof).catch(() => {});
      return prof;
    }
    const { data, error } = await sb!.auth.signInWithPassword({ email: toEmail(username), password });
    if (error) throw new Error(/invalid/i.test(error.message) ? 'Username atau kata sandi salah.' : error.message);
    const p = await api.profile(data.user.id);
    if (!p) throw new Error('Profil akun tidak ditemukan.');
    if (data.user.email) p.email = data.user.email;
    recordLogin(p).catch(() => {});
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
    const row: Record<string, unknown> = { no: t.no, name: t.name, pangkalan: t.pangkalan, gudep: t.gudep, dq: t.dq, tie_order: t.tie_order };
    if (t.alamat !== undefined) row.alamat = t.alamat;
    let res = t.id ? await sb!.from('teams').update(row).eq('id', t.id) : await sb!.from('teams').insert(row);
    if (res.error && (res.error.message?.includes('alamat') || res.error.code === 'PGRST204')) {
      delete row.alamat;
      res = t.id ? await sb!.from('teams').update(row).eq('id', t.id) : await sb!.from('teams').insert(row);
    }
    if (res.error?.code === '23505') throw new Error(`Nomor ${t.no} sudah dipakai.`);
    wrap(res.error);
  },
  async importTeams(rows: { no: number; name: string; pangkalan: string; gudep: string; alamat?: string }[]) {
    if (DEMO) { for (const r of rows) { const d = dload(); const ex = d.teams.find((x) => x.no === r.no); await api.saveTeam({ ...r, dq: ex?.dq ?? false, tie_order: ex?.tie_order ?? null, id: ex?.id }); } return; }
    let { error } = await sb!.from('teams').upsert(rows, { onConflict: 'no' });
    if (error && (error.message?.includes('alamat') || error.code === 'PGRST204')) {
      const noAlamat = rows.map(({ alamat, ...rest }) => rest);
      const retry = await sb!.from('teams').upsert(noAlamat, { onConflict: 'no' });
      error = retry.error;
    }
    wrap(error);
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

  async loginLogs(): Promise<LoginLog[]> {
    if (DEMO) {
      const d = dload();
      return (d.login_logs && d.login_logs.length > 0)
        ? d.login_logs
        : [
            {
              id: 'demo-sample-1',
              username: 'admin',
              name: 'Admin Developer',
              email: 'imamdhespachito001@gmail.com',
              role: 'admin',
              ip: '180.252.164.21',
              city: 'Pamekasan',
              region: 'Jawa Timur',
              country: 'Indonesia',
              latitude: -7.1611,
              longitude: 113.4831,
              maps_url: 'https://www.google.com/maps?q=-7.1611,113.4831',
              device: 'Android · Chrome',
              at: new Date().toISOString(),
            },
          ];
    }
    const { data, error } = await sb!.from('login_logs').select('*').order('id', { ascending: false }).limit(200);
    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) return [];
      wrap(error);
    }
    return (data as LoginLog[]) ?? [];
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, cb)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, cb).subscribe();
    return () => { sb!.removeChannel(ch); };
  },
};
