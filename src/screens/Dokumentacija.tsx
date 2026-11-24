import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { obrisi, uuid } from '../db/repo';
import { Ikona } from '../components/Ikona';
import { DatumPolje, Modal, Polje, Potvrda, Prazno } from '../components/Polja';
import { Zaglavlje } from '../components/Okvir';
import { useToast } from '../components/Toast';
import { prikaz } from '../lib/datum';
import { GRUPE, IZVORI, PROPIS_TEKST, spremnost } from '../lib/dokumentacija';
import { definicija, OBRASCI } from '../lib/obrasci';
import { PODRUCJA } from '../lib/podrucja';
import { useImenik, usePostavke } from '../lib/podaci';
import { sacuvajPostavke } from '../db/repo';
import { idi } from '../lib/router';
import { potvrdiStavku, useKontrola } from '../lib/useKontrola';
import { punoIme, type MojDokument, type Postavke } from '../types';

type Tab = 'spremnost' | 'obrasci' | 'dokumenti' | 'propisi';
const TABOVI: [Tab, string][] = [['spremnost', 'Spremnost'], ['obrasci', 'Obrasci'], ['dokumenti', 'Moji dokumenti'], ['propisi', 'Propisi']];

export function Dokumentacija({ pocetniTab }: { pocetniTab?: string }) {
  const [tab, setTab] = useState<Tab>((TABOVI.find(([t]) => t === pocetniTab)?.[0]) ?? 'spremnost');
  const promijeni = (t: Tab) => { setTab(t); idi(`/dokumentacija?tab=${t}`, true); };
  return (
    <>
      <Zaglavlje naslov="Dokumentacija" nazadNa="/statistika" />
      <main className="sadrzaj">
        <div className="segment cetiri" role="tablist">
          {TABOVI.map(([t, n]) => <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => promijeni(t)}>{n}</button>)}
        </div>
        <div key={tab} className="ulaz">
          {tab === 'spremnost' && <Spremnost />}
          {tab === 'obrasci' && <Obrasci />}
          {tab === 'dokumenti' && <MojiDokumenti />}
          {tab === 'propisi' && <Propisi />}
        </div>
      </main>
    </>
  );
}

function Spremnost() {
  const toast = useToast();
  const kon = useKontrola();
  if (!kon) return null;
  const { stanje } = kon;
  const pct = spremnost(stanje);
  return (
    <>
      <section className="kartica spremnost-kartica">
        <div className="prsten" style={{ ['--pct' as string]: `${pct}` }} aria-label={`Spremnost ${pct}%`}><span>{pct}%</span></div>
        <div>
          <h2 style={{ margin: 0 }}>Spremnost za inspekciju</h2>
          <p className="malo blijedo" style={{ margin: '4px 0 0' }}>
            {stanje.filter((s) => s.gotovo).length} od {stanje.length} stavki uredno.
            {stanje.some((s) => s.kasni) ? ` ${stanje.filter((s) => s.kasni).length} kasni.` : ''}
          </p>
          <a className="chip ai-chip mali" href="#/asistent?pitanje=inspekcija" style={{ marginTop: 8, display: 'inline-flex' }}>🤖 Pitaj AI šta mi fali</a>
        </div>
      </section>
      <MojPocetak />
      {GRUPE.map((g) => {
        const stavke = stanje.filter((s) => s.def.grupa === g.kljuc);
        if (!stavke.length) return null;
        const gotovih = stavke.filter((s) => s.gotovo).length;
        return (
          <section key={g.kljuc}>
            <div className="naslov-sekcije"><h2>{g.naziv}</h2><span className="malo blijedo">{gotovih}/{stavke.length}</span></div>
            <ul className="kontrolna">
              {stavke.map((s) => (
                <li key={s.id} className={`${s.gotovo ? 'gotovo' : ''} ${s.kasni ? 'kasni' : ''}`}>
                  <button type="button" className="kvacica-dugme" aria-pressed={s.gotovo} aria-label={`${s.def.naziv}: ${s.gotovo ? 'urađeno' : 'nije urađeno'}`}
                    onClick={async () => { await potvrdiStavku(s.id, !s.rucno); toast(!s.rucno ? 'Označeno ✓' : 'Vraćeno'); }}>
                    {s.gotovo ? '✓' : ''}
                  </button>
                  <div className="rastegni">
                    <strong>{s.def.naziv}</strong>
                    <div className="malo blijedo">{s.def.opis}</div>
                    <div className="osnov">Osnov: {s.def.osnov}</div>
                    <div className="malo" style={{ marginTop: 4 }}>
                      <span className={`oznaka ${s.gotovo ? 'zelena' : s.kasni ? 'crvena' : s.danaDoRoka <= 7 ? 'narandzasta' : ''}`}>
                        {s.gotovo ? 'urađeno' : s.kasni ? `kasni (rok ${prikaz(s.rok)})` : `rok ${prikaz(s.rok)}`}
                      </span>
                      {s.auto && <span className="blijedo"> · {s.auto.tekst}</span>}
                    </div>
                  </div>
                  {s.link && <a className="ikona-dugme" href={`#${s.link}`} aria-label={`Otvori: ${s.def.naziv}`}><Ikona ime="desno" /></a>}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <a className="dugme" href={`#/print/dokumentacija/${kon.k.godina}`} style={{ margin: '8px 0 12px' }}><Ikona ime="print" /> Štampaj pregled obavezne dokumentacije</a>
      <p className="malo blijedo">Stavke se potvrđuju dodirom na kvadratić (npr. kad odštampaš i potpišeš). Neke se provjeravaju automatski iz podataka u appu. Uz svaku stavku piše osnov: propis (Zakon o osnovnom odgoju i obrazovanju USK, Pedagoški standardi USK) ili „dobra praksa“ kad propis to izričito ne traži. Pravilnike ministra (o dokumentaciji škole, o stručnom ispitu, o djeci s teškoćama) nisam našao javno – kad ih dobiješ, ubaci ih u „Moji dokumenti“.</p>
    </>
  );
}

function MojPocetak() {
  const postavke = usePostavke();
  const [otvoreno, setOtvoreno] = useState(!postavke.pocetakRada);
  const sacuvaj = (iz: Partial<Postavke>) => void sacuvajPostavke(iz);
  if (!otvoreno && postavke.pocetakRada) {
    return (
      <p className="malo blijedo" style={{ margin: '0 0 8px' }}>
        U školi od <strong>{prikaz(postavke.pocetakRada)}</strong>{postavke.pripravnik ? ' · pripravnik' : ''}.{' '}
        <button type="button" className="link" onClick={() => setOtvoreno(true)}>Promijeni</button>
      </p>
    );
  }
  return (
    <section className="kartica">
      <h2 style={{ marginTop: 0 }}>Moj početak rada</h2>
      <p className="malo blijedo">Za novozaposlenog app pomjera rokove: ono što je trebalo biti gotovo prije tvog dolaska dobija rok od dolaska, a mjesečne obaveze počinju od mjeseca dolaska.</p>
      <DatumPolje labela="Počeo/la sam raditi u ovoj školi" vrijednost={postavke.pocetakRada ?? ''} onChange={(v) => sacuvaj({ pocetakRada: v })} />
      <div className="chipovi" style={{ marginBottom: 8 }}>
        <span className="malo blijedo" style={{ alignSelf: 'center' }}>Prvo zaposlenje u školi (pripravnik)?</span>
        <button type="button" className="chip mali" aria-pressed={!!postavke.pripravnik} onClick={() => sacuvaj({ pripravnik: true })}>Da</button>
        <button type="button" className="chip mali" aria-pressed={!postavke.pripravnik} onClick={() => sacuvaj({ pripravnik: false })}>Ne</button>
      </div>
      {postavke.pocetakRada && <button type="button" className="dugme primarno" onClick={() => setOtvoreno(false)}>Gotovo</button>}
    </section>
  );
}

function Obrasci() {
  const { poSifri } = useImenik();
  const popunjeni = useLiveQuery(() => db.obrasci.orderBy('createdAt').reverse().toArray(), []);
  return (
    <>
      <div className="plocice">
        {OBRASCI.map((o) => (
          <a key={o.vrsta} href={`#/obrazac/${o.vrsta}`}>
            <Ikona ime="prazno" /><strong>{o.naziv}</strong><span>{o.opis}</span>
          </a>
        ))}
        <a href={`#/print/usavrsavanje/${new Date().getMonth() >= 8 ? new Date().getFullYear() : new Date().getFullYear() - 1}`}>
          <Ikona ime="print" /><strong>Evidencija stručnog usavršavanja</strong><span>automatski iz „Ostalih aktivnosti“</span>
        </a>
      </div>
      <div className="naslov-sekcije"><h2>Arhiva popunjenih obrazaca</h2></div>
      {!popunjeni ? null : popunjeni.length === 0 ? (
        <Prazno>Još nema popunjenih obrazaca.</Prazno>
      ) : (
        <ul className="lista">
          {popunjeni.map((o) => {
            const d = definicija(o.vrsta);
            const u = poSifri.get(o.sifra);
            return (
              <li key={o.id}>
                <a className="stavka" href={`#/print/obrazac/${o.id}`}>
                  <span className="vrsta obrazac" aria-hidden />
                  <span className="glavno">
                    <span className="red1">{d?.naziv ?? o.vrsta}</span>
                    <span className="red2">{[punoIme(u) || o.sifra, o.polja.predmet, o.polja.svrha].filter(Boolean).join(' · ') || '—'}</span>
                  </span>
                  <span className="desno broj">{prikaz(o.datum)}</span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

const KATEGORIJE_DOK = ['Propisi i pravilnici', 'Kolektivni ugovor / sindikat', 'Ministarstvo / Pedagoški zavod', 'Lični dosije (rješenje, diploma, licenca)', 'Školski dokumenti', 'Ostalo'];

function MojiDokumenti() {
  const toast = useToast();
  const dokumenti = useLiveQuery(() => db.dokumenti.orderBy('createdAt').reverse().toArray(), []);
  const ulaz = useRef<HTMLInputElement>(null);
  const [kategorija, setKategorija] = useState(KATEGORIJE_DOK[0]);
  const [brisanje, setBrisanje] = useState<MojDokument | null>(null);
  const [dodaj, setDodaj] = useState(false);

  const otpremi = async (fajlovi: FileList | null) => {
    if (!fajlovi?.length) return;
    let n = 0;
    for (const f of Array.from(fajlovi)) {
      if (f.size > 25 * 1024 * 1024) { toast(`${f.name} je veći od 25 MB`, 'greska'); continue; }
      const t = new Date().toISOString();
      await db.dokumenti.add({ id: uuid(), naziv: f.name, kategorija, tip: f.type || 'application/octet-stream', velicina: f.size, podaci: f, zaAI: f.type === 'application/pdf' || f.type.startsWith('text/'), createdAt: t, updatedAt: t });
      n++;
    }
    if (n) toast(`Dodano ✓ (${n})`);
    setDodaj(false);
  };

  const otvori = (d: MojDokument) => {
    const url = URL.createObjectURL(d.podaci);
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  return (
    <>
      <p className="malo">Ovdje čuvaš službene dokumente koje dobiješ (pravilnici, kolektivni ugovor, dopisi Ministarstva, tvoje rješenje o 40-satnoj sedmici, diploma…). Ostaju na uređaju, ulaze u šifrovanu rezervnu kopiju, a PDF-ove označene za AI asistent može čitati kad mu postaviš pitanje.</p>
      <button type="button" className="dugme primarno blok" onClick={() => setDodaj(true)}><Ikona ime="posalji" /> Dodaj dokument</button>
      <div className="razmak" />
      {!dokumenti ? null : dokumenti.length === 0 ? (
        <Prazno>Još nema dokumenata. Dodaj npr. PDF Pedagoških standarda USK (link je u „Propisi“).</Prazno>
      ) : (
        KATEGORIJE_DOK.filter((k) => dokumenti.some((d) => d.kategorija === k)).map((k) => (
          <section key={k}>
            <h3 className="dan-naslov">{k}</h3>
            <ul className="lista">
              {dokumenti.filter((d) => d.kategorija === k).map((d) => (
                <li key={d.id} className="razdvoji" style={{ padding: '6px 8px', flexWrap: 'nowrap' }}>
                  <button type="button" className="stavka" style={{ padding: '6px', minHeight: 44 }} onClick={() => otvori(d)}>
                    <span className="glavno">
                      <span className="red1" style={{ fontWeight: 500 }}>{d.naziv}</span>
                      <span className="red2">{(d.velicina / 1024).toFixed(0)} KB · {prikaz(d.createdAt.slice(0, 10))}</span>
                    </span>
                  </button>
                  <label className="chip mali" title="AI asistent smije čitati ovaj dokument" style={{ flex: 'none' }}>
                    <input type="checkbox" checked={d.zaAI} onChange={(e) => db.dokumenti.update(d.id, { zaAI: e.target.checked, updatedAt: new Date().toISOString() })} style={{ marginRight: 4 }} />
                    AI
                  </label>
                  <button type="button" className="ikona-dugme" aria-label={`Obriši ${d.naziv}`} onClick={() => setBrisanje(d)}><Ikona ime="obrisi" /></button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
      {dodaj && (
        <Modal naslov="Dodaj dokument" onZatvori={() => setDodaj(false)}>
          <Polje labela="Kategorija" id="dok-kat">
            <select id="dok-kat" value={kategorija} onChange={(e) => setKategorija(e.target.value)}>
              {KATEGORIJE_DOK.map((k) => <option key={k}>{k}</option>)}
            </select>
          </Polje>
          <input ref={ulaz} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,application/pdf,image/*,text/plain" className="sr-only" onChange={(e) => void otpremi(e.target.files)} />
          <div className="red-dugmadi">
            <button type="button" className="dugme" onClick={() => setDodaj(false)}>Odustani</button>
            <button type="button" className="dugme primarno" onClick={() => ulaz.current?.click()}>Izaberi fajl(ove)</button>
          </div>
        </Modal>
      )}
      {brisanje && (
        <Potvrda naslov="Obrisati dokument?" tekst={brisanje.naziv} potvrdi="Obriši" opasno onOdustani={() => setBrisanje(null)}
          onPotvrdi={async () => { await obrisi('dokumenti', brisanje.id); setBrisanje(null); toast('Obrisano'); }} />
      )}
    </>
  );
}

function Propisi() {
  return (
    <>
      <section className="kartica">
        <h2>Pedagoški standardi USK – psiholog (čl. 13)</h2>
        <p className="malo" style={{ whiteSpace: 'pre-wrap' }}>{PROPIS_TEKST.split('\n').slice(1, 2).join('\n')}</p>
        <table className="tabela" style={{ marginTop: 8 }}>
          <thead><tr><th>Područje rada</th><th className="n">h/sed.</th></tr></thead>
          <tbody>
            {PODRUCJA.map((p) => <tr key={p.kod}><td>{p.kod}. {p.naziv}</td><td className="n">{p.sati}</td></tr>)}
            <tr className="zbir"><td>Ukupno</td><td className="n">40</td></tr>
          </tbody>
        </table>
      </section>
      <section className="kartica">
        <h2>Izvori</h2>
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          {IZVORI.map((i) => (
            <li key={i.url} style={{ marginBottom: 8 }}>
              <a href={i.url} target="_blank" rel="noopener noreferrer">{i.naziv}</a>
              <div className="malo blijedo">{i.napomena}</div>
            </li>
          ))}
        </ul>
        <p className="malo blijedo" style={{ marginTop: 8 }}>
          Zakon o osnovnom odgoju i obrazovanju USK, Kolektivni ugovor (sindikat), pravilnike i dopise Ministarstva obrazovanja USK nisam mogao pouzdano naći javno na internetu.
          Kad ih dobiješ u školi ili od sindikata, dodaj ih u „Moji dokumenti“ – AI asistent će ih onda moći čitati i citirati.
        </p>
      </section>
    </>
  );
}
