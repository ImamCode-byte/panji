import { useState } from 'react';
import { ABBR } from '../lib/contests';
import type { Standings } from '../lib/scoring';
import { fmt, Rank } from './ui';

export interface Line {
  rank: number; no: number; name: string; pangkalan: string; total: number; done: number;
  award: string | null; tie: boolean; out: boolean; s: Record<string, number | null>;
}
export const toLines = (st: Standings): Line[] =>
  st.rows.map((r) => ({ rank: r.rank, no: r.team.no, name: r.team.name, pangkalan: r.team.pangkalan, total: r.total, done: r.done, award: r.award, tie: r.tie, out: r.out, s: r.scores }));

type Rc = { key: string; name: string; max: number };
export function RankTable({ lines, recap, provisional }: { lines: Line[]; recap: Rc[]; provisional?: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!lines.length) return <div className="empty">Tidak ada data.</div>;
  const award = (l: Line) => l.out ? <span className="chip bad">Diskualifikasi</span> : l.award ? <span className={`chip ${l.rank <= 4 ? 'gold' : ''}`}>{l.award}{provisional ? '*' : ''}</span> : null;
  return (
    <>
      <div className="tw show-d">
        <table className="t">
          <thead>
            <tr>
              <th rowSpan={2} className="c" style={{ width: 56, minWidth: 50 }}>Rank</th>
              <th rowSpan={2} className="c" style={{ width: 68, minWidth: 60 }}>No. Kav.</th>
              <th rowSpan={2} className="l" style={{ minWidth: 150 }}>Regu</th>
              <th rowSpan={2} className="l" style={{ minWidth: 160 }}>Pangkalan</th>
              <th colSpan={recap.length} className="grp">Perlombaan</th>
              <th rowSpan={2} style={{ minWidth: 75 }}>Total</th>
              <th rowSpan={2} className="l" style={{ minWidth: 130 }}>Kategori</th>
            </tr>
            <tr>
              {recap.map((r) => <th key={r.key} title={`${r.name} (maks ${r.max})`}>{ABBR[r.key] ?? r.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.no}>
                <td className="c"><Rank n={l.rank} tie={l.tie} /></td>
                <td className="c"><span className="noBadge" style={{ minWidth: 32, height: 26, fontSize: 12 }}>{String(l.no).padStart(2, '0')}</span></td>
                <td className="l"><b>{l.name}</b></td>
                <td className="l muted">{l.pangkalan}</td>
                {recap.map((r) => <td key={r.key} className={l.s[r.key] == null ? 'faint' : ''}>{l.s[r.key] == null ? '·' : fmt(l.s[r.key])}</td>)}
                <td className="tot">{fmt(l.total)}</td>
                <td className="l">{award(l)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="list show-m">
        {lines.map((l) => (
          <div key={l.no} className="sc" onClick={() => setOpen(open === l.no ? null : l.no)} role="button" tabIndex={0}>
            <div className="row">
              <Rank n={l.rank} tie={l.tie} />
              <div className="grow"><div className="trunc" style={{ fontWeight: 700 }}><span className="faint">#{String(l.no).padStart(2, '0')}</span> {l.name}</div><div className="trunc xs muted">{l.pangkalan}</div></div>
              <div style={{ textAlign: 'right' }}><div className="disp num" style={{ fontSize: 22, fontWeight: 600, lineHeight: 1 }}>{fmt(l.total)}</div>{l.done < recap.length && <div className="xs faint">{l.done}/{recap.length} lomba</div>}</div>
            </div>
            {(l.award || l.out) && <div style={{ marginTop: 8 }}>{award(l)}</div>}
            {open === l.no && (
              <div className="bd num">
                {recap.map((r) => <div key={r.key} style={{ display: 'contents' }}><span className="muted">{r.name}</span><b style={{ textAlign: 'right' }} className={l.s[r.key] == null ? 'faint' : ''}>{l.s[r.key] == null ? '—' : fmt(l.s[r.key])}</b></div>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
