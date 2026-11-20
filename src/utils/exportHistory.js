import { displayValue, historySections } from '../services/activationHistory.js';

export async function exportHistory(phone, data) {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const hasDeactivation = data.activations.some(record => record.status === 'Inactive');
  const sections = [{
    key: 'activations', title: 'Activation History',
    columns: [['dateTime', 'DATE & TIME'], ['plan', 'PLAN'], ['source', 'ACTIVATION SOURCE'], ['status', 'STATUS'],
      ...(hasDeactivation ? [['reason', 'REASON'], ['deactivatedAt', 'DEACTIVATION DATE']] : [])],
  }, ...historySections];
  for (const section of sections) {
    const sheet = workbook.addWorksheet(section.title);
    sheet.addRow(section.columns.map(([, label]) => label));
    for (const record of data[section.key]) {
      sheet.addRow(section.columns.map(([key]) => displayValue(record[key])));
    }
    sheet.getRow(1).font = { bold: true };
    sheet.columns.forEach(column => { column.width = 24; });
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
  }
  const bytes = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'deikhlo-history-' + phone + '.xlsx';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
