import { db } from './db';
import { sacuvajPostavke } from './repo';
import { napraviPlan, nazivFajlaKopije, pripremiZaIzvoz, TABELE_KOPIJE, type PlanUvoza, type Snimak } from '../lib/backup';
import { desifruj, jePaket, sifruj } from '../lib/kripto';
import { snimakBaze } from '../lib/podaci';
import { preuzmi } from '../lib/preuzimanje';

export async function izveziKopiju(lozinka: string): Promise<void> {
  const snimak = pripremiZaIzvoz(await snimakBaze());
  const paket = await sifruj(snimak, lozinka);
  preuzmi(JSON.stringify(paket), nazivFajlaKopije(), 'application/json');
  await sacuvajPostavke({ zadnjaKopija: new Date().toISOString() }, false);
}

export class NijeKopija extends Error {
  constructor() {
    super('Ovo nije fajl rezervne kopije Evidencije psihologa.');
  }
}

export async function procitajKopiju(tekst: string, lozinka: string): Promise<{ plan: PlanUvoza; snimak: Snimak }> {
  let json: unknown;
  try {
    json = JSON.parse(tekst);
  } catch {
    throw new NijeKopija();
  }
  if (!jePaket(json)) throw new NijeKopija();
  const dolazno = await desifruj<Snimak>(json, lozinka);
  const plan = napraviPlan(await snimakBaze(), {
    ucenici: dolazno.ucenici ?? [], razgovori: dolazno.razgovori ?? [], radionice: dolazno.radionice ?? [], saradnja: dolazno.saradnja ?? [],
    sifrarnik: dolazno.sifrarnik ?? [], razredi: dolazno.razredi ?? [], aktivnosti: dolazno.aktivnosti ?? [], plan: dolazno.plan ?? [], brzeBiljeske: dolazno.brzeBiljeske ?? [], obrisano: dolazno.obrisano ?? [], postavke: dolazno.postavke ?? null,
  });
  return { plan, snimak: dolazno };
}

export async function primijeniPlan(plan: PlanUvoza): Promise<void> {
  await db.transaction('rw', [db.ucenici, db.razgovori, db.radionice, db.saradnja, db.sifrarnik, db.razredi, db.aktivnosti, db.plan, db.brzeBiljeske, db.obrisano, db.postavke], async () => {
    for (const t of TABELE_KOPIJE) {
      const tabela = db.table(t);
      if (plan.obrisati[t].length) await tabela.bulkDelete(plan.obrisati[t]);
      const zaUpis = [...plan.dodati[t], ...plan.azurirati[t]];
      if (zaUpis.length) await tabela.bulkPut(zaUpis);
    }
    if (plan.noviTragovi.length) await db.obrisano.bulkPut(plan.noviTragovi);
    if (plan.postavke) {
      const p = await db.postavke.get('postavke');
      if (p) await db.postavke.put({ ...p, ...plan.postavke, id: 'postavke', pinHash: p.pinHash, zadnjaKopija: p.zadnjaKopija });
    }
  });
}
