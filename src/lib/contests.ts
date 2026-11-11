import type { Config, ContestDef, Criterion, Penalty } from './types';

const c = (id: string, label: string, max: number, o: Partial<Criterion> = {}): Criterion => ({ id, label, max, ...o });
const GADUH: Penalty = { id: 'gaduh', label: 'Mengganggu / membuat kegaduhan', points: 10 };
const OFFICIAL: Penalty = { id: 'official', label: 'Pembina / official masuk area tanpa izin', points: 30 };
const WAKTU: Penalty = { id: 'waktu', label: 'Melewati batas waktu', points: 5, unit: 'menit' };
const DQ_UMUM = ['Kecurangan', 'Data tidak sesuai dengan peserta'];
const hari = (n: 1 | 2 | 3) => (['Sabtu, 14 Nov', 'Ahad, 15 Nov', 'Senin, 16 Nov'] as const)[n - 1];
const days = ['Hari 1', 'Hari 2', 'Hari 3'];

export const DEFAULT_CONTESTS: ContestDef[] = [
  {
    key: 'administrasi', name: 'Administrasi Regu', hari: hari(1), jam: '06.00–08.00', personil: 'Regu', inRecap: true,
    criteria: [
      c('biodata_regu', 'Biodata regu', 10, { group: 'Berkas', int: false }),
      c('biodata_peserta', 'Biodata peserta', 10, { group: 'Berkas' }),
      c('struktur', 'Struktur regu', 10, { group: 'Berkas' }),
      c('foto', 'Foto peserta 3×4 dan foto regu 3R', 10, { group: 'Berkas' }),
      c('absen', 'Absen regu', 10, { group: 'Berkas' }),
      c('kegiatan', 'Kegiatan regu', 10, { group: 'Berkas' }),
      c('keuangan', 'Buku keuangan regu', 10, { group: 'Berkas' }),
      c('ayo', 'Kartu Ayo Pramuka', 10, { group: 'Berkas' }),
      c('surat', 'Surat tugas', 10, { group: 'Berkas' }),
      c('bayar', 'Tanda bukti pembayaran', 10, { group: 'Berkas' }),
      c('kebenaran', 'Kebenaran berkas', 100, { group: 'Penentu seri', noTotal: true, hint: 'Tidak dijumlahkan. Dipakai jika nilai sama.' }),
    ],
    penalties: [GADUH, { id: 'telat', label: 'Terlambat herregistrasi', points: 5, unit: '10 menit' }, OFFICIAL],
    tieBreak: ['kebenaran'], dqNotes: DQ_UMUM,
  },
  {
    key: 'tapak', name: 'Tapak Kemah', hari: hari(1), jam: '06.00–11.00', personil: '10 orang', inRecap: true,
    criteria: [
      c('keindahan', 'Keindahan dan kerapian', 60, { group: 'Penilaian', repeat: 3, repeatLabels: days, hint: '20 poin per hari' }),
      c('simpul', 'Kebenaran simpul', 45, { group: 'Penilaian' }),
      c('kokoh', 'Kekokohan', 35, { group: 'Penilaian' }),
      c('p_admin', 'Administrasi regu', 2, { group: 'Perlengkapan tenda' }),
      c('p_sepatu', 'Tempat sepatu', 10, { group: 'Perlengkapan tenda' }),
      c('p_gapura', 'Gapura', 15, { group: 'Perlengkapan tenda' }),
      c('p_sampah', 'Tempat sampah (trashbag)', 5, { group: 'Perlengkapan tenda' }),
      c('p_pagar', 'Pagar', 10, { group: 'Perlengkapan tenda' }),
      c('p_info', 'Papan info', 5, { group: 'Perlengkapan tenda' }),
      c('p_jemuran', 'Tempat jemuran pakaian', 5, { group: 'Perlengkapan tenda' }),
      c('p_tali', 'Tali', 2, { group: 'Perlengkapan tenda' }),
      c('p_bendera', 'Bendera Merah Putih, Tunas Kelapa, WOSM', 6, { group: 'Perlengkapan tenda' }),
    ],
    penalties: [GADUH, { ...WAKTU }, OFFICIAL, { id: 'kavling', label: 'Melebihi batas kavling', points: 15 }],
    tieBreak: ['keindahan'], dqNotes: DQ_UMUM,
  },
  {
    key: 'yel', name: 'Kreasi Yel Pramuka', hari: hari(1), jam: '12.30–17.10', personil: '9 orang', inRecap: true,
    criteria: [
      c('kreatif', 'Kreativitas dan koreografi', 60),
      c('kompak', 'Kekompakan dan semangat', 30),
      c('aksesoris', 'Aksesoris', 10),
    ],
    penalties: [
      GADUH, WAKTU, OFFICIAL,
      { id: 'kata', label: 'Tidak mencantumkan “PARISADA 2026” dan tema', points: 10 },
      { id: 'sara', label: 'Unsur SARA / merendahkan pihak lain', points: 5 },
      { id: 'kavling', label: 'Melewati batas kavling', points: 5 },
    ],
    tieBreak: ['kreatif'], dqNotes: DQ_UMUM,
  },
  {
    key: 'tari', name: 'Festival Tari Kreasi', hari: 'Sabtu–Ahad', jam: '19.30–22.30', personil: '9 orang', inRecap: true, normalizeTo: 200,
    criteria: [
      c('wiraga', 'Wiraga', 55), c('wirama', 'Wirama', 40), c('wirasa', 'Wirasa', 30), c('wirupa', 'Wirupa', 25),
    ],
    penalties: [GADUH, WAKTU, OFFICIAL],
    tieBreak: ['wiraga'], dqNotes: [...DQ_UMUM, 'Tidak hadir setelah 3 kali dipanggil'],
    note: 'Bobot di juklak berjumlah 150, skala nilai 200. Nilai dinormalkan ke 200.',
  },
  {
    key: 'lkbb', name: 'LKBB Variasi', hari: hari(2), jam: '07.00–11.00', personil: '9 orang', inRecap: true,
    criteria: [c('kebenaran', 'Kebenaran', 120), c('variasi', 'Variasi', 45), c('kompak', 'Kekompakan', 35)],
    penalties: [
      GADUH, { id: 'batas', label: 'Melewati batas yang ditentukan', points: 5 },
      { id: 'kavling', label: 'Melewati batas kavling', points: 5 }, OFFICIAL,
      { id: 'aba', label: 'Danton tidak menyebutkan aba-aba', points: 10, unit: 'aba-aba' },
    ],
    tieBreak: ['kebenaran'], dqNotes: DQ_UMUM,
  },
  {
    key: 'danton', name: 'Danton Terbaik', hari: hari(2), jam: '07.00–11.00', personil: 'Danton', inRecap: false,
    criteria: [
      c('ikit', 'IKIT (intonasi, ketegasan, irama, tekanan)', 25), c('materi', 'Penguasaan materi (aba-aba)', 25),
      c('lapangan', 'Penguasaan lapangan', 25), c('pasukan', 'Penguasaan pasukan', 25),
    ],
    penalties: [], tieBreak: ['ikit'], dqNotes: DQ_UMUM,
    note: 'Penilaian terpisah, tidak masuk klasemen umum.',
  },
  {
    key: 'pionering', name: 'Pionering', hari: hari(2), jam: '12.30–14.20', personil: '4 orang', inRecap: true,
    criteria: [c('kreatif', 'Kreativitas dan kesesuaian bentuk', 45), c('simpul', 'Kebenaran simpul', 35), c('kokoh', 'Kekokohan', 20)],
    penalties: [
      GADUH, WAKTU, OFFICIAL,
      { id: 'potong', label: 'Aksesoris tambahan / memotong tongkat atau tali', points: 30 },
      { id: 'gambar', label: 'Tidak menyertakan gambar rumah adat', points: 10 },
    ],
    tieBreak: ['kreatif'], dqNotes: DQ_UMUM,
  },
  {
    key: 'sandi', name: 'Sandi', hari: hari(2), jam: '12.30–14.20', personil: '2 orang', inRecap: true, normalizeTo: 100,
    criteria: [c('benar', 'Jawaban benar', 25, { int: true, hint: '25 soal' })],
    time: { label: 'Waktu penyelesaian', hint: 'Penentu seri: tercepat menang' },
    penalties: [GADUH, WAKTU, OFFICIAL], tieBreak: ['time'], dqNotes: DQ_UMUM,
  },
  {
    key: 'memanah', name: 'Memanah', hari: hari(2), jam: '12.30–14.20', personil: '1 orang', inRecap: true, normalizeTo: 100,
    criteria: [c('panah', 'Skor panah', 30, { repeat: 3, repeatLabels: ['Panah 1', 'Panah 2', 'Panah 3'], hint: 'Maksimal 10 per panah' })],
    penalties: [GADUH, OFFICIAL], tieBreak: [], dqNotes: DQ_UMUM,
  },
  {
    key: 'msc_penyisihan', name: 'MSC · Penyisihan', hari: hari(2), jam: '12.30–14.20', personil: '2 orang', inRecap: true, stage: 'msc', normalizeTo: 100,
    criteria: [c('benar', 'Jawaban benar', 30, { int: true, hint: '30 soal · 5 poin per jawaban benar' })],
    time: { label: 'Waktu pengumpulan', hint: 'Penentu seri' },
    penalties: [GADUH, WAKTU, OFFICIAL], tieBreak: ['benar', 'time'], dqNotes: DQ_UMUM,
  },
  {
    key: 'msc_semifinal', name: 'MSC · Semifinal', hari: hari(2), jam: '15.00–17.10', personil: '2 orang', inRecap: true, stage: 'msc', normalizeTo: 100,
    criteria: [c('benar', 'Jawaban benar', 20, { int: true, hint: '20 soal · 5 poin per jawaban benar' })],
    time: { label: 'Waktu pengumpulan', hint: 'Penentu seri' },
    penalties: [GADUH, WAKTU, OFFICIAL], tieBreak: ['benar', 'time'], dqNotes: DQ_UMUM,
  },
  {
    key: 'msc_final', name: 'MSC · Final', hari: hari(2), jam: '15.00–17.10', personil: '2 orang', inRecap: true, stage: 'msc', normalizeTo: 100,
    criteria: [c('benar', 'Jawaban benar', 10, { int: true, hint: 'Jumlah soal final belum ditetapkan juklak. Ubah di Pengaturan.' })],
    time: { label: 'Waktu pengumpulan', hint: 'Penentu seri' },
    penalties: [GADUH, WAKTU, OFFICIAL], tieBreak: ['benar', 'time'], dqNotes: DQ_UMUM,
  },
  {
    key: 'semaphore', name: 'Semaphore', hari: hari(3), jam: '07.30–14.00', personil: '1 orang', inRecap: true,
    criteria: [c('kebenaran', 'Kebenaran', 100)],
    time: { label: 'Kecepatan', hint: 'Penentu seri setelah kebenaran' },
    penalties: [GADUH, OFFICIAL], tieBreak: ['kebenaran', 'time'], dqNotes: DQ_UMUM,
  },
  {
    key: 'menaksir', name: 'Menaksir', hari: hari(3), jam: '07.30–14.00', personil: '2 orang', inRecap: true,
    criteria: [c('tepat', 'Ketepatan', 60), c('rapi', 'Kerapian', 40)],
    penalties: [GADUH, WAKTU, OFFICIAL], tieBreak: ['tepat'], dqNotes: DQ_UMUM,
  },
  {
    key: 'panorama', name: 'Panorama Sketsa', hari: hari(3), jam: '07.30–14.00', personil: '1 orang', inRecap: true,
    criteria: [c('benar', 'Kebenaran', 60), c('rapi', 'Kerapian', 40)],
    penalties: [GADUH, OFFICIAL], tieBreak: ['benar'], dqNotes: DQ_UMUM,
  },
  {
    key: 'p3k', name: 'P3K', hari: hari(3), jam: '07.30–14.00', personil: '9 orang', inRecap: true,
    criteria: [c('benar', 'Kebenaran', 50), c('presentasi', 'Presentasi', 30), c('tandu', 'Kekokohan tandu', 20)],
    penalties: [GADUH, WAKTU], tieBreak: ['benar'], dqNotes: DQ_UMUM,
  },
  {
    key: 'halang', name: 'Halang Rintang', hari: hari(3), jam: '07.30–14.00', personil: '9 orang', inRecap: true,
    criteria: [],
    time: { label: 'Waktu tempuh', formula: 'obstacle', hint: 'Nilai = 100 − waktu (menit.detik). Contoh 5.45 → 94,55' },
    penalties: [GADUH, OFFICIAL], tieBreak: ['time'], dqNotes: DQ_UMUM,
  },
  {
    key: 'petapita', name: 'Peta Pita', hari: hari(3), jam: '07.30–14.00', personil: '9 orang', inRecap: true,
    criteria: [c('benar', 'Kebenaran', 60), c('rapi', 'Kerapian', 40)],
    penalties: [GADUH], tieBreak: ['benar'],
    dqNotes: [...DQ_UMUM, 'Pembina / official ikut mengerjakan', 'Tidak menulis dengan bolpoin'],
  },
  {
    key: 'tergiat', name: 'Regu Tergiat', hari: 'Sabtu–Senin', jam: 'Non rotasi', personil: 'Regu', inRecap: false, normalizeTo: 100,
    criteria: [
      c('disiplin', 'Kedisiplinan', 100, { repeat: 3, repeatLabels: days, agg: 'avg' }),
      c('aktif', 'Keaktifan', 100, { repeat: 3, repeatLabels: days, agg: 'avg' }),
      c('bersih', 'Kebersihan tenda', 100, { repeat: 3, repeatLabels: days, agg: 'avg' }),
    ],
    penalties: [], tieBreak: ['disiplin'], dqNotes: DQ_UMUM,
    note: 'Nilai non rotasi. Tiap hari dinilai 0–100, lalu dirata-rata.',
  },
];

const AW = (name: string, start: number, size = 3) => ({ name, start, size });
export const DEFAULT_CONFIG: Config = {
  event: {
    name: 'Parisada XXI', short: 'PARISADA XXI',
    tema: 'Menjaga Budaya, Melestarikan Seni dan Raih Prestasi',
    lokasi: 'Bumi Perkemahan Pegantenan, Pamekasan', tanggal: '14–16 November 2026',
    ketua: 'Anwari', mabigus: 'Drs. H. Moh Khalil Asy’ari',
  },
  contests: DEFAULT_CONTESTS,
  msc: { wPenyisihan: 40, wSemifinal: 30, wFinal: 30, qSemi: 10, qFinal: 3 },
  awards: [
    AW('Juara Umum', 1, 1), AW('Juara Utama', 2), AW('Juara Harapan Utama', 5), AW('Juara Terap', 8),
    AW('Juara Harapan Terap', 11), AW('Juara Rakit', 14), AW('Juara Harapan Rakit', 17), AW('Juara Ramu', 20),
    AW('Juara Harapan Ramu', 23), AW('Juara Purwa', 26), AW('Juara Harapan Purwa', 29), AW('Juara Madya', 32),
    AW('Juara Harapan Madya', 35), AW('Juara Caraka', 38),
  ],
  certificate: {
    bgWinner: '',
    bgParticipant: '',
    hideBorders: false,
    hideSignatures: false,
    hideBoilerplate: true,
    textOffsetX: 0,
    textOffsetY: 0,
    nameX: 0,
    nameY: 0,
    pangkalanX: 0,
    pangkalanY: 0,
    awardX: 0,
    awardY: 0,
    nameSize: 54,
    pangkalanSize: 27,
    awardSize: 40,
    textAlign: 'center',
  },
};

/** Gabungkan konfigurasi tersimpan dengan bawaan: nilai tersimpan menang, item baru dari bawaan tetap muncul. */
export function mergeConfig(saved: Partial<Config> | null | undefined): Config {
  if (!saved) return structuredClone(DEFAULT_CONFIG);
  const byKey = new Map((saved.contests ?? []).map((x) => [x.key, x]));
  const contests = DEFAULT_CONTESTS.map((d) => {
    const s = byKey.get(d.key);
    if (!s) return structuredClone(d);
    const cm = new Map(s.criteria.map((x) => [x.id, x.max]));
    const pm = new Map(s.penalties.map((x) => [x.id, x.points]));
    return {
      ...structuredClone(d), inRecap: s.inRecap, normalizeTo: s.normalizeTo ?? d.normalizeTo,
      criteria: d.criteria.map((x) => ({ ...x, max: cm.get(x.id) ?? x.max })),
      penalties: d.penalties.map((x) => ({ ...x, points: pm.get(x.id) ?? x.points })),
    };
  });
  return {
    event: { ...DEFAULT_CONFIG.event, ...saved.event },
    msc: { ...DEFAULT_CONFIG.msc, ...saved.msc },
    awards: saved.awards?.length ? saved.awards : DEFAULT_CONFIG.awards,
    contests,
    certificate: {
      bgWinner: saved.certificate?.bgWinner ?? '',
      bgParticipant: saved.certificate?.bgParticipant ?? '',
      hideBorders: saved.certificate?.hideBorders ?? false,
      hideSignatures: saved.certificate?.hideSignatures ?? false,
      hideBoilerplate: saved.certificate?.hideBoilerplate ?? true,
      textOffsetX: saved.certificate?.textOffsetX ?? 0,
      textOffsetY: saved.certificate?.textOffsetY ?? 0,
      nameX: saved.certificate?.nameX ?? saved.certificate?.textOffsetX ?? 0,
      nameY: saved.certificate?.nameY ?? saved.certificate?.textOffsetY ?? 0,
      pangkalanX: saved.certificate?.pangkalanX ?? saved.certificate?.textOffsetX ?? 0,
      pangkalanY: saved.certificate?.pangkalanY ?? saved.certificate?.textOffsetY ?? 0,
      awardX: saved.certificate?.awardX ?? saved.certificate?.textOffsetX ?? 0,
      awardY: saved.certificate?.awardY ?? saved.certificate?.textOffsetY ?? 0,
      nameSize: saved.certificate?.nameSize ?? 54,
      pangkalanSize: saved.certificate?.pangkalanSize ?? 27,
      awardSize: saved.certificate?.awardSize ?? 40,
      textAlign: saved.certificate?.textAlign ?? 'center',
    },
  };
}

export const ABBR: Record<string, string> = {
  administrasi: 'Adm', tapak: 'Tapak', yel: 'Yel', tari: 'Tari', lkbb: 'LKBB', pionering: 'Pioner', sandi: 'Sandi', memanah: 'Panah',
  msc: 'MSC', semaphore: 'Semaph', menaksir: 'Taksir', panorama: 'Panorama', p3k: 'P3K', halang: 'Halrin', petapita: 'Peta Pita',
  danton: 'Danton', tergiat: 'Tergiat',
};
