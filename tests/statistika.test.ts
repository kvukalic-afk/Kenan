import { describe, expect, it } from 'vitest';
import { izracunajStatistiku, mjeseciSkolskeGodine, sazetak } from '../src/lib/statistika';
import { skolskaGodinaZaDatum } from '../src/lib/datum';
import type { Radionica, Razgovor, Saradnja, Ucenik } from '../src/types';

const baza = { createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' };
let n = 0;
const razg = (datum: string, sifra: string, p: Partial<Razgovor> = {}): Razgovor => ({
  ...baza, id: `r${++n}`, datum, sifra, razred: '', vrstaKontakta: 'Individualni razgovor s učenikom', inicirao: '', razlog: 'Problemi u učenju',
  biljeske: '', zakljucak: '', preporuke: '', sljedeciKorak: '', datumSljedecegKontakta: '', statusSlucaja: 'Otvoren', ...p,
});
const rad = (datum: string, broj: number, p: Partial<Radionica> = {}): Radionica => ({
  ...baza, id: `w${++n}`, datum, razred: '7-1', tema: 'T', oblast: 'Prevencija nasilja', ciljnaGrupa: 'Učenici', brojUcesnika: broj, trajanjeMin: 45,
  cilj: '', tokAktivnosti: '', zapazanja: '', ucenicizaPracenje: [], evaluacija: '', napomena: '', ...p,
});
const sar = (datum: string, p: Partial<Saradnja> = {}): Saradnja => ({
  ...baza, id: `s${++n}`, datum, sifra: '', ustanovaOsoba: 'Roditelj/staratelj', opisOsobe: '', nacin: 'Sastanak', razlog: '', dogovorIshod: '', ...p,
});
const uc = (sifra: string, p: Partial<Ucenik> = {}): Ucenik => ({ ...baza, id: sifra, sifra, razred: '6-1', status: 'Aktivan', uPracenju: false, napomena: '', ...p });

describe('školska godina', () => {
  it('od septembra je tekuća godina', () => {
    expect(skolskaGodinaZaDatum(new Date(2026, 8, 1))).toBe(2026);
    expect(skolskaGodinaZaDatum(new Date(2026, 10, 19))).toBe(2026);
    expect(skolskaGodinaZaDatum(new Date(2027, 7, 31))).toBe(2026);
    expect(skolskaGodinaZaDatum(new Date(2026, 7, 31))).toBe(2025);
  });
  it('mjeseci idu od septembra do augusta', () => {
    const m = mjeseciSkolskeGodine(2026);
    expect(m).toHaveLength(12);
    expect(m[0].kljuc).toBe('2026-09');
    expect(m[3].kljuc).toBe('2026-12');
    expect(m[4].kljuc).toBe('2027-01');
    expect(m[11].kljuc).toBe('2027-08');
    expect(m.filter((x) => x.polugodiste === 'I')).toHaveLength(4);
    expect(m.filter((x) => x.polugodiste === 'II')).toHaveLength(6);
  });
});

describe('statistika po mjesecima i polugodištima', () => {
  const ulaz = {
    ucenici: [uc('U1', { uPracenju: true }), uc('U2'), uc('U3', { status: 'Ispisan' })],
    razgovori: [
      razg('2026-09-05', 'U1'),
      razg('2026-09-20', 'U1', { statusSlucaja: 'U praćenju', razlog: 'Izostanci' }),
      razg('2026-12-31', 'U2'),
      razg('2027-01-01', 'U2', { statusSlucaja: 'Zatvoren' }),
      razg('2027-07-10', 'U3'),
      razg('2026-08-31', 'U1'), // prethodna školska godina
      razg('2027-09-01', 'U1'), // sljedeća školska godina
    ],
    radionice: [rad('2026-10-10', 24), rad('2027-03-03', 20, { oblast: 'Tehnike učenja' }), rad('2027-03-04', 0, { brojUcesnika: null })],
    saradnja: [sar('2026-11-11'), sar('2027-06-30', { ustanovaOsoba: 'Centar za socijalni rad' })],
  };
  const s = izracunajStatistiku(ulaz, 2026);

  it('broji po mjesecima', () => {
    const po = Object.fromEntries(s.mjeseci.map((m) => [m.kljuc, m]));
    expect(po['2026-09'].razgovori).toBe(2);
    expect(po['2026-12'].razgovori).toBe(1);
    expect(po['2027-01'].razgovori).toBe(1);
    expect(po['2027-07'].razgovori).toBe(1);
    expect(po['2026-10']).toMatchObject({ radionice: 1, ucesnici: 24 });
    expect(po['2027-03']).toMatchObject({ radionice: 2, ucesnici: 20 });
    expect(po['2026-11'].saradnja).toBe(1);
  });
  it('sabira polugodišta (I: sep–dec, II: jan–jun) i ukupno', () => {
    expect(s.polugodisteI).toMatchObject({ razgovori: 3, radionice: 1, ucesnici: 24, saradnja: 1 });
    expect(s.polugodisteII).toMatchObject({ razgovori: 1, radionice: 2, ucesnici: 20, saradnja: 1 });
    expect(s.ukupno).toMatchObject({ razgovori: 5, radionice: 3, ucesnici: 44, saradnja: 2 });
  });
  it('raspodjele i brojevi', () => {
    expect(s.poRazlogu[0]).toEqual({ naziv: 'Problemi u učenju', broj: 4 });
    expect(s.statusSlucajeva.find((x) => x.naziv === 'U praćenju')?.broj).toBe(1);
    expect(s.statusSlucajeva.find((x) => x.naziv === 'Zatvoren')?.broj).toBe(1);
    expect(s.ucenikaURazgovorima).toBe(3);
    expect(s.uPracenju).toBe(1);
    expect(s.aktivnihUcenika).toBe(2);
  });
  it('polugodišnja statistika filtrira raspodjele', () => {
    const s1 = izracunajStatistiku(ulaz, 2026, 'I');
    expect(s1.ucenikaURazgovorima).toBe(2);
    expect(s1.radionicePoOblasti).toEqual([{ naziv: 'Prevencija nasilja', broj: 1 }]);
    expect(sazetak(s1)).toContain('U I polugodištu školske 2026/2027. godine obavljena su 3 razgovora s 2 učenika.');
  });
  it('gramatika sažetka', () => {
    const veliki = {
      ucenici: [],
      razgovori: Array.from({ length: 64 }, (_, i) => razg('2026-10-01', `U${i % 31}`)),
      radionice: [], saradnja: [],
    };
    expect(sazetak(izracunajStatistiku(veliki, 2026, 'I'))).toContain('obavljeno je 64 razgovora s 31 učenikom');
  });
});
