import { useEffect, useState } from 'react';
import { Icon } from './ui';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    // Jangan tampilkan jika sudah dalam mode standalone (aplikasi sudah terpasang)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) return;

    // Cek apakah pengguna sudah pernah menutup notifikasi ini
    const dismissed = localStorage.getItem('panji_pwa_dismissed');
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Fallback: Jika event beforeinstallprompt tidak langsung dipicu (misal di mobile iOS atau browser tertentu),
    // tetap tampilkan notifikasi setelah login
    const timer = setTimeout(() => {
      if (!isStandalone && !localStorage.getItem('panji_pwa_dismissed')) {
        setShow(true);
      }
    }, 1200);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  if (!show) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          localStorage.setItem('panji_pwa_dismissed', '1');
          setShow(false);
          return;
        }
      } catch (err) {
        console.error('Install prompt error:', err);
      }
    }
    // Jika prompt native tidak tersedia (misal di iOS Safari), buka petunjuk manual
    setShowGuide(true);
  };

  const handleDismiss = () => {
    localStorage.setItem('panji_pwa_dismissed', '1');
    setShow(false);
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: boolean }).MSStream;

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 'calc(68px + var(--safe-b))',
        zIndex: 45,
        padding: '0 12px',
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        animation: 'up 0.25s ease-out',
      }}
    >
      <div
        className="card pad stack"
        style={{
          maxWidth: 440,
          width: '100%',
          boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
          border: '1px solid var(--accent)',
          background: 'var(--card)',
          pointerEvents: 'auto',
          gap: 10,
        }}
      >
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <div className="row" style={{ gap: 10, alignItems: 'center' }}>
            <img
              src="/parisada.png"
              alt="Logo Parisada"
              width={42}
              height={42}
              style={{ objectFit: 'contain', flex: 'none', borderRadius: 8 }}
            />
            <div>
              <b style={{ fontSize: 15, color: 'var(--ink)' }}>Install Versi Aplikasi</b>
              <div className="xs muted" style={{ marginTop: 1 }}>PANJI PARISADA</div>
            </div>
          </div>
          <button
            type="button"
            className="btn ghost icon sm"
            style={{ width: 28, height: 28, minWidth: 28, padding: 0 }}
            onClick={handleDismiss}
            aria-label="Tutup"
          >
            <Icon n="x" size={16} />
          </button>
        </div>

        {!showGuide ? (
          <>
            <p className="sm" style={{ margin: 0, lineHeight: 1.45, color: 'var(--ink2)' }}>
              Pasang aplikasi di layar utama ponsel Anda untuk akses lebih cepat, praktis, dan dapat dibuka saat sinyal lemah.
            </p>
            <div className="row between" style={{ marginTop: 4, gap: 8 }}>
              <button
                type="button"
                className="btn sm"
                style={{ flex: 1, background: 'transparent', borderColor: 'var(--line2)' }}
                onClick={handleDismiss}
              >
                Nanti Saja
              </button>
              <button
                type="button"
                className="btn primary sm"
                style={{ flex: 1.3, gap: 6 }}
                onClick={handleInstall}
              >
                <Icon n="down" size={16} /> Pasang Sekarang
              </button>
            </div>
          </>
        ) : (
          <div className="stack sm" style={{ marginTop: 2 }}>
            <div
              className="card pad"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                fontSize: 12.5,
                lineHeight: 1.5,
              }}
            >
              {isIOS ? (
                <div>
                  1. Ketuk tombol <b>Bagikan (Share <span style={{ fontSize: 14 }}>⎋</span>)</b> di bilah bawah Safari.
                  <br />
                  2. Gulir ke bawah lalu pilih <b>"Tambahkan ke Layar Utama" (Add to Home Screen)</b>.
                </div>
              ) : (
                <div>
                  1. Ketuk tombol <b>Menu titik tiga (⋮)</b> di kanan atas browser Chrome/browser ponsel.
                  <br />
                  2. Pilih <b>"Install Aplikasi"</b> atau <b>"Tambahkan ke Layar Utama"</b>.
                </div>
              )}
            </div>
            <button
              type="button"
              className="btn primary sm block"
              onClick={handleDismiss}
            >
              Mengerti, Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

