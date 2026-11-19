import { useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { sacuvajRadionicu, sacuvajRazgovor, sacuvajSaradnju } from '../db/repo';
import { Chipovi, DatumPolje, Izbor, Modal, Polje, Potvrda, SifraPolje, TagSifre, TekstPolje } from '../components/Polja';
import { Ikona } from '../components/Ikona';
import { useToast } from '../components/Toast';
import { useForma } from '../lib/forma';
import { danasIso, prikazVremena } from '../lib/datum';
import { idi, nazad } from '../lib/router';
import { opcije, useSifrarnik } from '../lib/podaci';
import { jeIspravnaSifra, normalizujRazred } from '../lib/sifra';
import type { Radionica, Razgovor, Saradnja, VrstaUnosa } from '../types';

type Bez<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

function useUcenici() {
  return useLiveQuery(() => db.ucenici.toArray(), []) ?? [];
}

// ---------- Zajednički okvir forme ----------

function OkvirForme(props: {
  naslov: string;
  children: ReactNode;
  nacrt: { updatedAt: string } | null;
  onNastavi: () => void;
  onOdbaci: () => void;
  onSacuvaj: () => void;
  onOdustani: () => void;
  snimanje: boolean;
}) {
  return (
    <>
      <header className="traka">
        <button type="button" className="ikona-dugme" onClick={props.onOdustani} aria-label="Nazad"><Ikona ime="nazad" /></button>
        <h1>{props.naslov}</h1>
      </header>
      <main className="sadrzaj forma-sadrzaj">
        {props.nacrt && (
          <div className="obavjestenje info" role="status">
            <div className="tekst">
              <strong>Nastavi nedovršeni unos?</strong>
              <div className="malo blijedo">Sačuvan nacrt od {prikazVremena(props.nacrt.updatedAt)}.</div>
              <div className="red-dugmadi" style={{ marginTop: 8 }}>
                <button type="button" className="dugme primarno" onClick={props.onNastavi}>Nastavi</button>
                <button type="button" className="dugme" onClick={props.onOdbaci}>Odbaci</button>
              </div>
            </div>
          </div>
        )}
        <form id="forma" noValidate onSubmit={(e) => { e.preventDefault(); props.onSacuvaj(); }}>
          {props.children}
        </form>
      </main>
      <div className="sticky-dno">
        <div className="unutra">
          <button type="button" className="dugme" onClick={props.onOdustani}>Odustani</button>
          <button type="submit" form="forma" className="dugme primarno" disabled={props.snimanje}>
            <Ikona ime="kvacica" /> Sačuvaj
          </button>
        </div>
      </div>
    </>
  );
}

function PoslijeSnimanja({ vrsta, id, onGotovo }: { vrsta: VrstaUnosa; id: string; onGotovo: () => void }) {
  return (
    <Modal naslov="Sačuvano ✓" onZatvori={onGotovo}>
      <p>Unos je sačuvan na ovom uređaju.</p>
      <div className="red-dugmadi">
        <button type="button" className="dugme" onClick={() => idi(`/print/${vrsta}/${id}`, true)}>
          <Ikona ime="print" /> Preuzmi izvještaj za print
        </button>
        <button type="button" className="dugme primarno" onClick={onGotovo}>Gotovo</button>
      </div>
    </Modal>
  );
}

function useOdustajanje(izmijenjeno: boolean, zavrsi: () => Promise<void>, rezerva: string) {
  const [pitaj, setPitaj] = useState(false);
  const odustani = () => (izmijenjeno ? setPitaj(true) : nazad(rezerva));
  const dijalog = pitaj ? (
    <Potvrda naslov="Odbaciti unos?" tekst="Izmjene koje nisu sačuvane biće izgubljene." potvrdi="Odbaci" opasno
      onOdustani={() => setPitaj(false)} onPotvrdi={async () => { await zavrsi(); nazad(rezerva); }} />
  ) : null;
  return { odustani, dijalog };
}

/** Postavlja polje i uklanja grešku tog polja čim se ispravi. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function saBrisanjemGreske<P extends (k: any, v: any) => void>(postavi: P, setGreske: (f: (g: Record<string, string>) => Record<string, string>) => void): P {
  return ((k: string, v: unknown) => {
    postavi(k, v);
    setGreske((g) => {
      if (!g[k]) return g;
      const c = { ...g };
      delete c[k];
      return c;
    });
  }) as P;
}

function skrol(greske: Record<string, string>) {
  if (Object.keys(greske).length) {
    setTimeout(() => document.querySelector('.ima-gresku')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 30);
  }
}

// ---------- Razgovor ----------

const prazanRazgovor = (sifra = ''): Bez<Razgovor> => ({
  datum: danasIso(), sifra, razred: '', vrstaKontakta: 'Individualni razgovor s učenikom', inicirao: '', razlog: '',
  biljeske: '', zakljucak: '', preporuke: '', sljedeciKorak: '', datumSljedecegKontakta: '', statusSlucaja: 'Otvoren',
});

export function FormaRazgovor({ editId, sifra: pocetnaSifra, izNacrta }: { editId?: string; sifra?: string; izNacrta?: boolean }) {
  const toast = useToast();
  const sif = useSifrarnik();
  const ucenici = useUcenici();
  const f = useForma<Bez<Razgovor> & { id?: string }>('razgovor', editId, async () => {
    if (editId) return db.razgovori.get(editId);
    const p = prazanRazgovor(pocetnaSifra);
    if (pocetnaSifra) p.razred = (await db.ucenici.where('sifra').equals(pocetnaSifra).first())?.razred ?? '';
    return p;
  }, !!izNacrta);
  const [greske, setGreske] = useState<Record<string, string>>({});
  const postavi = saBrisanjemGreske(f.postavi, setGreske);
  const [snimanje, setSnimanje] = useState(false);
  const [sacuvanId, setSacuvanId] = useState('');
  const { odustani, dijalog } = useOdustajanje(f.izmijenjeno, f.zavrsi, '/');

  const p = f.podaci;
  if (!p) return null;
  const postojeci = ucenici.find((u) => u.sifra === p.sifra);
  const noviUcenik = !!p.sifra && jeIspravnaSifra(p.sifra) && !postojeci;

  const sacuvaj = async () => {
    const g: Record<string, string> = {};
    if (!p.datum) g.datum = 'Upiši datum.';
    if (!p.sifra) g.sifra = 'Upiši šifru učenika.';
    else if (!jeIspravnaSifra(p.sifra)) g.sifra = 'Šifra smije imati samo slova, brojeve, - i _ (do 20 znakova).';
    if (noviUcenik && !p.razred.trim()) g.razred = 'Nov učenik – upiši razred (npr. 6-2).';
    setGreske(g);
    skrol(g);
    if (Object.keys(g).length) return;
    setSnimanje(true);
    try {
      const z = await sacuvajRazgovor({ ...p, razred: normalizujRazred(p.razred || postojeci?.razred || '') });
      await f.zavrsi();
      toast('Sačuvano ✓');
      setSacuvanId(z.id);
    } catch (e) {
      toast('Snimanje nije uspjelo: ' + (e as Error).message, 'greska');
    } finally {
      setSnimanje(false);
    }
  };

  return (
    <>
      <OkvirForme naslov={editId ? 'Uredi razgovor' : 'Novi razgovor'} nacrt={f.nacrt} onNastavi={f.nastaviNacrt} onOdbaci={f.odbaciNacrt}
        onSacuvaj={sacuvaj} onOdustani={odustani} snimanje={snimanje}>
        <div className="dva-stupca">
          <DatumPolje labela="Datum" obavezno vrijednost={p.datum} onChange={(v) => postavi('datum', v)} greska={greske.datum} />
          <SifraPolje vrijednost={p.sifra} obavezno greska={greske.sifra} ucenici={ucenici} autoFokus={!editId && !pocetnaSifra}
            onChange={(s) => {
              postavi('sifra', s);
              const u = ucenici.find((x) => x.sifra === s);
              if (u) postavi('razred', u.razred);
            }}
            onIzaberi={(u) => postavi('razred', u.razred)} />
        </div>
        {(noviUcenik || postojeci || p.razred) && (
          <Polje labela={noviUcenik ? 'Razred (nov učenik)' : 'Razred'} id="razred" obavezno={noviUcenik} greska={greske.razred}
            pomoc={noviUcenik ? 'Učenik s ovom šifrom još ne postoji – biće kreiran pri snimanju.' : 'Preuzeto iz kartona učenika; može se promijeniti za ovaj razgovor.'}>
            <input id="razred" type="text" value={p.razred} placeholder="npr. 6-2" onChange={(e) => postavi('razred', e.target.value)}
              onBlur={(e) => postavi('razred', normalizujRazred(e.target.value))} />
          </Polje>
        )}
        <Chipovi id="vrsta" labela="Vrsta kontakta" opcije={opcije(sif, 'vrstaKontakta', p.vrstaKontakta)} vrijednost={p.vrstaKontakta} onChange={(v) => postavi('vrstaKontakta', v)} />
        <div className="mreza-2">
          <Izbor labela="Inicirao" opcije={opcije(sif, 'inicirao', p.inicirao)} vrijednost={p.inicirao} onChange={(v) => postavi('inicirao', v)} />
          <Izbor labela="Razlog" opcije={opcije(sif, 'razlog', p.razlog)} vrijednost={p.razlog} onChange={(v) => postavi('razlog', v)} />
        </div>
        <TekstPolje labela="Bilješke" vrijednost={p.biljeske} onChange={(v) => postavi('biljeske', v)} placeholder="Tok razgovora, zapažanja…" />
        <TekstPolje labela="Zaključak" vrijednost={p.zakljucak} onChange={(v) => postavi('zakljucak', v)} />
        <TekstPolje labela="Preporuke" vrijednost={p.preporuke} onChange={(v) => postavi('preporuke', v)} />
        <TekstPolje labela="Sljedeći korak" kratko vrijednost={p.sljedeciKorak} onChange={(v) => postavi('sljedeciKorak', v)} />
        <DatumPolje labela="Datum sljedećeg kontakta" vrijednost={p.datumSljedecegKontakta} onChange={(v) => postavi('datumSljedecegKontakta', v)}
          brzi={[{ naziv: '+7 dana', dana: 7 }, { naziv: '+14 dana', dana: 14 }, { naziv: '+30 dana', dana: 30 }]} />
        <Chipovi id="status" labela="Status slučaja" opcije={opcije(sif, 'statusSlucaja', p.statusSlucaja)} vrijednost={p.statusSlucaja}
          onChange={(v) => postavi('statusSlucaja', v)} mozeOdznaciti={false} />
      </OkvirForme>
      {dijalog}
      {sacuvanId && <PoslijeSnimanja vrsta="razgovor" id={sacuvanId} onGotovo={() => idi(`/ucenici/${encodeURIComponent(p.sifra)}`, true)} />}
    </>
  );
}

// ---------- Radionica ----------

const praznaRadionica = (): Bez<Radionica> => ({
  datum: danasIso(), razred: '', tema: '', oblast: '', ciljnaGrupa: 'Učenici', brojUcesnika: null, trajanjeMin: 45,
  cilj: '', tokAktivnosti: '', zapazanja: '', ucenicizaPracenje: [], evaluacija: '', napomena: '',
});

export function FormaRadionica({ editId, izNacrta }: { editId?: string; izNacrta?: boolean }) {
  const toast = useToast();
  const sif = useSifrarnik();
  const ucenici = useUcenici();
  const f = useForma<Bez<Radionica> & { id?: string }>('radionica', editId, async () => (editId ? db.radionice.get(editId) : praznaRadionica()), !!izNacrta);
  const [greske, setGreske] = useState<Record<string, string>>({});
  const postavi = saBrisanjemGreske(f.postavi, setGreske);
  const [snimanje, setSnimanje] = useState(false);
  const [sacuvanId, setSacuvanId] = useState('');
  const { odustani, dijalog } = useOdustajanje(f.izmijenjeno, f.zavrsi, '/radionice');

  const p = f.podaci;
  if (!p) return null;
  const broj = (v: string) => (v === '' ? null : Math.max(0, Math.round(Number(v))));

  const sacuvaj = async () => {
    const g: Record<string, string> = {};
    if (!p.datum) g.datum = 'Upiši datum.';
    if (!p.tema.trim()) g.tema = 'Upiši temu radionice.';
    setGreske(g);
    skrol(g);
    if (Object.keys(g).length) return;
    setSnimanje(true);
    try {
      const z = await sacuvajRadionicu({ ...p, razred: normalizujRazred(p.razred) });
      await f.zavrsi();
      toast('Sačuvano ✓');
      setSacuvanId(z.id);
    } catch (e) {
      toast('Snimanje nije uspjelo: ' + (e as Error).message, 'greska');
    } finally {
      setSnimanje(false);
    }
  };

  return (
    <>
      <OkvirForme naslov={editId ? 'Uredi radionicu' : 'Nova radionica'} nacrt={f.nacrt} onNastavi={f.nastaviNacrt} onOdbaci={f.odbaciNacrt}
        onSacuvaj={sacuvaj} onOdustani={odustani} snimanje={snimanje}>
        <div className="dva-stupca">
          <DatumPolje labela="Datum" obavezno vrijednost={p.datum} onChange={(v) => postavi('datum', v)} greska={greske.datum} />
          <Polje labela="Razred" id="r-razred" pomoc="npr. 7-1 ili 7. razredi">
            <input id="r-razred" type="text" value={p.razred} onChange={(e) => postavi('razred', e.target.value)} onBlur={(e) => postavi('razred', normalizujRazred(e.target.value))} />
          </Polje>
        </div>
        <Polje labela="Tema" id="r-tema" obavezno greska={greske.tema}>
          <input id="r-tema" type="text" value={p.tema} onChange={(e) => postavi('tema', e.target.value)} autoFocus={!editId} />
        </Polje>
        <Chipovi id="oblast" labela="Oblast" opcije={opcije(sif, 'oblast', p.oblast)} vrijednost={p.oblast} onChange={(v) => postavi('oblast', v)} />
        <Chipovi id="ciljna" labela="Ciljna grupa" opcije={opcije(sif, 'ciljnaGrupa', p.ciljnaGrupa)} vrijednost={p.ciljnaGrupa} onChange={(v) => postavi('ciljnaGrupa', v)} />
        <div className="dva-stupca">
          <Polje labela="Broj učesnika" id="r-broj">
            <input id="r-broj" type="number" inputMode="numeric" min={0} value={p.brojUcesnika ?? ''} onChange={(e) => postavi('brojUcesnika', broj(e.target.value))} />
          </Polje>
          <Polje labela="Trajanje (min)" id="r-traj">
            <input id="r-traj" type="number" inputMode="numeric" min={0} value={p.trajanjeMin ?? ''} onChange={(e) => postavi('trajanjeMin', broj(e.target.value))} />
          </Polje>
        </div>
        <TekstPolje labela="Cilj" vrijednost={p.cilj} onChange={(v) => postavi('cilj', v)} />
        <TekstPolje labela="Tok aktivnosti" vrijednost={p.tokAktivnosti} onChange={(v) => postavi('tokAktivnosti', v)} />
        <TekstPolje labela="Zapažanja" vrijednost={p.zapazanja} onChange={(v) => postavi('zapazanja', v)} />
        <TagSifre labela="Učenici za praćenje" vrijednost={p.ucenicizaPracenje} onChange={(v) => postavi('ucenicizaPracenje', v)} ucenici={ucenici} />
        <TekstPolje labela="Evaluacija" vrijednost={p.evaluacija} onChange={(v) => postavi('evaluacija', v)} />
        <TekstPolje labela="Napomena" kratko vrijednost={p.napomena} onChange={(v) => postavi('napomena', v)} />
      </OkvirForme>
      {dijalog}
      {sacuvanId && <PoslijeSnimanja vrsta="radionica" id={sacuvanId} onGotovo={() => idi(`/zapis/radionica/${sacuvanId}`, true)} />}
    </>
  );
}

// ---------- Saradnja ----------

const praznaSaradnja = (sifra = ''): Bez<Saradnja> => ({
  datum: danasIso(), sifra, ustanovaOsoba: '', opisOsobe: '', nacin: 'Sastanak', razlog: '', dogovorIshod: '',
});

export function FormaSaradnja({ editId, sifra: pocetnaSifra, izNacrta }: { editId?: string; sifra?: string; izNacrta?: boolean }) {
  const toast = useToast();
  const sif = useSifrarnik();
  const ucenici = useUcenici();
  const f = useForma<Bez<Saradnja> & { id?: string }>('saradnja', editId, async () => (editId ? db.saradnja.get(editId) : praznaSaradnja(pocetnaSifra)), !!izNacrta);
  const [greske, setGreske] = useState<Record<string, string>>({});
  const postavi = saBrisanjemGreske(f.postavi, setGreske);
  const [snimanje, setSnimanje] = useState(false);
  const [sacuvanId, setSacuvanId] = useState('');
  const { odustani, dijalog } = useOdustajanje(f.izmijenjeno, f.zavrsi, '/');

  const p = f.podaci;
  if (!p) return null;

  const sacuvaj = async () => {
    const g: Record<string, string> = {};
    if (!p.datum) g.datum = 'Upiši datum.';
    if (!p.ustanovaOsoba) g.ustanovaOsoba = 'Izaberi ustanovu ili osobu.';
    if (p.sifra && !jeIspravnaSifra(p.sifra)) g.sifra = 'Neispravna šifra.';
    setGreske(g);
    skrol(g);
    if (Object.keys(g).length) return;
    setSnimanje(true);
    try {
      const z = await sacuvajSaradnju(p);
      await f.zavrsi();
      toast('Sačuvano ✓');
      setSacuvanId(z.id);
    } catch (e) {
      toast('Snimanje nije uspjelo: ' + (e as Error).message, 'greska');
    } finally {
      setSnimanje(false);
    }
  };

  return (
    <>
      <OkvirForme naslov={editId ? 'Uredi saradnju' : 'Nova saradnja'} nacrt={f.nacrt} onNastavi={f.nastaviNacrt} onOdbaci={f.odbaciNacrt}
        onSacuvaj={sacuvaj} onOdustani={odustani} snimanje={snimanje}>
        <div className="dva-stupca">
          <DatumPolje labela="Datum" obavezno vrijednost={p.datum} onChange={(v) => postavi('datum', v)} greska={greske.datum} />
          <SifraPolje labela="Šifra učenika (opcionalno)" vrijednost={p.sifra} greska={greske.sifra} ucenici={ucenici} onChange={(s) => postavi('sifra', s)} />
        </div>
        <Chipovi id="ustanova" labela="Ustanova / osoba" obavezno greska={greske.ustanovaOsoba} opcije={opcije(sif, 'ustanovaOsoba', p.ustanovaOsoba)}
          vrijednost={p.ustanovaOsoba} onChange={(v) => postavi('ustanovaOsoba', v)} />
        <Polje labela="Opis osobe" id="s-opis" pomoc='npr. "razrednik 6-2" – bez imena'>
          <input id="s-opis" type="text" value={p.opisOsobe} onChange={(e) => postavi('opisOsobe', e.target.value)} />
        </Polje>
        <Chipovi id="nacin" labela="Način" opcije={opcije(sif, 'nacin', p.nacin)} vrijednost={p.nacin} onChange={(v) => postavi('nacin', v)} />
        <TekstPolje labela="Razlog" kratko vrijednost={p.razlog} onChange={(v) => postavi('razlog', v)} />
        <TekstPolje labela="Dogovor / ishod" vrijednost={p.dogovorIshod} onChange={(v) => postavi('dogovorIshod', v)} />
      </OkvirForme>
      {dijalog}
      {sacuvanId && <PoslijeSnimanja vrsta="saradnja" id={sacuvanId}
        onGotovo={() => idi(p.sifra ? `/ucenici/${encodeURIComponent(p.sifra)}` : `/zapis/saradnja/${sacuvanId}`, true)} />}
    </>
  );
}
