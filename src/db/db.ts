import Dexie, { type Table } from 'dexie';
import type { Nacrt, Obrisano, Postavke, Radionica, Razgovor, Razred, Saradnja, StavkaSifrarnika, Ucenik } from '../types';

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
  }
}

export const db = new EvidencijaDB();
