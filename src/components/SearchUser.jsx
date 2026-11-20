import React, { useState } from 'react';
import Icon from './Icon';
import { formatPhoneInput, normalizePhone } from '../utils/phone';
export default function SearchUser({ onSearch, loading, title = 'Search User' }) {
  const [number, setNumber] = useState('');
  const [error, setError] = useState('');
  function submit(event) {
    event.preventDefault();
    try {
      const phone = normalizePhone(number);
      setError('');
      setNumber(phone.slice(2));
      onSearch(phone);
    } catch (error) {
      setError(error.message);
    }
  }
  return (
    <section className="card">
      <h2>
        <Icon name="search" /> {title}
      </h2>
      <form onSubmit={submit}>
        <label htmlFor="phone">
          <Icon name="phone" size={15} /> Phone Number{' '}
          <span className="required">*</span>
        </label>
        <div className="search-row">
          <div className="phone-input">
            <span>+92</span>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              pattern="3[0-9]{9}"
              minLength={10}
              autoComplete="tel"
              placeholder="3001234567"
              value={number}
              onChange={(event) => {
                setNumber(formatPhoneInput(event.target.value));
                setError('');
              }}
              aria-describedby="phone-help"
              required
            />
          </div>
          <button className="search-button" disabled={loading}>
            <Icon name="search" />
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
        <p id="phone-help" className="hint">
          Enter 10 digits (without 92 prefix)
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}

