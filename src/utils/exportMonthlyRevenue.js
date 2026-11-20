import { groupMonthlyRevenue } from './monthlyRevenue.js';

export async function exportMonthlyRevenue(report) {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' })
    .format(new Date(report.month + '-01T00:00:00Z'));
  const monthLabel = `${report.month} (${monthName})`;
  const services = groupMonthlyRevenue(report);
  for (const service of services) {
    // Excel sheet names cannot contain '/', but the full package appears inside.
    const sheet = workbook.addWorksheet(service.sheetName);
    sheet.columns = [{ width: 45 }, { width: 26 }];
    sheet.mergeCells('A1:B1');
    sheet.getCell('A1').value = service.title;
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 14 };
    sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB71932' } };
    sheet.getRow(1).height = 30;
    sheet.addRow(['Month', monthLabel]);
    sheet.addRow(['Date', 'Count']).font = { bold: true };
    service.rows.forEach(row => sheet.addRow([row.date, row.count]));
    sheet.addRow(['Monthly Total', service.total]).font = { bold: true };
    sheet.addRow(['Blank count = no record for this date.']);
    sheet.getColumn(2).numFmt = '#,##0';
    sheet.views = [{ state: 'frozen', ySplit: 3 }];
    sheet.autoFilter = { from: 'A3', to: 'B' + (service.rows.length + 3) };
  }
  const summary = workbook.addWorksheet('Summary');
  summary.columns = [{ width: 48 }, { width: 26 }];
  summary.addRow(['Month', monthLabel]);
  summary.addRow(['Service', 'Total Count']).font = { bold: true };
  services.forEach(service => summary.addRow([service.title, service.total]));
  summary.addRow(['Total Count', report.totalCount]).font = { bold: true };
  summary.addRow(['Services', report.serviceCount]);
  summary.addRow(['Records', report.rows.length]);
  summary.getColumn(2).numFmt = '#,##0';
  const bytes = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'deikhlo-monthly-revenue-' + report.month + '.xlsx';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
