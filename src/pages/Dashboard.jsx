import React, { useRef, useState, useEffect } from 'react';
import SearchUser from '../components/SearchUser';
import UserDetails from '../components/UserDetails';
import { findSubscriber } from '../services/subscribers';
export default function Dashboard() {
  const [state, setState] = useState({ user: null, loading: false });
  const [hasSearched, setHasSearched] = useState(false);
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  async function search(phone) {
    setHasSearched(true);
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setState({ user: null, loading: true });
    try {
      const user = await findSubscriber(phone, controller.signal);
      if (!controller.signal.aborted) setState({ user, loading: false, message: user ? '' : 'No subscriber found for +' + phone + '.' });
    } catch (error) {
      if (!controller.signal.aborted) setState({ user: null, loading: false, error: error.message });
    }
  }
  return <main className="dashboard"><section className="welcome"><h1>Welcome, admin!</h1><p>Manage your Deikhlo mobile subscriptions from here.</p></section><SearchUser onSearch={search} loading={state.loading} />{hasSearched && <UserDetails {...state} />}</main>;
}

