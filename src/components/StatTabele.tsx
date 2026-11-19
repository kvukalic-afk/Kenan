import type { Raspodjela, Statistika, Zbir } from '../lib/statistika';

export function TabelaMjeseci({ s }: { s: Statistika }) {
  const red = (z: Zbir, klasa: string) => (
    <tr className={klasa} key={z.naziv}>
      <td>{z.naziv}</td>
      <td className="n">{z.razgovori}</td>
      <td className="n">{z.radionice}</td>
      <td className="n">{z.ucesnici}</td>
      <td className="n">{z.saradnja}</td>
    </tr>
  );
  return (
    <table className="tabela mjesecna">
      <thead>
        <tr>
          <th>Mjesec</th>
          <th className="n"><span className="dugo">Razgovori</span><span className="kratko">Razg.</span></th>
          <th className="n"><span className="dugo">Radionice</span><span className="kratko">Rad.</span></th>
          <th className="n"><span className="dugo">Učesnici rad.</span><span className="kratko">Učes.</span></th>
          <th className="n"><span className="dugo">Saradnja</span><span className="kratko">Sar.</span></th>
        </tr>
      </thead>
      <tbody>
        {s.mjeseci.map((m) => (
          <tr key={m.kljuc}>
            <td className="mj">{m.naziv} {m.kljuc.slice(0, 4)}.</td>
            <td className="n">{m.razgovori}</td>
            <td className="n">{m.radionice}</td>
            <td className="n">{m.ucesnici}</td>
            <td className="n">{m.saradnja}</td>
          </tr>
        ))}
        {red(s.polugodisteI, 'zbir')}
        {red(s.polugodisteII, 'zbir')}
        {red(s.ukupno, 'zbir ukupno')}
      </tbody>
    </table>
  );
}

export function TabelaRaspodjele({ naslov, podaci }: { naslov: string; podaci: Raspodjela[] }) {
  const ukupno = podaci.reduce((s, p) => s + p.broj, 0);
  return (
    <table className="tabela">
      <thead>
        <tr><th>{naslov}</th><th className="n">Broj</th><th className="n">%</th></tr>
      </thead>
      <tbody>
        {podaci.length === 0 && <tr><td colSpan={3}>Nema podataka.</td></tr>}
        {podaci.map((p) => (
          <tr key={p.naziv}><td>{p.naziv}</td><td className="n">{p.broj}</td><td className="n">{Math.round((p.broj / ukupno) * 100)}</td></tr>
        ))}
        {podaci.length > 0 && <tr className="zbir"><td>Ukupno</td><td className="n">{ukupno}</td><td className="n">100</td></tr>}
      </tbody>
    </table>
  );
}
