import React from 'react';
export default function ReasonSelect({ value, onChange, disabled }) {
  return <label className="stacked-label">Deactivation Reason *<select required value={value} disabled={disabled} onChange={event => onChange(event.target.value)}><option value="">-- Select a reason --</option><option>Customer Request</option><option>Unsubscribe via SMS</option><option>Other</option></select></label>;
}
