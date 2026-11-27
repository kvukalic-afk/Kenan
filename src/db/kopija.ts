import { db } from './db';
import { sacuvajPostavke } from './repo';
import { bezLokalnihPostavki, napraviPlan, nazivFajlaKopije, pripremiZaIzvoz, TABELE_KOPIJE, type PlanUvoza, type Snimak } from '../lib/backup';
import { desifruj, jePaket, sifruj } from '../lib/kripto';
import { snimakBaze } from '../lib/podaci';
import { preuzmi } from '../lib/preuzimanje';

async function blobUBase64(b: Blob): Promise<string> {
  const buf = new Uint8Array(await b.arrayBuffer());
  let s = '';
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(s);
}

function base64UBlob(b64: string, tip: string): Blob {
  const s = atob(b64);
  const b = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
  return new Blob([b], { type: tip });
}

export async function izveziKopiju(lozinka: string): Promise<void> {
  const snimak = pripremiZaIzvoz(await snimakBaze());
  snimak.dokumenti = await Promise.all((snimak.dokumenti ?? []).map(async (d) => {
    if (!('podaci' in d)) return d;
    const { podaci, ...ostalo } = d;
    return { ...ostalo, podaciB64: await blobUBase64(podaci) };
  }));
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
    sifrarnik: dolazno.sifrarnik ?? [], razredi: dolazno.razredi ?? [], aktivnosti: dolazno.aktivnosti ?? [], plan: dolazno.plan ?? [], brzeBiljeske: dolazno.brzeBiljeske ?? [],
    analize: dolazno.analize ?? [], kontrola: dolazno.kontrola ?? [], obrasci: dolazno.obrasci ?? [], dokumenti: dolazno.dokumenti ?? [], testiranja: dolazno.testiranja ?? [], obrisano: dolazno.obrisano ?? [], postavke: dolazno.postavke ?? null,
  });
  return { plan, snimak: dolazno };
}

export async function primijeniPlan(plan: PlanUvoza): Promise<void> {
  await db.transaction('rw', [db.ucenici, db.razgovori, db.radionice, db.saradnja, db.sifrarnik, db.razredi, db.aktivnosti, db.plan, db.brzeBiljeske, db.analize, db.kontrola, db.obrasci, db.dokumenti, db.testiranja, db.obrisano, db.postavke], async () => {
    for (const t of TABELE_KOPIJE) {
      const tabela = db.table(t);
      if (plan.obrisati[t].length) await tabela.bulkDelete(plan.obrisati[t]);
      let zaUpis: unknown[] = [...plan.dodati[t], ...plan.azurirati[t]];
      if (t === 'dokumenti') {
        zaUpis = zaUpis.map((d) => {
          const k = d as Record<string, unknown>;
          if (typeof k.podaciB64 !== 'string') return d;
          const { podaciB64, ...ostalo } = k;
          return { ...ostalo, podaci: base64UBlob(podaciB64 as string, String(k.tip || 'application/octet-stream')) };
        });
      }
      if (zaUpis.length) await tabela.bulkPut(zaUpis);
    }
    if (plan.noviTragovi.length) await db.obrisano.bulkPut(plan.noviTragovi);
    if (plan.postavke) {
      const p = await db.postavke.get('postavke');
      if (p) await db.postavke.put({ ...p, ...bezLokalnihPostavki(plan.postavke), id: 'postavke' });
    }
  });
}
