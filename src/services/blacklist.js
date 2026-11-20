async function readResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Unable to update blacklist. Please try again.');
  return data;
}
export async function findBlacklistStatus(phone, signal) {
  return readResponse(await fetch('/api/blacklist/' + encodeURIComponent(phone), { signal }));
}
export async function updateBlacklist(phone, blacklisted) {
  return readResponse(await fetch('/api/blacklist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, blacklisted }),
  }));
}
