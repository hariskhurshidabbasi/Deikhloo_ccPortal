import React from 'react';
export default function Icon({ name, size = 18 }) {
  const paths = {
    lock: 'M5 10h14v12H5z M8 10V6a4 4 0 0 1 8 0v4 M12 15v3',
    message: 'M3 3h18v14H9l-6 4z M7 7h10M7 11h7',
    phone: 'M8 2h8v20H8z M11 18h2',
    menu: 'M4 6h16M4 12h16M4 18h16',
    dashboard: 'M4 3v17h17M7 14l4-5 4 3 5-7',
    deactivation: 'M5 5l14 14 M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20',
    history: 'M3 4v5h5 M3 9a9 9 0 1 1 1 9 M12 7v5l3 2',
    search: 'M21 21l-6-6 M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16',
    user: 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M4 21v-3a8 6 0 0 1 16 0v3',
    logout: 'M10 3H4v18h6 M9 12h12m-5-5 5 5-5 5',
    database: 'M3 6c0-5 18-5 18 0s-18 5-18 0v12c0 5 18 5 18 0V6 M3 12c0 5 18 5 18 0',
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}

