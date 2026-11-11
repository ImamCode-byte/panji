import type { CertItem } from '../lib/certs';
import type { Config } from '../lib/types';

export function Cert({ c, certCfg }: { c: CertItem; ev?: Config['event']; certCfg?: Config['certificate'] }) {
  const bg = certCfg?.bgWinner || certCfg?.bgParticipant;
  const offsetX = certCfg?.textOffsetX ?? 0;
  const offsetY = certCfg?.textOffsetY ?? 0;
  const textAlign = certCfg?.textAlign ?? 'center';

  return (
    <div className="cert-wrap">
      <div
        className={`cert no-border ${bg ? 'has-bg' : ''}`}
        style={bg ? { backgroundImage: `url(${bg})`, backgroundSize: '100% 100%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' } : undefined}
      >
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
      </div>
    </div>
  );
}
