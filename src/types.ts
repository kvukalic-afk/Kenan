export interface Zapis {
  id: string;
  createdAt: string; // ISO vrijeme
  updatedAt: string; // ISO vrijeme
}

export type StatusUcenika = 'Aktivan' | 'Ispisan' | 'Premješten';
export const STATUSI_UCENIKA: StatusUcenika[] = ['Aktivan', 'Ispisan', 'Premješten'];

export interface Ucenik extends Zapis {
  sifra: string;
  ime: string;
  prezime: string;
  razred: string;
  status: StatusUcenika;
  uPracenju: boolean;
  napomena: string;
}

/** Razred (odjeljenje) i njegov razrednik – razrednik se upisuje jednom po razredu. */
export interface Razred extends Zapis {
  razred: string; // npr. "7-1"
  razrednik: string;
}

export interface Razgovor extends Zapis {
  datum: string; // YYYY-MM-DD
  sifra: string;
  razred: string;
  vrstaKontakta: string;
  inicirao: string;
  razlog: string;
  biljeske: string;
  zakljucak: string;
  preporuke: string;
  sljedeciKorak: string;
  datumSljedecegKontakta: string; // YYYY-MM-DD ili ''
  statusSlucaja: string;
  trajanjeMin?: number | null; // za dnevnik rada (zadano 45)
}

export interface Radionica extends Zapis {
  datum: string;
  razred: string;
  tema: string;
  oblast: string;
  ciljnaGrupa: string;
  brojUcesnika: number | null;
  trajanjeMin: number | null;
  cilj: string;
  tokAktivnosti: string;
  zapazanja: string;
  ucenicizaPracenje: string[];
  evaluacija: string;
  napomena: string;
}

export interface Saradnja extends Zapis {
  datum: string;
  sifra: string; // opcionalno ('')
  ustanovaOsoba: string;
  opisOsobe: string;
  nacin: string;
  razlog: string;
  dogovorIshod: string;
  trajanjeMin?: number | null; // za dnevnik rada (zadano 30)
}

/** Ostale aktivnosti psihologa: zamjene, čas odjeljenske zajednice, dežurstvo, sjednice… */
export interface Aktivnost extends Zapis {
  datum: string;
  vrsta: string;
  razred: string;
  cas: string; // broj časa, npr. "3"
  umjestoKoga: string; // nastavnik/razrednik kojeg je psiholog mijenjao
  predmet: string;
  tema: string;
  zapazanja: string;
  napomena: string;
  trajanjeMin?: number | null; // za dnevnik rada (zadano 45)
  podrucje?: number | null; // područje rada po USK standardima (1–11), prazno = automatski
}

/** Stavka plana rada psihologa (godišnji program; mjesečni plan se dobija po mjesecima). */
export interface PlanStavka extends Zapis {
  skolskaGodina: number; // početna godina, npr. 2026 za 2026/2027
  podrucje: number; // 1–11 po USK pedagoškim standardima
  sadrzaj: string;
  mjeseci: number[]; // 1–12; prazno = tokom cijele godine
  saradnici: string;
  realizovano: string[]; // mjeseci "YYYY-MM" u kojima je stavka realizovana
  napomena: string;
}

/** Brza bilješka zapisana u hodu (hodnik, odmor…), kasnije sročena i/ili pretvorena u razgovor. */
export interface BrzaBiljeska extends Zapis {
  datum: string;
  sifra: string; // opcionalno
  tekst: string; // originalno zapisano
  sroceno: string; // tekst koji je sročio AI (i psiholog prihvatio/uredio)
  obradjena: boolean;
  kategorija?: string; // npr. "Hodnik / u prolazu", "Informativni razgovor"
  osobe?: string[]; // o kome/sa kim: "razrednik 7-1", "nastavnik matematike", "majka"…
}

/** AI analiza / zaključak iz prikupljenih bilješki i zapisa (sačuvana za kasnije). */
export interface Analiza extends Zapis {
  datum: string;
  naslov: string;
  opseg: string; // opis šta je analizirano (period, učenik, kategorija…)
  sifra: string; // ako se odnosi na jednog učenika
  tekst: string;
  brojIzvora: number;
}

/** Stavka kontrolne liste za inspekciju (ručna potvrda). id = "2026:dnevnik:2026-10" i sl. */
export interface KontrolnaStavka extends Zapis {
  gotovo: boolean;
  napomena: string;
}

/** Popunjen obrazac (saglasnost, poziv, mišljenje, službena bilješka…) – čuva se u arhivi. */
export interface PopunjenObrazac extends Zapis {
  vrsta: string;
  datum: string;
  sifra: string;
  polja: Record<string, string>;
}

/** Dokument koji je psiholog dodao (PDF pravilnika, kolektivni ugovor, rješenje…). */
export interface MojDokument extends Zapis {
  naziv: string;
  kategorija: string;
  tip: string; // MIME
  velicina: number;
  podaci: Blob;
  zaAI: boolean; // smije li AI asistent čitati ovaj dokument
}

export interface Postavke {
  id: 'postavke';
  nazivSkole: string;
  imePsihologa: string;
  skolskaGodinaPocetak: number;
  pinHash: string; // '' = PIN isključen; format "salt:hash" (base64)
  imenaUDokumentima?: boolean; // imena učenika u printu i Excelu (zadano: da)
  zadnjaKopija: string; // ISO ili ''
  updatedAt: string;
}

export type Kategorija =
  | 'vrstaKontakta'
  | 'inicirao'
  | 'razlog'
  | 'statusSlucaja'
  | 'oblast'
  | 'ciljnaGrupa'
  | 'ustanovaOsoba'
  | 'nacin'
  | 'vrstaAktivnosti';

export interface StavkaSifrarnika extends Zapis {
  kategorija: Kategorija;
  naziv: string;
  redoslijed: number;
  sakriveno: boolean;
}

export type Tabela = 'ucenici' | 'razgovori' | 'radionice' | 'saradnja' | 'sifrarnik' | 'razredi' | 'aktivnosti' | 'plan' | 'brzeBiljeske' | 'analize' | 'kontrola' | 'obrasci' | 'dokumenti';

export interface Obrisano {
  id: string;
  tabela: Tabela;
  deletedAt: string;
}

export type VrstaUnosa = 'razgovor' | 'radionica' | 'saradnja' | 'aktivnost';

export interface Nacrt {
  kljuc: string; // npr. "razgovor:novi" ili "razgovor:<id>"
  vrsta: VrstaUnosa;
  editId: string;
  podaci: Record<string, unknown>;
  updatedAt: string;
}

export function punoIme(u: Pick<Ucenik, 'ime' | 'prezime'> | undefined | null): string {
  if (!u) return '';
  return [u.ime, u.prezime].map((x) => (x ?? '').trim()).filter(Boolean).join(' ');
}
