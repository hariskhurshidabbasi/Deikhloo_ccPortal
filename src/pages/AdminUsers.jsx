import React, { useEffect, useRef, useState } from 'react';
import AdminUserForm from '../components/AdminUserForm';
import Icon from '../components/Icon';

async function accountsRequest(method = 'GET', body, signal) {
  const response = await fetch('/api/admin-users', {
    method, signal, cache: 'no-store',
    ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
  });
  if (response.status === 401) { location.assign('/login'); throw new Error('Please sign in again.'); }
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Unable to update users.');
  return data;
}
export default function AdminUsers({ session }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState(null);
  const formArea = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    accountsRequest('GET', null, controller.signal).then(data => { if (!controller.signal.aborted) setUsers(data); })
      .catch(error => { if (!controller.signal.aborted) setError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  useEffect(() => { if (form) formArea.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [form]);
  function openForm(user = null) { setError(''); setMessage(''); setForm({ user }); }
  async function save(values) {
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await accountsRequest(form.user ? 'PATCH' : 'POST', values);
      if (result.signInAgain) { location.assign('/login'); return; }
      setForm(null);
      setMessage(form.user ? 'User updated. Their previous sessions have been signed out.' : 'User created. They can sign in on the same login page.');
      setUsers(await accountsRequest());
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  async function remove(user) {
    if (!window.confirm(`Delete user "${user.username}"? Their login and sessions will be removed.`)) return;
    setBusy(true); setError(''); setMessage('');
    try { await accountsRequest('DELETE', { username: user.username }); setUsers(await accountsRequest()); setMessage('User deleted.'); }
    catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  return <main className="dashboard admin-users-page">
    <div className="admin-users-heading"><div><h1>Admin Users</h1><p>Manage users and assign Admin or Reports access.</p></div><button className="danger-button" disabled={loading || busy} onClick={() => openForm()}><Icon name="user" /> Add User</button></div>
    {error && <p className="notice" role="alert">{error}</p>}
    {message && <p className="info-banner" role="status">{message}</p>}
    <div ref={formArea}>{form && <AdminUserForm key={form.user?.username || 'new'} user={form.user} currentUsername={session.username} busy={busy} onSave={save} onCancel={() => setForm(null)} />}</div>
    <section className="card"><div className="table-scroll"><table className="records admin-users-table">
      <thead><tr><th>Username</th><th>Role</th><th>Created</th><th>Actions</th></tr></thead>
      <tbody>{users.map(user => <tr key={user.username}><td>{user.username}{user.username === session.username && <small className="current-user-label"> (you)</small>}</td><td><span className={'account-role account-role-' + user.role}>{user.role === 'admin' ? 'Admin' : user.role === 'reports' ? 'Reports' : 'No role assigned'}</span></td><td>{user.createdAt || '—'}</td><td><div className="admin-table-actions"><button type="button" disabled={busy} onClick={() => openForm(user)}>Edit</button><button type="button" className="delete-user" disabled={busy || user.protected || user.username === session.username} onClick={() => remove(user)}>Delete</button></div></td></tr>)}</tbody>
    </table></div>{loading && <p role="status">Loading users…</p>}{!loading && !users.length && !error && <p>No users found.</p>}</section>
  </main>;
}
