import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { danasIso } from './datum';
import { kontekst, stanjeKontrole, type KontekstKontrole, type StanjeStavke } from './dokumentacija';
import { usePostavke } from './podaci';

/** Kontrolna lista za inspekciju za tekuću (ili zadanu) školsku godinu. */
export function useKontrola(godina?: number): { k: KontekstKontrole; stanje: StanjeStavke[] } | null {
  const postavke = usePostavke();
  const g = godina ?? postavke.skolskaGodinaPocetak;
  const podaci = useLiveQuery(async () => {
    const [plan, razgovori, aktivnosti, obrasci, rucno] = await Promise.all([
      db.plan.where('skolskaGodina').equals(g).toArray(),
      db.razgovori.toArray(), db.aktivnosti.toArray(), db.obrasci.toArray(), db.kontrola.toArray(),
    ]);
    return { plan, razgovori, aktivnosti, obrasci, rucno };
  }, [g]);
  if (!podaci) return null;
  const k = kontekst(g, danasIso(), { plan: podaci.plan, razgovori: podaci.razgovori, aktivnosti: podaci.aktivnosti, obrasci: podaci.obrasci, zadnjaKopija: postavke.zadnjaKopija,
    pocetakRada: postavke.pocetakRada ?? '', pripravnik: !!postavke.pripravnik });
  return { k, stanje: stanjeKontrole(k, podaci.rucno) };
}

export async function potvrdiStavku(id: string, gotovo: boolean) {
  const t = new Date().toISOString();
  const stara = await db.kontrola.get(id);
  await db.kontrola.put({ id, gotovo, napomena: stara?.napomena ?? '', createdAt: stara?.createdAt ?? t, updatedAt: t });
}
