import React from 'react';
import Icon from '../Icon';
export default function ReportEmptyState({ campaign = false }) {
  return <section className="report-empty"><span className="report-empty-icon"><Icon name="dashboard" size={30} /></span><h2>No report generated yet</h2><p>{campaign ? 'Select a campaign (optional), choose a date range, and click Generate Report.' : 'Choose a date range and click Generate Report.'}</p></section>;
}
