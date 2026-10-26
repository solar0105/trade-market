import { useEffect, useState } from 'react';
import { setToastListener } from '../toast.js';

export default function Toast() {
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    setToastListener(setNotice);
    return () => setToastListener(null);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 2600);
    return () => clearTimeout(timer);
  }, [notice]);

  return (
    <div className={notice ? `toast show ${notice.kind}` : 'toast'}>
      {notice?.message}
    </div>
  );
}
