import { db } from './db';
import { pocetneStavke, pocetnePostavke } from './defaults';
import { normalizujRazred } from '../lib/sifra';
import type {
  Kategorija, Postavke, Radionica, Razgovor, Saradnja, StavkaSifrarnika, Tabela, Ucenik,
} from '../types';

export function uuid(): string {
  const c = globalThis.crypto;
  if (typeof c.randomUUID === 'function') return c.randomUUID();
  const b = c.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const sada = () => new Date().toISOString();

export async function inicijalizuj(): Promise<void> {
  await db.transaction('rw', db.postavke, db.sifrarnik, async () => {
    if (!(await db.postavke.get('postavke'))) await db.postavke.put(pocetnePostavke());
    if ((await db.sifrarnik.count()) === 0) await db.sifrarnik.bulkPut(pocetneStavke());
  });
}

export async function ucitajPostavke(): Promise<Postavke> {
  return (await db.postavke.get('postavke')) ?? pocetnePostavke();
}

export async function sacuvajPostavke(izmjene: Partial<Postavke>, oznaciIzmjenu = true): Promise<void> {
  const p = await ucitajPostavke();
  await db.postavke.put({ ...p, ...izmjene, id: 'postavke', updatedAt: oznaciIzmjenu ? sada() : p.updatedAt });
}

// ---------- Učenici ----------

export async function ucenikPoSifri(sifra: string): Promise<Ucenik | undefined> {
  return db.ucenici.where('sifra').equals(sifra).first();
}

/** Vrati postojećeg učenika ili ga kreiraj (pri snimanju razgovora s novom šifrom). */
export async function osigurajUcenika(sifra: string, razred: string): Promise<Ucenik> {
  const postojeci = await ucenikPoSifri(sifra);
  if (postojeci) {
    if (!postojeci.razred && razred) {
      const azuriran = { ...postojeci, razred: normalizujRazred(razred), updatedAt: sada() };
      await db.ucenici.put(azuriran);
      return azuriran;
    }
    return postojeci;
  }
  const t = sada();
  const novi: Ucenik = {
    id: uuid(), sifra, razred: normalizujRazred(razred), status: 'Aktivan', uPracenju: false, napomena: '',
    createdAt: t, updatedAt: t,
  };
  await db.ucenici.add(novi);
  return novi;
}

export async function sacuvajUcenika(podaci: Omit<Ucenik, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Ucenik> {
  const t = sada();
  const stari = podaci.id ? await db.ucenici.get(podaci.id) : undefined;
  const zapis: Ucenik = {
    ...podaci,
    razred: normalizujRazred(podaci.razred),
    id: stari?.id ?? uuid(),
    createdAt: stari?.createdAt ?? t,
    updatedAt: t,
  };
  await db.transaction('rw', [db.ucenici, db.razgovori, db.saradnja, db.radionice], async () => {
    if (stari && stari.sifra !== zapis.sifra) await promijeniSifruU(stari.sifra, zapis.sifra);
    await db.ucenici.put(zapis);
  });
  return zapis;
}

/** Promjena šifre se prenosi na sve zapise tog učenika. */
async function promijeniSifruU(stara: string, nova: string) {
  const t = sada();
  await db.razgovori.where('sifra').equals(stara).modify({ sifra: nova, updatedAt: t });
  await db.saradnja.where('sifra').equals(stara).modify({ sifra: nova, updatedAt: t });
  await db.radionice.where('ucenicizaPracenje').equals(stara).modify((r) => {
    r.ucenicizaPracenje = r.ucenicizaPracenje.map((s) => (s === stara ? nova : s));
    r.updatedAt = t;
  });
}

export async function postaviUPracenju(id: string, uPracenju: boolean) {
  await db.ucenici.update(id, { uPracenju, updatedAt: sada() });
}

// ---------- Zapisi ----------

type Novo<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };

async function sacuvaj<T extends { id: string; createdAt: string; updatedAt: string }>(
  tabela: 'razgovori' | 'radionice' | 'saradnja',
  podaci: Novo<T>,
): Promise<T> {
  const t = sada();
  const tbl = db.table<T, string>(tabela);
  const stari = podaci.id ? await tbl.get(podaci.id) : undefined;
  const zapis = { ...podaci, id: stari?.id ?? podaci.id ?? uuid(), createdAt: stari?.createdAt ?? t, updatedAt: t } as T;
  await tbl.put(zapis);
  return zapis;
}

export async function sacuvajRazgovor(podaci: Novo<Razgovor>): Promise<Razgovor> {
  return db.transaction('rw', db.razgovori, db.ucenici, async () => {
    await osigurajUcenika(podaci.sifra, podaci.razred);
    return sacuvaj<Razgovor>('razgovori', { ...podaci, razred: normalizujRazred(podaci.razred) });
  });
}

export async function sacuvajRadionicu(podaci: Novo<Radionica>): Promise<Radionica> {
  return db.transaction('rw', db.radionice, db.ucenici, async () => {
    const razred = normalizujRazred(podaci.razred);
    const razredUcenika = /^\d{1,2}-\d{1,2}$/.test(razred) ? razred : '';
    for (const s of podaci.ucenicizaPracenje) await osigurajUcenika(s, razredUcenika);
    return sacuvaj<Radionica>('radionice', podaci);
  });
}

export async function sacuvajSaradnju(podaci: Novo<Saradnja>): Promise<Saradnja> {
  return db.transaction('rw', db.saradnja, db.ucenici, async () => {
    if (podaci.sifra) await osigurajUcenika(podaci.sifra, '');
    return sacuvaj<Saradnja>('saradnja', podaci);
  });
}

/** Brisanje ostavlja "trag" (tombstone) da se brisanje prenese i kroz rezervnu kopiju. */
export async function obrisi(tabela: Tabela, id: string): Promise<void> {
  await db.transaction('rw', db.table(tabela), db.obrisano, async () => {
    await db.table(tabela).delete(id);
    await db.obrisano.put({ id, tabela, deletedAt: sada() });
  });
}

export async function obrisiUcenika(ucenik: Ucenik): Promise<void> {
  await db.transaction('rw', [db.ucenici, db.razgovori, db.saradnja, db.obrisano], async () => {
    const t = sada();
    const razg = await db.razgovori.where('sifra').equals(ucenik.sifra).primaryKeys();
    await db.razgovori.bulkDelete(razg);
    await db.saradnja.where('sifra').equals(ucenik.sifra).modify({ sifra: '', updatedAt: t });
    await db.ucenici.delete(ucenik.id);
    await db.obrisano.bulkPut([
      { id: ucenik.id, tabela: 'ucenici', deletedAt: t },
      ...razg.map((id) => ({ id, tabela: 'razgovori' as const, deletedAt: t })),
    ]);
  });
}

// ---------- Šifrarnik ----------

export async function dodajStavku(kategorija: Kategorija, naziv: string) {
  const t = sada();
  const max = await db.sifrarnik.where('kategorija').equals(kategorija).toArray();
  await db.sifrarnik.add({
    id: uuid(), kategorija, naziv: naziv.trim(), redoslijed: max.length ? Math.max(...max.map((s) => s.redoslijed)) + 1 : 0,
    sakriveno: false, createdAt: t, updatedAt: t,
  });
}

export async function izmijeniStavku(id: string, izmjene: Partial<StavkaSifrarnika>) {
  await db.sifrarnik.update(id, { ...izmjene, updatedAt: sada() });
}

// ---------- Sve ----------

export async function obrisiSvePodatke() {
  await db.delete();
  await db.open();
  await inicijalizuj();
}
