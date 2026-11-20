import { validateDeactivation, deactivateUsers } from './deactivationRepository.js';
import { previewSubscribers } from './bulkPreviewRepository.js';
import { validateBlacklist, getBlacklistStatus, setBlacklistStatus } from './blacklistRepository.js';
import { normalizePhone } from '../src/utils/phone.js';
import { getMonthlyRevenue } from './monthlyRevenueRepository.js';
import { getPlanRevenue } from './planRevenueRepository.js';
import { getCampaignOptions, getCampaignReport } from './campaignReportRepository.js';
import { listAdminUsers, changeAdminUser } from './adminUsersRepository.js';
import { getSubscriber, getHistory, getRecentDeactivations } from './subscriberRepository.js';
const json = (value, status = 200) => new Response(JSON.stringify(value), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});
export async function handleApi(request, session) {
  const path = new URL(request.url).pathname;
  try {
    if (path === '/api/admin-users') {
      if (session?.role !== 'admin') return json({ error: 'Admin access required.' }, 403);
      if (request.method === 'GET') return json(await listAdminUsers());
      if (!['POST', 'PATCH', 'DELETE'].includes(request.method)) return json({ error: 'Method not allowed.' }, 405);
      const reader = request.body?.getReader();
      let text = '', size = 0;
      const decoder = new TextDecoder();
      if (reader) while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 8192) { await reader.cancel(); return json({ error: 'Request too large.' }, 413); }
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();
      let body;
      try { body = JSON.parse(text); } catch { return json({ error: 'Invalid JSON request.' }, 400); }
      return json(await changeAdminUser({ POST: 'create', PATCH: 'update', DELETE: 'delete' }[request.method], body, session));
    }
    if (request.method === 'POST' && path === '/api/deactivations/preview') {
      let body;
      try { body = await request.json(); }
      catch { return json({ error: 'Invalid JSON request.' }, 400); }
      return json(await previewSubscribers(body));
    }
    if (request.method === 'POST' && path === '/api/blacklist') {
      let body;
      try { body = await request.json(); }
      catch { return json({ error: 'Invalid JSON request.' }, 400); }
      return json(await setBlacklistStatus(validateBlacklist(body)));
    }
    if (request.method === 'POST' && path === '/api/deactivations') {
      let body;
      try { body = await request.json(); }
      catch { return json({ error: 'Invalid JSON request.' }, 400); }
      return json(await deactivateUsers(validateDeactivation(body)));
    }
    if (request.method !== 'GET') return json({ error: 'Method not allowed.' }, 405);
    if (path === '/api/reports/campaigns') return json(await getCampaignOptions());
    if (path === '/api/reports/campaign-report') {
      const params = new URL(request.url).searchParams;
      return json(await getCampaignReport(params.get('start'), params.get('end'), params.get('campaign') || 'all'));
    }
    if (path === '/api/reports/plan-revenue') {
      const params = new URL(request.url).searchParams;
      return json(await getPlanRevenue(params.get('start'), params.get('end')));
    }
    if (path === '/api/monthly-revenue') return json(await getMonthlyRevenue(new URL(request.url).searchParams.get('month')));
    if (path === '/api/deactivations') return json(await getRecentDeactivations());
    const match = path.match(/^\/api\/(subscribers|activation-history|blacklist)\/([^/]+)$/);
    if (!match) return json({ error: 'Not found.' }, 404);
    let phone;
    try { phone = normalizePhone(decodeURIComponent(match[2])); }
    catch { return json({ error: 'Invalid phone number.' }, 400); }
    if (match[1] === 'blacklist') return json(await getBlacklistStatus(phone));
    if (match[1] === 'activation-history') return json(await getHistory(phone));
    const user = await getSubscriber(phone);
    return user ? json(user) : json({ error: 'Subscriber not found.' }, 404);
  } catch (error) {
    if (error.status) return json({ error: error.message }, error.status);
    console.error('Database request failed:', error.code || 'DATABASE_ERROR');
    return json({ error: 'Database request failed. Check MySQL and try again.' }, 503);
  }
}

