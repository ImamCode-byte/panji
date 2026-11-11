import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';

export function VersionBadge() {
  const loc = useLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') return null;

  // Di mode mobile: bila berada di dalam route /app (selain cetak sertifikat), terdapat tab bar navigasi di bagian bawah
  const isScoreForm = /^\/app\/input\/[^/]+\/[^/]+/.test(loc.pathname);
  const inApp = loc.pathname.startsWith('/app') && loc.pathname !== '/app/cetak' && !isScoreForm;

  return createPortal(
    <div
      className={`ver-badge ${inApp ? 'in-app' : ''} ${isScoreForm ? 'on-score-form' : ''}`}
      aria-label="Versi aplikasi: v 0.1.0"
      title="Versi aplikasi: v 0.1.0"
    >
      v 0.1.0
    </div>,
    document.body
  );
}
