// Dokumentacija psihologa: propisi (baza znanja), kontrolna lista za inspekciju s rokovima
// i sažetak stanja koji AI asistent dobija uz svako pitanje (bez imena i bez šifri učenika).

import { danasIso, dodajDane, nazivSkolskeGodine, prikaz, razlikaDana } from './datum';
import { PODRUCJA, IZVOR_NORME } from './podrucja';
import type { Aktivnost, KontrolnaStavka, PlanStavka, PopunjenObrazac, Razgovor } from '../types';

export const IZVORI = [
  {
    naziv: 'Pedagoški standardi i normativi za osnovno obrazovanje (Sl. glasnik USK 20/2024)',
    url: 'https://pzusk.ba/besplatni/Pedago%C5%A1ki%20standardi%20i%20normativi%20za%20osnovno%20obrazovanje.pdf',
    napomena: 'Čl. 13: psiholog – poslovi, radni zadaci i 40-satna radna sedmica.',
  },
  {
    naziv: 'Zakon o osnovnom odgoju i obrazovanju USK (Sl. glasnik USK 19/2023)',
    url: 'https://ksc-bihac.net/wp-content/uploads/2025/09/ZAKON-O-OSNOVNOM-ODGOJU-I-OBRAZOVANJU.pdf',
    napomena: 'Čl. 23 (djeca s teškoćama – individualni program), čl. 62 (godišnji program do 30.09.), čl. 76 (komisija za upis), čl. 104 (mentalno zdravlje), čl. 119 (profesionalni razvoj), čl. 120 (pripravnici), čl. 121 (praćenje i ocjenjivanje rada), čl. 130 (dokumentacija škole).',
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
Psiholog obavlja i druge stručne poslove po nalogu direktora i organa upravljanja pod uvjetom da se ti poslovi ne odnose na poslove iz 40-satne radne sedmice direktora i nastavnog osoblja.

IZVOD: Zakon o osnovnom odgoju i obrazovanju USK (Sl. glasnik USK 19/2023):
- Čl. 23: djeca s teškoćama u razvoju uče u redovnim školama po programima prilagođenim individualnim potrebama; individualni program izrađuje se za svakog takvog učenika uz obavezno utvrđivanje razvojnog statusa djeteta. Detalje uređuje Pravilnik o odgoju i obrazovanju, praćenju i ocjenjivanju djece s teškoćama u razvoju u USK; podršku pružaju centri za razvoj inkluzivnih praksi (CRIP).
- Čl. 62: rad škole se realizuje po godišnjem programu rada (metodologija Pedagoškog zavoda); škola ga usvaja i dostavlja najkasnije do 30. septembra.
- Čl. 76: upis u 1. razred u aprilu, na osnovu nalaza školske komisije (pedagog ili pedagog-psiholog, psiholog škole i dva nastavnika) koja vrši opservaciju socijalnog, emocionalnog i kognitivnog razvoja djeteta.
- Čl. 104: škola, nastavnici i stručni saradnici dužni su voditi računa o mentalnom zdravlju učenika.
- Čl. 119: nastavnici i stručni saradnici moraju proći programe obuke, usavršavanja i provjere (kontinuirani profesionalni razvoj).
- Čl. 120: ko prvi put zasniva radni odnos u školi ima status pripravnika; škola je dužna odmah po stupanju na posao izdati rješenje o pripravničkom stažu s rokom polaganja stručnog ispita i imenovati mentora; detalje uređuje pravilnik ministra.
- Čl. 121: rad nastavnika i stručnih saradnika se prati i ocjenjuje.
- Čl. 130: škola vodi dokumentaciju i evidenciju o odgojno-obrazovnom radu u pisanom i digitalnom obliku; sadržaj propisuje pravilnik ministra.`;

// ---------- kontrolna lista ----------

export type Ponavljanje = 'godisnje' | 'mjesecno';
export type Grupa = 'pocetak' | 'planiranje' | 'evidencija' | 'ucenici' | 'izvjestaji' | 'licno';

export const GRUPE: { kljuc: Grupa; naziv: string }[] = [
  { kljuc: 'pocetak', naziv: 'Početak rada u školi' },
  { kljuc: 'planiranje', naziv: 'Planiranje' },
  { kljuc: 'evidencija', naziv: 'Evidencija rada' },
  { kljuc: 'ucenici', naziv: 'Rad s učenicima: IP, nasilje, saglasnosti, upis' },
  { kljuc: 'izvjestaji', naziv: 'Izvještaji' },
  { kljuc: 'licno', naziv: 'Lični dosije i zaštita podataka' },
];

/** Koliko dana novi psiholog ima za stavke čiji je redovni rok prošao prije njegovog dolaska. */
export const DANA_ZA_NOVOG = 30;

export interface DefinicijaStavke {
  kljuc: string;
  naziv: string;
  opis: string;
  ponavljanje: Ponavljanje;
  grupa: Grupa;
  /** pravni osnov ili „dobra praksa“ – da se zna šta je propis, a šta preporuka */
  osnov: string;
  /** prikazuje se samo kad je uslov ispunjen */
  samoAko?: (k: KontekstKontrole) => boolean;
  /** rok za novozaposlenog: broj dana od početka rada (ako je redovni rok prošao prije dolaska ili je raniji) */
  rokZaNovog?: number;
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
  /** datum početka rada u ovoj školi (YYYY-MM-DD) ili '' */
  pocetakRada?: string;
  /** prvo zaposlenje u školi – pripravnički staž */
  pripravnik?: boolean;
}

/** Je li psiholog počeo raditi tokom ove školske godine. */
export const noviOveGodine = (k: KontekstKontrole) => !!k.pocetakRada && uGodini(k.pocetakRada, k.godina);

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
    kljuc: 'pripravnik-rjesenje', grupa: 'pocetak', naziv: 'Rješenje o pripravničkom stažu i imenovan mentor', ponavljanje: 'godisnje',
    osnov: 'Zakon USK čl. 120. st. 2 – škola je dužna odmah po stupanju na posao izdati rješenje i imenovati mentora',
    opis: 'Zatraži od direktora/sekretara rješenje o pripravničkom stažu (s rokom polaganja stručnog ispita) i rješenje o mentoru. Kopije u lični dosije.',
    samoAko: (k) => !!k.pripravnik, rok: (g) => `${g}-09-15`, rokZaNovog: 8,
    link: () => '/dokumentacija?tab=dokumenti',
  },
  {
    kljuc: 'pripravnik-plan', grupa: 'pocetak', naziv: 'Plan pripravničkog staža i evidencija rada s mentorom', ponavljanje: 'godisnje',
    osnov: 'Zakon USK čl. 120. st. 4 – detalje propisuje pravilnik o stručnom ispitu (provjeri s mentorom)',
    opis: 'Plan pripravničkog rada dogovoren s mentorom; evidencija konsultacija, hospitacija i zadataka. Prijava za stručni ispit u roku iz rješenja.',
    samoAko: (k) => !!k.pripravnik, rok: (g) => `${g}-10-15`, rokZaNovog: 30,
  },
  {
    kljuc: 'primopredaja', grupa: 'pocetak', naziv: 'Preuzeta zatečena dokumentacija psihologa', ponavljanje: 'godisnje',
    osnov: 'Dobra praksa (kontinuitet rada i povjerljivost)',
    opis: 'Popis/zapisnik o preuzimanju: kartoni i dosjei učenika, individualni programi, zapisnici, testovi, saglasnosti. Ako dokumentacije nema, napiši službenu bilješku o tome i daj je direktoru.',
    samoAko: noviOveGodine, rok: (g) => `${g}-09-15`, rokZaNovog: 15,
    link: () => '/obrazac/sluzbena-biljeska',
  },
  {
    kljuc: 'program-skole', grupa: 'pocetak', naziv: 'Upoznat/a s Godišnjim programom rada škole i Razvojnim planom', ponavljanje: 'godisnje',
    osnov: 'Zakon USK čl. 62 (godišnji program i razvojni plan škole)',
    opis: 'Uzmi od direktora/pedagoga Godišnji program rada škole (dio stručne službe), raspored časova, spisak odjeljenja i razrednika, kalendar sjednica.',
    samoAko: noviOveGodine, rok: (g) => `${g}-09-15`, rokZaNovog: 10,
  },
  {
    kljuc: 'teskoce', grupa: 'ucenici', naziv: 'Spisak učenika s teškoćama u razvoju i njihovi individualni programi', ponavljanje: 'godisnje',
    osnov: 'Zakon USK čl. 23 – individualni program za svakog učenika s teškoćama, uz utvrđen razvojni status',
    opis: 'Ažuran spisak (matična i područne škole), ko ima nalaz/mišljenje, ko ima individualni (prilagođeni) program i ko ga prati. Psiholog učestvuje u procjeni, izradi i praćenju.',
    rok: (g) => `${g}-10-31`, rokZaNovog: 30,
    auto: (k) => {
      const n = new Set(k.razgovori.filter((r) => /teškoć|IOP/i.test(r.razlog) && uGodini(r.datum, k.godina)).map((r) => r.sifra)).size;
      return { gotovo: false, tekst: n ? `${n} učenika s razlogom „Teškoće u razvoju / IOP“ u appu` : 'u appu još nema razgovora s tim razlogom' };
    },
    link: () => '/ucenici',
  },
  {
    kljuc: 'upis', grupa: 'ucenici', naziv: 'Komisija za upis u 1. razred – nalazi opservacije', ponavljanje: 'godisnje',
    osnov: 'Zakon USK čl. 76 – upis u aprilu na osnovu nalaza školske komisije (u njoj je psiholog)',
    opis: 'Za svako dijete zapisnik o opservaciji socijalnog, emocionalnog i kognitivnog razvoja (obrazac „Spremnost za školu“).',
    rok: (g) => `${g + 1}-05-15`, od: (g) => `${g + 1}-03-01`,
    auto: (k) => {
      const n = k.obrasci.filter((o) => o.vrsta === 'spremnost' && uGodini(o.datum, k.godina)).length;
      return { gotovo: false, tekst: `${n} zapisnika u appu` };
    },
    link: () => '/obrazac/spremnost',
  },
  {
    kljuc: 'program', grupa: 'planiranje', osnov: 'Pedagoški standardi USK, čl. 13 (11 područja, 40 sati); Zakon USK čl. 62 (godišnji program škole do 30.09.)', rokZaNovog: 30, naziv: 'Godišnji program rada psihologa', ponavljanje: 'godisnje',
    opis: 'Izrađen po 11 područja rada (USK standardi), odštampan, potpisan i predat direktoru kao dio Godišnjeg programa rada škole.',
    rok: (g) => `${g}-09-30`, od: (g) => `${g}-08-20`,
    auto: (k) => ({ gotovo: k.plan.length > 0, tekst: k.plan.length ? `u appu: ${k.plan.length} stavki plana` : 'plan još nije unesen u app' }),
    link: (g) => `/plan?godina=${g}`,
  },
  {
    kljuc: 'mjesecni', grupa: 'planiranje', osnov: 'Dobra praksa; uobičajeno ga traže direktor i Pedagoški zavod', rokZaNovog: 7, naziv: 'Mjesečni plan rada', ponavljanje: 'mjesecno',
    opis: 'Plan za tekući mjesec odštampan i u registratoru.',
    rok: (_g, m) => `${m}-05`,
    auto: (k) => {
      const n = k.plan.filter((p) => !p.mjeseci.length || p.mjeseci.includes(Number(k.mjesec.slice(5)))).length;
      return { gotovo: n > 0, tekst: n ? `${n} stavki za ovaj mjesec` : 'nema stavki plana za ovaj mjesec' };
    },
    link: (g, m) => `/plan?godina=${g}&mjesec=${m}`,
  },
  {
    kljuc: 'dnevnik', grupa: 'evidencija', osnov: 'Pedagoški standardi USK, čl. 13 (40-satna sedmica); oblik dnevnika: dobra praksa', naziv: 'Dnevnik rada za prošli mjesec', ponavljanje: 'mjesecno',
    opis: 'Dnevnik rada (sa evidencijom 40-satne sedmice) za prošli mjesec odštampan, potpisan i u registratoru.',
    rok: (_g, m) => `${m}-05`,
    link: (_g, m) => `/print/dnevnik/${prosliMjesecOd(m)}`,
  },
  {
    kljuc: 'evidencija', grupa: 'evidencija', osnov: 'Zakon USK čl. 104 (briga o mentalnom zdravlju) i čl. 130 (evidencija o odgojno-obrazovnom radu); Etički kodeks psihologa', naziv: 'Evidencija individualnog rada s učenicima', ponavljanje: 'godisnje',
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
    kljuc: 'kopija', grupa: 'licno', osnov: 'Preporuka appa (podaci su samo na uređaju)', naziv: 'Rezervna kopija podataka (sedmično)', ponavljanje: 'godisnje',
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
    kljuc: 'saglasnosti', grupa: 'ucenici', osnov: 'Etički kodeks psihologa; propisi o zaštiti ličnih podataka', naziv: 'Saglasnosti roditelja', ponavljanje: 'godisnje',
    opis: 'Pisane saglasnosti roditelja/staratelja za individualni rad, testiranje i upućivanje (gdje se traže).',
    rok: (g) => `${g + 1}-06-30`,
    auto: (k) => {
      const n = k.obrasci.filter((o) => o.vrsta === 'saglasnost' && uGodini(o.datum, k.godina)).length;
      return { gotovo: n > 0, tekst: `${n} saglasnosti u appu` };
    },
    link: () => '/dokumentacija?tab=obrasci',
  },
  {
    kljuc: 'nasilje', grupa: 'ucenici', osnov: 'Zakon USK (zaštita učenika od svih oblika nasilja); Protokol o postupanju u slučajevima nasilja', naziv: 'Evidencija postupanja u slučajevima nasilja', ponavljanje: 'godisnje',
    opis: 'Za svaki slučaj: evidencija postupanja prema Protokolu (nivo, mjere, obaviješteni, praćenje) i zapisnik tima.',
    rok: (g) => `${g + 1}-06-30`,
    auto: (k) => {
      const n = k.obrasci.filter((o) => o.vrsta === 'nasilje' && uGodini(o.datum, k.godina)).length;
      return { gotovo: n > 0, tekst: n ? `${n} evidencija u appu` : 'nema evidencija (ako nije bilo slučajeva, potvrdi ručno)' };
    },
    link: () => '/dokumentacija?tab=obrasci',
  },
  {
    kljuc: 'strucni-tim', grupa: 'ucenici', osnov: 'Zakon USK čl. 23; Pravilnik o odgoju i obrazovanju djece s teškoćama u razvoju USK', naziv: 'Stručni tim / IOOP – zapisnici', ponavljanje: 'godisnje',
    opis: 'Zapisnici sa sastanaka stručnog tima i učešće u izradi i praćenju IOOP-a.',
    rok: (g) => `${g + 1}-06-30`,
    auto: (k) => {
      const n = k.obrasci.filter((o) => o.vrsta === 'strucni-tim' && uGodini(o.datum, k.godina)).length;
      return { gotovo: n > 0, tekst: `${n} zapisnika u appu` };
    },
    link: () => '/dokumentacija?tab=obrasci',
  },
  {
    kljuc: 'usavrsavanje', grupa: 'evidencija', osnov: 'Zakon USK čl. 119 (obavezan kontinuirani profesionalni razvoj)', naziv: 'Evidencija stručnog usavršavanja', ponavljanje: 'godisnje',
    opis: 'Seminari, edukacije, aktivi – evidentirani (Ostala aktivnost → Stručno usavršavanje) i certifikati u dosijeu.',
    rok: (g) => `${g + 1}-06-30`,
    auto: (k) => {
      const n = k.aktivnosti.filter((a) => /usavršavanj/i.test(a.vrsta) && uGodini(a.datum, k.godina)).length;
      return { gotovo: n > 0, tekst: `${n} evidentiranih usavršavanja` };
    },
    link: (g) => `/print/usavrsavanje/${g}`,
  },
  {
    kljuc: 'polugodisnji', grupa: 'izvjestaji', osnov: 'Pedagoški standardi USK, čl. 13 (analiza rada i izvještavanje); predaje se uz izvještaj škole', naziv: 'Polugodišnji izvještaj o radu', ponavljanje: 'godisnje',
    opis: 'Izvještaj za I polugodište odštampan, potpisan i predat.',
    rok: (g) => `${g + 1}-01-31`, od: (g) => `${g}-12-15`,
    link: (g) => `/print/izvjestaj/${g}/I`,
  },
  {
    kljuc: 'godisnji', grupa: 'izvjestaji', osnov: 'Pedagoški standardi USK, čl. 13; Zakon USK čl. 121 (praćenje i ocjenjivanje rada)', naziv: 'Godišnji izvještaj o radu', ponavljanje: 'godisnje',
    opis: 'Godišnji izvještaj o radu psihologa odštampan, potpisan i predat.',
    rok: (g) => `${g + 1}-07-15`, od: (g) => `${g + 1}-06-01`,
    link: (g) => `/print/izvjestaj/${g}/godina`,
  },
  {
    kljuc: 'cuvanje', grupa: 'licno', osnov: 'Propisi o zaštiti ličnih podataka; Etički kodeks psihologa (povjerljivost)', rokZaNovog: 15, naziv: 'Povjerljiva dokumentacija pod ključem', ponavljanje: 'godisnje',
    opis: 'Odštampani kartoni, bilješke i saglasnosti čuvaju se u zaključanom ormaru; uređaj s appom zaključan PIN-om.',
    rok: (g) => `${g}-09-30`,
  },
  {
    kljuc: 'rjesenje', grupa: 'licno', osnov: 'Zakon USK čl. 110–111 (uvjeti, ugovor o radu); Pedagoški standardi (40-satna sedmica)', rokZaNovog: 30, naziv: 'Lični dosije: rješenje o 40-satnoj sedmici, diploma, licenca', ponavljanje: 'godisnje',
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
  // datum budućeg početka ne pomjera rokove
  if (podaci.pocetakRada && podaci.pocetakRada > danas) podaci = { ...podaci, pocetakRada: '' };
  const mjesec = danas.slice(0, 7);
  return { godina, danas, mjesec, prosliMjesec: prosliMjesecOd(mjesec), ...podaci };
}

export function stanjeKontrole(k: KontekstKontrole, rucno: KontrolnaStavka[]): StanjeStavke[] {
  const potvrde = new Map(rucno.map((r) => [r.id, r.gotovo]));
  return KONTROLNA_LISTA
    .filter((d) => !d.od || d.od(k.godina, k.mjesec) <= k.danas)
    .filter((d) => !d.samoAko || d.samoAko(k))
    .filter((d) => {
      // mjesečne obaveze počinju od mjeseca dolaska (dnevnik za prošli mjesec tek kad je prošli mjesec bio radni)
      if (d.ponavljanje !== 'mjesecno' || !noviOveGodine(k)) return true;
      const m = d.kljuc === 'dnevnik' ? k.prosliMjesec : k.mjesec;
      return m >= k.pocetakRada!.slice(0, 7);
    })
    .map((d) => {
      const id = idStavke(d, k.godina, k.mjesec);
      let rok = d.rok(k.godina, k.mjesec);
      if (d.rokZaNovog && noviOveGodine(k)) {
        const zaNovog = dodajDane(k.pocetakRada!, d.rokZaNovog);
        if (rok < zaNovog) rok = zaNovog;
      }
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
    `- [${s.gotovo ? 'x' : ' '}] ${s.def.naziv} – rok ${prikaz(s.rok)}${s.kasni ? ' (KASNI)' : ''}${s.auto ? ` – ${s.auto.tekst}` : ''} [osnov: ${s.def.osnov}]`;
  return [
    `Danas je ${prikaz(k.danas)}, školska godina ${nazivSkolskeGodine(k.godina)}.`,
    k.pocetakRada ? `Psiholog radi u ovoj školi od ${prikaz(k.pocetakRada)} (${razlikaDana(k.pocetakRada, k.danas)} dana)${k.pripravnik ? ', pripravnik (prvo zaposlenje u školi)' : ''}.` : 'Datum početka rada u školi nije upisan.',
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
