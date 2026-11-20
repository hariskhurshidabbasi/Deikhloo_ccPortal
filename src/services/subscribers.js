export async function findSubscriber(phone, signal) {
  const response = await fetch('/api/subscribers/' + encodeURIComponent(phone), { signal });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(response.status === 503
    ? 'Database lookup failed. Check MySQL and try again.'
    : 'Unable to search right now. Please try again.');
  return response.json();
}

