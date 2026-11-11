import type { Config, Team } from './types';
import type { Standings } from './scoring';

export interface Snapshot {
  at: string; event: Config['event']; complete: boolean; recap: { key: string; name: string; max: number }[];
  rows: { rank: number; no: number; name: string; pangkalan: string; total: number; done: number; award: string | null; tie: boolean; out: boolean; s: Record<string, number | null> }[];
  awards: { group: string; label: string; rank: number; no: number; name: string; pangkalan: string; total: number }[];
  favorit: { rank: number; pangkalan: string; total: number; names: string[] }[];
  podium: { key: string; name: string; items: { rank: number; no: number; name: string; pangkalan: string; score: number }[] }[];
}

export function buildSnapshot(st: Standings, cfg: Config, teams: Team[]): Snapshot {
  const tm = new Map(teams.map((t) => [t.id, t]));
  const names: Record<string, string> = Object.fromEntries(cfg.contests.map((d) => [d.key, d.name]));
  names.msc = 'Memory Scout Challenge';
  const keys = [...st.recap.map((r) => r.key), 'danton', 'tergiat'];
  return {
    at: new Date().toISOString(), event: cfg.event, complete: st.complete, recap: st.recap,
    rows: st.rows.map((r) => ({ rank: r.rank, no: r.team.no, name: r.team.name, pangkalan: r.team.pangkalan, total: r.total, done: r.done, award: r.award, tie: r.tie, out: r.out, s: r.scores })),
    awards: st.awards.map((a) => ({ group: a.group, label: a.label, rank: a.rank, no: a.team.no, name: a.team.name, pangkalan: a.team.pangkalan, total: a.total })),
    favorit: st.favorit.map((f) => ({ rank: f.rank, pangkalan: f.pangkalan, total: f.total, names: f.teams.map((t) => t.name) })),
    podium: keys.map((k) => ({
      key: k, name: names[k] ?? k,
      items: (st.per[k] ?? []).filter((r) => r.rank >= 1 && r.rank <= 3).map((r) => {
        const t = tm.get(r.teamId)!; return { rank: r.rank, no: t.no, name: t.name, pangkalan: t.pangkalan, score: r.score };
      }),
    })).filter((p) => p.items.length),
  };
}
