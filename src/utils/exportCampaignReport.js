export async function exportCampaignReport(report) {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Campaign Report');
  const headers = ['Date', ...report.campaigns.flatMap(item => [item.label + ' · Users', item.label + ' · Charged']), 'Total Users', 'Total Charged'];
  sheet.addRow(headers);
  for (const row of report.rows) sheet.addRow([row.date, ...report.campaigns.flatMap(item => [row.campaigns[item.id]?.users || 0, row.campaigns[item.id]?.charged || 0]), row.users, row.charged]);
  sheet.addRow(['Total', ...report.campaigns.flatMap(item => [report.campaignTotals[item.id].users, report.campaignTotals[item.id].charged]), report.totals.users, report.totals.charged]).font = { bold: true };
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB71932' } }; });
  sheet.columns.forEach((column, index) => { column.width = index ? 27 : 18; if (index) column.numFmt = '#,##0'; });
  sheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: report.rows.length + 1, column: headers.length } };
  const summary = workbook.addWorksheet('Summary');
  summary.columns = [{ width: 25 }, { width: 95 }];
  summary.addRows([['Start Date', report.start], ['End Date', report.end], ['Campaign', report.selectedCampaign === 'all' ? 'All campaigns' : report.campaigns[0]?.label], ['Total Users', report.totals.users], ['Charged Users', report.totals.charged], ['Conversion', report.totals.conversion / 100], ['Days', report.totals.days]]);
  summary.getCell('B6').numFmt = '0.0%';
  const url = URL.createObjectURL(new Blob([await workbook.xlsx.writeBuffer()], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const link = document.createElement('a'); link.href = url; link.download = `deikhlo-campaign-report-${report.start}-to-${report.end}.xlsx`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
