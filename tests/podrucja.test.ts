import { describe, expect, it } from 'vitest';
import { evidencijaPoPodrucjima, PODRUCJA, podrucjeAktivnosti, podrucjeRazgovora, podrucjeSaradnje, PRIJEDLOG_PLANA, stavkeDnevnika, uMjesecu, vrijemeRealizacije } from '../src/lib/podrucja';

const T = '2026-11-01T00:00:00Z';

describe('područja rada (USK, 40 sati)', () => {
  it('norma je ukupno 40 sati sedmično u 11 područja', () => {
    expect(PODRUCJA).toHaveLength(11);
    expect(PODRUCJA.reduce((s, p) => s + p.sati, 0)).toBe(40);
  });
  it('svrstava rad u područja', () => {
    expect(podrucjeRazgovora({ vrstaKontakta: 'Razgovor s roditeljem' })).toBe(8);
    expect(podrucjeRazgovora({ vrstaKontakta: 'Razgovor s razrednikom/nastavnikom' })).toBe(4);
    expect(podrucjeRazgovora({ vrstaKontakta: 'Individualni razgovor s učenikom' })).toBe(5);
    expect(podrucjeSaradnje({ ustanovaOsoba: 'Centar za socijalni rad' })).toBe(7);
    expect(podrucjeAktivnosti({ vrsta: 'Stručno usavršavanje' })).toBe(10);
    expect(podrucjeAktivnosti({ vrsta: 'Dežurstvo' })).toBe(0);
    expect(podrucjeAktivnosti({ vrsta: 'Ostalo', podrucje: 3 })).toBe(3);
  });
  it('dnevnik i evidencioni list sabiraju sate', () => {
    const st = stavkeDnevnika({
      razgovori: [{ id: 'r', createdAt: T, updatedAt: T, datum: '2026-11-16', sifra: 'U1', razred: '7-1', vrstaKontakta: 'Individualni razgovor s učenikom', inicirao: '', razlog: 'Izostanci',
        biljeske: '', zakljucak: '', preporuke: '', sljedeciKorak: '', datumSljedecegKontakta: '', statusSlucaja: 'Otvoren' }],
      radionice: [], saradnja: [],
      aktivnosti: [{ id: 'a', createdAt: T, updatedAt: T, datum: '2026-11-17', vrsta: 'Zamjena nastavnika', razred: '7-1', cas: '3', umjestoKoga: '', predmet: 'Matematika', tema: '', zapazanja: '', napomena: '', trajanjeMin: 90 }],
    }, '2026-11-16', '2026-11-22');
    expect(st.map((s) => [s.podrucje, s.minuta])).toEqual([[5, 45], [5, 90]]);
    const ev = evidencijaPoPodrucjima(st, 1);
    expect(ev.find((r) => r.kod === 5)).toMatchObject({ norma: 10, ostvareno: 2.3 });
    expect(evidencijaPoPodrucjima(st, 4).find((r) => r.kod === 11)?.norma).toBe(40);
  });
  it('plan: vrijeme realizacije i mjesec', () => {
    expect(vrijemeRealizacije([])).toBe('tokom godine');
    expect(vrijemeRealizacije([1, 9, 6])).toBe('sep, jan, jun');
    expect(uMjesecu([], '2026-11')).toBe(true);
    expect(uMjesecu([9, 10], '2026-11')).toBe(false);
    expect(PRIJEDLOG_PLANA.every((p) => p.podrucje >= 1 && p.podrucje <= 11)).toBe(true);
    expect(new Set(PRIJEDLOG_PLANA.map((p) => p.podrucje)).size).toBe(11);
  });
});
