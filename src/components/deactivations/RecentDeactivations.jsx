import React, { useEffect, useState } from 'react';
import Icon from '../Icon';
import { getRecentDeactivations } from '../../services/deactivations';
export default function RecentDeactivations({ revision }) {
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState('Loading recent deactivations…');
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setMessage('Loading recent deactivations…');
    setLoading(true);
    getRecentDeactivations(controller.signal).then(data => {
      if (controller.signal.aborted) return;
      setRows(data);
      setUpdatedAt(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date()));
      setMessage(data.length ? '' : 'No recent deactivations.');
    }).catch(error => { if (!controller.signal.aborted) setMessage(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision, refresh]);
  return <section className="card" aria-busy={loading}>
    <div className="recent-history-heading">
      <h2><Icon name="history" /> Recent Deactivations</h2>
      <button type="button" disabled={loading} onClick={() => { setLoading(true); setRefresh(value => value + 1); }}>
        {loading ? 'Refreshing…' : 'Refresh'}
      </button>
    </div>
    <p className="hint" role="status">{loading ? 'Loading latest deactivations…' : message || (updatedAt ? 'Last refreshed: ' + updatedAt + ' (Pakistan time)' : '')}</p>
    <div className="table-scroll"><table className="records">
      <thead><tr><th>PHONE</th><th>REASON</th><th>DATE</th></tr></thead>
      <tbody>{rows.map(row => <tr key={row.id}><td>{row.phone}</td><td><span className="reason-badge">{row.reason}</span></td><td>{row.date}</td></tr>)}</tbody>
    </table></div>
  </section>;
}

