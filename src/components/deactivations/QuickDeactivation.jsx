import React, { useRef, useState, useEffect } from 'react';
import SearchUser from '../SearchUser';
import Icon from '../Icon';
import ReasonSelect from './ReasonSelect';
import { findSubscriber } from '../../services/subscribers';
import { deactivateSubscribers } from '../../services/deactivations';
export default function QuickDeactivation({ onComplete }) {
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [reason, setReason] = useState('');
  const [formKey, setFormKey] = useState(0);
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  function clear() {
    request.current?.abort();
    setUser(null); setMessage(''); setReason(''); setBusy(false);
    setFormKey(key => key + 1);
  }
  async function search(phone) {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true); setUser(null); setMessage(''); setReason('');
    try {
      const result = await findSubscriber(phone, controller.signal);
      if (!controller.signal.aborted) {
        setUser(result);
        if (!result) setMessage('No Deikhlo subscriber found for +' + phone + '.');
      }
    } catch (error) { if (!controller.signal.aborted) setMessage(error.message); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  }
  async function deactivate(event) {
    event.preventDefault();
    setBusy(true); setMessage('');
    try {
      await deactivateSubscribers([user.phone], reason);
      setUser({ ...user, status: 'Inactive' });
      setMessage('Subscriber marked inactive in the local Deikhlo database.');
      onComplete();
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  return <section className="card quick-panel"><h2><Icon name="deactivation" /> Quick Deactivation</h2><p className="info-banner">Enter the subscriber’s phone number to find their Deikhlo subscription.</p><SearchUser key={formKey} onSearch={search} loading={busy} />{message && <p role="status" className="notice">{message}</p>}{user && <form onSubmit={deactivate}><h3 className="subscriber-heading"><Icon name="user" /> User: {user.phone}</h3><div className="subscription"><h3><Icon name="database" /> Deikhlo <span className={'badge ' + (user.status === 'Active' ? 'active-status' : '')}>{user.status}</span></h3><p>Phone {user.phone}</p><p>Plan Name {user.plan ?? 'N/A'}</p><p>Created Date {user.createdAt ?? 'N/A'}</p><p>Inactive Since {user.deactivatedAt ?? (user.status === 'Active' ? 'Active' : 'N/A')}</p></div><ReasonSelect value={reason} onChange={setReason} disabled={busy} /><button className="danger-button full-width" disabled={busy || !reason || user.status !== 'Active'}><Icon name="deactivation" /> {busy ? 'Processing…' : 'Deactivate Deikhlo'}</button></form>}{(user || message || busy) && <button className="clear-button full-width" onClick={clear} disabled={busy && !!user}>× Clear</button>}</section>;
}

