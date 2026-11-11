import { DEFAULT_CONFIG } from './contests';
import { computeStandings, instMax, mscQualifiers, reps } from './scoring';
import type { Config, ContestDef, ScoreRec, Team } from './types';

const SMP = ['SMPN 1 Pamekasan', 'MTsN 2 Pamekasan', 'SMPN 3 Sumenep', 'MTs Al-Amin Prenduan', 'SMPN 1 Sampang', 'MTs Nurul Jadid', 'SMPN 2 Bangkalan', 'MTsN 1 Bangkalan', 'SMPN 5 Surabaya', 'SMPN 12 Malang', 'MTsN 3 Malang', 'SMPN 1 Kediri', 'MTs Darul Ulum', 'SMPN 2 Jember', 'MTsN 2 Jember', 'SMPN 1 Banyuwangi', 'MTs Sunan Ampel', 'SMPN 4 Probolinggo', 'SMPN 1 Situbondo', 'MTs Zainul Hasan', 'SMPN 3 Lumajang', 'SMPN 1 Mojokerto', 'MTsN 1 Sidoarjo', 'SMPN 2 Gresik', 'MTs Assa’adah Bungah', 'SMPN 1 Lamongan', 'SMPN 3 Tuban', 'MTsN 2 Bojonegoro', 'SMPN 1 Madiun', 'SMPN 2 Ponorogo', 'MTs Gontor Putra', 'SMPN 1 Blitar', 'SMPN 2 Tulungagung', 'MTsN 1 Trenggalek', 'SMPN 1 Pasuruan', 'MTs Al-Ittihad Poncokusumo', 'SMPN 2 Batu', 'SMPN 1 Nganjuk', 'SMPN 3 Jombang', 'SMPN 1 Magetan'];
const REGU = ['Elang', 'Rajawali', 'Garuda', 'Harimau', 'Macan Kumbang', 'Banteng', 'Cendrawasih', 'Merak', 'Kasuari', 'Walet', 'Gagak', 'Alap-alap', 'Kijang', 'Rusa', 'Badak', 'Komodo', 'Beruang', 'Serigala', 'Singa', 'Naga', 'Cheetah', 'Jalak', 'Pelatuk', 'Camar', 'Rajawali Laut', 'Kancil', 'Orangutan', 'Elang Jawa', 'Kuda', 'Lumba-lumba', 'Pesut', 'Kakatua', 'Nuri', 'Perkutut', 'Kutilang', 'Bangau', 'Pinguin', 'Cakrawala', 'Bima', 'Arjuna'];

export function demoTeams(): Team[] {
  return Array.from({ length: 40 }, (_, i) => ({
    id: `demo-t${i + 1}`, no: i + 1, name: `Regu ${REGU[i]}`,
    // 3 pangkalan mengirim 2 regu (contoh Pangkalan Favorit)
    pangkalan: i === 20 ? SMP[0] : i === 21 ? SMP[1] : i === 22 ? SMP[2] : SMP[i],
    gudep: `${963 + i}`, dq: false, tie_order: null,
  }));
}

function rng(seed: number) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function fake(def: ContestDef, teamId: string, r: () => number, strength: number): ScoreRec {
  const c: Record<string, number[]> = {};
  for (const k of def.criteria) {
    c[k.id] = Array.from({ length: reps(k) }, () => {
      const m = instMax(k), v = m * Math.min(1, Math.max(0.15, strength * 0.55 + 0.4 * r()));
      return k.int ? Math.round(v) : Math.round(v * 2) / 2;
    });
  }
  const p: Record<string, number> = {};
  for (const pen of def.penalties) if (r() < 0.07) p[pen.id] = 1;
  const rec: ScoreRec = { team_id: teamId, contest: def.key, data: { c, p }, dq: false, note: '' };
  if (def.time) rec.data.t = def.time.formula === 'obstacle' ? { m: 2 + Math.floor(r() * 3), s: Math.floor(r() * 60) } : { m: 5 + Math.floor(r() * 25), s: Math.floor(r() * 60) };
  return rec;
}

/** Data contoh untuk mode demo, termasuk alur MSC bertahap. */
export function demoScores(teams: Team[], cfg: Config = DEFAULT_CONFIG): ScoreRec[] {
  const r = rng(2026), out: ScoreRec[] = [];
  const str = new Map(teams.map((t) => [t.id, r()]));
  for (const def of cfg.contests) {
    if (def.key === 'msc_semifinal' || def.key === 'msc_final') continue;
    for (const t of teams) out.push(fake(def, t.id, r, str.get(t.id)!));
  }
  for (const stage of ['msc_semifinal', 'msc_final'] as const) {
    const st = computeStandings(teams, out, cfg);
    const def = cfg.contests.find((d) => d.key === stage)!;
    for (const id of mscQualifiers(st, cfg, stage)) out.push(fake(def, id, r, str.get(id)!));
  }
  return out;
}
