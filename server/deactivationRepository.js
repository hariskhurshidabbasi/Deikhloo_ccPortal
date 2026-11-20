import { database } from './database.js';
import { normalizePhone } from '../src/utils/phone.js';

export function validateDeactivation(body) {
  if (body?.service !== 'deikhlo' || !Array.isArray(body.phones) ||
      !body.phones.length || body.phones.length > 1000 ||
      !['Customer Request', 'Unsubscribe via SMS', 'Other'].includes(body.reason)) {
    throw Object.assign(new Error('Select a valid reason and provide 1–1,000 Deikhlo phone numbers.'), { status: 400 });
  }
  try {
    return { phones: [...new Set(body.phones.map(normalizePhone))].sort(), reason: body.reason };
  } catch {
    throw Object.assign(new Error('One or more phone numbers are invalid.'), { status: 400 });
  }
}

// Lock the full batch before updating so missing/ambiguous records cause no partial changes.
export async function deactivateUsers({ phones, reason }, pool = database) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const selected = [];
    for (const phone of phones) {
      const [rows] = await connection.execute(
        'SELECT id, status FROM users WHERE phone IN (?, ?) ORDER BY id FOR UPDATE',
        [phone, phone.slice(2)],
      );
      if (rows.length !== 1) {
        throw Object.assign(new Error(rows.length ? 'Multiple records match ' + phone + '.' : 'Subscriber not found: ' + phone), { status: 409 });
      }
      if (![0, 1].includes(rows[0].status)) {
        throw Object.assign(new Error('Unsupported subscriber status for ' + phone + '.'), { status: 409 });
      }
      selected.push({ ...rows[0], phone });
    }
    const date = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
    let changed = 0;
    for (const user of selected) {
      if (user.status === 0) continue;
      await connection.execute(
        'UPDATE users SET status = 0, deactivate_reason = ?, deactivate_date = ? WHERE id = ? AND status = 1',
        [reason, date, user.id],
      );
      changed++;
    }
    await connection.commit();
    return {
      changed, alreadyInactive: selected.length - changed, scope: 'local-database',
      results: selected.map(user => ({
        phone: user.phone,
        result: user.status === 0 ? 'Already inactive' : 'Deactivated',
        date: user.status === 0 ? null : date,
      })),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
