// Datumi se interno čuvaju kao "YYYY-MM-DD" (lokalni kalendarski datum, bez vremenske zone).
// Prikaz je uvijek DD.MM.YYYY. Sedmica počinje ponedjeljkom.

export const MJESECI = [
  'januar', 'februar', 'mart', 'april', 'maj', 'juni',
  'juli', 'august', 'septembar', 'oktobar', 'novembar', 'decembar',
];

const pad = (n: number) => String(n).padStart(2, '0');

export function uIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function danasIso(): string {
  return uIso(new Date());
}

export function izIso(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.getMonth() === Number(m[2]) - 1 ? d : null;
}

/** "2026-11-19" → "19.11.2026" */
export function prikaz(iso: string | undefined | null): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
}

/** ISO vrijeme → "19.11.2026 14:05" */
export function prikazVremena(isoVrijeme: string): string {
  const d = new Date(isoVrijeme);
  if (isNaN(d.getTime())) return '';
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "19.11.2026" ili "19.11.26" ili "19/11/2026" → "2026-11-19"; nevažeće → null */
export function parsirajPrikaz(tekst: string): string | null {
  const m = /^\s*(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2}|\d{4})\.?\s*$/.exec(tekst || '');
  if (!m) return null;
  let god = Number(m[3]);
  if (god < 100) god += 2000;
  const d = new Date(god, Number(m[2]) - 1, Number(m[1]));
  if (d.getFullYear() !== god || d.getMonth() !== Number(m[2]) - 1 || d.getDate() !== Number(m[1])) return null;
  return uIso(d);
}

export function dodajDane(iso: string, dana: number): string {
  const d = izIso(iso) ?? new Date();
  d.setDate(d.getDate() + dana);
  return uIso(d);
}

/** Razlika u danima (b - a), po kalendarskim datumima. */
export function razlikaDana(aIso: string, bIso: string): number {
  const a = izIso(aIso), b = izIso(bIso);
  if (!a || !b) return 0;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / 86400000);
}

/** Školska godina počinje 1. septembra: novembar 2026 → 2026, mart 2027 → 2026. */
export function skolskaGodinaZaDatum(d: Date): number {
  return d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
}

export function skolskaGodinaZaIso(iso: string): number | null {
  const d = izIso(iso);
  return d ? skolskaGodinaZaDatum(d) : null;
}

export function nazivSkolskeGodine(pocetak: number): string {
  return `${pocetak}/${pocetak + 1}`;
}

/** Ponedjeljak sedmice u kojoj je dati datum. */
export function pocetakSedmice(iso: string): string {
  const d = izIso(iso) ?? new Date();
  const dan = (d.getDay() + 6) % 7; // pon=0 … ned=6
  d.setDate(d.getDate() - dan);
  return uIso(d);
}

/** "2026-11" za dati ISO datum */
export function mjesecKljuc(iso: string): string {
  return (iso || '').slice(0, 7);
}

export function nazivMjeseca(kljuc: string): string {
  const [g, m] = kljuc.split('-').map(Number);
  return `${MJESECI[m - 1] ?? ''} ${g}.`;
}
