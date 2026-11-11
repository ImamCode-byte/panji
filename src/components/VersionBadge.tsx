import { useLocation } from 'react-router-dom';

export function VersionBadge() {
  const loc = useLocation();
  // Di mode mobile: bila berada di dalam route /app (selain cetak sertifikat), terdapat tab bar navigasi di bagian bawah
  const inApp = loc.pathname.startsWith('/app') && loc.pathname !== '/app/cetak';

  return (
    <div
      className={`ver-badge ${inApp ? 'in-app' : ''}`}
      aria-label="Versi aplikasi: v 0.1.0"
      title="Versi aplikasi: v 0.1.0"
    >
      v 0.1.0
    </div>
  );
}
