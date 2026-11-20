import React, { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon';
import ReportEmptyState from '../components/reports/ReportEmptyState';
import ReportLoading from '../components/reports/ReportLoading';
import { defaultReportRange } from '../utils/reportDates';
import { exportCampaignReport } from '../utils/exportCampaignReport';
import ReportPagination, { useReportPagination } from '../components/reports/ReportPagination';

const number = (value) => Number(value || 0).toLocaleString('en-PK');
function Counts({ users = 0, charged = 0, total = false }) {
  return (
    <>
      <span className={total ? 'campaign-total' : ''}>{number(users)}</span>
      <small className="campaign-charged">{number(charged)} charged</small>
    </>
  );
}
export default function CampaignReport() {
  const [filters, setFilters] = useState(() => ({
    ...defaultReportRange(),
    campaign: 'all',
  }));
  const [options, setOptions] = useState({
    campaigns: [],
    loading: true,
    error: '',
  });
  const [state, setState] = useState({ data: null, loading: false, error: '' });
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [retry, setRetry] = useState(0);
  const pending = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    setOptions((previous) => ({ ...previous, loading: true, error: '' }));
    fetch('/api/reports/campaigns', {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || 'Campaigns could not be loaded.');
        if (!controller.signal.aborted)
          setOptions({ campaigns: data.campaigns, loading: false, error: '' });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setOptions({ campaigns: [], loading: false, error: error.message });
      });
    return () => controller.abort();
  }, [retry]);
  useEffect(() => () => pending.current?.abort(), []);
  async function generate(event) {
    event.preventDefault();
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setState((previous) => ({ ...previous, loading: true, error: '' }));
    setExportError('');
    try {
      const response = await fetch(
        '/api/reports/campaign-report?' + new URLSearchParams(filters),
        { signal: controller.signal, cache: 'no-store' },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'Report could not be generated.');
      if (!controller.signal.aborted)
        setState({ data, loading: false, error: '' });
    } catch (error) {
      if (!controller.signal.aborted)
        setState({ data: null, loading: false, error: error.message });
    }
  }
  async function download() {
    setExporting(true);
    setExportError('');
    try {
      await exportCampaignReport(state.data);
    } catch {
      setExportError('Excel export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }
  const report = state.data;
  const pagination = useReportPagination(report?.rows);
  return (
    <main className="dashboard campaign-report">
      <section className="welcome">
        <h1>
          <Icon name="history" size={28} /> Campaigns Report
        </h1>
        <p>Deikhlo daily user acquisition and charged users by source.</p>
      </section>
      <form className="card report-date-filter" onSubmit={generate}>
        <label>
          Campaign
          <select
            value={filters.campaign}
            disabled={options.loading || state.loading}
            onChange={(event) =>
              setFilters({ ...filters, campaign: event.target.value })
            }
          >
            <option value="all">All campaigns</option>
            {options.campaigns.map((item) => (
              <option value={item.id} key={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Start Date
          <input
            type="date"
            required
            value={filters.start}
            max={filters.end || undefined}
            onChange={(event) =>
              setFilters({ ...filters, start: event.target.value })
            }
          />
        </label>
        <label>
          End Date
          <input
            type="date"
            required
            value={filters.end}
            min={filters.start || undefined}
            onChange={(event) =>
              setFilters({ ...filters, end: event.target.value })
            }
          />
        </label>
        <button
          className="danger-button"
          disabled={state.loading || Boolean(options.error)}
        >
          {state.loading ? 'Generating…' : 'Generate Report'}
        </button>
      </form>
      {options.loading && (
        <p className="hint" role="status">
          Loading campaign list from the database…
        </p>
      )}
      {options.error && (
        <p className="notice" role="alert">
          {options.error}{' '}
          <button type="button" onClick={() => setRetry((value) => value + 1)}>
            Retry
          </button>
        </p>
      )}
      {state.error && (
        <p className="notice" role="alert">
          {state.error}
        </p>
      )}
      {!report && <ReportEmptyState campaign />}
      {state.loading && <ReportLoading />}
      {report && (
        <>
          <section className="report-stat-grid">
            {[
              ['Total Users', number(report.totals.users)],
              ['Charged Users', number(report.totals.charged)],
              ['Conversion', report.totals.conversion.toFixed(1) + '%'],
              ['Days', number(report.totals.days)],
            ].map(([label, value]) => (
              <div className="card" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </section>
          <p className="hint">
            Charged counts require a recorded successful-charge date. Users with
            a blank date are not counted as confirmed charged.
          </p>
          <section className="card">
            <div className="report-table-heading">
              <h2>Users vs charged users by source</h2>
              <span>
                {report.selectedCampaign === 'all'
                  ? 'All campaigns'
                  : report.campaigns[0]?.label}{' '}
                · {report.start} to {report.end}
              </span>
            </div>
            <button
              className="bulk-preview-button"
              disabled={state.loading || exporting || !report.totals.users}
              onClick={download}
            >
              {exporting ? 'Exporting…' : '↓ Export Excel'}
            </button>
            {exportError && <p role="alert">{exportError}</p>}
            <div className="table-scroll report-table campaign-table">
              <table className="records">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    {report.campaigns.map((item) => (
                      <th scope="col" key={item.id}>
                        {item.label}
                      </th>
                    ))}
                    <th scope="col">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.rows.map((row) => (
                    <tr key={row.date}>
                      <th scope="row">{row.date}</th>
                      {report.campaigns.map((item) => (
                        <td key={item.id}>
                          <Counts {...row.campaigns[item.id]} />
                        </td>
                      ))}
                      <td>
                        <Counts users={row.users} charged={row.charged} total />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row">Total</th>
                    {report.campaigns.map((item) => (
                      <td key={item.id}>
                        <Counts {...report.campaignTotals[item.id]} />
                      </td>
                    ))}
                    <td>
                      <Counts {...report.totals} total />
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <ReportPagination pagination={pagination} disabled={state.loading} />
            {!report.totals.users && (
              <p className="hint">
                No users found for this campaign and date range.
              </p>
            )}
            {/* <details className="report-definition">
              <summary>How this report is counted</summary>
              <p>{report.definition}</p>
              <p>
                Campaigns are recorded source IDs, not proof of a currently
                running campaign. Snapshot:{' '}
                {new Date(report.generatedAt).toLocaleString('en-GB', {
                  timeZone: 'Asia/Karachi',
                })}{' '}
                (Pakistan time). Cached for up to 5 minutes.
              </p>
            </details> */}
          </section>
        </>
      )}
    </main>
  );
}
