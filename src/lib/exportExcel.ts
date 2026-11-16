import ExcelJS from 'exceljs';
import type { Config } from './types';
import type { Standings } from './scoring';

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' },
};

function getColLetter(colIndex: number): string {
  let temp = colIndex;
  let letter = '';
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
}

export async function exportStandingsToExcel(st: Standings, cfg: Config) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'PANJI';
  wb.created = new Date();

  const eventName = cfg.event.name || 'PARISADA XXI';
  const eventShort = cfg.event.short || 'PARISADA XXI';

  /* ==========================================================================
     SHEET 1: NILAI (Rekapitulasi Nilai Utama)
     ========================================================================== */
  const wsNilai = wb.addWorksheet('NILAI', {
    pageSetup: {
      orientation: 'landscape',
      margins: { left: 0.2, right: 0.2, top: 0.4, bottom: 0.2, header: 0.3, footer: 0.3 },
    },
    views: [{ showGridLines: true }],
  });

  const recapContests = st.recap;
  const numContests = recapContests.length;
  // Kolom: A(1), B(2), C(3: No. Kav), D(4: Nama Regu), E(5: Kontingen), F..(5+numContests: Lomba), ColJumlah, ColRank
  const startLombaCol = 6;
  const endLombaCol = startLombaCol + numContests - 1;
  const colJumlah = endLombaCol + 1;
  const colRank = colJumlah + 1;
  const totalCols = colRank;

  // Lebar kolom
  wsNilai.getColumn(1).width = 4.5; // A
  wsNilai.getColumn(2).width = 6.2; // B
  wsNilai.getColumn(3).width = 13.0; // C (No. Kav)
  wsNilai.getColumn(4).width = 23.0; // D (Nama Regu)
  wsNilai.getColumn(5).width = 37.0; // E (Kontingen)
  for (let c = startLombaCol; c <= endLombaCol; c++) {
    wsNilai.getColumn(c).width = 5.5; // Kolom lomba
  }
  wsNilai.getColumn(colJumlah).width = 6.5; // Jumlah Nilai
  wsNilai.getColumn(colRank).width = 4.0; // Peringkat

  // Tinggi baris kop
  wsNilai.getRow(4).height = 15.6;
  wsNilai.getRow(5).height = 15.6;
  wsNilai.getRow(6).height = 15.6;

  // Kop surat / Judul
  wsNilai.mergeCells(4, 3, 4, totalCols);
  const title1 = wsNilai.getCell(4, 3);
  title1.value = `DAFTAR NILAI PERLOMBAAN ${eventName.toUpperCase()}`;
  title1.font = { name: 'Bahnschrift', size: 12, bold: true };
  title1.alignment = { horizontal: 'center', vertical: 'middle' };

  wsNilai.mergeCells(5, 3, 5, totalCols);
  const title2 = wsNilai.getCell(5, 3);
  title2.value = 'GERAKAN PRAMUKA GUGUSDEPAN 963';
  title2.font = { name: 'Bahnschrift', size: 12, bold: true };
  title2.alignment = { horizontal: 'center', vertical: 'middle' };

  wsNilai.mergeCells(6, 3, 6, totalCols);
  const title3 = wsNilai.getCell(6, 3);
  title3.value = 'LPI DARUL ULUM PP. BANYUANYAR';
  title3.font = { name: 'Bahnschrift', size: 12, bold: true };
  title3.alignment = { horizontal: 'center', vertical: 'middle' };

  // Header Tabel
  wsNilai.getRow(8).height = 14.4;
  wsNilai.getRow(9).height = 156.0;

  // NO. KAV (C8:C9)
  wsNilai.mergeCells(8, 3, 9, 3);
  const hKav = wsNilai.getCell(8, 3);
  hKav.value = 'NO. KAV';
  hKav.font = { name: 'Times New Roman', size: 14, bold: true };
  hKav.alignment = { horizontal: 'center', vertical: 'middle' };
  hKav.border = thinBorder;
  wsNilai.getCell(9, 3).border = thinBorder;

  // NAMA REGU (D8:D9)
  wsNilai.mergeCells(8, 4, 9, 4);
  const hRegu = wsNilai.getCell(8, 4);
  hRegu.value = 'NAMA REGU';
  hRegu.font = { name: 'Times New Roman', size: 14, bold: true };
  hRegu.alignment = { horizontal: 'center', vertical: 'middle' };
  hRegu.border = thinBorder;
  wsNilai.getCell(9, 4).border = thinBorder;

  // KONTINGIN (E8:E9)
  wsNilai.mergeCells(8, 5, 9, 5);
  const hKont = wsNilai.getCell(8, 5);
  hKont.value = 'KONTINGIN';
  hKont.font = { name: 'Times New Roman', size: 14, bold: true };
  hKont.alignment = { horizontal: 'center', vertical: 'middle' };
  hKont.border = thinBorder;
  wsNilai.getCell(9, 5).border = thinBorder;

  // JENIS LOMBA / NILAI (F8 : EndLomba 8)
  wsNilai.mergeCells(8, startLombaCol, 8, endLombaCol);
  const hLombaGroup = wsNilai.getCell(8, startLombaCol);
  hLombaGroup.value = 'JENIS LOMBA / NILAI';
  hLombaGroup.font = { name: 'Calibri', size: 12, bold: true };
  hLombaGroup.alignment = { horizontal: 'center', vertical: 'middle' };
  for (let c = startLombaCol; c <= endLombaCol; c++) {
    wsNilai.getCell(8, c).border = thinBorder;
  }

  // Nama Lomba vertikal di baris 9
  recapContests.forEach((rc, i) => {
    const col = startLombaCol + i;
    const cell = wsNilai.getCell(9, col);
    cell.value = rc.name;
    cell.font = { name: 'Calibri', size: 12 };
    cell.alignment = { horizontal: 'center', vertical: 'middle', textRotation: 90 };
    cell.border = thinBorder;
  });

  // JUMLAH NILAI (ColJumlah 8 : ColJumlah 9)
  wsNilai.mergeCells(8, colJumlah, 9, colJumlah);
  const hJumlah = wsNilai.getCell(8, colJumlah);
  hJumlah.value = 'JUMLAH NILAI';
  hJumlah.font = { name: 'Calibri', size: 12 };
  hJumlah.alignment = { horizontal: 'center', vertical: 'middle', textRotation: 90 };
  hJumlah.border = thinBorder;
  wsNilai.getCell(9, colJumlah).border = thinBorder;

  // PERINGKAT (ColRank 8 : ColRank 9)
  wsNilai.mergeCells(8, colRank, 9, colRank);
  const hRank = wsNilai.getCell(8, colRank);
  hRank.value = 'PERINGKAT';
  hRank.font = { name: 'Calibri', size: 12 };
  hRank.alignment = { horizontal: 'center', vertical: 'middle', textRotation: 90 };
  hRank.border = thinBorder;
  wsNilai.getCell(9, colRank).border = thinBorder;

  // Baris Data Regu (Urut no. kavling regu: 1, 2, 3...)
  const sortedTeams = [...st.rows].sort((a, b) => a.team.no - b.team.no);
  const startDataRow = 10;
  const numTeams = sortedTeams.length;
  const endDataRow = startDataRow + numTeams - 1;

  const startColLetter = getColLetter(startLombaCol);
  const endColLetter = getColLetter(endLombaCol);
  const colJumlahLetter = getColLetter(colJumlah);
  const colRankLetter = getColLetter(colRank);

  sortedTeams.forEach((r, idx) => {
    const rowNum = startDataRow + idx;
    wsNilai.getRow(rowNum).height = 15.6;

    // No. Kav
    const cKav = wsNilai.getCell(rowNum, 3);
    cKav.value = r.team.no;
    cKav.font = { name: 'Calibri', size: 10 };
    cKav.alignment = { horizontal: 'center', vertical: 'middle' };
    cKav.border = thinBorder;

    // Nama Regu
    const cRegu = wsNilai.getCell(rowNum, 4);
    cRegu.value = r.team.name.toUpperCase();
    cRegu.font = { name: 'Calibri', size: 10 };
    cRegu.alignment = { horizontal: 'left', vertical: 'middle' };
    cRegu.border = thinBorder;

    // Kontingen
    const cKont = wsNilai.getCell(rowNum, 5);
    cKont.value = r.team.pangkalan;
    cKont.font = { name: 'Calibri', size: 10 };
    cKont.alignment = { horizontal: 'left', vertical: 'middle' };
    cKont.border = thinBorder;

    // Nilai tiap lomba
    recapContests.forEach((rc, cIdx) => {
      const col = startLombaCol + cIdx;
      const cLomba = wsNilai.getCell(rowNum, col);
      const val = r.scores[rc.key];
      cLomba.value = val == null ? 0 : val;
      cLomba.font = { name: 'Calibri', size: 11 };
      cLomba.alignment = { horizontal: 'center', vertical: 'middle' };
      cLomba.border = thinBorder;
    });

    // Jumlah Nilai (Formula SUM)
    const cTotal = wsNilai.getCell(rowNum, colJumlah);
    cTotal.value = {
      formula: `SUM(${startColLetter}${rowNum}:${endColLetter}${rowNum})`,
      result: r.total,
    };
    cTotal.font = { name: 'Calibri', size: 11 };
    cTotal.alignment = { horizontal: 'center', vertical: 'middle' };
    cTotal.border = thinBorder;

    // Peringkat (Hasil rank dari klasemen)
    const cPeringkat = wsNilai.getCell(rowNum, colRank);
    cPeringkat.value = r.out ? 'DQ' : r.rank || '-';
    cPeringkat.font = { name: 'Calibri', size: 11 };
    cPeringkat.alignment = { horizontal: 'center', vertical: 'middle' };
    cPeringkat.border = thinBorder;
  });

  // Footer: NILAI TERTINGGI & NILAI TERRENDAH
  if (numTeams > 0) {
    const rowTertinggi = endDataRow + 1;
    const rowTerendah = endDataRow + 2;

    wsNilai.getRow(rowTertinggi).height = 15.6;
    wsNilai.getRow(rowTerendah).height = 15.6;

    const fillGray: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' },
    };

    // NILAI TERTINGGI
    wsNilai.mergeCells(rowTertinggi, 3, rowTertinggi, 5);
    const cMaxTitle = wsNilai.getCell(rowTertinggi, 3);
    cMaxTitle.value = 'NILAI TERTINGGI';
    cMaxTitle.font = { name: 'Calibri', size: 11 };
    cMaxTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    for (let c = 3; c <= 5; c++) wsNilai.getCell(rowTertinggi, c).border = thinBorder;

    for (let c = startLombaCol; c <= endLombaCol; c++) {
      const colLet = getColLetter(c);
      const cell = wsNilai.getCell(rowTertinggi, c);
      cell.value = { formula: `MAX(${colLet}${startDataRow}:${colLet}${endDataRow})` };
      cell.font = { name: 'Calibri', size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = fillGray;
      cell.border = thinBorder;
    }

    const cellMaxJumlah = wsNilai.getCell(rowTertinggi, colJumlah);
    cellMaxJumlah.value = { formula: `MAX(${colJumlahLetter}${startDataRow}:${colJumlahLetter}${endDataRow})` };
    cellMaxJumlah.font = { name: 'Calibri', size: 11 };
    cellMaxJumlah.alignment = { horizontal: 'center', vertical: 'middle' };
    cellMaxJumlah.fill = fillGray;
    cellMaxJumlah.border = thinBorder;

    const cellMinRank = wsNilai.getCell(rowTertinggi, colRank);
    cellMinRank.value = 1;
    cellMinRank.font = { name: 'Calibri', size: 11 };
    cellMinRank.alignment = { horizontal: 'center', vertical: 'middle' };
    cellMinRank.fill = fillGray;
    cellMinRank.border = thinBorder;

    // NILAI TERRENDAH
    wsNilai.mergeCells(rowTerendah, 3, rowTerendah, 5);
    const cMinTitle = wsNilai.getCell(rowTerendah, 3);
    cMinTitle.value = 'NILAI TERRENDAH';
    cMinTitle.font = { name: 'Calibri', size: 11 };
    cMinTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    for (let c = 3; c <= 5; c++) wsNilai.getCell(rowTerendah, c).border = thinBorder;

    for (let c = startLombaCol; c <= endLombaCol; c++) {
      const colLet = getColLetter(c);
      const cell = wsNilai.getCell(rowTerendah, c);
      cell.value = { formula: `MIN(${colLet}${startDataRow}:${colLet}${endDataRow})` };
      cell.font = { name: 'Calibri', size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = fillGray;
      cell.border = thinBorder;
    }

    const cellMinJumlah = wsNilai.getCell(rowTerendah, colJumlah);
    cellMinJumlah.value = { formula: `MIN(${colJumlahLetter}${startDataRow}:${colJumlahLetter}${endDataRow})` };
    cellMinJumlah.font = { name: 'Calibri', size: 11 };
    cellMinJumlah.alignment = { horizontal: 'center', vertical: 'middle' };
    cellMinJumlah.fill = fillGray;
    cellMinJumlah.border = thinBorder;

    const cellMaxRank = wsNilai.getCell(rowTerendah, colRank);
    cellMaxRank.value = numTeams;
    cellMaxRank.font = { name: 'Calibri', size: 11 };
    cellMaxRank.alignment = { horizontal: 'center', vertical: 'middle' };
    cellMaxRank.fill = fillGray;
    cellMaxRank.border = thinBorder;
  }

  /* ==========================================================================
     SHEET 2: Data 2 (Kejuaraan Per Mata Lomba & Rekapitulasi Juara Umum)
     ========================================================================== */
  const wsData2 = wb.addWorksheet('Data 2', {
    pageSetup: {
      orientation: 'landscape',
      margins: { left: 0.2, right: 0.2, top: 0.4, bottom: 0.2, header: 0.3, footer: 0.3 },
    },
    views: [{ showGridLines: true }],
  });

  // Lebar kolom pada Data 2
  // C..F: 7, 18, 25, 10
  // H..K: 7, 18, 25, 10
  // N..Q: 7, 18, 25, 10
  // S..V: 7, 18, 25, 10
  // Y..AB: 7, 18, 25, 10
  // AE..AH: 7, 18, 25, 10
  const setTableWidths = (startC: number) => {
    wsData2.getColumn(startC).width = 8;
    wsData2.getColumn(startC + 1).width = 18;
    wsData2.getColumn(startC + 2).width = 25;
    wsData2.getColumn(startC + 3).width = 10;
  };
  setTableWidths(3); // C..F
  setTableWidths(8); // H..K
  setTableWidths(14); // N..Q
  setTableWidths(19); // S..V
  setTableWidths(25); // Y..AB
  setTableWidths(31); // AE..AH

  // Header Judul Baris 9
  wsData2.mergeCells(9, 3, 9, 11);
  const titleD2Left1 = wsData2.getCell(9, 3);
  titleD2Left1.value = `KEJUARAAN MATA LOMBA PERKEMAHAN AJANG SILATURAHIM DAN PERSAHABATAN (${eventShort}) SE-JAWA TIMUR 2026`;
  titleD2Left1.font = { name: 'Arial Black', size: 11, bold: true };
  titleD2Left1.alignment = { horizontal: 'center', vertical: 'middle' };

  wsData2.mergeCells(9, 14, 9, 22);
  const titleD2Left2 = wsData2.getCell(9, 14);
  titleD2Left2.value = `KEJUARAAN MATA LOMBA PERKEMAHAN AJANG SILATURAHIM DAN PERSAHABATAN (${eventShort}) SE-JAWA TIMUR 2026`;
  titleD2Left2.font = { name: 'Arial Black', size: 11, bold: true };
  titleD2Left2.alignment = { horizontal: 'center', vertical: 'middle' };

  wsData2.mergeCells(9, 25, 9, 34);
  const titleD2Right = wsData2.getCell(9, 25);
  titleD2Right.value = `REKAPITULASI SEMUA NILAI PERKEMAHAN AJANG SILATURAHIM DAN PERSAHABATAN (${eventShort}) SE-JAWA TIMUR 2026`;
  titleD2Right.font = { name: 'Arial Black', size: 11, bold: true };
  titleD2Right.alignment = { horizontal: 'center', vertical: 'middle' };

  const fillTitleTable: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9E1F2' }, // Soft Accent
  };

  const fillHeaderCols: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE7E6E6' }, // Light Gray
  };

  // Helper untuk membuat mini table lomba di Data 2
  const drawMiniTable = (
    startR: number,
    startC: number,
    title: string,
    rows: { score: number | string; regu: string; pangkalan: string; ket: string }[]
  ) => {
    // Baris Judul
    wsData2.mergeCells(startR, startC, startR, startC + 3);
    const cTitle = wsData2.getCell(startR, startC);
    cTitle.value = title.toUpperCase();
    cTitle.font = { name: 'Calibri', size: 11, bold: true };
    cTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    cTitle.fill = fillTitleTable;
    for (let c = startC; c <= startC + 3; c++) wsData2.getCell(startR, c).border = thinBorder;

    // Baris Header Kolom
    const headers = ['NILAI', 'REGU', 'PANGKALAN', 'KET.'];
    headers.forEach((h, i) => {
      const cell = wsData2.getCell(startR + 1, startC + i);
      cell.value = h;
      cell.font = { name: 'Calibri', size: 11, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = fillHeaderCols;
      cell.border = thinBorder;
    });

    // 3 Baris Data
    for (let i = 0; i < 3; i++) {
      const rNum = startR + 2 + i;
      const item = rows[i] ?? { score: '', regu: '', pangkalan: '', ket: `JUARA ${i === 0 ? 'I' : i === 1 ? 'II' : 'III'}` };

      const cScore = wsData2.getCell(rNum, startC);
      cScore.value = item.score;
      cScore.font = { name: 'Calibri', size: 11 };
      cScore.alignment = { horizontal: 'center', vertical: 'middle' };
      cScore.border = thinBorder;

      const cRegu = wsData2.getCell(rNum, startC + 1);
      cRegu.value = item.regu;
      cRegu.font = { name: 'Calibri', size: 11 };
      cRegu.alignment = { horizontal: 'left', vertical: 'middle' };
      cRegu.border = thinBorder;

      const cPangkalan = wsData2.getCell(rNum, startC + 2);
      cPangkalan.value = item.pangkalan;
      cPangkalan.font = { name: 'Calibri', size: 11 };
      cPangkalan.alignment = { horizontal: 'left', vertical: 'middle' };
      cPangkalan.border = thinBorder;

      const cKet = wsData2.getCell(rNum, startC + 3);
      cKet.value = item.ket;
      cKet.font = { name: 'Calibri', size: 11 };
      cKet.alignment = { horizontal: 'center', vertical: 'middle' };
      cKet.border = thinBorder;
    }
  };

  // 1. Tulis tabel lomba-lomba di sebelah kiri (Kolom C..V)
  // Grid: 4 kolom blok lomba per baris: C(3), H(8), N(14), S(19)
  const leftColStarts = [3, 8, 14, 19];
  const allContests = cfg.contests.filter((c) => c.key !== 'msc_penyisihan' && c.key !== 'msc_semifinal');
  const teamMap = new Map(st.rows.map((r) => [r.team.id, r.team]));

  allContests.forEach((cDef, index) => {
    const colIndex = index % 4;
    const rowIndex = Math.floor(index / 4);
    const startR = 10 + rowIndex * 6; // tiap baris lomba jarak 6 row
    const startC = leftColStarts[colIndex];

    const ranked = st.per[cDef.key] ?? [];
    const top3 = [0, 1, 2].map((i) => {
      const rankItem = ranked[i];
      if (!rankItem) return { score: '', regu: '', pangkalan: '', ket: `JUARA ${i === 0 ? 'I' : i === 1 ? 'II' : 'III'}` };
      const team = teamMap.get(rankItem.teamId);
      return {
        score: rankItem.score,
        regu: team ? team.name.toUpperCase() : '',
        pangkalan: team ? team.pangkalan : '',
        ket: `JUARA ${i === 0 ? 'I' : i === 1 ? 'II' : 'III'}`,
      };
    });

    drawMiniTable(startR, startC, cDef.name, top3);
  });

  // 2. Tulis tabel rekapitulasi juara umum di sebelah kanan (Kolom Y..AB dan AE..AH)
  // Juara Favorit (Y10..AB13)
  const favorit1 = st.favorit[0];
  drawMiniTable(10, 25, 'JUARA FAVORIT', [
    {
      score: favorit1 ? favorit1.total : '',
      regu: favorit1 ? favorit1.teams.map((t) => t.name).join(' · ').toUpperCase() : '',
      pangkalan: favorit1 ? favorit1.pangkalan : '',
      ket: 'FAVORIT',
    },
    { score: '', regu: '', pangkalan: '', ket: '' },
    { score: '', regu: '', pangkalan: '', ket: '' },
  ]);

  // Juara Umum (AE10..AH13)
  const juaraUmum = st.rows[0];
  drawMiniTable(10, 31, 'JUARA UMUM', [
    {
      score: juaraUmum ? juaraUmum.total : '',
      regu: juaraUmum ? juaraUmum.team.name.toUpperCase() : '',
      pangkalan: juaraUmum ? juaraUmum.team.pangkalan : '',
      ket: 'UMUM',
    },
    { score: '', regu: '', pangkalan: '', ket: '' },
    { score: '', regu: '', pangkalan: '', ket: '' },
  ]);

  // Kategori Penghargaan lainnya (Juara Utama, Harapan Utama, dll dari cfg.awards)
  // Pasangkan secara seimbang pada kolom Y(25) dan AE(31)
  const otherAwards = cfg.awards.filter((a) => a.name !== 'Juara Umum');
  otherAwards.forEach((aw, idx) => {
    const isColLeft = idx % 2 === 0;
    const pairRow = Math.floor(idx / 2);
    const startR = 16 + pairRow * 6;
    const startC = isColLeft ? 25 : 31;

    // Ambil regu yang masuk di range award ini (start s/d start + size - 1)
    const teamsInAward: { score: number | string; regu: string; pangkalan: string; ket: string }[] = [];
    for (let k = 0; k < aw.size; k++) {
      const rk = aw.start + k;
      const rowItem = st.rows.find((r) => r.rank === rk);
      const ketLabel = aw.size === 1 ? '' : k === 0 ? 'I' : k === 1 ? 'II' : 'III';
      teamsInAward.push({
        score: rowItem ? rowItem.total : '',
        regu: rowItem ? rowItem.team.name.toUpperCase() : '',
        pangkalan: rowItem ? rowItem.team.pangkalan : '',
        ket: ketLabel,
      });
    }

    drawMiniTable(startR, startC, aw.name, teamsInAward);
  });

  // Tulis buffer dan unduh file
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rekapitulasi-nilai-${eventShort.toLowerCase().replace(/\s+/g, '-')}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
