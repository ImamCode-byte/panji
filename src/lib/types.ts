export type Role = 'admin' | 'juri';
export interface Profile { id: string; username: string; name: string; role: Role; contests: string[] }
export interface Team { id: string; no: number; name: string; pangkalan: string; gudep: string; dq: boolean; tie_order: number | null }

export interface Criterion {
  id: string; label: string; max: number;
  group?: string; hint?: string;
  repeat?: number; repeatLabels?: string[]; agg?: 'sum' | 'avg';
  int?: boolean;       // jawaban bulat (jumlah soal benar)
  noTotal?: boolean;   // tidak masuk total, hanya untuk penentu seri
}
export interface Penalty { id: string; label: string; points: number; unit?: string }
export interface TimeField { label: string; formula?: 'obstacle'; hint?: string }
export interface ContestDef {
  key: string; name: string; hari: string; jam: string; personil: string;
  inRecap: boolean; stage?: 'msc';
  criteria: Criterion[]; time?: TimeField; normalizeTo?: number;
  penalties: Penalty[]; tieBreak: string[]; dqNotes: string[]; note?: string;
}
export interface AwardGroup { name: string; start: number; size: number }
export interface CertConfig {
  bgWinner?: string;
  bgParticipant?: string;
  hideBorders?: boolean;
  hideSignatures?: boolean;
}
export interface Config {
  event: { name: string; short: string; tema: string; lokasi: string; tanggal: string; ketua: string; mabigus: string };
  contests: ContestDef[];
  msc: { wPenyisihan: number; wSemifinal: number; wFinal: number; qSemi: number; qFinal: number };
  awards: AwardGroup[];
  certificate?: CertConfig;
}

export interface ScoreData { c: Record<string, (number | null)[]>; p: Record<string, number>; t?: { m: number; s: number } }
export interface ScoreRec {
  team_id: string; contest: string; data: ScoreData; dq: boolean; note: string;
  updated_by?: string | null; updated_at?: string; by_name?: string;
}
export interface AuditRow { id: number; at: string; who: string; team: string; contest: string; action: string; detail: string }
