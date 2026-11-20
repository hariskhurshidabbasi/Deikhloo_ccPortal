import { query } from './database.js';

export async function getMonthlyRevenue(requestedMonth, read = query) {
  if (requestedMonth && !/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(requestedMonth)) {
    throw Object.assign(new Error('Select a valid month (YYYY-MM).'), { status: 400 });
  }
  const available = await read("SELECT DISTINCT DATE_FORMAT(log_date, '%Y-%m') AS month FROM charging_logs_new WHERE log_date >= '1000-01-01' ORDER BY month DESC");
  const month = requestedMonth || available[0]?.month || new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit',
  }).format(new Date()).slice(0, 7);
  const rows = await read(`SELECT id, log_date AS logDate, service_id AS serviceId,
    count, created_at AS createdAt FROM charging_logs_new
    WHERE log_date >= ? AND log_date < DATE_ADD(?, INTERVAL 1 MONTH)
    ORDER BY log_date DESC, service_id, id`, [month + '-01', month + '-01']);
  return {
    month, availableMonths: available.map(row => row.month), rows,
    totalCount: rows.reduce((sum, row) => sum + Number(row.count), 0),
    serviceCount: new Set(rows.map(row => row.serviceId)).size,
  };
}
