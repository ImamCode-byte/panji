import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api, NetErr, type Loaded } from './data';
import { DEFAULT_CONFIG } from './contests';
import { computeStandings, type Standings } from './scoring';
import { buildSnapshot } from './snapshot';
import { DEMO } from './supabase';
import type { Config, Profile, ScoreRec, Team } from './types';

const QK = 'panji.queue.v1';
const readQ = (): ScoreRec[] => { try { return JSON.parse(localStorage.getItem(QK) || '[]'); } catch { return []; } };
const writeQ = (q: ScoreRec[]) => localStorage.setItem(QK, JSON.stringify(q));
const sameKey = (a: ScoreRec, b: ScoreRec) => a.team_id === b.team_id && a.contest === b.contest;

export interface Toast { id: number; msg: string; kind: 'ok' | 'err' }
interface Ctx {
  me: Profile | null; booting: boolean; loading: boolean; online: boolean; pending: number; demo: boolean;
  teams: Team[]; scores: ScoreRec[]; cfg: Config; profiles: Profile[]; st: Standings; toasts: Toast[];
  toast: (msg: string, kind?: Toast['kind']) => void;
  signIn: (u: string, p: string) => Promise<void>; signOut: () => Promise<void>; reload: () => Promise<void>;
  saveScore: (r: ScoreRec) => Promise<'saved' | 'queued'>; removeScore: (team: string, contest: string) => Promise<void>;
  publish: () => Promise<void>;
  /** jalankan aksi admin lalu muat ulang data */
  act: <T>(fn: () => Promise<T>) => Promise<T>;
}
const C = createContext<Ctx>(null as unknown as Ctx);
export const useApp = () => useContext(C);

export function AppProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Profile | null>(null);
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState(readQ().length);
  const [data, setData] = useState<Loaded>({ teams: [], scores: [], config: DEFAULT_CONFIG, profiles: [] });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const meRef = useRef<Profile | null>(null);
  const flushing = useRef(false);
  meRef.current = me;

  const toast = useCallback((msg: string, kind: Toast['kind'] = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'err' ? 5000 : 2600);
  }, []);

  const overlay = (scores: ScoreRec[]) => {
    const q = readQ(); if (!q.length) return scores;
    const rest = scores.filter((s) => !q.some((x) => sameKey(x, s)));
    return [...rest, ...q];
  };
  const reload = useCallback(async () => {
    const m = meRef.current; if (!m) return;
    try {
      const d = await api.load(m.role === 'admin');
      setData({ ...d, scores: overlay(d.scores) });
    } catch (e) { if (!(e instanceof NetErr)) console.error(e); }
  }, []);

  const flush = useCallback(async () => {
    const m = meRef.current; if (!m || flushing.current) return;
    const q = readQ(); if (!q.length) return;
    flushing.current = true;
    const rest: ScoreRec[] = [];
    for (const r of q) {
      try { await api.saveScore(r, m); } catch (e) { if (e instanceof NetErr) rest.push(r); else toast((e as Error).message, 'err'); }
    }
    writeQ(rest); setPending(rest.length); flushing.current = false;
    if (rest.length < q.length) { toast(`${q.length - rest.length} nilai tersinkron`); await reload(); }
  }, [reload, toast]);

  useEffect(() => {
    api.session().then((p) => { setMe(p); setBooting(false); }).catch(() => setBooting(false));
    const on = () => { setOnline(true); flush(); }, off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, [flush]);

  useEffect(() => {
    if (!me) return;
    setLoading(true); reload().finally(() => setLoading(false)); flush();
    let t: ReturnType<typeof setTimeout>;
    const debounced = () => { clearTimeout(t); t = setTimeout(reload, 350); };
    const unsub = api.subscribe(debounced);
    const iv = setInterval(() => { if (document.visibilityState === 'visible') { flush(); reload(); } }, 20000);
    return () => { unsub(); clearInterval(iv); clearTimeout(t); };
  }, [me, reload, flush]);

  const st = useMemo(() => computeStandings(data.teams, data.scores, data.config), [data]);

  const signIn = useCallback(async (u: string, p: string) => { setMe(await api.signIn(u, p)); }, []);
  const signOut = useCallback(async () => { await api.signOut(); setMe(null); setData({ teams: [], scores: [], config: DEFAULT_CONFIG, profiles: [] }); }, []);

  const saveScore = useCallback(async (r: ScoreRec) => {
    const m = meRef.current!;
    const rec = { ...r, updated_by: m.id, updated_at: new Date().toISOString() };
    setData((d) => ({ ...d, scores: [...d.scores.filter((s) => !sameKey(s, rec)), rec] }));
    try {
      await api.saveScore(rec, m);
      return 'saved' as const;
    } catch (e) {
      if (e instanceof NetErr || !navigator.onLine) {
        const q = readQ().filter((x) => !sameKey(x, rec)); q.push(rec); writeQ(q); setPending(q.length);
        return 'queued' as const;
      }
      await reload(); throw e;
    }
  }, [reload]);
  const removeScore = useCallback(async (team: string, contest: string) => {
    await api.deleteScore(team, contest);
    setData((d) => ({ ...d, scores: d.scores.filter((s) => !(s.team_id === team && s.contest === contest)) }));
  }, []);
  const act = useCallback(async <T,>(fn: () => Promise<T>) => { const r = await fn(); await reload(); return r; }, [reload]);
  const publish = useCallback(async () => { await api.publish(buildSnapshot(st, data.config, data.teams)); }, [st, data]);

  const v: Ctx = {
    me, booting, loading, online, pending, demo: DEMO, ...data, cfg: data.config, st, toasts, toast,
    signIn, signOut, reload, saveScore, removeScore, publish, act,
  };
  return <C.Provider value={v}>{children}</C.Provider>;
}
