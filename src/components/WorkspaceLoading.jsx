import React from 'react';
import logo from '../assets/header-logo.png';
import logoIcon from '../assets/logo-icon-only.png';

const pageNames = {
  '/': 'Dashboard', '/dashboard': 'Dashboard', '/deactivations': 'Deactivations',
  '/activation-history': 'Activation History', '/blacklist': 'Blacklist',
  '/monthly-revenue': 'Monthly Report', '/admin-users': 'Admin Users',
  '/reports/plan-revenue': 'Plan & Revenue Report', '/reports/campaign-reports': 'Campaign Reports',
};

export default function WorkspaceLoading({ error, onRetry }) {
  const page = pageNames[location.pathname] || 'Deikhlo Portal';
  return <main className="workspace-loading">
    <div className="workspace-loading-brand"><img src={logo} alt="Deikhlo" /><span>CC PORTAL</span></div>
    <section className={'workspace-loading-content' + (error ? ' has-error' : '')} role={error ? 'alert' : 'status'} aria-live="polite" aria-busy={!error}>
      <div className="workspace-loading-emblem"><span className="workspace-loading-orbit" aria-hidden="true" /><img src={logoIcon} alt="" /></div>
      <p className="workspace-loading-eyebrow">{error ? 'CONNECTION INTERRUPTED' : 'JUST A MOMENT'}</p>
      <h1>{error ? 'Let’s try that again' : `Opening ${page}`}</h1>
      <p className="workspace-loading-description">{error || 'Getting everything ready for you.'}</p>
      {error ? <button type="button" onClick={onRetry}>Try again <span aria-hidden="true">↻</span></button> : <div className="workspace-loading-track" aria-hidden="true"><span /></div>}
    </section>
    <p className="workspace-loading-footer">DEIKHLO <span>•</span> CUSTOMER CARE PORTAL</p>
  </main>;
}
