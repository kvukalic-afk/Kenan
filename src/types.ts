export interface Zapis {
  id: string;
  createdAt: string; // ISO vrijeme
  updatedAt: string; // ISO vrijeme
}

export type StatusUcenika = 'Aktivan' | 'Ispisan' | 'Premješten';
export const STATUSI_UCENIKA: StatusUcenika[] = ['Aktivan', 'Ispisan', 'Premješten'];

export interface Ucenik extends Zapis {
  sifra: string;
  razred: string;
  status: StatusUcenika;
  uPracenju: boolean;
  napomena: string;
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
}

export interface Postavke {
  id: 'postavke';
  nazivSkole: string;
  imePsihologa: string;
  skolskaGodinaPocetak: number;
  pinHash: string; // '' = PIN isključen; format "salt:hash" (base64)
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
  | 'nacin';

export interface StavkaSifrarnika extends Zapis {
  kategorija: Kategorija;
  naziv: string;
  redoslijed: number;
  sakriveno: boolean;
}

export type Tabela = 'ucenici' | 'razgovori' | 'radionice' | 'saradnja' | 'sifrarnik';

export interface Obrisano {
  id: string;
  tabela: Tabela;
  deletedAt: string;
}

export type VrstaUnosa = 'razgovor' | 'radionica' | 'saradnja';

export interface Nacrt {
  kljuc: string; // npr. "razgovor:novi" ili "razgovor:<id>"
  vrsta: VrstaUnosa;
  editId: string;
  podaci: Record<string, unknown>;
  updatedAt: string;
}
