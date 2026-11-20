export const historySections = [
  {
    key: 'cidHistory', title: 'CMS User Details', icon: 'user',
    columns: [
      ['id', 'ID'], ['phone', 'PHONE'], ['cid', 'CID'], ['dateTime', 'DATE & TIME'],
      ['source', 'SOURCE ID'], ['transactionId', 'TX ID'], ['responseCode', 'RESPONSE CODE'],
      ['publisherId', 'PUBLISHER ID'], ['planId', 'PLAN ID'],
    ],
  },
  {
    key: 'charging', title: 'Charging Logs', icon: 'database',
    columns: [
      ['id', 'ID'], ['phone', 'PHONE'], ['logDate', 'LOG DATE'],
      ['serviceId', 'SERVICE ID'], ['status', 'STATUS'], ['channel', 'CHANNEL'],
      ['subscriptionTime', 'SUBSCRIPTION TIME'], ['renewalTime', 'RENEWAL TIME'],
      ['createdAt', 'CREATED AT'],
    ],
  },
  {
    key: 'otp', title: 'OTP History', icon: 'lock',
    columns: [
      ['phone', 'PHONE'], ['otp', 'OTP'], ['date', 'DATE'], ['attempt', 'ATTEMPT'],
      ['createdAt', 'CREATED AT'], ['id', 'ID'], ['updatedAt', 'UPDATED AT'],
    ],
  },
  {
    key: 'sms', title: 'SMS Logs', icon: 'message',
    columns: [
      ['id', 'LOG ID'], ['dateTime', 'DATE & TIME'], ['type', 'TYPE'],
      ['status', 'STATUS'], ['target', 'TARGET'], ['initiator', 'INITIATOR'], ['data', 'DATA'],
    ],
  },
];

export function displayValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

export async function fetchActivationHistory(phone, signal) {
  const response = await fetch('/api/activation-history/' + encodeURIComponent(phone), { signal });
  if (!response.ok) {
    throw new Error(response.status === 503
      ? 'History lookup failed. Check MySQL and try again.'
      : 'Unable to load history. Please search again.');
  }
  const data = await response.json();
  for (const key of ['activations', 'cidHistory', 'charging', 'otp', 'sms']) {
    if (!Array.isArray(data[key])) throw new Error('The history response is incomplete. Please try again.');
  }
  return data;
}

