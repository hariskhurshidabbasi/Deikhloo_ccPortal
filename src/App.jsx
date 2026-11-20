import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Deactivations from './pages/Deactivations';
import ActivationHistory from './pages/ActivationHistory';
import Blacklist from './pages/Blacklist';
import MonthlyRevenueReport from './pages/MonthlyRevenueReport';
import PlanRevenueReport from './pages/PlanRevenueReport';
import CampaignReport from './pages/CampaignReport';
import AdminUsers from './pages/AdminUsers';
import WorkspaceLoading from './components/WorkspaceLoading';
export default function App() {
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/session', { signal: controller.signal, cache: 'no-store' }).then(async response => {
      if (response.status === 401) { location.assign('/login'); return; }
      if (!response.ok) throw new Error('Unable to load your session. Please refresh.');
      setSession(await response.json());
    }).catch(error => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, []);
  if (!session) return <WorkspaceLoading error={error} onRetry={() => location.reload()} />;
  const path = location.pathname;
  let page = <Dashboard />;
  if (path === '/deactivations') page = <Deactivations />;
  if (path === '/activation-history') page = <ActivationHistory />;
  if (path === '/blacklist') page = <Blacklist />;
  if (path === '/monthly-revenue') page = <MonthlyRevenueReport />;
  if (path === '/reports/plan-revenue') page = <PlanRevenueReport />;
  if (path === '/reports/campaign-reports') page = <CampaignReport />;
  if (path === '/admin-users') page = <AdminUsers session={session} />;
  return <><Header session={session} /><div className="layout"><Sidebar role={session.role} />{page}</div></>;
}

