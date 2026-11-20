import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
export default function ReportLoading() {
  useEffect(() => {
    const root = document.getElementById('root');
    const previousInert = root?.inert;
    const previousOverflow = document.body.style.overflow;
    if (root) root.inert = true;
    document.body.style.overflow = 'hidden';
    return () => { if (root) root.inert = previousInert; document.body.style.overflow = previousOverflow; };
  }, []);
  return createPortal(<div className="report-loading-overlay"><div className="report-loading-card" role="status" aria-live="polite"><span className="report-spinner" aria-hidden="true" /><h2>Loading report…</h2><p>Please wait while we prepare your report.</p></div></div>, document.body);
}
