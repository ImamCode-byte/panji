import type { CertItem } from '../lib/certs';
import type { Config } from '../lib/types';

export function Cert({ c, certCfg }: { c: CertItem; ev?: Config['event']; certCfg?: Config['certificate'] }) {
  const bg = certCfg?.bgWinner || certCfg?.bgParticipant;
  const nameX = certCfg?.nameX ?? certCfg?.textOffsetX ?? 0;
  const nameY = certCfg?.nameY ?? certCfg?.textOffsetY ?? 0;
  const pgX = certCfg?.pangkalanX ?? certCfg?.textOffsetX ?? 0;
  const pgY = certCfg?.pangkalanY ?? certCfg?.textOffsetY ?? 0;
  const awX = certCfg?.awardX ?? certCfg?.textOffsetX ?? 0;
  const awY = certCfg?.awardY ?? certCfg?.textOffsetY ?? 0;
  const textAlign = certCfg?.textAlign ?? 'center';

  return (
    <div className="cert-wrap">
      <div
        className={`cert no-border ${bg ? 'has-bg' : ''}`}
        style={bg ? { backgroundImage: `url(${bg})`, backgroundSize: '100% 100%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' } : undefined}
      >
        <div className="cert-dynamic" style={{ textAlign, width: '100%', margin: 'auto 0' }}>
          <div className="nm" style={{ transform: `translate(${nameX}cqw, ${nameY}cqw)` }}>{c.name}</div>
          <div className="pg" style={{ transform: `translate(${pgX}cqw, ${pgY}cqw)` }}>{c.pangkalan}</div>
          <div className="jr" style={{ transform: `translate(${awX}cqw, ${awY}cqw)` }}>{c.label}</div>
        </div>
      </div>
    </div>
  );
}
