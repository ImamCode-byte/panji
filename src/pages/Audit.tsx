import { useEffect, useState } from 'react';
import { Empty, Icon, Seg } from '../components/ui';
import { api } from '../lib/data';
import { useApp } from '../lib/store';
import type { AuditRow, LoginLog } from '../lib/types';

export default function Audit() {
  const { cfg, me } = useApp();
  const [tab, setTab] = useState<'score' | 'login'>('score');
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [loginRows, setLoginRows] = useState<LoginLog[] | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const isDev =
    me?.email?.toLowerCase().includes('imamdhespachito001') ||
    me?.username?.toLowerCase() === 'imamdhespachito001' ||
    me?.role === 'admin';

  const loadScores = () => {
    setLoading(true);
    api.audit()
      .then(setRows)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  };

  const loadLogins = () => {
    setLoading(true);
    api.loginLogs()
      .then(setLoginRows)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadScores();
    if (isDev) loadLogins();
  }, [isDev]);

  const reload = () => {
    if (tab === 'score') loadScores();
    else loadLogins();
  };

  const name = (k: string) => cfg.contests.find((c) => c.key === k)?.name ?? k;

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <div className="eyebrow">{tab === 'score' ? 'Aktivitas penilaian' : 'Riwayat login pengakses'}</div>
          <h1>Riwayat</h1>
        </div>
        <button className="btn sm" onClick={reload} disabled={loading}>
          <Icon n="refresh" size={17} />
          {loading ? 'Memuat…' : 'Muat ulang'}
        </button>
      </div>

      {isDev && (
        <div style={{ marginBottom: 16 }}>
          <Seg
            value={tab}
            onChange={setTab}
            opts={[
              { v: 'score', l: 'Penilaian' },
              { v: 'login', l: 'Riwayat Login' },
            ]}
          />
        </div>
      )}

      {err && <div className="card pad chip bad" style={{ height: 'auto', marginBottom: 12 }}>{err}</div>}

      {tab === 'score' && (
        <div className="list">
          {rows?.map((r) => (
            <div key={r.id} className="li" style={{ cursor: 'default' }}>
              <span className={`chip ${r.action === 'hapus' ? 'bad' : r.action === 'ubah' ? 'gold' : 'ok'}`} style={{ width: 52, justifyContent: 'center' }}>{r.action}</span>
              <div className="grow"><div className="trunc" style={{ fontWeight: 650 }}>{r.team} · {name(r.contest)}{r.detail ? ` · ${r.detail}` : ''}</div><div className="xs muted">{r.who}</div></div>
              <div className="xs faint num" style={{ textAlign: 'right' }}>{new Date(r.at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
            </div>
          ))}
          {rows && !rows.length && <Empty>Belum ada aktivitas penilaian.</Empty>}
          {!rows && !err && <Empty>Memuat…</Empty>}
        </div>
      )}

      {tab === 'login' && isDev && (
        <div className="list">
          {loginRows?.map((r) => (
            <div key={r.id} className="li wrap" style={{ cursor: 'default', padding: '12px 14px', alignItems: 'flex-start', gap: 12 }}>
              <span className="noBadge" style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(32,26,19,.08)', flex: 'none' }}>
                <Icon n={r.role === 'admin' ? 'sliders' : 'user'} size={18} />
              </span>
              <div className="grow" style={{ minWidth: 200 }}>
                <div className="row wrap" style={{ gap: 6, alignItems: 'center' }}>
                  <b style={{ fontSize: 14 }}>{r.name || r.username}</b>
                  <span className={`chip ${r.role === 'admin' ? 'gold' : ''}`} style={{ fontSize: 10, padding: '2px 7px', height: 'auto' }}>{r.role}</span>
                  <span className="xs muted">({r.email || r.username})</span>
                  {r.source === 'gps' ? (
                    <span className="chip ok" style={{ fontSize: 10, padding: '2px 6px', height: 'auto' }} title={`Akurasi GPS ±${r.accuracy ?? 10} meter dari sensor perangkat`}>
                      <Icon n="check" size={11} /> GPS Akurat {r.accuracy ? `(±${r.accuracy}m)` : ''}
                    </span>
                  ) : (
                    <span className="chip" style={{ fontSize: 10, padding: '2px 6px', height: 'auto', background: '#ece3cf' }} title="Perkiraan berdasarkan IP Provider">
                      🌐 Perkiraan IP
                    </span>
                  )}
                </div>
                <div className="xs muted" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 5, alignItems: 'center' }}>
                  <span>📱 {r.device || 'Perangkat'}</span>
                  {r.ip && <span>🌐 IP: {r.ip}</span>}
                  {r.city && r.city !== 'Tidak diketahui' && <span>📍 {r.city}{r.region ? `, ${r.region}` : ''}</span>}
                </div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flex: 'none' }}>
                <div className="xs faint num">{new Date(r.at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                {r.maps_url ? (
                  <a
                    href={r.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`btn sm ${r.source === 'gps' ? 'primary' : ''}`}
                    style={{ fontSize: 11, padding: '3px 8px', height: 26, textDecoration: 'none', fontWeight: 650 }}
                    title={r.source === 'gps' ? 'Buka koordinat GPS akurat di Google Maps' : 'Buka perkiraan area di Google Maps'}
                  >
                    <Icon n="globe" size={13} />
                    <span>{r.source === 'gps' ? 'Titik GPS Akurat' : 'Buka Lokasi'}</span>
                  </a>
                ) : (
                  <span className="xs faint">Tanpa peta</span>
                )}
              </div>
            </div>
          ))}
          {loginRows && !loginRows.length && <Empty>Belum ada riwayat login tercatat.</Empty>}
          {!loginRows && !err && <Empty>Memuat…</Empty>}
        </div>
      )}
    </div>
  );
}
