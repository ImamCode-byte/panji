import { useEffect, useState } from 'react';
import { Empty, Icon } from '../components/ui';
import { api } from '../lib/data';
import { useApp } from '../lib/store';
import type { AuditRow } from '../lib/types';

export default function Audit() {
  const { cfg } = useApp();
  const [rows, setRows] = useState<AuditRow[] | null>(null); const [err, setErr] = useState('');
  const load = () => api.audit().then(setRows).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);
  const name = (k: string) => cfg.contests.find((c) => c.key === k)?.name ?? k;
  return (
    <div className="page">
      <div className="page-h"><div><div className="eyebrow">200 aktivitas terakhir</div><h1>Riwayat</h1></div><button className="btn sm" onClick={load}><Icon n="refresh" size={17} />Muat ulang</button></div>
      {err && <div className="card pad chip bad" style={{ height: 'auto' }}>{err}</div>}
      <div className="list">
        {rows?.map((r) => (
          <div key={r.id} className="li" style={{ cursor: 'default' }}>
            <span className={`chip ${r.action === 'hapus' ? 'bad' : r.action === 'ubah' ? 'gold' : 'ok'}`} style={{ width: 52, justifyContent: 'center' }}>{r.action}</span>
            <div className="grow"><div className="trunc" style={{ fontWeight: 650 }}>{r.team} · {name(r.contest)}{r.detail ? ` · ${r.detail}` : ''}</div><div className="xs muted">{r.who}</div></div>
            <div className="xs faint num" style={{ textAlign: 'right' }}>{new Date(r.at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
          </div>
        ))}
        {rows && !rows.length && <Empty>Belum ada aktivitas.</Empty>}
        {!rows && !err && <Empty>Memuat…</Empty>}
      </div>
    </div>
  );
}
