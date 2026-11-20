import React, { useEffect, useRef, useState } from 'react';
import Icon from '../Icon';
import ReasonSelect from './ReasonSelect';
import BulkFilePreview from './BulkFilePreview';
import { readPhoneFile } from '../../utils/phoneFile';
import { downloadBulkReport } from '../../utils/bulkReport';
import { deactivateSubscribers, previewSubscribers } from '../../services/deactivations';

const batchSize = 500;

export default function BulkDeactivation({ onComplete }) {
  const input = useRef(null);
  const downloadArea = useRef(null);
  const controller = useRef(null);
  const mounted = useRef(true);
  const [rows, setRows] = useState([]);
  const [file, setFile] = useState(null);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [phase, setPhase] = useState('');
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState({});
  const [previewReady, setPreviewReady] = useState(false);
  const [results, setResults] = useState({});
  const [processed, setProcessed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const valid = rows.filter(row => row.status === 'Valid');
  const eligible = valid.filter(row => preview[row.phone]?.status === 'Active');
  const busy = ['reading', 'preview', 'processing'].includes(phase);

  function scrollToDownload() {
    downloadArea.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'center',
    });
  }

  useEffect(() => {
    if (['preview', 'ready', 'processing', 'complete', 'stopped'].includes(phase)) scrollToDownload();
  }, [phase]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; controller.current?.abort(); };
  }, []);

  async function select(selected) {
    if (!selected || busy) return;
    setRows([]); setFile(null); setMessage(''); setPhase('reading');
    setPreview({}); setPreviewReady(false); setResults({}); setProcessed(false); setProgress(0);
    try {
      const parsed = await readPhoneFile(selected);
      if (!mounted.current) return;
      setRows(parsed); setFile({ name: selected.name, size: selected.size });
    } catch (error) {
      if (mounted.current) setMessage(error.message);
    } finally {
      if (mounted.current) setPhase('');
      if (input.current) input.current.value = '';
    }
  }

  async function generatePreview() {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setPhase('preview'); setMessage(''); setProgress(0);
    setPreviewReady(false); setPreview({}); setResults({}); setProcessed(false);
    const details = {};
    try {
      for (let offset = 0; offset < valid.length; offset += batchSize) {
        const batch = valid.slice(offset, offset + batchSize);
        const data = await previewSubscribers(batch.map(row => row.phone), current.signal);
        for (const record of data) details[record.phone] = record;
        if (!mounted.current || current.signal.aborted) return;
        setProgress(Math.round(Math.min(offset + batchSize, valid.length) / valid.length * 100));
      }
      setPreview(details); setPreviewReady(true);
      setPhase('ready');
      return details;
    } catch (error) {
      if (!current.signal.aborted && mounted.current) {
        setMessage(error.message); setPhase('');
      }
    }
  }

  async function process(event) {
    event.preventDefault();
    if (!valid.length || busy || processed) return;
    if (!reason) {
      setMessage('Select a deactivation reason first.');
      return;
    }
    scrollToDownload();
    const checked = previewReady ? preview : await generatePreview();
    if (!checked || !mounted.current) return;
    const targets = valid.filter(row => checked[row.phone]?.status === 'Active');
    if (!targets.length) {
      setMessage('No active subscribers found in this file. Download the status preview to check each number.');
      return;
    }
    setPhase('processing'); setMessage(''); setProgress(0);
    const outcome = {};
    const details = { ...checked };
    for (const row of valid) {
      outcome[row.phone] = checked[row.phone]?.status === 'Active'
        ? 'Not processed' : 'Skipped: ' + checked[row.phone]?.status;
    }
    let changed = 0;
    let failed = false;
    try {
      for (let offset = 0; offset < targets.length; offset += batchSize) {
        if (!mounted.current) break;
        const batch = targets.slice(offset, offset + batchSize);
        try {
          const response = await deactivateSubscribers(batch.map(row => row.phone), reason);
          for (const record of response.results) {
            outcome[record.phone] = record.result;
            details[record.phone] = { ...details[record.phone], status: 'Inactive', databaseStatus: 0 };
            if (record.date) {
              details[record.phone].deactivatedAt = record.date;
              details[record.phone].reason = reason;
            }
          }
          changed += response.changed;
          if (!mounted.current) break;
          setResults({ ...outcome });
          setProgress(Math.round(Math.min(offset + batchSize, targets.length) / targets.length * 100));
        } catch (error) {
          for (const row of batch) outcome[row.phone] = 'Check status before retry: ' + error.message;
          throw error;
        }
      }
      if (mounted.current) setMessage(changed + ' numbers deactivated. Download the results report for each row.');
    } catch (error) {
      failed = true;
      if (mounted.current) setMessage(changed + ' confirmed deactivations. Processing stopped: ' + error.message + ' Download the report and refresh the status preview before retrying.');
    } finally {
      if (mounted.current) {
        setResults(outcome); setPreview(details); setProcessed(true); setPhase(failed ? 'stopped' : 'complete');
        onComplete();
      }
    }
  }

  async function download() {
    setDownloading(true);
    try {
      await downloadBulkReport(rows, preview, results,
        processed ? 'deikhlo-deactivation-results.xlsx' : 'deikhlo-status-preview.xlsx', processed);
    } catch {
      setMessage('Download failed. Please try again.');
    } finally { setDownloading(false); }
  }

  return (
    <section className="card bulk-upload-card">
      <h2><Icon name="database" /> Bulk Deactivation Upload</h2>
      <p className="info-banner">Upload a CSV or XLSX file with phone numbers (max 5 MB). Preview subscriber status before deactivation.</p>
      <form onSubmit={process}>
        <button type="button" className="upload-zone" disabled={busy}
          onClick={() => input.current.click()}
          onDragOver={event => event.preventDefault()}
          onDrop={event => { event.preventDefault(); select(event.dataTransfer.files[0]); }}>
          <span className="upload-arrow">↥</span>
          <strong>{phase === 'reading' ? 'Reading your file…' : 'Drag and drop your file here'}</strong>
          <small>or click to browse (CSV, XLSX · max 5 MB)</small>
        </button>
        <input hidden ref={input} type="file" accept=".csv,.xlsx" onChange={event => select(event.target.files[0])} />
        {file && <BulkFilePreview key={file.name + file.size} rows={rows} file={file} preview={preview} results={results} />}
        <ReasonSelect value={reason} onChange={setReason} disabled={busy} />
        <label className="stacked-label">Deactivate From<div className="service-choice"><Icon name="database" /> Deikhlo</div></label>
        <section className="status-preview-controls">
          <h3>Status Preview Sheet</h3>
          <p className="hint">Check current subscription status and download the report before processing.</p>
          <button type="button" className="bulk-preview-button full-width" disabled={busy || !valid.length} onClick={generatePreview}>
            <Icon name="database" /> {phase === 'preview' ? 'Building status preview…' : 'Preview Deikhlo Status'}
          </button>
          <div ref={downloadArea}>
          {(phase === 'preview' || phase === 'processing' || previewReady) && <div className="bulk-progress">
            <progress value={progress} max="100" aria-label={phase === 'processing' ? 'Deactivation progress' : 'Preview progress'} />
            <span aria-live="polite">{progress}% · {phase === 'processing' ? 'Processing deactivations' : phase === 'preview' ? 'Checking subscriber status' : phase === 'stopped' ? 'Stopped before completion' : 'Completed'}</span>
          </div>}
          {previewReady && <div className="preview-success" role="status">
            <strong>{processed ? 'Deikhlo deactivation results ready' : 'Deikhlo status preview ready'}</strong>
            {!processed && <p>{eligible.length.toLocaleString()} active numbers eligible for deactivation.</p>}
            <button type="button" className="download-report" disabled={busy || downloading} onClick={download}>{downloading ? 'Preparing download…' : processed ? '↓ Download Deactivation Results Excel' : '↓ Download Deikhlo Status Preview Excel'}</button>
          </div>}
          </div>
        </section>
        {message && <p className="notice" role="status">{message}</p>}
        <div className="bulk-actions">
          <button type="button" className="bulk-choose-button" disabled={busy} onClick={() => input.current.click()}><span aria-hidden="true">↥</span> Choose File</button>
          <button className="danger-button" disabled={busy || !valid.length || processed}>
            {phase === 'processing' ? 'Processing…' : 'Process Deactivation'}
          </button>
        </div>
      </form>
    </section>
  );
}

