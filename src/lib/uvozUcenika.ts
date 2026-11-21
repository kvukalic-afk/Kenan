// Uvoz popisa učenika: zalijepljene kolone iz Excela, CSV ili XLSX.
// Očekuju se dvije kolone: šifra i razred (redoslijed se prepoznaje po zaglavlju ako postoji).

import { jeIspravnaSifra, liciNaIme, normalizujRazred, ocistiSifru } from './sifra';
import type { Ucenik } from '../types';

export interface RedUvoza {
  red: number; // broj reda u izvoru (1-indeks)
  sifra: string;
  razred: string;
  ime: string;
  prezime: string;
  razrednik: string;
  stanje: 'novi' | 'azuriran' | 'isti' | 'greska';
  poruka?: string;
}

export interface PregledUvoza {
  redovi: RedUvoza[];
  novi: number;
  azurirani: number;
  isti: number;
  greske: number;
  /** razred → razrednik, iz kolone "Razrednik" (ako postoji) */
  razrednici: Record<string, string>;
}

/** Tekst (TSV/CSV/;) → matrica ćelija. */
export function tekstUTabelu(tekst: string): string[][] {
  const linije = tekst.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim() !== '');
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

const norm = (s: string) => s.trim().toLowerCase().replace(/š/g, 's').replace(/[čć]/g, 'c').replace(/ž/g, 'z').replace(/đ/g, 'dj');
const ZAGLAVLJA: Record<string, string[]> = {
  sifra: ['sifra', 'sifra ucenika', 'code', 'id'],
  razred: ['razred', 'odjeljenje', 'odjeljenje/razred', 'class'],
  imePrezime: ['ime i prezime', 'ucenik', 'ime prezime', 'naziv'],
  ime: ['ime'],
  prezime: ['prezime'],
  razrednik: ['razrednik', 'razrednica', 'razrednik/ca'],
};

/** "Petar Petrović" → { ime: "Petar", prezime: "Petrović" } (prvo ime, ostalo prezime) */
export function podijeliIme(puno: string): { ime: string; prezime: string } {
  const d = (puno || '').trim().split(/\s+/).filter(Boolean);
  if (d.length === 0) return { ime: '', prezime: '' };
  return { ime: d[0], prezime: d.slice(1).join(' ') };
}

type PostojeciUcenik = Pick<Ucenik, 'sifra' | 'razred'> & Partial<Pick<Ucenik, 'ime' | 'prezime'>>;

export function pregledajUvoz(tabela: (string | number | null | undefined)[][], postojeci: PostojeciUcenik[]): PregledUvoza {
  const celije = tabela.map((r) => r.map((c) => (c == null ? '' : String(c).trim())));
  // zadane kolone bez zaglavlja: šifra, razred, ime i prezime, razrednik
  const kol: Record<string, number> = { sifra: 0, razred: 1, imePrezime: 2, ime: -1, prezime: -1, razrednik: 3 };
  let start = 0;
  if (celije.length) {
    const z = celije[0].map(norm);
    const nadji = (k: string) => z.findIndex((c) => ZAGLAVLJA[k].includes(c));
    const iS = nadji('sifra'), iR = nadji('razred');
    if (iS >= 0 || iR >= 0) {
      start = 1;
      kol.sifra = iS >= 0 ? iS : (iR === 0 ? 1 : 0);
      kol.razred = iR >= 0 ? iR : (kol.sifra === 0 ? 1 : 0);
      kol.imePrezime = nadji('imePrezime');
      kol.ime = nadji('ime');
      kol.prezime = nadji('prezime');
      kol.razrednik = nadji('razrednik');
    }
  }
  const uzmi = (r: string[], i: number) => (i >= 0 ? r[i] ?? '' : '');

  const poSifri = new Map(postojeci.map((u) => [u.sifra, u]));
  const uFajlu = new Set<string>();
  const redovi: RedUvoza[] = [];
  const razrednici: Record<string, string> = {};

  for (let i = start; i < celije.length; i++) {
    const r = celije[i];
    const sirovo = uzmi(r, kol.sifra);
    const razred = normalizujRazred(uzmi(r, kol.razred));
    let { ime, prezime } = podijeliIme(uzmi(r, kol.imePrezime));
    if (kol.ime >= 0) ime = uzmi(r, kol.ime);
    if (kol.prezime >= 0) prezime = uzmi(r, kol.prezime);
    const razrednik = uzmi(r, kol.razrednik);
    if (!sirovo && !razred) continue;
    const sifra = ocistiSifru(sirovo);
    const red: RedUvoza = { red: i + 1, sifra: sifra || sirovo, razred, ime, prezime, razrednik, stanje: 'novi' };
    if (!sirovo) {
      red.stanje = 'greska'; red.poruka = 'Nedostaje šifra';
    } else if (liciNaIme(sirovo) && !jeIspravnaSifra(sirovo.toUpperCase())) {
      red.stanje = 'greska'; red.poruka = 'U koloni šifre je ime – stavi ime u svoju kolonu';
    } else if (!jeIspravnaSifra(sifra) || sifra !== sirovo.toUpperCase()) {
      red.stanje = 'greska'; red.poruka = 'Nedozvoljeni znakovi u šifri';
    } else if (uFajlu.has(sifra)) {
      red.stanje = 'greska'; red.poruka = 'Šifra se ponavlja u popisu';
    } else {
      uFajlu.add(sifra);
      if (razred && razrednik) razrednici[razred] = razrednik;
      const p = poSifri.get(sifra);
      if (p) {
        const promjene: string[] = [];
        if (razred && p.razred !== razred) promjene.push(`razred ${p.razred || '–'} → ${razred}`);
        if ((ime || prezime) && (p.ime ?? '') + ' ' + (p.prezime ?? '') !== ime + ' ' + prezime) promjene.push('ime');
        red.stanje = promjene.length ? 'azuriran' : 'isti';
        if (promjene.length) red.poruka = promjene.join(', ');
      }
    }
    redovi.push(red);
  }
  return {
    redovi,
    novi: redovi.filter((r) => r.stanje === 'novi').length,
    azurirani: redovi.filter((r) => r.stanje === 'azuriran').length,
    isti: redovi.filter((r) => r.stanje === 'isti').length,
    greske: redovi.filter((r) => r.stanje === 'greska').length,
    razrednici,
  };
}
