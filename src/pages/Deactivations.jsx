import React, { useState } from 'react';
import Icon from '../components/Icon';
import QuickDeactivation from '../components/deactivations/QuickDeactivation';
import BulkDeactivation from '../components/deactivations/BulkDeactivation';
import RecentDeactivations from '../components/deactivations/RecentDeactivations';
export default function Deactivations() {
  const [tab, setTab] = useState('quick');
  const [revision, setRevision] = useState(0);
  const completed = () => setRevision(value => value + 1);
  return <main className="dashboard"><section className="welcome deactivation-banner"><h1><Icon name="deactivation" size={28} /> Deactivation Panel</h1><p>Quickly deactivate Deikhlo subscriptions with reasons and history tracking.</p></section><div className="deactivation-tabs" role="tablist" aria-label="Deactivation method"><button role="tab" aria-selected={tab === 'quick'} onClick={() => setTab('quick')}><Icon name="user" /> Quick Deactivation</button><button role="tab" aria-selected={tab === 'bulk'} onClick={() => setTab('bulk')}><Icon name="database" /> Bulk Upload</button></div><div role="tabpanel">{tab === 'quick' ? <QuickDeactivation onComplete={completed} /> : <BulkDeactivation onComplete={completed} />}</div>{tab === 'quick' && <RecentDeactivations revision={revision} />}</main>;
}

