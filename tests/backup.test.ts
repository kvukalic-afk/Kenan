import { describe, expect, it } from 'vitest';
import { napraviPlan, pripremiZaIzvoz, type Snimak } from '../src/lib/backup';
import { pocetneStavke } from '../src/db/defaults';
import type { Razgovor, Ucenik } from '../src/types';

const T1 = '2026-11-01T10:00:00.000Z';
const T2 = '2026-11-02T10:00:00.000Z';
const T3 = '2026-11-03T10:00:00.000Z';

const uc = (id: string, sifra: string, updatedAt = T1, p: Partial<Ucenik> = {}): Ucenik => ({
  id, sifra, ime: '', prezime: '', razred: '6-1', status: 'Aktivan', uPracenju: false, napomena: '', createdAt: T1, updatedAt, ...p,
});
const rz = (id: string, updatedAt = T1, p: Partial<Razgovor> = {}): Razgovor => ({
  id, createdAt: T1, updatedAt, datum: '2026-11-01', sifra: 'U1', razred: '6-1', vrstaKontakta: '', inicirao: '', razlog: '',
  biljeske: '', zakljucak: '', preporuke: '', sljedeciKorak: '', datumSljedecegKontakta: '', statusSlucaja: 'Otvoren', ...p,
});
const prazan = (): Snimak => ({ ucenici: [], razgovori: [], radionice: [], saradnja: [], sifrarnik: [], razredi: [], obrisano: [], postavke: null });

describe('uvoz rezervne kopije bez duplikata', () => {
  it('dodaje nove, ažurira novije, preskače iste i starije', () => {
    const lok = { ...prazan(), razgovori: [rz('a', T2), rz('b', T2), rz('c', T2)] };
    const dol = { ...prazan(), razgovori: [rz('a', T2), rz('b', T3, { biljeske: 'novo' }), rz('c', T1), rz('d', T1)] };
    const p = napraviPlan(lok, dol);
    expect(p.dodati.razgovori.map((z) => z.id)).toEqual(['d']);
    expect(p.azurirati.razgovori.map((z) => z.id)).toEqual(['b']);
    expect(p.broj).toEqual({ dodati: 1, azurirati: 1, obrisati: 0 });
  });

  it('isti uvoz dva puta ne pravi ništa novo', () => {
    const dol = { ...prazan(), razgovori: [rz('a'), rz('b')], ucenici: [uc('u1', 'U1')] };
    const p1 = napraviPlan(prazan(), dol);
    expect(p1.broj.dodati).toBe(3);
    const nakon: Snimak = { ...prazan(), razgovori: p1.dodati.razgovori as Razgovor[], ucenici: p1.dodati.ucenici as Ucenik[] };
    expect(napraviPlan(nakon, dol).broj).toEqual({ dodati: 0, azurirati: 0, obrisati: 0 });
  });

  it('duplikati unutar fajla se ignorišu', () => {
    const p = napraviPlan(prazan(), { ...prazan(), razgovori: [rz('a'), rz('a')] });
    expect(p.dodati.razgovori).toHaveLength(1);
  });

  it('učenik s istom šifrom i drugim ID-em ostaje jedan (zadržava lokalni ID)', () => {
    const lok = { ...prazan(), ucenici: [uc('lok-1', 'U014', T1)] };
    const dol = { ...prazan(), ucenici: [uc('dol-9', 'U014', T2, { uPracenju: true })] };
    const p = napraviPlan(lok, dol);
    expect(p.dodati.ucenici).toHaveLength(0);
    expect(p.azurirati.ucenici).toHaveLength(1);
    expect(p.azurirati.ucenici[0]).toMatchObject({ id: 'lok-1', uPracenju: true });
  });

  it('početni šifrarnik se ne duplira između uređaja', () => {
    const lok = { ...prazan(), sifrarnik: pocetneStavke(T1) };
    const dol = { ...prazan(), sifrarnik: pocetneStavke(T1) };
    expect(napraviPlan(lok, dol).broj.dodati).toBe(0);
  });

  it('razrednik istog razreda se ne duplira (prepoznaje se po razredu)', () => {
    const lok = { ...prazan(), razredi: [{ id: 'r1', razred: '7-1', razrednik: 'Staro Ime', createdAt: T1, updatedAt: T1 }] };
    const dol = { ...prazan(), razredi: [{ id: 'r9', razred: '7-1', razrednik: 'Novo Ime', createdAt: T1, updatedAt: T2 }, { id: 'r8', razred: '8-2', razrednik: 'X', createdAt: T1, updatedAt: T1 }] };
    const p = napraviPlan(lok, dol);
    expect(p.dodati.razredi.map((r) => r.id)).toEqual(['r8']);
    expect(p.azurirati.razredi[0]).toMatchObject({ id: 'r1', razrednik: 'Novo Ime' });
  });

  it('brisanje se prenosi kroz kopiju', () => {
    const lok = { ...prazan(), razgovori: [rz('a', T1), rz('b', T3)] };
    const dol = { ...prazan(), obrisano: [
      { id: 'a', tabela: 'razgovori' as const, deletedAt: T2 },
      { id: 'b', tabela: 'razgovori' as const, deletedAt: T2 }, // lokalno mijenjan poslije brisanja → ostaje
    ] };
    const p = napraviPlan(lok, dol);
    expect(p.obrisati.razgovori).toEqual(['a']);
    expect(p.noviTragovi).toHaveLength(2);
  });

  it('lokalno obrisan zapis se ne vraća iz starije kopije', () => {
    const lok = { ...prazan(), obrisano: [{ id: 'a', tabela: 'razgovori' as const, deletedAt: T2 }] };
    const dol = { ...prazan(), razgovori: [rz('a', T1)] };
    expect(napraviPlan(lok, dol).broj.dodati).toBe(0);
  });

  it('PIN i datum zadnje kopije se ne izvoze i ne preuzimaju', () => {
    const s = { ...prazan(), postavke: { id: 'postavke' as const, nazivSkole: 'S', imePsihologa: 'I', skolskaGodinaPocetak: 2026, pinHash: 'tajna', zadnjaKopija: T1, updatedAt: T2 } };
    const izvoz = pripremiZaIzvoz(s);
    expect(izvoz.postavke).not.toHaveProperty('pinHash');
    const p = napraviPlan({ ...prazan(), postavke: { updatedAt: T1 } }, s);
    expect(p.postavke).toMatchObject({ nazivSkole: 'S' });
    expect(p.postavke).not.toHaveProperty('pinHash');
  });
});
