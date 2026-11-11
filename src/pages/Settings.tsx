import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Cert } from '../components/Cert';
import { Icon, Seg, Switch, fmt } from '../components/ui';
import { DEFAULT_CONFIG } from '../lib/contests';
import { api } from '../lib/data';
import { roman } from '../lib/scoring';
import { useApp } from '../lib/store';
import type { Config } from '../lib/types';

const num = (s: string) => { const n = parseFloat(s.replace(',', '.')); return Number.isFinite(n) && n >= 0 ? n : 0; };

function processImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Berkas harus berupa gambar (PNG, JPG, WebP)'));
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        const maxW = 1800;
        if (w > maxW) {
          h = Math.round((h * maxW) / w);
          w = maxW;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Gagal inisialisasi kanvas'));
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Gagal membaca gambar'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal membuka berkas'));
    reader.readAsDataURL(file);
  });
}

const F = ({ l, v, on, hint }: { l: string; v: string; on: (s: string) => void; hint?: string }) => (
  <div className="field"><label>{l}</label><input className="input" value={v} onChange={(e) => on(e.target.value)} />{hint && <span className="xs faint">{hint}</span>}</div>
);
const N = ({ l, v, on }: { l: string; v: number; on: (n: number) => void }) => (
  <div className="field"><label>{l}</label><input className="input" inputMode="decimal" defaultValue={String(v).replace('.', ',')} onChange={(e) => on(num(e.target.value))} /></div>
);

export default function Settings() {
  const { cfg, act, toast, demo, teams } = useApp();
  const [sp] = useSearchParams();
  const [d, setD] = useState<Config>(() => structuredClone(cfg));
  const [tab, setTab] = useState<'e' | 's' | 'l' | 'm' | 'j' | 'd'>(() => {
    const t = sp.get('tab');
    return t === 's' || t === 'e' || t === 'l' || t === 'm' || t === 'j' || t === 'd' ? t : 'e';
  });
  const [previewKind, setPreviewKind] = useState<'win' | 'peserta'>('win');
  const [open, setOpen] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(d) !== JSON.stringify(cfg);
  const save = async () => {
    setBusy(true);
    try { await act(() => api.saveConfig(d)); toast('Pengaturan tersimpan, klasemen dihitung ulang'); } catch (e) { toast((e as Error).message, 'err'); } finally { setBusy(false); }
  };
  const setC = (key: string, fn: (c: Config['contests'][number]) => void) => { const n = structuredClone(d); fn(n.contests.find((c) => c.key === key)!); setD(n); };
  const danger = async (msg: string, fn: () => Promise<unknown>, ok: string) => {
    if (!confirm(msg)) return; try { await act(fn); toast(ok); } catch (e) { toast((e as Error).message, 'err'); }
  };
  return (
    <div className="page" style={{ paddingBottom: 150 }}>
      <div className="page-h"><h1>Pengaturan</h1></div>
      <div className="stack lg" style={{ maxWidth: 820 }}>
        <Seg value={tab} onChange={setTab} opts={[{ v: 'e', l: 'Acara' }, { v: 's', l: 'Sertifikat' }, { v: 'l', l: 'Lomba' }, { v: 'm', l: 'MSC' }, { v: 'j', l: 'Kategori juara' }, { v: 'd', l: 'Data' }]} />

        {tab === 'e' && <div className="card pad stack">
          <F l="Nama acara" v={d.event.name} on={(v) => setD({ ...d, event: { ...d.event, name: v } })} />
          <F l="Judul singkat" v={d.event.short} on={(v) => setD({ ...d, event: { ...d.event, short: v } })} />
          <F l="Tema" v={d.event.tema} on={(v) => setD({ ...d, event: { ...d.event, tema: v } })} />
          <F l="Tanggal" v={d.event.tanggal} on={(v) => setD({ ...d, event: { ...d.event, tanggal: v } })} />
          <F l="Lokasi" v={d.event.lokasi} on={(v) => setD({ ...d, event: { ...d.event, lokasi: v } })} />
          <div className="hr" /><div className="eyebrow">Tanda tangan sertifikat</div>
          <F l="Ketua panitia" v={d.event.ketua} on={(v) => setD({ ...d, event: { ...d.event, ketua: v } })} />
          <F l="Ka. Mabigus" v={d.event.mabigus} on={(v) => setD({ ...d, event: { ...d.event, mabigus: v } })} />
        </div>}

        {tab === 's' && <div className="stack">
          <div className="card pad stack">
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Desain Latar Belakang Sertifikat</div>
              <p className="sm muted" style={{ marginTop: 4 }}>
                Unggah berkas gambar (PNG / JPG / WebP) rasio A4 lanskap (297 × 210 mm) dari Canva, Corel, atau Photoshop.
                Gambar akan menjadi latar belakang cetak, dan nama regu, nomor, pangkalan, serta gelar juara dicetak otomatis di atasnya.
              </p>
            </div>

            <div className="hr" />

            {/* Template Juara */}
            <div className="stack sm">
              <div className="row between wrap">
                <div>
                  <b>Latar Sertifikat Kejuaraan / Juara</b>
                  <div className="xs muted">Untuk semua sertifikat pemenang (Juara Umum, Kategori, Per Lomba, Favorit).</div>
                </div>
                {d.certificate?.bgWinner && (
                  <button
                    type="button"
                    className="btn danger sm"
                    onClick={() => {
                      const c = structuredClone(d.certificate ?? {});
                      delete c.bgWinner;
                      setD({ ...d, certificate: c });
                    }}
                  >
                    <Icon n="trash" size={16} /> Hapus
                  </button>
                )}
              </div>

              {d.certificate?.bgWinner ? (
                <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--line)', maxHeight: 180, textAlign: 'center', background: '#f5f5f5' }}>
                  <img src={d.certificate.bgWinner} alt="Desain Juara" style={{ maxHeight: 180, width: 'auto', objectFit: 'contain' }} />
                </div>
              ) : (
                <div className="empty sm" style={{ border: '2px dashed var(--line)', borderRadius: 10, padding: '16px' }}>
                  <span className="xs muted">Belum ada desain kustom (menggunakan garis & warna bawaan sistem)</span>
                </div>
              )}

              <label className="btn block" style={{ textAlign: 'center', cursor: 'pointer' }}>
                <Icon n="down" size={17} /> {d.certificate?.bgWinner ? 'Ganti berkas desain juara…' : 'Unggah desain sertifikat juara…'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const b64 = await processImage(file);
                      const c = structuredClone(d.certificate ?? {});
                      c.bgWinner = b64;
                      setD({ ...d, certificate: c });
                      toast('Desain juara berhasil dimuat');
                    } catch (err) {
                      toast((err as Error).message, 'err');
                    }
                    e.target.value = '';
                  }}
                />
              </label>
            </div>

            <div className="hr" />

            {/* Template Peserta */}
            <div className="stack sm">
              <div className="row between wrap">
                <div>
                  <b>Latar Sertifikat Peserta / Partisipasi</b>
                  <div className="xs muted">Opsional. Jika kosong, akan otomatis mengikuti desain juara atau template bawaan.</div>
                </div>
                {d.certificate?.bgParticipant && (
                  <button
                    type="button"
                    className="btn danger sm"
                    onClick={() => {
                      const c = structuredClone(d.certificate ?? {});
                      delete c.bgParticipant;
                      setD({ ...d, certificate: c });
                    }}
                  >
                    <Icon n="trash" size={16} /> Hapus
                  </button>
                )}
              </div>

              {d.certificate?.bgParticipant ? (
                <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--line)', maxHeight: 180, textAlign: 'center', background: '#f5f5f5' }}>
                  <img src={d.certificate.bgParticipant} alt="Desain Peserta" style={{ maxHeight: 180, width: 'auto', objectFit: 'contain' }} />
                </div>
              ) : (
                <div className="empty sm" style={{ border: '2px dashed var(--line)', borderRadius: 10, padding: '16px' }}>
                  <span className="xs muted">Mengikuti desain juara atau template bawaan</span>
                </div>
              )}

              <label className="btn block" style={{ textAlign: 'center', cursor: 'pointer' }}>
                <Icon n="down" size={17} /> {d.certificate?.bgParticipant ? 'Ganti berkas desain peserta…' : 'Unggah desain sertifikat peserta…'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const b64 = await processImage(file);
                      const c = structuredClone(d.certificate ?? {});
                      c.bgParticipant = b64;
                      setD({ ...d, certificate: c });
                      toast('Desain peserta berhasil dimuat');
                    } catch (err) {
                      toast((err as Error).message, 'err');
                    }
                    e.target.value = '';
                  }}
                />
              </label>
            </div>

            <div className="hr" />
            <div className="eyebrow">Pengaturan Tampilan Cetak</div>

            <div className="row between">
              <div>
                <b>Sembunyikan garis bingkai bawaan</b>
                <div className="xs muted">Sembunyikan garis ganda bawaan agar tidak menabrak bingkai pada desain Anda.</div>
              </div>
              <Switch
                on={d.certificate?.hideBorders ?? Boolean(d.certificate?.bgWinner || d.certificate?.bgParticipant)}
                onChange={(v) => {
                  const c = structuredClone(d.certificate ?? {});
                  c.hideBorders = v;
                  setD({ ...d, certificate: c });
                }}
                label="Sembunyikan garis bingkai"
              />
            </div>

            <div className="row between">
              <div>
                <b>Sembunyikan garis tanda tangan</b>
                <div className="xs muted">Sembunyikan kolom tanda tangan bawah jika desain sudah memuat tanda tangan atau cap basah.</div>
              </div>
              <Switch
                on={d.certificate?.hideSignatures ?? false}
                onChange={(v) => {
                  const c = structuredClone(d.certificate ?? {});
                  c.hideSignatures = v;
                  setD({ ...d, certificate: c });
                }}
                label="Sembunyikan garis tanda tangan"
              />
            </div>
          </div>

          {/* Pratinjau Langsung */}
          <div className="card pad stack">
            <div className="row between wrap">
              <div>
                <div style={{ fontWeight: 700 }}>Pratinjau Hasil Sertifikat</div>
                <div className="xs muted">Lihat kecocokan posisi teks terhadap desain latar belakang Anda.</div>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <button
                  type="button"
                  className={`btn sm ${previewKind === 'win' ? 'primary' : 'ghost'}`}
                  onClick={() => setPreviewKind('win')}
                >
                  Juara
                </button>
                <button
                  type="button"
                  className={`btn sm ${previewKind === 'peserta' ? 'primary' : 'ghost'}`}
                  onClick={() => setPreviewKind('peserta')}
                >
                  Peserta
                </button>
              </div>
            </div>
            <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--line)' }}>
              <Cert
                c={
                  previewKind === 'win'
                    ? { kind: 'Sertifikat Kejuaraan', label: 'Juara I Lomba LKBB', name: 'Regu Rajawali (Putra)', pangkalan: 'SMP Negeri 1 Pamekasan', teamId: 'sample-preview' }
                    : { kind: 'Sertifikat Kegiatan', label: 'Peserta Perkemahan', name: 'Regu Melati (Putri)', pangkalan: 'MTsN 2 Pamekasan', teamId: 'sample-preview' }
                }
                ev={d.event}
                certCfg={d.certificate}
              />
            </div>
          </div>
        </div>}

        {tab === 'l' && <div className="stack">
          <p className="sm muted">Ubah bobot hanya bila panitia memutuskan berbeda dari juklak. Semua nilai dihitung ulang otomatis.</p>
          {d.contests.map((c) => (
            <div key={c.key} className="card" style={{ overflow: 'hidden' }}>
              <button className="li" onClick={() => setOpen(open === c.key ? null : c.key)}>
                <div className="grow"><b>{c.name}</b><div className="xs muted">{c.stage ? 'Tahap MSC' : c.inRecap ? 'Masuk klasemen umum' : 'Tidak masuk klasemen'}</div></div>
                <Icon n="chev" size={18} />
              </button>
              {open === c.key && <div className="pad stack" style={{ padding: 16, borderTop: '1px solid var(--line)' }}>
                {c.note && <p className="xs muted">{c.note}</p>}
                {(!c.stage || c.key === 'msc_penyisihan') && <div className="row between"><span>{c.key === 'msc_penyisihan' ? 'MSC masuk klasemen umum' : 'Masuk klasemen umum'}</span><Switch on={c.inRecap} onChange={(v) => setC(c.key, (x) => { x.inRecap = v; })} label="Masuk klasemen" /></div>}
                {c.normalizeTo != null && <N l="Skala nilai akhir (normalisasi)" v={c.normalizeTo} on={(n) => setC(c.key, (x) => { x.normalizeTo = n || undefined; })} />}
                {c.criteria.length > 0 && <div className="eyebrow">Bobot kriteria (poin maksimum)</div>}
                <div className="grid g2" style={{ gap: 10 }}>{c.criteria.map((k) => <N key={k.id} l={k.label} v={k.max} on={(n) => setC(c.key, (x) => { x.criteria.find((y) => y.id === k.id)!.max = n; })} />)}</div>
                {c.penalties.length > 0 && <div className="eyebrow">Pengurangan nilai (poin)</div>}
                <div className="grid g2" style={{ gap: 10 }}>{c.penalties.map((p) => <N key={p.id} l={`${p.label}${p.unit ? ` / ${p.unit}` : ''}`} v={p.points} on={(n) => setC(c.key, (x) => { x.penalties.find((y) => y.id === p.id)!.points = n; })} />)}</div>
              </div>}
            </div>
          ))}
        </div>}

        {tab === 'm' && <div className="card pad stack">
          <p className="sm muted">Juklak belum menetapkan cara nilai MSC masuk klasemen. Nilai MSC = rata-rata tertimbang tiga tahap (0–100). Peringkat MSC ditentukan tahap tertinggi yang dicapai.</p>
          <div className="grid g3" style={{ gap: 10 }}>
            <N l="Bobot penyisihan" v={d.msc.wPenyisihan} on={(n) => setD({ ...d, msc: { ...d.msc, wPenyisihan: n } })} />
            <N l="Bobot semifinal" v={d.msc.wSemifinal} on={(n) => setD({ ...d, msc: { ...d.msc, wSemifinal: n } })} />
            <N l="Bobot final" v={d.msc.wFinal} on={(n) => setD({ ...d, msc: { ...d.msc, wFinal: n } })} />
          </div>
          <div className="grid g2" style={{ gap: 10 }}>
            <N l="Lolos ke semifinal (regu)" v={d.msc.qSemi} on={(n) => setD({ ...d, msc: { ...d.msc, qSemi: Math.round(n) } })} />
            <N l="Lolos ke final (regu)" v={d.msc.qFinal} on={(n) => setD({ ...d, msc: { ...d.msc, qFinal: Math.round(n) } })} />
          </div>
        </div>}

        {tab === 'j' && <div className="card">
          <div className="sec-t" style={{ borderRadius: '14px 14px 0 0' }}>Rentang peringkat per kategori</div>
          {d.awards.map((g, i) => (
            <div key={i} className="li" style={{ cursor: 'default' }}>
              <div className="grow"><b>{g.name}</b><div className="xs muted">Peringkat {roman(g.start)}{g.size > 1 ? `–${roman(g.start + g.size - 1)}` : ''} ({g.start}{g.size > 1 ? `–${g.start + g.size - 1}` : ''})</div></div>
              <div style={{ width: 90 }}><input className="input" inputMode="numeric" defaultValue={g.start} aria-label={`Mulai ${g.name}`}
                onChange={(e) => { const n = parseInt(e.target.value, 10); if (n >= 1) { const a = structuredClone(d.awards); a[i].start = n; setD({ ...d, awards: a }); } }} /></div>
            </div>
          ))}
          <p className="xs faint" style={{ padding: 14 }}>Angka di kanan = peringkat awal kategori. Bawaan sudah memperbaiki typo juklak (Harapan Terap XI–XIII, Harapan Madya XXXV–XXXVII, Caraka XXXVIII–XL).</p>
        </div>}

        {tab === 'd' && <div className="stack">
          <div className="card pad stack">
            <b>Konfigurasi</b>
            <button className="btn" onClick={() => { if (confirm('Kembalikan semua bobot ke bawaan juklak?')) setD(structuredClone(DEFAULT_CONFIG)); }}>Kembalikan bobot bawaan juklak</button>
          </div>
          <div className="card pad stack">
            <b>Nilai</b><p className="sm muted">{teams.length} regu terdaftar.</p>
            <button className="btn danger" onClick={() => danger('Hapus SEMUA nilai? Tindakan ini tidak bisa dibatalkan.', () => api.clearScores(), 'Semua nilai dihapus')}><Icon n="trash" size={17} />Hapus semua nilai</button>
          </div>
          {demo && <div className="card pad stack">
            <b>Mode demo</b>
            <button className="btn" onClick={() => danger('Isi data contoh? Nilai yang ada diganti.', async () => api.fillDemo(), 'Data contoh terisi')}>Isi nilai contoh semua lomba</button>
            <button className="btn danger" onClick={() => { if (confirm('Reset seluruh data demo?')) { api.resetDemo(); location.reload(); } }}>Reset data demo</button>
          </div>}
        </div>}
      </div>
      {dirty && <div className="foot"><div className="in"><div className="grow sm" style={{ fontWeight: 600 }}>Ada perubahan belum disimpan</div>
        <button className="btn" onClick={() => setD(structuredClone(cfg))}>Batal</button><button className="btn primary" disabled={busy} onClick={save}>{busy ? 'Menyimpan…' : 'Simpan'}</button></div></div>}
    </div>
  );
}
