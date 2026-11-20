import { query } from './database.js';
export async function getSubscriber(phone, read = query) {
  const rows = await read(
    `SELECT u.phone, u.status, u.source_id, u.created_at, u.creation_date,
    u.deactivate_date, u.deactivate_reason, p.plan_name, u.is_blacklist FROM users u
    LEFT JOIN subscription_plans p ON p.id = u.plan_id
    WHERE u.phone IN (?, ?) ORDER BY (u.phone = ?) DESC LIMIT 1`,
    [phone, phone.slice(2), phone]);
  if (!rows.length) {
    const listed = await read('SELECT msisdn FROM users_blacklist WHERE msisdn = ? LIMIT 1', [phone.slice(2)]);
    return {
      phone, status: 'No subscription', registered: false, plan: null,
      createdAt: null, source: null, deactivatedAt: null, balance: null, blacklisted: listed.length > 0,
    };
  }
  const row = rows[0];
  return {
    phone, registered: true, status: row.status === 1 ? 'Active' : row.status === 0 ? 'Inactive' : 'Status ' + row.status,
    plan: row.plan_name, createdAt: row.created_at || row.creation_date,
    source: row.source_id, deactivatedAt: row.deactivate_date === '0000-00-00' ? null : row.deactivate_date,
    deactivationReason: row.deactivate_reason,
    balance: null,
    blacklisted: Number(row.is_blacklist) === 1,
  };
}
export async function getHistory(phone) {
  const variants = [phone, phone.slice(2)];
  const [user, charging, otp, cidHistory] = await Promise.all([
    getSubscriber(phone),
    query(`SELECT id, msisdn AS phone, log_date AS logDate, service_id AS serviceId,
      status, channel, subscription_time AS subscriptionTime,
      renewal_time AS renewalTime, created_at AS createdAt
      FROM charging_logs WHERE msisdn IN (?, ?)
      ORDER BY log_date DESC, id DESC LIMIT 1000`, variants),
    query(`SELECT id, phone, otp, date, attempt, created_at AS createdAt, updated_at AS updatedAt
      FROM signup_otp WHERE phone IN (?, ?) ORDER BY date DESC, id DESC LIMIT 1000`, variants),
    query(`SELECT id, phone, cid, datetime AS dateTime, source_id AS source, plan_id AS planId,
      tx_id AS transactionId, resp_code AS responseCode, pub_id AS publisherId
      FROM cms_users WHERE phone IN (?, ?) ORDER BY datetime DESC, id DESC LIMIT 1000`, variants),
  ]);
  return {
    activations: user?.registered ? [{
      dateTime: user.createdAt, plan: user.plan, source: user.source, status: user.status,
      deactivatedAt: user.status === 'Inactive' ? user.deactivatedAt : null,
      reason: user.status === 'Inactive' ? user.deactivationReason : null,
    }] : [],
    charging, otp, cidHistory, sms: [],
  };
}
export async function getRecentDeactivations() {
  return query(`SELECT id, CAST(phone AS CHAR) AS phone, deactivate_reason AS reason, deactivate_date AS date
    FROM users WHERE deactivate_date IS NOT NULL AND deactivate_date <> '0000-00-00'
    ORDER BY deactivate_date DESC, updated_at DESC, id DESC LIMIT 100`);
}

