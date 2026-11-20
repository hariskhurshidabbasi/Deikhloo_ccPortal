import { query } from './database.js';
import { normalizePhone } from '../src/utils/phone.js';

export async function previewSubscribers(body) {
  if (!Array.isArray(body?.phones) || !body.phones.length || body.phones.length > 500) {
    throw Object.assign(new Error('Preview accepts 1–500 numbers per request.'), { status: 400 });
  }
  let phones;
  try { phones = [...new Set(body.phones.map(normalizePhone))]; }
  catch { throw Object.assign(new Error('Invalid preview phone number.'), { status: 400 }); }
  const variants = phones.flatMap(phone => [phone, phone.slice(2)]);
  const placeholders = variants.map(() => '?').join(',');
  const users = await query(
    `SELECT CAST(u.phone AS CHAR) AS phone, u.status, u.is_blacklist,
      p.plan_name AS plan, u.source_id AS source, COALESCE(u.created_at, u.creation_date) AS createdAt,
      u.deactivate_date AS deactivatedAt, u.deactivate_reason AS reason
      FROM users u LEFT JOIN subscription_plans p ON p.id = u.plan_id
      WHERE u.phone IN (${placeholders})`, variants,
  );
  const blacklist = await query(
    'SELECT msisdn FROM users_blacklist WHERE msisdn IN (' + phones.map(() => '?').join(',') + ')',
    phones.map(phone => phone.slice(2)),
  );
  const blocked = new Set(blacklist.map(row => row.msisdn));
  const grouped = new Map();
  for (const user of users) {
    const phone = normalizePhone(user.phone);
    if (!grouped.has(phone)) grouped.set(phone, []);
    grouped.get(phone).push(user);
  }
  return phones.map(phone => {
    const matches = grouped.get(phone) || [];
    const user = matches[0];
    let status = 'Not found';
    if (matches.length > 1) status = 'Multiple records';
    else if (user) status = Number(user.status) === 1 ? 'Active' : Number(user.status) === 0 ? 'Inactive' : 'Status ' + user.status;
    return {
      phone, status, plan: matches.length === 1 ? user.plan : null,
      databaseStatus: matches.length === 1 ? user.status : null,
      blacklisted: matches.length
        ? matches.some(row => Number(row.is_blacklist) === 1)
        : blocked.has(phone.slice(2)),
      source: matches.length === 1 ? user.source : null,
      createdAt: matches.length === 1 ? user.createdAt : null,
      deactivatedAt: matches.length === 1 && status === 'Inactive' ? user.deactivatedAt : null,
      reason: matches.length === 1 ? user.reason : null,
    };
  });
}
