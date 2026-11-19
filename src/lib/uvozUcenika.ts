// Uvoz popisa učenika: zalijepljene kolone iz Excela, CSV ili XLSX.
// Očekuju se dvije kolone: šifra i razred (redoslijed se prepoznaje po zaglavlju ako postoji).

import { jeIspravnaSifra, liciNaIme, normalizujRazred, ocistiSifru } from './sifra';
import type { Ucenik } from '../types';

export interface RedUvoza {
  red: number; // broj reda u izvoru (1-indeks)
  sifra: string;
  razred: string;
  stanje: 'novi' | 'azuriran' | 'isti' | 'greska';
  poruka?: string;
}

export interface PregledUvoza {
  redovi: RedUvoza[];
  novi: number;
  azurirani: number;
  isti: number;
  greske: number;
}

/** Tekst (TSV/CSV/;) → matrica ćelija. */
export function tekstUTabelu(tekst: string): string[][] {
  const linije = tekst.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim() !== '');
  if (!linije.length) return [];
  const prva = linije[0];
  const sep = prva.includes('\t') ? '\t' : prva.includes(';') ? ';' : ',';
  return linije.map((l) => parsirajLiniju(l, sep));
}

function parsirajLiniju(linija: string, sep: string): string[] {
  const out: string[] = [];
  let cur = '';
  let uNavodnicima = false;
  for (let i = 0; i < linija.length; i++) {
    const c = linija[i];
    if (uNavodnicima) {
      if (c === '"' && linija[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') uNavodnicima = false;
      else cur += c;
    } else if (c === '"') uNavodnicima = true;
    else if (c === sep) { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

const jeZaglavljeSifre = (s: string) => /^(šifra|sifra|šifra učenika|sifra ucenika|code|id)$/i.test(s.trim());
const jeZaglavljeRazreda = (s: string) => /^(razred|odjeljenje|odjeljenje\/razred|class)$/i.test(s.trim());

export function pregledajUvoz(tabela: (string | number | null | undefined)[][], postojeci: Pick<Ucenik, 'sifra' | 'razred'>[]): PregledUvoza {
  const celije = tabela.map((r) => r.map((c) => (c == null ? '' : String(c).trim())));
  let kolSifra = 0, kolRazred = 1, start = 0;
  if (celije.length) {
    const z = celije[0];
    const iS = z.findIndex(jeZaglavljeSifre);
    const iR = z.findIndex(jeZaglavljeRazreda);
    if (iS >= 0 || iR >= 0) {
      start = 1;
      if (iS >= 0) kolSifra = iS;
      if (iR >= 0) kolRazred = iR;
      else kolRazred = kolSifra === 0 ? 1 : 0;
    }
  }

  const poSifri = new Map(postojeci.map((u) => [u.sifra, u]));
  const uFajlu = new Set<string>();
  const redovi: RedUvoza[] = [];

  for (let i = start; i < celije.length; i++) {
    const r = celije[i];
    const sirovo = r[kolSifra] ?? '';
    const razred = normalizujRazred(r[kolRazred] ?? '');
    if (!sirovo && !razred) continue;
    const sifra = ocistiSifru(sirovo);
    const red: RedUvoza = { red: i + 1, sifra: sifra || sirovo, razred, stanje: 'novi' };
    if (!sirovo) {
      red.stanje = 'greska'; red.poruka = 'Nedostaje šifra';
    } else if (liciNaIme(sirovo) && !jeIspravnaSifra(sirovo.toUpperCase())) {
      red.stanje = 'greska'; red.poruka = 'Liči na ime – upiši šifru';
    } else if (!jeIspravnaSifra(sifra) || sifra !== sirovo.toUpperCase()) {
      red.stanje = 'greska'; red.poruka = 'Nedozvoljeni znakovi u šifri';
    } else if (uFajlu.has(sifra)) {
      red.stanje = 'greska'; red.poruka = 'Šifra se ponavlja u popisu';
    } else {
      uFajlu.add(sifra);
      const p = poSifri.get(sifra);
      if (p) red.stanje = razred && p.razred !== razred ? 'azuriran' : 'isti';
      if (red.stanje === 'azuriran') red.poruka = `razred ${p!.razred || '–'} → ${razred}`;
    }
    redovi.push(red);
  }
  return {
    redovi,
    novi: redovi.filter((r) => r.stanje === 'novi').length,
    azurirani: redovi.filter((r) => r.stanje === 'azuriran').length,
    isti: redovi.filter((r) => r.stanje === 'isti').length,
    greske: redovi.filter((r) => r.stanje === 'greska').length,
  };
}
