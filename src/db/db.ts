import Dexie, { type Table } from 'dexie';
import type { Aktivnost, Analiza, BrzaBiljeska, KontrolnaStavka, MojDokument, PopunjenObrazac, Nacrt, PlanStavka, Obrisano, Postavke, Radionica, Razgovor, Razred, Saradnja, StavkaSifrarnika, Ucenik } from '../types';

export class EvidencijaDB extends Dexie {
  ucenici!: Table<Ucenik, string>;
  razgovori!: Table<Razgovor, string>;
  radionice!: Table<Radionica, string>;
  saradnja!: Table<Saradnja, string>;
  postavke!: Table<Postavke, string>;
  sifrarnik!: Table<StavkaSifrarnika, string>;
  obrisano!: Table<Obrisano, string>;
  nacrti!: Table<Nacrt, string>;
  razredi!: Table<Razred, string>;
  aktivnosti!: Table<Aktivnost, string>;
  plan!: Table<PlanStavka, string>;
  brzeBiljeske!: Table<BrzaBiljeska, string>;
  analize!: Table<Analiza, string>;
  kontrola!: Table<KontrolnaStavka, string>;
  obrasci!: Table<PopunjenObrazac, string>;
  dokumenti!: Table<MojDokument, string>;

  constructor(ime = 'evidencija-psihologa') {
    super(ime);
    this.version(1).stores({
      ucenici: 'id, &sifra, razred, updatedAt',
      razgovori: 'id, datum, sifra, createdAt, updatedAt',
      radionice: 'id, datum, *ucenicizaPracenje, createdAt, updatedAt',
      saradnja: 'id, datum, sifra, createdAt, updatedAt',
      postavke: 'id',
      sifrarnik: 'id, kategorija',
      obrisano: 'id, tabela',
      nacrti: 'kljuc, updatedAt',
    });
    // v2: imena učenika i razredi s razrednicima
    this.version(2)
      .stores({ razredi: 'id, &razred' })
      .upgrade((tx) =>
        tx.table('ucenici').toCollection().modify((u: Partial<Ucenik>) => {
          if (u.ime === undefined) u.ime = '';
          if (u.prezime === undefined) u.prezime = '';
        }),
      );
    // v3: ostale aktivnosti (zamjene, čas odjeljenske zajednice…)
    this.version(3).stores({ aktivnosti: 'id, datum, createdAt, updatedAt' });
    // v4: plan rada psihologa
    this.version(4).stores({ plan: 'id, skolskaGodina, podrucje' });
    // v5: brze bilješke
    this.version(5).stores({ brzeBiljeske: 'id, datum, sifra, createdAt' });
    // v6: analize, kontrolna lista za inspekciju, popunjeni obrasci, moji dokumenti
    this.version(6).stores({
      analize: 'id, datum, sifra, createdAt',
      kontrola: 'id',
      obrasci: 'id, vrsta, datum, sifra, createdAt',
      dokumenti: 'id, kategorija, createdAt',
    });
  }
}

export const db = new EvidencijaDB();
