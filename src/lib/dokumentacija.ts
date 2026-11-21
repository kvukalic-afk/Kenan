// Dokumentacija psihologa: propisi (baza znanja), kontrolna lista za inspekciju s rokovima
// i sažetak stanja koji AI asistent dobija uz svako pitanje (bez imena i bez šifri učenika).

import { danasIso, nazivSkolskeGodine, prikaz, razlikaDana } from './datum';
import { PODRUCJA, IZVOR_NORME } from './podrucja';
import type { Aktivnost, KontrolnaStavka, PlanStavka, PopunjenObrazac, Razgovor } from '../types';

export const IZVORI = [
  {
    naziv: 'Pedagoški standardi i normativi za osnovno obrazovanje (Sl. glasnik USK 20/2024)',
    url: 'https://pzusk.ba/besplatni/Pedago%C5%A1ki%20standardi%20i%20normativi%20za%20osnovno%20obrazovanje.pdf',
    napomena: 'Čl. 13: psiholog – poslovi, radni zadaci i 40-satna radna sedmica.',
  },
  {
    naziv: 'Pedagoški zavod Unsko-sanskog kantona',
    url: 'https://pzusk.ba/',
    napomena: 'Propisi, standardi, stručni aktivi i obrazovna dokumentacija.',
  },
];

/** Tekst propisa koji AI uvijek ima (izvod iz čl. 13. Pedagoških standarda USK). */
export const PROPIS_TEKST = `IZVOD: ${IZVOR_NORME}
Psiholog u odgojno-obrazovnoj ustanovi je stručni saradnik, član nastavnog osoblja koji primjenjuje stečena znanja i vještine iz fundamentalnih i primijenjenih oblasti psihologije, a primarno iz školske, razvojne i socijalne psihologije. Primjenom teorijskih i praktičnih saznanja psihologije kao nauke doprinosi ostvarenju i unapređenju odgojno-obrazovnog rada u ustanovi u skladu sa ciljevima i principima odgoja i obrazovanja i standardima postignuća učenika definisanih Zakonom o osnovnom odgoju i obrazovanju. Težište rada psihologa usmjereno je ka prepoznavanju, razumijevanju i objašnjenju djetetovih/učenikovih potreba i ponašanja u neposrednom radu (s učenicima, nastavnicima i roditeljima) te pružanju različitih vidova psihološke podrške u optimizaciji djetetovih/učenikovih stanja i ponašanja.
Poslovi i radni zadaci psihologa (sati sedmično, ukupno 40):
${PODRUCJA.map((p) => `${p.kod}. ${p.naziv} – ${p.sati}`).join('\n')}
Psiholog obavlja i druge stručne poslove po nalogu direktora i organa upravljanja pod uvjetom da se ti poslovi ne odnose na poslove iz 40-satne radne sedmice direktora i nastavnog osoblja.`;

// ---------- kontrolna lista ----------

export type Ponavljanje = 'godisnje' | 'mjesecno';

export interface DefinicijaStavke {
  kljuc: string;
  naziv: string;
  opis: string;
  ponavljanje: Ponavljanje;
  /** rok (YYYY-MM-DD) za školsku godinu g; za mjesečne: za mjesec m ("YYYY-MM") */
  rok: (g: number, m: string) => string;
  /** od kada se stavka prikazuje (YYYY-MM-DD) */
  od?: (g: number, m: string) => string;
  /** automatska provjera iz podataka u appu */
  auto?: (k: KontekstKontrole) => { gotovo: boolean; tekst: string } | null;
  /** je li automatska provjera dovoljna (bez ručne potvrde) */
  autoDovoljno?: boolean;
  /** gdje se to radi u appu */
  link?: (g: number, m: string) => string;
}

export interface KontekstKontrole {
  godina: number; // početak školske godine
  danas: string;
  mjesec: string; // tekući "YYYY-MM"
  prosliMjesec: string;
  plan: PlanStavka[];
  razgovori: Razgovor[];
  aktivnosti: Aktivnost[];
  obrasci: PopunjenObrazac[];
  zadnjaKopija: string;
}

const prosliMjesecOd = (m: string) => {
  const [g, mj] = m.split('-').map(Number);
  return mj === 1 ? `${g - 1}-12` : `${g}-${String(mj - 1).padStart(2, '0')}`;
};
const kraj = (m: string) => {
  const [g, mj] = m.split('-').map(Number);
  return `${m}-${String(new Date(g, mj, 0).getDate()).padStart(2, '0')}`;
};
const sljedeciMjesec = (m: string) => {
  const [g, mj] = m.split('-').map(Number);
  return mj === 12 ? `${g + 1}-01` : `${g}-${String(mj + 1).padStart(2, '0')}`;
};
const uGodini = (d: string, g: number) => d >= `${g}-09-01` && d <= `${g + 1}-08-31`;

export const KONTROLNA_LISTA: DefinicijaStavke[] = [
  {
    kljuc: 'program', naziv: 'Godišnji program rada psihologa', ponavljanje: 'godisnje',
    opis: 'Izrađen po 11 područja rada (USK standardi), odštampan, potpisan i predat direktoru kao dio Godišnjeg programa rada škole.',
    rok: (g) => `${g}-09-30`, od: (g) => `${g}-08-20`,
    auto: (k) => ({ gotovo: k.plan.length > 0, tekst: k.plan.length ? `u appu: ${k.plan.length} stavki plana` : 'plan još nije unesen u app' }),
    link: (g) => `/plan?godina=${g}`,
  },
  {
    kljuc: 'mjesecni', naziv: 'Mjesečni plan rada', ponavljanje: 'mjesecno',
    opis: 'Plan za tekući mjesec odštampan i u registratoru.',
    rok: (_g, m) => `${m}-05`,
    auto: (k) => {
      const n = k.plan.filter((p) => !p.mjeseci.length || p.mjeseci.includes(Number(k.mjesec.slice(5)))).length;
      return { gotovo: n > 0, tekst: n ? `${n} stavki za ovaj mjesec` : 'nema stavki plana za ovaj mjesec' };
    },
    link: (g, m) => `/plan?godina=${g}&mjesec=${m}`,
  },
  {
    kljuc: 'dnevnik', naziv: 'Dnevnik rada za prošli mjesec', ponavljanje: 'mjesecno',
    opis: 'Dnevnik rada (sa evidencijom 40-satne sedmice) za prošli mjesec odštampan, potpisan i u registratoru.',
    rok: (_g, m) => `${m}-05`,
    link: (_g, m) => `/print/dnevnik/${prosliMjesecOd(m)}`,
  },
  {
    kljuc: 'evidencija', naziv: 'Evidencija individualnog rada s učenicima', ponavljanje: 'godisnje',
    opis: 'Kartoni/dosjei učenika s bilješkama razgovora, zaključcima i preporukama (Karton učenika → print).',
    rok: (g) => `${g + 1}-06-30`,
    auto: (k) => {
      const n = k.razgovori.filter((r) => uGodini(r.datum, k.godina)).length;
      return { gotovo: n > 0, tekst: `${n} razgovora ove školske godine` };
    },
    autoDovoljno: true,
    link: () => '/ucenici',
  },
  {
    kljuc: 'kopija', naziv: 'Rezervna kopija podataka (sedmično)', ponavljanje: 'godisnje',
    opis: 'Šifrovana rezervna kopija ne starija od 7 dana, sačuvana van uređaja (USB, oblak).',
    rok: (_g, m) => kraj(m),
    auto: (k) => {
      if (!k.zadnjaKopija) return { gotovo: false, tekst: 'kopija još nije napravljena' };
      const d = razlikaDana(k.zadnjaKopija.slice(0, 10), k.danas);
      return { gotovo: d <= 7, tekst: `zadnja prije ${d} dana` };
    },
    autoDovoljno: true,
    link: () => '/postavke?kopija=1',
  },
  {
    kljuc: 'saglasnosti', naziv: 'Saglasnosti roditelja', ponavljanje: 'godisnje',
    opis: 'Pisane saglasnosti roditelja/staratelja za individualni rad, testiranje i upućivanje (gdje se traže).',
    rok: (g) => `${g + 1}-06-30`,
    auto: (k) => {
      const n = k.obrasci.filter((o) => o.vrsta === 'saglasnost' && uGodini(o.datum, k.godina)).length;
      return { gotovo: n > 0, tekst: `${n} saglasnosti u appu` };
    },
    link: () => '/dokumentacija?tab=obrasci',
  },
  {
    kljuc: 'nasilje', naziv: 'Evidencija postupanja u slučajevima nasilja', ponavljanje: 'godisnje',
    opis: 'Za svaki slučaj: evidencija postupanja prema Protokolu (nivo, mjere, obaviješteni, praćenje) i zapisnik tima.',
    rok: (g) => `${g + 1}-06-30`,
    auto: (k) => {
      const n = k.obrasci.filter((o) => o.vrsta === 'nasilje' && uGodini(o.datum, k.godina)).length;
      return { gotovo: n > 0, tekst: n ? `${n} evidencija u appu` : 'nema evidencija (ako nije bilo slučajeva, potvrdi ručno)' };
    },
    link: () => '/dokumentacija?tab=obrasci',
  },
  {
    kljuc: 'strucni-tim', naziv: 'Stručni tim / IOOP – zapisnici', ponavljanje: 'godisnje',
    opis: 'Zapisnici sa sastanaka stručnog tima i učešće u izradi i praćenju IOOP-a.',
    rok: (g) => `${g + 1}-06-30`,
    auto: (k) => {
      const n = k.obrasci.filter((o) => o.vrsta === 'strucni-tim' && uGodini(o.datum, k.godina)).length;
      return { gotovo: n > 0, tekst: `${n} zapisnika u appu` };
    },
    link: () => '/dokumentacija?tab=obrasci',
  },
  {
    kljuc: 'usavrsavanje', naziv: 'Evidencija stručnog usavršavanja', ponavljanje: 'godisnje',
    opis: 'Seminari, edukacije, aktivi – evidentirani (Ostala aktivnost → Stručno usavršavanje) i certifikati u dosijeu.',
    rok: (g) => `${g + 1}-06-30`,
    auto: (k) => {
      const n = k.aktivnosti.filter((a) => /usavršavanj/i.test(a.vrsta) && uGodini(a.datum, k.godina)).length;
      return { gotovo: n > 0, tekst: `${n} evidentiranih usavršavanja` };
    },
    link: (g) => `/print/usavrsavanje/${g}`,
  },
  {
    kljuc: 'polugodisnji', naziv: 'Polugodišnji izvještaj o radu', ponavljanje: 'godisnje',
    opis: 'Izvještaj za I polugodište odštampan, potpisan i predat.',
    rok: (g) => `${g + 1}-01-31`, od: (g) => `${g}-12-15`,
    link: (g) => `/print/izvjestaj/${g}/I`,
  },
  {
    kljuc: 'godisnji', naziv: 'Godišnji izvještaj o radu', ponavljanje: 'godisnje',
    opis: 'Godišnji izvještaj o radu psihologa odštampan, potpisan i predat.',
    rok: (g) => `${g + 1}-07-15`, od: (g) => `${g + 1}-06-01`,
    link: (g) => `/print/izvjestaj/${g}/godina`,
  },
  {
    kljuc: 'cuvanje', naziv: 'Povjerljiva dokumentacija pod ključem', ponavljanje: 'godisnje',
    opis: 'Odštampani kartoni, bilješke i saglasnosti čuvaju se u zaključanom ormaru; uređaj s appom zaključan PIN-om.',
    rok: (g) => `${g}-09-30`,
  },
  {
    kljuc: 'rjesenje', naziv: 'Lični dosije: rješenje o 40-satnoj sedmici, diploma, licenca', ponavljanje: 'godisnje',
    opis: 'Rješenje o zaduženju (40-satna radna sedmica), kopija diplome i potvrde o položenom stručnom ispitu.',
    rok: (g) => `${g}-09-30`,
    link: () => '/dokumentacija?tab=dokumenti',
  },
];

export const idStavke = (d: DefinicijaStavke, g: number, m: string) =>
  d.ponavljanje === 'mjesecno' ? `${g}:${d.kljuc}:${d.kljuc === 'dnevnik' ? prosliMjesecOd(m) : m}` : `${g}:${d.kljuc}`;

export interface StanjeStavke {
  def: DefinicijaStavke;
  id: string;
  rok: string;
  gotovo: boolean;
  rucno: boolean;
  auto: { gotovo: boolean; tekst: string } | null;
  kasni: boolean;
  danaDoRoka: number;
  link?: string;
}

export function kontekst(godina: number, danas: string, podaci: Omit<KontekstKontrole, 'godina' | 'danas' | 'mjesec' | 'prosliMjesec'>): KontekstKontrole {
  const mjesec = danas.slice(0, 7);
  return { godina, danas, mjesec, prosliMjesec: prosliMjesecOd(mjesec), ...podaci };
}

export function stanjeKontrole(k: KontekstKontrole, rucno: KontrolnaStavka[]): StanjeStavke[] {
  const potvrde = new Map(rucno.map((r) => [r.id, r.gotovo]));
  return KONTROLNA_LISTA
    .filter((d) => !d.od || d.od(k.godina, k.mjesec) <= k.danas)
    .map((d) => {
      const id = idStavke(d, k.godina, k.mjesec);
      const rok = d.rok(k.godina, k.mjesec);
      const auto = d.auto ? d.auto(k) : null;
      const rucnoGotovo = potvrde.get(id) === true;
      const gotovo = rucnoGotovo || (!!d.autoDovoljno && !!auto?.gotovo);
      const danaDoRoka = razlikaDana(k.danas, rok);
      return { def: d, id, rok, gotovo, rucno: rucnoGotovo, auto, kasni: !gotovo && danaDoRoka < 0, danaDoRoka, link: d.link?.(k.godina, k.mjesec) };
    })
    .sort((a, b) => Number(a.gotovo) - Number(b.gotovo) || a.rok.localeCompare(b.rok));
}

export function spremnost(stanje: StanjeStavke[]): number {
  if (!stanje.length) return 100;
  return Math.round((stanje.filter((s) => s.gotovo).length / stanje.length) * 100);
}

/** Sažetak stanja za AI (bez imena i šifri učenika). */
export function sazetakStanjaZaAI(k: KontekstKontrole, stanje: StanjeStavke[], dodatno: string[] = []): string {
  const red = (s: StanjeStavke) =>
    `- [${s.gotovo ? 'x' : ' '}] ${s.def.naziv} – rok ${prikaz(s.rok)}${s.kasni ? ' (KASNI)' : ''}${s.auto ? ` – ${s.auto.tekst}` : ''}`;
  return [
    `Danas je ${prikaz(k.danas)}, školska godina ${nazivSkolskeGodine(k.godina)}.`,
    `Spremnost dokumentacije za inspekciju: ${spremnost(stanje)}%.`,
    'Kontrolna lista (x = urađeno):',
    ...stanje.map(red),
    ...dodatno,
  ].join('\n');
}

export function sljedeceObaveze(stanje: StanjeStavke[], n = 3): StanjeStavke[] {
  return stanje.filter((s) => !s.gotovo).sort((a, b) => a.rok.localeCompare(b.rok)).slice(0, n);
}

export const danasZaKontrolu = () => danasIso();
export { sljedeciMjesec };
