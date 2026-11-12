import type { AwardGroup, Config, ContestDef, Criterion, ScoreData, ScoreRec, Team } from './types';

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];
export const roman = (n: number): string => {
  if (n <= 20) return ROMAN[n];
  const t: [number, string][] = [[40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let r = '';
  for (const [v, s] of t) while (n >= v) { r += s; n -= v; }
  return r;
};

export const reps = (c: Criterion) => c.repeat ?? 1;
export const instMax = (c: Criterion) => (c.repeat && c.agg !== 'avg' ? c.max / c.repeat : c.max);
export const secs = (d: ScoreData) => (d.t ? d.t.m * 60 + d.t.s : Infinity);
export const obstacleX = (d: ScoreData) => (d.t ? d.t.m + d.t.s / 100 : 0);

export function critValue(c: Criterion, d: ScoreData): number {
  const arr = d.c?.[c.id] ?? [];
  const n = reps(c);
  let s = 0;
  for (let i = 0; i < n; i++) s += clamp(Number(arr[i]) || 0, 0, instMax(c));
  return c.agg === 'avg' ? s / n : s;
}
export const rawMax = (def: ContestDef) => def.criteria.filter((c) => !c.noTotal).reduce((a, c) => a + c.max, 0);
export const scoreMax = (def: ContestDef) => (def.time?.formula === 'obstacle' ? 100 : def.normalizeTo ?? rawMax(def));

export function isComplete(def: ContestDef, d: ScoreData): boolean {
  for (const c of def.criteria) {
    const arr = d.c?.[c.id] ?? [];
    for (let i = 0; i < reps(c); i++) if (typeof arr[i] !== 'number' || !Number.isFinite(arr[i])) return false;
  }
  if (def.time && !d.t) return false;
  return true;
}

export interface CS { score: number; base: number; penalty: number; complete: boolean; dq: boolean }
export function contestScore(def: ContestDef, rec: Pick<ScoreRec, 'data' | 'dq'>): CS {
  const d = rec.data ?? { c: {}, p: {} };
  const complete = isComplete(def, d);
  if (rec.dq) return { score: 0, base: 0, penalty: 0, complete, dq: true };
  let base: number;
  if (def.time?.formula === 'obstacle') base = d.t ? Math.max(0, 100 - obstacleX(d)) : 0;
  else {
    const raw = def.criteria.filter((c) => !c.noTotal).reduce((a, c) => a + critValue(c, d), 0);
    const rm = rawMax(def);
    base = def.normalizeTo && rm > 0 ? (raw * def.normalizeTo) / rm : raw;
  }
  const penalty = def.penalties.reduce((a, p) => a + p.points * Math.max(0, Number(d.p?.[p.id]) || 0), 0);
  return { score: round2(Math.max(0, base - penalty)), base: round2(base), penalty, complete, dq: false };
}

export interface Entry { teamId: string; score: number; rec: ScoreRec; dq: boolean }
export interface Ranked { teamId: string; score: number; rank: number; tie: boolean; dq: boolean }

function keyVal(def: ContestDef, e: Entry, key: string): number {
  if (key === 'time') return -secs(e.rec.data);
  const c = def.criteria.find((x) => x.id === key);
  return c ? critValue(c, e.rec.data) : 0;
}
export function cmpEntries(def: ContestDef, a: Entry, b: Entry): number {
  if (a.dq !== b.dq) return a.dq ? 1 : -1;
  if (a.score !== b.score) return b.score - a.score;
  for (const k of def.tieBreak) {
    const x = round2(keyVal(def, a, k)), y = round2(keyVal(def, b, k));
    if (x !== y) return y - x;
  }
  return 0;
}
function assign(sorted: Entry[], cmp: (a: Entry, b: Entry) => number): Ranked[] {
  const out: Ranked[] = [];
  sorted.forEach((e, i) => {
    const same = i > 0 && !e.dq && !sorted[i - 1].dq && cmp(sorted[i - 1], e) === 0;
    const rank = e.dq ? 0 : same ? out[i - 1].rank : i + 1;
    out.push({ teamId: e.teamId, score: e.score, rank, tie: false, dq: e.dq });
    if (same) { out[i - 1].tie = true; out[i].tie = true; }
  });
  return out;
}
export const rankContest = (def: ContestDef, entries: Entry[]): Ranked[] =>
  assign([...entries].sort((a, b) => cmpEntries(def, a, b)), (a, b) => cmpEntries(def, a, b));

export function awardLabel(rank: number, groups: AwardGroup[]): string | null {
  for (const g of groups) if (rank >= g.start && rank < g.start + g.size) return g.size === 1 ? g.name : `${g.name} ${roman(rank - g.start + 1)}`;
  return null;
}

export interface Row {
  team: Team; scores: Record<string, number | null>; ranks: Record<string, number>;
  total: number; done: number; rank: number; tie: boolean; award: string | null; out: boolean;
}
export interface Standings {
  rows: Row[]; recap: { key: string; name: string; max: number }[]; of: number;
  per: Record<string, Ranked[]>;
  favorit: { pangkalan: string; total: number; rank: number; teams: Team[] }[];
  awards: { group: string; label: string; rank: number; team: Team; total: number }[];
  complete: boolean;
}

export function computeStandings(teams: Team[], scores: ScoreRec[], cfg: Config): Standings {
  const tm = new Map(teams.map((t) => [t.id, t]));
  const rec = new Map<string, Map<string, ScoreRec>>();
  for (const s of scores) {
    if (!tm.has(s.team_id)) continue;
    if (!rec.has(s.contest)) rec.set(s.contest, new Map());
    rec.get(s.contest)!.set(s.team_id, s);
  }
  const per: Record<string, Ranked[]> = {};
  const pts: Record<string, Map<string, number>> = {};
  const defs = new Map(cfg.contests.map((d) => [d.key, d]));
  for (const d of cfg.contests) {
    const entries: Entry[] = [];
    pts[d.key] = new Map();
    for (const [teamId, r] of rec.get(d.key) ?? []) {
      const cs = contestScore(d, r);
      entries.push({ teamId, score: cs.score, rec: r, dq: cs.dq });
      pts[d.key].set(teamId, cs.score);
    }
    per[d.key] = rankContest(d, entries);
  }

  // Memory Scout Challenge: tahap tertinggi yang dicapai dulu, lalu nilai tahap itu
  const { wPenyisihan: wp, wSemifinal: ws, wFinal: wf } = cfg.msc;
  const wsum = wp + ws + wf || 1;
  const stages = ['msc_penyisihan', 'msc_semifinal', 'msc_final'] as const;
  const mscIds = new Set<string>();
  stages.forEach((k) => rec.get(k)?.forEach((_, id) => mscIds.add(id)));
  const mscEntries: (Entry & { tier: number })[] = [];
  mscIds.forEach((id) => {
    const tier = rec.get('msc_final')?.has(id) ? 2 : rec.get('msc_semifinal')?.has(id) ? 1 : 0;
    const r = rec.get(stages[tier])!.get(id)!;
    const dq = stages.some((k) => rec.get(k)?.get(id)?.dq);
    const g = (k: string) => pts[k].get(id) ?? 0;
    const score = round2((wp * g('msc_penyisihan') + ws * g('msc_semifinal') + wf * g('msc_final')) / wsum);
    mscEntries.push({ teamId: id, score, rec: r, dq, tier });
  });
  const mscCmp = (a: Entry, b: Entry) => {
    const x = a as Entry & { tier: number }, y = b as Entry & { tier: number };
    if (x.dq !== y.dq) return x.dq ? 1 : -1;
    if (x.tier !== y.tier) return y.tier - x.tier;
    const sd = defs.get(stages[x.tier])!;
    const ca = contestScore(sd, x.rec).score, cb = contestScore(sd, y.rec).score;
    if (ca !== cb) return cb - ca;
    return cmpEntries(sd, { ...x, score: ca }, { ...y, score: cb });
  };
  per.msc = assign([...mscEntries].sort(mscCmp), mscCmp);
  pts.msc = new Map(mscEntries.map((e) => [e.teamId, e.dq ? 0 : e.score]));

  const recap = [
    ...cfg.contests.filter((d) => !d.stage && d.inRecap).map((d) => ({ key: d.key, name: d.name, max: scoreMax(d) })),
    ...(defs.get('msc_penyisihan')?.inRecap ? [{ key: 'msc', name: 'Memory Scout Challenge', max: 100 }] : []),
  ];
  const rankOf = (k: string, id: string) => per[k]?.find((r) => r.teamId === id)?.rank ?? 0;

  const rows: Row[] = teams.map((team) => {
    const scoresMap: Record<string, number | null> = {}, ranks: Record<string, number> = {};
    let total = 0, done = 0;
    for (const r of recap) {
      const has = per[r.key].some((x) => x.teamId === team.id);
      const v = has ? pts[r.key].get(team.id) ?? 0 : null;
      scoresMap[r.key] = v; ranks[r.key] = has ? rankOf(r.key, team.id) : 0;
      if (has) done++;
      total += v ?? 0;
    }
    for (const k of ['danton', 'tergiat']) {
      const has = per[k].some((x) => x.teamId === team.id);
      scoresMap[k] = has ? pts[k].get(team.id) ?? 0 : null;
    }
    return { team, scores: scoresMap, ranks, total: round2(total), done, rank: 0, tie: false, award: null, out: team.dq };
  });

  const cnt = (r: Row, n: number) => Object.values(r.ranks).filter((x) => x === n).length;
  const cmpRow = (a: Row, b: Row) =>
    a.out !== b.out ? (a.out ? 1 : -1) :
    (a.done > 0 !== b.done > 0 ? (a.done > 0 ? -1 : 1) : 0) ||
    b.total - a.total || cnt(b, 1) - cnt(a, 1) || cnt(b, 2) - cnt(a, 2) || cnt(b, 3) - cnt(a, 3) ||
    (a.team.tie_order ?? 1e9) - (b.team.tie_order ?? 1e9);
  rows.sort((a, b) => cmpRow(a, b) || a.team.no - b.team.no);
  rows.forEach((r, i) => {
    const same = i > 0 && !r.out && !rows[i - 1].out && cmpRow(rows[i - 1], r) === 0;
    r.rank = r.out ? 0 : same ? rows[i - 1].rank : i + 1;
    if (same) { rows[i - 1].tie = true; r.tie = true; }
  });
  rows.forEach((r) => { r.award = (r.rank && r.done > 0) ? awardLabel(r.rank, cfg.awards) : null; });

  // Pangkalan favorit: gabungan nilai 2 regu terbaik dari satu pangkalan
  const groups = new Map<string, Row[]>();
  for (const r of rows) {
    if (r.out || r.done === 0) continue;
    const k = r.team.pangkalan.trim().toLowerCase();
    if (k) groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  const fav = [...groups.values()].filter((g) => g.length >= 2).map((g) => {
    const top = [...g].sort((a, b) => b.total - a.total).slice(0, 2);
    return { pangkalan: top[0].team.pangkalan.trim(), total: round2(top[0].total + top[1].total), rank: 0, teams: top.map((x) => x.team) };
  }).sort((a, b) => b.total - a.total);
  fav.forEach((f, i) => { f.rank = i > 0 && fav[i - 1].total === f.total ? fav[i - 1].rank : i + 1; });

  const awards: Standings['awards'] = [];
  for (const g of cfg.awards) for (let k = 0; k < g.size; k++) {
    const rank = g.start + k;
    for (const r of rows) if (r.rank === rank && r.done > 0) awards.push({ group: g.name, label: g.size === 1 ? g.name : `${g.name} ${roman(k + 1)}`, rank, team: r.team, total: r.total });
  }
  const complete = rows.length > 0 && rows.filter((r) => !r.out).every((r) => r.done === recap.length);
  return { rows, recap, of: recap.length, per, favorit: fav, awards, complete };
}

/** Regu yang berhak maju ke tahap MSC berikutnya. */
export function mscQualifiers(st: Standings, cfg: Config, stage: 'msc_semifinal' | 'msc_final'): Set<string> {
  const [from, n] = stage === 'msc_semifinal' ? ['msc_penyisihan', cfg.msc.qSemi] : ['msc_semifinal', cfg.msc.qFinal];
  return new Set((st.per[from] ?? []).filter((r) => !r.dq && r.rank > 0 && r.rank <= n).map((r) => r.teamId));
}
