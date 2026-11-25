// Jutarnji brifing: šta je danas važno, šta kasni, šta je obećano, kako stoji 40-satna sedmica
// i koji učenici se često pojavljuju u zapisima, a nisu u praćenju (rani znakovi).
// Sve se računa lokalno; AI dobija samo ovaj sažetak (šifre, bez imena i bez sadržaja razgovora).

import { ZAVRSENI_STATUSI } from '../db/defaults';
import { dodajDane, prikaz, razlikaDana } from './datum';
import { evidencijaPoPodrucjima, PODRUCJA, stavkeDnevnika, type UlazDnevnika } from './podrucja';
import { izracunajZakazano, tekstOznake, zadnjiRazgovorPoUceniku, type Zakazano } from './zakazano';
import type { StanjeStavke } from './dokumentacija';
import type { BrzaBiljeska, Razgovor, Ucenik } from '../types';

export interface Signal { sifra: string; razred: string; razlog: string; tezina: number }
export interface Korak { sifra: string; tekst: string; datum: string }
export interface StanjePodrucja { kod: number; naziv: string; ostvareno: number; ocekivano: number }

export interface Brifing {
  kontakti: Zakazano[]; // kasni + danas + narednih 7 dana
  obaveze: StanjeStavke[]; // kasni ili rok za ≤ 7 dana
  koraci: Korak[]; // dogovoreni sljedeći koraci (otvoreni slučajevi)
  neobradjene: number;
  signali: Signal[];
  sati: { ostvareno: number; ocekivano: number; bezEvidencije: StanjePodrucja[] } | null;
}

/** Riječi koje traže pažnju psihologa (zaštita djeteta i rizična ponašanja). */
export const RIZICNE_RIJECI: [RegExp, string][] = [
  [/nasilj|tuč|tukl|udari|udara|šamar|prijeti|prijetnj|maltretir|zlostavlj|ismijava|vrijeđa/i, 'nasilje'],
  [/samopovr|reže se|rezanje|suicid|samoubist|ne želi živjeti/i, 'samopovređivanje'],
  [/fotografij|sliku?e? (?:cur|djevojč|učenic)|sporn\w* slik|gol\w* slik|intimn/i, 'sporne fotografije'],
  [/drog|alkohol|cigaret|vejp|vape|tablet/i, 'supstance'],
  [/modric|gladan|gladna|zanemar|bez nadzora|bježi od kuće|pobjeg/i, 'zanemarivanje'],
  [/plač|plače|povuč|tužn|anksioz|napad panike|ne spava/i, 'emocionalne teškoće'],
];

function tekstZapisa(z: { biljeske?: string; zakljucak?: string; tekst?: string; sroceno?: string }): string {
  return [z.biljeske, z.zakljucak, z.tekst, z.sroceno].filter(Boolean).join(' ');
}

/** Učenici koji se u zadnjih 30 dana često ili zabrinjavajuće pojavljuju, a nisu u praćenju. */
export function raniZnakovi(danas: string, razgovori: Razgovor[], biljeske: BrzaBiljeska[], ucenici: Ucenik[]): Signal[] {
  const od = dodajDane(danas, -30);
  const poSifri = new Map(ucenici.map((u) => [u.sifra, u]));
  const zapisi = new Map<string, string[]>();
  const dodaj = (sifra: string, t: string) => { if (!sifra) return; zapisi.set(sifra, [...(zapisi.get(sifra) ?? []), t]); };
  for (const r of razgovori) if (r.datum >= od && r.datum <= danas) dodaj(r.sifra, tekstZapisa(r));
  for (const b of biljeske) if (b.datum >= od && b.datum <= danas) dodaj(b.sifra, tekstZapisa(b));
  const out: Signal[] = [];
  for (const [sifra, tekstovi] of zapisi) {
    const u = poSifri.get(sifra);
    if (u?.uPracenju) continue;
    const zadnji = zadnjiRazgovorPoUceniku(razgovori.filter((r) => r.sifra === sifra)).get(sifra);
    if (zadnji && ['U praćenju', 'Upućen dalje'].includes(zadnji.statusSlucaja)) continue;
    const rijeci = [...new Set(RIZICNE_RIJECI.filter(([re]) => tekstovi.some((t) => re.test(t))).map(([, n]) => n))];
    const tezina = rijeci.filter((r) => r !== 'emocionalne teškoće').length * 3 + rijeci.length + (tekstovi.length >= 2 ? tekstovi.length : 0);
    if (!rijeci.length && tekstovi.length < 3) continue;
    const razlog = [rijeci.length ? rijeci.join(', ') : '', tekstovi.length >= 2 ? `${tekstovi.length} zapisa u 30 dana` : ''].filter(Boolean).join(' · ');
    out.push({ sifra, razred: u?.razred ?? '', razlog, tezina });
  }
  return out.sort((a, b) => b.tezina - a.tezina).slice(0, 5);
}

/** Radni dani (pon–pet) od a do b uključivo. */
function radnihDana(a: string, b: string): number {
  let n = 0;
  for (let d = a; d <= b; d = dodajDane(d, 1)) {
    const w = new Date(`${d}T12:00:00`).getDay();
    if (w !== 0 && w !== 6) n++;
  }
  return n;
}

/** Koliko je sati evidentirano ovaj mjesec u odnosu na normu do danas; područja bez ijednog unosa. */
export function stanjeSati(danas: string, ulaz: UlazDnevnika, pocetakRada = ''): Brifing['sati'] {
  const mjesec = danas.slice(0, 7);
  const od = [`${mjesec}-01`, pocetakRada].filter(Boolean).sort().pop()!;
  if (od > danas) return null;
  const dana = radnihDana(od, danas);
  if (dana < 5) return null; // prerano za ocjenu
  const ev = evidencijaPoPodrucjima(stavkeDnevnika(ulaz, od, danas), dana / 5);
  const ostvareno = Math.round(ev.reduce((s, r) => s + r.ostvareno, 0));
  const ocekivano = Math.round(ev.reduce((s, r) => s + r.norma, 0));
  const bezEvidencije = ev
    .filter((r) => r.kod && r.ostvareno === 0 && r.norma >= 1)
    .sort((a, b) => b.norma - a.norma)
    .map((r) => ({ kod: r.kod, naziv: PODRUCJA.find((p) => p.kod === r.kod)?.naziv ?? r.naziv, ostvareno: 0, ocekivano: Math.round(r.norma) }));
  return { ostvareno, ocekivano, bezEvidencije };
}

export function napraviBrifing(p: {
  danas: string; razgovori: Razgovor[]; biljeske: BrzaBiljeska[]; ucenici: Ucenik[]; ulaz: UlazDnevnika; obaveze: StanjeStavke[]; pocetakRada?: string;
}): Brifing {
  const kontakti = izracunajZakazano(p.razgovori, p.danas).filter((z) => z.dana <= 7);
  const obaveze = p.obaveze.filter((s) => !s.gotovo && (s.kasni || s.danaDoRoka <= 7)).sort((a, b) => a.rok.localeCompare(b.rok));
  const zakazaniUcenici = new Set(kontakti.map((k) => k.sifra));
  const koraci: Korak[] = [...zadnjiRazgovorPoUceniku(p.razgovori).values()]
    .filter((r) => r.sljedeciKorak?.trim() && !ZAVRSENI_STATUSI.includes(r.statusSlucaja) && !zakazaniUcenici.has(r.sifra) && razlikaDana(r.datum, p.danas) <= 45)
    .sort((a, b) => b.datum.localeCompare(a.datum))
    .slice(0, 4)
    .map((r) => ({ sifra: r.sifra, tekst: r.sljedeciKorak.trim(), datum: r.datum }));
  return {
    kontakti, obaveze, koraci,
    neobradjene: p.biljeske.filter((b) => !b.obradjena).length,
    signali: raniZnakovi(p.danas, p.razgovori, p.biljeske, p.ucenici),
    sati: stanjeSati(p.danas, p.ulaz, p.pocetakRada),
  };
}

/** Sažetak za AI (šifre i brojevi, bez imena i bez sadržaja razgovora). */
export function brifingZaAI(b: Brifing, danas: string): string {
  return [
    `Danas: ${prikaz(danas)}.`,
    b.kontakti.length ? `Zakazani kontakti: ${b.kontakti.map((k) => `${k.sifra} (${k.razred}, ${tekstOznake(k)})`).join('; ')}.` : 'Nema zakazanih kontakata u narednih 7 dana.',
    b.obaveze.length ? `Rokovi: ${b.obaveze.map((o) => `${o.def.naziv} – ${o.kasni ? 'KASNI' : `rok ${prikaz(o.rok)}`}`).join('; ')}.` : 'Nema rokova u narednih 7 dana.',
    b.koraci.length ? `Dogovoreni sljedeći koraci: ${b.koraci.map((k) => `${k.sifra}: ${k.tekst}`).join('; ')}.` : '',
    b.neobradjene ? `Neobrađenih bilješki: ${b.neobradjene}.` : '',
    b.signali.length ? `Učenici koji se često ili zabrinjavajuće pojavljuju u zapisima, a nisu u praćenju: ${b.signali.map((s) => `${s.sifra} (${s.razlog})`).join('; ')}.` : '',
    b.sati ? `40-satna sedmica ovaj mjesec: evidentirano ${b.sati.ostvareno} h od očekivanih ≈ ${b.sati.ocekivano} h${b.sati.bezEvidencije.length ? `; bez evidencije: ${b.sati.bezEvidencije.map((x) => `${x.kod}. ${x.naziv}`).join(', ')}` : ''}.` : '',
  ].filter(Boolean).join('\n');
}
