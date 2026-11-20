import React from 'react';
import Icon from './Icon';
import logo from '../assets/header-logo.png';
export default function Header({ session }) {
  return <header className="header"><a className="brand" href={session.role === 'reports' ? '/reports/plan-revenue' : '/'}><img className="brand-logo" src={logo} alt="Deikhlo" /><span className="portal-label">{session.role === 'reports' ? 'Reports' : 'CC Portal'}</span></a><div className="account"><span><Icon name="user" /> {session.username}</span><form method="post" action="/logout"><button><Icon name="logout" /> Logout</button></form></div></header>;
}

