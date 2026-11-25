import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { uuid } from '../db/repo';
import { Ikona } from '../components/Ikona';
import { Modal, Polje, TekstPolje } from '../components/Polja';
import { Zaglavlje } from '../components/Okvir';
import { useToast } from '../components/Toast';
import { AIGreskaBlok, AIRazmislja, RucniAI, useAIPoziv } from '../components/AIRad';
import { anonimizujSve, imaKljuc, nazivAI } from '../lib/ai';
import { LETAK_SISTEM, procitajRadionicu, RADIONICA_SISTEM, type PrijedlogRadionice } from '../lib/aiAlati';
import { danasIso, dodajDane, prikaz } from '../lib/datum';
import { kljucNacrta } from '../lib/forma';
import { normalizujRazred } from '../lib/sifra';
import { idi } from '../lib/router';

type Alat = { ikona: string; naslov: string; opis: string; href?: string; akcija?: 'radionica' | 'letak'; boja: string };

const danas = () => danasIso();
const prosliMjesec = () => {
  const kraj = dodajDane(`${danas().slice(0, 7)}-01`, -1);
  return `#/izvjestaj?od=${kraj.slice(0, 8)}01&do=${kraj}`;
};

const ALATI: (Alat | string)[] = [
  'Svaki dan',
  { ikona: '🎙', naslov: 'Ispričaj dan', opis: 'Izdiktiraj šta si radio/la – AI napravi razgovore, bilješke i aktivnosti', href: '#/unos-tekst', boja: 'ljubicasta' },
  { ikona: '🌅', naslov: 'Šta danas prvo', opis: 'Jutarnji plan iz rokova, zakazanih kontakata i koraka', href: '#/', boja: 'narandzasta' },
  { ikona: '📝', naslov: 'Zapisnik sa sastanka', opis: 'Vijeće, aktiv, roditeljski – iz diktata u gotov zapisnik', href: '#/obrazac/zapisnik', boja: 'plava' },
  'Planiranje i izvještaji',
  { ikona: '🗂', naslov: 'Plan rada s AI', opis: 'Godišnji program po 11 područja iz tvog opisa dogovora', href: '#/plan?ai=1', boja: 'zelena' },
  { ikona: '📊', naslov: 'Izvještaj jednim klikom', opis: 'Mjesečni, polugodišnji, godišnji – iz evidencije', href: prosliMjesec(), boja: 'plava' },
  'Rad s učenicima',
  { ikona: '🧩', naslov: 'Učenik s teškoćama', opis: 'U kartonu: procjena teškoća i priprema za razgovor', href: '#/ucenici', boja: 'ljubicasta' },
  { ikona: '🧠', naslov: 'Analiza bilješki', opis: 'Obrasci i zaključci iz bilješki kroz vrijeme', href: '#/biljeske', boja: 'zelena' },
  { ikona: '🎲', naslov: 'Osmisli radionicu', opis: 'Cilj, tok, materijal i evaluacija za razred i temu', akcija: 'radionica', boja: 'narandzasta' },
  { ikona: '📄', naslov: 'Letak za roditelje ili nastavnike', opis: 'Kratki praktični savjeti za print na jednoj strani', akcija: 'letak', boja: 'plava' },
  'Savjetnik',
  { ikona: '🤖', naslov: 'AI asistent', opis: 'Propisi, dokumentacija, rokovi, savjet', href: '#/asistent', boja: 'ljubicasta' },
];

export function PametniAlati() {
  const [otvoreno, setOtvoreno] = useState<'radionica' | 'letak' | null>(null);
  const dokumenti = useLiveQuery(async () => (await db.analize.orderBy('createdAt').reverse().toArray()).filter((a) => a.vrsta === 'letak' || a.vrsta === 'priprema-radionice'), []);
  return (
    <>
      <Zaglavlje naslov="Pametni alati" nazadNa="/" />
      <main className="sadrzaj">
        <section className="ai-hero">
          <span className="ai-hero-ikona"><Ikona ime="iskra" /></span>
          <div>
            <h2>AI kao asistent, savjetnik i organizator</h2>
            <p>{imaKljuc() ? `Povezano: ${nazivAI()}. ` : 'Bez AI ključa alati rade preko ChatGPT-a ili Claudea (kopiraj–zalijepi). '}Imena učenika i razrednika se prije slanja uvijek zamijene šiframa i ulogama.</p>
          </div>
        </section>
        {ALATI.map((a, i) => typeof a === 'string' ? (
          <div key={a} className="naslov-sekcije"><h2>{a}</h2></div>
        ) : (
          a.href ? (
            <a key={i} className={`alat ${a.boja}`} href={a.href}>
              <span className="alat-ikona">{a.ikona}</span>
              <span className="rastegni"><strong>{a.naslov}</strong><span>{a.opis}</span></span>
              <Ikona ime="desno" />
            </a>
          ) : (
            <button key={i} type="button" className={`alat ${a.boja}`} onClick={() => setOtvoreno(a.akcija!)}>
              <span className="alat-ikona">{a.ikona}</span>
              <span className="rastegni"><strong>{a.naslov}</strong><span>{a.opis}</span></span>
              <Ikona ime="desno" />
            </button>
          )
        ))}

        {dokumenti && dokumenti.length > 0 && (
          <>
            <div className="naslov-sekcije"><h2>Moje pripreme i letci</h2></div>
            <ul className="lista">
              {dokumenti.map((d) => (
                <li key={d.id}>
                  <a className="stavka" href={`#/print/analiza/${d.id}`}>
                    <span className="glavno"><span className="red1">{d.vrsta === 'letak' ? '📄' : '🎲'} {d.naslov}</span><span className="red2">{d.opseg}</span></span>
                    <span className="desno broj">{prikaz(d.datum)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
      {otvoreno === 'radionica' && <OsmisliRadionicu onZatvori={() => setOtvoreno(null)} />}
      {otvoreno === 'letak' && <NapisiLetak onZatvori={() => setOtvoreno(null)} />}
    </>
  );
}

const GRUPE = ['Učenici', 'Roditelji', 'Nastavnici'];

function OsmisliRadionicu({ onZatvori }: { onZatvori: () => void }) {
  const toast = useToast();
  const ai = useAIPoziv();
  const [razred, setRazred] = useState('');
  const [tema, setTema] = useState('');
  const [trajanje, setTrajanje] = useState(45);
  const [grupa, setGrupa] = useState('Učenici');
  const [r, setR] = useState<PrijedlogRadionice | null>(null);
  const poruka = async () => `Razred / uzrast: ${razred || 'nije naveden'}\nCiljna grupa: ${grupa}\nTrajanje: ${trajanje} minuta\nTema ili potreba: ${await anonimizujSve(tema)}`;
  const obradi = (t: string) => { const p = procitajRadionicu(t); if (p) setR(p); else toast('AI nije vratio radionicu u očekivanom obliku. Pokušaj ponovo.', 'greska'); };
  const posalji = async () => { const x = await ai.posalji({ sistem: RADIONICA_SISTEM, poruke: [{ uloga: 'user', tekst: await poruka() }], napor: 'medium', maxTokens: 5000 }); if (x) obradi(x); };
  const tekstPripreme = (p: PrijedlogRadionice) => [
    'Cilj:', p.cilj, '', 'Tok aktivnosti:', p.tokAktivnosti, '', 'Materijal:', p.materijal, '', 'Evaluacija:', p.evaluacija, ...(p.napomena ? ['', 'Napomena za voditelja:', p.napomena] : []),
  ].join('\n');

  const sacuvajPripremu = async () => {
    if (!r) return;
    const t = new Date().toISOString();
    const id = uuid();
    await db.analize.add({ id, vrsta: 'priprema-radionice', datum: danasIso(), naslov: r.tema, opseg: [razred && `razred ${razred}`, grupa.toLowerCase(), `${trajanje} min`].filter(Boolean).join(' · '), sifra: '', tekst: tekstPripreme(r), brojIzvora: 0, createdAt: t, updatedAt: t });
    toast('Priprema sačuvana ✓');
    onZatvori();
    idi(`/print/analiza/${id}`);
  };
  const evidentiraj = async () => {
    if (!r) return;
    await db.nacrti.put({
      kljuc: kljucNacrta('radionica'), vrsta: 'radionica', editId: '', updatedAt: new Date().toISOString(),
      podaci: { datum: danasIso(), razred: normalizujRazred(razred) || razred, tema: r.tema, ciljnaGrupa: grupa, trajanjeMin: trajanje, cilj: r.cilj, tokAktivnosti: [r.tokAktivnosti, r.materijal && `Materijal: ${r.materijal}`].filter(Boolean).join('\n\n'), evaluacija: r.evaluacija, napomena: r.napomena, zapazanja: '', brojUcesnika: null, ucenicizaPracenje: [], oblast: '' },
    });
    onZatvori();
    idi('/novi/radionica?nacrt=1');
  };

  return (
    <Modal naslov="🎲 Osmisli radionicu" onZatvori={onZatvori}>
      {!r && ai.faza === 'unos' && (
        <>
          <div className="dva-stupca">
            <Polje labela="Razred ili uzrast" id="rad-raz"><input id="rad-raz" type="text" value={razred} onChange={(e) => setRazred(e.target.value)} placeholder="npr. 6-2 ili 3. razred" /></Polje>
            <Polje labela="Trajanje" id="rad-traj">
              <select id="rad-traj" value={trajanje} onChange={(e) => setTrajanje(Number(e.target.value))}>
                {[30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} minuta</option>)}
              </select>
            </Polje>
          </div>
          <Polje labela="Za koga" id="rad-gr" grupa>
            <div className="chipovi">{GRUPE.map((g) => <button key={g} type="button" className="chip mali" aria-pressed={grupa === g} onClick={() => setGrupa(g)}>{g}</button>)}</div>
          </Polje>
          <TekstPolje labela="Tema ili potreba" vrijednost={tema} onChange={setTema} kratko
            placeholder="npr. vršnjačko nasilje i uloga posmatrača; razred je podijeljen u grupice" />
          {ai.automatski ? (
            <div className="red-dugmadi">
              <button type="button" className="dugme" onClick={onZatvori}>Odustani</button>
              <button type="button" className="dugme primarno" disabled={!tema.trim()} onClick={() => void posalji()}>✨ Osmisli ({nazivAI()})</button>
            </div>
          ) : <RucniAI pripremi={async () => `${RADIONICA_SISTEM}\n\n${await poruka()}`} onOdgovor={obradi} dugme="Prikaži radionicu" />}
        </>
      )}
      {ai.faza === 'salje' && <AIRazmislja tekst="Osmišljavam radionicu…" />}
      {ai.faza === 'greska' && <AIGreskaBlok greska={ai.greska} onNazad={() => ai.setFaza('unos')} onPonovo={() => void posalji()} />}
      {r && (
        <>
          <h3 className="ai-rezultat-naslov">{r.tema}</h3>
          <div className="ai-odgovor">{tekstPripreme(r)}</div>
          <div className="red-dugmadi">
            <button type="button" className="dugme" onClick={() => { setR(null); ai.setFaza('unos'); }}>Nazad</button>
            <button type="button" className="dugme" onClick={() => void sacuvajPripremu()}><Ikona ime="print" /> Sačuvaj pripremu</button>
            <button type="button" className="dugme primarno" onClick={() => void evidentiraj()}>Evidentiraj održanu</button>
          </div>
        </>
      )}
    </Modal>
  );
}

function NapisiLetak({ onZatvori }: { onZatvori: () => void }) {
  const toast = useToast();
  const ai = useAIPoziv();
  const [tema, setTema] = useState('');
  const [zaKoga, setZaKoga] = useState('Roditelji');
  const [uzrast, setUzrast] = useState('');
  const [tekst, setTekst] = useState('');
  const poruka = async () => `Letak za: ${zaKoga.toLowerCase()}\nUzrast djece: ${uzrast || 'osnovna škola'}\nTema: ${await anonimizujSve(tema)}`;
  const posalji = async () => { const x = await ai.posalji({ sistem: LETAK_SISTEM, poruke: [{ uloga: 'user', tekst: await poruka() }], napor: 'medium', maxTokens: 4000 }); if (x) setTekst(x.trim()); };
  const sacuvaj = async () => {
    const t = new Date().toISOString();
    const id = uuid();
    const naslov = tekst.trim().split('\n')[0].replace(/^#+\s*/, '').slice(0, 120);
    await db.analize.add({ id, vrsta: 'letak', datum: danasIso(), naslov, opseg: `Za ${zaKoga.toLowerCase()}${uzrast ? ` · ${uzrast}` : ''}`, sifra: '', tekst: tekst.trim(), brojIzvora: 0, createdAt: t, updatedAt: t });
    toast('Letak sačuvan ✓');
    onZatvori();
    idi(`/print/analiza/${id}`);
  };
  return (
    <Modal naslov="📄 Letak" onZatvori={onZatvori}>
      {!tekst && ai.faza === 'unos' && (
        <>
          <Polje labela="Za koga" id="let-gr" grupa>
            <div className="chipovi">{GRUPE.map((g) => <button key={g} type="button" className="chip mali" aria-pressed={zaKoga === g} onClick={() => setZaKoga(g)}>{g}</button>)}</div>
          </Polje>
          <TekstPolje labela="Tema" vrijednost={tema} onChange={setTema} kratko placeholder="npr. kako pomoći djetetu koje ima strah od ispitivanja" />
          <Polje labela="Uzrast (nije obavezno)" id="let-uz"><input id="let-uz" type="text" value={uzrast} onChange={(e) => setUzrast(e.target.value)} placeholder="npr. 1–4. razred" /></Polje>
          {ai.automatski ? (
            <div className="red-dugmadi">
              <button type="button" className="dugme" onClick={onZatvori}>Odustani</button>
              <button type="button" className="dugme primarno" disabled={!tema.trim()} onClick={() => void posalji()}>✨ Napiši letak ({nazivAI()})</button>
            </div>
          ) : <RucniAI pripremi={async () => `${LETAK_SISTEM}\n\n${await poruka()}`} onOdgovor={(t) => setTekst(t.trim())} dugme="Prikaži letak" />}
        </>
      )}
      {ai.faza === 'salje' && <AIRazmislja tekst="Pišem letak…" />}
      {ai.faza === 'greska' && <AIGreskaBlok greska={ai.greska} onNazad={() => ai.setFaza('unos')} onPonovo={() => void posalji()} />}
      {tekst && (
        <>
          <Polje labela="Letak (možeš urediti – prvi red je naslov)" id="let-tekst">
            <textarea id="let-tekst" rows={14} value={tekst} onChange={(e) => setTekst(e.target.value)} style={{ overflow: 'auto' }} />
          </Polje>
          <div className="red-dugmadi">
            <button type="button" className="dugme" onClick={() => { setTekst(''); ai.setFaza('unos'); }}>Nazad</button>
            <button type="button" className="dugme primarno" onClick={() => void sacuvaj()}><Ikona ime="print" /> Sačuvaj i štampaj</button>
          </div>
        </>
      )}
    </Modal>
  );
}
