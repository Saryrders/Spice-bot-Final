const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const DATA_FILE = './spice_data.json';

async function generateExcel() {
  const raw = fs.existsSync(DATA_FILE)
    ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
    : { history: [], totals: {}, pendingPayments: {}, paymentHistory: [] };

  if (!raw.pendingPayments) raw.pendingPayments = {};
  if (!raw.paymentHistory)  raw.paymentHistory  = [];

  const wb = new ExcelJS.Workbook();
  wb.creator = "SpiceBot — Muppet's of Rodin";
  wb.created = new Date();

  const GOLD    = 'FFC8A535';
  const DARKBG  = 'FF1A1A2E';
  const WHITE   = 'FFFFFFFF';
  const LIGHTBG = 'FFF5F0E8';
  const DARK    = 'FF2C2C2C';
  const GREEN   = 'FF23a559';
  const RED     = 'FFe74c3c';

  const hFont = { name: 'Arial', bold: true, size: 11, color: { argb: WHITE } };
  const nFont = { name: 'Arial', size: 10, color: { argb: DARK } };
  const tFont = { name: 'Arial', bold: true, size: 13, color: { argb: DARKBG } };

  function makeTitle(ws, text, cols) {
    ws.mergeCells(`A1:${String.fromCharCode(64 + cols)}1`);
    const c = ws.getCell('A1');
    c.value = text;
    c.font = tFont;
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F0E8' } };
    ws.getRow(1).height = 28;
  }

  function makeHeaders(ws, headers) {
    const row = ws.getRow(2);
    headers.forEach((h, i) => {
      const c = row.getCell(i + 1);
      c.value = h;
      c.font = hFont;
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARKBG } };
      c.alignment = { horizontal: 'center', vertical: 'middle' };
      c.border = { bottom: { style: 'medium', color: { argb: GOLD } } };
    });
    row.height = 22;
  }

  function styleRow(row, idx) {
    row.eachCell(c => {
      c.font = nFont;
      c.alignment = { vertical: 'middle', wrapText: true };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 0 ? 'FFFAF6EE' : WHITE } };
      c.border = { bottom: { style: 'thin', color: { argb: 'FFE0D8C8' } } };
    });
    row.height = 20;
  }

  // ═══════════════════════════════════════════
  // ONGLET 1 — Historique des harvests
  // ═══════════════════════════════════════════
  const ws1 = wb.addWorksheet('🪱 Harvest');
  makeTitle(ws1, "🪱 Harvest History — Muppet's of Rodin", 7);
  makeHeaders(ws1, ['#', 'Date', 'Total Farmed', 'Guild Share (10%)', 'Per Member', 'Participants', 'Submitted by']);

  raw.history.forEach((e, idx) => {
    const row = ws1.addRow([
      idx + 1, e.date, e.total, e.guildCut, e.perMember,
      e.members.join(', '), e.submittedBy
    ]);
    styleRow(row, idx);
    [3, 4, 5].forEach(col => {
      row.getCell(col).numFmt = '#,##0';
      row.getCell(col).alignment = { horizontal: 'right', vertical: 'middle' };
    });
  });

  if (raw.history.length > 0) {
    const n = raw.history.length + 2;
    const tot = ws1.addRow(['', 'TOTAL',
      `=SUM(C3:C${n - 1})`, `=SUM(D3:D${n - 1})`, '', '', '']);
    tot.eachCell(c => {
      c.font = { name: 'Arial', bold: true, size: 10, color: { argb: WHITE } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GOLD } };
      c.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    [3, 4].forEach(col => {
      tot.getCell(col).numFmt = '#,##0';
      tot.getCell(col).alignment = { horizontal: 'right', vertical: 'middle' };
    });
    tot.height = 22;
  }

  ws1.getColumn(1).width = 5;  ws1.getColumn(2).width = 22;
  ws1.getColumn(3).width = 16; ws1.getColumn(4).width = 18;
  ws1.getColumn(5).width = 16; ws1.getColumn(6).width = 38;
  ws1.getColumn(7).width = 18;
  ws1.views = [{ state: 'frozen', ySplit: 2 }];

  // ═══════════════════════════════════════════
  // ONGLET 2 — Paiements effectués (Gave)
  // ═══════════════════════════════════════════
  const ws2 = wb.addWorksheet('✅ Paiements');
  makeTitle(ws2, "✅ Payment History", 4);
  makeHeaders(ws2, ['Date', 'Member', 'Amount paid', 'Paid by']);

  raw.paymentHistory.forEach((e, idx) => {
    const row = ws2.addRow([e.date, e.member, e.amount, e.paidBy]);
    styleRow(row, idx);
    row.getCell(3).numFmt = '#,##0';
    row.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(3).font = { ...nFont, color: { argb: GREEN } };
  });

  ws2.getColumn(1).width = 22; ws2.getColumn(2).width = 22;
  ws2.getColumn(3).width = 20; ws2.getColumn(4).width = 20;
  ws2.views = [{ state: 'frozen', ySplit: 2 }];

  // ═══════════════════════════════════════════
  // ONGLET 3 — Dettes en cours (Owe)
  // ═══════════════════════════════════════════
  const ws3 = wb.addWorksheet('💸 À distribuer');
  makeTitle(ws3, "💸 Spice still to be distributed", 3);
  makeHeaders(ws3, ['Member', 'Amount owed', 'Status']);

  const pending = Object.entries(raw.pendingPayments).sort((a, b) => b[1] - a[1]);
  pending.forEach(([name, amt], idx) => {
    const row = ws3.addRow([name, amt, amt > 0 ? '⏳ Pending' : '✅ Paid']);
    styleRow(row, idx);
    row.getCell(2).numFmt = '#,##0';
    row.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(2).font = { ...nFont, color: { argb: amt > 0 ? RED : GREEN } };
    row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
  });

  ws3.getColumn(1).width = 25; ws3.getColumn(2).width = 20; ws3.getColumn(3).width = 18;
  ws3.views = [{ state: 'frozen', ySplit: 2 }];

  // ═══════════════════════════════════════════
  // ONGLET 4 — Ladder total par membre
  // ═══════════════════════════════════════════
  const ws4 = wb.addWorksheet('🏆 Ladder');
  makeTitle(ws4, "🏆 Total Spice received per member — all time", 3);
  makeHeaders(ws4, ['Rank', 'Member', 'Total Spice received']);

  const sorted = Object.entries(raw.totals).sort((a, b) => b[1] - a[1]);
  sorted.forEach(([name, total], idx) => {
    const medals = ['🥇', '🥈', '🥉'];
    const displayName = idx < 3 ? `${medals[idx]} ${name}` : name;
    const row = ws4.addRow([idx + 1, displayName, total]);
    styleRow(row, idx);
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(3).numFmt = '#,##0';
    row.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
  });

  if (sorted.length > 0) {
    const n = sorted.length + 2;
    const tot = ws4.addRow(['', 'TOTAL', `=SUM(C3:C${n - 1})`]);
    tot.eachCell(c => {
      c.font = { name: 'Arial', bold: true, size: 10, color: { argb: WHITE } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GOLD } };
      c.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    tot.getCell(3).numFmt = '#,##0';
    tot.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
    tot.height = 22;
  }

  ws4.getColumn(1).width = 8; ws4.getColumn(2).width = 28; ws4.getColumn(3).width = 22;
  ws4.views = [{ state: 'frozen', ySplit: 2 }];

  const outputPath = path.join(__dirname, `spice_export_${Date.now()}.xlsx`);
  await wb.xlsx.writeFile(outputPath);
  return outputPath;
}

module.exports = { generateExcel };
