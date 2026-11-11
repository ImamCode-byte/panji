import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Cert } from '../components/Cert';
import { Icon } from '../components/ui';
import { buildCerts, type CertSet } from '../lib/certs';
import { useApp } from '../lib/store';

export default function Print() {
  const { st, cfg, teams, booting } = useApp();
  const [sp] = useSearchParams();
  const set = (sp.get('set') ?? 'awards') as CertSet; const team = sp.get('team');
  const items = useMemo(() => buildCerts(set, st, cfg, teams).filter((c) => !team || c.teamId === team), [set, st, cfg, teams, team]);
  if (booting) return null;
  return (
    <div className="page" style={{ paddingBottom: 40 }}>
      <div className="no-print page-h">
        <div><Link to="/app/juara" className="btn ghost sm" style={{ marginLeft: -10 }}><Icon n="back" size={18} />Juara</Link><h1>Pratinjau cetak</h1>
          <p className="xs muted" style={{ marginTop: 4 }}>{items.length} lembar · A4 lanskap. Pilih “Simpan sebagai PDF” untuk berkas digital. Matikan header/footer di dialog cetak.</p></div>
        <div className="row wrap">
          <Link to="/app/pengaturan?tab=s" className="btn sm"><Icon n="sliders" size={17} />Desain sertifikat</Link>
          <button className="btn primary" disabled={!items.length} onClick={() => window.print()}><Icon n="print" size={18} />Cetak</button>
        </div>
      </div>
      {!items.length && <div className="card pad empty">Belum ada yang dicetak. Nilai belum masuk.</div>}
      {items.map((c, i) => <Cert key={i} c={c} ev={cfg.event} certCfg={cfg.certificate} />)}
    </div>
  );
}
