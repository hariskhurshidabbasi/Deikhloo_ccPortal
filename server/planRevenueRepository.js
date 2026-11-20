import { query } from './database.js';

// Service rates supplied for Deikhlo. Revenue excludes tax; counts are not unique users.
export const reportPlans = [
  { id: 99171, name: 'Daily · Rs 4 + tax', period: 'daily', rate: 4 },
  { id: 99144, name: 'Daily · Rs 5 + tax', period: 'daily', rate: 5 },
  { id: 89130, name: 'Weekly · Rs 7 + tax', period: 'weekly', rate: 7 },
];
function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || '') && Number(value.slice(0, 4)) >= 1000 &&
    !Number.isNaN(Date.parse(value)) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
}
export async function getPlanRevenue(start, end, read = query) {
  const [bounds] = await read('SELECT MIN(log_date) AS firstDate, MAX(log_date) AS lastDate FROM charging_logs_new');
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  if (start == null && end == null) {
    end = bounds.lastDate || today;
    start = end.slice(0, 7) + '-01';
  }
  if (!validDate(start) || !validDate(end) || start > end) throw Object.assign(new Error('Choose a valid start and end date.'), { status: 400 });
  if ((Date.parse(end) - Date.parse(start)) / 86400000 > 366) throw Object.assign(new Error('Select a date range of at most 367 days.'), { status: 400 });
  const records = await read(`SELECT log_date AS date, service_id AS serviceId, count
    FROM charging_logs_new WHERE log_date >= ? AND log_date <= ? ORDER BY log_date DESC, service_id`, [start, end]);
  const grouped = new Map();
  const totals = { totalCount: 0, totalRevenue: 0, dailyCount: 0, dailyRevenue: 0, weeklyCount: 0, weeklyRevenue: 0, unmappedCount: 0 };
  for (const record of records) {
    if (!grouped.has(record.date)) grouped.set(record.date, { date: record.date, ...totals, services: {} });
    const row = grouped.get(record.date);
    const plan = reportPlans.find(plan => plan.id === Number(record.serviceId));
    const count = Number(record.count);
    row.totalCount += count;
    row.services[record.serviceId] = (row.services[record.serviceId] || 0) + count;
    if (!plan) { row.unmappedCount += count; continue; }
    row[plan.period + 'Count'] += count;
    row[plan.period + 'Revenue'] += count * plan.rate;
    row.totalRevenue += count * plan.rate;
  }
  const rows = [...grouped.values()];
  for (const row of rows) for (const key of Object.keys(totals)) totals[key] += row[key];
  return { start, end, latestDate: bounds.lastDate, rows, totals, plans: reportPlans };
}
