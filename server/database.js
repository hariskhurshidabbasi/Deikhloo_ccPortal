import mysql from 'mysql2/promise';
export const database = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'binjee_db', connectionLimit: 4,
  connectTimeout: 5000, supportBigNumbers: true, bigNumberStrings: true, dateStrings: true,
});
export async function query(sql, parameters = []) {
  const [rows] = await database.execute({ sql, timeout: 15000 }, parameters);
  return rows;
}
