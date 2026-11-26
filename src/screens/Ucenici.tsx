import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { postaviRazrednika, sacuvajUcenika, uuid } from '../db/repo';
import { Ikona } from '../components/Ikona';
import { Modal, Polje, Prazno, SifraPolje } from '../components/Polja';
import { StatusOznaka, Zaglavlje } from '../components/Okvir';
import { useToast } from '../components/Toast';
import { prikaz } from '../lib/datum';
import { idi } from '../lib/router';
import { jeIspravnaSifra, normalizujRazred, uporediSifre } from '../lib/sifra';
import { pregledajUvoz, tekstUTabelu, type PregledUvoza } from '../lib/uvozUcenika';
import { zadnjiRazgovorPoUceniku } from '../lib/zakazano';
import { punoIme, type Ucenik } from '../types';

type Filter = 'svi' | 'pracenje' | 'otvoreni';

export function Ucenici({ pocetniFilter }: { pocetniFilter?: string }) {
  const [upit, setUpit] = useState('');
  const [filter, setFilter] = useState<Filter>(pocetniFilter === 'pracenje' || pocetniFilter === 'otvoreni' ? pocetniFilter : 'svi');
  const [razred, setRazred] = useState('');
  const [uvoz, setUvoz] = useState(false);
  const [novi, setNovi] = useState(false);
  const [razrednici, setRazrednici] = useState(false);

  const podaci = useLiveQuery(async () => {
    const [ucenici, razgovori, razredi] = await Promise.all([db.ucenici.toArray(), db.razgovori.toArray(), db.razredi.toArray()]);
    return { ucenici, razgovori, razredi };
  }, []);

  const redovi = useMemo(() => {
    if (!podaci) return [];
    const zadnji = zadnjiRazgovorPoUceniku(podaci.razgovori);
    const broj = new Map<string, number>();
    for (const r of podaci.razgovori) broj.set(r.sifra, (broj.get(r.sifra) ?? 0) + 1);
    return podaci.ucenici.map((u) => ({ u, broj: broj.get(u.sifra) ?? 0, zadnji: zadnji.get(u.sifra) }));
  }, [podaci]);

  const razredi = useMemo(() => [...new Set(redovi.map((r) => r.u.razred).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'bs', { numeric: true })), [redovi]);
  const razrednikRazreda = useMemo(() => new Map((podaci?.razredi ?? []).map((r) => [r.razred, r.razrednik])), [podaci]);

  const prikazani = useMemo(() => {
    const q = upit.trim().toLocaleUpperCase('bs');
    return redovi
      .filter((r) => !q || r.u.sifra.includes(q) || r.u.razred.toUpperCase().includes(q) || punoIme(r.u).toLocaleUpperCase('bs').includes(q) || `${r.u.prezime ?? ''} ${r.u.ime ?? ''}`.toLocaleUpperCase('bs').includes(q))
      .filter((r) => filter !== 'pracenje' || r.u.uPracenju)
      .filter((r) => filter !== 'otvoreni' || r.zadnji?.statusSlucaja === 'Otvoren')
      .filter((r) => !razred || r.u.razred === razred)
      .sort((a, b) => Number(b.u.uPracenju) - Number(a.u.uPracenju)
        || a.u.razred.localeCompare(b.u.razred, 'bs', { numeric: true })
        || (a.u.prezime ?? '').localeCompare(b.u.prezime ?? '', 'bs') || (a.u.ime ?? '').localeCompare(b.u.ime ?? '', 'bs')
        || uporediSifre(a.u.sifra, b.u.sifra));
  }, [redovi, upit, filter, razred]);

  return (
    <>
      <Zaglavlje naslov="Učenici" />
      <main className="sadrzaj sirok">
        <div className="pretraga razdvoji">
          <label htmlFor="trazi" className="sr-only">Pretraga po imenu, šifri ili razredu</label>
          <input id="trazi" type="search" className="rastegni" placeholder="Traži ime, šifru ili razred…" value={upit} onChange={(e) => setUpit(e.target.value)} autoComplete="off" />
        </div>
        <div className="filteri" role="group" aria-label="Filter">
          {([['svi', 'Svi'], ['pracenje', 'U praćenju'], ['otvoreni', 'Otvoreni slučajevi']] as [Filter, string][]).map(([k, n]) => (
            <button key={k} type="button" className="chip mali" aria-pressed={filter === k} onClick={() => setFilter(k)}>{n}</button>
          ))}
          <select aria-label="Razred" value={razred} onChange={(e) => setRazred(e.target.value)} style={{ width: 'auto', minHeight: 36, padding: '4px 8px' }}>
            <option value="">Svi razredi</option>
            {razredi.map((r) => <option key={r} value={r}>{r}{razrednikRazreda.get(r) ? ` – ${razrednikRazreda.get(r)}` : ''}</option>)}
          </select>
        </div>
        <div className="razdvoji" style={{ marginBottom: 12 }}>
          <span className="blijedo malo rastegni">{prikazani.length} od {redovi.length} učenika</span>
          <button type="button" className="dugme" onClick={() => setNovi(true)}><Ikona ime="plus" /> Učenik</button>
          <button type="button" className="dugme" onClick={() => setUvoz(true)}><Ikona ime="posalji" /> Uvoz popisa</button>
          <button type="button" className="dugme" onClick={() => setRazrednici(true)}><Ikona ime="ucenici" /> Razrednici</button>
          <a className="dugme" href={`#/print/spiskovi${razred ? `/${encodeURIComponent(razred)}` : ''}`}><Ikona ime="print" /> {razred ? `Spisak ${razred}` : 'Spiskovi odjeljenja'}</a>
        </div>
        {razred && razrednikRazreda.get(razred) && <p className="malo blijedo">Razrednik {razred}: <strong>{razrednikRazreda.get(razred)}</strong></p>}

        {!podaci ? null : redovi.length === 0 ? (
          <Prazno>
            Još nema učenika. Uvezi popis (šifra, razred) preko dugmeta „Uvoz popisa“ ili samo upiši novu šifru pri unosu razgovora.
          </Prazno>
        ) : prikazani.length === 0 ? (
          <Prazno>Nema učenika za izabrani filter.</Prazno>
        ) : (
          <ul className="lista">
            {prikazani.map(({ u, broj, zadnji }) => (
              <li key={u.id}>
                <a className="stavka" href={`#/ucenici/${encodeURIComponent(u.sifra)}`}>
                  <span className="glavno">
                    <span className="red1">
                      <span className="sifra-velika">{punoIme(u) || u.sifra}</span>
                      {punoIme(u) && <span className="oznaka">{u.sifra}</span>}
                      <span className="blijedo">{u.razred}</span>
                      {u.uPracenju && <span className="oznaka primarna">u praćenju</span>}
                      {zadnji?.statusSlucaja && <StatusOznaka status={zadnji.statusSlucaja} />}
                      {u.status !== 'Aktivan' && <span className="oznaka">{u.status}</span>}
                    </span>
                    <span className="red2 broj">
                      {broj ? `${broj} ${broj % 10 === 1 && broj % 100 !== 11 ? 'razgovor' : 'razgovora'}${zadnji ? ` · zadnji ${prikaz(zadnji.datum)}` : ''}` : <span className="bez-zapisa">još bez razgovora</span>}
                    </span>
                  </span>
                  <Ikona ime="desno" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </main>
      {uvoz && <UvozPopisa postojeci={podaci?.ucenici ?? []} onZatvori={() => setUvoz(false)} />}
      {novi && <NoviUcenik ucenici={podaci?.ucenici ?? []} onZatvori={() => setNovi(false)} />}
      {razrednici && <Razrednici razredi={razredi} postojeci={razrednikRazreda} onZatvori={() => setRazrednici(false)} />}
    </>
  );
}

function NoviUcenik({ ucenici, onZatvori }: { ucenici: Ucenik[]; onZatvori: () => void }) {
  const toast = useToast();
  const [sifra, setSifra] = useState('');
  const [razred, setRazred] = useState('');
  const [ime, setIme] = useState('');
  const [prezime, setPrezime] = useState('');
  const [greska, setGreska] = useState('');
  const sacuvaj = async () => {
    if (!jeIspravnaSifra(sifra)) return setGreska('Upiši ispravnu šifru.');
    if (ucenici.some((u) => u.sifra === sifra)) return setGreska('Učenik s ovom šifrom već postoji.');
    await sacuvajUcenika({ sifra, ime: ime.trim(), prezime: prezime.trim(), razred, status: 'Aktivan', uPracenju: false, napomena: '' });
    toast('Sačuvano ✓');
    onZatvori();
    idi(`/ucenici/${encodeURIComponent(sifra)}`);
  };
  return (
    <Modal naslov="Novi učenik" onZatvori={onZatvori}>
      <form onSubmit={(e) => { e.preventDefault(); void sacuvaj(); }}>
        <div className="dva-stupca">
          <Polje labela="Ime" id="nu-ime">
            <input id="nu-ime" type="text" value={ime} onChange={(e) => setIme(e.target.value)} autoFocus autoCapitalize="words" />
          </Polje>
          <Polje labela="Prezime" id="nu-prezime">
            <input id="nu-prezime" type="text" value={prezime} onChange={(e) => setPrezime(e.target.value)} autoCapitalize="words" />
          </Polje>
        </div>
        <SifraPolje labela="Šifra" samoSifra vrijednost={sifra} onChange={(s) => { setSifra(s); setGreska(''); }} ucenici={[]} obavezno greska={greska}
          predlozi={sljedecaSifra(ucenici)} />
        <Polje labela="Razred" id="nu-razred">
          <input id="nu-razred" type="text" placeholder="npr. 6-2" value={razred} onChange={(e) => setRazred(e.target.value)} />
        </Polje>
        <div className="red-dugmadi">
          <button type="button" className="dugme" onClick={onZatvori}>Odustani</button>
          <button type="submit" className="dugme primarno">Sačuvaj</button>
        </div>
      </form>
    </Modal>
  );
}

function UvozPopisa({ postojeci, onZatvori }: { postojeci: Ucenik[]; onZatvori: () => void }) {
  const toast = useToast();
  const [tekst, setTekst] = useState('');
  const [pregled, setPregled] = useState<PregledUvoza | null>(null);
  const [greska, setGreska] = useState('');

  const izTeksta = () => {
    const t = tekstUTabelu(tekst);
    if (!t.length) return setGreska('Zalijepi kolone šifra i razred.');
    setGreska('');
    setPregled(pregledajUvoz(t, postojeci));
  };

  const izFajla = async (f: File) => {
    try {
      let tabela: (string | number)[][];
      if (/\.xlsx?$/i.test(f.name)) {
        const X = await import('xlsx');
        const wb = X.read(await f.arrayBuffer(), { type: 'array' });
        tabela = X.utils.sheet_to_json<(string | number)[]>(wb.Sheets[wb.SheetNames[0]], { header: 1, blankrows: false, raw: false });
      } else {
        tabela = tekstUTabelu(await f.text());
      }
      setGreska('');
      setPregled(pregledajUvoz(tabela, postojeci));
    } catch (e) {
      setGreska('Fajl nije moguće pročitati: ' + (e as Error).message);
    }
  };

  const potvrdi = async () => {
    if (!pregled) return;
    const t = new Date().toISOString();
    const poSifri = new Map(postojeci.map((u) => [u.sifra, u]));
    const zaUpis: Ucenik[] = [];
    for (const r of pregled.redovi) {
      if (r.stanje === 'novi') zaUpis.push({ id: uuid(), sifra: r.sifra, ime: r.ime, prezime: r.prezime, razred: normalizujRazred(r.razred), status: 'Aktivan', uPracenju: false, napomena: '', createdAt: t, updatedAt: t });
      if (r.stanje === 'azuriran') {
        const p = poSifri.get(r.sifra)!;
        zaUpis.push({ ...p, razred: normalizujRazred(r.razred) || p.razred, ime: r.ime || p.ime || '', prezime: r.prezime || p.prezime || '', updatedAt: t });
      }
    }
    await db.ucenici.bulkPut(zaUpis);
    for (const [raz, nastavnik] of Object.entries(pregled.razrednici)) await postaviRazrednika(raz, nastavnik);
    toast(`Uvezeno ✓ (${pregled.novi} novih, ${pregled.azurirani} ažurirano)`);
    onZatvori();
  };

  return (
    <Modal naslov="Uvoz popisa učenika" onZatvori={onZatvori}>
      {!pregled ? (
        <>
          <p className="malo">U Excelu označi kolone <strong>šifra</strong>, <strong>razred</strong>, <strong>ime i prezime</strong> i (po želji) <strong>razrednik</strong>, kopiraj ih i zalijepi ovdje. Sa zaglavljem kolone mogu biti bilo kojim redom (i odvojeno „Ime“ i „Prezime“).</p>
          <Polje labela="Zalijepi kolone iz Excela" id="uvoz-tekst" greska={greska}>
            <textarea id="uvoz-tekst" rows={6} value={tekst} onChange={(e) => setTekst(e.target.value)} placeholder={'U001\t6-1\tIme Prezime\nU002\t6-1\tIme Prezime'} style={{ overflow: 'auto' }} />
          </Polje>
          <div className="red-dugmadi">
            <button type="button" className="dugme primarno" onClick={izTeksta} disabled={!tekst.trim()}>Pregledaj</button>
            <label className="dugme">
              <Ikona ime="posalji" /> Izaberi CSV / XLSX
              <input type="file" accept=".csv,.txt,.xlsx,.xls,text/csv" className="sr-only" onChange={(e) => e.target.files?.[0] && void izFajla(e.target.files[0])} />
            </label>
          </div>
        </>
      ) : (
        <>
          <p>
            <strong>{pregled.novi}</strong> novih · <strong>{pregled.azurirani}</strong> s promjenom razreda · {pregled.isti} bez promjene
            {Object.keys(pregled.razrednici).length > 0 && <> · razrednici za {Object.keys(pregled.razrednici).length} razreda</>}
            {pregled.greske > 0 && <> · <span style={{ color: 'var(--crvena)' }}><strong>{pregled.greske}</strong> s greškom (neće se uvesti)</span></>}
          </p>
          <div className="tabela-omot pregled-uvoza">
            <table className="tabela">
              <thead><tr><th>Red</th><th>Šifra</th><th>Ime i prezime</th><th>Razred</th><th>Stanje</th></tr></thead>
              <tbody>
                {pregled.redovi.map((r) => (
                  <tr key={r.red}>
                    <td className="n">{r.red}</td>
                    <td><strong>{r.sifra}</strong></td>
                    <td>{[r.ime, r.prezime].filter(Boolean).join(' ')}</td>
                    <td>{r.razred}</td>
                    <td>
                      {r.stanje === 'novi' && <span className="oznaka zelena">novi</span>}
                      {r.stanje === 'azuriran' && <span className="oznaka narandzasta">{r.poruka}</span>}
                      {r.stanje === 'isti' && <span className="oznaka">postoji</span>}
                      {r.stanje === 'greska' && <span className="oznaka crvena">{r.poruka}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="red-dugmadi">
            <button type="button" className="dugme" onClick={() => setPregled(null)}>Nazad</button>
            <button type="button" className="dugme primarno" disabled={!pregled.novi && !pregled.azurirani} onClick={() => void potvrdi()}>
              Uvezi {pregled.novi + pregled.azurirani}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

/** Prijedlog sljedeće slobodne šifre (U001, U002, …). */
function sljedecaSifra(ucenici: Ucenik[]): string {
  const max = ucenici.reduce((m, u) => {
    const x = /^U(\d+)$/.exec(u.sifra);
    return x ? Math.max(m, Number(x[1])) : m;
  }, 0);
  return `U${String(max + 1).padStart(3, '0')}`;
}

function Razrednici({ razredi, postojeci, onZatvori }: { razredi: string[]; postojeci: Map<string, string>; onZatvori: () => void }) {
  const toast = useToast();
  const [vrijednosti, setVrijednosti] = useState<Record<string, string>>(() => Object.fromEntries(razredi.map((r) => [r, postojeci.get(r) ?? ''])));
  const [noviRazred, setNoviRazred] = useState('');
  const sviRazredi = Object.keys(vrijednosti).sort((a, b) => a.localeCompare(b, 'bs', { numeric: true }));
  const sacuvaj = async () => {
    for (const [r, n] of Object.entries(vrijednosti)) await postaviRazrednika(r, n);
    toast('Sačuvano ✓');
    onZatvori();
  };
  return (
    <Modal naslov="Razredi i razrednici" onZatvori={onZatvori}>
      <form onSubmit={(e) => { e.preventDefault(); void sacuvaj(); }}>
        {sviRazredi.length === 0 && <p className="blijedo">Još nema razreda. Uvezi popis učenika ili dodaj razred ispod.</p>}
        {sviRazredi.map((r) => (
          <Polje key={r} labela={`Razred ${r}`} id={`raz-${r}`}>
            <input id={`raz-${r}`} type="text" placeholder="Ime i prezime razrednika" value={vrijednosti[r]} autoCapitalize="words"
              onChange={(e) => setVrijednosti({ ...vrijednosti, [r]: e.target.value })} />
          </Polje>
        ))}
        <div className="razdvoji">
          <input type="text" className="rastegni" placeholder="Novi razred, npr. 6-2" aria-label="Novi razred" value={noviRazred} onChange={(e) => setNoviRazred(e.target.value)} style={{ flex: 1 }} />
          <button type="button" className="dugme" disabled={!normalizujRazred(noviRazred)}
            onClick={() => { const r = normalizujRazred(noviRazred); if (r && !(r in vrijednosti)) setVrijednosti({ ...vrijednosti, [r]: '' }); setNoviRazred(''); }}>Dodaj razred</button>
        </div>
        <div className="red-dugmadi">
          <button type="button" className="dugme" onClick={onZatvori}>Odustani</button>
          <button type="submit" className="dugme primarno">Sačuvaj</button>
        </div>
      </form>
    </Modal>
  );
}
