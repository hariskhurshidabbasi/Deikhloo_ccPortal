import React, { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import { exportMonthlyRevenue } from '../utils/exportMonthlyRevenue';
import { groupMonthlyRevenue } from '../utils/monthlyRevenue';

export default function MonthlyRevenueReport() {
  const [month, setMonth] = useState('');
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setState(previous => ({ ...previous, loading: true, error: '' }));
    setExportError('');
    async function load() {
      try {
        const response = await fetch('/api/monthly-revenue' + (month ? '?month=' + encodeURIComponent(month) : ''), { signal: controller.signal });
        if (response.status === 401) throw new Error('Session expired. Please log in again.');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load report.');
        if (!controller.signal.aborted) setState({ data, loading: false, error: '' });
      } catch (error) {
        if (!controller.signal.aborted) setState(previous => ({ ...previous, loading: false, error: error.message }));
      }
    }
    load();
    return () => controller.abort();
  }, [month]);
  async function download() {
    setExporting(true);
    setExportError('');
    try { await exportMonthlyRevenue(state.data); }
    catch { setExportError('Excel export failed. Please try again.'); }
    finally { setExporting(false); }
  }
  const report = state.data;
  const ready = report && !state.loading && !state.error;
  const services = ready ? groupMonthlyRevenue(report) : [];
  return <main className="dashboard monthly-revenue-page">
    <section className="welcome history-banner">
      <div><h1><Icon name="dashboard" size={27} />Monthly Revenue Report</h1><p>View monthly charging counts by date and service.</p></div>
      <button className="export-history" onClick={download} disabled={!ready || !report.rows.length || exporting}>{exporting ? 'Exporting…' : '↓ Export to Excel'}</button>
    </section>
    <section className="card revenue-filter">
      <label htmlFor="report-month">Report Month</label>
      <input id="report-month" type="month" value={month || report?.month || ''} onChange={event => setMonth(event.target.value)} />
    </section>
    {state.error && <p className="notice" role="alert">{state.error}</p>}
    {exportError && <p className="notice" role="alert">{exportError}</p>}
    {state.loading && <p role="status">Loading monthly report…</p>}
    {ready && <>
      <section className="validation-stats revenue-stats" aria-label="Monthly totals">
        <div><strong>{report.totalCount.toLocaleString()}</strong><span>Total Count</span></div>
        <div><strong>{report.serviceCount.toLocaleString()}</strong><span>Services</span></div>
        <div><strong>{report.rows.length.toLocaleString()}</strong><span>Records</span></div>
      </section>
      {services.map(service => <section className="card" key={service.id}>
        <h2><Icon name="database" /> {service.title}</h2>
        <p className="hint">{report.month} · Date-wise counts. — means no record for that date.</p>
        <div className="table-scroll"><table className="records revenue-table">
          <thead><tr><th scope="col">Date</th><th scope="col">Count</th></tr></thead>
          <tbody>{service.rows.map(row => <tr key={row.date}>
            <td>{row.date}</td>
            <td>{row.count === null ? '—' : row.count.toLocaleString()}</td>
          </tr>)}</tbody>
          <tfoot><tr><th scope="row">Monthly Total</th><td><strong>{service.total.toLocaleString()}</strong></td></tr></tfoot>
        </table></div>
      </section>)}
    </>}
  </main>;
}
