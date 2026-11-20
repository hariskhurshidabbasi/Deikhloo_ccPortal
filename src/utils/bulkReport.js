export async function downloadBulkReport(rows, preview, results, filename, processed = false) {
  const { default: ExcelJS } = await import('exceljs');
  const hasInactive = rows.some(row => preview[row.phone]?.status === 'Inactive');
  const data = rows.map(row => {
    const detail = preview[row.phone];
    if (processed) return {
      Phone: String(row.phone || row.raw || ''),
      Result: row.status === 'Valid' ? results[row.phone] || 'Not processed' : 'Skipped: ' + row.status,
      Reason: row.status === 'Valid' ? detail?.reason || '' : '',
      'Deactivation Date': row.status === 'Valid' && detail?.status === 'Inactive' ? detail.deactivatedAt || '' : '',
    };
    return {
      Row: row.row,
      'Input number': row.raw,
      Phone: String(row.phone || ''),
      Validation: row.status,
      'Subscription status': detail?.status || '',
      Status: detail?.databaseStatus ?? '',
      Plan: detail?.plan || '',
      Blacklisted: detail ? (detail.blacklisted ? 'Yes' : 'No') : '',
      'Source ID': detail?.source ?? '',
      Created: detail?.createdAt || '',
      ...(hasInactive ? { 'Deactivation date': detail?.status === 'Inactive' ? detail.deactivatedAt || '' : '' } : {}),
    };
  });
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(processed ? 'Deactivation Results' : 'Deikhlo Status Preview');
  sheet.columns = Object.keys(data[0] || {}).map(key => ({
    header: key, key, width: key === 'Result' ? 55 : 26,
    ...(key === 'Phone' || key === 'Input number' ? { style: { numFmt: '@' } } : {}),
  }));
  sheet.addRows(data);
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  const bytes = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

