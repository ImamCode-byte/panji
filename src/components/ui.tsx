import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const P: Record<string, string> = {
  home: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  edit: 'M9 4h6v3H9z M7 5H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2 M8 12h8 M8 16h5',
  trophy: 'M8 4h8v6a4 4 0 0 1-8 0z M8 6H4v1a4 4 0 0 0 4 4 M16 6h4v1a4 4 0 0 1-4 4 M12 14v4 M8 21h8',
  list: 'M4 6h16 M4 12h16 M4 18h10',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M2.5 20a6.5 6.5 0 0 1 13 0 M16 4.5a3.5 3.5 0 0 1 0 6.5 M18 14a6.5 6.5 0 0 1 3.5 6',
  sliders: 'M4 7h10 M18 7h2 M4 17h2 M10 17h10 M16 5v4 M8 15v4',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0',
  logout: 'M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4 M16 8l4 4-4 4 M20 12H9',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z M21 21l-4.3-4.3',
  check: 'M5 12.5l4.5 4.5L19 7.5', plus: 'M12 5v14 M5 12h14', minus: 'M5 12h14', x: 'M6 6l12 12 M18 6L6 18',
  print: 'M7 8V4h10v4 M7 17H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2 M7 14h10v6H7z',
  down: 'M12 4v11 M7 11l5 5 5-5 M5 20h14',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeoff: 'M3 3l18 18 M10.6 6.2A9.8 9.8 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.2 3.8 M6.5 7.6C4 9.3 2 12 2 12s4 6 10 6c1.6 0 3-.4 4.3-1 M9.9 10a3 3 0 0 0 4.1 4.1',
  refresh: 'M20 11a8 8 0 0 0-14.5-4 M4 4v4h4 M4 13a8 8 0 0 0 14.5 4 M20 20v-4h-4',
  back: 'M15 5l-7 7 7 7', chev: 'M9 5l7 7-7 7',
  alert: 'M12 4l9 16H3z M12 10v4 M12 17.5v.01',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M3 12h18 M12 3a14 14 0 0 1 0 18 M12 3a14 14 0 0 0 0 18',
  trash: 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13 M10 11v6 M14 11v6',
  flag: 'M6 21V4 M6 5h12l-3 4 3 4H6',
  pencil: 'M4 20l4-1L19 8l-3-3L5 16z M14 7l3 3',
  wifi: 'M3 9a15 15 0 0 1 18 0 M6 12.5a10 10 0 0 1 12 0 M9 16a5 5 0 0 1 6 0 M12 19.5v.01',
  lock: 'M7 11V7a5 5 0 0 1 10 0v4 M5 11h14v10H5z M12 15v2',
  unlock: 'M7 11V7a5 5 0 0 1 9.9-1 M5 11h14v10H5z M12 15v2',
};
export const Icon = ({ n, size = 20 }: { n: keyof typeof P | string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {(P[n] ?? '').split(' M').map((d, i) => <path key={i} d={(i ? 'M' : '') + d} />)}
  </svg>
);
export const Mark = ({ size = 34, className }: { size?: number; className?: string }) => (
  <img
    src="/parisada.png"
    alt="Logo Parisada XXI"
    width={size}
    height={size}
    className={className}
    style={{ width: size, height: size, objectFit: 'contain', display: 'inline-block', verticalAlign: 'middle' }}
  />
);

export const fmt = (n: number | null | undefined, d = 2) => (n == null ? '—' : n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: d }));
export const Rank = ({ n, tie }: { n: number; tie?: boolean }) => (
  <span className={`rank ${n >= 1 && n <= 3 ? 'r' + n : ''}`} title={tie ? 'Nilai seri' : undefined}>{n || '–'}</span>
);

export function Seg<T extends string>({ value, onChange, opts }: { value: T; onChange: (v: T) => void; opts: { v: T; l: string }[] }) {
  return <div className="seg" role="tablist">{opts.map((o) => <button key={o.v} className={o.v === value ? 'on' : ''} onClick={() => onChange(o.v)}>{o.l}</button>)}</div>;
}
export const Switch = ({ on, onChange, bad, label }: { on: boolean; onChange: (v: boolean) => void; bad?: boolean; label?: string }) => (
  <button type="button" role="switch" aria-checked={on} aria-label={label} className={`switch ${on ? 'on' : ''} ${bad ? 'bad' : ''}`} onClick={() => onChange(!on)} />
);
export const Progress = ({ v, ok }: { v: number; ok?: boolean }) => <div className={`bar ${ok ? 'ok' : ''}`}><i style={{ width: `${Math.min(100, Math.max(0, v * 100))}%` }} /></div>;
export const Empty = ({ children }: { children: ReactNode }) => <div className="empty">{children}</div>;

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k); document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [onClose]);
  return createPortal(
    <div className="sbg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-label={title}>
        <div className="row between" style={{ marginBottom: 14 }}>
          <h2 className="disp" style={{ fontSize: 22, fontWeight: 600 }}>{title}</h2>
          <button className="btn ghost icon sm" onClick={onClose} aria-label="Tutup"><Icon n="x" /></button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

export function Stepper({ value, onChange, max, step = 1, bad, label, decimal = true }: {
  value: string; onChange: (v: string) => void; max: number; step?: number; bad?: boolean; label: string; decimal?: boolean;
}) {
  const num = parseFloat(value.replace(',', '.'));
  const bump = (d: number) => {
    const base = Number.isFinite(num) ? num : 0;
    const nx = Math.min(max, Math.max(0, Math.round((base + d) * 100) / 100));
    onChange(String(nx));
  };
  return (
    <div className={`stepper ${bad ? 'bad' : ''}`}>
      <button type="button" onClick={() => bump(-step)} aria-label={`Kurangi ${label}`}>−</button>
      <input value={value} inputMode={decimal ? 'decimal' : 'numeric'} aria-label={label} placeholder="0" onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.,]/g, ''))} />
      <button type="button" onClick={() => bump(step)} aria-label={`Tambah ${label}`}>+</button>
    </div>
  );
}
