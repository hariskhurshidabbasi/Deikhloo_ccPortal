export const revenueServices = [
  { id: '99171', package: 'Rs 4+Tax/Daily', sheetName: '99171 (Rs 4+Tax Daily)' },
  { id: '99144', package: 'Rs 5+Tax/Daily', sheetName: '99144 (Rs 5+Tax Daily)' },
  { id: '89130', package: 'Rs 7+Tax/Weekly', sheetName: '89130 (Rs 7+Tax Weekly)' },
];

// Missing dates stay blank, so absent records are not reported as zero charges.
export function groupMonthlyRevenue(report) {
  const [year, month] = report.month.split('-').map(Number);
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return revenueServices.map(service => {
    const counts = new Map();
    for (const row of report.rows) {
      if (String(row.serviceId) !== service.id || !row.logDate.startsWith(report.month + '-')) continue;
      counts.set(row.logDate, (counts.get(row.logDate) || 0) + Number(row.count));
    }
    return {
      ...service,
      title: `Deikhlo - ${service.id} (${service.package})`,
      total: [...counts.values()].reduce((sum, count) => sum + count, 0),
      rows: Array.from({ length: days }, (_, index) => {
        const date = report.month + '-' + String(index + 1).padStart(2, '0');
        return { date, count: counts.has(date) ? counts.get(date) : null };
      }),
    };
  });
}
