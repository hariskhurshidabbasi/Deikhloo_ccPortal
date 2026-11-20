import { randomBytes, scrypt as deriveKey, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { database } from './database.js';
import { roleForUsername } from './access.js';

const scrypt = promisify(deriveKey);
const options = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const scheme = 'scrypt-32768-8-3';
const digestToken = token => createHash('sha256').update(token).digest('hex');

export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 10 || password.length > 1024) {
    throw Object.assign(new Error('Choose a password between 10 and 1,024 characters.'), { status: 400 });
  }
  const salt = randomBytes(32);
  const hash = await scrypt(password, salt, 64, options);
  return { hash: hash.toString('hex'), salt: salt.toString('hex'), scheme };
}

export async function checkAuthenticationTables(pool = database) {
  try {
    await pool.execute(`SELECT username, password_hash, password_salt, password_scheme,
      failed_attempts, blocked_until FROM cc_portal_admins LIMIT 0`);
    await pool.execute('SELECT token_hash, username, expires_at FROM cc_portal_sessions LIMIT 0');
  } catch (error) {
    if (['ER_NO_SUCH_TABLE', 'ER_BAD_FIELD_ERROR'].includes(error.code)) {
      throw new Error('Required login tables or columns are missing. Restore the existing portal database backup. Startup does not create or change tables.', { cause: error });
    }
    throw error;
  }
}

export async function hasAdmin(pool = database) {
  const [rows] = await pool.execute('SELECT username FROM cc_portal_admins WHERE username = ?', ['admin']);
  return rows.length > 0;
}

export async function provisionAdmin(password, pool = database) {
  return provisionAccount('admin', password, pool);
}

export async function provisionAccount(username, password, pool = database) {
  if (!roleForUsername(username)) throw new Error('Unsupported account role.');
  const [existing] = await pool.execute('SELECT username FROM cc_portal_admins WHERE username = ?', [username]);
  if (existing.length) return false;
  const passwordData = await hashPassword(password);
  try {
    await pool.execute(
      'INSERT INTO cc_portal_admins (username, password_hash, password_salt, password_scheme) VALUES (?, ?, ?, ?)',
      [username, passwordData.hash, passwordData.salt, passwordData.scheme],
    );
    return true;
  } catch (error) {
    // Concurrent first-time startup must never overwrite an existing account.
    if (error.code === 'ER_DUP_ENTRY') return false;
    throw error;
  }
}

export function createAuthentication(pool = database) {
  let checking = false;
  return {
    async login(username, candidate, rememberMe = false) {
      if (!roleForUsername(username)) return { status: 401 };
      if (checking) return { status: 429 };
      checking = true;
      let connection;
      try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        const [rows] = await connection.execute(
          'SELECT * FROM cc_portal_admins WHERE username = ? FOR UPDATE', [username],
        );
        const admin = rows[0];
        if (!admin) {
          await connection.rollback();
          return { status: 401 };
        }
        if (Number(admin.blocked_until) > Date.now()) {
          await connection.rollback();
          return { status: 429 };
        }
        if (admin.password_scheme !== scheme) throw new Error('Unsupported password hash scheme.');
        const input = typeof candidate === 'string' && candidate.length <= 1024 ? candidate : '';
        const candidateHash = await scrypt(input, Buffer.from(admin.password_salt, 'hex'), 64, options);
        const expectedHash = Buffer.from(admin.password_hash, 'hex');
        const valid = expectedHash.length === candidateHash.length &&
          timingSafeEqual(expectedHash, candidateHash) && username === admin.username;
        if (!valid) {
          const failures = Number(admin.failed_attempts) + 1;
          await connection.execute(
            'UPDATE cc_portal_admins SET failed_attempts = ?, blocked_until = ? WHERE username = ?',
            [failures >= 5 ? 0 : failures, failures >= 5 ? Date.now() + 15 * 60 * 1000 : 0, admin.username],
          );
          await connection.commit();
          return { status: 401 };
        }
        await connection.execute(
          'UPDATE cc_portal_admins SET failed_attempts = 0, blocked_until = 0 WHERE username = ?', [admin.username],
        );
        await connection.execute('DELETE FROM cc_portal_sessions WHERE expires_at <= ?', [Date.now()]);
        const token = randomBytes(32).toString('hex');
        const maxAge = rememberMe === true ? 30 * 24 * 60 * 60 : 8 * 60 * 60;
        await connection.execute(
          'INSERT INTO cc_portal_sessions (token_hash, username, expires_at) VALUES (?, ?, ?)',
          [digestToken(token), admin.username, Date.now() + maxAge * 1000],
        );
        await connection.commit();
        return { status: 200, token, maxAge, role: roleForUsername(username) };
      } catch (error) {
        if (connection) await connection.rollback();
        throw error;
      } finally {
        connection?.release();
        checking = false;
      }
    },
    async authorized(token) {
      return Boolean(await this.session(token));
    },
    async session(token) {
      if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return false;
      const [rows] = await pool.execute(
        `SELECT s.username FROM cc_portal_sessions s JOIN cc_portal_admins a ON a.username = s.username
          WHERE s.token_hash = ? AND s.expires_at > ?`,
        [digestToken(token), Date.now()],
      );
      const role = roleForUsername(rows[0]?.username);
      return role ? { username: rows[0].username, role } : null;
    },
    async logout(token) {
      if (typeof token === 'string' && /^[a-f0-9]{64}$/.test(token)) {
        await pool.execute('DELETE FROM cc_portal_sessions WHERE token_hash = ?', [digestToken(token)]);
      }
    },
  };
}
