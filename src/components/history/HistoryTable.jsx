import React from 'react';
import Icon from '../Icon';
import { displayValue } from '../../services/activationHistory';

export default function HistoryTable({ section, rows, loading, error }) {
  return (
    <section className={'card history-card history-' + section.key}>
      <h2><Icon name={section.icon} />{section.title}</h2>
      <div className="history-service"><Icon name="phone" size={14} /><span>Deikhlo</span></div>
      <div className="history-table-wrap">
        <table className="records history-table">
          <thead><tr>{section.columns.map(([key, label]) => <th key={key}>{label}</th>)}</tr></thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id ?? index}>
                {section.columns.map(([key]) => (
                  <td key={key}>
                    {['plan', 'type', 'status'].includes(key)
                      ? <span className={'history-pill ' + (key === 'status' ? 'status-pill' : '')}>{displayValue(row[key])}</span>
                      : displayValue(row[key])}
                  </td>
                ))}
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={section.columns.length} className="history-empty" role="status">
              {loading ? 'Loading…' : error ? 'Records unavailable.' : 'No records found for this subscriber.'}
            </td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
