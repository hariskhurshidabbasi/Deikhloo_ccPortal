export function defaultReportRange() {
  const end = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return { start: end.slice(0, 7) + '-01', end };
}
