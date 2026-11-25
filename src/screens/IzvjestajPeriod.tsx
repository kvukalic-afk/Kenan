import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Ikona } from '../components/Ikona';
import { DatumPolje, Modal, Prazno, Prekidac, TekstPolje } from '../components/Polja';
import { NAZIV_VRSTE, Zaglavlje } from '../components/Okvir';
import { useToast } from '../components/Toast';
import { danasIso, dodajDane, pocetakSedmice, prikaz } from '../lib/datum';
import { idi } from '../lib/router';
import { useImenik, usePostavke } from '../lib/podaci';
import { anonimizujSve, AIGreska, generisi, imaKljuc, nazivAI } from '../lib/ai';
import { PODRUCJA } from '../lib/podrucja';
import { AIRazmislja } from '../components/AIRad';
import { brojPerioda, nazivDana, naslovIzvjestaja, opisPerioda, sazetakPerioda, stavkePerioda, tekstZaAI } from '../lib/periodIzvjestaj';
import { punoIme } from '../types';

export const kljucTeksta = (od: string, do_: string) => `izvjestaj-tekst:${od}:${do_}`;

export function procitajTekst(od: string, do_: string): string {
  try { return localStorage.getItem(kljucTeksta(od, do_)) ?? ''; } catch { return ''; }
}
function sacuvajTekst(od: string, do_: string, t: string) {
  try {
    if (t.trim()) localStorage.setItem(kljucTeksta(od, do_), t);
    else localStorage.removeItem(kljucTeksta(od, do_));
  } catch { /* privatni način rada – tekst se ne pamti */ }
}

export function IzvjestajPeriod({ od: pocOd, do: pocDo }: { od?: string; do?: string }) {
  const toast = useToast();
  const danas = danasIso();
  const [od, setOd] = useState(pocOd || danas);
  const [doDatum, setDo] = useState(pocDo || pocOd || danas);
  const [biljeskeAI, setBiljeskeAI] = useState(false);
  const [biljeskePrint, setBiljeskePrint] = useState(false);
  const [tekst, setTekst] = useState(() => procitajTekst(od, doDatum));
  const [rucnoKopiraj, setRucnoKopiraj] = useState('');
  const { poSifri } = useImenik();
  const postavke = usePostavke();
  const [pise, setPise] = useState(false);

  const ulaz = useLiveQuery(async () => {
    const [ucenici, razgovori, radionice, saradnja, aktivnosti] = await Promise.all([
      db.ucenici.toArray(), db.razgovori.toArray(), db.radionice.toArray(), db.saradnja.toArray(), db.aktivnosti.toArray(),
    ]);
    return { ucenici, razgovori, radionice, saradnja, aktivnosti };
  }, []);

  // tekst izvještaja se pamti za svaki period posebno
  useEffect(() => { setTekst(procitajTekst(od, doDatum)); }, [od, doDatum]);
  useEffect(() => { idi(`/izvjestaj?od=${od}&do=${doDatum}`, true); }, [od, doDatum]);

  const postaviPeriod = (a: string, b: string) => { setOd(a); setDo(b); };
  const ponOve = pocetakSedmice(danas);
  const brzi: [string, string, string][] = [
    ['Danas', danas, danas],
    ['Jučer', dodajDane(danas, -1), dodajDane(danas, -1)],
    ['Ova sedmica', ponOve, dodajDane(ponOve, 6)],
    ['Prošla sedmica', dodajDane(ponOve, -7), dodajDane(ponOve, -1)],
    ['Ovaj mjesec', `${danas.slice(0, 7)}-01`, dodajDane(`${dodajDane(`${danas.slice(0, 7)}-28`, 4).slice(0, 7)}-01`, -1)],
    ['Prošli mjesec', dodajDane(`${danas.slice(0, 7)}-01`, -1).slice(0, 8) + '01', dodajDane(`${danas.slice(0, 7)}-01`, -1)],
    ['I polugodište', `${postavke.skolskaGodinaPocetak}-09-01`, `${postavke.skolskaGodinaPocetak}-12-31`],
    ['II polugodište', `${postavke.skolskaGodinaPocetak + 1}-01-01`, `${postavke.skolskaGodinaPocetak + 1}-06-30`],
    ['Školska godina', `${postavke.skolskaGodinaPocetak}-09-01`, `${postavke.skolskaGodinaPocetak + 1}-08-31`],
  ];

  if (!ulaz) return <Zaglavlje naslov="Izvještaj za period" nazadNa="/" />;
  const ispravno = od && doDatum && od <= doDatum;
  const stavke = ispravno ? stavkePerioda(ulaz, od, doDatum) : [];
  const b = ispravno ? brojPerioda(ulaz, od, doDatum) : null;

  const kopirajZaAI = async () => {
    const t = tekstZaAI(ulaz, od, doDatum, { biljeske: biljeskeAI });
    try {
      await navigator.clipboard.writeText(t);
      toast('Kopirano ✓ Zalijepi u ChatGPT');
    } catch {
      setRucnoKopiraj(t);
    }
  };

  const napisiAI = async () => {
    setPise(true);
    try {
      const dugo = (new Date(doDatum).getTime() - new Date(od).getTime()) / 86400000 > 40;
      const sistem = `Ti si iskusan školski psiholog u osnovnoj školi u Unsko-sanskom kantonu i pišeš službene izvještaje o radu. ${dugo
        ? `Za ovaj duži period napiši pregledan izvještaj: kratak uvod, zatim rad po područjima iz Pedagoških standarda USK (${PODRUCJA.map((p) => `${p.kod}. ${p.naziv}`).join('; ')}) – samo područja za koja ima podataka, svako s naslovom u posebnom redu i 1–3 pasusa – i na kraju zaključak s planom za naredni period.`
        : 'Napiši izvještaj u 2–4 kratka pasusa.'} Bosanski jezik, ijekavica, službeni stručni stil, bez markdown zvjezdica. Koristi samo date podatke, ništa ne izmišljaj; učenike navodi samo šiframa.`;
      const r = await generisi({ sistem, poruke: [{ uloga: 'user', tekst: await anonimizujSve(tekstZaAI(ulaz, od, doDatum, { biljeske: biljeskeAI })) }], napor: 'medium', maxTokens: 10000 });
      setTekst(r.trim());
      sacuvajTekst(od, doDatum, r.trim());
      toast('Izvještaj je napisan ✓ Pročitaj i po potrebi uredi.');
    } catch (e) {
      toast(e instanceof AIGreska ? e.message : String(e), 'greska');
    } finally {
      setPise(false);
    }
  };

  return (
    <>
      <Zaglavlje naslov="Izvještaj za period" nazadNa="/" />
      <main className="sadrzaj">
        <div className="filteri" role="group" aria-label="Brzi izbor perioda">
          {brzi.map(([n, a, z]) => (
            <button key={n} type="button" className="chip mali" aria-pressed={od === a && doDatum === z} onClick={() => postaviPeriod(a, z)}>{n}</button>
          ))}
        </div>
        <div className="dva-stupca">
          <DatumPolje labela="Od" vrijednost={od} onChange={(v) => { setOd(v); if (v > doDatum) setDo(v); }} />
          <DatumPolje labela="Do" vrijednost={doDatum} onChange={setDo} greska={od > doDatum ? 'Datum „do“ je prije datuma „od“.' : undefined} />
        </div>

        {ispravno && b && (
          <>
            <section className="kartica">
              <h2>{naslovIzvjestaja(od, doDatum).replace(' O RADU PSIHOLOGA', '').toLowerCase().replace(/^./, (c) => c.toUpperCase())}: {opisPerioda(od, doDatum)}</h2>
              <p>{sazetakPerioda(b, od, doDatum)}</p>
            </section>

            <section className="kartica">
              <h2>Tekst izvještaja</h2>
              <p className="malo blijedo">
                Ovaj tekst ide u print. Napiši ga sam/a (i diktiraj) ili ga jednim klikom napiše AI iz evidencije – za polugodište i godinu po 11 područja rada.
                Ako ostane prazno, u printu je automatski sažetak.
              </p>
              <div className="red-dugmadi" style={{ marginBottom: 10 }}>
                {imaKljuc() ? (
                  <button type="button" className="dugme primarno" disabled={pise || !stavke.length} onClick={() => void napisiAI()}><Ikona ime="iskra" /> {tekst.trim() ? 'Napiši ponovo' : 'Napiši izvještaj'} ({nazivAI()})</button>
                ) : (
                  <>
                    <button type="button" className="dugme" onClick={() => void kopirajZaAI()}><Ikona ime="razgovor" /> Kopiraj za AI</button>
                    <a className="dugme" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">Otvori ChatGPT</a>
                  </>
                )}
              </div>
              {pise && <AIRazmislja tekst={`${nazivAI()} piše izvještaj iz ${stavke.length} aktivnosti…`} />}
              <Prekidac labela="U tekst za AI uključi i bilješke" vrijednost={biljeskeAI} onChange={setBiljeskeAI} />
              <p className="malo blijedo" style={{ marginTop: 0 }}>
                Tekst za AI sadrži samo šifre učenika – bez imena učenika i nastavnika. {biljeskeAI
                  ? 'Bilješke se šalju, a poznata imena učenika u njima se zamjenjuju šiframa. Pregledaj tekst prije slanja – druge osobe (roditelji, nastavnici) se ne prepoznaju automatski.'
                  : 'Bilješke se ne šalju.'}
              </p>
              <TekstPolje labela="Tekst" vrijednost={tekst} onChange={(v) => { setTekst(v); sacuvajTekst(od, doDatum, v); }}
                placeholder="Zalijepi tekst iz ChatGPT-a ili napiši svoj…" />
            </section>

            <div className="naslov-sekcije"><h2>Aktivnosti u periodu ({stavke.length})</h2></div>
            {stavke.length === 0 ? (
              <Prazno>U ovom periodu nema evidentiranih aktivnosti.</Prazno>
            ) : (
              <ul className="lista">
                {stavke.map((s) => (
                  <li key={s.id}>
                    <a className="stavka" href={`#/zapis/${s.vrsta}/${s.id}`}>
                      <span className={`vrsta ${s.vrsta}`} aria-hidden />
                      <span className="glavno">
                        <span className="red1"><span className={`oznaka ${s.vrsta}`}>{NAZIV_VRSTE[s.vrsta]}</span> {s.naslov.replace(/^(Radionica|Saradnja): /, '')}</span>
                        <span className="red2">{[s.ucenik && (punoIme(poSifri.get(s.ucenik)) || s.ucenik), ...s.detalji].filter(Boolean).join(' · ')}</span>
                      </span>
                      <span className="desno broj">{nazivDana(s.datum).slice(0, 3)}<br />{prikaz(s.datum).slice(0, 6)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}

            <div className="razmak" />
            <Prekidac labela="U printu prikaži i bilješke / zapažanja" vrijednost={biljeskePrint} onChange={setBiljeskePrint} />
            <div className="red-dugmadi" style={{ marginTop: 8 }}>
              <a className="dugme primarno" href={`#/print/period/${od}/${doDatum}${biljeskePrint ? '?biljeske=1' : ''}`}><Ikona ime="print" /> Preuzmi izvještaj za print</a>
            </div>
          </>
        )}
      </main>
      {rucnoKopiraj && (
        <Modal naslov="Kopiraj tekst" onZatvori={() => setRucnoKopiraj('')}>
          <p className="malo">Automatsko kopiranje nije dozvoljeno. Označi tekst ispod (dugi pritisak → Označi sve) i kopiraj ga.</p>
          <textarea readOnly value={rucnoKopiraj} rows={10} style={{ overflow: 'auto' }} onFocus={(e) => e.currentTarget.select()} />
          <div className="red-dugmadi"><button type="button" className="dugme primarno" onClick={() => setRucnoKopiraj('')}>Zatvori</button></div>
        </Modal>
      )}
    </>
  );
}
