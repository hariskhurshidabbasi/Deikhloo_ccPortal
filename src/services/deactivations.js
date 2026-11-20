export async function getRecentDeactivations(signal) {
  const response = await fetch('/api/deactivations', { signal, cache: 'no-store' });
  if (response.status === 401) throw new Error('Session expired. Please sign in again.');
  if (!response.ok) throw new Error('Recent deactivations could not be loaded. Check MySQL and try again.');
  return response.json();
}
export async function deactivateSubscribers(phones, reason) {
  const response = await fetch('/api/deactivations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phones, reason, service: 'deikhlo' }),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || 'Deactivation failed. Please try again.');
  }
  return response.json();
}



export async function previewSubscribers(phones, signal) {
  const response = await fetch('/api/deactivations/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phones }),
    signal,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Status preview failed. Please try again.');
  return data;
}
