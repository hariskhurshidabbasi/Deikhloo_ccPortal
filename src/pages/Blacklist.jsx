import React, { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon';
import SearchUser from '../components/SearchUser';
import BlacklistDetails from '../components/BlacklistDetails';
import { findBlacklistStatus, updateBlacklist } from '../services/blacklist';

export default function Blacklist() {
  const [record, setRecord] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [formKey, setFormKey] = useState(0);
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);

  async function search(phone) {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setRecord(null);
    setMessage('');
    try {
      const result = await findBlacklistStatus(phone, controller.signal);
      if (!controller.signal.aborted) setRecord(result);
    } catch (error) {
      if (!controller.signal.aborted) setMessage(error.message);
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  async function update(blacklisted) {
    setBusy(true);
    setMessage('');
    try {
      const result = await updateBlacklist(record.phone, blacklisted);
      setRecord((current) => ({ ...current, blacklisted: result.blacklisted, registered: result.blacklisted || current.registered }));
      setMessage(
        result.blacklisted
          ? 'Number added to the local Deikhlo blacklist.'
          : 'Number removed from the local Deikhlo blacklist.',
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  function clear() {
    request.current?.abort();
    setRecord(null);
    setMessage('');
    setFormKey((key) => key + 1);
  }

  return (
    <main className="dashboard">
      <section className="welcome history-banner">
        <div>
          <h1>
            <Icon name="deactivation" size={28} /> Blacklist Management
          </h1>
          <p>Manage blocked numbers for Deikhlo.</p>
        </div>
      </section>
      <SearchUser
        key={formKey}
        title="Search Number"
        onSearch={search}
        loading={busy}
      />
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      {record && (
        <BlacklistDetails
          record={record}
          busy={busy}
          onUpdate={update}
          onClear={clear}
        />
      )}
      {/* <section className="card">
        <h2><Icon name="lock" /> About Blacklisting</h2>
        <p className="hint blacklist-help">Blacklisting marks a number as blocked in the local database. Signup, charging and activation services must check this list to enforce the block.</p>
        <p className="hint blacklist-help">Subscription status is managed separately under Deactivations. Removing a number from the blacklist clears its blocked flag.</p>
      </section> */}
    </main>
  );
}

