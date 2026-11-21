// Obrasci koje psiholog popunjava, štampa i čuva u dokumentaciji.
// Napomena: zvanični obrasci za USK nisu javno objavljeni – ovi su izrađeni prema uobičajenoj
// praksi školskih psihologa u BiH i mogu se prilagoditi obrascima škole/Pedagoškog zavoda.

import type { VrstaTeksta } from './ai';

export type TipPolja = 'tekst' | 'dugi' | 'datum' | 'ucenik' | 'izbor';

export interface PoljeObrasca {
  kljuc: string;
  labela: string;
  tip: TipPolja;
  opcije?: string[];
  obavezno?: boolean;
  ai?: VrstaTeksta;
  pomoc?: string;
  zadano?: string;
}

export interface DefinicijaObrasca {
  vrsta: string;
  naslov: string; // naslov na dokumentu
  naziv: string; // naziv u listi
  opis: string;
  polja: PoljeObrasca[];
  /** uvodni tekst na dokumentu; {ucenik}, {razred}, {roditelj}… se zamjenjuju vrijednostima */
  uvod?: string;
  zavrsetak?: string;
  potpisi: string[];
  mp?: boolean; // mjesto pečata
  aiNacrt?: boolean; // AI može napisati nacrt iz evidencije učenika
}

export const OBRASCI: DefinicijaObrasca[] = [
  {
    vrsta: 'sluzbena-biljeska', naslov: 'SLUŽBENA BILJEŠKA', naziv: 'Službena bilješka',
    opis: 'Zapis o događaju, informativnom razgovoru ili saznanju (npr. iz brze bilješke).',
    polja: [
      { kljuc: 'datum', labela: 'Datum', tip: 'datum', obavezno: true },
      { kljuc: 'mjesto', labela: 'Mjesto i vrijeme', tip: 'tekst', pomoc: 'npr. hodnik škole, veliki odmor' },
      { kljuc: 'ucenik', labela: 'Učenik (ako se odnosi na učenika)', tip: 'ucenik' },
      { kljuc: 'prisutni', labela: 'Prisutni / izvor informacije', tip: 'tekst', pomoc: 'npr. razrednik 7-1, majka učenika' },
      { kljuc: 'povod', labela: 'Povod', tip: 'tekst' },
      { kljuc: 'sadrzaj', labela: 'Sadržaj bilješke', tip: 'dugi', obavezno: true, ai: 'biljeska' },
      { kljuc: 'mjere', labela: 'Preduzete mjere / naredni koraci', tip: 'dugi', ai: 'preporuke' },
    ],
    potpisi: ['Psiholog'],
  },
  {
    vrsta: 'saglasnost', naslov: 'SAGLASNOST RODITELJA / STARATELJA', naziv: 'Saglasnost roditelja',
    opis: 'Za individualni savjetodavni rad, psihološko testiranje ili upućivanje.',
    polja: [
      { kljuc: 'datum', labela: 'Datum', tip: 'datum', obavezno: true },
      { kljuc: 'ucenik', labela: 'Učenik', tip: 'ucenik', obavezno: true },
      { kljuc: 'roditelj', labela: 'Ime i prezime roditelja/staratelja', tip: 'tekst', pomoc: 'može ostati prazno – roditelj upisuje rukom' },
      { kljuc: 'svrha', labela: 'Saglasnost se daje za', tip: 'izbor', obavezno: true, opcije: [
        'individualni savjetodavni rad sa školskim psihologom',
        'psihološko testiranje i procjenu',
        'uključivanje u grupni/preventivni rad',
        'upućivanje stručnoj ustanovi i razmjenu potrebnih informacija',
      ] },
      { kljuc: 'napomena', labela: 'Napomena', tip: 'dugi' },
    ],
    uvod: 'Ja, {roditelj}, roditelj/staratelj učenika/ce {ucenik}, razred {razred}, saglasan/saglasna sam za: {svrha}.\n\nUpoznat/a sam da su svi podaci povjerljivi, da se koriste isključivo u svrhu pružanja stručne podrške djetetu, u skladu sa propisima o zaštiti ličnih podataka, te da ovu saglasnost mogu povući u bilo kojem trenutku.',
    potpisi: ['Roditelj/staratelj', 'Psiholog'],
  },
  {
    vrsta: 'poziv', naslov: 'POZIV RODITELJU / STARATELJU', naziv: 'Poziv roditelju',
    opis: 'Poziv na razgovor sa školskim psihologom.',
    polja: [
      { kljuc: 'datum', labela: 'Datum izdavanja', tip: 'datum', obavezno: true },
      { kljuc: 'ucenik', labela: 'Učenik', tip: 'ucenik', obavezno: true },
      { kljuc: 'roditelj', labela: 'Roditelj/staratelj', tip: 'tekst' },
      { kljuc: 'termin', labela: 'Datum razgovora', tip: 'datum', obavezno: true },
      { kljuc: 'vrijeme', labela: 'Vrijeme', tip: 'tekst', pomoc: 'npr. 10:30' },
      { kljuc: 'mjesto', labela: 'Mjesto', tip: 'tekst', zadano: 'kabinet psihologa' },
      { kljuc: 'razlog', labela: 'Povod (opšte, bez detalja)', tip: 'dugi', zadano: 'razgovor o napredovanju i dobrobiti Vašeg djeteta' },
    ],
    uvod: 'Poštovani/a {roditelj},\n\npozivamo Vas na razgovor sa školskim psihologom u vezi sa učenikom/com {ucenik}, razred {razred}, dana {termin} u {vrijeme} sati ({mjesto}).\n\nPovod: {razlog}.\n\nUkoliko niste u mogućnosti doći u navedenom terminu, molimo Vas da kontaktirate školu radi dogovora o drugom terminu.',
    zavrsetak: 'S poštovanjem,',
    potpisi: ['Psiholog'], mp: true,
  },
  {
    vrsta: 'misljenje', naslov: 'MIŠLJENJE PSIHOLOGA', naziv: 'Mišljenje psihologa o učeniku',
    opis: 'Za stručni tim/IOOP, upis/prelazak, Centar za socijalni rad ili roditelje. AI može napisati nacrt iz evidencije.',
    polja: [
      { kljuc: 'datum', labela: 'Datum', tip: 'datum', obavezno: true },
      { kljuc: 'ucenik', labela: 'Učenik', tip: 'ucenik', obavezno: true },
      { kljuc: 'svrha', labela: 'Svrha mišljenja', tip: 'izbor', opcije: [
        'za stručni tim škole / izradu IOOP-a', 'za upis/prelazak u drugu školu', 'za Centar za socijalni rad', 'na zahtjev roditelja', 'za odjeljensko/nastavničko vijeće', 'ostalo',
      ] },
      { kljuc: 'naslovljeno', labela: 'Dostavlja se', tip: 'tekst' },
      { kljuc: 'osnov', labela: 'Osnov (izvori podataka)', tip: 'dugi', zadano: 'Mišljenje je dato na osnovu individualnih razgovora sa učenikom, opservacije, razgovora s razrednikom i roditeljima te uvida u pedagošku dokumentaciju.' },
      { kljuc: 'nalaz', labela: 'Zapažanja i nalaz', tip: 'dugi', obavezno: true, ai: 'biljeske' },
      { kljuc: 'misljenje', labela: 'Mišljenje i preporuke', tip: 'dugi', obavezno: true, ai: 'preporuke' },
    ],
    potpisi: ['Psiholog', 'Direktor'], mp: true, aiNacrt: true,
  },
  {
    vrsta: 'dopis', naslov: 'DOPIS', naziv: 'Dopis / uputnica ustanovi',
    opis: 'Centar za socijalni rad, Centar za mentalno zdravlje, dom zdravlja…',
    polja: [
      { kljuc: 'datum', labela: 'Datum', tip: 'datum', obavezno: true },
      { kljuc: 'broj', labela: 'Broj (djelovodni)', tip: 'tekst' },
      { kljuc: 'ustanova', labela: 'Ustanova', tip: 'izbor', obavezno: true, opcije: [
        'Centar za socijalni rad', 'Centar za mentalno zdravlje', 'Dom zdravlja', 'Pedagoški zavod USK', 'Ministarstvo obrazovanja USK', 'Policijska uprava', 'Ostalo',
      ] },
      { kljuc: 'predmet', labela: 'Predmet', tip: 'tekst', obavezno: true },
      { kljuc: 'ucenik', labela: 'Učenik (ako se odnosi)', tip: 'ucenik' },
      { kljuc: 'tekst', labela: 'Tekst dopisa', tip: 'dugi', obavezno: true, ai: 'opste' },
    ],
    potpisi: ['Psiholog', 'Direktor'], mp: true,
  },
  {
    vrsta: 'strucni-tim', naslov: 'ZAPISNIK SA SASTANKA STRUČNOG TIMA', naziv: 'Zapisnik stručnog tima',
    opis: 'Sastanak stručnog tima škole (IOOP, podrška učeniku, nasilje).',
    polja: [
      { kljuc: 'datum', labela: 'Datum', tip: 'datum', obavezno: true },
      { kljuc: 'prisutni', labela: 'Prisutni', tip: 'dugi', pomoc: 'npr. direktor, pedagog, psiholog, razrednik 7-1, roditelj' },
      { kljuc: 'ucenik', labela: 'Učenik (ako se odnosi)', tip: 'ucenik' },
      { kljuc: 'dnevniRed', labela: 'Dnevni red', tip: 'dugi', obavezno: true },
      { kljuc: 'tok', labela: 'Tok sastanka', tip: 'dugi', ai: 'biljeske' },
      { kljuc: 'zakljucci', labela: 'Zaključci', tip: 'dugi', obavezno: true, ai: 'zakljucak' },
      { kljuc: 'zaduzenja', labela: 'Zaduženja i rokovi', tip: 'dugi' },
    ],
    potpisi: ['Zapisničar', 'Članovi tima'],
  },
  {
    vrsta: 'nasilje', naslov: 'EVIDENCIJA O POSTUPANJU U SLUČAJU NASILJA', naziv: 'Evidencija – slučaj nasilja',
    opis: 'Postupanje prema Protokolu o postupanju u slučaju nasilja (provjeri školski protokol).',
    polja: [
      { kljuc: 'datum', labela: 'Datum događaja', tip: 'datum', obavezno: true },
      { kljuc: 'mjesto', labela: 'Mjesto', tip: 'tekst' },
      { kljuc: 'ucenik', labela: 'Učenik (glavni akter/žrtva)', tip: 'ucenik' },
      { kljuc: 'ukljuceni', labela: 'Ostali uključeni (šifre)', tip: 'tekst' },
      { kljuc: 'oblik', labela: 'Oblik nasilja', tip: 'izbor', opcije: ['fizičko', 'verbalno', 'socijalno/relaciono', 'elektronsko/digitalno', 'seksualno', 'kombinovano', 'ostalo'] },
      { kljuc: 'nivo', labela: 'Nivo', tip: 'izbor', opcije: ['I nivo', 'II nivo', 'III nivo'] },
      { kljuc: 'opis', labela: 'Opis događaja', tip: 'dugi', obavezno: true, ai: 'biljeska' },
      { kljuc: 'mjere', labela: 'Preduzete mjere', tip: 'dugi', obavezno: true, ai: 'preporuke' },
      { kljuc: 'obavijesteni', labela: 'Obaviješteni', tip: 'tekst', pomoc: 'npr. roditelji, razrednik, direktor, CSR, policija' },
      { kljuc: 'pracenje', labela: 'Praćenje i evaluacija', tip: 'dugi' },
    ],
    potpisi: ['Psiholog', 'Direktor'],
  },
  {
    vrsta: 'plan-podrske', naslov: 'PLAN INDIVIDUALNE PODRŠKE UČENIKU', naziv: 'Plan individualne podrške',
    opis: 'Ciljevi, aktivnosti, nosioci i evaluacija podrške učeniku.',
    polja: [
      { kljuc: 'datum', labela: 'Datum izrade', tip: 'datum', obavezno: true },
      { kljuc: 'ucenik', labela: 'Učenik', tip: 'ucenik', obavezno: true },
      { kljuc: 'period', labela: 'Period realizacije', tip: 'tekst', pomoc: 'npr. novembar 2026 – januar 2027' },
      { kljuc: 'teskoce', labela: 'Uočene teškoće i potrebe', tip: 'dugi', obavezno: true, ai: 'biljeske' },
      { kljuc: 'jake', labela: 'Jake strane učenika', tip: 'dugi' },
      { kljuc: 'ciljevi', labela: 'Ciljevi', tip: 'dugi', obavezno: true, ai: 'preporuke' },
      { kljuc: 'aktivnosti', labela: 'Aktivnosti i metode', tip: 'dugi', ai: 'preporuke' },
      { kljuc: 'nosioci', labela: 'Nosioci (ko radi šta)', tip: 'tekst' },
      { kljuc: 'evaluacija', labela: 'Način i rok evaluacije', tip: 'dugi' },
    ],
    potpisi: ['Psiholog', 'Razrednik', 'Roditelj/staratelj'],
  },
  {
    vrsta: 'spremnost', naslov: 'ZAPISNIK O ISPITIVANJU SPREMNOSTI DJETETA ZA POLAZAK U ŠKOLU', naziv: 'Spremnost za školu (upis)',
    opis: 'Ispitivanje djeteta pri upisu u prvi razred.',
    polja: [
      { kljuc: 'datum', labela: 'Datum ispitivanja', tip: 'datum', obavezno: true },
      { kljuc: 'dijete', labela: 'Ime i prezime djeteta', tip: 'tekst', obavezno: true },
      { kljuc: 'rodjen', labela: 'Datum rođenja', tip: 'tekst' },
      { kljuc: 'roditelj', labela: 'Roditelj/staratelj', tip: 'tekst' },
      { kljuc: 'instrumenti', labela: 'Primijenjeni postupci/instrumenti', tip: 'tekst' },
      { kljuc: 'kognitivno', labela: 'Kognitivni razvoj', tip: 'dugi' },
      { kljuc: 'socioemocionalno', labela: 'Socio-emocionalni razvoj', tip: 'dugi' },
      { kljuc: 'motorika', labela: 'Motorika i grafomotorika', tip: 'dugi' },
      { kljuc: 'govor', labela: 'Govor i komunikacija', tip: 'dugi' },
      { kljuc: 'misljenje', labela: 'Mišljenje', tip: 'izbor', obavezno: true, opcije: [
        'dijete je spremno za polazak u školu', 'dijete je spremno uz preporučenu podršku', 'preporučuje se dodatna procjena', 'preporučuje se odgoda upisa (uz saglasnost komisije)',
      ] },
      { kljuc: 'preporuke', labela: 'Preporuke roditeljima i učitelju', tip: 'dugi', ai: 'preporuke' },
    ],
    potpisi: ['Psiholog', 'Roditelj/staratelj'],
  },
];

export const definicija = (vrsta: string) => OBRASCI.find((o) => o.vrsta === vrsta);

/** Zamjena {kljuc} u uvodu vrijednostima; prazno → crta za ručni upis. */
export function popuniUvod(uvod: string, vr: Record<string, string>): string {
  return uvod.replace(/\{(\w+)\}/g, (_m, k: string) => (vr[k]?.trim() ? vr[k].trim() : '________________'));
}
