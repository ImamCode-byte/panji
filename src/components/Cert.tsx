import type { CertItem } from '../lib/certs';
import type { Config } from '../lib/types';

export function Cert({ c, ev }: { c: CertItem; ev: Config['event'] }) {
  const win = c.kind === 'Sertifikat Kejuaraan';
  return (
    <div className="cert-wrap"><div className="cert">
      <div className="k">{ev.short} · Tingkat Penggalang</div>
      <div className="ti">{c.kind}</div>
      <div className="sm1">{win ? 'Diberikan kepada' : 'Diberikan kepada regu'}</div>
      <div className="nm">{c.name}</div>
      <div className="pg">{c.pangkalan}</div>
      <div className="sm1" style={{ marginTop: '1.6cqw' }}>{win ? 'yang telah meraih' : 'sebagai'}</div>
      <div className="jr">{c.label}</div>
      <div className="ev">pada Perkemahan Ajang Silaturahim dan Persahabatan {ev.name} Tingkat Penggalang SMP/MTs Se-Jawa Timur · {ev.lokasi} · {ev.tanggal}</div>
      <div className="sg"><div>Ka. Mabigus<b>{ev.mabigus}</b></div><div>Ketua Panitia<b>{ev.ketua}</b></div></div>
    </div></div>
  );
}
