// Psihološki instrumenti za školskog psihologa (skrining, ne dijagnostika).
//
// Pitanja su u appu samo za instrumente čija licenca dozvoljava prevod i umnožavanje
// (javno vlasništvo ili izričita dozvola autora). Za ostale app sadrži samo bodovanje
// i tumačenje – obrazac se preuzima sa službene stranice (link u opisu).
// Granične vrijednosti su iz izvornih radova; za BiH nema normi, pa se rezultat
// tumači oprezno i najkorisniji je za poređenje istog djeteta kroz vrijeme.

export type Informant = 'dijete' | 'roditelj' | 'nastavnik';
export const NAZIV_INFORMANTA: Record<Informant, string> = {
  dijete: 'Učenik (samoprocjena)',
  roditelj: 'Roditelj',
  nastavnik: 'Nastavnik / razrednik',
};

export type Nivo = 'uredno' | 'granicno' | 'povisen' | 'alarm' | 'info';
export const NAZIV_NIVOA: Record<Nivo, string> = { uredno: 'Uobičajeno', granicno: 'Granično', povisen: 'Povišeno', alarm: 'Hitno', info: '' };

export interface Prag { od: number; nivo: Nivo; opis: string }
export interface Skala {
  id: string;
  naziv: string;
  /** redni brojevi stavki (od 1) */
  stavke?: number[];
  /** zbir drugih skala (npr. SDQ ukupne teškoće) */
  izSkala?: string[];
  nacin?: 'zbir' | 'prosjek';
  /** za direktan unos bodova skale (SDQ) */
  max?: number;
  pragovi?: Prag[] | Partial<Record<Informant, Prag[]>>;
}
export interface Opcija { v: number; t: string }
export interface DodatnoPitanje { id: string; tekst: string; opcije: Opcija[]; alarmOd?: number; poruka?: string; nivo?: Nivo }

/**
 * u-appu: pitanja, print i bodovanje u appu · bodovanje: službeni obrazac + bodovanje u appu
 * skale: unos bodova podskala (SDQ) · link: samo opis i link · alat: sociometrija · obrazac: obrazac za print
 */
export type Nacin = 'u-appu' | 'bodovanje' | 'skale' | 'link' | 'alat' | 'obrazac';

export interface Instrument {
  id: string;
  kratko: string;
  naziv: string;
  izvorni: string;
  oblast: Oblast;
  ikona: string;
  uzrast: string;
  informanti: Informant[];
  trajanje: string;
  trajanjeMin: number;
  brojPitanja: number;
  nacin: Nacin;
  mjeri: string;
  kada: string[];
  tumacenje: string[];
  uputa?: Partial<Record<Informant, string>>;
  /** početak rečenice iznad pitanja, npr. „U posljednje dvije sedmice moje dijete…“ */
  uvodStavki?: Partial<Record<Informant, string>>;
  stavke?: Partial<Record<Informant, string[]>>;
  odgovori?: Opcija[];
  obrnute?: number[];
  skale: Skala[];
  dodatna?: Partial<Record<Informant, DodatnoPitanje[]>>;
  alarmStavke?: { stavka: number; od: number; poruka: string }[];
  licenca: string;
  izvor: string;
  linkovi: { naziv: string; url: string }[];
  upozorenje?: string;
  prevod?: string;
}

export const OBLASTI = ['Opšti skrining', 'Anksioznost', 'Raspoloženje', 'Trauma i rizik', 'Pažnja i ponašanje', 'Slika o sebi i dobrobit', 'Odnosi u razredu', 'Praćenje'] as const;
export type Oblast = (typeof OBLASTI)[number];

export const NAZIV_NACINA: Record<Nacin, string> = {
  'u-appu': 'Upitnik u appu',
  bodovanje: 'Bodovanje u appu',
  skale: 'Tumačenje u appu',
  link: 'Službeni obrazac',
  alat: 'Alat u appu',
  obrazac: 'Obrazac za print',
};

const RADNI_PREVOD = 'Radni prevod za školsku praksu (nije validiran na uzorku iz BiH). Rezultat tumači oprezno, kao skrining, i najviše ga koristi za poređenje istog djeteta kroz vrijeme.';

const OPC_PHQ: Opcija[] = [
  { v: 0, t: 'Nimalo' },
  { v: 1, t: 'Nekoliko dana' },
  { v: 2, t: 'Više od pola dana' },
  { v: 3, t: 'Skoro svaki dan' },
];
const OPC_TESKOCA: Opcija[] = [
  { v: 0, t: 'Nimalo teško' },
  { v: 1, t: 'Donekle teško' },
  { v: 2, t: 'Veoma teško' },
  { v: 3, t: 'Izuzetno teško' },
];
const OPC_DA_NE: Opcija[] = [{ v: 0, t: 'Ne' }, { v: 1, t: 'Da' }];

const raspon = (od: number, doBr: number) => Array.from({ length: doBr - od + 1 }, (_, i) => od + i);

const SDQ_TRI = (granicno: number, odstupa: number): Prag[] => [
  { od: 0, nivo: 'uredno', opis: 'Uobičajeno' },
  { od: granicno, nivo: 'granicno', opis: 'Granično' },
  { od: odstupa, nivo: 'povisen', opis: 'Odstupajuće (povišeno)' },
];
const SDQ_PROSOC: Prag[] = [
  { od: 0, nivo: 'povisen', opis: 'Odstupajuće (nisko)' },
  { od: 5, nivo: 'granicno', opis: 'Granično' },
  { od: 6, nivo: 'uredno', opis: 'Uobičajeno' },
];

const ALARM_SAMOPOVREDJIVANJE = 'Dijete je označilo misli o smrti ili samopovređivanju. Isti dan: razgovor s djetetom (procjena rizika, npr. C-SSRS), ne ostavljaj ga samog, obavijesti roditelje i direktora i postupi po protokolu (po potrebi Centar za mentalno zdravlje / hitna služba).';

export const INSTRUMENTI: Instrument[] = [
  // ---------------- Opšti skrining ----------------
  {
    id: 'psc17',
    kratko: 'PSC-17',
    naziv: 'Lista simptoma kod djece – kratka verzija',
    izvorni: 'Pediatric Symptom Checklist-17',
    oblast: 'Opšti skrining',
    ikona: '🩺',
    uzrast: '4–16 godina (1.–9. razred)',
    informanti: ['roditelj'],
    trajanje: '5 minuta',
    trajanjeMin: 15,
    brojPitanja: 17,
    nacin: 'u-appu',
    mjeri: 'Brzi opšti skrining psihosocijalnih teškoća u tri područja: emocionalne teškoće (internalizacija), pažnja i ponašanje prema drugima (eksternalizacija).',
    kada: [
      'Prvi razgovor s roditeljem kad nije jasno u čemu je problem.',
      'Učenik „za kojeg nastavnici kažu da nešto nije u redu“, a nema jasnog povoda.',
      'Prije i poslije podrške, za praćenje promjene.',
    ],
    tumacenje: [
      'Povišen rezultat na jednoj podskali usmjerava dalju procjenu: emocije (SMFQ, SCARED), pažnja (SNAP-IV, opservacija na času), ponašanje (razgovor s razrednikom, SDQ za nastavnika).',
      'PSC-17 je skrining, a ne dijagnoza. Pozitivan rezultat znači „vrijedi pogledati detaljnije“.',
    ],
    uputa: { roditelj: 'Emocionalno i tjelesno zdravlje idu zajedno. Roditelji često prvi primijete promjene u ponašanju, osjećanjima ili učenju djeteta. Za svaku tvrdnju označite koliko često se odnosi na Vaše dijete.' },
    uvodStavki: { roditelj: 'Moje dijete…' },
    stavke: {
      roditelj: [
        'Nemirno je, ne može mirno sjediti',
        'Tužno je, nesretno',
        'Previše sanjari',
        'Odbija da dijeli s drugima',
        'Ne razumije osjećanja drugih',
        'Osjeća se beznadežno',
        'Teško se koncentriše',
        'Tuče se s drugom djecom',
        'Loše misli o sebi, potcjenjuje se',
        'Krivi druge za svoje probleme',
        'Izgleda da manje uživa u stvarima nego ranije',
        'Ne poštuje pravila',
        'Ponaša se kao da je „navijeno“, stalno u pokretu',
        'Zadirkuje druge',
        'Mnogo se brine',
        'Uzima stvari koje mu ne pripadaju',
        'Lako mu odluta pažnja',
      ],
    },
    odgovori: [{ v: 0, t: 'Nikad' }, { v: 1, t: 'Ponekad' }, { v: 2, t: 'Često' }],
    skale: [
      { id: 'int', naziv: 'Emocionalne teškoće (internalizacija)', stavke: [2, 6, 9, 11, 15], pragovi: [{ od: 0, nivo: 'uredno', opis: 'Ispod granice' }, { od: 5, nivo: 'povisen', opis: 'Pozitivan skrining (≥ 5)' }] },
      { id: 'paz', naziv: 'Pažnja', stavke: [1, 3, 7, 13, 17], pragovi: [{ od: 0, nivo: 'uredno', opis: 'Ispod granice' }, { od: 7, nivo: 'povisen', opis: 'Pozitivan skrining (≥ 7)' }] },
      { id: 'eks', naziv: 'Ponašanje prema drugima (eksternalizacija)', stavke: [4, 5, 8, 10, 12, 14, 16], pragovi: [{ od: 0, nivo: 'uredno', opis: 'Ispod granice' }, { od: 7, nivo: 'povisen', opis: 'Pozitivan skrining (≥ 7)' }] },
      { id: 'uk', naziv: 'Ukupno', stavke: raspon(1, 17), pragovi: [{ od: 0, nivo: 'uredno', opis: 'Ispod granice' }, { od: 15, nivo: 'povisen', opis: 'Pozitivan skrining (≥ 15)' }] },
    ],
    licenca: 'Besplatan (Massachusetts General Hospital). Prevodi su dozvoljeni, a autori mole da im se pošalje kopija prevoda.',
    izvor: 'Gardner, W., Murphy, J. M., Childs, G. i sar. (1999). The PSC-17: A brief Pediatric Symptom Checklist with psychosocial problem subscales. Ambulatory Child Health, 5, 225–236.',
    linkovi: [{ naziv: 'PSC – Massachusetts General Hospital', url: 'https://www.massgeneral.org/psychiatry/treatments-and-services/pediatric-symptom-checklist' }],
    prevod: RADNI_PREVOD,
  },
  {
    id: 'sdq',
    kratko: 'SDQ',
    naziv: 'Upitnik snaga i poteškoća',
    izvorni: 'Strengths and Difficulties Questionnaire',
    oblast: 'Opšti skrining',
    ikona: '🧭',
    uzrast: '4–17 godina; samoprocjena od 11 godina',
    informanti: ['roditelj', 'nastavnik', 'dijete'],
    trajanje: '5–10 minuta',
    trajanjeMin: 20,
    brojPitanja: 25,
    nacin: 'skale',
    mjeri: 'Najkorišteniji opšti skrining u školama: emocionalni simptomi, problemi u ponašanju, hiperaktivnost i nepažnja, problemi s vršnjacima i prosocijalno ponašanje (snaga).',
    kada: [
      'Razrednik popunjava za učenika o kojem je zabrinut (verzija za nastavnika je odlična za školu).',
      'Poređenje viđenja roditelja, nastavnika i samog učenika (11+).',
      'Prije upućivanja Centru za mentalno zdravlje ili Stručnom tijelu.',
    ],
    tumacenje: [
      'Popuni službeni bosanski obrazac, saberi bodove podskala po uputstvu (sdqinfo.org) i upiši ih u app – app pokaže da li je rezultat uobičajen, graničan ili odstupajući.',
      'Granice su iz izvornih (britanskih) normi; validacija postoji i za Hrvatsku. Razlike između roditelja i nastavnika su same po sebi korisna informacija (npr. teškoće samo u školi).',
      'Prosocijalno ponašanje je snaga: nizak rezultat je odstupajući.',
    ],
    skale: [
      { id: 'emo', naziv: 'Emocionalni simptomi', max: 10, pragovi: { roditelj: SDQ_TRI(4, 5), nastavnik: SDQ_TRI(5, 6), dijete: SDQ_TRI(6, 7) } },
      { id: 'pon', naziv: 'Problemi u ponašanju', max: 10, pragovi: { roditelj: SDQ_TRI(3, 4), nastavnik: SDQ_TRI(3, 4), dijete: SDQ_TRI(4, 5) } },
      { id: 'hip', naziv: 'Hiperaktivnost / nepažnja', max: 10, pragovi: { roditelj: SDQ_TRI(6, 7), nastavnik: SDQ_TRI(6, 7), dijete: SDQ_TRI(6, 7) } },
      { id: 'vrs', naziv: 'Problemi s vršnjacima', max: 10, pragovi: { roditelj: SDQ_TRI(3, 4), nastavnik: SDQ_TRI(4, 5), dijete: SDQ_TRI(4, 6) } },
      { id: 'pro', naziv: 'Prosocijalno ponašanje (snaga)', max: 10, pragovi: { roditelj: SDQ_PROSOC, nastavnik: SDQ_PROSOC, dijete: SDQ_PROSOC } },
      { id: 'uk', naziv: 'Ukupne teškoće', izSkala: ['emo', 'pon', 'hip', 'vrs'], pragovi: { roditelj: SDQ_TRI(14, 17), nastavnik: SDQ_TRI(12, 16), dijete: SDQ_TRI(16, 20) } },
    ],
    licenca: 'Besplatan za nekomercijalnu upotrebu na papiru. Ne smije se mijenjati ni prevoditi, a elektronske verzije traže dozvolu (Youthinmind). Zato se koristi zvanični bosanski obrazac, a app samo tumači bodove podskala.',
    izvor: 'Goodman, R. (1997). The Strengths and Difficulties Questionnaire: A research note. Journal of Child Psychology and Psychiatry, 38, 581–586.',
    linkovi: [
      { naziv: 'SDQ obrasci (izaberi „Bosnian“)', url: 'https://www.sdqinfo.org/a0.html' },
      { naziv: 'Validacija na hrvatskom uzorku (Hrčak)', url: 'https://hrcak.srce.hr/193756' },
    ],
  },

  // ---------------- Anksioznost ----------------
  {
    id: 'scared',
    kratko: 'SCARED',
    naziv: 'Skrining anksioznosti kod djece',
    izvorni: 'Screen for Child Anxiety Related Emotional Disorders',
    oblast: 'Anksioznost',
    ikona: '🌧',
    uzrast: '8–18 godina',
    informanti: ['dijete', 'roditelj'],
    trajanje: '10–15 minuta',
    trajanjeMin: 30,
    brojPitanja: 41,
    nacin: 'bodovanje',
    mjeri: 'Anksioznost s pet podskala: panika i tjelesni simptomi, generalizovana anksioznost, separaciona anksioznost, socijalna anksioznost i izbjegavanje škole.',
    kada: [
      'Tjelesne tegobe bez medicinskog uzroka (bol u stomaku, stezanje u grudima) u situacijama pritiska.',
      'Strah od ocjenjivanja, odbijanje škole, česti odlasci kući.',
      'Dijete koje se teško odvaja od roditelja ili izbjegava govor pred razredom.',
    ],
    tumacenje: [
      'Ukupno ≥ 25 upućuje na mogući anksiozni poremećaj; ≥ 30 je specifičnije.',
      'Podskala „panika / tjelesni simptomi“ je posebno korisna kod djece s tjelesnim tegobama.',
      'Za mlađu djecu (8–11) pitanja čitaj naglas i objasni nepoznate riječi.',
    ],
    odgovori: [
      { v: 0, t: 'Nije tačno ili skoro nikad' },
      { v: 1, t: 'Donekle ili ponekad tačno' },
      { v: 2, t: 'Veoma ili često tačno' },
    ],
    skale: [
      { id: 'pan', naziv: 'Panika / tjelesni simptomi', stavke: [1, 6, 9, 12, 15, 18, 19, 22, 24, 27, 30, 34, 38], pragovi: [{ od: 0, nivo: 'uredno', opis: 'Ispod granice' }, { od: 7, nivo: 'povisen', opis: 'Povišeno (≥ 7)' }] },
      { id: 'gad', naziv: 'Generalizovana anksioznost', stavke: [5, 7, 14, 21, 23, 28, 33, 35, 37], pragovi: [{ od: 0, nivo: 'uredno', opis: 'Ispod granice' }, { od: 9, nivo: 'povisen', opis: 'Povišeno (≥ 9)' }] },
      { id: 'sep', naziv: 'Separaciona anksioznost', stavke: [4, 8, 13, 16, 20, 25, 29, 31], pragovi: [{ od: 0, nivo: 'uredno', opis: 'Ispod granice' }, { od: 5, nivo: 'povisen', opis: 'Povišeno (≥ 5)' }] },
      { id: 'soc', naziv: 'Socijalna anksioznost', stavke: [3, 10, 26, 32, 39, 40, 41], pragovi: [{ od: 0, nivo: 'uredno', opis: 'Ispod granice' }, { od: 8, nivo: 'povisen', opis: 'Povišeno (≥ 8)' }] },
      { id: 'skl', naziv: 'Izbjegavanje škole', stavke: [2, 11, 17, 36], pragovi: [{ od: 0, nivo: 'uredno', opis: 'Ispod granice' }, { od: 3, nivo: 'povisen', opis: 'Povišeno (≥ 3)' }] },
      { id: 'uk', naziv: 'Ukupno', stavke: raspon(1, 41), pragovi: [{ od: 0, nivo: 'uredno', opis: 'Ispod granice' }, { od: 25, nivo: 'povisen', opis: 'Moguć anksiozni poremećaj (≥ 25)' }, { od: 30, nivo: 'povisen', opis: 'Visoka vjerovatnoća anksioznog poremećaja (≥ 30)' }] },
    ],
    licenca: 'Besplatan (Univerzitet u Pittsburghu, B. Birmaher). Za prevod i objavljivanje prevoda autor traži dozvolu, pa app ne sadrži pitanja – samo bodovanje. Za bosanski prevod piši autoru (adresa je na obrascu).',
    izvor: 'Birmaher, B., Brent, D. A., Chiappetta, L. i sar. (1999). Psychometric properties of the SCARED: A replication study. Journal of the American Academy of Child and Adolescent Psychiatry, 38(10), 1230–1236.',
    linkovi: [
      { naziv: 'SCARED – obrazac za dijete (PDF)', url: 'https://pediatricbipolar.pitt.edu/sites/default/files/assets/SCAREDChildVersion_1.19.18.pdf' },
      { naziv: 'SCARED – opis i verzije (AIMS)', url: 'https://aims.uw.edu/resource/screen-for-child-anxiety-related-disorders-scared' },
    ],
  },
  {
    id: 'gad7',
    kratko: 'GAD-7',
    naziv: 'Skala generalizovane anksioznosti',
    izvorni: 'Generalized Anxiety Disorder-7',
    oblast: 'Anksioznost',
    ikona: '🌀',
    uzrast: '11+ godina (6.–9. razred)',
    informanti: ['dijete'],
    trajanje: '2–3 minute',
    trajanjeMin: 10,
    brojPitanja: 7,
    nacin: 'u-appu',
    mjeri: 'Kratki skrining izražene brige i napetosti u posljednje dvije sedmice.',
    kada: [
      'Stariji učenik koji kaže da je „stalno pod stresom“, napet ili ne može prestati da brine.',
      'Prije i poslije savjetodavnog rada (praćenje promjene).',
    ],
    tumacenje: [
      '5–9 blaga, 10–14 umjerena, 15–21 izražena anksioznost. Rezultat ≥ 10 traži dalju procjenu.',
      'Kod mlađe djece radije koristi SCARED.',
    ],
    uputa: { dijete: 'Koliko su te često u posljednje dvije sedmice mučili sljedeći problemi? Za svaki red označi jedan odgovor.' },
    stavke: {
      dijete: [
        'Osjećao/la sam se nervozno, uznemireno ili napeto',
        'Nisam mogao/la prestati da se brinem ili da kontrolišem brigu',
        'Previše sam se brinuo/la o različitim stvarima',
        'Teško mi je bilo da se opustim',
        'Bio/la sam toliko nemiran/na da mi je bilo teško mirno sjediti',
        'Lako sam se iznervirao/la ili postao/la razdražljiv/a',
        'Plašio/la sam se kao da bi se moglo desiti nešto strašno',
      ],
    },
    odgovori: OPC_PHQ,
    skale: [
      { id: 'uk', naziv: 'Ukupno (0–21)', stavke: raspon(1, 7), pragovi: [
        { od: 0, nivo: 'uredno', opis: 'Minimalna anksioznost (0–4)' },
        { od: 5, nivo: 'granicno', opis: 'Blaga anksioznost (5–9)' },
        { od: 10, nivo: 'povisen', opis: 'Umjerena anksioznost (10–14) – dalja procjena' },
        { od: 15, nivo: 'povisen', opis: 'Izražena anksioznost (15–21) – dalja procjena' },
      ] },
    ],
    dodatna: { dijete: [{ id: 'tesk', tekst: 'Ako ti se dešava nešto od navedenog, koliko ti to otežava školske obaveze, stvari kod kuće ili slaganje s drugima?', opcije: OPC_TESKOCA }] },
    licenca: 'Pfizer: dozvoljeno umnožavanje, prevod, prikaz i distribucija bez posebne dozvole.',
    izvor: 'Spitzer, R. L., Kroenke, K., Williams, J. B. W. i Löwe, B. (2006). A brief measure for assessing generalized anxiety disorder: The GAD-7. Archives of Internal Medicine, 166, 1092–1097.',
    linkovi: [{ naziv: 'PHQ i GAD-7 – službena stranica i prevodi', url: 'https://www.phqscreeners.com/' }],
    prevod: RADNI_PREVOD,
  },
  {
    id: 'rcads',
    kratko: 'RCADS',
    naziv: 'Revidirana skala anksioznosti i depresivnosti kod djece',
    izvorni: 'Revised Child Anxiety and Depression Scale',
    oblast: 'Anksioznost',
    ikona: '📐',
    uzrast: '8–18 godina',
    informanti: ['dijete', 'roditelj'],
    trajanje: '10–15 minuta (kratka verzija 5 minuta)',
    trajanjeMin: 30,
    brojPitanja: 47,
    nacin: 'link',
    mjeri: 'Šest podskala: separaciona, generalizovana i socijalna anksioznost, panika, opsesivno-kompulzivni simptomi i depresivnost. Postoji i kratka verzija od 25 pitanja.',
    kada: [
      'Detaljnija procjena kad SCARED ili SMFQ pokažu povišen rezultat.',
      'Kad treba istovremeno pogledati anksioznost i depresivnost.',
    ],
    tumacenje: [
      'Bodovanje i T-vrijednosti po uzrastu i spolu su u Excel tabeli na stranici RCADS-a. T ≥ 65 je granično, T ≥ 70 klinički povišeno.',
      'Službeni srpski prevod je na ćirilici; s mlađom djecom pitanja čitaj naglas.',
    ],
    skale: [],
    licenca: 'Besplatan za upotrebu (UCLA, B. Chorpita). Postoji službeni srpski prevod. Uslove korištenja provjeri na stranici RCADS-a.',
    izvor: 'Chorpita, B. F., Yim, L., Moffitt, C., Umemoto, L. A. i Francis, S. E. (2000). Assessment of symptoms of DSM-IV anxiety and depression in children: A revised child anxiety and depression scale. Behaviour Research and Therapy, 38, 835–855.',
    linkovi: [
      { naziv: 'RCADS – verzije i prevodi (UCLA)', url: 'https://rcads.ucla.edu/versions' },
      { naziv: 'RCADS – često postavljana pitanja', url: 'https://rcads.ucla.edu/FAQ' },
    ],
  },

  // ---------------- Raspoloženje ----------------
  {
    id: 'smfq',
    kratko: 'SMFQ',
    naziv: 'Kratki upitnik raspoloženja i osjećanja',
    izvorni: 'Short Mood and Feelings Questionnaire',
    oblast: 'Raspoloženje',
    ikona: '🌥',
    uzrast: '8–16 godina (3.–9. razred)',
    informanti: ['dijete', 'roditelj'],
    trajanje: '3–5 minuta',
    trajanjeMin: 15,
    brojPitanja: 13,
    nacin: 'u-appu',
    mjeri: 'Depresivne simptome u posljednje dvije sedmice: tuga, gubitak zadovoljstva, umor, samokritičnost, usamljenost.',
    kada: [
      'Dijete koje je povučeno, tužno, plačljivo ili je naglo „palo“ u uspjehu.',
      'Nakon gubitka, razvoda roditelja, vršnjačkog nasilja.',
      'Mlađi učenici, kod kojih PHQ-A još nije prikladan.',
    ],
    tumacenje: [
      'Ukupno ≥ 12 je najčešće korištena granica za mogućnost depresije i traži dalju procjenu i razgovor s roditeljima.',
      'Rezultat 8–11 je povišen, ali ispod granice: prati dijete i ponovi upitnik za 4–6 sedmica.',
      'Za roditeljsku verziju nema jedinstvene granice; koristi isti prag orijentaciono i poredi s djetetovim odgovorima.',
    ],
    uputa: {
      dijete: 'Ovo je lista rečenica o tome kako se možeš osjećati ili ponašati. Za svaku rečenicu označi koliko je bila tačna za tebe u posljednje dvije sedmice.',
      roditelj: 'Ovo je lista rečenica o tome kako se dijete može osjećati ili ponašati. Za svaku rečenicu označite koliko je bila tačna za Vaše dijete u posljednje dvije sedmice.',
    },
    uvodStavki: { dijete: 'U posljednje dvije sedmice…', roditelj: 'U posljednje dvije sedmice moje dijete…' },
    stavke: {
      dijete: [
        'Osjećao/la sam se jadno ili nesretno',
        'Ni u čemu nisam uživao/la',
        'Bio/la sam toliko umoran/na da sam samo sjedio/la i ništa nisam radio/la',
        'Bio/la sam veoma nemiran/na',
        'Osjećao/la sam da više ništa ne valjam',
        'Mnogo sam plakao/la',
        'Bilo mi je teško da razmišljam ili da se koncentrišem',
        'Mrzio/la sam sebe',
        'Bio/la sam loša osoba',
        'Osjećao/la sam se usamljeno',
        'Mislio/la sam da me niko zaista ne voli',
        'Mislio/la sam da nikad neću biti dobar/ra kao druga djeca',
        'Sve sam radio/la pogrešno',
      ],
      roditelj: [
        'Osjećalo se jadno ili nesretno',
        'Ni u čemu nije uživalo',
        'Bilo je toliko umorno da je samo sjedilo i ništa nije radilo',
        'Bilo je veoma nemirno',
        'Osjećalo je da više ništa ne valja',
        'Mnogo je plakalo',
        'Bilo mu je teško da razmišlja ili da se koncentriše',
        'Mrzilo je sebe',
        'Govorilo je ili mislilo da je loša osoba',
        'Osjećalo se usamljeno',
        'Mislilo je da ga niko zaista ne voli',
        'Mislilo je da nikad neće biti dobro kao druga djeca',
        'Mislilo je da sve radi pogrešno',
      ],
    },
    odgovori: [{ v: 0, t: 'Nije tačno' }, { v: 1, t: 'Ponekad' }, { v: 2, t: 'Tačno' }],
    skale: [
      { id: 'uk', naziv: 'Ukupno (0–26)', stavke: raspon(1, 13), pragovi: [
        { od: 0, nivo: 'uredno', opis: 'Ispod granice' },
        { od: 8, nivo: 'granicno', opis: 'Povišeno, ispod granice (8–11) – pratiti' },
        { od: 12, nivo: 'povisen', opis: 'Iznad granice (≥ 12) – moguća depresivnost, dalja procjena' },
      ] },
    ],
    licenca: 'Besplatan za kliničku i istraživačku upotrebu (Duke University), uz navođenje autora.',
    izvor: 'Angold, A., Costello, E. J., Messer, S. C., Pickles, A., Winder, F. i Silver, D. (1995). The development of a short questionnaire for use in epidemiological studies of depression in children and adolescents. International Journal of Methods in Psychiatric Research, 5, 237–249.',
    linkovi: [{ naziv: 'MFQ i SMFQ – Duke University', url: 'https://psychiatry.duke.edu/research/research-programs-areas/assessment-intervention/developmental-epidemiology-instruments-0' }],
    prevod: RADNI_PREVOD,
  },
  {
    id: 'phqa',
    kratko: 'PHQ-A',
    naziv: 'Upitnik raspoloženja za adolescente',
    izvorni: 'PHQ-9 Modified for Adolescents (PHQ-A)',
    oblast: 'Raspoloženje',
    ikona: '🌫',
    uzrast: '11–17 godina (6.–9. razred)',
    informanti: ['dijete'],
    trajanje: '3–5 minuta',
    trajanjeMin: 15,
    brojPitanja: 9,
    nacin: 'u-appu',
    mjeri: 'Depresivne simptome kod adolescenata u posljednje dvije sedmice, s pitanjima o mislima o smrti i ranijim pokušajima.',
    kada: [
      'Stariji učenik s tugom, razdražljivošću, povlačenjem, padom uspjeha.',
      'Uvijek kad postoji sumnja na samopovređivanje – uz obavezan razgovor.',
    ],
    tumacenje: [
      '0–4 minimalno, 5–9 blago, 10–14 umjereno, 15–19 umjereno teško, 20–27 teško. Rezultat ≥ 10 traži dalju procjenu i razgovor s roditeljima.',
      'Svaki odgovor osim „nimalo“ na pitanju 9 i odgovor „da“ na pitanjima o mislima o samoubistvu ili pokušaju traže ISTI DAN razgovor i postupanje po protokolu – bez obzira na ukupan rezultat.',
      'Ne daj ovaj upitnik ako tog dana nemaš vremena za razgovor poslije njega.',
    ],
    upozorenje: 'Sadrži pitanja o mislima o smrti i samopovređivanju. Koristi ga samo kad isti dan možeš razgovarati s učenikom i postupiti po protokolu.',
    uputa: { dijete: 'Koliko su te često u posljednje dvije sedmice mučili sljedeći problemi? Za svaki red označi odgovor koji najbolje opisuje kako si se osjećao/la.' },
    stavke: {
      dijete: [
        'Osjećao/la sam se potišteno, depresivno, razdražljivo ili bez nade',
        'Malo šta me zanimalo ili mi pričinjavalo zadovoljstvo',
        'Teško sam zaspao/la, budio/la sam se tokom noći ili sam previše spavao/la',
        'Imao/la sam slab apetit, gubio/la težinu ili sam se prejedao/la',
        'Osjećao/la sam se umorno ili bez energije',
        'Loše sam mislio/la o sebi – da sam neuspješan/na ili da sam iznevjerio/la sebe ili porodicu',
        'Teško sam se koncentrisao/la na stvari kao što su školski zadaci, čitanje ili gledanje televizije',
        'Kretao/la sam se ili govorio/la toliko sporo da su drugi to mogli primijetiti – ili suprotno, bio/la sam toliko nemiran/na da sam se kretao/la mnogo više nego obično',
        'Imao/la sam misli da bi mi bilo bolje da sam mrtav/va ili da se na neki način povrijedim',
      ],
    },
    odgovori: OPC_PHQ,
    skale: [
      { id: 'uk', naziv: 'Ukupno (0–27)', stavke: raspon(1, 9), pragovi: [
        { od: 0, nivo: 'uredno', opis: 'Minimalni simptomi (0–4)' },
        { od: 5, nivo: 'granicno', opis: 'Blagi simptomi (5–9)' },
        { od: 10, nivo: 'povisen', opis: 'Umjereni simptomi (10–14) – dalja procjena' },
        { od: 15, nivo: 'povisen', opis: 'Umjereno teški simptomi (15–19) – upućivanje' },
        { od: 20, nivo: 'alarm', opis: 'Teški simptomi (20–27) – hitno upućivanje' },
      ] },
    ],
    alarmStavke: [{ stavka: 9, od: 1, poruka: ALARM_SAMOPOVREDJIVANJE }],
    dodatna: {
      dijete: [
        { id: 'godina', tekst: 'Da li si se u posljednjih godinu dana većinu dana osjećao/la depresivno ili tužno, iako si se ponekad osjećao/la dobro?', opcije: OPC_DA_NE, alarmOd: 1, nivo: 'info', poruka: 'Dugotrajno tužno raspoloženje (godinu dana) – pitaj u razgovoru i uzmi u obzir pri upućivanju.' },
        { id: 'tesk', tekst: 'Ako ti se dešava nešto od navedenog, koliko ti to otežava školske obaveze, stvari kod kuće ili slaganje s drugima?', opcije: OPC_TESKOCA },
        { id: 'misli', tekst: 'Da li je u posljednjih mjesec dana bilo trenutaka kada si ozbiljno razmišljao/la o tome da oduzmeš sebi život?', opcije: OPC_DA_NE, alarmOd: 1, poruka: ALARM_SAMOPOVREDJIVANJE },
        { id: 'pokusaj', tekst: 'Da li si ikada u životu pokušao/la da oduzmeš sebi život?', opcije: OPC_DA_NE, alarmOd: 1, poruka: 'Raniji pokušaj samoubistva je najjači faktor rizika. Isti dan procjena rizika, obavještavanje roditelja i direktora, upućivanje Centru za mentalno zdravlje.' },
      ],
    },
    licenca: 'Pfizer: dozvoljeno umnožavanje, prevod, prikaz i distribucija bez posebne dozvole (PHQ-9; verzija za adolescente uz dozvolu autora).',
    izvor: 'Johnson, J. G., Harris, E. S., Spitzer, R. L. i Williams, J. B. W. (2002). The Patient Health Questionnaire for Adolescents. Journal of Adolescent Health, 30, 196–204.',
    linkovi: [{ naziv: 'PHQ – službena stranica i prevodi', url: 'https://www.phqscreeners.com/' }],
    prevod: RADNI_PREVOD,
  },

  // ---------------- Trauma i rizik ----------------
  {
    id: 'cries8',
    kratko: 'CRIES-8',
    naziv: 'Revidirana skala uticaja događaja za djecu',
    izvorni: "Children's Revised Impact of Event Scale (8 items)",
    oblast: 'Trauma i rizik',
    ikona: '⚡',
    uzrast: '8+ godina',
    informanti: ['dijete'],
    trajanje: '3–5 minuta',
    trajanjeMin: 15,
    brojPitanja: 8,
    nacin: 'bodovanje',
    mjeri: 'Posttraumatske reakcije nakon teškog događaja: nametanje misli i slika (intruzija) i izbjegavanje.',
    kada: [
      'Nakon nesreće, smrti bliske osobe, nasilja, požara, poplave.',
      'Dijete koje „stalno misli o tome“ ili izbjegava sve što ga podsjeća na događaj.',
      'Najranije 2–4 sedmice nakon događaja (prve reakcije su često prolazne).',
    ],
    tumacenje: [
      'Ukupno ≥ 17 upućuje na mogući PTSP i traži procjenu kod stručnjaka (Centar za mentalno zdravlje).',
      'Odgovori se boduju 0 – 1 – 3 – 5 (nimalo – rijetko – ponekad – često).',
    ],
    odgovori: [{ v: 0, t: 'Nimalo' }, { v: 1, t: 'Rijetko' }, { v: 3, t: 'Ponekad' }, { v: 5, t: 'Često' }],
    skale: [
      { id: 'uk', naziv: 'Ukupno (0–40)', stavke: raspon(1, 8), pragovi: [{ od: 0, nivo: 'uredno', opis: 'Ispod granice' }, { od: 17, nivo: 'povisen', opis: 'Iznad granice (≥ 17) – moguć PTSP, upućivanje' }] },
    ],
    licenca: 'Besplatan (Children and War Foundation), uz registraciju. Postoji službena bosanska verzija. Ne smije se mijenjati, pa app ne sadrži pitanja – samo bodovanje.',
    izvor: 'Perrin, S., Meiser-Stedman, R. i Smith, P. (2005). The Children’s Revised Impact of Event Scale (CRIES): Validity as a screening instrument for PTSD. Behavioural and Cognitive Psychotherapy, 33, 487–498.',
    linkovi: [{ naziv: 'Children and War Foundation – CRIES (bosanski)', url: 'https://www.childrenandwar.org/measures/' }],
  },
  {
    id: 'cssrs',
    kratko: 'C-SSRS',
    naziv: 'Columbia skala procjene suicidalnog rizika',
    izvorni: 'Columbia-Suicide Severity Rating Scale (Screener)',
    oblast: 'Trauma i rizik',
    ikona: '🛟',
    uzrast: '6+ godina (verzija za djecu)',
    informanti: ['dijete'],
    trajanje: '5 minuta (strukturisan razgovor)',
    trajanjeMin: 30,
    brojPitanja: 6,
    nacin: 'link',
    mjeri: 'Prisustvo i ozbiljnost misli o samoubistvu i suicidalnog ponašanja – vodi razgovor kroz nekoliko jasnih pitanja.',
    kada: [
      'Dijete spominje smrt, samopovređivanje, „nema smisla“, ima ožiljke ili posjekotine.',
      'Pozitivan odgovor na pitanje 9 u PHQ-A.',
      'Nakon samoubistva u školi ili okruženju.',
    ],
    tumacenje: [
      'Prije upotrebe obavezna je besplatna online obuka (oko 30 minuta).',
      'Rezultat određuje hitnost: odmah obavijestiti roditelje i direktora, ne ostavljati dijete samo, upućivanje Centru za mentalno zdravlje ili hitnoj službi.',
    ],
    skale: [],
    licenca: 'Besplatan za škole i zdravstvo, uz besplatnu obuku. Postoje bosanska i hrvatska verzija.',
    izvor: 'Posner, K., Brown, G. K., Stanley, B. i sar. (2011). The Columbia–Suicide Severity Rating Scale. American Journal of Psychiatry, 168, 1266–1277.',
    linkovi: [
      { naziv: 'C-SSRS – prevodi (bosanski, hrvatski)', url: 'https://cssrs.columbia.edu/the-columbia-scale-c-ssrs/translations/' },
      { naziv: 'C-SSRS – besplatna obuka', url: 'https://cssrs.columbia.edu/training/training-research-setting/' },
    ],
  },

  // ---------------- Pažnja i ponašanje ----------------
  {
    id: 'snap4',
    kratko: 'SNAP-IV',
    naziv: 'Skala procjene pažnje, hiperaktivnosti i prkosa',
    izvorni: 'Swanson, Nolan and Pelham Rating Scale – IV (26 items)',
    oblast: 'Pažnja i ponašanje',
    ikona: '🎯',
    uzrast: '6–18 godina',
    informanti: ['nastavnik', 'roditelj'],
    trajanje: '10 minuta',
    trajanjeMin: 20,
    brojPitanja: 26,
    nacin: 'bodovanje',
    mjeri: 'Simptome nepažnje (1–9), hiperaktivnosti i impulsivnosti (10–18) te prkosnog ponašanja (19–26), kako ih vidi nastavnik ili roditelj.',
    kada: [
      'Nastavnik se žali na nepažnju, nemir, upadanje u riječ.',
      'Prije upućivanja na pregled zbog sumnje na ADHD – uvijek procjena i nastavnika i roditelja.',
      'Za praćenje efekta prilagodbi u nastavi.',
    ],
    tumacenje: [
      'Računa se prosjek po pitanju za svaku podskalu i poredi s granicom za gornjih 5 % (posebno za nastavnika i roditelja).',
      'Povišen rezultat NIJE dijagnoza ADHD-a; potrebna je procjena kod nadležnog (pedijatar, dječiji psihijatar), uz podatke iz više okruženja.',
    ],
    odgovori: [{ v: 0, t: 'Nimalo' }, { v: 1, t: 'Malo' }, { v: 2, t: 'Prilično' }, { v: 3, t: 'Jako mnogo' }],
    skale: [
      { id: 'paz', naziv: 'Nepažnja (1–9)', stavke: raspon(1, 9), nacin: 'prosjek', pragovi: {
        nastavnik: [{ od: 0, nivo: 'uredno', opis: 'Ispod granice' }, { od: 2.56, nivo: 'povisen', opis: 'Gornjih 5 % (nastavnik ≥ 2,56)' }],
        roditelj: [{ od: 0, nivo: 'uredno', opis: 'Ispod granice' }, { od: 1.78, nivo: 'povisen', opis: 'Gornjih 5 % (roditelj ≥ 1,78)' }],
      } },
      { id: 'hip', naziv: 'Hiperaktivnost / impulsivnost (10–18)', stavke: raspon(10, 18), nacin: 'prosjek', pragovi: {
        nastavnik: [{ od: 0, nivo: 'uredno', opis: 'Ispod granice' }, { od: 1.78, nivo: 'povisen', opis: 'Gornjih 5 % (nastavnik ≥ 1,78)' }],
        roditelj: [{ od: 0, nivo: 'uredno', opis: 'Ispod granice' }, { od: 1.44, nivo: 'povisen', opis: 'Gornjih 5 % (roditelj ≥ 1,44)' }],
      } },
      { id: 'odd', naziv: 'Prkosno ponašanje (19–26)', stavke: raspon(19, 26), nacin: 'prosjek', pragovi: {
        nastavnik: [{ od: 0, nivo: 'uredno', opis: 'Ispod granice' }, { od: 1.38, nivo: 'povisen', opis: 'Gornjih 5 % (nastavnik ≥ 1,38)' }],
        roditelj: [{ od: 0, nivo: 'uredno', opis: 'Ispod granice' }, { od: 1.88, nivo: 'povisen', opis: 'Gornjih 5 % (roditelj ≥ 1,88)' }],
      } },
    ],
    licenca: '© J. M. Swanson. Kliničari ga smiju umnožavati za rad sa svojim klijentima; elektronska reprodukcija traži dozvolu, pa app ne sadrži pitanja – samo bodovanje.',
    izvor: 'Swanson, J. M. (1992). School-based assessments and interventions for ADD students. Irvine, CA: KC Publishing; Bussing, R. i sar. (2008). Parent and teacher SNAP-IV ratings. Assessment, 15(3), 317–328.',
    linkovi: [
      { naziv: 'SNAP-IV obrazac (PDF)', url: 'https://depts.washington.edu/dbpeds/Screening%20Tools/SNAP.pdf' },
      { naziv: 'SNAP-IV uputstvo za bodovanje (PDF)', url: 'https://www.addrc.org/wp-content/uploads/2009/10/snap-iv-instructions.pdf' },
    ],
  },

  // ---------------- Slika o sebi i dobrobit ----------------
  {
    id: 'rses',
    kratko: 'RSES',
    naziv: 'Rosenbergova skala samopoštovanja',
    izvorni: 'Rosenberg Self-Esteem Scale',
    oblast: 'Slika o sebi i dobrobit',
    ikona: '🪞',
    uzrast: '11+ godina (od 5. razreda uz čitanje naglas)',
    informanti: ['dijete'],
    trajanje: '3 minute',
    trajanjeMin: 10,
    brojPitanja: 10,
    nacin: 'u-appu',
    mjeri: 'Opšte samopoštovanje – kako učenik vrednuje sebe.',
    kada: [
      'Učenik koji se potcjenjuje, odustaje unaprijed, „ne valjam ni za šta“.',
      'Rad na samopouzdanju (prije i poslije), vršnjačko nasilje, perfekcionizam.',
    ],
    tumacenje: [
      'Raspon 0–30. Orijentaciono: ispod 15 nisko samopoštovanje, 15–25 uobičajeno, iznad 25 visoko.',
      'Pitanja 2, 5, 6, 8 i 9 se boduju obrnuto (app to radi sam).',
    ],
    uputa: { dijete: 'Ispod su tvrdnje o tome kako se općenito osjećaš prema sebi. Za svaku tvrdnju označi koliko se slažeš s njom.' },
    stavke: {
      dijete: [
        'Uglavnom sam zadovoljan/na sobom',
        'Ponekad mislim da uopšte ne valjam',
        'Mislim da imam niz dobrih osobina',
        'Mogu raditi stvari jednako dobro kao većina drugih ljudi',
        'Mislim da nemam mnogo toga na šta bih mogao/la biti ponosan/na',
        'Ponekad se zaista osjećam beskorisno',
        'Mislim da sam vrijedna osoba, barem jednako kao drugi',
        'Volio/la bih kad bih više poštovao/la sebe',
        'Sve u svemu, sklon/a sam misliti da sam neuspješan/na',
        'Imam pozitivan stav prema sebi',
      ],
    },
    odgovori: [{ v: 0, t: 'Uopšte se ne slažem' }, { v: 1, t: 'Ne slažem se' }, { v: 2, t: 'Slažem se' }, { v: 3, t: 'Potpuno se slažem' }],
    obrnute: [2, 5, 6, 8, 9],
    skale: [
      { id: 'uk', naziv: 'Samopoštovanje (0–30)', stavke: raspon(1, 10), pragovi: [
        { od: 0, nivo: 'povisen', opis: 'Nisko samopoštovanje (orijentaciono < 15)' },
        { od: 15, nivo: 'uredno', opis: 'Uobičajen raspon (15–25)' },
        { od: 26, nivo: 'uredno', opis: 'Visoko samopoštovanje (> 25)' },
      ] },
    ],
    licenca: 'Javno vlasništvo (Univerzitet Maryland): slobodna upotreba, prevodi i prilagodbe, uz navođenje autora.',
    izvor: 'Rosenberg, M. (1965). Society and the adolescent self-image. Princeton, NJ: Princeton University Press.',
    linkovi: [{ naziv: 'RSES – Univerzitet Maryland', url: 'https://socy.umd.edu/about-us/rosenberg-self-esteem-scale' }],
    prevod: RADNI_PREVOD,
  },
  {
    id: 'chs',
    kratko: 'CHS',
    naziv: 'Skala nade za djecu',
    izvorni: "Children's Hope Scale",
    oblast: 'Slika o sebi i dobrobit',
    ikona: '🌱',
    uzrast: '8–16 godina (3.–9. razred)',
    informanti: ['dijete'],
    trajanje: '2 minute',
    trajanjeMin: 10,
    brojPitanja: 6,
    nacin: 'u-appu',
    mjeri: 'Nadu kao snagu: vjeru da može postići ciljeve (volja) i da zna načine kako (putevi). Korisno za savjetodavni rad usmjeren na snage.',
    kada: [
      'Učenik koji brzo odustaje ili ne vidi izlaz.',
      'Profesionalna orijentacija i postavljanje ciljeva.',
      'Praćenje napretka u savjetodavnom radu (raste li nada).',
    ],
    tumacenje: [
      'Raspon 6–36. Nema utvrđenih granica; u izvornim uzorcima prosjek je bio oko 25.',
      'Podskale: volja (pitanja 1, 3, 5) i putevi (2, 4, 6). Niska volja – rad na motivaciji i uspjesima; niski putevi – učenje rješavanja problema.',
    ],
    uputa: { dijete: 'Ispod su rečenice o tome kako djeca misle o sebi i o tome kako im ide. Pročitaj svaku rečenicu i označi koliko često je ona tačna za tebe.' },
    stavke: {
      dijete: [
        'Mislim da mi ide prilično dobro',
        'Mogu smisliti mnogo načina da dođem do stvari koje su mi u životu najvažnije',
        'Ide mi jednako dobro kao drugoj djeci mog uzrasta',
        'Kad imam problem, mogu smisliti mnogo načina da ga riješim',
        'Mislim da će mi ono što sam ranije radio/la pomoći u budućnosti',
        'Čak i kad drugi žele odustati, znam da mogu naći način da riješim problem',
      ],
    },
    odgovori: [{ v: 1, t: 'Nikad' }, { v: 2, t: 'Rijetko' }, { v: 3, t: 'Ponekad' }, { v: 4, t: 'Često' }, { v: 5, t: 'Skoro uvijek' }, { v: 6, t: 'Uvijek' }],
    skale: [
      { id: 'vol', naziv: 'Volja (1, 3, 5)', stavke: [1, 3, 5] },
      { id: 'put', naziv: 'Putevi (2, 4, 6)', stavke: [2, 4, 6] },
      { id: 'uk', naziv: 'Ukupno (6–36)', stavke: raspon(1, 6) },
    ],
    licenca: 'Besplatan, nije zaštićen autorskim pravom; navesti izvor.',
    izvor: 'Snyder, C. R., Hoza, B., Pelham, W. E. i sar. (1997). The development and validation of the Children’s Hope Scale. Journal of Pediatric Psychology, 22(3), 399–421.',
    linkovi: [{ naziv: 'Children’s Hope Scale – opis', url: 'https://cih.jhu.edu/measurement/childrens-hope-scale/' }],
    prevod: RADNI_PREVOD,
  },
  {
    id: 'kidscreen10',
    kratko: 'KIDSCREEN-10',
    naziv: 'Indeks kvaliteta života djece',
    izvorni: 'KIDSCREEN-10 Index',
    oblast: 'Slika o sebi i dobrobit',
    ikona: '☀️',
    uzrast: '8–18 godina',
    informanti: ['dijete', 'roditelj'],
    trajanje: '3 minute',
    trajanjeMin: 10,
    brojPitanja: 10,
    nacin: 'link',
    mjeri: 'Opštu dobrobit i kvalitet života: energija, raspoloženje, slobodno vrijeme, porodica, vršnjaci, škola.',
    kada: [
      'Istraživanje dobrobiti cijelog razreda ili škole (npr. na početku i kraju godine).',
      'Evaluacija preventivnog programa.',
    ],
    tumacenje: ['Bodovanje u T-vrijednostima je u priručniku KIDSCREEN. Postoji validirana srpska verzija.'],
    skale: [],
    licenca: 'Besplatan za nekomercijalnu upotrebu, uz registraciju na stranici KIDSCREEN.',
    izvor: 'Ravens-Sieberer, U. i sar. (2010). Reliability, construct and criterion validity of the KIDSCREEN-10 score. Quality of Life Research, 19, 1487–1500.',
    linkovi: [{ naziv: 'KIDSCREEN – registracija i obrasci', url: 'https://www.kidscreen.org/' }],
  },

  // ---------------- Odnosi u razredu ----------------
  {
    id: 'sociometrija',
    kratko: 'Sociometrija',
    naziv: 'Sociometrijsko ispitivanje razreda',
    izvorni: 'Sociometrijski test (J. L. Moreno)',
    oblast: 'Odnosi u razredu',
    ikona: '🕸',
    uzrast: '2.–9. razred',
    informanti: ['dijete'],
    trajanje: '10 minuta u razredu + unos',
    trajanjeMin: 45,
    brojPitanja: 1,
    nacin: 'alat',
    mjeri: 'Odnose u odjeljenju: ko je koga izabrao, uzajamna prijateljstva, najbiraniji učenici i djeca bez ijednog izbora.',
    kada: [
      'Na početku godine u novom odjeljenju (5. razred, novi učenici).',
      'Sumnja na izolaciju, isključivanje ili vršnjačko nasilje.',
      'Formiranje grupa, raspored sjedenja, plan rada razrednika.',
    ],
    tumacenje: [
      'Koristi samo pozitivne kriterije („s kim bi…“). Negativni kriteriji („s kim ne bi…“) mogu povrijediti djecu i ne preporučuju se u školi.',
      'Dijete bez ijednog izbora ili bez uzajamnog izbora treba pažnju: opservacija na odmoru, razgovor s razrednikom, uključivanje u grupni rad.',
      'Rezultati su povjerljivi: ne objavljuju se razredu i ne pokazuju učenicima.',
    ],
    skale: [],
    licenca: 'Metoda, nije zaštićena.',
    izvor: 'Moreno, J. L. (1934). Who shall survive? Washington, DC: Nervous and Mental Disease Publishing.',
    linkovi: [],
  },

  // ---------------- Praćenje ----------------
  {
    id: 'dnevnik',
    kratko: 'Dnevnik praćenja',
    naziv: 'Dnevnik praćenja tegoba i ponašanja (ABC)',
    izvorni: 'ABC (Antecedent – Behavior – Consequence) praćenje',
    oblast: 'Praćenje',
    ikona: '🗓',
    uzrast: 'svi razredi',
    informanti: ['nastavnik', 'roditelj'],
    trajanje: '1 minuta po događaju, 2 sedmice',
    trajanjeMin: 15,
    brojPitanja: 0,
    nacin: 'obrazac',
    mjeri: 'Kada, gdje i nakon čega se javljaju tegobe ili ponašanje, koliko su jaki i šta slijedi poslije (npr. odlazak kući). Pokazuje obrasce koje razgovor ne otkrije.',
    kada: [
      'Česte tjelesne tegobe u školi (bol u stomaku, glavobolja, stezanje u grudima).',
      'Ispadi u ponašanju, odbijanje rada, plač.',
      'Prije i poslije uvođenja prilagodbi.',
    ],
    tumacenje: [
      'Traži obrasce: isti predmet ili čas, prije provjere znanja, nakon kritike, ponedjeljkom, poslije odmora.',
      'Ako tegoba redovno vodi kući, odlazak kući može je nesvjesno održavati – dogovori plan „kratka pauza, pa povratak na čas“.',
    ],
    skale: [],
    licenca: 'Obrazac izrađen za ovu aplikaciju.',
    izvor: 'Uobičajena metoda funkcionalne procjene ponašanja (ABC bilježenje).',
    linkovi: [],
  },
];

export function instrument(id: string): Instrument | undefined {
  return INSTRUMENTI.find((i) => i.id === id);
}

// ---------------- Bodovanje ----------------

/** Ključevi: '1'…'N' za pitanja, 'd:<id>' za dodatna pitanja, 's:<id>' za direktan unos bodova skale. */
export type Odgovori = Record<string, number>;

export interface RezultatSkale {
  id: string;
  naziv: string;
  vrijednost: number | null;
  odgovoreno: number;
  ukupno: number;
  nivo: Nivo;
  opis: string;
}
export interface Upozorenje { nivo: Nivo; poruka: string }
export interface Rezultat {
  skale: RezultatSkale[];
  upozorenja: Upozorenje[];
  odgovoreno: number;
  ukupnoPitanja: number;
}

export function brojStavki(ins: Instrument): number {
  return ins.nacin === 'u-appu' ? Math.max(0, ...Object.values(ins.stavke ?? {}).map((s) => s?.length ?? 0)) : ins.brojPitanja;
}

function vrijednostStavke(ins: Instrument, odg: Odgovori, br: number): number | undefined {
  const v = odg[String(br)];
  if (v === undefined || v === null || Number.isNaN(v)) return undefined;
  if (ins.obrnute?.includes(br) && ins.odgovori?.length) {
    const vr = ins.odgovori.map((o) => o.v);
    return Math.min(...vr) + Math.max(...vr) - v;
  }
  return v;
}

export function pragoviZa(sk: Skala, inf: Informant): Prag[] {
  if (!sk.pragovi) return [];
  if (Array.isArray(sk.pragovi)) return sk.pragovi;
  return sk.pragovi[inf] ?? Object.values(sk.pragovi)[0] ?? [];
}

function procijeni(sk: Skala, inf: Informant, v: number): { nivo: Nivo; opis: string } {
  const p = pragoviZa(sk, inf);
  let izabran: Prag | undefined;
  for (const x of p) if (v >= x.od - 1e-9) izabran = x;
  return izabran ? { nivo: izabran.nivo, opis: izabran.opis } : { nivo: 'info', opis: '' };
}

const zaokruzi2 = (x: number) => Math.round(x * 100) / 100;

export function bodovanje(ins: Instrument, inf: Informant, odg: Odgovori): Rezultat {
  const n = brojStavki(ins);
  let odgovoreno = 0;
  for (let i = 1; i <= n; i++) if (odg[String(i)] !== undefined) odgovoreno++;

  const poId = new Map<string, RezultatSkale>();
  const skale: RezultatSkale[] = [];
  for (const sk of ins.skale) {
    let vrijednost: number | null = null;
    let odg2 = 0;
    let uk = 0;
    if (sk.stavke) {
      uk = sk.stavke.length;
      const vr = sk.stavke.map((b) => vrijednostStavke(ins, odg, b)).filter((x): x is number => x !== undefined);
      odg2 = vr.length;
      if (vr.length) {
        const zbir = vr.reduce((a, b) => a + b, 0);
        vrijednost = sk.nacin === 'prosjek' ? zaokruzi2(zbir / vr.length) : zbir;
      }
    } else if (sk.izSkala) {
      uk = sk.izSkala.length;
      const dijelovi = sk.izSkala.map((id) => poId.get(id)?.vrijednost ?? null);
      odg2 = dijelovi.filter((x) => x !== null).length;
      if (odg2 === uk) vrijednost = (dijelovi as number[]).reduce((a, b) => a + b, 0);
    } else {
      uk = 1;
      const v = odg[`s:${sk.id}`];
      if (v !== undefined && !Number.isNaN(v)) { vrijednost = v; odg2 = 1; }
    }
    const potpuno = odg2 === uk;
    let nivo: Nivo = 'info';
    let opis = '';
    if (vrijednost !== null && potpuno) ({ nivo, opis } = procijeni(sk, inf, vrijednost));
    else if (vrijednost !== null) opis = `Nepotpuno: odgovoreno ${odg2} od ${uk}`;
    const r: RezultatSkale = { id: sk.id, naziv: sk.naziv, vrijednost, odgovoreno: odg2, ukupno: uk, nivo, opis };
    poId.set(sk.id, r);
    skale.push(r);
  }

  const upozorenja: Upozorenje[] = [];
  for (const a of ins.alarmStavke ?? []) {
    const v = odg[String(a.stavka)];
    if (v !== undefined && v >= a.od) upozorenja.push({ nivo: 'alarm', poruka: `Pitanje ${a.stavka}: ${a.poruka}` });
  }
  for (const d of ins.dodatna?.[inf] ?? []) {
    const v = odg[`d:${d.id}`];
    if (d.alarmOd !== undefined && v !== undefined && v >= d.alarmOd && d.poruka) {
      if (!upozorenja.some((u) => u.poruka.endsWith(d.poruka!))) upozorenja.push({ nivo: d.nivo ?? 'alarm', poruka: d.poruka });
    }
  }
  return { skale, upozorenja, odgovoreno, ukupnoPitanja: n };
}

/**
 * Brzi unos s papira: niz cifara redom (razmaci, zarezi i crtice se preskaču).
 * Cifra koja nije ponuđeni odgovor se odbacuje i prijavljuje.
 */
export function brziUnos(ins: Instrument, tekst: string): { odgovori: Odgovori; greske: number[] } {
  const dozvoljeno = new Set((ins.odgovori ?? []).map((o) => o.v));
  const cifre = tekst.replace(/[^0-9]/g, '').split('').map(Number);
  const odgovori: Odgovori = {};
  const greske: number[] = [];
  const n = brojStavki(ins);
  cifre.slice(0, n).forEach((c, i) => {
    if (dozvoljeno.has(c)) odgovori[String(i + 1)] = c;
    else greske.push(i + 1);
  });
  return { odgovori, greske };
}

export function formatVrijednosti(v: number | null): string {
  if (v === null) return '–';
  return Number.isInteger(v) ? String(v) : v.toFixed(2).replace('.', ',');
}

/** Kratak tekstualni sažetak (za karton, print i dnevnik). */
export function sazetak(ins: Instrument, rez: Rezultat): string {
  const glavne = rez.skale.filter((s) => s.vrijednost !== null);
  const dijelovi = glavne.map((s) => `${s.naziv}: ${formatVrijednosti(s.vrijednost)}${s.opis ? ` (${s.opis})` : ''}`);
  const alarmi = rez.upozorenja.filter((u) => u.nivo === 'alarm').length;
  return `${ins.kratko} – ${dijelovi.join('; ') || 'bez rezultata'}${alarmi ? ` · ⚠ ${alarmi} upozorenje` : ''}`;
}

export function najvisiNivo(rez: Pick<Rezultat, 'skale' | 'upozorenja'>): Nivo {
  const red: Nivo[] = ['info', 'uredno', 'granicno', 'povisen', 'alarm'];
  let max = 0;
  for (const s of rez.skale) max = Math.max(max, red.indexOf(s.nivo));
  for (const u of rez.upozorenja) max = Math.max(max, red.indexOf(u.nivo));
  return red[max];
}

// ---------------- Sociometrija ----------------

export const KRITERIJI_SOCIOMETRIJE = [
  'S kim bi najradije sjedio/la u klupi?',
  'S kim bi najradije radio/la zajednički zadatak?',
  'S kim bi se najradije družio/la na odmoru i poslije škole?',
];

export interface RedSociometrije {
  sifra: string;
  dao: number;
  primio: number;
  uzajamni: number;
  odsutan: boolean;
  status: string;
  nivo: Nivo;
}
export interface RezultatSociometrije {
  redovi: RedSociometrije[];
  parovi: [string, string][];
  prosjek: number;
  sd: number;
  ukupnoIzbora: number;
  udioUzajamnih: number;
  bezIzbora: string[];
  bezUzajamnog: string[];
  najbiraniji: string[];
}

export function obradiSociometriju(sifre: string[], izbori: Record<string, string[]>, odsutni: string[] = []): RezultatSociometrije {
  const uRazredu = new Set(sifre);
  const odsutno = new Set(odsutni);
  const cisto = new Map<string, string[]>();
  for (const s of sifre) {
    if (odsutno.has(s)) { cisto.set(s, []); continue; }
    const lista = [...new Set((izbori[s] ?? []).filter((x) => x !== s && uRazredu.has(x)))];
    cisto.set(s, lista);
  }
  const primio = new Map<string, number>(sifre.map((s) => [s, 0]));
  for (const lista of cisto.values()) for (const x of lista) primio.set(x, (primio.get(x) ?? 0) + 1);
  const bira = (a: string, b: string) => cisto.get(a)?.includes(b) ?? false;

  const parovi: [string, string][] = [];
  for (let i = 0; i < sifre.length; i++) {
    for (let j = i + 1; j < sifre.length; j++) if (bira(sifre[i], sifre[j]) && bira(sifre[j], sifre[i])) parovi.push([sifre[i], sifre[j]]);
  }
  const uzajamni = (s: string) => parovi.filter(([a, b]) => a === s || b === s).length;

  const vrijednosti = sifre.map((s) => primio.get(s) ?? 0);
  const prosjek = vrijednosti.length ? vrijednosti.reduce((a, b) => a + b, 0) / vrijednosti.length : 0;
  const sd = vrijednosti.length ? Math.sqrt(vrijednosti.reduce((a, b) => a + (b - prosjek) ** 2, 0) / vrijednosti.length) : 0;
  const ukupnoIzbora = [...cisto.values()].reduce((a, l) => a + l.length, 0);
  const prisutnih = sifre.filter((s) => !odsutno.has(s)).length;

  const redovi: RedSociometrije[] = sifre.map((s) => {
    const p = primio.get(s) ?? 0;
    const u = uzajamni(s);
    let status = 'Prosječno';
    let nivo: Nivo = 'uredno';
    if (p === 0) { status = 'Bez ijednog izbora'; nivo = 'povisen'; }
    else if (p === 1) { status = 'Malo izbora'; nivo = 'granicno'; }
    else if (prisutnih >= 5 && p >= prosjek + sd && p >= 3) { status = 'Najbiraniji/a'; nivo = 'info'; }
    if (p > 0 && u === 0 && !odsutno.has(s)) { status += ' · bez uzajamnog'; if (nivo === 'uredno' || nivo === 'info') nivo = 'granicno'; }
    return { sifra: s, dao: cisto.get(s)?.length ?? 0, primio: p, uzajamni: u, odsutan: odsutno.has(s), status, nivo };
  });

  return {
    redovi,
    parovi,
    prosjek: zaokruzi2(prosjek),
    sd: zaokruzi2(sd),
    ukupnoIzbora,
    udioUzajamnih: ukupnoIzbora ? zaokruzi2((parovi.length * 2) / ukupnoIzbora) : 0,
    bezIzbora: redovi.filter((r) => r.primio === 0).map((r) => r.sifra),
    bezUzajamnog: redovi.filter((r) => r.uzajamni === 0 && !r.odsutan).map((r) => r.sifra),
    najbiraniji: redovi.filter((r) => r.status.startsWith('Najbiraniji')).map((r) => r.sifra),
  };
}
