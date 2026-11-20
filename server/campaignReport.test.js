import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCampaignReport, campaignsFromRecords } from './campaignReportRepository.js';
import { exportCampaignReport } from '../src/utils/exportCampaignReport.js';
import ExcelJS from 'exceljs';

const snapshot = { generatedAt: '2026-11-19T00:00:00Z', records: [
  { date: '2026-11-02', source: '1122', users: '10', charged: '4' },
  { date: '2026-11-02', source: '0', users: '3', charged: '1' },
  { date: '2026-11-01', source: null, users: '2', charged: '0' },
  { date: '2026-10-31', source: '1122', users: '99', charged: '80' },
] };
test('all campaigns includes distinct zero/missing sources, inclusive days and correct totals', () => {
  const report = buildCampaignReport(snapshot, '2026-11-01', '2026-11-03');
  assert.equal(report.campaigns.length, 3);
  assert.deepEqual(report.rows.map(row => row.date), ['2026-11-03', '2026-11-02', '2026-11-01']);
  assert.equal(report.rows[0].users, 0);
  assert.equal(report.totals.users, 15);
  assert.equal(report.totals.charged, 5);
  assert.equal(report.totals.days, 3);
  assert.equal(report.totals.conversion, 5 / 15 * 100);
  assert(campaignsFromRecords(snapshot.records).some(item => item.id === 'source:0'));
  assert(campaignsFromRecords(snapshot.records).some(item => item.id === 'missing'));
});
test('specific campaign only contains its own rows and totals', () => {
  const report = buildCampaignReport(snapshot, '2026-11-01', '2026-11-03', 'source:1122');
  assert.equal(report.campaigns.length, 1);
  assert.equal(report.totals.users, 10);
  assert.equal(report.totals.charged, 4);
  assert.equal(report.rows[2].users, 0);
  assert.throws(() => buildCampaignReport(snapshot, '2026-11-01', '2026-11-03', 'source:9999'), { status: 400 });
  assert.throws(() => buildCampaignReport(snapshot, '2026-02-30', '2026-03-01'), { status: 400 });
});
test('Excel preserves filtered campaign columns and numeric summary totals', async () => {
  const originalCreate = URL.createObjectURL, originalRevoke = URL.revokeObjectURL, originalDocument = globalThis.document;
  let blob;
  URL.createObjectURL = value => { blob = value; return 'blob:test'; };
  URL.revokeObjectURL = () => {};
  globalThis.document = { createElement: () => ({ click() {} }) };
  try {
    const report = buildCampaignReport(snapshot, '2026-11-01', '2026-11-03', 'source:1122');
    await exportCampaignReport(report);
    const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(await blob.arrayBuffer());
    const sheet = workbook.getWorksheet('Campaign Report');
    assert.equal(sheet.columnCount, 5);
    assert.equal(sheet.lastRow.getCell(4).value, 10);
    assert.equal(sheet.lastRow.getCell(5).value, 4);
    assert.equal(workbook.getWorksheet('Summary').getCell('B6').value, 0.4);
  } finally { URL.createObjectURL = originalCreate; URL.revokeObjectURL = originalRevoke; globalThis.document = originalDocument; }
});
