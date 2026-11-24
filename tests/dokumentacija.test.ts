import { describe, expect, it } from 'vitest';
import { kontekst, KONTROLNA_LISTA, sazetakStanjaZaAI, spremnost, stanjeKontrole } from '../src/lib/dokumentacija';

const T = '2026-11-01T00:00:00Z';
const prazno = { plan: [], razgovori: [], aktivnosti: [], obrasci: [], zadnjaKopija: '' };

describe('kontrolna lista za inspekciju', () => {
  it('prikazuje samo stavke čije je vrijeme došlo i označava kašnjenje', () => {
    const k = kontekst(2026, '2026-11-20', prazno);
    const s = stanjeKontrole(k, []);
    const kljucevi = s.map((x) => x.def.kljuc);
    expect(kljucevi).toContain('program');
    expect(kljucevi).not.toContain('polugodisnji'); // od 15.12.
    expect(kljucevi).not.toContain('godisnji');
    expect(s.find((x) => x.def.kljuc === 'program')).toMatchObject({ gotovo: false, kasni: true });
    expect(s.find((x) => x.def.kljuc === 'dnevnik')?.id).toBe('2026:dnevnik:2026-10');
    expect(s.find((x) => x.def.kljuc === 'mjesecni')?.id).toBe('2026:mjesecni:2026-11');
  });
  it('ručna potvrda i automatska provjera', () => {
    const k = kontekst(2026, '2026-11-20', { ...prazno, zadnjaKopija: '2026-11-18T10:00:00Z',
      razgovori: [{ id: 'r', createdAt: T, updatedAt: T, datum: '2026-10-01', sifra: 'U1', razred: '', vrstaKontakta: '', inicirao: '', razlog: '', biljeske: '', zakljucak: '', preporuke: '', sljedeciKorak: '', datumSljedecegKontakta: '', statusSlucaja: '' }] });
    const s = stanjeKontrole(k, [{ id: '2026:program', gotovo: true, napomena: '', createdAt: T, updatedAt: T }]);
    expect(s.find((x) => x.def.kljuc === 'program')?.gotovo).toBe(true);
    expect(s.find((x) => x.def.kljuc === 'kopija')?.gotovo).toBe(true); // auto dovoljno
    expect(s.find((x) => x.def.kljuc === 'evidencija')?.gotovo).toBe(true);
    expect(spremnost(s)).toBeGreaterThan(0);
    const tekst = sazetakStanjaZaAI(k, s);
    expect(tekst).toContain('Spremnost dokumentacije');
    expect(tekst).toContain('[x] Godišnji program rada psihologa');
    expect(tekst).not.toContain('U1');
  });
  it('novozaposleni: rokovi od dolaska, mjesečne obaveze od mjeseca dolaska, pripravnik', () => {
    const k = kontekst(2026, '2026-11-24', { ...prazno, pocetakRada: '2026-11-16', pripravnik: true });
    const s = stanjeKontrole(k, []);
    const po = (kljuc: string) => s.find((x) => x.def.kljuc === kljuc);
    expect(po('program')).toMatchObject({ rok: '2026-12-16', kasni: false });
    expect(po('dnevnik')).toBeUndefined(); // oktobar je prije dolaska
    expect(po('mjesecni')?.rok).toBe('2026-11-23'); // prvi mjesec: 7 dana od dolaska
    expect(po('pripravnik-rjesenje')).toMatchObject({ rok: '2026-11-24', kasni: false });
    expect(po('primopredaja')?.rok).toBe('2026-12-01');
    expect(po('teskoce')?.rok).toBe('2026-12-16');
    expect(po('upis')).toBeUndefined(); // od 01.03.
    expect(sazetakStanjaZaAI(k, s)).toContain('od 16.11.2026');
    // bez datuma dolaska i bez pripravništva: nema stavki za početak
    const s2 = stanjeKontrole(kontekst(2026, '2026-11-24', prazno), []);
    expect(s2.some((x) => x.def.grupa === 'pocetak')).toBe(false);
    // u decembru se traži dnevnik za novembar
    const s3 = stanjeKontrole(kontekst(2026, '2026-12-02', { ...prazno, pocetakRada: '2026-11-16' }), []);
    expect(s3.find((x) => x.def.kljuc === 'dnevnik')?.id).toBe('2026:dnevnik:2026-11');
  });
  it('sve stavke imaju jedinstven ključ, rok, grupu i osnov', () => {
    expect(new Set(KONTROLNA_LISTA.map((d) => d.kljuc)).size).toBe(KONTROLNA_LISTA.length);
    for (const d of KONTROLNA_LISTA) {
      expect(d.rok(2026, '2026-11')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(d.osnov.length).toBeGreaterThan(5);
      expect(d.grupa).toBeTruthy();
    }
  });
});
