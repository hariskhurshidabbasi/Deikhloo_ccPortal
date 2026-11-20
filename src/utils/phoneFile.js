import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import { normalizePhone } from './phone.js';
export async function readPhoneFile(file) {
  if (file.size > 5 * 1024 * 1024) throw new Error('Choose a file no larger than 5 MB.');
  let rows;
  if (/\.csv$/i.test(file.name)) {
    const parsed = Papa.parse(await file.text(), { skipEmptyLines: 'greedy', delimiter: ',' });
    if (parsed.errors.length) throw new Error('The CSV contains invalid rows. Please check its formatting.');
    rows = parsed.data;
  } else if (/\.xlsx$/i.test(file.name)) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());
    const sheet = workbook.worksheets[0];
    rows = [];
    sheet?.eachRow(row => rows.push(row.values.slice(1).map(value => String(value ?? ''))));
  } else throw new Error('Choose a CSV or XLSX file.');
  if (!rows.length) throw new Error('The file is empty.');
  const headerIndex = rows[0].findIndex(value => /^(phone|phone number|mobile|msisdn|number)$/i.test(String(value).trim()));
  const data = headerIndex >= 0 ? rows.slice(1) : rows;
  const column = Math.max(0, headerIndex);
  const seen = new Set();
  return data.map((row, index) => {
    const raw = String(row[column] ?? '').trim();
    try {
      const phone = normalizePhone(raw);
      if (seen.has(phone)) return { row: index + (headerIndex >= 0 ? 2 : 1), raw, phone, status: 'Duplicate' };
      seen.add(phone);
      return { row: index + (headerIndex >= 0 ? 2 : 1), raw, phone, status: 'Valid' };
    } catch { return { row: index + (headerIndex >= 0 ? 2 : 1), raw, status: 'Invalid number' }; }
  });
}


