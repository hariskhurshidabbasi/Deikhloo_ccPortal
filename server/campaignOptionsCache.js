import { mkdir, readFile, writeFile, rename, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

const directory = new URL('./private/', import.meta.url);
const file = new URL('campaign-options.json', directory);
const maxAge = 5 * 60 * 1000;
let cached;
let loading;
let refreshing;

async function loadSaved() {
  try {
    const saved = JSON.parse(await readFile(file, 'utf8'));
    if (Array.isArray(saved.campaigns) && Number.isFinite(saved.savedAt)) cached = saved;
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('Campaign list cache unavailable:', error.code || 'INVALID_CACHE');
  }
}
async function refresh(fetchOptions) {
  if (!refreshing) refreshing = (async () => {
    const data = await fetchOptions();
    cached = { ...data, savedAt: Date.now() };
    const temporary = new URL('campaign-options-' + randomUUID() + '.tmp', directory);
    try {
      await mkdir(directory, { recursive: true });
      await writeFile(temporary, JSON.stringify(cached), { mode: 0o600 });
      await rename(temporary, file);
    } catch (error) { console.error('Campaign list cache could not be saved:', error.code || 'WRITE_ERROR'); }
    finally { await rm(temporary, { force: true }).catch(() => {}); }
    return cached;
  })().finally(() => { refreshing = null; });
  return refreshing;
}
export async function cachedCampaignOptions(fetchOptions) {
  if (!loading) loading = loadSaved();
  await loading;
  if (!cached) return refresh(fetchOptions);
  if (Date.now() - cached.savedAt >= maxAge) {
    refresh(fetchOptions).catch(error => console.error('Campaign list refresh failed:', error.code || 'DATABASE_ERROR'));
  }
  return cached;
}
