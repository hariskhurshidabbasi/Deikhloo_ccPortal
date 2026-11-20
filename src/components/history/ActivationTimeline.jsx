import React from 'react';
import Icon from '../Icon';
import { displayValue } from '../../services/activationHistory';

export default function ActivationTimeline({ rows, loading, error }) {
  return (
    <section className="card history-card activation-history-timeline">
      <h2><Icon name="history" />Activation History Timeline</h2>
      {!rows.length && <p className="hint" role="status">{loading ? 'Loading…' : error ? 'Activation history unavailable.' : 'No activations found for this subscriber.'}</p>}
      <div className="activation-timeline">
        {rows.map((row, index) => (
          <article className="activation-event" key={row.id ?? index}>
            <div className="activation-event-heading"><strong>{row.status === 'Inactive' ? 'Deactivation' : 'Activation'}</strong><time>{displayValue(row.status === 'Inactive' ? row.deactivatedAt : row.dateTime)}</time></div>
            <span className="service-pill">Deikhlo</span>
            <p><strong>Plan</strong> <span className="history-pill">{displayValue(row.plan)}</span></p>
            <p><strong>Activation Source</strong> <span className="history-pill">{displayValue(row.source)}</span></p>
            <p><strong>Status</strong> <span>{displayValue(row.status)}</span></p>
            {row.status === 'Inactive' && <>
              <p><strong>Reason</strong> <span>{displayValue(row.reason)}</span></p>
              <p><strong>Deactivation Date</strong> <span>{displayValue(row.deactivatedAt)}</span></p>
            </>}
          </article>
        ))}
      </div>
    </section>
  );
}

