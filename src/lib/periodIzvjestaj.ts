// Izvještaj za period (dnevni, sedmični, mjesečni ili proizvoljni) i tekst za AI.
//
// Tekst za AI je namjerno anoniman: učenici su samo šifre i razred, bez imena,
// bez imena nastavnika i bez opisa osoba. Bilješke se dodaju samo ako se izričito
// izabere, i tada se poznata imena učenika zamjenjuju šiframa.

import { dodajDane, pocetakSedmice, prikaz, razlikaDana, MJESECI } from './datum';
import type { Aktivnost, Radionica, Razgovor, Saradnja, Ucenik } from '../types';

export interface UlazPerioda {
  ucenici: Ucenik[];
  razgovori: Razgovor[];
  radionice: Radionica[];
  saradnja: Saradnja[];
  aktivnosti: Aktivnost[];
}

export type VrstaStavke = 'razgovor' | 'radionica' | 'saradnja' | 'aktivnost';

export interface StavkaPerioda {
  id: string;
  vrsta: VrstaStavke;
  datum: string;
  createdAt: string;
  naslov: string; // npr. "Individualni razgovor s učenikom"
  ucenik: string; // šifra (ili '')
  detalji: string[]; // kratki opisni dijelovi (bez imena)
  tekst: string; // duži tekst (bilješke, tok…) – samo za print/AI na zahtjev
  umjesto?: string; // koga je psiholog mijenjao – samo za print, nikad za AI
}

export const NAZIV_STAVKE: Record<VrstaStavke, string> = {
  razgovor: 'Razgovor',
  radionica: 'Radionica',
  saradnja: 'Saradnja',
  aktivnost: 'Ostala aktivnost',
};

const u = (d: string, od: string, do_: string) => !!d && d >= od && d <= do_;

export function stavkePerioda(ulaz: UlazPerioda, od: string, do_: string): StavkaPerioda[] {
  const out: StavkaPerioda[] = [];
  for (const r of ulaz.razgovori) if (u(r.datum, od, do_)) out.push({
    id: r.id, vrsta: 'razgovor', datum: r.datum, createdAt: r.createdAt,
    naslov: r.vrstaKontakta || 'Razgovor', ucenik: r.sifra,
    detalji: [r.razred && `razred ${r.razred}`, r.razlog && `razlog: ${r.razlog}`, r.statusSlucaja && `status: ${r.statusSlucaja}`].filter(Boolean) as string[],
    tekst: [r.biljeske, r.zakljucak && `Zaključak: ${r.zakljucak}`, r.preporuke && `Preporuke: ${r.preporuke}`].filter(Boolean).join('\n'),
  });
  for (const r of ulaz.radionice) if (u(r.datum, od, do_)) out.push({
    id: r.id, vrsta: 'radionica', datum: r.datum, createdAt: r.createdAt,
    naslov: `Radionica: ${r.tema || 'bez teme'}`, ucenik: '',
    detalji: [r.razred && `razred ${r.razred}`, r.oblast, r.ciljnaGrupa && `ciljna grupa: ${r.ciljnaGrupa.toLowerCase()}`, r.brojUcesnika != null && `${r.brojUcesnika} učesnika`].filter(Boolean) as string[],
    tekst: [r.cilj && `Cilj: ${r.cilj}`, r.zapazanja && `Zapažanja: ${r.zapazanja}`, r.evaluacija && `Evaluacija: ${r.evaluacija}`].filter(Boolean).join('\n'),
  });
  for (const s of ulaz.saradnja) if (u(s.datum, od, do_)) out.push({
    id: s.id, vrsta: 'saradnja', datum: s.datum, createdAt: s.createdAt,
    naslov: `Saradnja: ${s.ustanovaOsoba || 'kontakt'}`, ucenik: s.sifra,
    detalji: [s.nacin && `način: ${s.nacin.toLowerCase()}`, s.razlog && `razlog: ${s.razlog}`].filter(Boolean) as string[],
    tekst: s.dogovorIshod ? `Dogovor/ishod: ${s.dogovorIshod}` : '',
  });
  for (const a of ulaz.aktivnosti) if (u(a.datum, od, do_)) out.push({
    id: a.id, vrsta: 'aktivnost', datum: a.datum, createdAt: a.createdAt,
    naslov: a.vrsta || 'Aktivnost', ucenik: '',
    detalji: [a.razred && `razred ${a.razred}`, a.cas && `${a.cas}. čas`, a.predmet !== a.vrsta && a.predmet, a.tema && `tema: ${a.tema}`].filter(Boolean) as string[],
    tekst: [a.zapazanja && `Zapažanja: ${a.zapazanja}`, a.napomena && `Napomena: ${a.napomena}`].filter(Boolean).join('\n'),
    umjesto: a.umjestoKoga,
  });
  return out.sort((a, b) => a.datum.localeCompare(b.datum) || a.createdAt.localeCompare(b.createdAt));
}

export interface BrojePerioda {
  razgovori: number;
  ucenika: number;
  radionice: number;
  ucesnici: number;
  saradnja: number;
  aktivnosti: number;
  zamjene: number;
  casoviOZ: number;
}

export function brojPerioda(ulaz: UlazPerioda, od: string, do_: string): BrojePerioda {
  const razg = ulaz.razgovori.filter((r) => u(r.datum, od, do_));
  const rad = ulaz.radionice.filter((r) => u(r.datum, od, do_));
  const akt = ulaz.aktivnosti.filter((a) => u(a.datum, od, do_));
  return {
    razgovori: razg.length,
    ucenika: new Set(razg.map((r) => r.sifra)).size,
    radionice: rad.length,
    ucesnici: rad.reduce((s, r) => s + (Number(r.brojUcesnika) || 0), 0),
    saradnja: ulaz.saradnja.filter((s) => u(s.datum, od, do_)).length,
    aktivnosti: akt.length,
    zamjene: akt.filter((a) => /zamjena/i.test(a.vrsta)).length,
    casoviOZ: akt.filter((a) => /odjeljensk/i.test(a.vrsta)).length,
  };
}

// ---------- Periodi ----------

export type VrstaPerioda = 'dan' | 'sedmica' | 'mjesec' | 'period';

export function vrstaPerioda(od: string, do_: string): VrstaPerioda {
  if (od === do_) return 'dan';
  if (pocetakSedmice(od) === od && razlikaDana(od, do_) === 6) return 'sedmica';
  if (od.endsWith('-01') && od.slice(0, 7) === do_.slice(0, 7) && dodajDane(do_, 1).endsWith('-01')) return 'mjesec';
  return 'period';
}

export function naslovIzvjestaja(od: string, do_: string): string {
  const v = vrstaPerioda(od, do_);
  if (v === 'dan') return 'DNEVNI IZVJEŠTAJ O RADU PSIHOLOGA';
  if (v === 'sedmica') return 'SEDMIČNI IZVJEŠTAJ O RADU PSIHOLOGA';
  if (v === 'mjesec') return 'MJESEČNI IZVJEŠTAJ O RADU PSIHOLOGA';
  return 'IZVJEŠTAJ O RADU PSIHOLOGA';
}

export function opisPerioda(od: string, do_: string): string {
  const v = vrstaPerioda(od, do_);
  if (v === 'dan') return `${nazivDana(od)}, ${prikaz(od)}.`;
  if (v === 'mjesec') return `${MJESECI[Number(od.slice(5, 7)) - 1]} ${od.slice(0, 4)}.`;
  return `od ${prikaz(od)}. do ${prikaz(do_)}.`;
}

const DANI = ['nedjelja', 'ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota'];
export function nazivDana(iso: string): string {
  const [g, m, d] = iso.split('-').map(Number);
  const n = DANI[new Date(g, m - 1, d).getDay()];
  return n.charAt(0).toUpperCase() + n.slice(1);
}

// ---------- Automatski sažetak (bez AI) ----------

function oblik(n: number, a: string, b: string, c: string) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return a;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return b;
  return c;
}

export function sazetakPerioda(b: BrojePerioda, od: string, do_: string): string {
  const v = vrstaPerioda(od, do_);
  const kada = v === 'dan' ? 'Tog dana' : v === 'sedmica' ? 'U toku sedmice' : v === 'mjesec' ? 'U toku mjeseca' : 'U navedenom periodu';
  const dijelovi: string[] = [];
  if (b.razgovori) dijelovi.push(`${b.razgovori} ${oblik(b.razgovori, 'razgovor', 'razgovora', 'razgovora')} s ${b.ucenika} ${oblik(b.ucenika, 'učenikom', 'učenika', 'učenika')}`);
  if (b.radionice) dijelovi.push(`${b.radionice} ${oblik(b.radionice, 'radionica', 'radionice', 'radionica')} (${b.ucesnici} ${oblik(b.ucesnici, 'učesnik', 'učesnika', 'učesnika')})`);
  if (b.saradnja) dijelovi.push(`${b.saradnja} ${oblik(b.saradnja, 'kontakt', 'kontakta', 'kontakata')} saradnje`);
  if (b.zamjene) dijelovi.push(`${b.zamjene} ${oblik(b.zamjene, 'zamjena', 'zamjene', 'zamjena')}`);
  if (b.casoviOZ) dijelovi.push(`${b.casoviOZ} ${oblik(b.casoviOZ, 'čas', 'časa', 'časova')} odjeljenske zajednice`);
  const ostale = b.aktivnosti - b.zamjene - b.casoviOZ;
  if (ostale) dijelovi.push(`${ostale} ${oblik(ostale, 'ostala aktivnost', 'ostale aktivnosti', 'ostalih aktivnosti')}`);
  if (!dijelovi.length) return `${kada} nije evidentirana nijedna aktivnost.`;
  const spisak = dijelovi.length === 1 ? dijelovi[0] : `${dijelovi.slice(0, -1).join(', ')} i ${dijelovi[dijelovi.length - 1]}`;
  return `${kada} evidentirano je: ${spisak}.`;
}

// ---------- Tekst za AI ----------

/** Zamjenjuje poznata imena učenika njihovim šiframa (cijelo ime, pa prezime i ime posebno ako su duži od 2 slova). */
export function anonimizuj(tekst: string, ucenici: Pick<Ucenik, 'sifra' | 'ime' | 'prezime'>[]): string {
  let t = tekst;
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // 1) puno ime (bilo kojim redom, bez obzira na velika/mala slova) → šifra
  const puna: [string, string][] = [];
  for (const x of ucenici) {
    const ime = (x.ime ?? '').trim(), prez = (x.prezime ?? '').trim();
    if (ime && prez) puna.push([`${ime} ${prez}`, x.sifra], [`${prez} ${ime}`, x.sifra]);
  }
  puna.sort((a, b) => b[0].length - a[0].length);
  for (const [ime, sifra] of puna) t = t.replace(new RegExp(`(?<!\\p{L})${esc(ime)}(?!\\p{L})`, 'giu'), sifra);
  // 2) samo ime ili samo prezime, napisano velikim početnim slovom → [učenik]
  const pojedinacna = new Set<string>();
  for (const x of ucenici) for (const d of [x.ime, x.prezime]) if (d && d.trim().length > 2) pojedinacna.add(d.trim());
  for (const d of [...pojedinacna].sort((a, b) => b.length - a.length)) {
    t = t.replace(new RegExp(`(?<!\\p{L})${esc(d)}(?!\\p{L})`, 'gu'), '[učenik]');
  }
  return t;
}

export function tekstZaAI(ulaz: UlazPerioda, od: string, do_: string, opcije: { biljeske: boolean; skola?: string }): string {
  const stavke = stavkePerioda(ulaz, od, do_);
  const b = brojPerioda(ulaz, od, do_);
  const v = vrstaPerioda(od, do_);
  const vrstaTeksta = v === 'dan' ? 'dnevni' : v === 'sedmica' ? 'sedmični' : v === 'mjesec' ? 'mjesečni' : '';
  const razred = new Map(ulaz.ucenici.map((x) => [x.sifra, x.razred]));
  const linije = stavke.map((s) => {
    const uc = s.ucenik ? `učenik ${s.ucenik}${razred.get(s.ucenik) && !s.detalji.some((d) => d.startsWith('razred')) ? `, razred ${razred.get(s.ucenik)}` : ''}` : '';
    let l = `- ${prikaz(s.datum)} – ${s.naslov}${[uc, ...s.detalji].filter(Boolean).length ? ` (${[uc, ...s.detalji].filter(Boolean).join('; ')})` : ''}`;
    if (opcije.biljeske && s.tekst.trim()) l += `\n  ${s.tekst.replace(/\n/g, '\n  ')}`;
    return l;
  });
  return anonimizuj([
    `Napiši ${vrstaTeksta ? vrstaTeksta + ' ' : ''}izvještaj o radu školskog psihologa u osnovnoj školi za period ${opisPerioda(od, do_)}`,
    'Piši na bosanskom jeziku (ijekavica), službenim i stručnim stilom, u 2–4 kratka pasusa: šta je urađeno, s kojim ciljem i koji su naredni koraci.',
    'Koristi samo podatke ispod – ništa ne izmišljaj. Učenike navodi samo šiframa (npr. U014), bez imena. Ne dodaji naslov, datum ni potpis.',
    '',
    `Ukupno: ${sazetakPerioda(b, od, do_)}`,
    '',
    'Evidentirane aktivnosti:',
    ...(linije.length ? linije : ['- nema evidentiranih aktivnosti']),
  ].join('\n'), ulaz.ucenici);
}
