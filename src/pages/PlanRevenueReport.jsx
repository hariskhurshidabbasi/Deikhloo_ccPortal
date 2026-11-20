import React, { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon';
import { exportPlanRevenue, planReportColumns } from '../utils/exportPlanRevenue';
import { defaultReportRange } from '../utils/reportDates';
import ReportEmptyState from '../components/reports/ReportEmptyState';
import ReportLoading from '../components/reports/ReportLoading';
import ReportPagination, { useReportPagination } from '../components/reports/ReportPagination';

export default function PlanRevenueReport() {
  const [range, setRange] = useState(defaultReportRange);
  const [state, setState] = useState({ data: null, loading: false, error: '' });
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const pending = useRef(null);
  async function load(dates) {
    pending.current?.abort();
    const controller = new AbortController(); pending.current = controller;
    setState(previous => ({ ...previous, loading: true, error: '' })); setExportError('');
    try {
      const response = await fetch('/api/reports/plan-revenue' + (dates ? '?' + new URLSearchParams(dates) : ''), { signal: controller.signal, cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load report.');
      if (controller.signal.aborted) return;
      setState({ data, loading: false, error: '' }); setRange({ start: data.start, end: data.end });
    } catch (error) { if (!controller.signal.aborted) setState({ data: null, loading: false, error: error.message }); }
  }
  useEffect(() => () => pending.current?.abort(), []);
  async function download() {
    setExporting(true); setExportError('');
    try { await exportPlanRevenue(state.data); } catch { setExportError('Excel export failed. Please try again.'); }
    finally { setExporting(false); }
  }
  const report = state.data;
  const pagination = useReportPagination(report?.rows);
  const number = value => Number(value).toLocaleString('en-PK');
  const money = value => Number(value).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return <main className="dashboard plan-report">
    <section className="welcome"><h1><Icon name="dashboard" size={28} /> Plan &amp; Revenue Report</h1><p>Deikhlo daily and weekly charging counts and calculated revenue.</p></section>
    <form className="card report-date-filter" onSubmit={event => { event.preventDefault(); load(range); }}>
      <label>Start Date<input type="date" required value={range.start} max={range.end || undefined} onChange={event => setRange({ ...range, start: event.target.value })} /></label>
      <label>End Date<input type="date" required value={range.end} min={range.start || undefined} onChange={event => setRange({ ...range, end: event.target.value })} /></label>
      <button className="danger-button" disabled={state.loading}>{state.loading ? 'Generating…' : 'Generate Report'}</button>
    </form>
    {state.error && <p className="notice" role="alert">{state.error}</p>}
    {!report && <ReportEmptyState />}
    {state.loading && <ReportLoading />}
    {report && <>
      <section className="report-stat-grid">
        {[['Total Charging Count', number(report.totals.totalCount)], ['Revenue Excl. Tax (PKR)', money(report.totals.totalRevenue)], ['Daily Plan Count', number(report.totals.dailyCount)], ['Weekly Plan Count', number(report.totals.weeklyCount)]].map(([label, value]) => <div className="card" key={label}><span>{label}</span><strong>{value}</strong></div>)}
      </section>
      <p className="hint">Counts are charging records, not unique users. Rates: 99171 = Rs 4/day, 99144 = Rs 5/day, 89130 = Rs 7/week; revenue excludes tax. Latest available data: {report.latestDate || 'None'}.</p>
      {report.totals.unmappedCount > 0 && <p className="notice">{number(report.totals.unmappedCount)} counts have an unknown service rate and are excluded from revenue.</p>}
      <section className="card">
        <div className="report-table-heading"><h2>Daily Breakdown</h2><span>{report.start} — {report.end}</span></div>
        <button className="bulk-preview-button" disabled={state.loading || exporting || !report.rows.length} onClick={download}>{exporting ? 'Exporting…' : '↓ Export Excel'}</button>
        {exportError && <p role="alert">{exportError}</p>}
        <div className="table-scroll report-table"><table className="records"><thead><tr>{planReportColumns.map(([key, label]) => <th key={key}>{label}</th>)}</tr></thead>
          <tbody>{pagination.rows.map(row => <tr key={row.date}>{planReportColumns.map(([key]) => <td key={key}>{key === 'date' ? row.date : key.includes('Revenue') ? <span className="report-amount">{money(row[key])}</span> : number(row[key])}</td>)}</tr>)}</tbody>
          <tfoot><tr>{planReportColumns.map(([key]) => <th key={key}>{key === 'date' ? 'Total' : key.includes('Revenue') ? money(report.totals[key]) : number(report.totals[key])}</th>)}</tr></tfoot>
        </table></div>
        <ReportPagination pagination={pagination} disabled={state.loading} />
        {!report.rows.length && <p className="hint">No records available for these dates.</p>}
      </section>
    </>}
  </main>;
}
