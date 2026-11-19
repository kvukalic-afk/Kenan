// Šifra učenika: samo slova (A–Z), brojevi, "-" i "_", najviše 20 znakova.
// Šifre se automatski pišu velikim slovima (u014 → U014) da ne nastanu duplikati.

export const MAX_DUZINA_SIFRE = 20;
const DOZVOLJENO = /^[A-Z0-9_-]{1,20}$/;

export function ocistiSifru(unos: string): string {
  return (unos || '')
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, MAX_DUZINA_SIFRE);
}

export function jeIspravnaSifra(sifra: string): boolean {
  return DOZVOLJENO.test(sifra || '');
}

/**
 * Da li unos liči na ime i prezime umjesto šifre.
 * Upozorenje (ne blokada) ako:
 *  - unos sadrži razmak ili naša slova (č, ć, ž, š, đ) ili druge nedozvoljene znakove,
 *  - ili je duži od 3 znaka, a sastoji se samo od slova (šifre obično imaju broj, npr. U014).
 */
export function liciNaIme(unos: string): boolean {
  const t = (unos || '').trim();
  if (!t) return false;
  if (/\s/.test(t)) return true;
  if (/[čćžšđČĆŽŠĐ]/.test(t)) return true;
  if (/[^A-Za-z0-9_-]/.test(t)) return true;
  if (t.length > 3 && /^[A-Za-z]+$/.test(t)) return true;
  return false;
}

export const PORUKA_IME = 'Upiši šifru, ne ime';

/** Prirodno poređenje šifri: U2 < U10 */
export function uporediSifre(a: string, b: string): number {
  return a.localeCompare(b, 'bs', { numeric: true, sensitivity: 'base' });
}

/** Razred u obliku "6-2"; prihvata i "6/2", "6.2", "VI-2", "6 2". */
export function normalizujRazred(unos: string): string {
  const t = (unos || '').trim();
  const rimski: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9 };
  const m = /^([IVX]+|\d{1,2})\s*[-/.\s]\s*(\d{1,2})$/i.exec(t);
  if (!m) return t;
  const r = /^\d+$/.test(m[1]) ? Number(m[1]) : rimski[m[1].toUpperCase()];
  return r ? `${r}-${Number(m[2])}` : t;
}
