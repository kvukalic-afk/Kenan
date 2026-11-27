import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Ikona } from '../components/Ikona';
import { TekstPolje } from '../components/Polja';
import { Zaglavlje } from '../components/Okvir';
import { useToast } from '../components/Toast';
import { AIGreska, anonimizujSve, generisi, imaKljuc, nazivAI, type AIDokument, type AIPoruka } from '../lib/ai';
import { KONTROLNA_LISTA, PROPIS_TEKST, sazetakStanjaZaAI, sljedeceObaveze, spremnost } from '../lib/dokumentacija';
import { OBRASCI } from '../lib/obrasci';
import { prikaz } from '../lib/datum';
import { useKontrola } from '../lib/useKontrola';

const KLJUC = 'asistent-poruke';
const ucitaj = (): AIPoruka[] => { try { return JSON.parse(localStorage.getItem(KLJUC) ?? '[]') as AIPoruka[]; } catch { return []; } };
const sacuvaj = (p: AIPoruka[]) => { try { localStorage.setItem(KLJUC, JSON.stringify(p.slice(-40))); } catch { /* bez pamćenja */ } };

export const BRZA_PITANJA: { kratko: string; pitanje: string }[] = [
  { kratko: 'Šta mi fali za inspekciju?', pitanje: 'Pogledaj moju kontrolnu listu. Šta mi trenutno fali za inspekciju i šta da uradim prvo? Daj mi kratak plan po prioritetima.' },
  { kratko: 'Plan za ovu sedmicu', pitanje: 'Napravi mi kratak, realan plan rada za ovu sedmicu po danima, uzimajući u obzir rokove iz kontrolne liste i 40-satnu radnu sedmicu.' },
  { kratko: 'Šta je 40-satna sedmica?', pitanje: 'Objasni mi strukturu 40-satne radne sedmice psihologa prema Pedagoškim standardima USK i kako da je dokumentujem.' },
  { kratko: 'Koje obrasce trebam imati?', pitanje: 'Koju dokumentaciju i obrasce školski psiholog treba imati uredno za inspekciju i kako ih da organizujem u registratoru?' },
  { kratko: 'Kako postupiti kod nasilja?', pitanje: 'Kako školski psiholog treba postupiti i šta dokumentovati kad sazna za vršnjačko nasilje? Daj korake i šta upisati u evidenciju.' },
  { kratko: 'Pripremi me za sastanak', pitanje: 'Pomozi mi da se pripremim za razgovor s roditeljem: struktura razgovora, ključna pitanja i kako zapisati dogovor.' },
];

const ASISTENT_SISTEM = `Ti si „Asistent“ u aplikaciji Evidencija psihologa: iskusan školski psiholog-mentor i stručnjak za pedagošku dokumentaciju u osnovnim školama Unsko-sanskog kantona (BiH). Pomažeš psihologu JU Osnovna škola Stijena da radi kvalitetno, da mu dokumentacija bude uredna za inspekciju i da ne propusti rokove.

Način rada:
- Odgovaraj na bosanskom (ijekavica), kratko, toplo i praktično; koristi kratke liste i konkretne korake.
- Uvijek uzmi u obzir TRENUTNO STANJE (kontrolna lista, rokovi) koje dobiješ ispod i, kad je relevantno, podsjeti na obaveze koje kasne ili im se bliži rok.
- Oslanjaj se na izvod iz Pedagoških standarda USK ispod i na dokumente koje je psiholog priložio. Kad citiraš propis, navedi izvor. Ako nešto ne piše u izvorima, reci da je to opšta stručna praksa i preporuči provjeru kod direktora, Pedagoškog zavoda USK ili sindikata.
- Ne izmišljaj brojeve članova, datume ni nazive propisa.
- U aplikaciji postoje: brze bilješke (s AI analizom), razgovori, radionice, saradnja, ostale aktivnosti (zamjene, ČOZ, usavršavanje), plan rada (godišnji/mjesečni), dnevnik rada, polugodišnji/godišnji izvještaj, karton učenika, kontrolna lista za inspekciju, obrasci za print (${OBRASCI.map((o) => o.naziv).join(', ')}) „Moji dokumenti“ i psihološke instrumente (Instrumenti: PSC-17, SDQ, SCARED, GAD-7, RCADS, SMFQ, PHQ-A, CRIES-8, C-SSRS, SNAP-IV, Rosenberg, Skala nade, KIDSCREEN-10, sociometrija razreda, dnevnik praćenja – upitnici za print, bodovanje i spremanje u karton). Kad je korisno, uputi psihologa gdje u aplikaciji nešto uradi.
- Učenici su u pitanjima navedeni šiframa (npr. U056), razrednici kao „razrednik 7-1“ – ne traži imena.

IZVOD IZ PROPISA:
${PROPIS_TEKST}

KONTROLNA LISTA DOKUMENTACIJE (šta se prati):
${KONTROLNA_LISTA.map((d) => `- ${d.naziv}: ${d.opis}`).join('\n')}`;

export function Asistent({ pocetnoPitanje }: { pocetnoPitanje?: string }) {
  const toast = useToast();
  const kon = useKontrola();
  const [poruke, setPoruke] = useState<AIPoruka[]>(ucitaj);
  const [unos, setUnos] = useState('');
  const [radi, setRadi] = useState(false);
  const [greska, setGreska] = useState('');
  const [saDokumentima, setSaDokumentima] = useState(true);
  const dokumenti = useLiveQuery(() => db.dokumenti.toArray(), []) ?? [];
  const zaAI = dokumenti.filter((d) => d.zaAI && (d.tip === 'application/pdf' || d.tip.startsWith('text/')));
  const brojke = useLiveQuery(async () => {
    const m = new Date().toISOString().slice(0, 7);
    const [r, b, a] = await Promise.all([
      db.razgovori.filter((x) => x.datum.startsWith(m)).count(),
      db.brzeBiljeske.filter((x) => !x.obradjena).count(),
      db.aktivnosti.filter((x) => x.datum.startsWith(m)).count(),
    ]);
    return { r, b, a };
  }, []);
  const kraj = useRef<HTMLDivElement>(null);
  const pokrenuto = useRef(false);

  useEffect(() => { kraj.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [poruke, radi]);

  const kontekstTekst = () => {
    if (!kon) return '';
    const dodatno = brojke ? [`Ovaj mjesec: ${brojke.r} razgovora, ${brojke.a} ostalih aktivnosti; neobrađenih brzih bilješki: ${brojke.b}.`] : [];
    return sazetakStanjaZaAI(kon.k, kon.stanje, dodatno);
  };

  const posalji = async (tekst: string) => {
    const t = tekst.trim();
    if (!t || radi) return;
    setGreska('');
    const nove = [...poruke, { uloga: 'user' as const, tekst: t }];
    setPoruke(nove);
    sacuvaj(nove);
    setUnos('');
    if (!imaKljuc()) {
      const pun = `${ASISTENT_SISTEM}\n\nTRENUTNO STANJE:\n${kontekstTekst()}\n\nPitanje: ${await anonimizujSve(t)}`;
      try { await navigator.clipboard.writeText(pun); toast('Kopirano – zalijepi u ChatGPT'); } catch { /* */ }
      const odg = [...nove, { uloga: 'assistant' as const, tekst: 'Nemaš podešen AI ključ, pa sam pitanje (sa svim potrebnim kontekstom) kopirao. Zalijepi ga u ChatGPT. Za odgovore direktno ovdje upiši Claude ili ChatGPT ključ u Postavkama.' }];
      setPoruke(odg); sacuvaj(odg);
      return;
    }
    setRadi(true);
    try {
      const anonimne = await Promise.all(nove.slice(-12).map(async (p) => ({ uloga: p.uloga, tekst: p.uloga === 'user' ? await anonimizujSve(p.tekst) : p.tekst })));
      // kontekst se dodaje uz zadnje pitanje (uvijek svjež)
      anonimne[anonimne.length - 1] = { uloga: 'user', tekst: `TRENUTNO STANJE:\n${kontekstTekst()}\n\nPITANJE: ${anonimne[anonimne.length - 1].tekst}` };
      let docs: AIDokument[] | undefined;
      if (saDokumentima && zaAI.length) {
        docs = [];
        let ukupno = 0;
        for (const d of zaAI) {
          if (ukupno + d.velicina > 20 * 1024 * 1024) break;
          ukupno += d.velicina;
          docs.push({ naziv: d.naziv, tip: d.tip === 'application/pdf' ? 'application/pdf' : 'text/plain', base64: await blobB64(d.podaci) });
        }
      }
      const odgovor = await generisi({ sistem: ASISTENT_SISTEM, poruke: anonimne, dokumenti: docs, napor: 'medium', maxTokens: 6000 });
      const sa = [...nove, { uloga: 'assistant' as const, tekst: odgovor }];
      setPoruke(sa); sacuvaj(sa);
    } catch (e) {
      setGreska(e instanceof AIGreska ? e.message : String(e));
    } finally {
      setRadi(false);
    }
  };

  useEffect(() => {
    if (pokrenuto.current || !kon || !pocetnoPitanje) return;
    pokrenuto.current = true;
    const p = BRZA_PITANJA.find((x) => x.kratko.toLowerCase().includes(pocetnoPitanje.toLowerCase()))?.pitanje ?? BRZA_PITANJA[0].pitanje;
    void posalji(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kon, pocetnoPitanje]);

  const obaveze = kon ? sljedeceObaveze(kon.stanje, 3) : [];

  return (
    <>
      <Zaglavlje naslov="AI asistent" nazadNa="/" desno={poruke.length ? (
        <button type="button" className="ikona-dugme" aria-label="Novi razgovor" title="Novi razgovor" onClick={() => { setPoruke([]); sacuvaj([]); }}><Ikona ime="plus" /></button>
      ) : undefined} />
      <main className="sadrzaj forma-sadrzaj">
        <div className="chat">
          <div className="poruka ai ulaz">
            <div className="autor">🤖 Asistent · {imaKljuc() ? nazivAI() : 'bez ključa'}</div>
            <p>Zdravo! Znam Pedagoške standarde USK, tvoju kontrolnu listu za inspekciju i rokove{zaAI.length ? `, a mogu čitati i ${zaAI.length} tvojih dokumenata` : ''}.</p>
            {kon && (
              <p className="malo">
                Spremnost dokumentacije: <strong>{spremnost(kon.stanje)}%</strong>.
                {obaveze.length > 0 && <> Sljedeće: {obaveze.map((o, i) => <span key={o.id}>{i ? '; ' : ' '}<strong>{o.def.naziv}</strong> (rok {prikaz(o.rok)}{o.kasni ? ', kasni' : ''})</span>)}.</>}
              </p>
            )}
          </div>
          {poruke.map((p, i) => (
            <div key={i} className={`poruka ${p.uloga === 'user' ? 'ja' : 'ai'} ulaz`}>
              {p.uloga === 'assistant' && <div className="autor">🤖 Asistent</div>}
              <p>{p.tekst}</p>
              {p.uloga === 'assistant' && (
                <button type="button" className="dugme tiho malo" style={{ minHeight: 30, padding: '2px 6px' }}
                  onClick={() => { void navigator.clipboard?.writeText(p.tekst); toast('Kopirano ✓'); }}>Kopiraj</button>
              )}
            </div>
          ))}
          {radi && <div className="poruka ai"><div className="ai-tacke"><span /><span /><span /></div></div>}
          {greska && <p style={{ color: 'var(--crvena)', fontWeight: 600 }}>{greska}</p>}
          <div ref={kraj} />
        </div>
        {poruke.length === 0 && (
          <div className="chipovi" style={{ marginTop: 8 }}>
            {BRZA_PITANJA.map((b) => <button key={b.kratko} type="button" className="chip mali" onClick={() => void posalji(b.pitanje)}>{b.kratko}</button>)}
          </div>
        )}
      </main>
      <div className="sticky-dno chat-unos">
        <div className="unutra" style={{ flexDirection: 'column', gap: 6 }}>
          {zaAI.length > 0 && (
            <label className="malo blijedo" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={saDokumentima} onChange={(e) => setSaDokumentima(e.target.checked)} /> Uključi moje dokumente ({zaAI.length})
            </label>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }} className="bez-margine">
              <TekstPolje labela="Pitanje" kratko vrijednost={unos} onChange={setUnos} placeholder="Pitaj nešto ili izdiktiraj…" />
            </div>
            <button type="button" className="dugme primarno" style={{ minHeight: 50 }} disabled={!unos.trim() || radi} onClick={() => void posalji(unos)} aria-label="Pošalji">
              <Ikona ime="posalji" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

async function blobB64(b: Blob): Promise<string> {
  const buf = new Uint8Array(await b.arrayBuffer());
  let s = '';
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(s);
}
