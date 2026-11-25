import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { obrisi, uuid } from '../db/repo';
import { Ikona } from '../components/Ikona';
import { SrociDugme } from '../components/AI';
import { AnalizaModal } from '../components/AnalizaModal';
import { Modal, Polje, Potvrda, Prazno, SifraPolje, TekstPolje } from '../components/Polja';
import { Zaglavlje } from '../components/Okvir';
import { useToast } from '../components/Toast';
import { danasIso, pocetakSedmice, prikaz, skolskaGodinaZaDatum } from '../lib/datum';
import { kljucNacrta } from '../lib/forma';
import { sastaviIzvore } from '../lib/analiza';
import { nazivDana } from '../lib/periodIzvjestaj';
import { useImenik } from '../lib/podaci';
import { idi } from '../lib/router';
import { punoIme, type BrzaBiljeska } from '../types';

import { KATEGORIJE_BILJESKI } from '../lib/unosIzTeksta';
export { KATEGORIJE_BILJESKI };
const OSNOVNE_OSOBE = ['majka', 'otac', 'roditelji', 'razrednik', 'nastavnik', 'pedagog', 'direktor', 'grupa učenika', 'odjeljenje'];

const vrijeme = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

type Period = 'sve' | 'sedmica' | 'mjesec' | 'godina';

export function BrzeBiljeske({ pocetniTab }: { pocetniTab?: string }) {
  const toast = useToast();
  const { ucenici, poSifri, razrednik, razredi } = useImenik();
  const [tab, setTab] = useState<'biljeske' | 'analize'>(pocetniTab === 'analize' ? 'analize' : 'biljeske');
  const [tekst, setTekst] = useState('');
  const [sifra, setSifra] = useState('');
  const [kategorija, setKategorija] = useState(KATEGORIJE_BILJESKI[0]);
  const [osobe, setOsobe] = useState<string[]>([]);
  const [trazi, setTrazi] = useState('');
  const [filterKat, setFilterKat] = useState('');
  const [period, setPeriod] = useState<Period>('sve');
  const [samoNeobradjene, setSamoNeobradjene] = useState(false);
  const [analiza, setAnaliza] = useState(false);
  const biljeske = useLiveQuery(() => db.brzeBiljeske.orderBy('createdAt').reverse().toArray(), []);
  const analize = useLiveQuery(async () => (await db.analize.orderBy('createdAt').reverse().toArray()).filter((a) => !a.vrsta || a.vrsta === 'analiza'), []);

  const razredUcenika = sifra ? poSifri.get(sifra)?.razred ?? '' : '';
  const prijedloziOsoba = useMemo(() => {
    const s = new Set<string>();
    if (razredUcenika) s.add(`razrednik ${razredUcenika}`);
    for (const o of OSNOVNE_OSOBE) s.add(o);
    for (const r of razredi) s.add(`razrednik ${r.razred}`);
    for (const b of biljeske ?? []) for (const o of b.osobe ?? []) s.add(o);
    return [...s];
  }, [razredi, biljeske, razredUcenika]);

  const sacuvaj = async () => {
    if (!tekst.trim()) return;
    const t = new Date().toISOString();
    await db.brzeBiljeske.add({ id: uuid(), datum: danasIso(), sifra, tekst: tekst.trim(), sroceno: '', obradjena: false, kategorija, osobe, createdAt: t, updatedAt: t });
    setTekst('');
    setSifra('');
    setOsobe([]);
    toast('Bilješka sačuvana ✓');
  };

  const danas = danasIso();
  const odDatuma = period === 'sedmica' ? pocetakSedmice(danas) : period === 'mjesec' ? `${danas.slice(0, 7)}-01` : period === 'godina' ? `${skolskaGodinaZaDatum(new Date())}-09-01` : '';
  const q = trazi.trim().toLocaleLowerCase('bs');
  const prikazane = (biljeske ?? []).filter((b) => {
    if (samoNeobradjene && b.obradjena) return false;
    if (filterKat && b.kategorija !== filterKat) return false;
    if (odDatuma && b.datum < odDatuma) return false;
    if (!q) return true;
    const u = poSifri.get(b.sifra);
    return [b.tekst, b.sroceno, b.sifra, punoIme(u), u?.razred, (b.osobe ?? []).join(' '), b.kategorija].join(' ').toLocaleLowerCase('bs').includes(q);
  });
  const neobradjenih = (biljeske ?? []).filter((b) => !b.obradjena).length;

  // grupisanje po danima
  const poDanima: [string, BrzaBiljeska[]][] = [];
  for (const b of prikazane) {
    const z = poDanima[poDanima.length - 1];
    if (z && z[0] === b.datum) z[1].push(b);
    else poDanima.push([b.datum, [b]]);
  }

  const opisFiltera = [
    period === 'sedmica' ? 'ova sedmica' : period === 'mjesec' ? 'ovaj mjesec' : period === 'godina' ? 'ova školska godina' : 'sve bilješke',
    filterKat, q && `pretraga: „${trazi.trim()}“`, samoNeobradjene && 'samo neobrađene',
  ].filter(Boolean).join(', ');

  return (
    <>
      <Zaglavlje naslov="Bilješke" nazadNa="/" />
      <main className="sadrzaj">
        <div className="segment" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'biljeske'} onClick={() => setTab('biljeske')}>
            Bilješke {neobradjenih > 0 && <span className="znacka mala">{neobradjenih}</span>}
          </button>
          <button type="button" role="tab" aria-selected={tab === 'analize'} onClick={() => setTab('analize')}>
            🧠 Analize {analize?.length ? <span className="blijedo">({analize.length})</span> : null}
          </button>
        </div>

        {tab === 'biljeske' && (
          <>
            <section className="kartica kompozer ulaz">
              <TekstPolje labela="Šta se desilo / šta sam saznao/la?" vrijednost={tekst} onChange={setTekst} autoFokus
                placeholder="Zapiši ili izdiktiraj kako ti dođe – npr. „hodnik, razrednica 7-1 kaže da U056 često kasni i djeluje umorno“. AI će poslije srediti." />
              <div className="chipovi" style={{ marginBottom: 12 }} role="group" aria-label="Vrsta bilješke">
                {KATEGORIJE_BILJESKI.map((k) => (
                  <button key={k} type="button" className="chip mali" aria-pressed={kategorija === k} onClick={() => setKategorija(k)}>{k}</button>
                ))}
              </div>
              <SifraPolje labela="Učenik (nije obavezno)" vrijednost={sifra} onChange={setSifra} ucenici={ucenici} razrednik={(r) => razrednik.get(r)} />
              <OsobeTagovi vrijednost={osobe} onChange={setOsobe} prijedlozi={prijedloziOsoba} />
              <button type="button" className="dugme primarno blok" disabled={!tekst.trim()} onClick={() => void sacuvaj()}>
                <Ikona ime="kvacica" /> Sačuvaj bilješku
              </button>
            </section>

            <div className="filter-traka">
              <input type="search" placeholder="Traži u bilješkama (ime, tema, osoba)…" value={trazi} onChange={(e) => setTrazi(e.target.value)} aria-label="Pretraga bilješki" />
              <div className="filteri">
                {(['sve', 'sedmica', 'mjesec', 'godina'] as Period[]).map((p) => (
                  <button key={p} type="button" className="chip mali" aria-pressed={period === p} onClick={() => setPeriod(p)}>
                    {p === 'sve' ? 'Sve' : p === 'sedmica' ? 'Ova sedmica' : p === 'mjesec' ? 'Ovaj mjesec' : 'Školska godina'}
                  </button>
                ))}
                <select aria-label="Vrsta" value={filterKat} onChange={(e) => setFilterKat(e.target.value)} style={{ width: 'auto', minHeight: 36, padding: '4px 8px' }}>
                  <option value="">Sve vrste</option>
                  {KATEGORIJE_BILJESKI.map((k) => <option key={k}>{k}</option>)}
                </select>
                <button type="button" className="chip mali" aria-pressed={samoNeobradjene} onClick={() => setSamoNeobradjene(!samoNeobradjene)}>Neobrađene</button>
              </div>
            </div>

            <div className="naslov-sekcije">
              <h2>{prikazane.length} {prikazane.length === 1 ? 'bilješka' : 'bilješki'}</h2>
              {prikazane.length > 0 && (
                <button type="button" className="chip ai-chip mali" onClick={() => setAnaliza(true)}>🧠 AI analiza ({prikazane.length})</button>
              )}
            </div>

            {!biljeske ? null : prikazane.length === 0 ? (
              <Prazno>{(biljeske?.length ?? 0) === 0 ? 'Još nema bilješki. Zapiši prvu iznad – i ono usput sa hodnika se računa.' : 'Nema bilješki za ovaj filter.'}</Prazno>
            ) : (
              poDanima.map(([datum, lista]) => (
                <section key={datum} className="dan">
                  <h3 className="dan-naslov">{datum === danas ? 'Danas' : `${nazivDana(datum)}, ${prikaz(datum)}`}</h3>
                  {lista.map((b) => <KarticaBiljeske key={b.id} b={b} ime={punoIme(poSifri.get(b.sifra))} razred={poSifri.get(b.sifra)?.razred ?? ''} />)}
                </section>
              ))
            )}
          </>
        )}

        {tab === 'analize' && (
          <>
            <p className="malo blijedo">Analize čuvaju zaključke izvedene iz bilješki kroz vrijeme. Novu napraviš na tabu „Bilješke“ (filtriraj pa „AI analiza“) ili u kartonu učenika.</p>
            {!analize ? null : analize.length === 0 ? (
              <Prazno>Još nema analiza.</Prazno>
            ) : (
              <ul className="lista">
                {analize.map((a) => (
                  <li key={a.id}>
                    <a className="stavka" href={`#/analiza/${a.id}`}>
                      <span className="vrsta analiza" aria-hidden />
                      <span className="glavno">
                        <span className="red1">{a.naslov}</span>
                        <span className="red2">{a.opseg} · {a.brojIzvora} zapisa</span>
                      </span>
                      <span className="desno broj">{prikaz(a.datum)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
      {analiza && (() => {
        const { tekst: izv, broj } = sastaviIzvore({ biljeske: prikazane });
        return <AnalizaModal naslov="Analiza bilješki" opseg={opisFiltera} izvorniTekst={izv} brojIzvora={broj} onZatvori={() => setAnaliza(false)} />;
      })()}
    </>
  );
}

function OsobeTagovi({ vrijednost, onChange, prijedlozi }: { vrijednost: string[]; onChange: (v: string[]) => void; prijedlozi: string[] }) {
  const [unos, setUnos] = useState('');
  const dodaj = (o: string) => {
    const t = o.trim();
    if (t && !vrijednost.includes(t)) onChange([...vrijednost, t]);
    setUnos('');
  };
  const filtrirani = prijedlozi.filter((p) => !vrijednost.includes(p) && (!unos || p.toLowerCase().includes(unos.toLowerCase()))).slice(0, 8);
  return (
    <Polje labela="O kome / sa kim (nije obavezno)" id="osobe" pomoc="Uloga umjesto imena, npr. „razrednik 7-1“, „nastavnik matematike“, „majka“.">
      {vrijednost.length > 0 && (
        <div className="tagovi">
          {vrijednost.map((o) => (
            <span key={o} className="tag">{o}<button type="button" aria-label={`Ukloni ${o}`} onClick={() => onChange(vrijednost.filter((x) => x !== o))}>×</button></span>
          ))}
        </div>
      )}
      <input id="osobe" type="text" value={unos} placeholder="dodaj osobu ili ulogu…" onChange={(e) => setUnos(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); dodaj(unos); } }} />
      <div className="chipovi" style={{ marginTop: 6 }}>
        {filtrirani.map((p) => <button key={p} type="button" className="chip mali" onClick={() => dodaj(p)}>+ {p}</button>)}
      </div>
    </Polje>
  );
}

function KarticaBiljeske({ b, ime, razred }: { b: BrzaBiljeska; ime: string; razred: string }) {
  const toast = useToast();
  const [original, setOriginal] = useState(false);
  const [brisanje, setBrisanje] = useState(false);
  const [uredi, setUredi] = useState(false);
  const izmijeni = (iz: Partial<BrzaBiljeska>) => db.brzeBiljeske.update(b.id, { ...iz, updatedAt: new Date().toISOString() });

  const uRazgovor = async () => {
    await db.nacrti.put({
      kljuc: kljucNacrta('razgovor'), vrsta: 'razgovor', editId: '',
      podaci: { datum: b.datum, sifra: b.sifra, razred, biljeske: b.sroceno || b.tekst, vrstaKontakta: 'Individualni razgovor s učenikom' },
      updatedAt: new Date().toISOString(),
    });
    await izmijeni({ obradjena: true });
    idi('/novi/razgovor?nacrt=1');
  };

  return (
    <article className={`kartica biljeska ulaz ${b.obradjena ? 'obradjena' : ''}`}>
      <div className="razdvoji malo blijedo" style={{ marginBottom: 6 }}>
        <span>{vrijeme(b.createdAt)}</span>
        {b.kategorija && <span className="oznaka">{b.kategorija}</span>}
        <span className="rastegni" />
        {b.sifra && <a href={`#/ucenici/${encodeURIComponent(b.sifra)}`} className="oznaka primarna">{ime || b.sifra}{razred ? ` · ${razred}` : ''}</a>}
        {b.obradjena && <span className="oznaka zelena">obrađeno</span>}
      </div>
      {b.osobe?.length ? <div className="tagovi mali">{b.osobe.map((o) => <span key={o} className="tag">{o}</span>)}</div> : null}
      {b.sroceno && !original ? (
        <>
          <div className="ai-oznaka">✨ Stručno sročeno</div>
          <p className="tekst-biljeske">{b.sroceno}</p>
          <button type="button" className="dugme tiho malo" style={{ minHeight: 32, padding: '2px 6px' }} onClick={() => setOriginal(true)}>Prikaži original</button>
        </>
      ) : (
        <>
          <p className="tekst-biljeske">{b.tekst}</p>
          {b.sroceno && <button type="button" className="dugme tiho malo" style={{ minHeight: 32, padding: '2px 6px' }} onClick={() => setOriginal(false)}>Prikaži sročeno</button>}
        </>
      )}
      <div className="red-dugmadi akcije" style={{ marginTop: 10 }}>
        <SrociDugme tekst={b.tekst} vrsta="biljeska" onPrihvati={(t) => { void izmijeni({ sroceno: t }); toast('Sročeno ✓'); }} />
        {b.sifra && <button type="button" className="chip" onClick={() => void uRazgovor()}>→ Razgovor</button>}
        <a className="chip" href={`#/obrazac/sluzbena-biljeska?biljeska=${b.id}`}>📄 Službena bilješka</a>
        <button type="button" className="chip" onClick={() => void izmijeni({ obradjena: !b.obradjena })}>{b.obradjena ? '↺ Neobrađena' : '✓ Obrađeno'}</button>
        <button type="button" className="ikona-dugme" aria-label="Uredi bilješku" onClick={() => setUredi(true)}><Ikona ime="uredi" /></button>
        <button type="button" className="ikona-dugme" aria-label="Obriši bilješku" onClick={() => setBrisanje(true)}><Ikona ime="obrisi" /></button>
      </div>
      {uredi && <UrediBiljesku b={b} onZatvori={() => setUredi(false)} />}
      {brisanje && (
        <Potvrda naslov="Obrisati bilješku?" tekst="Bilješka će biti trajno obrisana." potvrdi="Obriši" opasno onOdustani={() => setBrisanje(false)}
          onPotvrdi={async () => { await obrisi('brzeBiljeske', b.id); setBrisanje(false); toast('Obrisano'); }} />
      )}
    </article>
  );
}

function UrediBiljesku({ b, onZatvori }: { b: BrzaBiljeska; onZatvori: () => void }) {
  const toast = useToast();
  const { ucenici } = useImenik();
  const [tekst, setTekst] = useState(b.tekst);
  const [sroceno, setSroceno] = useState(b.sroceno);
  const [sifra, setSifra] = useState(b.sifra);
  const [kategorija, setKategorija] = useState(b.kategorija ?? '');
  return (
    <Modal naslov="Uredi bilješku" onZatvori={onZatvori}>
      <TekstPolje labela="Original" vrijednost={tekst} onChange={setTekst} />
      {b.sroceno && <TekstPolje labela="Sročeno" vrijednost={sroceno} onChange={setSroceno} />}
      <div className="chipovi" style={{ marginBottom: 12 }}>
        {KATEGORIJE_BILJESKI.map((k) => <button key={k} type="button" className="chip mali" aria-pressed={kategorija === k} onClick={() => setKategorija(k)}>{k}</button>)}
      </div>
      <SifraPolje labela="Učenik" vrijednost={sifra} onChange={setSifra} ucenici={ucenici} />
      <div className="red-dugmadi">
        <button type="button" className="dugme" onClick={onZatvori}>Odustani</button>
        <button type="button" className="dugme primarno" onClick={async () => {
          await db.brzeBiljeske.update(b.id, { tekst: tekst.trim(), sroceno, sifra, kategorija, updatedAt: new Date().toISOString() });
          toast('Sačuvano ✓'); onZatvori();
        }}>Sačuvaj</button>
      </div>
    </Modal>
  );
}
