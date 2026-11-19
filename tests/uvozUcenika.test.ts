import { describe, expect, it } from 'vitest';
import { pregledajUvoz, tekstUTabelu } from '../src/lib/uvozUcenika';

describe('uvoz popisa učenika', () => {
  it('čita zalijepljene kolone iz Excela sa zaglavljem', () => {
    const t = tekstUTabelu('Šifra\tRazred\nU001\t6-1\nu002\t6/1\n');
    const p = pregledajUvoz(t, []);
    expect(p.redovi.map((r) => [r.sifra, r.razred, r.stanje])).toEqual([['U001', '6-1', 'novi'], ['U002', '6-1', 'novi']]);
  });
  it('prepoznaje postojeće, promjenu razreda, duplikate i imena', () => {
    const t = tekstUTabelu('U001;6-1\nU002;7-1\nU003;7-1\nU003;7-1\nPetar Petrović;7-1');
    const p = pregledajUvoz(t, [{ sifra: 'U001', razred: '6-1' }, { sifra: 'U002', razred: '6-2' }]);
    expect(p.redovi.map((r) => r.stanje)).toEqual(['isti', 'azuriran', 'novi', 'greska', 'greska']);
    expect(p).toMatchObject({ novi: 1, azurirani: 1, isti: 1, greske: 2 });
  });
  it('CSV s navodnicima i obrnutim kolonama', () => {
    const t = tekstUTabelu('"Razred","Šifra"\n"8-2","U100"');
    expect(pregledajUvoz(t, []).redovi[0]).toMatchObject({ sifra: 'U100', razred: '8-2' });
  });
  it('čita ime i prezime i razrednika', () => {
    const t = tekstUTabelu('Šifra;Razred;Ime i prezime;Razrednik\nU001;7-1;Petar Petrović;Ana Anić\nU002;7-1;Marija Ana Marić;Ana Anić');
    const p = pregledajUvoz(t, [{ sifra: 'U002', razred: '7-1', ime: 'Marija', prezime: '' }]);
    expect(p.redovi[0]).toMatchObject({ sifra: 'U001', ime: 'Petar', prezime: 'Petrović', stanje: 'novi' });
    expect(p.redovi[1]).toMatchObject({ ime: 'Marija', prezime: 'Ana Marić', stanje: 'azuriran' });
    expect(p.razrednici).toEqual({ '7-1': 'Ana Anić' });
  });
  it('odvojene kolone Ime i Prezime', () => {
    const t = tekstUTabelu('Prezime\tIme\tŠifra\tRazred\nPetrović\tPetar\tU005\t6-1');
    expect(pregledajUvoz(t, []).redovi[0]).toMatchObject({ sifra: 'U005', ime: 'Petar', prezime: 'Petrović', razred: '6-1' });
  });
});
