import { describe, expect, it } from 'vitest';
import { bodovanje, brziUnos, brojStavki, instrument, INSTRUMENTI, najvisiNivo, obradiSociometriju, OBLASTI } from '../src/lib/instrumenti';

const sve = (n: number, v: number) => Object.fromEntries(Array.from({ length: n }, (_, i) => [String(i + 1), v]));

describe('definicije instrumenata', () => {
  it('ima 15 instrumenata s jedinstvenim ID-om i poznatom oblašću', () => {
    expect(INSTRUMENTI).toHaveLength(15);
    expect(new Set(INSTRUMENTI.map((i) => i.id)).size).toBe(15);
    for (const i of INSTRUMENTI) expect(OBLASTI).toContain(i.oblast);
  });

  it('skale pokrivaju samo postojeća pitanja i svaki informant ima pitanja', () => {
    for (const ins of INSTRUMENTI) {
      const n = brojStavki(ins);
      for (const sk of ins.skale) for (const b of sk.stavke ?? []) expect(b, `${ins.id}/${sk.id}`).toBeLessThanOrEqual(n);
      if (ins.nacin === 'u-appu') {
        for (const inf of ins.informanti) expect(ins.stavke?.[inf]?.length, `${ins.id}/${inf}`).toBe(ins.brojPitanja);
      }
    }
  });

  it('SCARED podskale dijele svih 41 pitanje bez preklapanja', () => {
    const s = instrument('scared')!;
    const sve41 = s.skale.filter((x) => x.id !== 'uk').flatMap((x) => x.stavke!);
    expect(sve41).toHaveLength(41);
    expect(new Set(sve41).size).toBe(41);
  });

  it('PSC-17 podskale pokrivaju 17 pitanja', () => {
    const p = instrument('psc17')!;
    const st = p.skale.filter((x) => x.id !== 'uk').flatMap((x) => x.stavke!);
    expect(new Set(st).size).toBe(17);
  });
});

describe('bodovanje', () => {
  it('PSC-17: granice podskala', () => {
    const p = instrument('psc17')!;
    const odg = sve(17, 0);
    for (const b of [2, 6, 9, 11, 15]) odg[String(b)] = 1; // emocionalne = 5
    const r = bodovanje(p, 'roditelj', odg);
    expect(r.skale.find((s) => s.id === 'int')).toMatchObject({ vrijednost: 5, nivo: 'povisen' });
    expect(r.skale.find((s) => s.id === 'paz')).toMatchObject({ vrijednost: 0, nivo: 'uredno' });
    expect(r.skale.find((s) => s.id === 'uk')).toMatchObject({ vrijednost: 5, nivo: 'uredno' });
  });

  it('Rosenberg: obrnuto bodovanje', () => {
    const r = instrument('rses')!;
    // svi „Potpuno se slažem“ (3): pozitivne 5×3 = 15, obrnute 5×0 = 0
    expect(bodovanje(r, 'dijete', sve(10, 3)).skale[0].vrijednost).toBe(15);
    // idealan odgovor: pozitivne 3, negativne 0 → 30
    const idealno = sve(10, 3);
    for (const b of [2, 5, 6, 8, 9]) idealno[String(b)] = 0;
    expect(bodovanje(r, 'dijete', idealno).skale[0]).toMatchObject({ vrijednost: 30, nivo: 'uredno' });
    expect(bodovanje(r, 'dijete', sve(10, 0)).skale[0].vrijednost).toBe(15);
  });

  it('PHQ-A: pitanje 9 i dodatna pitanja daju hitno upozorenje', () => {
    const p = instrument('phqa')!;
    const odg = sve(9, 0);
    expect(bodovanje(p, 'dijete', odg).upozorenja).toHaveLength(0);
    odg['9'] = 1;
    const r = bodovanje(p, 'dijete', odg);
    expect(r.upozorenja[0].nivo).toBe('alarm');
    expect(najvisiNivo(r)).toBe('alarm');
    const r2 = bodovanje(p, 'dijete', { ...sve(9, 0), 'd:misli': 1 });
    expect(r2.upozorenja.some((u) => u.nivo === 'alarm')).toBe(true);
  });

  it('SNAP-IV: prosjek i različite granice za nastavnika i roditelja', () => {
    const s = instrument('snap4')!;
    const odg = sve(26, 0);
    for (let i = 1; i <= 9; i++) odg[String(i)] = 2; // prosjek 2
    const nast = bodovanje(s, 'nastavnik', odg).skale.find((x) => x.id === 'paz')!;
    const rod = bodovanje(s, 'roditelj', odg).skale.find((x) => x.id === 'paz')!;
    expect(nast).toMatchObject({ vrijednost: 2, nivo: 'uredno' });
    expect(rod).toMatchObject({ vrijednost: 2, nivo: 'povisen' });
  });

  it('SDQ: unos podskala, ukupno i obrnuta prosocijalna skala', () => {
    const s = instrument('sdq')!;
    const r = bodovanje(s, 'nastavnik', { 's:emo': 5, 's:pon': 3, 's:hip': 7, 's:vrs': 1, 's:pro': 4 });
    expect(r.skale.find((x) => x.id === 'uk')).toMatchObject({ vrijednost: 16, nivo: 'povisen' });
    expect(r.skale.find((x) => x.id === 'pro')).toMatchObject({ nivo: 'povisen' });
    expect(r.skale.find((x) => x.id === 'emo')).toMatchObject({ nivo: 'granicno' });
    const rod = bodovanje(s, 'roditelj', { 's:emo': 5, 's:pon': 3, 's:hip': 7, 's:vrs': 1, 's:pro': 8 });
    expect(rod.skale.find((x) => x.id === 'emo')).toMatchObject({ nivo: 'povisen' });
    expect(rod.skale.find((x) => x.id === 'pro')).toMatchObject({ nivo: 'uredno' });
  });

  it('nepotpun upitnik nema procjenu', () => {
    const g = instrument('gad7')!;
    const r = bodovanje(g, 'dijete', { '1': 3, '2': 3, '3': 3, '4': 3 });
    expect(r.skale[0]).toMatchObject({ vrijednost: 12, nivo: 'info' });
    expect(r.skale[0].opis).toMatch(/Nepotpuno/);
  });

  it('SCARED: granica ukupnog skora i podskale panike', () => {
    const s = instrument('scared')!;
    const odg = sve(41, 0);
    for (const b of [1, 6, 9, 12, 15, 18, 19]) odg[String(b)] = 1;
    const r = bodovanje(s, 'dijete', odg);
    expect(r.skale.find((x) => x.id === 'pan')).toMatchObject({ vrijednost: 7, nivo: 'povisen' });
    expect(r.skale.find((x) => x.id === 'uk')).toMatchObject({ vrijednost: 7, nivo: 'uredno' });
  });

  it('brzi unos s papira odbacuje nedozvoljene cifre (CRIES 0-1-3-5)', () => {
    const c = instrument('cries8')!;
    const { odgovori, greske } = brziUnos(c, '0 1 3 5, 2 5 5 3');
    expect(odgovori).toEqual({ '1': 0, '2': 1, '3': 3, '4': 5, '6': 5, '7': 5, '8': 3 });
    expect(greske).toEqual([5]);
    expect(bodovanje(c, 'dijete', { ...odgovori, '5': 5 }).skale[0]).toMatchObject({ vrijednost: 27, nivo: 'povisen' });
  });
});

describe('sociometrija', () => {
  it('broji primljene izbore, uzajamne parove i djecu bez izbora', () => {
    const r = obradiSociometriju(['A', 'B', 'C', 'D', 'E'], {
      A: ['B', 'C'], B: ['A', 'C'], C: ['A', 'B'], D: ['A', 'X', 'D'], E: [],
    }, ['E']);
    const red = (s: string) => r.redovi.find((x) => x.sifra === s)!;
    expect(red('A')).toMatchObject({ primio: 3, uzajamni: 2, dao: 2 });
    expect(red('D')).toMatchObject({ primio: 0, dao: 1, status: 'Bez ijednog izbora' });
    expect(red('E').odsutan).toBe(true);
    expect(r.parovi).toHaveLength(3);
    expect(r.bezIzbora).toEqual(['D', 'E']);
    expect(r.ukupnoIzbora).toBe(7);
  });
});
