import type { CSSProperties } from 'react';

export const DEV_LINKS = [
  {
    name: 'WhatsApp',
    url: 'https://wa.me/6287849264452',
    color: '#25D366',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/_x.nonii?cplk=MWF4bG8zMnRlMTdsZA==',
    color: '#E1306C',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    name: 'TikTok',
    url: 'https://www.tiktok.com/@_x.noni?_r=1&_t=ZS-9BJnVXkwtT2',
    color: '#ee1d52',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
      </svg>
    ),
  },
  {
    name: 'YouTube',
    url: 'https://youtube.com/@dhespachito_official8670?si=E_0MiYmH4Q7NU20M',
    color: '#FF0000',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: 'GitHub',
    url: 'https://github.com/ImamCode-byte',
    color: '#ffffff',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
      </svg>
    ),
  },
];

interface Props {
  variant?: 'full' | 'sidebar' | 'compact';
  style?: CSSProperties;
}

export function DevFooter({ variant = 'full', style }: Props) {
  if (variant === 'sidebar') {
    return (
      <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.12)', ...style }}>
        <div className="row" style={{ gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <img
            src="/mamCode.png"
            alt="mamCode Logo"
            width={28}
            height={28}
            style={{ borderRadius: 6, objectFit: 'contain', background: '#fff', padding: 1 }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#eadfca' }} className="trunc">mamCode</div>
            <div style={{ fontSize: 10, opacity: 0.65, color: '#eadfca' }}>Developer</div>
          </div>
        </div>
        <div className="row wrap" style={{ gap: 5 }}>
          {DEV_LINKS.map((item) => (
            <a
              key={item.name}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              title={item.name}
              aria-label={item.name}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: 6,
                background: 'rgba(255,255,255,.08)',
                color: '#eadfca',
                transition: 'background .15s, transform .08s',
              }}
            >
              {item.icon}
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <footer
      style={{
        marginTop: 28,
        padding: '18px 16px',
        borderRadius: 'var(--r2)',
        background: 'var(--card)',
        border: '1px solid var(--line)',
        boxShadow: 'var(--sh)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 12,
        ...style,
      }}
    >
      <div className="row" style={{ gap: 10, alignItems: 'center' }}>
        <img
          src="/mamCode.png"
          alt="Logo Developer mamCode"
          width={42}
          height={42}
          style={{
            borderRadius: 10,
            objectFit: 'contain',
            border: '1px solid var(--line)',
            background: '#fff',
            padding: 3,
            boxShadow: '0 2px 6px rgba(0,0,0,.06)',
          }}
        />
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontWeight: 800, fontSize: 14.5, letterSpacing: '.01em' }}>
            mamCode
          </div>
          <div className="xs muted">Pengembang Aplikasi Penilaian PANJI</div>
        </div>
      </div>

      <div className="row wrap" style={{ gap: 8, justifyContent: 'center' }}>
        {DEV_LINKS.map((item) => (
          <a
            key={item.name}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn sm"
            style={{
              height: 36,
              minHeight: 36,
              padding: '0 10px',
              fontSize: 12,
              gap: 6,
              background: 'var(--surface)',
              borderColor: 'var(--line)',
              color: 'var(--ink)',
            }}
            title={`${item.name} · mamCode`}
          >
            <span style={{ display: 'grid', placeItems: 'center', color: item.color === '#ffffff' ? 'inherit' : item.color }}>
              {item.icon}
            </span>
            <span>{item.name}</span>
          </a>
        ))}
      </div>

      <div className="xs faint" style={{ fontSize: 11 }}>
        Dikembangkan oleh <b>mamCode</b> · Hubungi untuk layanan sistem & aplikasi
      </div>
    </footer>
  );
}

