import { MJESECI, nazivSkolskeGodine } from './datum';
import { zadnjiRazgovorPoUceniku } from './zakazano';
import type { Aktivnost, Radionica, Razgovor, Saradnja, Ucenik } from '../types';

export type Period = 'godina' | 'I' | 'II';

export const NAZIV_PERIODA: Record<Period, string> = {
  godina: 'školska godina',
  I: 'I polugodište',
  II: 'II polugodište',
};

export interface MjesecSG {
  kljuc: string; // "2026-09"
  godina: number;
  mjesec: number; // 1–12
  naziv: string; // "septembar"
  polugodiste: 'I' | 'II' | null; // jul i august ne pripadaju polugodištima
}

/** Septembar → august za školsku godinu koja počinje u `pocetak`. */
export function mjeseciSkolskeGodine(pocetak: number): MjesecSG[] {
  const out: MjesecSG[] = [];
  for (let i = 0; i < 12; i++) {
    const m0 = (8 + i) % 12; // 8 = septembar (0-indeks)
    const godina = m0 >= 8 ? pocetak : pocetak + 1;
    const mjesec = m0 + 1;
    out.push({
      kljuc: `${godina}-${String(mjesec).padStart(2, '0')}`,
      godina,
      mjesec,
      naziv: MJESECI[m0],
      polugodiste: mjesec >= 9 ? 'I' : mjesec <= 6 ? 'II' : null,
    });
  }
  return out;
}

export interface Granice {
  od: string;
  do: string; // uključivo
}

export function granicePerioda(pocetak: number, period: Period): Granice {
  if (period === 'I') return { od: `${pocetak}-09-01`, do: `${pocetak}-12-31` };
  if (period === 'II') return { od: `${pocetak + 1}-01-01`, do: `${pocetak + 1}-06-30` };
  return { od: `${pocetak}-09-01`, do: `${pocetak + 1}-08-31` };
}

export const uPeriodu = (datum: string, g: Granice) => !!datum && datum >= g.od && datum <= g.do;

export interface RedMjeseca {
  kljuc: string;
  naziv: string;
  razgovori: number;
  radionice: number;
  ucesnici: number;
  saradnja: number;
  aktivnosti: number;
}

export interface Zbir extends Omit<RedMjeseca, 'kljuc'> {}

export interface Ulaz {
  ucenici: Ucenik[];
  razgovori: Razgovor[];
  radionice: Radionica[];
  saradnja: Saradnja[];
  aktivnosti?: Aktivnost[];
}

export interface Raspodjela {
  naziv: string;
  broj: number;
}

export interface Statistika {
  pocetak: number;
  nazivGodine: string;
  period: Period;
  mjeseci: RedMjeseca[];
  polugodisteI: Zbir;
  polugodisteII: Zbir;
  ukupno: Zbir;
  poRazlogu: Raspodjela[];
  poVrstiKontakta: Raspodjela[];
  statusSlucajeva: Raspodjela[];
  radionicePoOblasti: Raspodjela[];
  saradnjaPoUstanovi: Raspodjela[];
  aktivnostiPoVrsti: Raspodjela[];
  razlicitihUcenika: number;
  ucenikaURazgovorima: number;
  uPracenju: number;
  ukupnoUcenika: number;
  aktivnihUcenika: number;
}

function zbroji(redovi: RedMjeseca[], naziv: string): Zbir {
  return redovi.reduce<Zbir>(
    (s, r) => ({
      naziv,
      razgovori: s.razgovori + r.razgovori,
      radionice: s.radionice + r.radionice,
      ucesnici: s.ucesnici + r.ucesnici,
      saradnja: s.saradnja + r.saradnja,
      aktivnosti: s.aktivnosti + r.aktivnosti,
    }),
    { naziv, razgovori: 0, radionice: 0, ucesnici: 0, saradnja: 0, aktivnosti: 0 },
  );
}

function prebroji(vrijednosti: string[]): Raspodjela[] {
  const m = new Map<string, number>();
  for (const v of vrijednosti) {
    const k = v?.trim() || 'Nije navedeno';
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].map(([naziv, broj]) => ({ naziv, broj })).sort((a, b) => b.broj - a.broj || a.naziv.localeCompare(b.naziv, 'bs'));
}

/**
 * Statistika za školsku godinu. Mjesečna tabela uvijek pokazuje cijelu godinu (sep–aug),
 * a raspodjele i brojevi se računaju za izabrani period (godina / I / II polugodište).
 */
export function izracunajStatistiku(ulaz: Ulaz, pocetak: number, period: Period = 'godina'): Statistika {
  const mjeseci = mjeseciSkolskeGodine(pocetak);
  const redovi: RedMjeseca[] = mjeseci.map((m) => ({ kljuc: m.kljuc, naziv: m.naziv, razgovori: 0, radionice: 0, ucesnici: 0, saradnja: 0, aktivnosti: 0 }));
  const indeks = new Map(redovi.map((r) => [r.kljuc, r]));

  for (const r of ulaz.razgovori) {
    const red = indeks.get(r.datum?.slice(0, 7));
    if (red) red.razgovori++;
  }
  for (const r of ulaz.radionice) {
    const red = indeks.get(r.datum?.slice(0, 7));
    if (red) {
      red.radionice++;
      red.ucesnici += Number(r.brojUcesnika) || 0;
    }
  }
  for (const s of ulaz.saradnja) {
    const red = indeks.get(s.datum?.slice(0, 7));
    if (red) red.saradnja++;
  }

  for (const a of ulaz.aktivnosti ?? []) {
    const red = indeks.get(a.datum?.slice(0, 7));
    if (red) red.aktivnosti++;
  }

  const redI = redovi.filter((_, i) => mjeseci[i].polugodiste === 'I');
  const redII = redovi.filter((_, i) => mjeseci[i].polugodiste === 'II');

  const g = granicePerioda(pocetak, period);
  const razg = ulaz.razgovori.filter((r) => uPeriodu(r.datum, g));
  const rad = ulaz.radionice.filter((r) => uPeriodu(r.datum, g));
  const sar = ulaz.saradnja.filter((s) => uPeriodu(s.datum, g));
  const akt = (ulaz.aktivnosti ?? []).filter((a) => uPeriodu(a.datum, g));

  // Status slučajeva: po učeniku, status iz zadnjeg razgovora u periodu.
  const zadnji = zadnjiRazgovorPoUceniku(razg);

  const sifreRazgovora = new Set(razg.map((r) => r.sifra));
  const sveSifre = new Set<string>(sifreRazgovora);
  for (const s of sar) if (s.sifra) sveSifre.add(s.sifra);
  for (const r of rad) for (const s of r.ucenicizaPracenje ?? []) sveSifre.add(s);

  return {
    pocetak,
    nazivGodine: nazivSkolskeGodine(pocetak),
    period,
    mjeseci: redovi,
    polugodisteI: zbroji(redI, 'I polugodište'),
    polugodisteII: zbroji(redII, 'II polugodište'),
    ukupno: zbroji(redovi, 'Ukupno'),
    poRazlogu: prebroji(razg.map((r) => r.razlog)),
    poVrstiKontakta: prebroji(razg.map((r) => r.vrstaKontakta)),
    statusSlucajeva: prebroji([...zadnji.values()].map((r) => r.statusSlucaja)),
    radionicePoOblasti: prebroji(rad.map((r) => r.oblast)),
    saradnjaPoUstanovi: prebroji(sar.map((s) => s.ustanovaOsoba)),
    aktivnostiPoVrsti: prebroji(akt.map((a) => a.vrsta)),
    razlicitihUcenika: sveSifre.size,
    ucenikaURazgovorima: sifreRazgovora.size,
    uPracenju: ulaz.ucenici.filter((u) => u.uPracenju).length,
    ukupnoUcenika: ulaz.ucenici.length,
    aktivnihUcenika: ulaz.ucenici.filter((u) => u.status === 'Aktivan').length,
  };
}

function oblik(n: number, jedan: string, dva: string, pet: string): string {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return jedan;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return dva;
  return pet;
}

/** Oblik glagola: 1 → "obavljen je", 2–4 → "obavljena su", ostalo → "obavljeno je" (npr. "obavljeno je 64 razgovora"). */
function glagol(n: number, jedan: string, dva: string, pet: string): string {
  if (n % 10 === 1 && n % 100 !== 11) return jedan;
  if (n >= 2 && n <= 4) return dva;
  return pet;
}

/** Kratak automatski tekstualni sažetak za izvještaj. */
export function sazetak(s: Statistika): string {
  const z = s.period === 'I' ? s.polugodisteI : s.period === 'II' ? s.polugodisteII : s.ukupno;
  const kada = s.period === 'I' ? `U I polugodištu školske ${s.nazivGodine}. godine` : s.period === 'II' ? `U II polugodištu školske ${s.nazivGodine}. godine` : `U školskoj ${s.nazivGodine}. godini`;
  const dijelovi: string[] = [];
  dijelovi.push(
    `${kada} ${glagol(z.razgovori, 'obavljen je', 'obavljena su', 'obavljeno je')} ${z.razgovori} ${oblik(z.razgovori, 'razgovor', 'razgovora', 'razgovora')} s ${s.ucenikaURazgovorima} ${oblik(s.ucenikaURazgovorima, 'učenikom', 'učenika', 'učenika')}` + '.',
  );
  if (z.radionice) {
    dijelovi.push(
      `${glagol(z.radionice, 'Održana je', 'Održane su', 'Održano je')} ${z.radionice} ${oblik(z.radionice, 'radionica', 'radionice', 'radionica')} s ukupno ${z.ucesnici} ${oblik(z.ucesnici, 'učesnikom', 'učesnika', 'učesnika')}.`,
    );
  } else dijelovi.push('Nije evidentirana nijedna radionica.');
  if (z.saradnja) {
    dijelovi.push(`${glagol(z.saradnja, 'Ostvaren je', 'Ostvarena su', 'Ostvareno je')} ${z.saradnja} ${oblik(z.saradnja, 'kontakt', 'kontakta', 'kontakata')} saradnje s roditeljima, nastavnicima i ustanovama.`);
  }
  if (z.aktivnosti) {
    const vrste = s.aktivnostiPoVrsti.map((a) => `${a.naziv.toLowerCase()} (${a.broj})`);
    dijelovi.push(`Pored toga, ${glagol(z.aktivnosti, 'evidentirana je', 'evidentirane su', 'evidentirano je')} ${z.aktivnosti} ${oblik(z.aktivnosti, 'ostala aktivnost', 'ostale aktivnosti', 'ostalih aktivnosti')}: ${vrste.join(', ')}.`);
  }
  if (s.poRazlogu.length && z.razgovori) {
    const top = s.poRazlogu.slice(0, 3).map((r) => `${r.naziv.toLowerCase()} (${r.broj})`);
    dijelovi.push(`Najčešći razlozi razgovora bili su: ${top.join(', ')}.`);
  }
  if (s.radionicePoOblasti.length && z.radionice) {
    dijelovi.push(`Radionice su najviše bile iz oblasti: ${s.radionicePoOblasti.slice(0, 2).map((r) => r.naziv.toLowerCase()).join(' i ')}.`);
  }
  dijelovi.push(`Trenutno je u praćenju ${s.uPracenju} ${oblik(s.uPracenju, 'učenik', 'učenika', 'učenika')}.`);
  return dijelovi.join(' ');
}
