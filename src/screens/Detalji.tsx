import { useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { obrisi } from '../db/repo';
import { Ikona } from '../components/Ikona';
import { Potvrda, Prazno } from '../components/Polja';
import { NAZIV_VRSTE, StatusOznaka, Zaglavlje } from '../components/Okvir';
import { useToast } from '../components/Toast';
import { prikaz, prikazVremena } from '../lib/datum';
import { nazad } from '../lib/router';
import type { Radionica, Razgovor, Saradnja, VrstaUnosa } from '../types';

const TABELA = { razgovor: 'razgovori', radionica: 'radionice', saradnja: 'saradnja' } as const;

function Red({ o, children }: { o: string; children: ReactNode }) {
  if (children === '' || children === null || children === undefined) return null;
  return (<><dt>{o}</dt><dd>{children}</dd></>);
}

function Blok({ naslov, tekst }: { naslov: string; tekst: string }) {
  if (!tekst?.trim()) return null;
  return (<section style={{ marginTop: 14 }}><h3>{naslov}</h3><div className="blok-teksta">{tekst}</div></section>);
}

const sifraLink = (s: string) => (s ? <a href={`#/ucenici/${encodeURIComponent(s)}`}><strong>{s}</strong></a> : '');

export function Detalji({ vrsta, id }: { vrsta: VrstaUnosa; id: string }) {
  const toast = useToast();
  const [brisanje, setBrisanje] = useState(false);
  const zapis = useLiveQuery(() => db.table(TABELA[vrsta]).get(id), [vrsta, id], null as unknown);

  if (zapis === null) return <Zaglavlje naslov={NAZIV_VRSTE[vrsta]} nazadNa="/" />;
  if (!zapis) {
    return (<><Zaglavlje naslov={NAZIV_VRSTE[vrsta]} nazadNa="/" /><main className="sadrzaj"><Prazno>Zapis ne postoji ili je obrisan.</Prazno></main></>);
  }

  let sadrzaj: ReactNode;
  if (vrsta === 'razgovor') {
    const r = zapis as Razgovor;
    sadrzaj = (
      <>
        <dl className="podaci">
          <Red o="Datum">{prikaz(r.datum)}</Red>
          <Red o="Šifra">{sifraLink(r.sifra)}</Red>
          <Red o="Razred">{r.razred}</Red>
          <Red o="Vrsta kontakta">{r.vrstaKontakta}</Red>
          <Red o="Inicirao">{r.inicirao}</Red>
          <Red o="Razlog">{r.razlog}</Red>
          <Red o="Status slučaja">{r.statusSlucaja && <StatusOznaka status={r.statusSlucaja} />}</Red>
          <Red o="Sljedeći korak">{r.sljedeciKorak}</Red>
          <Red o="Sljedeći kontakt">{prikaz(r.datumSljedecegKontakta)}</Red>
        </dl>
        <Blok naslov="Bilješke" tekst={r.biljeske} />
        <Blok naslov="Zaključak" tekst={r.zakljucak} />
        <Blok naslov="Preporuke" tekst={r.preporuke} />
      </>
    );
  } else if (vrsta === 'radionica') {
    const r = zapis as Radionica;
    sadrzaj = (
      <>
        <dl className="podaci">
          <Red o="Datum">{prikaz(r.datum)}</Red>
          <Red o="Tema"><strong>{r.tema}</strong></Red>
          <Red o="Razred">{r.razred}</Red>
          <Red o="Oblast">{r.oblast}</Red>
          <Red o="Ciljna grupa">{r.ciljnaGrupa}</Red>
          <Red o="Broj učesnika">{r.brojUcesnika ?? ''}</Red>
          <Red o="Trajanje">{r.trajanjeMin ? `${r.trajanjeMin} min` : ''}</Red>
          <Red o="Učenici za praćenje">
            {r.ucenicizaPracenje?.length ? <span className="tagovi" style={{ margin: 0 }}>{r.ucenicizaPracenje.map((s) => <a key={s} className="tag" style={{ padding: '2px 10px', textDecoration: 'none' }} href={`#/ucenici/${encodeURIComponent(s)}`}>{s}</a>)}</span> : ''}
          </Red>
        </dl>
        <Blok naslov="Cilj" tekst={r.cilj} />
        <Blok naslov="Tok aktivnosti" tekst={r.tokAktivnosti} />
        <Blok naslov="Zapažanja" tekst={r.zapazanja} />
        <Blok naslov="Evaluacija" tekst={r.evaluacija} />
        <Blok naslov="Napomena" tekst={r.napomena} />
      </>
    );
  } else {
    const s = zapis as Saradnja;
    sadrzaj = (
      <>
        <dl className="podaci">
          <Red o="Datum">{prikaz(s.datum)}</Red>
          <Red o="Šifra učenika">{sifraLink(s.sifra)}</Red>
          <Red o="Ustanova / osoba">{s.ustanovaOsoba}</Red>
          <Red o="Opis osobe">{s.opisOsobe}</Red>
          <Red o="Način">{s.nacin}</Red>
        </dl>
        <Blok naslov="Razlog" tekst={s.razlog} />
        <Blok naslov="Dogovor / ishod" tekst={s.dogovorIshod} />
      </>
    );
  }

  const z = zapis as { createdAt: string; updatedAt: string };
  return (
    <>
      <Zaglavlje naslov={NAZIV_VRSTE[vrsta]} nazadNa="/" />
      <main className="sadrzaj">
        <div className="red-dugmadi" style={{ marginBottom: 12 }}>
          <a className="dugme" href={`#/uredi/${vrsta}/${id}`}><Ikona ime="uredi" /> Uredi</a>
          <a className="dugme" href={`#/print/${vrsta}/${id}`}><Ikona ime="print" /> Preuzmi za print</a>
          <button type="button" className="dugme opasno" onClick={() => setBrisanje(true)}><Ikona ime="obrisi" /> Obriši</button>
        </div>
        <article className="kartica">{sadrzaj}</article>
        <p className="blijedo malo">Uneseno {prikazVremena(z.createdAt)}{z.updatedAt !== z.createdAt ? ` · izmijenjeno ${prikazVremena(z.updatedAt)}` : ''}</p>
      </main>
      {brisanje && (
        <Potvrda naslov="Obrisati zapis?" opasno potvrdi="Obriši" tekst="Zapis će biti trajno obrisan s ovog uređaja."
          onOdustani={() => setBrisanje(false)}
          onPotvrdi={async () => { await obrisi(TABELA[vrsta], id); toast('Obrisano'); nazad('/'); }} />
      )}
    </>
  );
}
