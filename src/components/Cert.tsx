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

  const nameSize = certCfg?.nameSize ? `${(certCfg.nameSize / 11.23).toFixed(2)}cqw` : undefined;
  const pgSize = certCfg?.pangkalanSize ? `${(certCfg.pangkalanSize / 11.23).toFixed(2)}cqw` : undefined;
  const awSize = certCfg?.awardSize ? `${(certCfg.awardSize / 11.23).toFixed(2)}cqw` : undefined;

  return (
    <div className="cert-wrap">
      <div
        className={`cert no-border ${bg ? 'has-bg' : ''}`}
        style={bg ? { backgroundImage: `url(${bg})`, backgroundSize: '100% 100%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' } : undefined}
      >
        <div className="cert-dynamic" style={{ textAlign, width: '100%', margin: 'auto 0' }}>
          <div className="nm" style={{ transform: `translate(${nameX}cqw, ${nameY}cqw)`, fontSize: nameSize }}>{c.name}</div>
          <div className="pg" style={{ transform: `translate(${pgX}cqw, ${pgY}cqw)`, fontSize: pgSize }}>{c.pangkalan}</div>
          <div className="jr" style={{ transform: `translate(${awX}cqw, ${awY}cqw)`, fontSize: awSize }}>{c.label}</div>
        </div>
      </div>
    </div>
  );
}
