import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Ikona } from '../components/Ikona';
import { Grafikon } from '../components/Polja';
import { Zaglavlje } from '../components/Okvir';
import { TabelaMjeseci } from '../components/StatTabele';
import { useToast } from '../components/Toast';
import { danasIso, nazivSkolskeGodine, skolskaGodinaZaDatum, skolskaGodinaZaIso } from '../lib/datum';
import { izracunajStatistiku, NAZIV_PERIODA, type Period } from '../lib/statistika';
import { snimakBaze, usePostavke } from '../lib/podaci';
import { preuzmi } from '../lib/preuzimanje';
import { napraviExcel, nazivExcelFajla } from '../lib/excel';

export function Statistika() {
  const toast = useToast();
  const postavke = usePostavke();
  const [godina, setGodina] = useState<number | null>(null);
  const [period, setPeriod] = useState<Period>('godina');
  const [izvoz, setIzvoz] = useState(false);
  const podaci = useLiveQuery(async () => {
    const [ucenici, razgovori, radionice, saradnja, aktivnosti] = await Promise.all([db.ucenici.toArray(), db.razgovori.toArray(), db.radionice.toArray(), db.saradnja.toArray(), db.aktivnosti.toArray()]);
    return { ucenici, razgovori, radionice, saradnja, aktivnosti };
  }, []);

  const izabrana = godina ?? postavke.skolskaGodinaPocetak;
  const godine = useMemo(() => {
    const g = new Set<number>([postavke.skolskaGodinaPocetak, skolskaGodinaZaDatum(new Date())]);
    for (const z of [...(podaci?.razgovori ?? []), ...(podaci?.radionice ?? []), ...(podaci?.saradnja ?? []), ...(podaci?.aktivnosti ?? [])]) {
      const sg = skolskaGodinaZaIso(z.datum);
      if (sg) g.add(sg);
    }
    return [...g].sort((a, b) => b - a);
  }, [podaci, postavke.skolskaGodinaPocetak]);

  if (!podaci) return <Zaglavlje naslov="Statistika" />;
  const s = izracunajStatistiku(podaci, izabrana, period);

  const excel = async () => {
    setIzvoz(true);
    try {
      const data = await napraviExcel(await snimakBaze(), izabrana, postavke.imenaUDokumentima !== false);
      preuzmi(data as BlobPart, nazivExcelFajla(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      toast('Excel fajl je preuzet ✓');
    } catch (e) {
      toast('Izvoz nije uspio: ' + (e as Error).message, 'greska');
    } finally {
      setIzvoz(false);
    }
  };

  return (
    <>
      <Zaglavlje naslov="Statistika" />
      <main className="sadrzaj sirok">
        <div className="mreza-2" style={{ marginBottom: 12 }}>
          <label>
            <span className="malo blijedo">Školska godina</span>
            <select value={izabrana} onChange={(e) => setGodina(Number(e.target.value))}>
              {godine.map((g) => <option key={g} value={g}>{nazivSkolskeGodine(g)}</option>)}
            </select>
          </label>
          <div>
            <span className="malo blijedo">Raspodjele i brojevi za</span>
            <div className="chipovi">
              {(['godina', 'I', 'II'] as Period[]).map((p) => (
                <button key={p} type="button" className="chip mali" aria-pressed={period === p} onClick={() => setPeriod(p)}>{NAZIV_PERIODA[p]}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="red-dugmadi" style={{ marginBottom: 16 }}>
          <a className="dugme" href={`#/print/izvjestaj/${izabrana}/godina`}><Ikona ime="print" /> Preuzmi godišnji izvještaj (print)</a>
          <a className="dugme" href={`#/print/izvjestaj/${izabrana}/${period === 'II' ? 'II' : 'I'}`}><Ikona ime="print" /> Preuzmi polugodišnji izvještaj (print)</a>
          <a className="dugme" href="#/izvjestaj"><Ikona ime="kalendar" /> Dnevni / sedmični izvještaj</a>
          <a className="dugme" href={`#/plan?godina=${izabrana}`}><Ikona ime="aktivnost" /> Plan rada</a>
          <a className="dugme" href={`#/print/dnevnik/${danasIso().slice(0, 7)}`}><Ikona ime="print" /> Dnevnik rada (ovaj mjesec)</a>
          <button type="button" className="dugme" onClick={excel} disabled={izvoz}><Ikona ime="excel" /> {izvoz ? 'Pravim…' : 'Izvezi sve u Excel'}</button>
        </div>

        <div className="brojke">
          <div className="brojka"><div className="v">{s.razlicitihUcenika}</div><div className="o">različitih učenika s kojima je rađeno ({NAZIV_PERIODA[period]})</div></div>
          <div className="brojka"><div className="v">{s.ucenikaURazgovorima}</div><div className="o">učenika u razgovorima</div></div>
          <div className="brojka"><div className="v">{s.uPracenju}</div><div className="o">učenika u praćenju (sada)</div></div>
          <div className="brojka"><div className="v">{s.aktivnihUcenika}</div><div className="o">ukupno učenika (aktivni{s.ukupnoUcenika !== s.aktivnihUcenika ? `; svih ${s.ukupnoUcenika}` : ''})</div></div>
        </div>

        <section className="kartica" style={{ padding: 0, overflow: 'hidden' }}>
          <h2 style={{ padding: '14px 16px 0' }}>Po mjesecima – {nazivSkolskeGodine(izabrana)}</h2>
          <div style={{ overflowX: 'auto' }}><TabelaMjeseci s={s} /></div>
        </section>

        <div className="grafikoni">
          <Grafikon naslov="Razgovori po razlogu" podaci={s.poRazlogu} />
          <Grafikon naslov="Razgovori po vrsti kontakta" podaci={s.poVrstiKontakta} />
          <Grafikon naslov="Status slučajeva (zadnji razgovor po učeniku)" podaci={s.statusSlucajeva} />
          <Grafikon naslov="Radionice po oblasti" podaci={s.radionicePoOblasti} />
          <Grafikon naslov="Saradnja po ustanovi / osobi" podaci={s.saradnjaPoUstanovi} />
          <Grafikon naslov="Ostale aktivnosti po vrsti" podaci={s.aktivnostiPoVrsti} />
        </div>
      </main>
    </>
  );
}
