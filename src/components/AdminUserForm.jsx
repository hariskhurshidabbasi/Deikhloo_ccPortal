import React, { useState } from 'react';

export default function AdminUserForm({ user, currentUsername, busy, onSave, onCancel }) {
  const editing = Boolean(user);
  const [username, setUsername] = useState(user?.username || '');
  const [role, setRole] = useState(user?.role || 'reports');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const fixedRole = editing && (username === 'admin' || username === currentUsername);
  return <form className="card admin-user-form" onSubmit={event => { event.preventDefault(); onSave({ username, role, password }); }}>
    <h2>{editing ? 'Edit User' : 'Add User'}</h2>
    <div className="admin-user-fields">
      <label>Username<input autoFocus={!editing} value={username} disabled={editing || busy} required minLength={3} maxLength={50} pattern="[A-Za-z0-9][A-Za-z0-9_.\-]{2,49}" autoComplete="off" onChange={event => setUsername(event.target.value)} /></label>
      <label>Role<select value={role} disabled={busy || fixedRole} onChange={event => setRole(event.target.value)}><option value="reports">Reports</option><option value="admin">Admin</option></select></label>
      <label>{editing ? 'New Password (optional)' : 'Password'}<div className="admin-password-input"><input type={visible ? 'text' : 'password'} value={password} required={!editing} minLength={10} maxLength={1024} autoComplete="new-password" disabled={busy} onChange={event => setPassword(event.target.value)} /><button type="button" onClick={() => setVisible(value => !value)} aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? 'Hide' : 'Show'}</button></div></label>
    </div>
    <p className="hint">{role === 'admin' ? 'Admin can access the whole portal and manage user roles.' : 'Reports can access Plan & Revenue and Campaign Reports only.'} {editing ? 'Leave password blank to keep the current password.' : 'Use at least 10 characters for the password.'}</p>
    <div className="admin-user-actions"><button className="danger-button" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save Changes' : 'Create User'}</button><button type="button" className="admin-cancel" disabled={busy} onClick={onCancel}>Cancel</button></div>
  </form>;
}
