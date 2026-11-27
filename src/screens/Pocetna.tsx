import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Ikona } from '../components/Ikona';
import { Modal } from '../components/Polja';
import { AIGreskaBlok, AIRazmislja, RucniAI, useAIPoziv } from '../components/AIRad';
import { RedStavke, Zaglavlje, type StavkaVremena } from '../components/Okvir';
import { danasIso, MJESECI, prikaz, razlikaDana } from '../lib/datum';
import { nazivDana } from '../lib/periodIzvjestaj';
import { tekstOznake, zadnjiRazgovorPoUceniku } from '../lib/zakazano';
import { usePostavke } from '../lib/podaci';
import { punoIme } from '../types';
import { useKontrola } from '../lib/useKontrola';
import { sljedeceObaveze, spremnost } from '../lib/dokumentacija';
import { brifingZaAI, napraviBrifing, type Brifing } from '../lib/brifing';
import { BRIFING_SISTEM } from '../lib/aiAlati';
import { nazivAI } from '../lib/ai';

function pozdrav(): string {
  const h = new Date().getHours();
  return h < 10 ? 'Dobro jutro' : h < 18 ? 'Dobar dan' : 'Dobro veče';
}

const PIN_PODSJETNIK = 'pin-podsjetnik-skriven';
function pinPodsjetnikSkriven(): boolean {
  try { return localStorage.getItem(PIN_PODSJETNIK) === '1'; } catch { return false; }
}

const mn = (n: number, jedan: string, dva: string, pet: string) => (n % 10 === 1 && n % 100 !== 11 ? jedan : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? dva : pet);

export function Pocetna() {
  const postavke = usePostavke();
  const kon = useKontrola();
  const [bezPinaSkriveno, setBezPinaSkriveno] = useState(pinPodsjetnikSkriven);
  const [aiBrifing, setAiBrifing] = useState(false);
  const pinUkljucen = useLiveQuery(async () => !!(await db.postavke.get('postavke'))?.pinHash, []);
  const podaci = useLiveQuery(async () => {
    const [razgovori, radionice, saradnja, ucenici, aktivnosti, brzeBiljeske] = await Promise.all([
      db.razgovori.toArray(), db.radionice.toArray(), db.saradnja.toArray(), db.ucenici.toArray(), db.aktivnosti.toArray(),
      db.brzeBiljeske.toArray(),
    ]);
    return { razgovori, radionice, saradnja, ucenici, aktivnosti, brzeBiljeske };
  }, []);

  if (!podaci || !kon) return <Zaglavlje naslov="Evidencija psihologa" />;

  const danas = danasIso();
  const mjesec = danas.slice(0, 7);
  const poSifri = new Map(podaci.ucenici.map((u) => [u.sifra, u]));
  const imeZa = (sifra: string) => punoIme(poSifri.get(sifra)) || sifra;
  const b = napraviBrifing({
    danas, razgovori: podaci.razgovori, biljeske: podaci.brzeBiljeske, ucenici: podaci.ucenici,
    ulaz: podaci, obaveze: kon.stanje, pocetakRada: postavke.pocetakRada,
  });

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
  const nedavno = sve.sort((a, c) => c.z.createdAt.localeCompare(a.z.createdAt)).slice(0, 5);
  const imaPodataka = sve.length > 0 || podaci.ucenici.length > 0;
  const daniOdKopije = postavke.zadnjaKopija ? razlikaDana(postavke.zadnjaKopija.slice(0, 10), danas) : null;
  const kopijaPodsjetnik = imaPodataka && (daniOdKopije === null || daniOdKopije > 7);
  const ime = postavke.imePsihologa.trim().split(/\s+/)[0];
  const pct = spremnost(kon.stanje);

  const hitnih = b.kontakti.filter((k) => k.dana <= 0).length + b.obaveze.filter((o) => o.kasni).length;
  const sazetak = [
    b.kontakti.length && `${b.kontakti.length} ${mn(b.kontakti.length, 'kontakt', 'kontakta', 'kontakata')}`,
    b.obaveze.length && `${b.obaveze.length} ${mn(b.obaveze.length, 'rok', 'roka', 'rokova')}`,
    b.neobradjene && `${b.neobradjene} ${mn(b.neobradjene, 'bilješka', 'bilješke', 'bilješki')}`,
  ].filter(Boolean).join(' · ');

  return (
    <>
      <Zaglavlje naslov="Evidencija psihologa" />
      <main className="sadrzaj pocetna">
        <section className="hero">
          <div className="hero-vrh">
            <span className="hero-datum"><Ikona ime="sunce" /> {nazivDana(danas)}, {prikaz(danas)}</span>
            {hitnih > 0 && <span className="hero-hitno">{hitnih} {mn(hitnih, 'hitna stvar', 'hitne stvari', 'hitnih stvari')}</span>}
          </div>
          <h2 className="hero-pozdrav">{pozdrav()}{ime ? `, ${ime}` : ''}</h2>
          <p className="hero-sazetak">{sazetak || 'Danas nema zakazanih obaveza. Mirno je ✓'}</p>
          <button type="button" className="hero-ai" onClick={() => setAiBrifing(true)}>
            <Ikona ime="iskra" /> Šta da danas prvo uradim?
          </button>
        </section>

        <a className="brza-biljeska" href="#/biljeske">
          <span className="bb-ikona"><Ikona ime="uredi" /></span>
          <span className="rastegni">
            <strong>Brza bilješka</strong>
            <span className="blijedo">Zapiši ili izdiktiraj – AI će lijepo srediti</span>
          </span>
          {b.neobradjene > 0 && <span className="znacka" aria-label={`${b.neobradjene} neobrađenih`}>{b.neobradjene}</span>}
        </a>

        <div className="brzi-unos">
          <a href="#/novi/razgovor"><span className="bu-ikona razgovor"><Ikona ime="razgovor" /></span>Razgovor</a>
          <a href="#/novi/radionica"><span className="bu-ikona radionica"><Ikona ime="radionica" /></span>Radionica</a>
          <a href="#/novi/saradnja"><span className="bu-ikona saradnja"><Ikona ime="saradnja" /></span>Saradnja</a>
          <a href="#/novi/aktivnost"><span className="bu-ikona aktivnost"><Ikona ime="aktivnost" /></span>Aktivnost</a>
        </div>

        <BrifingKartice b={b} imeZa={imeZa} />

        <div className="dvije-kartice">
          <a className="podsjetnik-kartica" href="#/dokumentacija">
            <div className="prsten mali" style={{ ['--pct' as string]: `${pct}` }}><span>{pct}%</span></div>
            <span className="rastegni">
              <strong>Dokumentacija</strong>
              {sljedeceObaveze(kon.stanje, 1).map((o) => (
                <span key={o.id} className={`podsjetnik-red ${o.kasni ? 'kasni' : o.danaDoRoka <= 7 ? 'uskoro' : ''}`}>{o.kasni ? '⚠ ' : ''}{o.def.naziv}</span>
              ))}
            </span>
          </a>
          <a className="podsjetnik-kartica ai-kartica" href="#/ai">
            <span className="ai-kartica-ikona"><Ikona ime="iskra" /></span>
            <span className="rastegni"><strong>Pametni alati</strong><span className="podsjetnik-red">plan rada, diktat dana, zapisnici, letci</span></span>
          </a>
        </div>
        <a className="podsjetnik-kartica instr-kartica" href="#/instrumenti">
          <span className="instr-kartica-ikona" aria-hidden>🧪</span>
          <span className="rastegni"><strong>Psihološki instrumenti</strong><span className="podsjetnik-red">upitnici za print, bodovanje, sociometrija razreda</span></span>
          <Ikona ime="desno" />
        </a>

        {imaPodataka && pinUkljucen === false && !bezPinaSkriveno && (
          <div className="obavjestenje upozorenje">
            <Ikona ime="brava" />
            <span className="tekst">
              <strong>PIN nije uključen na ovom uređaju</strong>
              <span className="malo" style={{ display: 'block' }}>U appu su povjerljivi podaci. PIN se ne prenosi rezervnom kopijom, pa ga na svakom uređaju uključiš posebno.</span>
              <span className="red-dugmadi" style={{ marginTop: 6 }}>
                <a className="dugme primarno malo" href="#/postavke">Uključi PIN</a>
                <button type="button" className="dugme tiho malo" onClick={() => { try { localStorage.setItem(PIN_PODSJETNIK, '1'); } catch { /* ignore */ } setBezPinaSkriveno(true); }}>Ne sada</button>
              </span>
            </span>
          </div>
        )}

        {kopijaPodsjetnik && (
          <a className="obavjestenje upozorenje" href="#/postavke?kopija=1" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Ikona ime="kopija" />
            <span className="tekst">
              <strong>Napravi rezervnu kopiju</strong>
              <span className="malo" style={{ display: 'block' }}>{daniOdKopije === null ? 'Još nije napravljena nijedna kopija.' : `Zadnja prije ${daniOdKopije} dana.`} Dodirni da napraviš.</span>
            </span>
          </a>
        )}

        <section>
          <div className="naslov-sekcije"><h2>{MJESECI[Number(mjesec.slice(5)) - 1][0].toUpperCase() + MJESECI[Number(mjesec.slice(5)) - 1].slice(1)}</h2></div>
          <div className="brojke-red">
            {brojke.map((x) => {
              const sadrzaj = (<><span className="v">{x.v}</span><span className="o">{x.o}</span></>);
              return x.href ? <a key={x.o} href={x.href}>{sadrzaj}</a> : <div key={x.o}>{sadrzaj}</div>;
            })}
          </div>
          {b.sati && (
            <a className="sati-traka" href={`#/plan?mjesec=${mjesec}`}>
              <span className="sati-tekst"><strong>40-satna sedmica</strong> · evidentirano {b.sati.ostvareno} h od ≈ {b.sati.ocekivano} h</span>
              <span className="sati-bar"><span style={{ width: `${Math.min(100, Math.round((b.sati.ostvareno / Math.max(1, b.sati.ocekivano)) * 100))}%` }} /></span>
              {b.sati.bezEvidencije.length > 0 && (
                <span className="sati-napomena">Bez unosa ovaj mjesec: {b.sati.bezEvidencije.slice(0, 3).map((x) => `${x.kod}. ${x.naziv.split(/[,/]/)[0].toLowerCase()}`).join(', ')}</span>
              )}
            </a>
          )}
        </section>

        <section>
          <div className="naslov-sekcije"><h2>Nedavno</h2>{nedavno.length > 0 && <a className="malo" href="#/izvjestaj">Izvještaj →</a>}</div>
          {nedavno.length === 0 ? (
            <p className="tiho-prazno">Još nema unosa. Počni brzom bilješkom ili dugmetom iznad.</p>
          ) : (
            <ul className="lista">
              {nedavno.map((s) => <li key={s.z.id}><RedStavke s={s} imeZa={imeZa} /></li>)}
            </ul>
          )}
        </section>
      </main>
      {aiBrifing && <AIBrifing b={b} danas={danas} onZatvori={() => setAiBrifing(false)} />}
    </>
  );
}

function BrifingKartice({ b, imeZa }: { b: Brifing; imeZa: (s: string) => string }) {
  const prazno = !b.kontakti.length && !b.obaveze.length && !b.koraci.length && !b.signali.length;
  return (
    <section className="brifing">
      <div className="naslov-sekcije"><h2>Danas i ove sedmice</h2></div>
      {prazno && <p className="tiho-prazno">Nema zakazanih kontakata, rokova ni otvorenih koraka za narednih 7 dana.</p>}

      {b.kontakti.length > 0 && (
        <div className="brifing-blok">
          <div className="brifing-naslov"><Ikona ime="kalendar" /> Zakazani kontakti</div>
          <ul className="lista">
            {b.kontakti.map((z) => (
              <li key={z.sifra}>
                <a className="stavka" href={`#/ucenici/${encodeURIComponent(z.sifra)}`}>
                  <span className="glavno">
                    <span className="red1">{imeZa(z.sifra)} <span className="blijedo" style={{ fontWeight: 400 }}>{z.razred}</span></span>
                    <span className="red2">{z.statusSlucaja} · {prikaz(z.datum)}</span>
                  </span>
                  <span className={`oznaka ${z.oznaka === 'kasni' ? 'crvena' : z.oznaka === 'danas' ? 'narandzasta' : ''}`}>{tekstOznake(z)}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {b.obaveze.length > 0 && (
        <div className="brifing-blok">
          <div className="brifing-naslov"><Ikona ime="sat" /> Rokovi{b.obaveze.length > 3 && <a className="brifing-vise" href="#/dokumentacija">još {b.obaveze.length - 3} →</a>}</div>
          <ul className="lista">
            {b.obaveze.slice(0, 3).map((o) => (
              <li key={o.id}>
                <a className="stavka" href={`#${o.link ?? '/dokumentacija'}`}>
                  <span className="glavno"><span className="red1">{o.def.naziv}</span><span className="red2">{o.def.osnov}</span></span>
                  <span className={`oznaka ${o.kasni ? 'crvena' : 'narandzasta'}`}>{o.kasni ? 'kasni' : prikaz(o.rok)}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {b.koraci.length > 0 && (
        <div className="brifing-blok">
          <div className="brifing-naslov"><Ikona ime="strelica" /> Dogovoreni sljedeći koraci</div>
          <ul className="lista">
            {b.koraci.map((k) => (
              <li key={k.sifra}>
                <a className="stavka" href={`#/ucenici/${encodeURIComponent(k.sifra)}`}>
                  <span className="glavno"><span className="red1">{imeZa(k.sifra)}</span><span className="red2">{k.tekst}</span></span>
                  <span className="desno broj">{prikaz(k.datum)}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {b.signali.length > 0 && (
        <div className="brifing-blok signali">
          <div className="brifing-naslov"><Ikona ime="zastava" /> Možda za praćenje</div>
          <ul className="lista">
            {b.signali.map((s) => (
              <li key={s.sifra}>
                <a className="stavka" href={`#/ucenici/${encodeURIComponent(s.sifra)}`}>
                  <span className="glavno"><span className="red1">{imeZa(s.sifra)} <span className="blijedo" style={{ fontWeight: 400 }}>{s.razred}</span></span><span className="red2">{s.razlog}</span></span>
                  <Ikona ime="desno" />
                </a>
              </li>
            ))}
          </ul>
          <p className="malo blijedo" style={{ margin: '6px 2px 0' }}>Učenici koji se u zadnjih 30 dana često ili zabrinjavajuće pojavljuju u zapisima, a nisu u praćenju. Otvori karton i procijeni.</p>
        </div>
      )}
    </section>
  );
}

function AIBrifing({ b, danas, onZatvori }: { b: Brifing; danas: string; onZatvori: () => void }) {
  const ai = useAIPoziv();
  const poruka = brifingZaAI(b, danas);
  const posalji = () => void ai.posalji({ sistem: BRIFING_SISTEM, poruke: [{ uloga: 'user', tekst: poruka }], napor: 'low', maxTokens: 1500 });
  return (
    <Modal naslov="✨ Šta danas prvo" onZatvori={onZatvori}>
      {ai.faza === 'unos' && (
        <>
          <p className="malo blijedo">AI dobija samo pregled obaveza (šifre, rokovi, brojevi) – bez imena i bez sadržaja razgovora.</p>
          <pre className="ai-pregled-poruke">{poruka}</pre>
          {ai.automatski ? (
            <div className="red-dugmadi">
              <button type="button" className="dugme" onClick={onZatvori}>Zatvori</button>
              <button type="button" className="dugme primarno" onClick={posalji}>✨ Napravi plan dana ({nazivAI()})</button>
            </div>
          ) : <RucniAI pripremi={async () => `${BRIFING_SISTEM}\n\n${poruka}`} onOdgovor={(t) => { ai.setRezultat(t); ai.setFaza('gotovo'); }} dugme="Prikaži" />}
        </>
      )}
      {ai.faza === 'salje' && <AIRazmislja tekst="Slažem prioritete za danas…" />}
      {ai.faza === 'greska' && <AIGreskaBlok greska={ai.greska} onNazad={() => ai.setFaza('unos')} onPonovo={posalji} />}
      {ai.faza === 'gotovo' && (
        <>
          <div className="ai-odgovor">{ai.rezultat}</div>
          <div className="red-dugmadi"><button type="button" className="dugme primarno" onClick={onZatvori}>Hvala</button></div>
        </>
      )}
    </Modal>
  );
}
