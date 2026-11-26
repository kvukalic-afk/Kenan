import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/db';
import { inicijalizuj } from './db/repo';
import { DonjaNavigacija, NAZIV_VRSTE, PlutajuceDugme } from './components/Okvir';
import { Modal } from './components/Polja';
import { ToastProvider } from './components/Toast';
import { prikazVremena } from './lib/datum';
import { idi, useRuta } from './lib/router';
import { dozvoliKratakIzlazak, izlazakJeDozvoljen, ponistiIzuzetak } from './lib/zakljucavanje';
import type { Nacrt, VrstaUnosa } from './types';
import { Pocetna } from './screens/Pocetna';
import { Ucenici } from './screens/Ucenici';
import { Karton } from './screens/Karton';
import { Radionice } from './screens/Radionice';
import { Statistika } from './screens/Statistika';
import { Postavke } from './screens/Postavke';
import { Detalji } from './screens/Detalji';
import { FormaAktivnost, FormaRadionica, FormaRazgovor, FormaSaradnja } from './screens/Forme';
import { Zakljucano } from './screens/Zakljucano';
import { IzvjestajPeriod } from './screens/IzvjestajPeriod';
import { UnosIzTeksta } from './screens/UnosIzTeksta';
import { PlanRada } from './screens/PlanRada';
import { BrzeBiljeske } from './screens/BrzeBiljeske';
import { AnalizaDetalj } from './screens/AnalizaDetalj';
import { Obrazac } from './screens/Obrazac';
import { Dokumentacija } from './screens/Dokumentacija';
import { Asistent } from './screens/Asistent';
import { Uvid } from './screens/Uvid';
import { PametniAlati } from './screens/PametniAlati';
import { PrintAktivnost, PrintAnaliza, PrintDnevnik, PrintDokumentacija, PrintSpiskovi, PrintUvidUcenici, PrintObrazac, PrintUsavrsavanje, PrintIzvjestaj, PrintPeriod, PrintPlan, PrintKarton, PrintRadionica, PrintRazgovor, PrintSaradnja } from './print/Print';
import type { Period } from './lib/statistika';

const NEAKTIVNOST_MS = 5 * 60 * 1000;
const VRSTE: VrstaUnosa[] = ['razgovor', 'radionica', 'saradnja', 'aktivnost'];

export function App() {
  const [spremno, setSpremno] = useState(false);
  const [greska, setGreska] = useState('');
  useEffect(() => {
    inicijalizuj().then(() => setSpremno(true)).catch((e) => setGreska(String(e?.message ?? e)));
  }, []);
  if (greska) {
    return (
      <main className="sadrzaj">
        <h1>Baza nije dostupna</h1>
        <p>Preglednik ne dozvoljava lokalno čuvanje podataka (npr. privatni način rada). Otvori app u običnom prozoru.</p>
        <p className="blijedo malo">{greska}</p>
      </main>
    );
  }
  if (!spremno) return null;
  return (
    <ToastProvider>
      <Zakljucavanje />
    </ToastProvider>
  );
}

function Zakljucavanje() {
  const postavke = useLiveQuery(() => db.postavke.get('postavke'), []);
  const [zakljucano, setZakljucano] = useState<boolean | null>(null);
  const zadnjaAktivnost = useRef(Date.now());
  const skrivenoOd = useRef<number | null>(null);
  const pinHash = postavke?.pinHash ?? '';
  const nakonSek = postavke?.zakljucajNakonSek ?? 0;

  // pri otvaranju: zaključaj ako je PIN uključen
  useEffect(() => {
    if (postavke && zakljucano === null) setZakljucano(!!postavke.pinHash);
  }, [postavke, zakljucano]);

  // Telefon app obično ne gasi nego ga samo „uspava“ – zato se PIN traži i kad se
  // app vrati iz pozadine (odmah ili nakon izabranog vremena), te nakon 5 min neaktivnosti.
  useEffect(() => {
    if (!pinHash) return;
    const aktivnost = () => { zadnjaAktivnost.current = Date.now(); };
    const klik = (e: Event) => {
      aktivnost();
      const el = e.target as HTMLElement | null;
      if (el?.closest?.('input[type=file]') || (el?.closest?.('label') as HTMLLabelElement | null)?.querySelector('input[type=file]')) dozvoliKratakIzlazak();
    };
    const otisao = () => {
      if (izlazakJeDozvoljen()) { skrivenoOd.current = null; return; }
      skrivenoOd.current = Date.now();
      // „Odmah“: sakrij sadržaj već pri izlasku, da se ne vidi ni u pregledu otvorenih appova.
      if (nakonSek === 0) setZakljucano(true);
    };
    const vratio = () => {
      ponistiIzuzetak();
      const sada = Date.now();
      if (skrivenoOd.current !== null && sada - skrivenoOd.current >= nakonSek * 1000) setZakljucano(true);
      else if (sada - zadnjaAktivnost.current > NEAKTIVNOST_MS) setZakljucano(true);
      skrivenoOd.current = null;
      zadnjaAktivnost.current = sada;
    };
    const provjeri = () => {
      if (document.visibilityState === 'visible' && Date.now() - zadnjaAktivnost.current > NEAKTIVNOST_MS) setZakljucano(true);
    };
    const vidljivost = () => (document.visibilityState === 'hidden' ? otisao() : vratio());
    const vracenIzKesa = (e: PageTransitionEvent) => { if (e.persisted) { skrivenoOd.current ??= 0; vratio(); } };
    const stampa = () => dozvoliKratakIzlazak();
    const dogadjaji = ['pointerdown', 'keydown', 'scroll', 'touchstart', 'input'];
    dogadjaji.forEach((d) => window.addEventListener(d, aktivnost, { passive: true, capture: true }));
    window.addEventListener('click', klik, { capture: true });
    document.addEventListener('visibilitychange', vidljivost);
    window.addEventListener('pagehide', otisao);
    window.addEventListener('pageshow', vracenIzKesa);
    window.addEventListener('beforeprint', stampa);
    const t = window.setInterval(provjeri, 10_000);
    return () => {
      dogadjaji.forEach((d) => window.removeEventListener(d, aktivnost, { capture: true }));
      window.removeEventListener('click', klik, { capture: true });
      document.removeEventListener('visibilitychange', vidljivost);
      window.removeEventListener('pagehide', otisao);
      window.removeEventListener('pageshow', vracenIzKesa);
      window.removeEventListener('beforeprint', stampa);
      window.clearInterval(t);
    };
  }, [pinHash, nakonSek]);

  if (zakljucano === null) return null;
  const jeZakljucano = zakljucano && !!pinHash;

  return (
    <>
      {/* Sadržaj ostaje u memoriji (nedovršen unos se ne gubi), ali je skriven i nedostupan dok je app zaključan. */}
      <div aria-hidden={jeZakljucano || undefined} style={jeZakljucano ? { visibility: 'hidden' } : undefined}>
        <Ekrani otkljucano={!jeZakljucano} />
      </div>
      {jeZakljucano && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, overflow: 'auto' }}>
          <Zakljucano pinHash={pinHash} pinDuzina={postavke?.pinDuzina} onOtkljucaj={() => { zadnjaAktivnost.current = Date.now(); setZakljucano(false); }} />
        </div>
      )}
    </>
  );
}

function Ekrani({ otkljucano }: { otkljucano: boolean }) {
  const ruta = useRuta();
  const [d0, d1, d2, d3] = ruta.dijelovi;
  const izNacrta = ruta.upit.get('nacrt') === '1';

  let ekran: JSX.Element;
  let navigacija = true;
  let fab = false;

  if (!d0) { ekran = <Pocetna />; fab = true; }
  else if (d0 === 'ucenici' && !d1) { ekran = <Ucenici pocetniFilter={ruta.upit.get('filter') ?? undefined} />; fab = true; }
  else if (d0 === 'ucenici') { ekran = <Karton key={d1} sifra={d1} />; fab = true; }
  else if (d0 === 'radionice') { ekran = <Radionice key={ruta.upit.get('prikaz') ?? ''} pocetniPrikaz={ruta.upit.get('prikaz') === 'aktivnosti' ? 'aktivnosti' : 'radionice'} />; fab = true; }
  else if (d0 === 'statistika') { ekran = <Statistika />; fab = true; }
  else if (d0 === 'biljeske') ekran = <BrzeBiljeske pocetniTab={ruta.upit.get('tab') ?? undefined} />;
  else if (d0 === 'analiza' && d1) ekran = <AnalizaDetalj key={d1} id={d1} />;
  else if (d0 === 'obrazac' && d1) { navigacija = false; ekran = <Obrazac key={ruta.putanja + ruta.upit.toString()} vrsta={d1} id={ruta.upit.get('id') ?? undefined} sifra={ruta.upit.get('sifra') ?? undefined} biljeskaId={ruta.upit.get('biljeska') ?? undefined} />; }
  else if (d0 === 'dokumentacija') ekran = <Dokumentacija pocetniTab={ruta.upit.get('tab') ?? undefined} />;
  else if (d0 === 'uvid') ekran = <Uvid />;
  else if (d0 === 'ai') ekran = <PametniAlati />;
  else if (d0 === 'asistent') { navigacija = false; ekran = <Asistent pocetnoPitanje={ruta.upit.get('pitanje') ?? undefined} />; }
  else if (d0 === 'plan') ekran = <PlanRada godina={ruta.upit.get('godina') ? Number(ruta.upit.get('godina')) : undefined} mjesec={ruta.upit.get('mjesec') ?? undefined} ai={ruta.upit.get('ai') === '1'} />;
  else if (d0 === 'unos-tekst') { ekran = <UnosIzTeksta />; navigacija = false; }
  else if (d0 === 'izvjestaj') ekran = <IzvjestajPeriod od={ruta.upit.get('od') ?? undefined} do={ruta.upit.get('do') ?? undefined} />;
  else if (d0 === 'postavke') ekran = <Postavke otvoriKopiju={ruta.upit.get('kopija') === '1'} />;
  else if (d0 === 'zapis' && VRSTE.includes(d1 as VrstaUnosa)) ekran = <Detalji key={d2} vrsta={d1 as VrstaUnosa} id={d2} />;
  else if ((d0 === 'novi' || d0 === 'uredi') && VRSTE.includes(d1 as VrstaUnosa)) {
    navigacija = false;
    const editId = d0 === 'uredi' ? d2 : undefined;
    const kljuc = ruta.putanja + ruta.upit.toString();
    const sifra = ruta.upit.get('sifra') ?? undefined;
    ekran = d1 === 'razgovor' ? <FormaRazgovor key={kljuc} editId={editId} sifra={sifra} izNacrta={izNacrta} />
      : d1 === 'radionica' ? <FormaRadionica key={kljuc} editId={editId} izNacrta={izNacrta} />
      : d1 === 'aktivnost' ? <FormaAktivnost key={kljuc} editId={editId} izNacrta={izNacrta} />
      : <FormaSaradnja key={kljuc} editId={editId} sifra={sifra} izNacrta={izNacrta} />;
  } else if (d0 === 'print') {
    navigacija = false;
    ekran = d1 === 'razgovor' ? <PrintRazgovor id={d2} />
      : d1 === 'radionica' ? <PrintRadionica id={d2} />
      : d1 === 'saradnja' ? <PrintSaradnja id={d2} />
      : d1 === 'aktivnost' ? <PrintAktivnost id={d2} />
      : d1 === 'karton' ? <PrintKarton sifra={d2} />
      : d1 === 'obrazac' ? <PrintObrazac id={d2} />
      : d1 === 'analiza' ? <PrintAnaliza id={d2} />
      : d1 === 'usavrsavanje' ? <PrintUsavrsavanje godina={Number(d2)} />
      : d1 === 'dokumentacija' ? <PrintDokumentacija godina={Number(d2)} />
      : d1 === 'spiskovi' ? <PrintSpiskovi razred={d2} />
      : d1 === 'plan' ? <PrintPlan godina={Number(d2)} mjesec={d3} />
      : d1 === 'dnevnik' ? <PrintDnevnik mjesec={d2} uvid={ruta.upit.get('uvid') === '1'} />
      : d1 === 'uvid-ucenici' ? <PrintUvidUcenici od={d2} do={d3} />
      : d1 === 'period' ? <PrintPeriod od={d2} do={d3} biljeske={ruta.upit.get('biljeske') === '1'} />
      : <PrintIzvjestaj godina={Number(d2)} period={(['I', 'II'].includes(d3) ? d3 : 'godina') as Period} />;
  } else {
    ekran = <Pocetna />;
  }

  const aktivniTab = ['ucenici', 'radionice', 'statistika'].includes(d0) ? d0 : d0 ? '-' : '';

  return (
    <div className="app">
      {ekran}
      {navigacija && <DonjaNavigacija aktivno={aktivniTab} />}
      {fab && <PlutajuceDugme />}
      {otkljucano && navigacija && <PitanjeNacrta />}
    </div>
  );
}

/** Pri otvaranju appa: ako postoji nedovršen unos, pitaj da li nastaviti. */
let pitanjePostavljeno = false;
function PitanjeNacrta() {
  const [nacrti, setNacrti] = useState<Nacrt[]>([]);
  useEffect(() => {
    if (pitanjePostavljeno) return;
    pitanjePostavljeno = true;
    db.nacrti.orderBy('updatedAt').reverse().toArray().then(setNacrti);
  }, []);
  if (!nacrti.length) return null;
  const n = nacrti[0];
  const opis = (x: Nacrt) => {
    const p = x.podaci as Record<string, string>;
    return [NAZIV_VRSTE[x.vrsta], p.sifra || p.tema || p.ustanovaOsoba || p.vrsta, x.editId ? '(izmjena)' : ''].filter(Boolean).join(' – ');
  };
  return (
    <Modal naslov="Nastavi nedovršeni unos?" onZatvori={() => setNacrti([])}>
      <p><strong>{opis(n)}</strong><br /><span className="blijedo malo">započeto {prikazVremena(n.updatedAt)}</span></p>
      {nacrti.length > 1 && <p className="malo blijedo">Ima još {nacrti.length - 1} nedovršenih unosa – ponudiće se kad otvoriš tu formu.</p>}
      <div className="red-dugmadi">
        <button type="button" className="dugme" onClick={async () => { await db.nacrti.delete(n.kljuc); setNacrti(nacrti.slice(1)); }}>Odbaci</button>
        <button type="button" className="dugme primarno" onClick={() => {
          setNacrti([]);
          idi(n.editId ? `/uredi/${n.vrsta}/${n.editId}?nacrt=1` : `/novi/${n.vrsta}?nacrt=1`);
        }}>Nastavi</button>
      </div>
    </Modal>
  );
}
