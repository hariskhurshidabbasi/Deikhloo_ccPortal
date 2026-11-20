import React from 'react';
import Icon from './Icon';

export default function BlacklistDetails({ record, busy, onUpdate, onClear }) {
  return (
    <section className="card blacklist-details">
      <h2><Icon name="phone" /> Number Details</h2>
      <div className="subscription">
        <h3><Icon name="database" /> Deikhlo
          <span className={'badge ' + (record.blacklisted ? 'blacklist-badge' : 'active-status')}>
            {record.blacklisted ? 'Blacklisted' : 'Not blacklisted'}
          </span>
        </h3>
        <p>Phone +{record.phone}</p>
        <p>{record.registered ? 'Subscriber record found.' : record.blacklisted ? 'Blacklist record saved. This number has no subscriber record.' : 'No subscriber record. This number can still be added to the blacklist.'}</p>
      </div>
      <p className="hint blacklist-help">
        {record.blacklisted
          ? 'Removing clears the blacklist flag. The subscription stays inactive and the plan is not restored.'
          : 'Blacklisting sets the subscriber blacklist flag to 1, status to 0 (inactive), and plan ID to 0. Numbers without a subscription are saved in the blacklist.'}
      </p>
      <button className="danger-button full-width" disabled={busy} onClick={() => onUpdate(!record.blacklisted)}>
        <Icon name="deactivation" />
        {busy ? 'Saving…' : record.blacklisted ? 'Remove from Blacklist' : 'Blacklist Number'}
      </button>
      <button className="clear-button full-width" disabled={busy} onClick={onClear}>Clear</button>
    </section>
  );
}
