import type { CertItem } from '../lib/certs';
import type { Config } from '../lib/types';

export function Cert({ c, ev, certCfg }: { c: CertItem; ev: Config['event']; certCfg?: Config['certificate'] }) {
  const win = c.kind === 'Sertifikat Kejuaraan';
  const bg = win ? (certCfg?.bgWinner || certCfg?.bgParticipant) : (certCfg?.bgParticipant || certCfg?.bgWinner);
  const hideBorder = certCfg?.hideBorders || Boolean(bg);
  const hideSig = certCfg?.hideSignatures;
  const hideBoilerplate = certCfg?.hideBoilerplate ?? true;
  const offsetX = certCfg?.textOffsetX ?? 0;
  const offsetY = certCfg?.textOffsetY ?? 0;
  const textAlign = certCfg?.textAlign ?? 'center';

  return (
    <div className="cert-wrap">
      <div
        className={`cert ${hideBorder ? 'no-border' : ''} ${bg ? 'has-bg' : ''}`}
        style={bg ? { backgroundImage: `url(${bg})`, backgroundSize: '100% 100%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' } : undefined}
      >
        {hideBoilerplate ? (
          <div
            className="cert-dynamic"
            style={{
              transform: `translate(${offsetX}cqw, ${offsetY}cqw)`,
              textAlign,
              width: '100%',
              margin: 'auto 0',
            }}
          >
            <div className="nm">{c.name}</div>
            <div className="pg">{c.pangkalan}</div>
            <div className="jr">{c.label}</div>
          </div>
        ) : (
          <>
            <div className="k">{ev.short} · Tingkat Penggalang</div>
            <div className="ti">{c.kind}</div>
            <div className="sm1">{win ? 'Diberikan kepada' : 'Diberikan kepada regu'}</div>
            <div className="nm">{c.name}</div>
            <div className="pg">{c.pangkalan}</div>
            <div className="sm1" style={{ marginTop: '1.6cqw' }}>{win ? 'yang telah meraih' : 'sebagai'}</div>
            <div className="jr">{c.label}</div>
            <div className="ev">pada Perkemahan Ajang Silaturahim dan Persahabatan {ev.name} Tingkat Penggalang SMP/MTs Se-Jawa Timur · {ev.lokasi} · {ev.tanggal}</div>
          </>
        )}
        {!hideSig && (
          <div className="sg">
            <div>Ka. Mabigus<b>{ev.mabigus}</b></div>
            <div>Ketua Panitia<b>{ev.ketua}</b></div>
          </div>
        )}
      </div>
    </div>
  );
}
