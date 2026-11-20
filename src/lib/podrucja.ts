// Područja rada psihologa i sedmična norma sati prema:
// Pedagoški standardi i normativi za osnovno obrazovanje, Službeni glasnik USK br. 20/2024, član 13. stav (2).

import type { Aktivnost, Radionica, Razgovor, Saradnja } from '../types';

export interface Podrucje {
  kod: number;
  naziv: string;
  sati: number; // sedmično
}

export const PODRUCJA: Podrucje[] = [
  { kod: 1, naziv: 'Koncepcijsko-programski zadaci', sati: 2 },
  { kod: 2, naziv: 'Programiranje, ostvarivanje i analiza odgojno-obrazovnog rada', sati: 2 },
  { kod: 3, naziv: 'Psihološka dokumentacija', sati: 2 },
  { kod: 4, naziv: 'Neposredna saradnja s nastavnicima, stručnim saradnicima, direktorom, pripravnicima i studentima u planiranju i realizovanju odgojno-obrazovnog rada', sati: 5 },
  { kod: 5, naziv: 'Stručni rad sa djecom/učenicima i učeničke organizacije', sati: 10 },
  { kod: 6, naziv: 'Unapređenje odgojno-obrazovnog procesa', sati: 2 },
  { kod: 7, naziv: 'Saradnja sa institucijama', sati: 1 },
  { kod: 8, naziv: 'Saradnja sa roditeljima/starateljima', sati: 2 },
  { kod: 9, naziv: 'Istraživačke analize i praćenja u praksi školskog psihologa', sati: 2 },
  { kod: 10, naziv: 'Stručno usavršavanje', sati: 2 },
  { kod: 11, naziv: 'Pripremanje za rad', sati: 10 },
];

/** 0 = poslovi po nalogu direktora izvan 40-satne sedmice (čl. 13. st. 3), npr. dežurstvo. */
export const OSTALI_POSLOVI: Podrucje = { kod: 0, naziv: 'Drugi poslovi po nalogu direktora', sati: 0 };

export const IZVOR_NORME = 'Pedagoški standardi i normativi za osnovno obrazovanje, Sl. glasnik USK 20/2024, čl. 13.';

export function podrucje(kod: number): Podrucje {
  return PODRUCJA.find((p) => p.kod === kod) ?? OSTALI_POSLOVI;
}

export const kratkiNaziv = (kod: number) => {
  const n = podrucje(kod).naziv;
  return kod === 4 ? 'Neposredna saradnja s nastavnicima, str. saradnicima, direktorom' : n;
};

// ---------- automatsko svrstavanje evidentiranog rada u područja ----------

export function podrucjeRazgovora(r: Pick<Razgovor, 'vrstaKontakta'>): number {
  const v = (r.vrstaKontakta || '').toLowerCase();
  if (v.includes('roditelj')) return 8;
  if (v.includes('razrednik') || v.includes('nastavnik')) return 4;
  return 5;
}

export function podrucjeRadionice(r: Pick<Radionica, 'ciljnaGrupa'>): number {
  const g = (r.ciljnaGrupa || '').toLowerCase();
  if (g.includes('roditelj')) return 8;
  if (g.includes('nastavnik')) return 6;
  return 5;
}

export function podrucjeSaradnje(s: Pick<Saradnja, 'ustanovaOsoba'>): number {
  const u = (s.ustanovaOsoba || '').toLowerCase();
  if (u.includes('roditelj') || u.includes('staratelj')) return 8;
  if (/razrednik|nastavnik|pedagog|direktor/.test(u)) return 4;
  return 7;
}

export function podrucjeAktivnosti(a: Pick<Aktivnost, 'vrsta' | 'podrucje'>): number {
  if (a.podrucje != null && a.podrucje !== undefined && !Number.isNaN(a.podrucje)) return a.podrucje;
  const v = (a.vrsta || '').toLowerCase();
  if (v.includes('zamjena') || v.includes('odjeljensk') || v.includes('testiranj') || v.includes('ispitivanj') || v.includes('spremnost')) return 5;
  if (v.includes('usavršavanj')) return 10;
  if (v.includes('sjednic') || v.includes('aktiv')) return 4;
  if (v.includes('dokumentacij')) return 3;
  if (v.includes('priprem')) return 11;
  if (v.includes('dežur')) return 0;
  return 0;
}

export const ZADANO_TRAJANJE = { razgovor: 45, radionica: 45, saradnja: 30, aktivnost: 45 } as const;

// ---------- dnevnik rada ----------

export interface StavkaDnevnika {
  id: string;
  vrsta: 'razgovor' | 'radionica' | 'saradnja' | 'aktivnost';
  datum: string;
  createdAt: string;
  podrucje: number;
  opis: string;
  sifra: string;
  minuta: number;
}

export interface UlazDnevnika {
  razgovori: Razgovor[];
  radionice: Radionica[];
  saradnja: Saradnja[];
  aktivnosti: Aktivnost[];
}

const min = (v: number | null | undefined, zadano: number) => (typeof v === 'number' && v > 0 ? v : zadano);
const u = (d: string, od: string, do_: string) => !!d && d >= od && d <= do_;

export function stavkeDnevnika(ulaz: UlazDnevnika, od: string, do_: string): StavkaDnevnika[] {
  const out: StavkaDnevnika[] = [];
  for (const r of ulaz.razgovori) if (u(r.datum, od, do_)) out.push({
    id: r.id, vrsta: 'razgovor', datum: r.datum, createdAt: r.createdAt, podrucje: podrucjeRazgovora(r), sifra: r.sifra,
    opis: [r.vrstaKontakta || 'Razgovor', r.razlog && `razlog: ${r.razlog.toLowerCase()}`].filter(Boolean).join(', '),
    minuta: min(r.trajanjeMin, ZADANO_TRAJANJE.razgovor),
  });
  for (const r of ulaz.radionice) if (u(r.datum, od, do_)) out.push({
    id: r.id, vrsta: 'radionica', datum: r.datum, createdAt: r.createdAt, podrucje: podrucjeRadionice(r), sifra: '',
    opis: [`Radionica „${r.tema || 'bez teme'}“`, r.razred && `razred ${r.razred}`, r.brojUcesnika != null && `${r.brojUcesnika} učesnika`].filter(Boolean).join(', '),
    minuta: min(r.trajanjeMin, ZADANO_TRAJANJE.radionica),
  });
  for (const s of ulaz.saradnja) if (u(s.datum, od, do_)) out.push({
    id: s.id, vrsta: 'saradnja', datum: s.datum, createdAt: s.createdAt, podrucje: podrucjeSaradnje(s), sifra: s.sifra,
    opis: [`Saradnja: ${s.ustanovaOsoba || 'kontakt'}`, s.nacin && s.nacin.toLowerCase(), s.razlog].filter(Boolean).join(', '),
    minuta: min(s.trajanjeMin, ZADANO_TRAJANJE.saradnja),
  });
  for (const a of ulaz.aktivnosti) if (u(a.datum, od, do_)) out.push({
    id: a.id, vrsta: 'aktivnost', datum: a.datum, createdAt: a.createdAt, podrucje: podrucjeAktivnosti(a), sifra: '',
    opis: [a.vrsta, a.razred && `razred ${a.razred}`, a.cas && `${a.cas}. čas`, a.predmet !== a.vrsta && a.predmet, a.tema].filter(Boolean).join(', '),
    minuta: min(a.trajanjeMin, ZADANO_TRAJANJE.aktivnost),
  });
  return out.sort((a, b) => a.datum.localeCompare(b.datum) || a.createdAt.localeCompare(b.createdAt));
}

export interface RedEvidencije {
  kod: number;
  naziv: string;
  norma: number; // sati za period (sedmična norma × broj sedmica)
  ostvareno: number; // evidentirani sati
}

/** Evidencioni list: po područjima norma (za dati broj sedmica) i evidentirani sati. */
export function evidencijaPoPodrucjima(stavke: StavkaDnevnika[], brojSedmica: number): RedEvidencije[] {
  const sati = new Map<number, number>();
  for (const s of stavke) sati.set(s.podrucje, (sati.get(s.podrucje) ?? 0) + s.minuta / 60);
  const redovi = PODRUCJA.map((p) => ({ kod: p.kod, naziv: p.naziv, norma: p.sati * brojSedmica, ostvareno: zaokruzi(sati.get(p.kod) ?? 0) }));
  if (sati.get(0)) redovi.push({ kod: 0, naziv: OSTALI_POSLOVI.naziv, norma: 0, ostvareno: zaokruzi(sati.get(0) ?? 0) });
  return redovi;
}

export const zaokruzi = (h: number) => Math.round(h * 10) / 10;
export const satiTekst = (min: number) => {
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`;
};

// ---------- prijedlog godišnjeg plana (može se mijenjati) ----------

/** Tipični sadržaji rada školskog psihologa, svrstani po područjima (mjeseci: 1–12, prazno = tokom godine). */
export const PRIJEDLOG_PLANA: { podrucje: number; sadrzaj: string; mjeseci: number[]; saradnici: string }[] = [
  { podrucje: 1, sadrzaj: 'Izrada godišnjeg programa rada psihologa', mjeseci: [8, 9], saradnici: 'Direktor, pedagog' },
  { podrucje: 1, sadrzaj: 'Učešće u izradi Godišnjeg programa rada škole', mjeseci: [8, 9], saradnici: 'Direktor, pedagog' },
  { podrucje: 1, sadrzaj: 'Izrada mjesečnih planova rada', mjeseci: [], saradnici: '' },
  { podrucje: 2, sadrzaj: 'Praćenje adaptacije učenika prvog razreda i novih učenika', mjeseci: [9, 10, 11], saradnici: 'Učitelji, razrednici' },
  { podrucje: 2, sadrzaj: 'Analiza uspjeha i vladanja na klasifikacionim periodima', mjeseci: [11, 1, 4, 6], saradnici: 'Pedagog, razrednici' },
  { podrucje: 2, sadrzaj: 'Učešće u radu stručnih organa škole (nastavničko i odjeljenska vijeća)', mjeseci: [], saradnici: 'Direktor, nastavnici' },
  { podrucje: 3, sadrzaj: 'Vođenje dnevnika rada i evidencije o radu s učenicima', mjeseci: [], saradnici: '' },
  { podrucje: 3, sadrzaj: 'Izrada polugodišnjeg i godišnjeg izvještaja o radu', mjeseci: [1, 6], saradnici: '' },
  { podrucje: 4, sadrzaj: 'Savjetodavni rad s razrednicima i nastavnicima u radu s učenicima s teškoćama u učenju i ponašanju', mjeseci: [], saradnici: 'Razrednici, nastavnici' },
  { podrucje: 4, sadrzaj: 'Učešće u izradi i praćenju IOOP-a, rad u stručnom timu škole', mjeseci: [], saradnici: 'Stručni tim, nastavnici' },
  { podrucje: 4, sadrzaj: 'Podrška pripravnicima i studentima', mjeseci: [], saradnici: 'Mentori' },
  { podrucje: 5, sadrzaj: 'Individualni savjetodavni rad s učenicima', mjeseci: [], saradnici: 'Razrednici, roditelji' },
  { podrucje: 5, sadrzaj: 'Preventivne radionice (socio-emocionalno učenje, prevencija nasilja i ovisnosti)', mjeseci: [], saradnici: 'Razrednici' },
  { podrucje: 5, sadrzaj: 'Profesionalna orijentacija učenika završnih razreda', mjeseci: [2, 3, 4, 5], saradnici: 'Razrednici IX razreda' },
  { podrucje: 5, sadrzaj: 'Ispitivanje spremnosti djece za upis u prvi razred', mjeseci: [4, 5, 6], saradnici: 'Pedagog, učitelji' },
  { podrucje: 5, sadrzaj: 'Rad s učenicima s teškoćama u razvoju i darovitim učenicima', mjeseci: [], saradnici: 'Stručni tim' },
  { podrucje: 6, sadrzaj: 'Edukacija nastavnika (predavanja, radionice) o psihološkim temama', mjeseci: [10, 3], saradnici: 'Nastavničko vijeće' },
  { podrucje: 6, sadrzaj: 'Rad u timu za prevenciju nasilja i primjena Protokola o postupanju', mjeseci: [], saradnici: 'Tim za prevenciju' },
  { podrucje: 7, sadrzaj: 'Saradnja s Centrom za socijalni rad, Centrom za mentalno zdravlje, domom zdravlja i drugim institucijama', mjeseci: [], saradnici: 'Vanjske institucije' },
  { podrucje: 7, sadrzaj: 'Saradnja s Pedagoškim zavodom i Ministarstvom', mjeseci: [], saradnici: 'Pedagoški zavod USK' },
  { podrucje: 8, sadrzaj: 'Individualni savjetodavni rad s roditeljima/starateljima', mjeseci: [], saradnici: 'Razrednici' },
  { podrucje: 8, sadrzaj: 'Predavanja i radionice za roditelje (roditeljski sastanci, Vijeće roditelja)', mjeseci: [10, 2], saradnici: 'Razrednici, Vijeće roditelja' },
  { podrucje: 9, sadrzaj: 'Ispitivanje socio-emocionalne klime u odjeljenjima (sociometrija, upitnici)', mjeseci: [11, 3], saradnici: 'Razrednici' },
  { podrucje: 9, sadrzaj: 'Analiza uzroka neuspjeha i izostanaka učenika', mjeseci: [1, 6], saradnici: 'Pedagog' },
  { podrucje: 10, sadrzaj: 'Individualno stručno usavršavanje (literatura, seminari, edukacije)', mjeseci: [], saradnici: '' },
  { podrucje: 10, sadrzaj: 'Učešće u radu stručnog aktiva psihologa/pedagoga', mjeseci: [], saradnici: 'Pedagoški zavod USK' },
  { podrucje: 11, sadrzaj: 'Priprema za individualni i grupni rad, radionice i predavanja', mjeseci: [], saradnici: '' },
  { podrucje: 11, sadrzaj: 'Priprema i obrada psihodijagnostičkog materijala', mjeseci: [], saradnici: '' },
];

export const NAZIVI_MJESECI_SG = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8];

export function vrijemeRealizacije(mjeseci: number[]): string {
  if (!mjeseci.length) return 'tokom godine';
  const nazivi = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  return NAZIVI_MJESECI_SG.filter((m) => mjeseci.includes(m)).map((m) => nazivi[m - 1]).join(', ');
}

/** "2026-11" → je li stavka plana planirana za taj mjesec */
export function uMjesecu(mjeseci: number[], mjesecKljuc: string): boolean {
  return !mjeseci.length || mjeseci.includes(Number(mjesecKljuc.slice(5, 7)));
}
