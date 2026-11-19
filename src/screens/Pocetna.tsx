import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Ikona } from '../components/Ikona';
import { Prazno } from '../components/Polja';
import { RedStavke, StatusOznaka, Zaglavlje, type StavkaVremena } from '../components/Okvir';
import { danasIso, MJESECI, prikaz, razlikaDana } from '../lib/datum';
import { izracunajZakazano, tekstOznake, zadnjiRazgovorPoUceniku } from '../lib/zakazano';
import { usePostavke } from '../lib/podaci';

export function Pocetna() {
  const postavke = usePostavke();
  const podaci = useLiveQuery(async () => {
    const [razgovori, radionice, saradnja, ucenici] = await Promise.all([
      db.razgovori.toArray(), db.radionice.toArray(), db.saradnja.toArray(), db.ucenici.toArray(),
    ]);
    return { razgovori, radionice, saradnja, ucenici };
  }, []);

  if (!podaci) return <Zaglavlje naslov="Evidencija psihologa" />;

  const danas = danasIso();
  const mjesec = danas.slice(0, 7);
  const razgovoraMjesec = podaci.razgovori.filter((r) => r.datum?.startsWith(mjesec)).length;
  const radionicaMjesec = podaci.radionice.filter((r) => r.datum?.startsWith(mjesec)).length;
  const uPracenju = podaci.ucenici.filter((u) => u.uPracenju).length;
  const otvoreni = [...zadnjiRazgovorPoUceniku(podaci.razgovori).values()].filter((r) => r.statusSlucaja === 'Otvoren').length;
  const zakazano = izracunajZakazano(podaci.razgovori, danas);

  const sve: StavkaVremena[] = [
    ...podaci.razgovori.map((z) => ({ vrsta: 'razgovor' as const, z })),
    ...podaci.radionice.map((z) => ({ vrsta: 'radionica' as const, z })),
    ...podaci.saradnja.map((z) => ({ vrsta: 'saradnja' as const, z })),
  ];
  const nedavno = sve.sort((a, b) => b.z.createdAt.localeCompare(a.z.createdAt)).slice(0, 6);

  const imaPodataka = sve.length > 0 || podaci.ucenici.length > 0;
  const daniOdKopije = postavke.zadnjaKopija ? razlikaDana(postavke.zadnjaKopija.slice(0, 10), danas) : null;
  const podsjetnik = imaPodataka && (daniOdKopije === null || daniOdKopije > 7);
  const nazivMj = MJESECI[Number(mjesec.slice(5)) - 1];

  return (
    <>
      <Zaglavlje naslov="Evidencija psihologa" />
      <main className="sadrzaj">
        {podsjetnik && (
          <div className="obavjestenje upozorenje" role="status">
            <Ikona ime="kopija" />
            <div className="tekst">
              <strong>Napravi rezervnu kopiju</strong>
              <div className="malo">{daniOdKopije === null ? 'Još nije napravljena nijedna rezervna kopija.' : `Zadnja kopija je napravljena prije ${daniOdKopije} dana (${prikaz(postavke.zadnjaKopija)}).`}</div>
              <a className="dugme" style={{ marginTop: 8 }} href="#/postavke?kopija=1">Napravi kopiju</a>
            </div>
          </div>
        )}

        <div className="brzi-unos">
          <a className="dugme primarno" href="#/novi/razgovor"><Ikona ime="razgovor" />+ Razgovor</a>
          <a className="dugme primarno" href="#/novi/radionica"><Ikona ime="radionica" />+ Radionica</a>
          <a className="dugme primarno" href="#/novi/saradnja"><Ikona ime="saradnja" />+ Saradnja</a>
        </div>

        <h2 className="sr-only">Ovaj mjesec</h2>
        <div className="brojke">
          <div className="brojka"><div className="v">{razgovoraMjesec}</div><div className="o">razgovora ({nazivMj})</div></div>
          <div className="brojka"><div className="v">{radionicaMjesec}</div><div className="o">radionica ({nazivMj})</div></div>
          <a className="brojka" href="#/ucenici?filter=pracenje" style={{ textDecoration: 'none' }}><div className="v">{uPracenju}</div><div className="o">učenika u praćenju</div></a>
          <a className="brojka" href="#/ucenici?filter=otvoreni" style={{ textDecoration: 'none' }}><div className="v">{otvoreni}</div><div className="o">otvorenih slučajeva</div></a>
        </div>

        <div className="naslov-sekcije"><h2>Zakazano</h2></div>
        {zakazano.length === 0 ? (
          <Prazno>Nema zakazanih kontakata. Datum sljedećeg kontakta upisuješ u razgovoru.</Prazno>
        ) : (
          <ul className="lista">
            {zakazano.map((z) => (
              <li key={z.sifra}>
                <a className="stavka" href={`#/ucenici/${encodeURIComponent(z.sifra)}`}>
                  <span className="glavno">
                    <span className="red1"><span className="sifra-velika">{z.sifra}</span><span className="blijedo">{z.razred}</span><StatusOznaka status={z.statusSlucaja} /></span>
                    <span className="red2 broj">{prikaz(z.datum)}</span>
                  </span>
                  <span className={`oznaka ${z.oznaka === 'kasni' ? 'crvena' : z.oznaka === 'danas' ? 'narandzasta' : ''}`}>{tekstOznake(z)}</span>
                </a>
              </li>
            ))}
          </ul>
        )}

        <div className="naslov-sekcije"><h2>Nedavno</h2></div>
        {nedavno.length === 0 ? (
          <Prazno>Još nema unosa. Dodaj prvi preko dugmeta +.</Prazno>
        ) : (
          <ul className="lista">
            {nedavno.map((s) => <li key={s.z.id}><RedStavke s={s} /></li>)}
          </ul>
        )}
      </main>
    </>
  );
}
