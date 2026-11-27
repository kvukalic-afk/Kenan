import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { obrisi, sacuvajAktivnost, uuid } from '../db/repo';
import { Ikona } from '../components/Ikona';
import { DatumPolje, Modal, Polje, Potvrda, Prazno, Prekidac, SifraPolje } from '../components/Polja';
import { Zaglavlje } from '../components/Okvir';
import { useToast } from '../components/Toast';
import { danasIso, prikaz } from '../lib/datum';
import { idi } from '../lib/router';
import { useImenik } from '../lib/podaci';
import {
  bodovanje, brojStavki, brziUnos, formatVrijednosti, instrument, INSTRUMENTI, KRITERIJI_SOCIOMETRIJE, NAZIV_INFORMANTA, NAZIV_NACINA, NAZIV_NIVOA,
  najvisiNivo, obradiSociometriju, OBLASTI, pragoviZa, type Informant, type Instrument, type Nivo, type Odgovori, type Rezultat,
} from '../lib/instrumenti';
import { punoIme, type Testiranje, type Ucenik } from '../types';

const VRSTA_TESTIRANJA = 'Psihološko testiranje / ispitivanje';
export const KLASA_NIVOA: Record<Nivo, string> = { uredno: 'zelena', granicno: 'narandzasta', povisen: 'crvena', alarm: 'crvena hitno', info: 'primarna' };
const KRATKO_INF: Record<Informant, string> = { dijete: 'učenik', roditelj: 'roditelj', nastavnik: 'nastavnik' };
const enc = encodeURIComponent;

export function NivoOznaka({ nivo, children }: { nivo: Nivo; children?: ReactNode }) {
  const tekst = children ?? NAZIV_NIVOA[nivo];
  if (!tekst) return null;
  return <span className={`oznaka ${KLASA_NIVOA[nivo]}`}>{tekst}</span>;
}

/** Najviši nivo sačuvanog rezultata (za oznaku u listama). */
export function nivoTestiranja(t: Testiranje): Nivo {
  return najvisiNivo({
    skale: t.rezultat.map((r) => ({ ...r, nivo: r.nivo as Nivo, odgovoreno: 0, ukupno: 0 })),
    upozorenja: t.upozorenja.map((p) => ({ nivo: 'alarm' as Nivo, poruka: p })),
  });
}

export function linkTestiranja(t: Testiranje): string {
  return `#/instrumenti/${t.instrument}/primjena?id=${t.id}`;
}

export function RedTestiranja({ t, imeZa, prikaziUcenika = true }: { t: Testiranje; imeZa: (s: string) => string; prikaziUcenika?: boolean }) {
  const ins = instrument(t.instrument);
  const nivo = nivoTestiranja(t);
  const glavna = t.rezultat.find((r) => r.id === 'uk') ?? t.rezultat[0];
  const ko = t.sifra ? imeZa(t.sifra) : `Razred ${t.razred}`;
  return (
    <li>
      <a className="stavka" href={linkTestiranja(t)}>
        <span className="vrsta instrument" aria-hidden />
        <span className="glavno">
          <span className="red1">
            <span className="oznaka instrument">{ins?.kratko ?? t.instrument}</span>
            <span>{prikaziUcenika ? ko : NAZIV_INFORMANTA[t.informant as Informant] ?? ''}</span>
            {nivo !== 'info' && nivo !== 'uredno' && <NivoOznaka nivo={nivo} />}
          </span>
          <span className="red2">
            {t.instrument === 'sociometrija' ? t.kriterij : glavna ? `${glavna.naziv}: ${formatVrijednosti(glavna.vrijednost)}${glavna.opis ? ` – ${glavna.opis}` : ''}` : ''}
          </span>
        </span>
        <span className="desno broj">{prikaz(t.datum)}</span>
      </a>
    </li>
  );
}

function useImeZa() {
  const { poSifri } = useImenik();
  return (s: string) => {
    const ime = punoIme(poSifri.get(s));
    return ime ? `${ime} (${s})` : s;
  };
}

// ======================= Lista =======================

export function Instrumenti({ sifra }: { sifra?: string }) {
  const [oblast, setOblast] = useState('');
  const { poSifri } = useImenik();
  const imeZa = useImeZa();
  const nedavno = useLiveQuery(() => db.testiranja.orderBy('createdAt').reverse().limit(8).toArray(), []);
  const u = sifra ? poSifri.get(sifra) : undefined;
  const q = sifra ? `?sifra=${enc(sifra)}` : '';

  return (
    <>
      <Zaglavlje naslov="Psihološki instrumenti" nazadNa={sifra ? `/ucenici/${enc(sifra)}` : '/'} />
      <main className="sadrzaj">
        <section className="instr-hero">
          <span className="instr-hero-ikona" aria-hidden>🧪</span>
          <div>
            <h2>{INSTRUMENTI.length} provjerenih instrumenata</h2>
            <p>Upitnici, bodovanje i print na jednom mjestu. Rezultat se sprema u karton učenika i u dnevnik rada.</p>
          </div>
        </section>
        {sifra && (
          <div className="info-traka"><Ikona ime="ucenici" /><span>Za učenika <strong>{punoIme(u) || sifra}</strong> ({sifra}{u?.razred ? `, ${u.razred}` : ''}) – izaberi instrument.</span></div>
        )}
        <div className="info-traka"><Ikona ime="zastava" /><span><strong>Skrining, ne dijagnoza.</strong> Za individualnu primjenu treba saglasnost roditelja. Rezultati su povjerljivi i ne daju se učeniku ni razredu.</span></div>

        <div className="chipovi filteri" role="group" aria-label="Oblast">
          <button type="button" className="chip mali" aria-pressed={!oblast} onClick={() => setOblast('')}>Sve</button>
          {OBLASTI.map((o) => <button key={o} type="button" className="chip mali" aria-pressed={oblast === o} onClick={() => setOblast(oblast === o ? '' : o)}>{o}</button>)}
        </div>

        {OBLASTI.filter((o) => !oblast || o === oblast).map((o) => {
          const lista = INSTRUMENTI.filter((i) => i.oblast === o);
          if (!lista.length) return null;
          return (
            <div key={o}>
              <div className="naslov-sekcije"><h2>{o}</h2></div>
              {lista.map((i) => (
                <a key={i.id} className={`alat instr nacin-${i.nacin}`} href={`#/instrumenti/${i.id}${q}`}>
                  <span className="alat-ikona" aria-hidden>{i.ikona}</span>
                  <span className="rastegni">
                    <strong>{i.kratko} <span className="instr-naziv">· {i.naziv}</span></strong>
                    <span>{i.uzrast} · {i.informanti.map((x) => KRATKO_INF[x]).join(', ')} · {i.trajanje}</span>
                    <span className={`instr-nacin ${i.nacin}`}>{NAZIV_NACINA[i.nacin]}</span>
                  </span>
                  <Ikona ime="desno" />
                </a>
              ))}
            </div>
          );
        })}

        {nedavno && nedavno.length > 0 && (
          <>
            <div className="naslov-sekcije"><h2>Nedavne primjene</h2></div>
            <ul className="lista">{nedavno.map((t) => <RedTestiranja key={t.id} t={t} imeZa={imeZa} />)}</ul>
          </>
        )}
      </main>
    </>
  );
}

// ======================= Detalj =======================

function TabelaGranica({ ins }: { ins: Instrument }) {
  const sa = ins.skale.filter((s) => s.pragovi);
  if (!sa.length) return null;
  const informanti = ins.informanti.filter((inf) => sa.some((s) => !Array.isArray(s.pragovi) && s.pragovi?.[inf]));
  const poInformantu = informanti.length > 1;
  return (
    <div className="tabela-omot">
      <table className="instr-granice">
        <thead><tr><th>Skala</th>{poInformantu ? informanti.map((i) => <th key={i}>{KRATKO_INF[i]}</th>) : <th>Tumačenje</th>}</tr></thead>
        <tbody>
          {sa.map((s) => (
            <tr key={s.id}>
              <td>{s.naziv}{s.nacin === 'prosjek' ? <span className="blijedo"> (prosjek)</span> : ''}</td>
              {(poInformantu ? informanti : [ins.informanti[0]]).map((inf) => (
                <td key={inf}>{pragoviZa(s, inf).filter((p) => p.od > 0 || p.nivo !== 'uredno').map((p) => (
                  <div key={p.od}>{p.od > 0 ? <><strong>≥ {formatVrijednosti(p.od)}</strong> </> : <><strong>0+</strong> </>}{p.opis}</div>
                ))}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function InstrumentDetalj({ id, sifra }: { id: string; sifra?: string }) {
  const ins = instrument(id);
  const imeZa = useImeZa();
  const primjene = useLiveQuery(async () => (await db.testiranja.where('instrument').equals(id).toArray()).sort((a, b) => b.datum.localeCompare(a.datum) || b.createdAt.localeCompare(a.createdAt)), [id]);
  if (!ins) return (<><Zaglavlje naslov="Instrument" nazadNa="/instrumenti" /><main className="sadrzaj"><Prazno>Nepoznat instrument.</Prazno></main></>);
  const q = sifra ? `sifra=${enc(sifra)}` : '';
  const primjenjiv = ['u-appu', 'bodovanje', 'skale'].includes(ins.nacin);

  return (
    <>
      <Zaglavlje naslov={ins.kratko} nazadNa={sifra ? `/instrumenti?sifra=${enc(sifra)}` : '/instrumenti'} />
      <main className="sadrzaj">
        <section className="kartica instr-glava">
          <div className="instr-glava-red">
            <span className="alat-ikona velika" aria-hidden>{ins.ikona}</span>
            <div>
              <h2 style={{ margin: 0 }}>{ins.naziv}</h2>
              <div className="blijedo malo">{ins.izvorni} · {ins.oblast}</div>
            </div>
          </div>
          <p style={{ marginTop: 10 }}>{ins.mjeri}</p>
          <div className="instr-cinjenice">
            <span><span className="blijedo">Uzrast</span><strong>{ins.uzrast}</strong></span>
            <span><span className="blijedo">Popunjava</span><strong>{ins.informanti.map((i) => KRATKO_INF[i]).join(', ')}</strong></span>
            <span><span className="blijedo">Trajanje</span><strong>{ins.trajanje}</strong></span>
            {ins.brojPitanja > 0 && <span><span className="blijedo">Pitanja</span><strong>{ins.brojPitanja}{ins.dodatna?.dijete?.length ? ` + ${ins.dodatna.dijete.length} dodatna` : ''}</strong></span>}
          </div>
          {ins.upozorenje && <div className="instr-upozorenje"><Ikona ime="zastava" /> {ins.upozorenje}</div>}

          <div className="red-dugmadi" style={{ marginTop: 14 }}>
            {primjenjiv && <a className="dugme primarno" href={`#/instrumenti/${ins.id}/primjena${q ? `?${q}` : ''}`}><Ikona ime="uredi" /> {ins.nacin === 'u-appu' ? 'Primijeni / unesi odgovore' : 'Unesi bodove'}</a>}
            {ins.nacin === 'alat' && <a className="dugme primarno" href="#/instrumenti/sociometrija/primjena"><Ikona ime="ucenici" /> Novo sociometrijsko ispitivanje</a>}
            {ins.nacin === 'u-appu' && ins.informanti.map((inf) => (
              <a key={inf} className="dugme" href={`#/print/instrument/${ins.id}?informant=${inf}${q ? `&${q}` : ''}`}><Ikona ime="print" /> Upitnik{ins.informanti.length > 1 ? ` – ${KRATKO_INF[inf]}` : ''}</a>
            ))}
            {ins.nacin === 'u-appu' && <a className="dugme" href={`#/print/instrument/${ins.id}?kljuc=1`}><Ikona ime="dokument" /> Ključ za bodovanje</a>}
            {ins.nacin === 'bodovanje' && <a className="dugme" href={`#/print/instrument/${ins.id}?informant=${ins.informanti[0]}${q ? `&${q}` : ''}`}><Ikona ime="print" /> List za bodovanje</a>}
            {ins.nacin === 'obrazac' && <a className="dugme primarno" href={`#/print/instrument/${ins.id}${q ? `?${q}` : ''}`}><Ikona ime="print" /> Obrazac za print</a>}
          </div>
        </section>

        {ins.linkovi.length > 0 && (
          <section className="kartica">
            <h2>{ins.nacin === 'u-appu' ? 'Izvor' : 'Službeni obrazac'}</h2>
            <ul className="instr-linkovi">
              {ins.linkovi.map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer">{l.naziv} ↗</a></li>)}
            </ul>
          </section>
        )}

        <section className="kartica">
          <h2>Kada koristiti</h2>
          <ul className="instr-lista">{ins.kada.map((k) => <li key={k}>{k}</li>)}</ul>
          <h2 style={{ marginTop: 14 }}>Kako tumačiti</h2>
          <ul className="instr-lista">{ins.tumacenje.map((k) => <li key={k}>{k}</li>)}</ul>
          <TabelaGranica ins={ins} />
        </section>

        <section className="kartica instr-licenca">
          <h2>Licenca i izvor</h2>
          <p>{ins.licenca}</p>
          {ins.prevod && <p className="blijedo">{ins.prevod}</p>}
          <p className="malo blijedo">{ins.izvor}</p>
        </section>

        {primjene && primjene.length > 0 && (
          <>
            <div className="naslov-sekcije"><h2>Primjene</h2><span className="blijedo malo">{primjene.length}</span></div>
            <ul className="lista">{primjene.map((t) => <RedTestiranja key={t.id} t={t} imeZa={imeZa} />)}</ul>
          </>
        )}
      </main>
    </>
  );
}

// ======================= Primjena (upitnik / bodovanje) =======================

function PanelRezultata({ rez, ins }: { rez: Rezultat; ins: Instrument }) {
  return (
    <section className="kartica instr-rezultat" aria-live="polite">
      <h2>Rezultat</h2>
      {rez.upozorenja.map((u) => (
        <div key={u.poruka} className={`instr-alarm ${u.nivo}`}><Ikona ime="zastava" /><span>{u.poruka}</span></div>
      ))}
      <table className="instr-rez-tabela">
        <tbody>
          {rez.skale.map((s) => (
            <tr key={s.id} className={s.id === 'uk' ? 'ukupno' : ''}>
              <th scope="row">{s.naziv}</th>
              <td className="broj">{formatVrijednosti(s.vrijednost)}</td>
              <td>{s.nivo !== 'info' ? <NivoOznaka nivo={s.nivo}>{s.opis}</NivoOznaka> : <span className="blijedo malo">{s.opis}</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {ins.nacin !== 'skale' && <p className="malo blijedo" style={{ margin: '8px 0 0' }}>Odgovoreno {rez.odgovoreno} od {rez.ukupnoPitanja}. Rezultat je orijentacioni – tumači ga uz razgovor, opservaciju i podatke iz drugih izvora.</p>}
    </section>
  );
}

function DnevnikPolje({ uDnevnik, setUDnevnik, trajanje, setTrajanje }: { uDnevnik: boolean; setUDnevnik: (v: boolean) => void; trajanje: string; setTrajanje: (v: string) => void }) {
  return (
    <div className="instr-dnevnik">
      <Prekidac labela="Upiši u dnevnik rada (Psihološko testiranje)" vrijednost={uDnevnik} onChange={setUDnevnik} />
      {uDnevnik && (
        <label className="instr-trajanje">Trajanje <input type="number" inputMode="numeric" min={5} max={240} value={trajanje} onChange={(e) => setTrajanje(e.target.value)} /> min</label>
      )}
    </div>
  );
}

async function upisiUDnevnik(p: { aktivnostId?: string; datum: string; razred: string; tema: string; trajanje: string; ukljuceno: boolean }): Promise<string | undefined> {
  if (!p.ukljuceno) {
    if (p.aktivnostId && (await db.aktivnosti.get(p.aktivnostId))) await obrisi('aktivnosti', p.aktivnostId);
    return undefined;
  }
  const postojeca = p.aktivnostId ? await db.aktivnosti.get(p.aktivnostId) : undefined;
  const a = await sacuvajAktivnost({
    ...(postojeca ?? { cas: '', umjestoKoga: '', predmet: '', zapazanja: '', napomena: '', podrucje: null }),
    id: postojeca?.id,
    datum: p.datum,
    vrsta: VRSTA_TESTIRANJA,
    razred: p.razred,
    tema: p.tema,
    trajanjeMin: Number(p.trajanje) || null,
  });
  return a.id;
}

export function Primjena({ id, testId, sifra: pocetnaSifra, informant: pocInf }: { id: string; testId?: string; sifra?: string; informant?: string }) {
  const ins = instrument(id);
  if (!ins || !['u-appu', 'bodovanje', 'skale'].includes(ins.nacin)) {
    return (<><Zaglavlje naslov="Primjena" nazadNa="/instrumenti" /><main className="sadrzaj"><Prazno>Ovaj instrument se ne boduje u appu.</Prazno></main></>);
  }
  return <PrimjenaForma key={`${id}:${testId ?? ''}`} ins={ins} testId={testId} pocetnaSifra={pocetnaSifra} pocInf={pocInf} />;
}

function PrimjenaForma({ ins, testId, pocetnaSifra, pocInf }: { ins: Instrument; testId?: string; pocetnaSifra?: string; pocInf?: string }) {
  const toast = useToast();
  const { ucenici, poSifri, razrednik } = useImenik();
  const [stari, setStari] = useState<Testiranje | null | undefined>(testId ? undefined : null);
  const [sifra, setSifra] = useState(pocetnaSifra ?? '');
  const [inf, setInf] = useState<Informant>(ins.informanti.includes(pocInf as Informant) ? (pocInf as Informant) : ins.informanti[0]);
  const [datum, setDatum] = useState(danasIso());
  const [odg, setOdg] = useState<Odgovori>({});
  const [napomena, setNapomena] = useState('');
  const [uDnevnik, setUDnevnik] = useState(true);
  const [trajanje, setTrajanje] = useState(String(ins.trajanjeMin));
  const [brzi, setBrzi] = useState('');
  const [brziGreska, setBrziGreska] = useState('');
  const [greska, setGreska] = useState('');
  const [brisanje, setBrisanje] = useState(false);
  const [cuva, setCuva] = useState(false);

  useEffect(() => {
    if (!testId) return;
    db.testiranja.get(testId).then((t) => {
      setStari(t ?? null);
      if (!t) return;
      setSifra(t.sifra); setInf(t.informant as Informant); setDatum(t.datum); setOdg(t.odgovori ?? {}); setNapomena(t.napomena ?? '');
      setUDnevnik(!!t.aktivnostId);
      if (t.aktivnostId) db.aktivnosti.get(t.aktivnostId).then((a) => a?.trajanjeMin && setTrajanje(String(a.trajanjeMin)));
    });
  }, [testId]);

  const rez = useMemo(() => bodovanje(ins, inf, odg), [ins, inf, odg]);
  if (testId && stari === undefined) return <Zaglavlje naslov={ins.kratko} nazadNa={`/instrumenti/${ins.id}`} />;

  const n = brojStavki(ins);
  const stavke = ins.stavke?.[inf] ?? [];
  const dodatna = ins.dodatna?.[inf] ?? [];
  const postavi = (k: string, v: number) => setOdg((o) => {
    const novo = { ...o };
    if (novo[k] === v) delete novo[k];
    else novo[k] = v;
    return novo;
  });
  const ucenik: Ucenik | undefined = poSifri.get(sifra);

  const primijeniBrzi = () => {
    const { odgovori, greske } = brziUnos(ins, brzi);
    setOdg((o) => ({ ...Object.fromEntries(Object.entries(o).filter(([k]) => !/^\d+$/.test(k))), ...odgovori }));
    const broj = Object.keys(odgovori).length;
    setBrziGreska(greske.length ? `Nedozvoljen odgovor na pitanju ${greske.join(', ')} – unesi ga ručno.` : '');
    toast(`Upisano ${broj} odgovora ✓`);
  };

  const sacuvaj = async () => {
    if (!sifra) return setGreska('Izaberi učenika.');
    if (!ucenik) return setGreska('Učenik s tom šifrom nije u appu – dodaj ga prvo u Učenike.');
    setCuva(true);
    try {
      const t = new Date().toISOString();
      const tema = `${ins.kratko} – ${sifra}${inf !== 'dijete' ? ` (${KRATKO_INF[inf]})` : ''}`;
      const aktivnostId = await upisiUDnevnik({ aktivnostId: stari?.aktivnostId, datum, razred: ucenik.razred, tema, trajanje, ukljuceno: uDnevnik });
      const zapis: Testiranje = {
        id: stari?.id ?? uuid(), createdAt: stari?.createdAt ?? t, updatedAt: t,
        datum, instrument: ins.id, sifra, razred: ucenik.razred, informant: inf, odgovori: odg,
        rezultat: rez.skale.map((s) => ({ id: s.id, naziv: s.naziv, vrijednost: s.vrijednost, nivo: s.nivo, opis: s.opis })),
        upozorenja: rez.upozorenja.map((u) => u.poruka),
        napomena: napomena.trim(),
        ...(aktivnostId ? { aktivnostId } : {}),
      };
      await db.testiranja.put(zapis);
      toast(stari ? 'Izmjene sačuvane ✓' : 'Sačuvano u karton učenika ✓');
      if (!stari) idi(`/instrumenti/${ins.id}/primjena?id=${zapis.id}`, true);
      else setStari(zapis);
    } finally {
      setCuva(false);
    }
  };

  return (
    <>
      <Zaglavlje naslov={`${ins.kratko}${stari ? ' – rezultat' : ''}`} nazadNa={sifra ? `/ucenici/${enc(sifra)}` : `/instrumenti/${ins.id}`} />
      <main className="sadrzaj">
        <section className="kartica">
          <div className="blijedo malo" style={{ marginBottom: 8 }}>{ins.naziv}</div>
          <SifraPolje vrijednost={sifra} onChange={(s) => { setSifra(s); setGreska(''); }} ucenici={ucenici} obavezno greska={greska} razrednik={(r) => razrednik.get(r)} />
          {ins.informanti.length > 1 && (
            <Polje labela="Ko popunjava" id="inf" grupa>
              <div className="chipovi">
                {ins.informanti.map((i) => <button key={i} type="button" className="chip" aria-pressed={inf === i} onClick={() => setInf(i)}>{NAZIV_INFORMANTA[i]}</button>)}
              </div>
            </Polje>
          )}
          <DatumPolje labela="Datum primjene" vrijednost={datum} onChange={setDatum} />
          {ins.upozorenje && <div className="instr-upozorenje"><Ikona ime="zastava" /> {ins.upozorenje}</div>}
        </section>

        {ins.nacin === 'skale' ? (
          <section className="kartica">
            <h2>Bodovi podskala</h2>
            <p className="malo blijedo">Saberi bodove na službenom obrascu po uputstvu i upiši ih ovdje (0–10). Ukupne teškoće app računa sam.</p>
            <div className="instr-skale-unos">
              {ins.skale.filter((s) => !s.izSkala).map((s) => (
                <label key={s.id}>
                  <span>{s.naziv}</span>
                  <input type="number" inputMode="numeric" min={0} max={s.max ?? 10} value={odg[`s:${s.id}`] ?? ''}
                    onChange={(e) => {
                      const v = e.target.value === '' ? undefined : Math.max(0, Math.min(s.max ?? 10, Math.round(Number(e.target.value))));
                      setOdg((o) => { const x = { ...o }; if (v === undefined || Number.isNaN(v)) delete x[`s:${s.id}`]; else x[`s:${s.id}`] = v; return x; });
                    }} />
                </label>
              ))}
            </div>
          </section>
        ) : (
          <>
            <details className="kartica instr-brzi" open={ins.nacin === 'bodovanje' && !stari}>
              <summary><strong>Brzi unos s papira</strong> <span className="blijedo malo">– upiši odgovore redom kao niz cifara</span></summary>
              <p className="malo blijedo">Primjer: <code>{(ins.odgovori ?? []).map((o) => o.v).join('')}…</code> Razmaci i zarezi se preskaču. Odgovori: {(ins.odgovori ?? []).map((o) => `${o.v} = ${o.t}`).join(' · ')}</p>
              <div className="red-dugmadi">
                <input type="text" inputMode="numeric" className="instr-brzi-polje" value={brzi} onChange={(e) => setBrzi(e.target.value)} placeholder={`${n} cifara`} aria-label="Odgovori redom" />
                <button type="button" className="dugme" onClick={primijeniBrzi} disabled={!brzi.trim()}>Upiši</button>
              </div>
              <div className="malo blijedo">{brzi.replace(/[^0-9]/g, '').length} / {n}</div>
              {brziGreska && <div className="upozorenje-tekst" role="alert">{brziGreska}</div>}
            </details>

            {ins.nacin === 'u-appu' ? (
              <section className="kartica instr-upitnik">
                {ins.uputa?.[inf] && <p className="instr-uputa">{ins.uputa[inf]}</p>}
                {ins.uvodStavki?.[inf] && <p className="instr-uvod"><strong>{ins.uvodStavki[inf]}</strong></p>}
                {stavke.map((tekst, i) => {
                  const br = i + 1;
                  const k = String(br);
                  return (
                    <div key={k} className={`instr-pitanje ${odg[k] !== undefined ? 'odgovoreno' : ''}`}>
                      <div className="instr-tekst"><span className="br">{br}</span><span>{tekst}{ins.obrnute?.includes(br) && <span className="instr-obrnuto" title="Boduje se obrnuto">↺</span>}</span></div>
                      <div className="instr-odg" role="group" aria-label={`Pitanje ${br}`}>
                        {(ins.odgovori ?? []).map((o) => <button key={o.v} type="button" className="chip mali" aria-pressed={odg[k] === o.v} onClick={() => postavi(k, o.v)}>{o.t}</button>)}
                      </div>
                    </div>
                  );
                })}
                {dodatna.length > 0 && <p className="instr-uvod" style={{ marginTop: 14 }}><strong>Dodatna pitanja</strong> <span className="blijedo malo">(ne ulaze u zbir)</span></p>}
                {dodatna.map((d) => (
                  <div key={d.id} className={`instr-pitanje ${odg[`d:${d.id}`] !== undefined ? 'odgovoreno' : ''}`}>
                    <div className="instr-tekst"><span className="br">•</span><span>{d.tekst}</span></div>
                    <div className="instr-odg">
                      {d.opcije.map((o) => <button key={o.v} type="button" className="chip mali" aria-pressed={odg[`d:${d.id}`] === o.v} onClick={() => postavi(`d:${d.id}`, o.v)}>{o.t}</button>)}
                    </div>
                  </div>
                ))}
              </section>
            ) : (
              <section className="kartica">
                <h2>Odgovori po pitanjima</h2>
                <p className="malo blijedo">{(ins.odgovori ?? []).map((o) => `${o.v} = ${o.t}`).join(' · ')}</p>
                <div className="instr-mreza">
                  {Array.from({ length: n }, (_, i) => String(i + 1)).map((k) => (
                    <div key={k} className={`instr-celija ${odg[k] !== undefined ? 'odgovoreno' : ''}`}>
                      <span className="br">{k}</span>
                      <div role="group" aria-label={`Pitanje ${k}`}>
                        {(ins.odgovori ?? []).map((o) => <button key={o.v} type="button" aria-pressed={odg[k] === o.v} title={o.t} onClick={() => postavi(k, o.v)}>{o.v}</button>)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <PanelRezultata rez={rez} ins={ins} />

        <section className="kartica">
          <Polje labela="Zapažanja tokom primjene" id="instr-nap">
            <textarea id="instr-nap" rows={3} value={napomena} onChange={(e) => setNapomena(e.target.value)} placeholder="npr. čitao/la sam pitanja naglas; dugo razmišljao kod pitanja 12; rekao da mu je bilo teško…" />
          </Polje>
          <DnevnikPolje uDnevnik={uDnevnik} setUDnevnik={setUDnevnik} trajanje={trajanje} setTrajanje={setTrajanje} />
          <div className="red-dugmadi" style={{ marginTop: 12 }}>
            {stari && <button type="button" className="dugme opasno" onClick={() => setBrisanje(true)}><Ikona ime="obrisi" /> Obriši</button>}
            {stari && <a className="dugme" href={`#/print/testiranje/${stari.id}`}><Ikona ime="print" /> Print rezultata</a>}
            <button type="button" className="dugme primarno" disabled={cuva} onClick={() => void sacuvaj()}>{stari ? 'Sačuvaj izmjene' : 'Sačuvaj u karton'}</button>
          </div>
        </section>
      </main>
      {brisanje && stari && (
        <Potvrda naslov="Obrisati rezultat?" opasno potvrdi="Obriši" tekst={<p>Briše se rezultat {ins.kratko} od {prikaz(stari.datum)}. Unos u dnevniku rada ostaje.</p>}
          onOdustani={() => setBrisanje(false)}
          onPotvrdi={async () => { await obrisi('testiranja', stari.id); toast('Obrisano'); idi(stari.sifra ? `/ucenici/${enc(stari.sifra)}` : `/instrumenti/${ins.id}`, true); }} />
      )}
    </>
  );
}

// ======================= Sociometrija =======================

const poImenu = (a: Ucenik, b: Ucenik) => (a.prezime || '').localeCompare(b.prezime || '', 'bs') || (a.ime || '').localeCompare(b.ime || '', 'bs') || a.sifra.localeCompare(b.sifra);

export function sortirajRazred(ucenici: Ucenik[], razred: string): Ucenik[] {
  return ucenici.filter((u) => u.razred === razred && u.status === 'Aktivan').sort(poImenu);
}

export function Sociometrija({ testId, razred: pocRazred }: { testId?: string; razred?: string }) {
  const toast = useToast();
  const { ucenici, poSifri, razrednik } = useImenik();
  const [stari, setStari] = useState<Testiranje | null | undefined>(testId ? undefined : null);
  const [razred, setRazred] = useState(pocRazred ?? '');
  const [kriterij, setKriterij] = useState(KRITERIJI_SOCIOMETRIJE[0]);
  const [broj, setBroj] = useState(3);
  const [izbori, setIzbori] = useState<Record<string, string[]>>({});
  const [odsutni, setOdsutni] = useState<string[]>([]);
  const [datum, setDatum] = useState(danasIso());
  const [napomena, setNapomena] = useState('');
  const [uDnevnik, setUDnevnik] = useState(true);
  const [trajanje, setTrajanje] = useState('45');
  const [otvoren, setOtvoren] = useState<string | null>(null);
  const [brisanje, setBrisanje] = useState(false);
  const [cuva, setCuva] = useState(false);

  useEffect(() => {
    if (!testId) return;
    db.testiranja.get(testId).then((t) => {
      setStari(t ?? null);
      if (!t) return;
      setRazred(t.razred); setKriterij(t.kriterij ?? ''); setBroj(t.brojIzbora ?? 3); setIzbori(t.izbori ?? {}); setOdsutni(t.odsutni ?? []);
      setDatum(t.datum); setNapomena(t.napomena ?? ''); setUDnevnik(!!t.aktivnostId);
      if (t.aktivnostId) db.aktivnosti.get(t.aktivnostId).then((a) => a?.trajanjeMin && setTrajanje(String(a.trajanjeMin)));
    });
  }, [testId]);

  const razredi = useMemo(() => [...new Set(ucenici.filter((u) => u.status === 'Aktivan' && u.razred).map((u) => u.razred))]
    .sort((a, b) => a.localeCompare(b, 'bs', { numeric: true })), [ucenici]);
  const djeca = useMemo(() => sortirajRazred(ucenici, razred), [ucenici, razred]);
  const sifre = djeca.map((u) => u.sifra);
  const rez = useMemo(() => obradiSociometriju(sifre, izbori, odsutni), [sifre.join(','), izbori, odsutni]); // eslint-disable-line react-hooks/exhaustive-deps
  if (testId && stari === undefined) return <Zaglavlje naslov="Sociometrija" nazadNa="/instrumenti/sociometrija" />;

  const ime = (s: string) => punoIme(poSifri.get(s)) || s;
  const uneseno = sifre.filter((s) => (izbori[s]?.length ?? 0) > 0 || odsutni.includes(s)).length;

  const prebaci = (ko: string, koga: string) => setIzbori((z) => {
    const l = z[ko] ?? [];
    if (l.includes(koga)) return { ...z, [ko]: l.filter((x) => x !== koga) };
    if (l.length >= broj) return z;
    return { ...z, [ko]: [...l, koga] };
  });

  const sacuvaj = async () => {
    if (!razred || !djeca.length) return;
    setCuva(true);
    try {
      const t = new Date().toISOString();
      const aktivnostId = await upisiUDnevnik({ aktivnostId: stari?.aktivnostId, datum, razred, tema: `Sociometrijsko ispitivanje – ${razred}`, trajanje, ukljuceno: uDnevnik });
      const zapis: Testiranje = {
        id: stari?.id ?? uuid(), createdAt: stari?.createdAt ?? t, updatedAt: t,
        datum, instrument: 'sociometrija', sifra: '', razred, informant: 'dijete', odgovori: {},
        rezultat: [
          { id: 'uc', naziv: 'Učenika', vrijednost: sifre.length, nivo: 'info', opis: odsutni.length ? `odsutno ${odsutni.length}` : '' },
          { id: 'bez', naziv: 'Bez ijednog izbora', vrijednost: rez.bezIzbora.length, nivo: rez.bezIzbora.length ? 'povisen' : 'uredno', opis: rez.bezIzbora.join(', ') },
          { id: 'buz', naziv: 'Bez uzajamnog izbora', vrijednost: rez.bezUzajamnog.length, nivo: rez.bezUzajamnog.length ? 'granicno' : 'uredno', opis: rez.bezUzajamnog.join(', ') },
          { id: 'par', naziv: 'Uzajamnih parova', vrijednost: rez.parovi.length, nivo: 'info', opis: `${Math.round(rez.udioUzajamnih * 100)} % izbora je uzajamno` },
        ],
        upozorenja: [], napomena: napomena.trim(),
        kriterij: kriterij.trim(), brojIzbora: broj, izbori, odsutni,
        ...(aktivnostId ? { aktivnostId } : {}),
      };
      await db.testiranja.put(zapis);
      toast('Sociometrija sačuvana ✓');
      if (!stari) idi(`/instrumenti/sociometrija/primjena?id=${zapis.id}`, true);
      else setStari(zapis);
    } finally {
      setCuva(false);
    }
  };

  const indeks = otvoren ? sifre.indexOf(otvoren) : -1;
  const sortirano = [...rez.redovi].sort((a, b) => b.primio - a.primio || ime(a.sifra).localeCompare(ime(b.sifra), 'bs'));

  return (
    <>
      <Zaglavlje naslov="Sociometrija" nazadNa="/instrumenti/sociometrija" />
      <main className="sadrzaj">
        <section className="kartica">
          <Polje labela="Razred" id="soc-razred">
            <select id="soc-razred" value={razred} onChange={(e) => { setRazred(e.target.value); setIzbori({}); setOdsutni([]); }} disabled={!!stari}>
              <option value="">— izaberi —</option>
              {razredi.map((r) => <option key={r} value={r}>{r}{razrednik.get(r) ? ` – ${razrednik.get(r)}` : ''}</option>)}
            </select>
          </Polje>
          <Polje labela="Kriterij (pitanje za učenike)" id="soc-kriterij">
            <input id="soc-kriterij" type="text" value={kriterij} onChange={(e) => setKriterij(e.target.value)} />
          </Polje>
          <div className="chipovi" style={{ marginTop: -4, marginBottom: 10 }}>
            {KRITERIJI_SOCIOMETRIJE.map((k) => <button key={k} type="button" className="chip mali" aria-pressed={kriterij === k} onClick={() => setKriterij(k)}>{k.replace(/^S kim bi (se )?najradije /, '').replace('?', '')}</button>)}
          </div>
          <Polje labela="Broj izbora po učeniku" id="soc-broj" grupa>
            <div className="chipovi">{[2, 3, 4, 5].map((b) => <button key={b} type="button" className="chip mali" aria-pressed={broj === b} onClick={() => setBroj(b)}>{b}</button>)}</div>
          </Polje>
          <DatumPolje labela="Datum ispitivanja" vrijednost={datum} onChange={setDatum} />
          {razred && <a className="dugme" href={`#/print/sociometrija/${enc(razred)}?kriterij=${enc(kriterij)}&broj=${broj}`}><Ikona ime="print" /> Listići za učenike ({djeca.length})</a>}
        </section>
        <div className="info-traka"><Ikona ime="zastava" /><span>Samo pozitivni kriteriji. Listiće dijeli i skupljaj sam/a, a rezultate ne pokazuj učenicima ni razredu.</span></div>

        {razred && djeca.length === 0 && <Prazno>U razredu {razred} nema aktivnih učenika u appu.</Prazno>}
        {djeca.length > 0 && (
          <>
            <div className="naslov-sekcije"><h2>Unos izbora</h2><span className="blijedo malo">{uneseno} / {djeca.length}</span></div>
            <ul className="lista socio-lista">
              {djeca.map((u, i) => {
                const l = izbori[u.sifra] ?? [];
                const ods = odsutni.includes(u.sifra);
                return (
                  <li key={u.sifra}>
                    <button type="button" className={`stavka socio-red ${l.length || ods ? 'uneseno' : ''}`} onClick={() => setOtvoren(u.sifra)}>
                      <span className="socio-rb">{i + 1}</span>
                      <span className="glavno">
                        <span className="red1">{punoIme(u) || u.sifra}</span>
                        <span className="red2">{ods ? 'odsutan/na' : l.length ? l.map(ime).join(', ') : 'dodirni za unos izbora'}</span>
                      </span>
                      <span className="desno broj">{ods ? '–' : `${l.length}/${broj}`}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <section className="kartica socio-rezultat">
              <h2>Rezultati</h2>
              <div className="instr-cinjenice">
                <span><span className="blijedo">Učenika</span><strong>{sifre.length}</strong></span>
                <span><span className="blijedo">Izbora</span><strong>{rez.ukupnoIzbora}</strong></span>
                <span><span className="blijedo">Uzajamnih parova</span><strong>{rez.parovi.length}</strong></span>
                <span><span className="blijedo">Uzajamno</span><strong>{Math.round(rez.udioUzajamnih * 100)} %</strong></span>
              </div>
              {rez.bezIzbora.length > 0 && <div className="instr-alarm povisen"><Ikona ime="zastava" /><span><strong>Bez ijednog izbora:</strong> {rez.bezIzbora.map(ime).join(', ')}</span></div>}
              {rez.bezUzajamnog.filter((s) => !rez.bezIzbora.includes(s)).length > 0 && (
                <div className="instr-alarm granicno"><Ikona ime="zastava" /><span><strong>Bez uzajamnog izbora:</strong> {rez.bezUzajamnog.filter((s) => !rez.bezIzbora.includes(s)).map(ime).join(', ')}</span></div>
              )}
              {rez.najbiraniji.length > 0 && <p className="malo"><strong>Najbiraniji:</strong> {rez.najbiraniji.map(ime).join(', ')}</p>}
              <div className="tabela-omot">
                <table className="instr-rez-tabela socio-tabela">
                  <thead><tr><th>Učenik</th><th className="broj">Primio</th><th className="broj">Uzaj.</th><th>Status</th></tr></thead>
                  <tbody>
                    {sortirano.map((r) => (
                      <tr key={r.sifra}><th scope="row">{ime(r.sifra)}</th><td className="broj">{r.primio}</td><td className="broj">{r.uzajamni}</td><td>{r.odsutan && r.primio === 0 ? <span className="blijedo malo">odsutan/na</span> : <NivoOznaka nivo={r.nivo === 'uredno' ? 'info' : r.nivo}>{r.status}</NivoOznaka>}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rez.parovi.length > 0 && <p className="malo" style={{ marginTop: 10 }}><strong>Uzajamni izbori:</strong> {rez.parovi.map(([a, b]) => `${ime(a)} ↔ ${ime(b)}`).join(' · ')}</p>}
            </section>

            <section className="kartica">
              <Polje labela="Zapažanja i plan" id="soc-nap">
                <textarea id="soc-nap" rows={3} value={napomena} onChange={(e) => setNapomena(e.target.value)} placeholder="npr. opservacija na odmoru za učenike bez izbora; dogovor s razrednikom o radu u grupama…" />
              </Polje>
              <DnevnikPolje uDnevnik={uDnevnik} setUDnevnik={setUDnevnik} trajanje={trajanje} setTrajanje={setTrajanje} />
              <div className="red-dugmadi" style={{ marginTop: 12 }}>
                {stari && <button type="button" className="dugme opasno" onClick={() => setBrisanje(true)}><Ikona ime="obrisi" /> Obriši</button>}
                {stari && <a className="dugme" href={`#/print/testiranje/${stari.id}`}><Ikona ime="print" /> Print rezultata</a>}
                <button type="button" className="dugme primarno" disabled={cuva || uneseno === 0} onClick={() => void sacuvaj()}>{stari ? 'Sačuvaj izmjene' : 'Sačuvaj'}</button>
              </div>
            </section>
          </>
        )}
      </main>

      {otvoren && (
        <Modal naslov={ime(otvoren)} onZatvori={() => setOtvoren(null)}>
          <p className="malo blijedo" style={{ marginTop: 0 }}>{kriterij} · najviše {broj}</p>
          <Prekidac labela="Odsutan/na (ne popunjava)" vrijednost={odsutni.includes(otvoren)} onChange={(v) => {
            setOdsutni((o) => (v ? [...o, otvoren] : o.filter((x) => x !== otvoren)));
            if (v) setIzbori((z) => ({ ...z, [otvoren]: [] }));
          }} />
          {!odsutni.includes(otvoren) && (
            <div className="chipovi socio-izbor">
              {djeca.filter((u) => u.sifra !== otvoren).map((u) => {
                const l = izbori[otvoren] ?? [];
                const izabran = l.includes(u.sifra);
                return (
                  <button key={u.sifra} type="button" className="chip mali" aria-pressed={izabran} disabled={!izabran && l.length >= broj} onClick={() => prebaci(otvoren, u.sifra)}>
                    {izabran && <span className="socio-redni">{l.indexOf(u.sifra) + 1}</span>}{punoIme(u) || u.sifra}
                  </button>
                );
              })}
            </div>
          )}
          <div className="red-dugmadi">
            <button type="button" className="dugme" onClick={() => setOtvoren(null)}>Gotovo</button>
            {indeks >= 0 && indeks < sifre.length - 1 && <button type="button" className="dugme primarno" onClick={() => setOtvoren(sifre[indeks + 1])}>Sljedeći: {ime(sifre[indeks + 1])} →</button>}
          </div>
        </Modal>
      )}
      {brisanje && stari && (
        <Potvrda naslov="Obrisati sociometriju?" opasno potvrdi="Obriši" tekst={<p>Briše se sociometrija razreda {stari.razred} od {prikaz(stari.datum)}.</p>}
          onOdustani={() => setBrisanje(false)}
          onPotvrdi={async () => { await obrisi('testiranja', stari.id); toast('Obrisano'); idi('/instrumenti/sociometrija', true); }} />
      )}
    </>
  );
}
