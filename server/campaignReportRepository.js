import { database } from './database.js';
import { cachedCampaignOptions } from './campaignOptionsCache.js';

const cacheDuration = 5 * 60 * 1000;
let cached;
let pending;
export const campaignDefinition =
  'Users are grouped by creation_date and source_id. Charged users have a recorded last_success_charge on or after their creation date, regardless of the selected charging period. Counts reflect user records, not deduplicated phone variants.';

// The existing schema has no source/creation-date index. Aggregate once and reuse
// the same snapshot for the dropdown and filters; never create database indexes.
export async function getCampaignSnapshot() {
  if (cached && Date.now() - cached.savedAt < cacheDuration) return cached;
  if (!pending)
    pending = (async () => {
      const [records] = await database.query({
        sql: `SET STATEMENT max_statement_time=90 FOR SELECT creation_date AS date,
        source_id AS source, COUNT(*) AS users,
        SUM(CASE WHEN last_success_charge >= creation_date AND last_success_charge > '0000-00-00' THEN 1 ELSE 0 END) AS charged
        FROM users GROUP BY creation_date, source_id ORDER BY creation_date DESC, source_id`,
        timeout: 95000,
      });
      cached = {
        records,
        savedAt: Date.now(),
        generatedAt: new Date().toISOString(),
      };
      return cached;
    })().finally(() => {
      pending = null;
    });
  return pending;
}
export function campaignKey(source) {
  return source == null ? 'missing' : 'source:' + source;
}
export function campaignLabel(source) {
  return source == null ? 'NULL' : source === '' ? '(empty)' : String(source);
}
export function campaignsFromRecords(records) {
  const sources = new Map();
  for (const row of records)
    sources.set(campaignKey(row.source), {
      id: campaignKey(row.source),
      source: row.source,
      label: campaignLabel(row.source),
    });
  return [...sources.values()].sort((a, b) =>
    a.label.localeCompare(b.label, 'en', { numeric: true }),
  );
}
function validateRange(start, end) {
  const valid = (value) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value || '') &&
    Number(value.slice(0, 4)) >= 1000 &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
  if (!valid(start) || !valid(end) || start > end)
    throw Object.assign(new Error('Choose a valid start and end date.'), {
      status: 400,
    });
  if ((Date.parse(end) - Date.parse(start)) / 86400000 > 366)
    throw Object.assign(new Error('Select a date range of at most 367 days.'), {
      status: 400,
    });
}
export function buildCampaignReport(snapshot, start, end, campaign = 'all') {
  validateRange(start, end);
  const all = campaignsFromRecords(snapshot.records);
  const campaigns =
    campaign === 'all' ? all : all.filter((item) => item.id === campaign);
  if (campaign !== 'all' && !campaigns.length)
    throw Object.assign(new Error('Choose a campaign from the list.'), {
      status: 400,
    });
  const allowed = new Set(campaigns.map((item) => item.id));
  const days = Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1;
  const byDate = new Map();
  for (let offset = 0; offset < days; offset++) {
    const date = new Date(Date.parse(start) + offset * 86400000)
      .toISOString()
      .slice(0, 10);
    byDate.set(date, { date, users: 0, charged: 0, campaigns: {} });
  }
  const totals = { users: 0, charged: 0, days, conversion: 0 };
  const campaignTotals = Object.fromEntries(
    campaigns.map((item) => [item.id, { users: 0, charged: 0 }]),
  );
  for (const record of snapshot.records) {
    const row = byDate.get(record.date);
    const key = campaignKey(record.source);
    if (!row || !allowed.has(key)) continue;
    const users = Number(record.users),
      charged = Number(record.charged);
    const cell = (row.campaigns[key] ||= { users: 0, charged: 0 });
    cell.users += users;
    cell.charged += charged;
    row.users += users;
    row.charged += charged;
    totals.users += users;
    totals.charged += charged;
    campaignTotals[key].users += users;
    campaignTotals[key].charged += charged;
  }
  totals.conversion = totals.users ? (totals.charged / totals.users) * 100 : 0;
  return {
    start,
    end,
    selectedCampaign: campaign,
    campaigns,
    rows: [...byDate.values()].reverse(),
    totals,
    campaignTotals,
    generatedAt: snapshot.generatedAt,
    definition: campaignDefinition,
  };
}
export async function getCampaignOptions() {
  return cachedCampaignOptions(async () => {
    if (cached && Date.now() - cached.savedAt < cacheDuration) {
      return { campaigns: campaignsFromRecords(cached.records), generatedAt: cached.generatedAt };
    }
    const [records] = await database.query({
      sql: 'SET STATEMENT max_statement_time=90 FOR SELECT DISTINCT source_id AS source FROM users',
      timeout: 95000,
    });
    return { campaigns: campaignsFromRecords(records), generatedAt: new Date().toISOString() };
  });
}
export async function getCampaignReport(start, end, campaign = 'all') {
  validateRange(start, end);
  return buildCampaignReport(await getCampaignSnapshot(), start, end, campaign);
}
