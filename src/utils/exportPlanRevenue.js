export const planReportColumns = [
  ['date', 'Date'], ['totalCount', 'Total Charging Count'], ['totalRevenue', 'Revenue Excl. Tax (PKR)'],
  ['dailyCount', 'Daily Count'], ['dailyRevenue', 'Daily Revenue (PKR)'],
  ['weeklyCount', 'Weekly Count'], ['weeklyRevenue', 'Weekly Revenue (PKR)'],
];
export async function exportPlanRevenue(report) {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Plan & Revenue');
  sheet.columns = planReportColumns.map(([key, header]) => ({ key, header, width: 27 }));
  sheet.addRows(report.rows);
  sheet.addRow({ date: 'Total', ...report.totals }).font = { bold: true };
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  planReportColumns.forEach(([key], index) => { if (key.includes('Revenue')) sheet.getColumn(index + 1).numFmt = '#,##0.00'; });
  const notes = workbook.addWorksheet('Report Details');
  notes.columns = [{ width: 35 }, { width: 65 }];
  notes.addRows([['Start date', report.start], ['End date', report.end], ['Basis', 'Charging counts, not unique users; calculated revenue excludes tax.'],
    ...report.plans.map(plan => [String(plan.id), `${plan.name}; rate PKR ${plan.rate}`]), ['Unmapped count', report.totals.unmappedCount]]);
  const url = URL.createObjectURL(new Blob([await workbook.xlsx.writeBuffer()], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const link = document.createElement('a'); link.href = url; link.download = `deikhlo-plan-revenue-${report.start}-to-${report.end}.xlsx`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
