import React, { useEffect, useState } from 'react';

const pageSize = 15;
export function useReportPagination(rows) {
  const [page, setPage] = useState(0);
  useEffect(() => { setPage(0); }, [rows]);
  const count = rows?.length || 0;
  const pages = Math.max(1, Math.ceil(count / pageSize));
  const current = Math.min(page, pages - 1);
  return {
    rows: (rows || []).slice(current * pageSize, (current + 1) * pageSize),
    page: current, pages, count, setPage,
    start: count ? current * pageSize + 1 : 0,
    end: Math.min((current + 1) * pageSize, count),
  };
}

export default function ReportPagination({ pagination, disabled = false }) {
  const { page, pages, count, start, end, setPage } = pagination;
  if (!count) return null;
  return <nav className="report-pagination" aria-label="Report pages">
    <span role="status">Showing {start}–{end} of {count}</span>
    <div><button type="button" disabled={disabled || page === 0} onClick={() => setPage(page - 1)}>Previous</button>
      <span>Page {page + 1} of {pages}</span>
      <button type="button" disabled={disabled || page === pages - 1} onClick={() => setPage(page + 1)}>Next</button></div>
  </nav>;
}
