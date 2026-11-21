// Rezervna kopija: izvoz (šifrovan JSON) i uvoz sa spajanjem po ID-u, bez duplikata.
//
// Pravila spajanja:
//  - Zapis kojeg nema lokalno → dodaje se (osim ako je lokalno obrisan kasnije nego što je zadnji put mijenjan).
//  - Zapis koji postoji → ažurira se samo ako je verzija iz kopije novija (updatedAt).
//  - Učenici se prepoznaju i po šifri: isti "U014" unesen na dva uređaja ostaje jedan učenik (zadržava lokalni ID).
//  - Stavke šifrarnika se prepoznaju i po (kategorija + naziv).
//  - Brisanja iz kopije (tombstones) brišu lokalni zapis ako lokalno nije mijenjan nakon brisanja.
//  - Postavke se preuzimaju ako su novije, ali PIN i datum zadnje kopije ostaju lokalni.

import type { Aktivnost, BrzaBiljeska, Obrisano, PlanStavka, Postavke, Radionica, Razgovor, Razred, Saradnja, StavkaSifrarnika, Ucenik } from '../types';

export interface Snimak {
  ucenici: Ucenik[];
  razgovori: Razgovor[];
  radionice: Radionica[];
  saradnja: Saradnja[];
  sifrarnik: StavkaSifrarnika[];
  razredi: Razred[];
  aktivnosti: Aktivnost[];
  plan: PlanStavka[];
  brzeBiljeske: BrzaBiljeska[];
  obrisano: Obrisano[];
  postavke: Partial<Postavke> | null;
}

export type TabelaKopije = 'ucenici' | 'razgovori' | 'radionice' | 'saradnja' | 'sifrarnik' | 'razredi' | 'aktivnosti' | 'plan' | 'brzeBiljeske';
export const TABELE_KOPIJE: TabelaKopije[] = ['ucenici', 'razgovori', 'radionice', 'saradnja', 'sifrarnik', 'razredi', 'aktivnosti', 'plan', 'brzeBiljeske'];

export const NAZIVI_TABELA: Record<TabelaKopije, string> = {
  ucenici: 'Učenici',
  razgovori: 'Razgovori',
  radionice: 'Radionice',
  saradnja: 'Saradnja',
  sifrarnik: 'Šifrarnik',
  razredi: 'Razrednici',
  aktivnosti: 'Ostale aktivnosti',
  plan: 'Plan rada',
  brzeBiljeske: 'Brze bilješke',
};

type AnyZapis = { id: string; updatedAt: string; createdAt: string };

export interface PlanUvoza {
  dodati: Record<TabelaKopije, AnyZapis[]>;
  azurirati: Record<TabelaKopije, AnyZapis[]>;
  obrisati: Record<TabelaKopije, string[]>;
  noviTragovi: Obrisano[];
  postavke: Partial<Postavke> | null;
  broj: { dodati: number; azurirati: number; obrisati: number };
}

const prazno = <T,>(): Record<TabelaKopije, T[]> => ({ ucenici: [], razgovori: [], radionice: [], saradnja: [], sifrarnik: [], razredi: [], aktivnosti: [], plan: [], brzeBiljeske: [] });

const novije = (a: string, b: string) => (a || '') > (b || '');

/** Šifre u dolaznim zapisima se mapiraju ako učenik iz kopije ima istu šifru (nema promjene) – ID-evi učenika ne utiču na veze jer se veze prave preko šifre. */
export function napraviPlan(lokalno: Snimak, dolazno: Snimak): PlanUvoza {
  const dodati = prazno<AnyZapis>();
  const azurirati = prazno<AnyZapis>();
  const obrisati = prazno<string>();

  const lokalniTragovi = new Map(lokalno.obrisano.map((o) => [o.id, o]));

  for (const tabela of TABELE_KOPIJE) {
    const lok = (lokalno[tabela] ?? []) as AnyZapis[];
    const poId = new Map(lok.map((z) => [z.id, z]));
    const poKljucu = new Map<string, AnyZapis>();
    if (tabela === 'ucenici') for (const u of lok as Ucenik[]) poKljucu.set(u.sifra.toUpperCase(), u);
    if (tabela === 'sifrarnik') for (const s of lok as StavkaSifrarnika[]) poKljucu.set(`${s.kategorija}|${s.naziv.toLowerCase()}`, s);
    if (tabela === 'razredi') for (const r of lok as Razred[]) poKljucu.set(r.razred, r);
    const vidjeno = new Set<string>();

    for (const z of ((dolazno[tabela] ?? []) as AnyZapis[])) {
      if (!z || !z.id || vidjeno.has(z.id)) continue;
      vidjeno.add(z.id);
      const trag = lokalniTragovi.get(z.id);
      if (trag && !novije(z.updatedAt, trag.deletedAt)) continue;

      let postojeci = poId.get(z.id);
      if (!postojeci && tabela === 'ucenici') postojeci = poKljucu.get((z as Ucenik).sifra?.toUpperCase());
      if (!postojeci && tabela === 'sifrarnik') {
        const s = z as StavkaSifrarnika;
        postojeci = poKljucu.get(`${s.kategorija}|${(s.naziv || '').toLowerCase()}`);
      }

      if (!postojeci && tabela === 'razredi') postojeci = poKljucu.get((z as Razred).razred);

      if (!postojeci) {
        dodati[tabela].push(z);
        poId.set(z.id, z);
        if (tabela === 'ucenici') poKljucu.set((z as Ucenik).sifra.toUpperCase(), z);
        if (tabela === 'razredi') poKljucu.set((z as Razred).razred, z);
      } else if (novije(z.updatedAt, postojeci.updatedAt)) {
        // zadrži lokalni ID i datum kreiranja
        azurirati[tabela].push({ ...z, id: postojeci.id, createdAt: postojeci.createdAt });
      }
    }
  }

  // Brisanja iz kopije
  const noviTragovi: Obrisano[] = [];
  for (const trag of dolazno.obrisano ?? []) {
    const lokTrag = lokalniTragovi.get(trag.id);
    if (!lokTrag || novije(trag.deletedAt, lokTrag.deletedAt)) noviTragovi.push(trag);
    const tabela = trag.tabela as TabelaKopije;
    if (!TABELE_KOPIJE.includes(tabela)) continue;
    const lok = ((lokalno[tabela] ?? []) as AnyZapis[]).find((z) => z.id === trag.id);
    if (lok && !novije(lok.updatedAt, trag.deletedAt)) {
      obrisati[tabela].push(trag.id);
      azurirati[tabela] = azurirati[tabela].filter((z) => z.id !== trag.id);
    }
  }

  let postavke: Partial<Postavke> | null = null;
  if (dolazno.postavke && novije(dolazno.postavke.updatedAt ?? '', lokalno.postavke?.updatedAt ?? '')) {
    const { pinHash: _p, zadnjaKopija: _z, ...ostalo } = dolazno.postavke;
    void _p; void _z;
    postavke = ostalo;
  }

  const zbir = (r: Record<TabelaKopije, unknown[]>) => TABELE_KOPIJE.reduce((s, t) => s + r[t].length, 0);
  return { dodati, azurirati, obrisati, noviTragovi, postavke, broj: { dodati: zbir(dodati), azurirati: zbir(azurirati), obrisati: zbir(obrisati) } };
}

/** Sadržaj kopije bez PIN-a i datuma zadnje kopije. */
export function pripremiZaIzvoz(s: Snimak): Snimak {
  let postavke: Partial<Postavke> | null = null;
  if (s.postavke) {
    const { pinHash: _p, zadnjaKopija: _z, ...ostalo } = s.postavke;
    void _p; void _z;
    postavke = ostalo;
  }
  return { ...s, postavke };
}

export function nazivFajlaKopije(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `Evidencija_kopija_${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
}
