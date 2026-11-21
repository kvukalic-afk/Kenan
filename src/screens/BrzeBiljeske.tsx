import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { obrisi, uuid } from '../db/repo';
import { Ikona } from '../components/Ikona';
import { SrociDugme } from '../components/AI';
import { Potvrda, Prazno, SifraPolje, TekstPolje } from '../components/Polja';
import { Zaglavlje } from '../components/Okvir';
import { useToast } from '../components/Toast';
import { danasIso, prikaz } from '../lib/datum';
import { kljucNacrta } from '../lib/forma';
import { useImenik } from '../lib/podaci';
import { idi } from '../lib/router';
import { punoIme, type BrzaBiljeska } from '../types';

const vrijeme = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export function BrzeBiljeske() {
  const toast = useToast();
  const { ucenici, poSifri, razrednik } = useImenik();
  const [tekst, setTekst] = useState('');
  const [sifra, setSifra] = useState('');
  const [sve, setSve] = useState(false);
  const biljeske = useLiveQuery(() => db.brzeBiljeske.orderBy('createdAt').reverse().toArray(), []);

  const sacuvaj = async () => {
    if (!tekst.trim()) return;
    const t = new Date().toISOString();
    await db.brzeBiljeske.add({ id: uuid(), datum: danasIso(), sifra, tekst: tekst.trim(), sroceno: '', obradjena: false, createdAt: t, updatedAt: t });
    setTekst('');
    setSifra('');
    toast('Bilješka sačuvana ✓');
  };

  const prikazane = (biljeske ?? []).filter((b) => sve || !b.obradjena);
  const neobradjenih = (biljeske ?? []).filter((b) => !b.obradjena).length;

  return (
    <>
      <Zaglavlje naslov="Brze bilješke" nazadNa="/" />
      <main className="sadrzaj">
        <section className="kartica kompozer">
          <TekstPolje labela="Šta se desilo?" vrijednost={tekst} onChange={setTekst} autoFokus
            placeholder="Zapiši kako ti dođe – npr. „hodnik, U056 plakala, kaže da je dirali u busu, javit razredniku“. AI će poslije srediti." />
          <SifraPolje labela="Učenik (nije obavezno)" vrijednost={sifra} onChange={setSifra} ucenici={ucenici} razrednik={(r) => razrednik.get(r)} />
          <button type="button" className="dugme primarno blok" disabled={!tekst.trim()} onClick={() => void sacuvaj()}>
            <Ikona ime="kvacica" /> Sačuvaj bilješku
          </button>
        </section>

        <div className="naslov-sekcije">
          <h2>{sve ? 'Sve bilješke' : `Za obradu (${neobradjenih})`}</h2>
          <button type="button" className="chip mali" aria-pressed={sve} onClick={() => setSve(!sve)}>{sve ? 'Samo neobrađene' : 'Prikaži sve'}</button>
        </div>
        {!biljeske ? null : prikazane.length === 0 ? (
          <Prazno>{sve ? 'Još nema brzih bilješki.' : 'Nema neobrađenih bilješki. 👍'}</Prazno>
        ) : (
          prikazane.map((b) => <KarticaBiljeske key={b.id} b={b} ime={punoIme(poSifri.get(b.sifra))} razred={poSifri.get(b.sifra)?.razred ?? ''} />)
        )}
      </main>
    </>
  );
}

function KarticaBiljeske({ b, ime, razred }: { b: BrzaBiljeska; ime: string; razred: string }) {
  const toast = useToast();
  const [original, setOriginal] = useState(false);
  const [brisanje, setBrisanje] = useState(false);
  const izmijeni = (iz: Partial<BrzaBiljeska>) => db.brzeBiljeske.update(b.id, { ...iz, updatedAt: new Date().toISOString() });

  const uRazgovor = async () => {
    // pripremi nacrt novog razgovora i otvori formu
    await db.nacrti.put({
      kljuc: kljucNacrta('razgovor'), vrsta: 'razgovor', editId: '',
      podaci: { datum: b.datum, sifra: b.sifra, razred, biljeske: b.sroceno || b.tekst, vrstaKontakta: 'Individualni razgovor s učenikom' },
      updatedAt: new Date().toISOString(),
    });
    await izmijeni({ obradjena: true });
    idi('/novi/razgovor?nacrt=1');
  };

  return (
    <article className={`kartica biljeska ${b.obradjena ? 'obradjena' : ''}`}>
      <div className="razdvoji malo blijedo" style={{ marginBottom: 6 }}>
        <span className="rastegni">{prikaz(b.datum)} u {vrijeme(b.createdAt)}</span>
        {b.sifra && <a href={`#/ucenici/${encodeURIComponent(b.sifra)}`} className="oznaka primarna">{ime || b.sifra}{razred ? ` · ${razred}` : ''}</a>}
        {b.obradjena && <span className="oznaka zelena">obrađeno</span>}
      </div>
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
      <div className="red-dugmadi" style={{ marginTop: 10 }}>
        <SrociDugme tekst={b.tekst} vrsta="biljeska" onPrihvati={(t) => { void izmijeni({ sroceno: t }); toast('Sročeno ✓'); }} />
        {b.sifra && <button type="button" className="chip" onClick={() => void uRazgovor()}>→ U razgovor</button>}
        <button type="button" className="chip" onClick={() => void izmijeni({ obradjena: !b.obradjena })}>{b.obradjena ? 'Vrati u neobrađene' : '✓ Obrađeno'}</button>
        <button type="button" className="ikona-dugme" aria-label="Obriši bilješku" onClick={() => setBrisanje(true)}><Ikona ime="obrisi" /></button>
      </div>
      {brisanje && (
        <Potvrda naslov="Obrisati bilješku?" tekst="Bilješka će biti trajno obrisana." potvrdi="Obriši" opasno onOdustani={() => setBrisanje(false)}
          onPotvrdi={async () => { await obrisi('brzeBiljeske', b.id); setBrisanje(false); toast('Obrisano'); }} />
      )}
    </article>
  );
}
