import { useState } from 'react';
import { Empty, Icon, Sheet, Switch } from '../components/ui';
import { api } from '../lib/data';
import { useApp } from '../lib/store';
import type { Team } from '../lib/types';

type Draft = { id?: string; no: string; name: string; pangkalan: string; gudep: string; dq: boolean; tie: string };
const blank = (no: number): Draft => ({ no: String(no), name: '', pangkalan: '', gudep: '', dq: false, tie: '' });

export default function Teams() {
  const { teams, act, toast, st } = useApp();
  const [q, setQ] = useState(''); const [d, setD] = useState<Draft | null>(null); const [imp, setImp] = useState(false);
  const [txt, setTxt] = useState(''); const [busy, setBusy] = useState(false);
  const rows = teams.filter((t) => `${t.no} ${t.name} ${t.pangkalan} ${t.gudep}`.toLowerCase().includes(q.toLowerCase()));
  const nextNo = Math.max(0, ...teams.map((t) => t.no)) + 1;
  const edit = (t: Team) => setD({ id: t.id, no: String(t.no), name: t.name, pangkalan: t.pangkalan, gudep: t.gudep, dq: t.dq, tie: t.tie_order == null ? '' : String(t.tie_order) });
  const save = async () => {
    if (!d) return; const no = parseInt(d.no, 10);
    if (!Number.isInteger(no) || no < 1) return toast('Nomor tidak valid', 'err');
    if (!d.name.trim()) return toast('Nama regu wajib diisi', 'err');
    setBusy(true);
    try {
      await act(() => api.saveTeam({ id: d.id, no, name: d.name.trim(), pangkalan: d.pangkalan.trim(), gudep: d.gudep.trim(), dq: d.dq, tie_order: d.tie.trim() ? parseInt(d.tie, 10) : null }));
      toast('Regu tersimpan'); setD(null);
    } catch (e) { toast((e as Error).message, 'err'); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!d?.id || !confirm('Hapus regu beserta seluruh nilainya?')) return;
    try { await act(() => api.deleteTeam(d.id!)); toast('Regu dihapus'); setD(null); } catch (e) { toast((e as Error).message, 'err'); }
  };
  const parsed = txt.split('\n').map((l) => l.split(/\t|;|,(?=\s*\S)/).map((x) => x.trim())).filter((c) => c.length >= 2 && /^\d+$/.test(c[0]))
    .map((c) => ({ no: parseInt(c[0], 10), name: c[1], pangkalan: c[2] ?? '', gudep: c[3] ?? '' }));
  const doImport = async () => {
    setBusy(true);
    try { await act(() => api.importTeams(parsed)); toast(`${parsed.length} regu diimpor`); setImp(false); setTxt(''); } catch (e) { toast((e as Error).message, 'err'); } finally { setBusy(false); }
  };
  const rankOf = new Map(st.rows.map((r) => [r.team.id, r]));
  return (
    <div className="page">
      <div className="page-h"><div><div className="eyebrow">{teams.length} regu</div><h1>Data regu</h1></div>
        <div className="row"><button className="btn sm" onClick={() => setImp(true)}>Impor</button><button className="btn primary sm" onClick={() => setD(blank(nextNo))}><Icon n="plus" size={17} />Tambah</button></div></div>
      <div className="stack">
        <div className="search"><Icon n="search" size={18} /><input className="input" placeholder="Cari nomor, regu, pangkalan" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="list">
          {rows.map((t) => (
            <button key={t.id} className="li" onClick={() => edit(t)}>
              <span className="noBadge">{t.no}</span>
              <div className="grow"><div className="trunc" style={{ fontWeight: 700 }}>{t.name}</div><div className="trunc xs muted">{t.pangkalan}{t.gudep ? ` · Gudep ${t.gudep}` : ''}</div></div>
              {t.dq && <span className="chip bad">Diskualifikasi</span>}
              {t.tie_order != null && <span className="chip gold">Seri #{t.tie_order}</span>}
              {!t.dq && rankOf.get(t.id)?.done ? <span className="chip">{rankOf.get(t.id)!.done} lomba</span> : null}
              <Icon n="pencil" size={17} />
            </button>
          ))}
          {!rows.length && <Empty>{teams.length ? 'Tidak ditemukan.' : 'Belum ada regu. Tambah atau impor dari daftar peserta.'}</Empty>}
        </div>
        <p className="xs faint">Dua regu dari pangkalan yang sama (nama pangkalan persis sama) otomatis dihitung untuk Pangkalan Favorit.</p>
      </div>

      {d && <Sheet title={d.id ? 'Ubah regu' : 'Tambah regu'} onClose={() => setD(null)}>
        <div className="stack">
          <div className="grid g2" style={{ gap: 10 }}>
            <div className="field"><label>Nomor urut</label><input className="input" inputMode="numeric" value={d.no} onChange={(e) => setD({ ...d, no: e.target.value.replace(/\D/g, '') })} /></div>
            <div className="field"><label>Gugusdepan</label><input className="input" value={d.gudep} onChange={(e) => setD({ ...d, gudep: e.target.value })} /></div>
          </div>
          <div className="field"><label>Nama regu</label><input className="input" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></div>
          <div className="field"><label>Pangkalan / utusan</label><input className="input" value={d.pangkalan} onChange={(e) => setD({ ...d, pangkalan: e.target.value })} /></div>
          <div className="field"><label>Urutan manual saat seri (opsional)</label><input className="input" inputMode="numeric" placeholder="Angka kecil = lebih tinggi" value={d.tie} onChange={(e) => setD({ ...d, tie: e.target.value.replace(/\D/g, '') })} /></div>
          <div className="row between"><div><b>Diskualifikasi dari perkemahan</b><div className="xs muted">Keluar dari klasemen umum</div></div><Switch bad on={d.dq} onChange={(v) => setD({ ...d, dq: v })} label="Diskualifikasi" /></div>
          <div className="row" style={{ marginTop: 6 }}>{d.id && <button className="btn danger" onClick={remove}><Icon n="trash" size={17} /></button>}<button className="btn primary grow" disabled={busy} onClick={save}>{busy ? 'Menyimpan…' : 'Simpan'}</button></div>
        </div>
      </Sheet>}
      {imp && <Sheet title="Impor regu" onClose={() => setImp(false)}>
        <div className="stack">
          <p className="sm muted">Tempel dari Excel atau ketik per baris: <b>nomor, nama regu, pangkalan, gugusdepan</b>. Nomor yang sudah ada akan diperbarui.</p>
          <textarea className="textarea" style={{ minHeight: 180 }} placeholder={'1, Regu Elang, SMPN 1 Pamekasan, 963\n2, Regu Garuda, MTsN 2 Sumenep, 964'} value={txt} onChange={(e) => setTxt(e.target.value)} />
          <div className="xs muted">{parsed.length} baris valid</div>
          <button className="btn primary block" disabled={!parsed.length || busy} onClick={doImport}>{busy ? 'Mengimpor…' : `Impor ${parsed.length} regu`}</button>
        </div>
      </Sheet>}
    </div>
  );
}
