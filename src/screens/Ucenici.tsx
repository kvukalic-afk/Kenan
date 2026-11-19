import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { sacuvajUcenika, uuid } from '../db/repo';
import { Ikona } from '../components/Ikona';
import { Modal, Polje, Prazno, SifraPolje } from '../components/Polja';
import { StatusOznaka, Zaglavlje } from '../components/Okvir';
import { useToast } from '../components/Toast';
import { prikaz } from '../lib/datum';
import { idi } from '../lib/router';
import { jeIspravnaSifra, normalizujRazred, uporediSifre } from '../lib/sifra';
import { pregledajUvoz, tekstUTabelu, type PregledUvoza } from '../lib/uvozUcenika';
import { zadnjiRazgovorPoUceniku } from '../lib/zakazano';
import type { Ucenik } from '../types';

type Filter = 'svi' | 'pracenje' | 'otvoreni';

export function Ucenici({ pocetniFilter }: { pocetniFilter?: string }) {
  const [upit, setUpit] = useState('');
  const [filter, setFilter] = useState<Filter>(pocetniFilter === 'pracenje' || pocetniFilter === 'otvoreni' ? pocetniFilter : 'svi');
  const [razred, setRazred] = useState('');
  const [uvoz, setUvoz] = useState(false);
  const [novi, setNovi] = useState(false);

  const podaci = useLiveQuery(async () => {
    const [ucenici, razgovori] = await Promise.all([db.ucenici.toArray(), db.razgovori.toArray()]);
    return { ucenici, razgovori };
  }, []);

  const redovi = useMemo(() => {
    if (!podaci) return [];
    const zadnji = zadnjiRazgovorPoUceniku(podaci.razgovori);
    const broj = new Map<string, number>();
    for (const r of podaci.razgovori) broj.set(r.sifra, (broj.get(r.sifra) ?? 0) + 1);
    return podaci.ucenici.map((u) => ({ u, broj: broj.get(u.sifra) ?? 0, zadnji: zadnji.get(u.sifra) }));
  }, [podaci]);

  const razredi = useMemo(() => [...new Set(redovi.map((r) => r.u.razred).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'bs', { numeric: true })), [redovi]);

  const prikazani = useMemo(() => {
    const q = upit.trim().toUpperCase();
    return redovi
      .filter((r) => !q || r.u.sifra.includes(q) || r.u.razred.toUpperCase().includes(q))
      .filter((r) => filter !== 'pracenje' || r.u.uPracenju)
      .filter((r) => filter !== 'otvoreni' || r.zadnji?.statusSlucaja === 'Otvoren')
      .filter((r) => !razred || r.u.razred === razred)
      .sort((a, b) => Number(b.u.uPracenju) - Number(a.u.uPracenju) || uporediSifre(a.u.sifra, b.u.sifra));
  }, [redovi, upit, filter, razred]);

  return (
    <>
      <Zaglavlje naslov="Učenici" />
      <main className="sadrzaj sirok">
        <div className="pretraga razdvoji">
          <label htmlFor="trazi" className="sr-only">Pretraga po šifri ili razredu</label>
          <input id="trazi" type="search" className="rastegni" placeholder="Traži šifru ili razred…" value={upit} onChange={(e) => setUpit(e.target.value)} autoComplete="off" />
        </div>
        <div className="filteri" role="group" aria-label="Filter">
          {([['svi', 'Svi'], ['pracenje', 'U praćenju'], ['otvoreni', 'Otvoreni slučajevi']] as [Filter, string][]).map(([k, n]) => (
            <button key={k} type="button" className="chip mali" aria-pressed={filter === k} onClick={() => setFilter(k)}>{n}</button>
          ))}
          <select aria-label="Razred" value={razred} onChange={(e) => setRazred(e.target.value)} style={{ width: 'auto', minHeight: 36, padding: '4px 8px' }}>
            <option value="">Svi razredi</option>
            {razredi.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="razdvoji" style={{ marginBottom: 12 }}>
          <span className="blijedo malo rastegni">{prikazani.length} od {redovi.length} učenika</span>
          <button type="button" className="dugme" onClick={() => setNovi(true)}><Ikona ime="plus" /> Učenik</button>
          <button type="button" className="dugme" onClick={() => setUvoz(true)}><Ikona ime="posalji" /> Uvoz popisa</button>
        </div>

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
                      <span className="sifra-velika">{u.sifra}</span>
                      <span className="blijedo">{u.razred}</span>
                      {u.uPracenju && <span className="oznaka primarna">u praćenju</span>}
                      {zadnji?.statusSlucaja && <StatusOznaka status={zadnji.statusSlucaja} />}
                      {u.status !== 'Aktivan' && <span className="oznaka">{u.status}</span>}
                    </span>
                    <span className="red2 broj">
                      {broj} {broj === 1 ? 'razgovor' : 'razgovora'}{zadnji ? ` · zadnji ${prikaz(zadnji.datum)}` : ''}
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
    </>
  );
}

function NoviUcenik({ ucenici, onZatvori }: { ucenici: Ucenik[]; onZatvori: () => void }) {
  const toast = useToast();
  const [sifra, setSifra] = useState('');
  const [razred, setRazred] = useState('');
  const [greska, setGreska] = useState('');
  const sacuvaj = async () => {
    if (!jeIspravnaSifra(sifra)) return setGreska('Upiši ispravnu šifru.');
    if (ucenici.some((u) => u.sifra === sifra)) return setGreska('Učenik s ovom šifrom već postoji.');
    await sacuvajUcenika({ sifra, razred, status: 'Aktivan', uPracenju: false, napomena: '' });
    toast('Sačuvano ✓');
    onZatvori();
    idi(`/ucenici/${encodeURIComponent(sifra)}`);
  };
  return (
    <Modal naslov="Novi učenik" onZatvori={onZatvori}>
      <form onSubmit={(e) => { e.preventDefault(); void sacuvaj(); }}>
        <SifraPolje vrijednost={sifra} onChange={(s) => { setSifra(s); setGreska(''); }} ucenici={[]} obavezno greska={greska} autoFokus />
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
      if (r.stanje === 'novi') zaUpis.push({ id: uuid(), sifra: r.sifra, razred: normalizujRazred(r.razred), status: 'Aktivan', uPracenju: false, napomena: '', createdAt: t, updatedAt: t });
      if (r.stanje === 'azuriran') zaUpis.push({ ...poSifri.get(r.sifra)!, razred: normalizujRazred(r.razred), updatedAt: t });
    }
    await db.ucenici.bulkPut(zaUpis);
    toast(`Uvezeno ✓ (${pregled.novi} novih, ${pregled.azurirani} ažurirano)`);
    onZatvori();
  };

  return (
    <Modal naslov="Uvoz popisa učenika" onZatvori={onZatvori}>
      {!pregled ? (
        <>
          <p className="malo">U Excelu označi dvije kolone – <strong>šifra</strong> i <strong>razred</strong> – kopiraj ih i zalijepi ovdje. Može i sa zaglavljem. Ne uvozi imena.</p>
          <Polje labela="Zalijepi kolone iz Excela" id="uvoz-tekst" greska={greska}>
            <textarea id="uvoz-tekst" rows={6} value={tekst} onChange={(e) => setTekst(e.target.value)} placeholder={'U001\t6-1\nU002\t6-1'} style={{ overflow: 'auto' }} />
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
            {pregled.greske > 0 && <> · <span style={{ color: 'var(--crvena)' }}><strong>{pregled.greske}</strong> s greškom (neće se uvesti)</span></>}
          </p>
          <div className="tabela-omot pregled-uvoza">
            <table className="tabela">
              <thead><tr><th>Red</th><th>Šifra</th><th>Razred</th><th>Stanje</th></tr></thead>
              <tbody>
                {pregled.redovi.map((r) => (
                  <tr key={r.red}>
                    <td className="n">{r.red}</td>
                    <td><strong>{r.sifra}</strong></td>
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
