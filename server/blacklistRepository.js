import { database, query } from './database.js';
import { normalizePhone } from '../src/utils/phone.js';

export function validateBlacklist(body) {
  if (typeof body?.blacklisted !== 'boolean') {
    throw Object.assign(new Error('Choose blacklist or remove from blacklist.'), { status: 400 });
  }
  try {
    return { phone: normalizePhone(body.phone), blacklisted: body.blacklisted };
  } catch {
    throw Object.assign(new Error('Enter a valid Pakistani mobile number.'), { status: 400 });
  }
}

export async function getBlacklistStatus(phone) {
  const rows = await query(
    `SELECT EXISTS(SELECT 1 FROM users_blacklist WHERE msisdn = ?) AS listed,
      EXISTS(SELECT 1 FROM users WHERE phone IN (?, ?) AND is_blacklist = 1) AS flagged,
      EXISTS(SELECT 1 FROM users WHERE phone IN (?, ?)) AS registered`,
    [phone.slice(2), phone, phone.slice(2), phone, phone.slice(2)],
  );
  return {
    phone,
    blacklisted: Number(rows[0].registered) === 1
      ? Number(rows[0].flagged) === 1
      : Number(rows[0].listed) === 1,
    registered: Number(rows[0].registered) === 1,
  };
}

// Synchronize the shared blacklist and every matching subscriber record atomically.
export async function setBlacklistStatus({ phone, blacklisted }, pool = database) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (blacklisted) {
      await connection.execute(
        'INSERT INTO users_blacklist (msisdn) VALUES (?) ON DUPLICATE KEY UPDATE msisdn = VALUES(msisdn)',
        [phone.slice(2)],
      );
      const [existing] = await connection.execute(
        'SELECT id FROM users WHERE phone IN (?, ?) ORDER BY id FOR UPDATE',
        [phone, phone.slice(2)],
      );
      if (!existing.length) {
        const date = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit',
        }).format(new Date());
        // Both date fields are required by the imported schema. A creation-day
        // recharge_date is an initial value; last_success_charge remains NULL.
        await connection.execute(
          `INSERT INTO users
            (phone, status, plan_id, is_blacklist, trial, source_id,
             creation_date, recharge_date, created_at)
           VALUES (?, 0, 0, 1, 0, 'cc_portal', ?, ?, CURRENT_TIMESTAMP)
           ON DUPLICATE KEY UPDATE is_blacklist = 1, status = 0, plan_id = 0`,
          [phone, date, date],
        );
      }
    } else {
      await connection.execute('DELETE FROM users_blacklist WHERE msisdn = ?', [phone.slice(2)]);
    }
    await connection.execute(
      blacklisted
        ? 'UPDATE users SET is_blacklist = ?, status = 0, plan_id = 0 WHERE phone IN (?, ?)'
        : 'UPDATE users SET is_blacklist = ? WHERE phone IN (?, ?)',
      [blacklisted ? 1 : 0, phone, phone.slice(2)],
    );
    await connection.commit();
    return { phone, blacklisted };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

