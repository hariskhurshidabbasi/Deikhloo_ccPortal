import React from 'react';
import Icon from './Icon';
const items = [
  ['/dashboard', 'dashboard', 'Dashboard'],
  ['/deactivations', 'deactivation', 'Deactivations'],
  ['/activation-history', 'history', 'Activation History'],
  ['/blacklist', 'deactivation', 'Blacklist'],
  ['/monthly-revenue', 'dashboard', 'Monthly Report'],
  ['/admin-users', 'user', 'Admin Users'],
];
const reportItems = [
  ['/reports/plan-revenue', 'dashboard', 'Plan & Revenue Report'],
  ['/reports/campaign-reports', 'history', 'Campaign Reports'],
];
function MenuLinks({ links }) {
  return links.map(([path, icon, label]) => (
    <a key={path} className={'nav-item ' + (location.pathname === path ? 'active' : '')}
      href={path} aria-current={location.pathname === path ? 'page' : undefined}>
      <Icon name={icon} />{label}
    </a>
  ));
}
export default function Sidebar({ role }) {
  return (
    <aside className="sidebar">
      <div className="menu-label">
        <Icon name="menu" /> {role === 'reports' ? 'REPORTS' : 'MENU'}
      </div>
      <nav aria-label="Main menu">
        {role === 'admin' && <>
          <MenuLinks links={items} />
          <details className="sidebar-reports" open>
            <summary><Icon name="database" /><span>Reports</span><span className="reports-chevron" aria-hidden="true">›</span></summary>
            <div className="sidebar-report-links"><MenuLinks links={reportItems} /></div>
          </details>
        </>}
        {role === 'reports' && <MenuLinks links={reportItems} />}
      </nav>
    </aside>
  );
}
