import { roman, type Standings } from './scoring';
import type { Config, Team } from './types';

export interface CertItem { kind: 'Sertifikat Kejuaraan' | 'Sertifikat Kegiatan'; label: string; name: string; pangkalan: string; teamId: string }
export type CertSet = 'awards' | 'lomba' | 'favorit' | 'peserta' | 'semua';

export function buildCerts(set: CertSet, st: Standings, cfg: Config, teams: Team[]): CertItem[] {
  const tm = new Map(teams.map((t) => [t.id, t]));
  const win = (label: string, t: Team): CertItem => ({ kind: 'Sertifikat Kejuaraan', label, name: t.name, pangkalan: t.pangkalan, teamId: t.id });
  const out: CertItem[] = [];
  if (set === 'awards' || set === 'semua') st.awards.forEach((a) => out.push(win(a.label, a.team)));
  if (set === 'lomba' || set === 'semua') {
    const names: Record<string, string> = { msc: 'Memory Scout Challenge' };
    cfg.contests.forEach((c) => (names[c.key] = c.name));
    const keys = [...st.recap.map((r) => r.key), 'danton', 'tergiat'];
    for (const k of keys) {
      const lim = k === 'tergiat' ? 1 : 3;
      for (const r of st.per[k] ?? []) {
        const t = tm.get(r.teamId); if (!t || r.dq || r.rank < 1 || r.rank > lim) continue;
        const n = names[k];
        out.push(win(k === 'tergiat' ? 'Regu Tergiat' : k === 'danton' ? `Juara ${roman(r.rank)} Danton Terbaik` : `Juara ${roman(r.rank)} Lomba ${n}`, t));
      }
    }
  }
  if (set === 'favorit' || set === 'semua') st.favorit.filter((f) => f.rank === 1).forEach((f) => f.teams.forEach((t) => out.push(win('Juara Pangkalan Favorit', t))));
  if (set === 'peserta') teams.forEach((t) => out.push({ kind: 'Sertifikat Kegiatan', label: 'Peserta Perkemahan', name: t.name, pangkalan: t.pangkalan, teamId: t.id }));
  return out;
}
