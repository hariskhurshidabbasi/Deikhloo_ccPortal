import React, { useState } from 'react';

export default function BulkFilePreview({ rows, file, preview, results }) {
  const [page, setPage] = useState(0);
  const invalid = rows.filter(row => row.status === 'Invalid number');
  const duplicates = rows.filter(row => row.status === 'Duplicate');
  const valid = rows.length - invalid.length - duplicates.length;
  const size = 50;
  return (
    <div className="bulk-file-preview">
      <div className="uploaded-file"><strong>{file.name}</strong><span>{(file.size / 1024).toFixed(1)} KB · {rows.length.toLocaleString()} rows</span></div>
      <div className="validation-stats">
        <div className="valid-count"><strong>{valid.toLocaleString()}</strong><span>Valid numbers</span></div>
        <div className="invalid-count"><strong>{invalid.length.toLocaleString()}</strong><span>Invalid</span></div>
        <div className="duplicate-count"><strong>{duplicates.length.toLocaleString()}</strong><span>Duplicates</span></div>
      </div>
      {(invalid.length > 0 || duplicates.length > 0) && <details className="validation-issues" open>
        <summary>Issues found · {invalid.length + duplicates.length} rows</summary>
        <p>Invalid rows and duplicate numbers are skipped during deactivation.</p>
        <div>{[...invalid, ...duplicates].slice(0, 100).map(row => <p key={row.row}>Row {row.row}: {row.raw || '(empty)'} — {row.status}</p>)}</div>
        {invalid.length + duplicates.length > 100 && <p>Showing the first 100 issues. Download the report for all rows.</p>}
      </details>}
      <details className="preview-rows">
        <summary>View number preview</summary>
        <div className="table-scroll"><table className="records"><thead><tr><th>ROW</th><th>PHONE</th><th>VALIDATION</th><th>SUBSCRIPTION STATUS</th><th>STATUS</th><th>SOURCE ID</th><th>RESULT</th></tr></thead>
          <tbody>{rows.slice(page * size, (page + 1) * size).map(row => <tr key={row.row}>
            <td>{row.row}</td><td>{row.phone || row.raw}</td><td>{row.status}</td>
            <td>{preview[row.phone]?.status || '—'}</td><td>{preview[row.phone]?.databaseStatus ?? '—'}</td><td>{preview[row.phone]?.source ?? '—'}</td><td>{row.status === 'Valid' ? results[row.phone] || '—' : 'Skipped'}</td>
          </tr>)}</tbody></table></div>
        <div className="bulk-pagination"><button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page + 1} of {Math.max(1, Math.ceil(rows.length / size))}</span>
          <button type="button" disabled={(page + 1) * size >= rows.length} onClick={() => setPage(page + 1)}>Next</button></div>
      </details>
    </div>
  );
}

