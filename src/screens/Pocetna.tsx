import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Ikona } from '../components/Ikona';
import { RedStavke, StatusOznaka, Zaglavlje, type StavkaVremena } from '../components/Okvir';
import { danasIso, MJESECI, prikaz, razlikaDana } from '../lib/datum';
import { nazivDana } from '../lib/periodIzvjestaj';
import { izracunajZakazano, tekstOznake, zadnjiRazgovorPoUceniku } from '../lib/zakazano';
import { usePostavke } from '../lib/podaci';
import { punoIme } from '../types';

function pozdrav(): string {
  const h = new Date().getHours();
  return h < 10 ? 'Dobro jutro' : h < 18 ? 'Dobar dan' : 'Dobro veče';
}

export function Pocetna() {
  const postavke = usePostavke();
  const podaci = useLiveQuery(async () => {
    const [razgovori, radionice, saradnja, ucenici, aktivnosti, brzeBiljeske] = await Promise.all([
      db.razgovori.toArray(), db.radionice.toArray(), db.saradnja.toArray(), db.ucenici.toArray(), db.aktivnosti.toArray(),
      db.brzeBiljeske.toArray(),
    ]);
    return { razgovori, radionice, saradnja, ucenici, aktivnosti, brzeBiljeske };
  }, []);

  if (!podaci) return <Zaglavlje naslov="Evidencija psihologa" />;

  const danas = danasIso();
  const mjesec = danas.slice(0, 7);
  const zakazano = izracunajZakazano(podaci.razgovori, danas);
  const hitno = zakazano.filter((z) => z.dana <= 0);
  const uskoro = zakazano.filter((z) => z.dana > 0 && z.dana <= 7);
  const poSifri = new Map(podaci.ucenici.map((u) => [u.sifra, u]));
  const imeZa = (sifra: string) => punoIme(poSifri.get(sifra)) || sifra;
  const neobradjene = podaci.brzeBiljeske.filter((b) => !b.obradjena).length;

  const brojke = [
    { v: podaci.razgovori.filter((r) => r.datum?.startsWith(mjesec)).length, o: 'razgovora' },
    { v: podaci.radionice.filter((r) => r.datum?.startsWith(mjesec)).length, o: 'radionica' },
    { v: podaci.ucenici.filter((u) => u.uPracenju).length, o: 'u praćenju', href: '#/ucenici?filter=pracenje' },
    { v: [...zadnjiRazgovorPoUceniku(podaci.razgovori).values()].filter((r) => r.statusSlucaja === 'Otvoren').length, o: 'otvorenih', href: '#/ucenici?filter=otvoreni' },
  ];

  const sve: StavkaVremena[] = [
    ...podaci.razgovori.map((z) => ({ vrsta: 'razgovor' as const, z })),
    ...podaci.radionice.map((z) => ({ vrsta: 'radionica' as const, z })),
    ...podaci.saradnja.map((z) => ({ vrsta: 'saradnja' as const, z })),
    ...podaci.aktivnosti.map((z) => ({ vrsta: 'aktivnost' as const, z })),
  ];
  const nedavno = sve.sort((a, b) => b.z.createdAt.localeCompare(a.z.createdAt)).slice(0, 5);

  const imaPodataka = sve.length > 0 || podaci.ucenici.length > 0;
  const daniOdKopije = postavke.zadnjaKopija ? razlikaDana(postavke.zadnjaKopija.slice(0, 10), danas) : null;
  const podsjetnik = imaPodataka && (daniOdKopije === null || daniOdKopije > 7);
  const ime = postavke.imePsihologa.trim().split(/\s+/)[0];

  return (
    <>
      <Zaglavlje naslov="Evidencija psihologa" />
      <main className="sadrzaj">
        <p className="pozdrav">{pozdrav()}{ime ? `, ${ime}` : ''} <span className="blijedo">· {nazivDana(danas)}, {prikaz(danas)}</span></p>

        <a className="brza-biljeska" href="#/biljeske">
          <Ikona ime="uredi" />
          <span className="rastegni">
            <strong>Brza bilješka</strong>
            <span className="blijedo">Zapiši kako ti dođe – AI će lijepo srediti</span>
          </span>
          {neobradjene > 0 && <span className="znacka" aria-label={`${neobradjene} neobrađenih`}>{neobradjene}</span>}
        </a>

        <div className="brzi-unos">
          <a href="#/novi/razgovor"><Ikona ime="razgovor" />Razgovor</a>
          <a href="#/novi/radionica"><Ikona ime="radionica" />Radionica</a>
          <a href="#/novi/saradnja"><Ikona ime="saradnja" />Saradnja</a>
          <a href="#/novi/aktivnost"><Ikona ime="aktivnost" />Aktivnost</a>
        </div>

        {podsjetnik && (
          <a className="obavjestenje upozorenje" href="#/postavke?kopija=1" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Ikona ime="kopija" />
            <span className="tekst">
              <strong>Napravi rezervnu kopiju</strong>
              <span className="malo" style={{ display: 'block' }}>{daniOdKopije === null ? 'Još nije napravljena nijedna kopija.' : `Zadnja prije ${daniOdKopije} dana.`} Dodirni da napraviš.</span>
            </span>
          </a>
        )}

        <section>
          <div className="naslov-sekcije"><h2>Danas i ove sedmice</h2></div>
          {hitno.length === 0 && uskoro.length === 0 ? (
            <p className="tiho-prazno">Nema zakazanih kontakata za narednih 7 dana.</p>
          ) : (
            <ul className="lista">
              {[...hitno, ...uskoro].map((z) => (
                <li key={z.sifra}>
                  <a className="stavka" href={`#/ucenici/${encodeURIComponent(z.sifra)}`}>
                    <span className="glavno">
                      <span className="red1">{imeZa(z.sifra)} <span className="blijedo" style={{ fontWeight: 400 }}>{z.razred}</span></span>
                      <span className="red2"><StatusOznaka status={z.statusSlucaja} /> {prikaz(z.datum)}</span>
                    </span>
                    <span className={`oznaka ${z.oznaka === 'kasni' ? 'crvena' : z.oznaka === 'danas' ? 'narandzasta' : ''}`}>{tekstOznake(z)}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          {zakazano.length > hitno.length + uskoro.length && (
            <p className="malo blijedo" style={{ marginTop: 6 }}>+ još {zakazano.length - hitno.length - uskoro.length} zakazanih kasnije</p>
          )}
        </section>

        <section>
          <div className="naslov-sekcije"><h2>{MJESECI[Number(mjesec.slice(5)) - 1][0].toUpperCase() + MJESECI[Number(mjesec.slice(5)) - 1].slice(1)}</h2></div>
          <div className="brojke-red">
            {brojke.map((b) => {
              const sadrzaj = (<><span className="v">{b.v}</span><span className="o">{b.o}</span></>);
              return b.href ? <a key={b.o} href={b.href}>{sadrzaj}</a> : <div key={b.o}>{sadrzaj}</div>;
            })}
          </div>
        </section>

        <section>
          <div className="naslov-sekcije"><h2>Nedavno</h2></div>
          {nedavno.length === 0 ? (
            <p className="tiho-prazno">Još nema unosa. Počni brzom bilješkom ili dugmetom iznad.</p>
          ) : (
            <ul className="lista">
              {nedavno.map((s) => <li key={s.z.id}><RedStavke s={s} imeZa={imeZa} /></li>)}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
