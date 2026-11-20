import React, { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon';
import SearchUser from '../components/SearchUser';
import ActivationTimeline from '../components/history/ActivationTimeline';
import HistoryTable from '../components/history/HistoryTable';
import { fetchActivationHistory, historySections } from '../services/activationHistory';
import { exportHistory } from '../utils/exportHistory';

export default function ActivationHistory() {
  const [state, setState] = useState({ phone: '', data: null, loading: false, error: '' });
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);

  async function search(phone) {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setExportError('');
    setState({ phone, data: null, loading: true, error: '' });
    try {
      const data = await fetchActivationHistory(phone, controller.signal);
      if (!controller.signal.aborted) setState({ phone, data, loading: false, error: '' });
    } catch (error) {
      if (!controller.signal.aborted) setState({ phone, data: null, loading: false, error: error.message });
    }
  }

  async function download() {
    setExporting(true);
    setExportError('');
    try { await exportHistory(state.phone, state.data); }
    catch { setExportError('Excel export failed. Please try again.'); }
    finally { setExporting(false); }
  }

  return (
    <main className="dashboard activation-history-page">
      <section className="welcome history-banner">
        <div><h1><Icon name="history" size={27} />Activation History &amp; Mode</h1>
          <p>Track Deikhlo service activations and their source of activation.</p></div>
        <button className="export-history" disabled={!state.data || state.loading || exporting} onClick={download}>
          {exporting ? 'Exporting…' : '↓ Export to Excel'}
        </button>
      </section>
      <SearchUser title="Search Subscriber" onSearch={search} loading={state.loading} />
      {state.phone && <>
        <p className="history-subscriber">History for +{state.phone}</p>
        {state.error && <p className="notice" role="alert">{state.error}</p>}
        {exportError && <p className="notice" role="alert">{exportError}</p>}
        <ActivationTimeline rows={state.data?.activations ?? []} loading={state.loading} error={state.error} />
        {historySections.filter(section => section.key !== 'sms').map(section => <HistoryTable key={section.key} section={section} rows={state.data?.[section.key] ?? []} loading={state.loading} error={state.error} />)}
        {/* SMS Logs temporarily hidden. Uncomment to display again.
        <HistoryTable section={historySections.find(section => section.key === 'sms')} rows={state.data?.sms ?? []} loading={state.loading} error={state.error} />
        */}
      </>}
    </main>
  );
}


