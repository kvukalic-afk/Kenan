import { Fragment, useEffect, useState } from 'react';
import { db } from '../db/db';
import { uuid } from '../db/repo';
import { Ikona } from '../components/Ikona';
import { DatumPolje, Izbor, Modal, Polje, Prazno, SifraPolje, TekstPolje } from '../components/Polja';
import { Zaglavlje } from '../components/Okvir';
import { useToast } from '../components/Toast';
import { AIGreska, anonimizujSve, generisi, imaKljuc, nazivAI } from '../lib/ai';
import { sastaviIzvore } from '../lib/analiza';
import { danasIso, prikaz } from '../lib/datum';
import { AIGreskaBlok, AIRazmislja, RucniAI, useAIPoziv } from '../components/AIRad';
import { procitajObrazac, sistemObrasca } from '../lib/aiAlati';
import { definicija, type DefinicijaObrasca } from '../lib/obrasci';
import { useImenik } from '../lib/podaci';
import { idi, nazad } from '../lib/router';
import type { PopunjenObrazac } from '../types';

export function Obrazac({ vrsta, id, sifra: pocSifra, biljeskaId }: { vrsta: string; id?: string; sifra?: string; biljeskaId?: string }) {
  const toast = useToast();
  const def = definicija(vrsta);
  const { ucenici, poSifri, razrednik } = useImenik();
  const [polja, setPolja] = useState<Record<string, string> | null>(null);
  const [greske, setGreske] = useState<Record<string, string>>({});
  const [nacrt, setNacrt] = useState(false);
  const [diktat, setDiktat] = useState(false);

  useEffect(() => {
    if (!def) return;
    (async () => {
      if (id) {
        const o = await db.obrasci.get(id);
        if (o) { setPolja(o.polja); return; }
      }
      const p: Record<string, string> = {};
      for (const f of def.polja) p[f.kljuc] = f.zadano ?? (f.tip === 'datum' && f.kljuc === 'datum' ? danasIso() : '');
      if (pocSifra) p.ucenik = pocSifra;
      if (biljeskaId) {
        const b = await db.brzeBiljeske.get(biljeskaId);
        if (b) {
          p.datum = b.datum;
          p.ucenik = b.sifra;
          p.sadrzaj = b.sroceno || b.tekst;
          p.prisutni = (b.osobe ?? []).join(', ');
          p.povod = b.kategorija ?? '';
        }
      }
      setPolja(p);
    })();
  }, [def, id, pocSifra, biljeskaId]);

  if (!def) return (<><Zaglavlje naslov="Obrazac" nazadNa="/dokumentacija?tab=obrasci" /><main className="sadrzaj"><Prazno>Nepoznat obrazac.</Prazno></main></>);
  if (!polja) return <Zaglavlje naslov={def.naziv} nazadNa="/dokumentacija?tab=obrasci" />;

  const postavi = (k: string, v: string) => {
    setPolja((p) => ({ ...(p ?? {}), [k]: v }));
    if (greske[k]) setGreske((g) => { const c = { ...g }; delete c[k]; return c; });
  };

  const sacuvaj = async (stampaj: boolean) => {
    const g: Record<string, string> = {};
    for (const f of def.polja) if (f.obavezno && !polja[f.kljuc]?.trim()) g[f.kljuc] = 'Obavezno polje.';
    setGreske(g);
    if (Object.keys(g).length) {
      setTimeout(() => document.querySelector('.ima-gresku')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 30);
      return;
    }
    const t = new Date().toISOString();
    const stari = id ? await db.obrasci.get(id) : undefined;
    const zapis: PopunjenObrazac = {
      id: stari?.id ?? uuid(), vrsta, datum: polja.datum || danasIso(), sifra: polja.ucenik ?? '', polja,
      createdAt: stari?.createdAt ?? t, updatedAt: t,
    };
    await db.obrasci.put(zapis);
    if (biljeskaId) await db.brzeBiljeske.update(biljeskaId, { obradjena: true, updatedAt: t });
    toast('Obrazac sačuvan ✓');
    if (stampaj) idi(`/print/obrazac/${zapis.id}`, true);
    else idi('/dokumentacija?tab=obrasci', true);
  };

  const u = polja.ucenik ? poSifri.get(polja.ucenik) : undefined;

  return (
    <>
      <header className="traka">
        <button type="button" className="ikona-dugme" onClick={() => nazad('/dokumentacija?tab=obrasci')} aria-label="Nazad"><Ikona ime="nazad" /></button>
        <h1>{def.naziv}</h1>
      </header>
      <main className="sadrzaj forma-sadrzaj ulaz">
        <p className="malo blijedo">{def.opis}</p>
        <button type="button" className="ai-baner" onClick={() => setDiktat(true)}>
          <span className="ai-baner-ikona">🎙</span>
          <span className="rastegni"><strong>Popuni iz diktata</strong><span>Ispričaj šta je bilo – AI popuni polja, ti provjeriš</span></span>
          <Ikona ime="desno" />
        </button>
        {def.aiNacrt && (
          <button type="button" className="chip ai-chip" style={{ marginBottom: 14 }} disabled={!polja.ucenik} onClick={() => setNacrt(true)}>
            ✨ AI nacrt iz evidencije učenika
          </button>
        )}
        {def.polja.map((f) => {
          const v = polja[f.kljuc] ?? '';
          if (f.tip === 'datum') return <DatumPolje key={f.kljuc} labela={f.labela} obavezno={f.obavezno} vrijednost={v} onChange={(x) => postavi(f.kljuc, x)} greska={greske[f.kljuc]} />;
          if (f.tip === 'ucenik') return <SifraPolje key={f.kljuc} labela={f.labela} obavezno={f.obavezno} vrijednost={v} onChange={(x) => postavi(f.kljuc, x)} ucenici={ucenici} razrednik={(r) => razrednik.get(r)} greska={greske[f.kljuc]} />;
          if (f.tip === 'izbor') return (
            <div key={f.kljuc} className={greske[f.kljuc] ? 'ima-gresku' : ''}>
              <Izbor labela={f.labela + (f.obavezno ? ' *' : '')} opcije={f.opcije ?? []} vrijednost={v} onChange={(x) => postavi(f.kljuc, x)} />
            </div>
          );
          if (f.tip === 'dugi') return <TekstPolje key={f.kljuc} labela={f.labela} obavezno={f.obavezno} vrijednost={v} onChange={(x) => postavi(f.kljuc, x)} ai={f.ai} greska={greske[f.kljuc]} />;
          return (
            <Polje key={f.kljuc} labela={f.labela} id={`ob-${f.kljuc}`} obavezno={f.obavezno} greska={greske[f.kljuc]} pomoc={f.pomoc}>
              <input id={`ob-${f.kljuc}`} type="text" value={v} onChange={(e) => postavi(f.kljuc, e.target.value)} />
            </Polje>
          );
        })}
        {u && <p className="malo blijedo">Na dokumentu: razred {u.razred}{razrednik.get(u.razred) ? `, razrednik ${razrednik.get(u.razred)}` : ''}.</p>}
        <p className="malo blijedo">Obrazac je izrađen prema uobičajenoj praksi; ako škola ili Pedagoški zavod imaju svoj obrazac, koristi njihov ili javi da se ovaj prilagodi.</p>
      </main>
      <div className="sticky-dno">
        <div className="unutra">
          <button type="button" className="dugme" onClick={() => void sacuvaj(false)}>Sačuvaj</button>
          <button type="button" className="dugme primarno" onClick={() => void sacuvaj(true)}><Ikona ime="print" /> Sačuvaj i štampaj</button>
        </div>
      </div>
      {diktat && <PopuniIzDiktata def={def} onZatvori={() => setDiktat(false)}
        onPrihvati={(v) => { for (const [k, x] of Object.entries(v)) postavi(k, x); setDiktat(false); toast(`Popunjeno ${Object.keys(v).length} polja ✓ Provjeri ih.`); }} />}
      {nacrt && polja.ucenik && <AINacrtMisljenja def={def} sifra={polja.ucenik} svrha={polja.svrha ?? ''} onZatvori={() => setNacrt(false)}
        onPrihvati={(n, m) => { postavi('nalaz', n); postavi('misljenje', m); setNacrt(false); }} />}
    </>
  );
}

const MISLJENJE_SISTEM = `Ti si iskusan školski psiholog u osnovnoj školi u BiH. Na osnovu evidencije (razgovori, bilješke, saradnja) napiši NACRT stručnog mišljenja o učeniku.
Vrati tačno dva dijela razdvojena linijom "---":
1) Zapažanja i nalaz – činjenični, hronološki sažet opis onoga što evidencija pokazuje (ponašanje, učenje, emocionalno stanje, odnosi, porodične okolnosti ako su navedene), uz oprez i bez dijagnoza.
2) Mišljenje i preporuke – stručno mišljenje i konkretne preporuke (školi, razredniku, roditeljima, eventualno upućivanje).
Pravila: bosanski jezik, ijekavica, stručan i objektivan stil, treće lice. Koristi SAMO podatke iz evidencije, ništa ne izmišljaj. Učenika navodi kao „učenik/ca“ ili šifrom. Bez naslova i potpisa.`;

function AINacrtMisljenja({ sifra, svrha, onZatvori, onPrihvati }: { def: DefinicijaObrasca; sifra: string; svrha: string; onZatvori: () => void; onPrihvati: (nalaz: string, misljenje: string) => void }) {
  const [faza, setFaza] = useState<'priprema' | 'salje' | 'gotovo' | 'greska' | 'bez'>('priprema');
  const [nalaz, setNalaz] = useState('');
  const [misljenje, setMisljenje] = useState('');
  const [greska, setGreska] = useState('');
  const [broj, setBroj] = useState(0);

  useEffect(() => {
    let ziv = true;
    (async () => {
      const [razgovori, biljeske, saradnja] = await Promise.all([
        db.razgovori.where('sifra').equals(sifra).toArray(),
        db.brzeBiljeske.where('sifra').equals(sifra).toArray(),
        db.saradnja.where('sifra').equals(sifra).toArray(),
      ]);
      const { tekst, broj } = sastaviIzvore({ biljeske, razgovori, saradnja });
      if (!ziv) return;
      setBroj(broj);
      if (!broj) { setGreska('Za ovog učenika nema zapisa u evidenciji.'); setFaza('greska'); return; }
      if (!imaKljuc()) { setFaza('bez'); return; }
      setFaza('salje');
      try {
        const r = await generisi({ sistem: MISLJENJE_SISTEM, poruke: [{ uloga: 'user', tekst: `Svrha mišljenja: ${svrha || 'nije navedena'}\n\nEvidencija (učenik ${sifra}):\n${await anonimizujSve(tekst)}` }], napor: 'medium' });
        const [a, ...b] = r.split(/\n-{3,}\n/);
        if (!ziv) return;
        setNalaz(a.replace(/^\s*1\)\s*Zapažanja i nalaz\s*[–:-]?\s*/i, '').trim());
        setMisljenje(b.join('\n').replace(/^\s*2\)\s*Mišljenje i preporuke\s*[–:-]?\s*/i, '').trim());
        setFaza('gotovo');
      } catch (e) {
        if (!ziv) return;
        setGreska(e instanceof AIGreska ? e.message : String(e));
        setFaza('greska');
      }
    })();
    return () => { ziv = false; };
  }, [sifra, svrha]);

  return (
    <Modal naslov="✨ AI nacrt mišljenja" onZatvori={onZatvori}>
      {faza === 'priprema' && <p className="ai-cekanje">Prikupljam evidenciju…</p>}
      {faza === 'salje' && <div className="ai-razmislja"><div className="ai-tacke"><span /><span /><span /></div><p className="ai-cekanje">{nazivAI()} piše nacrt iz {broj} zapisa…</p></div>}
      {faza === 'bez' && <p>Za AI nacrt upiši AI ključ (Claude ili ChatGPT) u Postavkama. Do tada piši ručno i koristi „✨ Sroči stručno“ uz polja.</p>}
      {faza === 'greska' && <p style={{ color: 'var(--crvena)', fontWeight: 600 }}>{greska}</p>}
      {faza === 'gotovo' && (
        <>
          <Polje labela="Zapažanja i nalaz" id="mn-n"><textarea id="mn-n" rows={7} value={nalaz} onChange={(e) => setNalaz(e.target.value)} style={{ overflow: 'auto' }} /></Polje>
          <Polje labela="Mišljenje i preporuke" id="mn-m"><textarea id="mn-m" rows={7} value={misljenje} onChange={(e) => setMisljenje(e.target.value)} style={{ overflow: 'auto' }} /></Polje>
          <p className="malo blijedo">Ovo je nacrt – provjeri svaku rečenicu. Mišljenje potpisuješ ti.</p>
        </>
      )}
      <div className="red-dugmadi">
        <button type="button" className="dugme" onClick={onZatvori}>Zatvori</button>
        {faza === 'gotovo' && <button type="button" className="dugme primarno" onClick={() => onPrihvati(nalaz, misljenje)}>Ubaci u obrazac</button>}
      </div>
    </Modal>
  );
}

/** Popuni polja obrasca iz slobodnog opisa ili diktata (npr. zapisnik sa sastanka). */
function PopuniIzDiktata({ def, onZatvori, onPrihvati }: { def: DefinicijaObrasca; onZatvori: () => void; onPrihvati: (v: Record<string, string>) => void }) {
  const ai = useAIPoziv();
  const [opis, setOpis] = useState('');
  const [rez, setRez] = useState<Record<string, string> | null>(null);
  const sistem = sistemObrasca(def);
  const poruka = async () => `Danas je ${prikaz(danasIso())}.\n\nOpis:\n${await anonimizujSve(opis)}`;
  const obradi = (t: string) => setRez(procitajObrazac(def, t));
  const posalji = async () => { const r = await ai.posalji({ sistem, poruke: [{ uloga: 'user', tekst: await poruka() }], napor: 'medium', maxTokens: 6000 }); if (r) obradi(r); };
  const labela = (k: string) => def.polja.find((f) => f.kljuc === k)?.labela ?? k;
  return (
    <Modal naslov={`🎙 ${def.naziv} iz diktata`} onZatvori={onZatvori}>
      {!rez && ai.faza === 'unos' && (
        <>
          <TekstPolje labela="Ispričaj ili izdiktiraj" vrijednost={opis} onChange={setOpis} autoFokus
            placeholder={def.vrsta === 'zapisnik' || def.vrsta === 'strucni-tim' ? 'npr. Danas u 12:30 u zbornici nastavničko vijeće, prisutni direktor, pedagog, psiholog i razrednici. Dnevni red: … Dogovoreno je da …' : 'Opiši šta se desilo, ko je bio prisutan i šta je dogovoreno.'} />
          <p className="malo blijedo">Imena učenika i razrednika se prije slanja zamijene šiframa i ulogama. AI sređuje tekst zapisnički, ali ne izmišlja.</p>
          {ai.automatski ? (
            <div className="red-dugmadi">
              <button type="button" className="dugme" onClick={onZatvori}>Odustani</button>
              <button type="button" className="dugme primarno" disabled={!opis.trim()} onClick={() => void posalji()}>✨ Popuni ({nazivAI()})</button>
            </div>
          ) : <RucniAI pripremi={async () => `${sistem}\n\n${await poruka()}`} onOdgovor={obradi} dugme="Prikaži polja" />}
        </>
      )}
      {ai.faza === 'salje' && <AIRazmislja tekst="Popunjavam polja…" />}
      {ai.faza === 'greska' && <AIGreskaBlok greska={ai.greska} onNazad={() => ai.setFaza('unos')} onPonovo={() => void posalji()} />}
      {rez && (
        <>
          {Object.keys(rez).length === 0 ? <p className="ai-greska">AI nije vratio polja u očekivanom obliku. Pokušaj ponovo.</p> : (
            <dl className="podaci">
              {Object.entries(rez).map(([k, v]) => <Fragment key={k}><dt>{labela(k)}</dt><dd>{def.polja.find((f) => f.kljuc === k)?.tip === 'datum' ? prikaz(v) : v}</dd></Fragment>)}
            </dl>
          )}
          <div className="red-dugmadi">
            <button type="button" className="dugme" onClick={() => { setRez(null); ai.setFaza('unos'); }}>Nazad</button>
            <button type="button" className="dugme primarno" disabled={!Object.keys(rez).length} onClick={() => onPrihvati(rez)}>Ubaci u obrazac</button>
          </div>
        </>
      )}
    </Modal>
  );
}
