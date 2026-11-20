import React from 'react';
import Icon from './Icon';
function Field({ label, children }) {
  return <div className="detail-field"><span>{label}</span><div>{children ?? 'N/A'}</div></div>;
}
function money(value) {
  return value == null ? 'N/A' : new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(value);
}
export default function UserDetails({ user, message, error, loading }) {
  return <section className="card"><h2><Icon name="user" /> User Details</h2>{user ? <>{/* Temporarily hidden: total balance summary.
<div className="balance-panel"><Field label="TOTAL BALANCE">{money(user.balance)}</Field></div>
*/}<div className="database-panel"><h3><Icon name="database" /> Deikhlo Database</h3><div className="detail-grid"><Field label="STATUS"><span className={'badge ' + (user.status === 'Active' ? 'active-status' : '')}>{user.status ?? 'N/A'}</span></Field><Field label="BLACKLIST"><span className={user.blacklisted ? "badge blacklist-badge" : "badge"}>{user.blacklisted ? "Blacklisted" : "Not blacklisted"}</span></Field><Field label="PHONE">{user.phone}</Field><Field label="PLAN">{user.plan}</Field><Field label="CREATED">{user.createdAt}</Field><Field label="SOURCE">{user.source}</Field><Field label="DEACTIVATION DATE">{user.deactivatedAt}</Field>{/* Temporarily hidden: total balance detail.
<Field label="TOTAL BALANCE">{money(user.balance)}</Field>
*/}</div></div></> : <div className={'empty-state ' + (error ? 'error-state' : '')} role="status"><Icon name={error ? 'database' : 'user'} size={32} /><strong>{loading ? 'Searching for user…' : error ? 'Unable to load user details' : 'Find a Deikhlo subscriber'}</strong><p>{loading ? 'Please wait.' : error || message || 'Search a mobile number above to view subscription and balance details.'}</p></div>}</section>;
}


