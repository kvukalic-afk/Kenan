import { useState, type ReactNode } from 'react';
import { Ikona } from './Ikona';
import { idi, nazad } from '../lib/router';
import { prikaz } from '../lib/datum';
import type { Aktivnost, Radionica, Razgovor, Saradnja, VrstaUnosa } from '../types';

export function Zaglavlje({ naslov, nazadNa, desno }: { naslov: string; nazadNa?: string; desno?: ReactNode }) {
  return (
    <header className="traka">
      {nazadNa !== undefined && (
        <button type="button" className="ikona-dugme" onClick={() => nazad(nazadNa)} aria-label="Nazad"><Ikona ime="nazad" /></button>
      )}
      <h1>{naslov}</h1>
      {desno}
      <a className="ikona-dugme" href="#/postavke" aria-label="Postavke"><Ikona ime="postavke" /></a>
    </header>
  );
}

export function DonjaNavigacija({ aktivno }: { aktivno: string }) {
  const tabovi = [
    { put: '/', ime: 'pocetna', naziv: 'Početna', kljuc: '' },
    { put: '/ucenici', ime: 'ucenici', naziv: 'Učenici', kljuc: 'ucenici' },
    { put: '/radionice', ime: 'radionica', naziv: 'Rad', kljuc: 'radionice' },
    { put: '/statistika', ime: 'statistika', naziv: 'Izvještaji', kljuc: 'statistika' },
  ];
  return (
    <nav className="donja-nav" aria-label="Glavna navigacija">
      <div className="unutra">
        {tabovi.map((t) => (
          <a key={t.put} href={`#${t.put}`} aria-current={aktivno === t.kljuc ? 'page' : undefined}>
            <Ikona ime={t.ime} />
            {t.naziv}
          </a>
        ))}
      </div>
    </nav>
  );
}

export function PlutajuceDugme() {
  const [otvoreno, setOtvoreno] = useState(false);
  const izaberi = (put: string) => { setOtvoreno(false); idi(put); };
  return (
    <>
      {otvoreno && <div className="zavjesa" onClick={() => setOtvoreno(false)} />}
      {otvoreno && (
        <div className="fab-meni" role="menu">
          <button role="menuitem" className="dugme istaknuto" onClick={() => izaberi('/biljeske')}><Ikona ime="uredi" /> Brza bilješka</button>
          <button role="menuitem" className="dugme" onClick={() => izaberi('/novi/razgovor')}><Ikona ime="razgovor" /> Razgovor</button>
          <button role="menuitem" className="dugme" onClick={() => izaberi('/novi/radionica')}><Ikona ime="radionica" /> Radionica</button>
          <button role="menuitem" className="dugme" onClick={() => izaberi('/novi/saradnja')}><Ikona ime="saradnja" /> Saradnja</button>
          <button role="menuitem" className="dugme" onClick={() => izaberi('/novi/aktivnost')}><Ikona ime="aktivnost" /> Ostala aktivnost</button>
          <button role="menuitem" className="dugme" onClick={() => izaberi('/obrazac/sluzbena-biljeska')}><Ikona ime="prazno" /> Službena bilješka</button>
          <button role="menuitem" className="dugme ai-stavka" onClick={() => izaberi('/unos-tekst')}><Ikona ime="mikrofon" /> Ispričaj dan (AI)</button>
          <button role="menuitem" className="dugme ai-stavka" onClick={() => izaberi('/ai')}><Ikona ime="iskra" /> Pametni alati</button>
        </div>
      )}
      <button type="button" className="fab" aria-label={otvoreno ? 'Zatvori meni' : 'Novi unos'} aria-expanded={otvoreno} onClick={() => setOtvoreno((o) => !o)}>
        <Ikona ime={otvoreno ? 'zatvori' : 'plus'} />
      </button>
    </>
  );
}

export const NAZIV_VRSTE: Record<VrstaUnosa, string> = { razgovor: 'Razgovor', radionica: 'Radionica', saradnja: 'Saradnja', aktivnost: 'Aktivnost' };

export type StavkaVremena =
  | { vrsta: 'razgovor'; z: Razgovor }
  | { vrsta: 'radionica'; z: Radionica }
  | { vrsta: 'saradnja'; z: Saradnja }
  | { vrsta: 'aktivnost'; z: Aktivnost };

export function naslovStavke(s: StavkaVremena, imeZa: (sifra: string) => string = (x) => x): { glavno: string; opis: string } {
  if (s.vrsta === 'razgovor') return { glavno: `${imeZa(s.z.sifra)}${s.z.razred ? ` · ${s.z.razred}` : ''}`, opis: [s.z.razlog, s.z.vrstaKontakta].filter(Boolean).join(' · ') || s.z.biljeske };
  if (s.vrsta === 'radionica') return { glavno: s.z.tema || 'Radionica', opis: [s.z.razred, s.z.oblast].filter(Boolean).join(' · ') };
  if (s.vrsta === 'aktivnost') return { glavno: s.z.vrsta || 'Aktivnost', opis: [s.z.razred, s.z.cas && `${s.z.cas}. čas`, s.z.umjestoKoga && `umjesto: ${s.z.umjestoKoga}`, s.z.tema].filter(Boolean).join(' · ') };
  return { glavno: s.z.ustanovaOsoba || 'Saradnja', opis: [s.z.sifra && imeZa(s.z.sifra), s.z.opisOsobe, s.z.nacin].filter(Boolean).join(' · ') };
}

export function RedStavke({ s, prikaziSifru = true, imeZa }: { s: StavkaVremena; prikaziSifru?: boolean; imeZa?: (sifra: string) => string }) {
  const { glavno, opis } = naslovStavke(s, imeZa);
  const status = s.vrsta === 'razgovor' ? s.z.statusSlucaja : '';
  return (
    <a className="stavka" href={`#/zapis/${s.vrsta}/${s.z.id}`}>
      <span className={`vrsta ${s.vrsta}`} aria-hidden />
      <span className="glavno">
        <span className="red1">
          <span className={`oznaka ${s.vrsta}`}>{NAZIV_VRSTE[s.vrsta]}</span>
          <span>{s.vrsta === 'razgovor' && !prikaziSifru ? (s.z.razlog || s.z.vrstaKontakta || 'Razgovor') : glavno}</span>
          {status && <StatusOznaka status={status} />}
        </span>
        <span className="red2">{s.vrsta === 'razgovor' && !prikaziSifru ? s.z.biljeske || s.z.vrstaKontakta : opis}</span>
      </span>
      <span className="desno broj">{prikaz(s.z.datum)}</span>
    </a>
  );
}

export function StatusOznaka({ status }: { status: string }) {
  const boja = status === 'Otvoren' ? 'narandzasta' : status === 'U praćenju' ? 'primarna' : status === 'Zatvoren' ? 'zelena' : '';
  return <span className={`oznaka ${boja}`}>{status}</span>;
}
