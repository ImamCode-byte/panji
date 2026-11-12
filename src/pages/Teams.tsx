import { useState } from 'react';
import { Empty, Icon, Sheet, Switch } from '../components/ui';
import { api } from '../lib/data';
import { useApp } from '../lib/store';
import type { Team } from '../lib/types';

type Draft = { id?: string; no: string; name: string; pangkalan: string; gudep: string; alamat: string; dq: boolean };
const pad2 = (n: number | string) => String(n).padStart(2, '0');
const blank = (no: number): Draft => ({ no: pad2(no), name: '', pangkalan: '', gudep: '', alamat: '', dq: false });

export default function Teams() {
  const { teams, act, toast, st } = useApp();
  const [q, setQ] = useState(''); const [d, setD] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const rows = teams.filter((t) => `${pad2(t.no)} ${t.no} ${t.name} ${t.pangkalan} ${t.gudep} ${t.alamat ?? ''}`.toLowerCase().includes(q.toLowerCase()));
  const nextNo = Math.max(0, ...teams.map((t) => t.no)) + 1;
  const edit = (t: Team) => setD({ id: t.id, no: pad2(t.no), name: t.name, pangkalan: t.pangkalan, gudep: t.gudep, alamat: t.alamat ?? '', dq: t.dq });
  const save = async () => {
    if (!d) return; const no = parseInt(d.no, 10);
    if (!Number.isInteger(no) || no < 1) return toast('Nomor kavling tidak valid', 'err');
    if (!d.name.trim()) return toast('Nama regu wajib diisi', 'err');
    setBusy(true);
    try {
      await act(() => api.saveTeam({ id: d.id, no, name: d.name.trim(), pangkalan: d.pangkalan.trim(), gudep: d.gudep.trim(), alamat: d.alamat.trim(), dq: d.dq, tie_order: null }));
      toast('Regu tersimpan'); setD(null);
    } catch (e) { toast((e as Error).message, 'err'); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!d?.id || !confirm('Hapus regu beserta seluruh nilainya?')) return;
    try { await act(() => api.deleteTeam(d.id!)); toast('Regu dihapus'); setD(null); } catch (e) { toast((e as Error).message, 'err'); }
  };
  const rankOf = new Map(st.rows.map((r) => [r.team.id, r]));
  return (
    <div className="page">
      <div className="page-h"><div><div className="eyebrow">{teams.length} regu</div><h1>Data regu</h1></div>
        <div className="row"><button className="btn primary sm" onClick={() => setD(blank(nextNo))}><Icon n="plus" size={17} />Tambah</button></div></div>
      <div className="stack">
        <div className="search"><Icon n="search" size={18} /><input className="input" placeholder="Cari nomor kavling, regu, pangkalan, alamat" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="list">
          {rows.map((t) => (
            <button key={t.id} className="li" onClick={() => edit(t)}>
              <span className="noBadge">{pad2(t.no)}</span>
              <div className="grow"><div className="trunc" style={{ fontWeight: 700 }}>{t.name}</div><div className="trunc xs muted">{t.pangkalan}{t.gudep ? ` · Gudep ${t.gudep}` : ''}{t.alamat ? ` · ${t.alamat}` : ''}</div></div>
              {t.dq && <span className="chip bad">Diskualifikasi</span>}
              {!t.dq && rankOf.get(t.id)?.done ? <span className="chip">{rankOf.get(t.id)!.done} lomba</span> : null}
              <Icon n="pencil" size={17} />
            </button>
          ))}
          {!rows.length && <Empty>{teams.length ? 'Tidak ditemukan.' : 'Belum ada regu. Tambah dari tombol di atas.'}</Empty>}
        </div>
        <p className="xs faint">Dua regu dari pangkalan yang sama (nama pangkalan persis sama) otomatis dihitung untuk Pangkalan Favorit.</p>
      </div>

      {d && <Sheet title={d.id ? 'Ubah regu' : 'Tambah regu'} onClose={() => setD(null)}>
        <div className="stack">
          <div className="grid g2" style={{ gap: 10 }}>
            <div className="field">
              <label>Nomor Kavling</label>
              <input
                className="input"
                inputMode="numeric"
                placeholder="01"
                value={d.no}
                onChange={(e) => setD({ ...d, no: e.target.value.replace(/\D/g, '') })}
                onBlur={() => { if (d.no) setD({ ...d, no: pad2(d.no) }); }}
              />
            </div>
            <div className="field"><label>Gugusdepan</label><input className="input" value={d.gudep} onChange={(e) => setD({ ...d, gudep: e.target.value })} /></div>
          </div>
          <div className="field"><label>Nama regu</label><input className="input" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></div>
          <div className="field"><label>Pangkalan / utusan</label><input className="input" value={d.pangkalan} onChange={(e) => setD({ ...d, pangkalan: e.target.value })} /></div>
          <div className="field"><label>Alamat / asal</label><input className="input" placeholder="Misal: Kec. Larangan, Pamekasan" value={d.alamat} onChange={(e) => setD({ ...d, alamat: e.target.value })} /></div>
          <div className="row between"><div><b>Diskualifikasi dari perkemahan</b><div className="xs muted">Keluar dari klasemen umum</div></div><Switch bad on={d.dq} onChange={(v) => setD({ ...d, dq: v })} label="Diskualifikasi" /></div>
          <div className="row" style={{ marginTop: 6 }}>{d.id && <button className="btn danger" onClick={remove}><Icon n="trash" size={17} /></button>}<button className="btn primary grow" disabled={busy} onClick={save}>{busy ? 'Menyimpan…' : 'Simpan'}</button></div>
        </div>
      </Sheet>}
    </div>
  );
}
