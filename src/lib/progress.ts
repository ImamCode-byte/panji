import { mscQualifiers, type Standings } from './scoring';
import type { Config, ScoreRec, Team } from './types';

export function eligible(key: string, teams: Team[], st: Standings, cfg: Config, onlyQualified = true): Team[] {
  const active = teams.filter((t) => !t.dq);
  if (onlyQualified && (key === 'msc_semifinal' || key === 'msc_final')) {
    const q = mscQualifiers(st, cfg, key);
    return active.filter((t) => q.has(t.id));
  }
  return active;
}
export function contestProgress(key: string, teams: Team[], scores: ScoreRec[], st: Standings, cfg: Config) {
  const ids = new Set(eligible(key, teams, st, cfg).map((t) => t.id));
  const done = scores.filter((s) => s.contest === key && ids.has(s.team_id)).length;
  return { done, total: ids.size };
}
export const hhmm = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '');
