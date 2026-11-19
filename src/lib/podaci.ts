import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { pocetnePostavke } from '../db/defaults';
import type { Snimak } from './backup';
import type { Kategorija, Postavke, StavkaSifrarnika } from '../types';

export function usePostavke(): Postavke {
  return useLiveQuery(() => db.postavke.get('postavke'), []) ?? pocetnePostavke();
}

export function useSifrarnik(): StavkaSifrarnika[] {
  return useLiveQuery(() => db.sifrarnik.toArray(), []) ?? [];
}

/** Vidljive stavke kategorije; trenutna vrijednost starog zapisa se zadržava i kad je stavka sakrivena ili preimenovana. */
export function opcije(sve: StavkaSifrarnika[], kat: Kategorija, trenutna?: string): string[] {
  const vidljive = sve
    .filter((s) => s.kategorija === kat && !s.sakriveno)
    .sort((a, b) => a.redoslijed - b.redoslijed)
    .map((s) => s.naziv);
  if (trenutna && !vidljive.includes(trenutna)) vidljive.push(trenutna);
  return vidljive;
}

export async function snimakBaze(): Promise<Snimak> {
  const [ucenici, razgovori, radionice, saradnja, sifrarnik, razredi, obrisano, postavke] = await Promise.all([
    db.ucenici.toArray(), db.razgovori.toArray(), db.radionice.toArray(), db.saradnja.toArray(),
    db.sifrarnik.toArray(), db.razredi.toArray(), db.obrisano.toArray(), db.postavke.get('postavke'),
  ]);
  return { ucenici, razgovori, radionice, saradnja, sifrarnik, razredi, obrisano, postavke: postavke ?? null };
}

/** Mapa šifra → učenik i razred → razrednik, za prikaz imena svuda u appu. */
export function useImenik() {
  const p = useLiveQuery(async () => {
    const [ucenici, razredi] = await Promise.all([db.ucenici.toArray(), db.razredi.toArray()]);
    return { ucenici, razredi };
  }, []);
  const poSifri = new Map((p?.ucenici ?? []).map((u) => [u.sifra, u]));
  const razrednik = new Map((p?.razredi ?? []).map((r) => [r.razred, r.razrednik]));
  return { poSifri, razrednik, ucenici: p?.ucenici ?? [], razredi: p?.razredi ?? [] };
}
