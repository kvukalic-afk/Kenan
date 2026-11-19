import { describe, expect, it } from 'vitest';
import { jeIspravnaSifra, liciNaIme, normalizujRazred, ocistiSifru, uporediSifre } from '../src/lib/sifra';

describe('validacija šifre', () => {
  it('prihvata slova, brojeve, - i _ do 20 znakova', () => {
    expect(jeIspravnaSifra('U014')).toBe(true);
    expect(jeIspravnaSifra('A-12_b'.toUpperCase())).toBe(true);
    expect(jeIspravnaSifra('X'.repeat(20))).toBe(true);
    expect(jeIspravnaSifra('X'.repeat(21))).toBe(false);
    expect(jeIspravnaSifra('')).toBe(false);
    expect(jeIspravnaSifra('U 014')).toBe(false);
    expect(jeIspravnaSifra('Š01')).toBe(false);
  });
  it('čisti unos: velika slova, bez razmaka i nedozvoljenih znakova, max 20', () => {
    expect(ocistiSifru('u014')).toBe('U014');
    expect(ocistiSifru(' U 0 1 4 ')).toBe('U014');
    expect(ocistiSifru('Šifra#1')).toBe('IFRA1');
    expect(ocistiSifru('a'.repeat(30))).toHaveLength(20);
  });
  it('upozorava kad unos liči na ime', () => {
    expect(liciNaIme('Petar Petrović')).toBe(true);
    expect(liciNaIme('Petar')).toBe(true);
    expect(liciNaIme('Petrović')).toBe(true);
    expect(liciNaIme('U014')).toBe(false);
    expect(liciNaIme('U-14')).toBe(false);
    expect(liciNaIme('ABC')).toBe(false);
    expect(liciNaIme('')).toBe(false);
  });
  it('prirodno sortira šifre', () => {
    expect(['U10', 'U2', 'U1'].sort(uporediSifre)).toEqual(['U1', 'U2', 'U10']);
  });
  it('normalizuje razred', () => {
    expect(normalizujRazred('6/2')).toBe('6-2');
    expect(normalizujRazred('VIII-3')).toBe('8-3');
    expect(normalizujRazred('7.1')).toBe('7-1');
    expect(normalizujRazred('7. razredi')).toBe('7. razredi');
  });
});
