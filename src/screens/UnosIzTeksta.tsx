import { Fragment, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { osigurajUcenika, uuid, sacuvajAktivnost, sacuvajRadionicu, sacuvajRazgovor, sacuvajSaradnju } from '../db/repo';
import { Ikona } from '../components/Ikona';
import { AutoTextarea, Modal, Polje, TekstPolje } from '../components/Polja';
import { AIGreskaBlok, AIRazmislja, RucniAI, useAIPoziv } from '../components/AIRad';
import { anonimizujSve, nazivAI } from '../lib/ai';
import { DAN_DODATAK } from '../lib/aiAlati';
import { NAZIV_VRSTE, Zaglavlje } from '../components/Okvir';
import { useToast } from '../components/Toast';
import { danasIso, prikaz } from '../lib/datum';
import { idi } from '../lib/router';
import { parsirajTekst, uputaZaAI, type ParsiranUnos } from '../lib/unosIzTeksta';
import { punoIme, type Ucenik } from '../types';

const KLJUC = 'unos-iz-teksta-nacrt';
const KLJUC_DAN = 'ispricaj-dan-nacrt';
const citajDan = () => { try { return localStorage.getItem(KLJUC_DAN) ?? ''; } catch { return ''; } };
const pisiDan = (t: string) => { try { if (t) localStorage.setItem(KLJUC_DAN, t); else localStorage.removeItem(KLJUC_DAN); } catch { /* bez pamćenja */ } };

/** Uputa za pretvaranje ispričanog dana u blokove (bez pitanja za potvrdu). */
export function sistemDana(sifrarnik: Parameters<typeof uputaZaAI>[0], danasPrikaz: string): string {
  return uputaZaAI(sifrarnik, danasPrikaz).replace(/\n*Potvrdi da si razumio\/la, pa čekaj moj opis\.\s*$/, '') + '\n' + DAN_DODATAK;
}
const citaj = () => { try { return localStorage.getItem(KLJUC) ?? ''; } catch { return ''; } };
const pisi = (t: string) => { try { if (t) localStorage.setItem(KLJUC, t); else localStorage.removeItem(KLJUC); } catch { /* bez pamćenja */ } };

const PRIMJER = `### ZAMJENA
razred: 7-1
cas: 3
umjesto: razrednik 7-1
predmet: Matematika
tema: Ponavljanje razlomaka

### RAZGOVOR
ucenik: U056
vrsta: Individualni razgovor s učenikom
inicirao: Razrednik
razlog: Izostanci
biljeske: Učenik navodi da teško ustaje ujutro. Dogovoren plan večernje rutine.
sljedeci kontakt: za 7 dana
status: U praćenju`;

export function UnosIzTeksta() {
  const toast = useToast();
  const ai = useAIPoziv();
  const [tekst, setTekst] = useState(citaj);
  const [dan, setDan] = useState(citajDan);
  const [nacin, setNacin] = useState<'ispricaj' | 'zalijepi'>(() => (citaj() && !citajDan() ? 'zalijepi' : 'ispricaj'));
  const [pregled, setPregled] = useState<ParsiranUnos[] | null>(null);
  const [izabrani, setIzabrani] = useState<Set<number>>(new Set());
  const [snimanje, setSnimanje] = useState(false);
  const [rucno, setRucno] = useState('');
  const podaci = useLiveQuery(async () => {
    const [ucenici, sifrarnik] = await Promise.all([db.ucenici.toArray(), db.sifrarnik.toArray()]);
    return { ucenici, sifrarnik };
  }, []);
  const poSifri = useMemo(() => new Map((podaci?.ucenici ?? []).map((u) => [u.sifra, u])), [podaci]);

  if (!podaci) return <Zaglavlje naslov="Unos iz teksta" nazadNa="/" />;

  const kopirajUputu = async () => {
    const u = uputaZaAI(podaci, prikaz(danasIso()));
    try {
      await navigator.clipboard.writeText(u);
      toast('Uputa kopirana ✓ Zalijepi je u ChatGPT');
    } catch {
      setRucno(u);
    }
  };

  const porukaDana = async () => `Moj opis (${prikaz(danasIso())}):\n${await anonimizujSve(dan)}`;
  const sistem = () => sistemDana(podaci, prikaz(danasIso()));
  const uBlokove = (odgovor: string) => {
    setTekst(odgovor); pisi(odgovor);
    setNacin('zalijepi'); // „Nazad na tekst“ vodi na blokove da se mogu ispraviti (npr. šifra ???)
    pregledaj(odgovor);
  };
  const pretvori = async () => {
    const r = await ai.posalji({ sistem: sistem(), poruke: [{ uloga: 'user', tekst: await porukaDana() }], napor: 'medium', maxTokens: 8000 });
    if (r) uBlokove(r);
  };

  const pregledaj = (izvor = tekst) => {
    const r = parsirajTekst(izvor, { ...podaci, danas: danasIso() });
    setPregled(r);
    setIzabrani(new Set(r.map((x, i) => (x.greske.length ? -1 : i)).filter((i) => i >= 0)));
    if (!r.length) toast('Nisam našao nijedan blok (### RAZGOVOR, ### ZAMJENA…)', 'greska');
  };

  const sacuvaj = async () => {
    if (!pregled) return;
    setSnimanje(true);
    let n = 0;
    try {
      for (const [i, u] of pregled.entries()) {
        if (!izabrani.has(i) || u.greske.length) continue;
        for (const nu of u.noviUcenici) await osigurajUcenika(nu.sifra, nu.razred);
        if (u.tip === 'razgovor') await sacuvajRazgovor(u.podaci);
        else if (u.tip === 'radionica') await sacuvajRadionicu(u.podaci);
        else if (u.tip === 'saradnja') await sacuvajSaradnju(u.podaci);
        else if (u.tip === 'biljeska') { const t = new Date().toISOString(); await db.brzeBiljeske.add({ ...u.podaci, id: uuid(), createdAt: t, updatedAt: t }); }
        else await sacuvajAktivnost(u.podaci);
        n++;
      }
      toast(`Sačuvano ✓ (${n} ${n % 10 === 1 && n % 100 !== 11 ? 'unos' : 'unosa'})`);
      setTekst('');
      pisi('');
      setDan('');
      pisiDan('');
      setPregled(null);
      idi('/');
    } catch (e) {
      toast('Snimanje nije uspjelo: ' + (e as Error).message, 'greska');
    } finally {
      setSnimanje(false);
    }
  };

  const brojZaSnimanje = pregled ? pregled.filter((u, i) => izabrani.has(i) && !u.greske.length).length : 0;

  return (
    <>
      <Zaglavlje naslov="Unos iz teksta" nazadNa="/" />
      <main className="sadrzaj forma-sadrzaj">
        {!pregled && (
          <div className="segment" role="tablist">
            <button type="button" role="tab" aria-selected={nacin === 'ispricaj'} onClick={() => setNacin('ispricaj')}>🎙 Ispričaj dan</button>
            <button type="button" role="tab" aria-selected={nacin === 'zalijepi'} onClick={() => setNacin('zalijepi')}>📋 Zalijepi tekst</button>
          </div>
        )}
        {!pregled && nacin === 'ispricaj' ? (
          <>
            {ai.faza === 'salje' ? <AIRazmislja tekst={`${nazivAI()} pretvara tvoj dan u unose…`} />
              : ai.faza === 'greska' ? <AIGreskaBlok greska={ai.greska} onNazad={() => ai.setFaza('unos')} onPonovo={() => void pretvori()} />
                : (
                  <>
                    <TekstPolje labela="Šta si danas radio/la?" vrijednost={dan} onChange={(v) => { setDan(v); pisiDan(v); }} autoFokus
                      placeholder="Ispričaj ili izdiktiraj kako ti dođe: „Prvi čas zamjena u 7-1, matematika. Na odmoru mi je razrednica 6-2 rekla da Marko često plače. Poslije razgovor s majkom učenika iz 8-1 zbog izostanaka, dogovorili da se javi za sedam dana…“" />
                    <div className="info-traka">
                      <Ikona ime="brava" />
                      <span>Imena učenika i razrednika app <strong>sam zamijeni šiframa</strong> prije slanja. Ostale odrasle navedi ulogom (majka, nastavnica bosanskog). AI napravi razgovore, bilješke, saradnju i aktivnosti – ti ih pregledaš prije čuvanja.</span>
                    </div>
                    {!ai.automatski && <RucniAI pripremi={async () => `${sistem()}\n\n${await porukaDana()}`} onOdgovor={uBlokove} dugme="Pregledaj unose" />}
                  </>
                )}
          </>
        ) : !pregled ? (
          <>
            <section className="kartica">
              <h2>Kako radi</h2>
              <ol className="malo" style={{ paddingLeft: 20, margin: '0 0 12px' }}>
                <li><strong>Prvi put:</strong> klikni „Kopiraj uputu za AI“ i zalijepi je u ChatGPT (ili Claude). Uputa objašnjava format i tvoj šifrarnik.</li>
                <li>Ispričaj AI-ju šta si radio/la – <strong>učenike navodi šiframa</strong> (npr. U056), ne imenima.</li>
                <li>Kopiraj odgovor, zalijepi ga ispod i klikni „Pregledaj“. Ništa se ne snima dok ne potvrdiš.</li>
              </ol>
              <div className="red-dugmadi">
                <button type="button" className="dugme" onClick={() => void kopirajUputu()}><Ikona ime="razgovor" /> Kopiraj uputu za AI</button>
                <a className="dugme" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">Otvori ChatGPT</a>
              </div>
            </section>
            <Polje labela="Zalijepi tekst" id="tekst-unos" pomoc={<button type="button" className="chip mali" onClick={() => { setTekst(PRIMJER); pisi(PRIMJER); }}>Ubaci primjer</button>}>
              <AutoTextarea id="tekst-unos" value={tekst} rows={10} placeholder={'### RAZGOVOR\nucenik: U056\nrazlog: …'} spellCheck={false}
                onChange={(e) => { setTekst(e.target.value); pisi(e.target.value); }} style={{ fontFamily: 'ui-monospace, Consolas, monospace', fontSize: '0.9rem' }} />
            </Polje>
          </>
        ) : (
          <>
            <p className="blijedo malo">Pronađeno {pregled.length} {pregled.length === 1 ? 'unos' : 'unosa'}. Provjeri ih i označi koje želiš sačuvati.</p>
            {pregled.map((u, i) => (
              <KarticaPregleda key={i} u={u} poSifri={poSifri} ukljucen={izabrani.has(i)}
                onPrebaci={(v) => { const s = new Set(izabrani); if (v) s.add(i); else s.delete(i); setIzabrani(s); }} />
            ))}
          </>
        )}
      </main>
      <div className="sticky-dno">
        <div className="unutra">
          {!pregled && nacin === 'ispricaj' ? (
            <>
              <button type="button" className="dugme" onClick={() => idi('/')}>Odustani</button>
              {ai.automatski && (
                <button type="button" className="dugme primarno" disabled={!dan.trim() || ai.faza === 'salje'} onClick={() => void pretvori()}>
                  <Ikona ime="iskra" /> Pretvori u unose
                </button>
              )}
            </>
          ) : !pregled ? (
            <>
              <button type="button" className="dugme" onClick={() => idi('/')}>Odustani</button>
              <button type="button" className="dugme primarno" disabled={!tekst.trim()} onClick={() => pregledaj()}>Pregledaj</button>
            </>
          ) : (
            <>
              <button type="button" className="dugme" onClick={() => setPregled(null)}>Nazad na tekst</button>
              <button type="button" className="dugme primarno" disabled={!brojZaSnimanje || snimanje} onClick={() => void sacuvaj()}>
                <Ikona ime="kvacica" /> Sačuvaj {brojZaSnimanje}
              </button>
            </>
          )}
        </div>
      </div>
      {rucno && (
        <Modal naslov="Kopiraj uputu" onZatvori={() => setRucno('')}>
          <p className="malo">Automatsko kopiranje nije dozvoljeno. Označi tekst (dugi pritisak → Označi sve) i kopiraj ga.</p>
          <textarea readOnly value={rucno} rows={10} style={{ overflow: 'auto' }} onFocus={(e) => e.currentTarget.select()} />
          <div className="red-dugmadi"><button type="button" className="dugme primarno" onClick={() => setRucno('')}>Zatvori</button></div>
        </Modal>
      )}
    </>
  );
}

function KarticaPregleda({ u, poSifri, ukljucen, onPrebaci }: {
  u: ParsiranUnos; poSifri: Map<string, Ucenik>; ukljucen: boolean; onPrebaci: (v: boolean) => void;
}) {
  const ucenik = (s: string) => {
    if (!s) return '';
    const x = poSifri.get(s);
    return x ? `${punoIme(x) || s} (${s}, ${x.razred})` : `${s} – nov`;
  };
  const redovi: [string, string][] = [];
  const d = u.podaci as unknown as Record<string, unknown>;
  const dodaj = (o: string, v: unknown) => { if (v !== '' && v != null && !(Array.isArray(v) && !v.length)) redovi.push([o, String(v)]); };
  dodaj('Datum', prikaz(u.podaci.datum));
  if (u.tip === 'razgovor') {
    dodaj('Učenik', ucenik(u.podaci.sifra)); dodaj('Vrsta', d.vrstaKontakta); dodaj('Inicirao', d.inicirao); dodaj('Razlog', d.razlog);
    dodaj('Bilješke', d.biljeske); dodaj('Zaključak', d.zakljucak); dodaj('Preporuke', d.preporuke); dodaj('Sljedeći korak', d.sljedeciKorak);
    dodaj('Sljedeći kontakt', prikaz(String(d.datumSljedecegKontakta ?? ''))); dodaj('Status', d.statusSlucaja);
  } else if (u.tip === 'radionica') {
    dodaj('Tema', d.tema); dodaj('Razred', d.razred); dodaj('Oblast', d.oblast); dodaj('Ciljna grupa', d.ciljnaGrupa); dodaj('Učesnika', d.brojUcesnika);
    dodaj('Cilj', d.cilj); dodaj('Tok', d.tokAktivnosti); dodaj('Zapažanja', d.zapazanja);
    dodaj('Za praćenje', u.podaci.ucenicizaPracenje.map(ucenik).join(', ')); dodaj('Evaluacija', d.evaluacija);
  } else if (u.tip === 'saradnja') {
    dodaj('Učenik', ucenik(u.podaci.sifra)); dodaj('Ustanova / osoba', d.ustanovaOsoba); dodaj('Opis osobe', d.opisOsobe); dodaj('Način', d.nacin);
    dodaj('Razlog', d.razlog); dodaj('Dogovor / ishod', d.dogovorIshod);
  } else if (u.tip === 'biljeska') {
    dodaj('Vrsta', d.kategorija); dodaj('Učenik', ucenik(u.podaci.sifra)); dodaj('O kome / sa kim', u.podaci.osobe?.join(', '));
    dodaj('Zapis', d.tekst); dodaj('Stručno sročeno', d.sroceno);
  } else {
    dodaj('Vrsta', d.vrsta); dodaj('Razred', d.razred); dodaj('Čas', d.cas); dodaj('Umjesto koga', d.umjestoKoga); dodaj('Predmet', d.predmet);
    dodaj('Tema', d.tema); dodaj('Zapažanja', d.zapazanja); dodaj('Napomena', d.napomena);
  }
  const ima = u.greske.length > 0;
  return (
    <section className="kartica" style={{ opacity: ukljucen || ima ? 1 : 0.6, borderColor: ima ? 'var(--crvena)' : undefined }}>
      <div className="razdvoji" style={{ marginBottom: 8 }}>
        <span className={`oznaka ${u.tip}`}>{u.tip === 'biljeska' ? 'Bilješka' : NAZIV_VRSTE[u.tip]}</span>
        <span className="rastegni blijedo malo">red {u.red}</span>
        {!ima && (
          <label className="prekidac" style={{ minHeight: 32 }}>
            <input type="checkbox" role="switch" checked={ukljucen} onChange={(e) => onPrebaci(e.target.checked)} /> Sačuvaj
          </label>
        )}
      </div>
      <dl className="podaci">
        {redovi.map(([o, v]) => (<Fragment key={o}><dt>{o}</dt><dd>{v}</dd></Fragment>))}
      </dl>
      {u.greske.map((g) => <p key={g} className="greska-tekst" style={{ color: 'var(--crvena)', fontWeight: 600, margin: '8px 0 0' }}>✗ {g}</p>)}
      {u.upozorenja.map((g) => <p key={g} className="malo" style={{ color: 'var(--narandzasta)', margin: '6px 0 0' }}>⚠ {g}</p>)}
    </section>
  );
}
