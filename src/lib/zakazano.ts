import { ZAVRSENI_STATUSI } from '../db/defaults';
import { razlikaDana } from './datum';
import type { Razgovor } from '../types';

export type OznakaZakazanog = 'kasni' | 'danas' | 'uskoro';

export interface Zakazano {
  sifra: string;
  razred: string;
  datum: string; // datum sljedećeg kontakta
  dana: number; // < 0 kasni, 0 danas, > 0 za X dana
  oznaka: OznakaZakazanog;
  razgovorId: string;
  statusSlucaja: string;
}

/** Noviji razgovor: kasniji datum; kod istog datuma kasnije unesen. */
export function jeNoviji(a: Razgovor, b: Razgovor): boolean {
  if (a.datum !== b.datum) return a.datum > b.datum;
  return a.createdAt > b.createdAt;
}

export function zadnjiRazgovorPoUceniku(razgovori: Razgovor[]): Map<string, Razgovor> {
  const m = new Map<string, Razgovor>();
  for (const r of razgovori) {
    const t = m.get(r.sifra);
    if (!t || jeNoviji(r, t)) m.set(r.sifra, r);
  }
  return m;
}

/**
 * Za svakog učenika uzima se ZADNJI razgovor. Ako ima datum sljedećeg kontakta,
 * a status nije "Zatvoren" niti "Upućen dalje", ulazi u listu (poredano po datumu).
 */
export function izracunajZakazano(razgovori: Razgovor[], danas: string): Zakazano[] {
  const out: Zakazano[] = [];
  for (const r of zadnjiRazgovorPoUceniku(razgovori).values()) {
    if (!r.datumSljedecegKontakta) continue;
    if (ZAVRSENI_STATUSI.includes(r.statusSlucaja)) continue;
    const dana = razlikaDana(danas, r.datumSljedecegKontakta);
    out.push({
      sifra: r.sifra,
      razred: r.razred,
      datum: r.datumSljedecegKontakta,
      dana,
      oznaka: dana < 0 ? 'kasni' : dana === 0 ? 'danas' : 'uskoro',
      razgovorId: r.id,
      statusSlucaja: r.statusSlucaja,
    });
  }
  return out.sort((a, b) => a.datum.localeCompare(b.datum) || a.sifra.localeCompare(b.sifra));
}

export function tekstOznake(z: Pick<Zakazano, 'oznaka' | 'dana'>): string {
  if (z.oznaka === 'kasni') return z.dana === -1 ? 'kasni 1 dan' : `kasni ${-z.dana} ${dani(-z.dana)}`;
  if (z.oznaka === 'danas') return 'danas';
  return z.dana === 1 ? 'sutra' : `za ${z.dana} ${dani(z.dana)}`;
}

function dani(n: number): string {
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? 'dan' : 'dana';
}
