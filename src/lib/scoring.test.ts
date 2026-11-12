import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, DEFAULT_CONTESTS, mergeConfig } from './contests';
import { awardLabel, computeStandings, contestScore, mscQualifiers, rawMax, roman, scoreMax } from './scoring';
import type { ScoreData, ScoreRec, Team } from './types';

const def = (k: string) => DEFAULT_CONTESTS.find((d) => d.key === k)!;
const team = (no: number, pangkalan = `P${no}`): Team => ({ id: `t${no}`, no, name: `Regu ${no}`, pangkalan, gudep: '', dq: false, tie_order: null });
const rec = (t: number, contest: string, data: Partial<ScoreData>, dq = false): ScoreRec => ({ team_id: `t${t}`, contest, data: { c: {}, p: {}, ...data }, dq, note: '' });

describe('bobot sesuai juklak', () => {
  it('total maksimum tiap lomba', () => {
    expect(rawMax(def('administrasi'))).toBe(100);
    expect(rawMax(def('tapak'))).toBe(200);
    expect(rawMax(def('lkbb'))).toBe(200);
    expect(rawMax(def('yel'))).toBe(100);
    expect(rawMax(def('pionering'))).toBe(100);
    expect(rawMax(def('danton'))).toBe(100);
    for (const k of ['menaksir', 'panorama', 'p3k', 'petapita']) expect(rawMax(def(k))).toBe(100);
    expect(rawMax(def('tari'))).toBe(150);
    expect(scoreMax(def('tari'))).toBe(200);
  });
});

describe('perhitungan nilai', () => {
  it('Halang Rintang: 5.45 → 94,55', () => {
    expect(contestScore(def('halang'), rec(1, 'halang', { t: { m: 5, s: 45 } })).score).toBe(94.55);
  });
  it('Tari dinormalkan ke 200', () => {
    const r = rec(1, 'tari', { c: { wiraga: [55], wirama: [40], wirasa: [30], wirupa: [25] } });
    expect(contestScore(def('tari'), r).score).toBe(200);
  });
  it('pengurangan nilai penalti dapat menghasilkan nilai minus jika melebihi nilai perolehan', () => {
    const d = { c: { kreatif: [60], kompak: [30], aksesoris: [10] }, p: { waktu: 2, kata: 1 } };
    expect(contestScore(def('yel'), rec(1, 'yel', d)).score).toBe(80);
    // Nilai dasar 5, kena penalti gaduh 3 kali (3 x 10 = 30) -> 5 - 30 = -25
    expect(contestScore(def('yel'), rec(1, 'yel', { c: { kreatif: [5], kompak: [0], aksesoris: [0] }, p: { gaduh: 3 } })).score).toBe(-25);
    // Contoh kasus LKBB: nilai perolehan 70, pelanggaran pengurangan 80 (8 x danton tidak menyebutkan aba-aba @ 10 poin) -> 70 - 80 = -10
    expect(contestScore(def('lkbb'), rec(1, 'lkbb', { c: { kebenaran: [70], variasi: [0], kompak: [0] }, p: { aba: 8 } })).score).toBe(-10);
  });
  it('diskualifikasi bernilai 0', () => {
    expect(contestScore(def('yel'), rec(1, 'yel', { c: { kreatif: [60] } }, true)).score).toBe(0);
  });
  it('Tapak Kemah: keindahan 3 hari + perlengkapan', () => {
    const c: Record<string, number[]> = { keindahan: [20, 20, 20], simpul: [45], kokoh: [35] };
    for (const x of def('tapak').criteria.filter((k) => k.id.startsWith('p_'))) c[x.id] = [x.max];
    expect(contestScore(def('tapak'), rec(1, 'tapak', { c })).score).toBe(200);
  });
  it('Memanah: 3 panah × 10 → 100', () => {
    expect(contestScore(def('memanah'), rec(1, 'memanah', { c: { panah: [10, 10, 10] } })).score).toBe(100);
    expect(contestScore(def('memanah'), rec(1, 'memanah', { c: { panah: [10, 5, 0] } })).score).toBe(50);
  });
  it('Regu Tergiat: rata-rata per hari', () => {
    const c = { disiplin: [90, 90, 90], aktif: [60, 60, 60], bersih: [30, 30, 30] };
    expect(contestScore(def('tergiat'), rec(1, 'tergiat', { c })).score).toBe(60);
  });
});

describe('peringkat per lomba', () => {
  it('seri dipecah oleh kriteria juklak (LKBB: kebenaran)', () => {
    const t = [team(1), team(2)];
    const s = [
      rec(1, 'lkbb', { c: { kebenaran: [100], variasi: [40], kompak: [30] } }),
      rec(2, 'lkbb', { c: { kebenaran: [110], variasi: [30], kompak: [30] } }),
    ];
    const st = computeStandings(t, s, DEFAULT_CONFIG);
    expect(st.per.lkbb.map((r) => [r.teamId, r.rank, r.tie])).toEqual([['t2', 1, false], ['t1', 2, false]]);
  });
  it('seri penuh berbagi peringkat', () => {
    const t = [team(1), team(2)];
    const d = { c: { benar: [20] }, t: { m: 10, s: 0 } };
    const st = computeStandings(t, [rec(1, 'sandi', d), rec(2, 'sandi', d)], DEFAULT_CONFIG);
    expect(st.per.sandi.map((r) => [r.rank, r.tie])).toEqual([[1, true], [1, true]]);
  });
  it('Sandi: seri → waktu tercepat', () => {
    const t = [team(1), team(2)];
    const st = computeStandings(t, [rec(1, 'sandi', { c: { benar: [20] }, t: { m: 30, s: 0 } }), rec(2, 'sandi', { c: { benar: [20] }, t: { m: 25, s: 0 } })], DEFAULT_CONFIG);
    expect(st.per.sandi[0].teamId).toBe('t2');
  });
});

describe('klasemen umum & kategori juara', () => {
  it('menjumlahkan nilai lomba rotasi dan memberi kategori', () => {
    const t = [team(1), team(2), team(3)];
    const mk = (n: number, v: number) => rec(n, 'menaksir', { c: { tepat: [v], rapi: [0] } });
    const st = computeStandings(t, [mk(1, 30), mk(2, 50), mk(3, 40)], DEFAULT_CONFIG);
    expect(st.rows.map((r) => [r.team.no, r.rank, r.award])).toEqual([[2, 1, 'Juara Umum'], [3, 2, 'Juara Utama I'], [1, 3, 'Juara Utama II']]);
  });
  it('nilai negatif dari penalti mengurangi akumulasi total nilai klasemen', () => {
    const t = [team(1), team(2)];
    const s = [
      // Regu 1: Yel dapat 100, LKBB nilai dasar 70 kena penalti 80 = -10 -> total seharusnya 100 + (-10) = 90
      rec(1, 'yel', { c: { kreatif: [60], kompak: [30], aksesoris: [10] } }),
      rec(1, 'lkbb', { c: { kebenaran: [70], variasi: [0], kompak: [0] }, p: { aba: 8 } }),
      // Regu 2: Yel dapat 95
      rec(2, 'yel', { c: { kreatif: [55], kompak: [30], aksesoris: [10] } }),
    ];
    const st = computeStandings(t, s, DEFAULT_CONFIG);
    const r1 = st.rows.find((r) => r.team.no === 1);
    const r2 = st.rows.find((r) => r.team.no === 2);
    expect(r1?.scores.lkbb).toBe(-10);
    expect(r1?.total).toBe(90);
    expect(r2?.total).toBe(95);
    // Regu 2 (total 95) berperingkat di atas Regu 1 (total 90)
    expect(st.rows[0].team.no).toBe(2);
    expect(st.rows[1].team.no).toBe(1);
  });
  it('lomba non rotasi (Danton, Tergiat) tidak masuk total', () => {
    const t = [team(1)];
    const st = computeStandings(t, [rec(1, 'danton', { c: { ikit: [25], materi: [25], lapangan: [25], pasukan: [25] } })], DEFAULT_CONFIG);
    expect(st.rows[0].total).toBe(0);
    expect(st.per.danton[0].score).toBe(100);
  });
  it('total sama → seri, lalu urutan manual panitia', () => {
    const t = [team(1), team(2)];
    const s = [
      rec(1, 'menaksir', { c: { tepat: [60], rapi: [40] } }), rec(2, 'menaksir', { c: { tepat: [60], rapi: [0] } }),
      rec(1, 'p3k', { c: { benar: [10], presentasi: [5], tandu: [5] } }), rec(2, 'p3k', { c: { benar: [30], presentasi: [20], tandu: [10] } }),
    ];
    let st = computeStandings(t, s, DEFAULT_CONFIG);
    expect(st.rows.map((r) => r.total)).toEqual([120, 120]);
    expect(st.rows.map((r) => [r.rank, r.tie])).toEqual([[1, true], [1, true]]);
    t[1].tie_order = 1;
    st = computeStandings(t, s, DEFAULT_CONFIG);
    expect(st.rows.map((r) => [r.team.no, r.rank])).toEqual([[2, 1], [1, 2]]);
  });
  it('jumlah juara 1 memecah total yang sama', () => {
    const t = [team(1), team(2)];
    const s = [
      rec(1, 'menaksir', { c: { tepat: [60], rapi: [40] } }), rec(2, 'menaksir', { c: { tepat: [60], rapi: [0] } }),
      rec(1, 'p3k', { c: { benar: [10], presentasi: [0], tandu: [0] } }), rec(2, 'p3k', { c: { benar: [20], presentasi: [0], tandu: [0] } }),
      rec(1, 'panorama', { c: { benar: [30], rapi: [10] } }), rec(2, 'panorama', { c: { benar: [60], rapi: [10] } }),
    ];
    const st = computeStandings(t, s, DEFAULT_CONFIG);
    expect(st.rows.map((r) => r.total)).toEqual([150, 150]);
    expect(st.rows.map((r) => [r.team.no, r.rank, r.tie])).toEqual([[2, 1, false], [1, 2, false]]);
  });
  it('rentang kategori juara', () => {
    const g = DEFAULT_CONFIG.awards;
    expect(awardLabel(1, g)).toBe('Juara Umum');
    expect(awardLabel(4, g)).toBe('Juara Utama III');
    expect(awardLabel(11, g)).toBe('Juara Harapan Terap I');
    expect(awardLabel(37, g)).toBe('Juara Harapan Madya III');
    expect(awardLabel(38, g)).toBe('Juara Caraka I');
    expect(awardLabel(40, g)).toBe('Juara Caraka III');
    expect(roman(38)).toBe('XXXVIII');
  });
  it('Pangkalan Favorit: 2 regu satu pangkalan', () => {
    const t = [team(1, 'SMPN 1'), team(2, 'smpn 1'), team(3, 'SMPN 2')];
    const mk = (n: number, v: number) => rec(n, 'menaksir', { c: { tepat: [v], rapi: [0] } });
    const st = computeStandings(t, [mk(1, 10), mk(2, 20), mk(3, 60)], DEFAULT_CONFIG);
    expect(st.favorit).toHaveLength(1);
    expect(st.favorit[0].total).toBe(30);
  });
});

describe('Memory Scout Challenge', () => {
  it('peserta maju sesuai kuota dan tahap tertinggi menentukan peringkat', () => {
    const cfg = { ...DEFAULT_CONFIG, msc: { ...DEFAULT_CONFIG.msc, qSemi: 2, qFinal: 1 } };
    const t = [team(1), team(2), team(3)];
    const pen = (n: number, b: number) => rec(n, 'msc_penyisihan', { c: { benar: [b] }, t: { m: 20, s: 0 } });
    let st = computeStandings(t, [pen(1, 30), pen(2, 28), pen(3, 10)], cfg);
    expect([...mscQualifiers(st, cfg, 'msc_semifinal')].sort()).toEqual(['t1', 't2']);
    const semi = (n: number, b: number) => rec(n, 'msc_semifinal', { c: { benar: [b] }, t: { m: 15, s: 0 } });
    st = computeStandings(t, [pen(1, 30), pen(2, 28), pen(3, 10), semi(1, 10), semi(2, 18)], cfg);
    expect([...mscQualifiers(st, cfg, 'msc_final')]).toEqual(['t2']);
    const fin = rec(2, 'msc_final', { c: { benar: [8] }, t: { m: 5, s: 0 } });
    st = computeStandings(t, [pen(1, 30), pen(2, 28), pen(3, 10), semi(1, 10), semi(2, 18), fin], cfg);
    expect(st.per.msc.map((r) => r.teamId)).toEqual(['t2', 't1', 't3']);
  });
});

describe('konfigurasi', () => {
  it('mergeConfig menjaga perubahan admin dan item baru', () => {
    const saved = structuredClone(DEFAULT_CONFIG);
    saved.contests.find((d) => d.key === 'yel')!.criteria[0].max = 55;
    const m = mergeConfig(saved);
    expect(m.contests.find((d) => d.key === 'yel')!.criteria[0].max).toBe(55);
    expect(m.contests).toHaveLength(DEFAULT_CONTESTS.length);
  });
});
