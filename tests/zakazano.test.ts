import { describe, expect, it } from 'vitest';
import { izracunajZakazano, tekstOznake } from '../src/lib/zakazano';
import type { Razgovor } from '../src/types';

let n = 0;
function r(p: Partial<Razgovor>): Razgovor {
  n++;
  return {
    id: `r${n}`, createdAt: `2026-01-01T00:00:${String(n).padStart(2, '0')}Z`, updatedAt: '', datum: '2026-11-01', sifra: 'U1', razred: '6-1',
    vrstaKontakta: '', inicirao: '', razlog: '', biljeske: '', zakljucak: '', preporuke: '', sljedeciKorak: '',
    datumSljedecegKontakta: '', statusSlucaja: 'Otvoren', ...p,
  };
}

describe('Zakazano', () => {
  const danas = '2026-11-19';
  it('uzima samo zadnji razgovor po učeniku', () => {
    const lista = izracunajZakazano([
      r({ sifra: 'U1', datum: '2026-10-01', datumSljedecegKontakta: '2026-10-15' }),
      r({ sifra: 'U1', datum: '2026-11-10', datumSljedecegKontakta: '' }),
    ], danas);
    expect(lista).toEqual([]);
  });
  it('preskače zatvorene i upućene dalje', () => {
    const lista = izracunajZakazano([
      r({ sifra: 'U1', datumSljedecegKontakta: '2026-11-25', statusSlucaja: 'Zatvoren' }),
      r({ sifra: 'U2', datumSljedecegKontakta: '2026-11-25', statusSlucaja: 'Upućen dalje' }),
      r({ sifra: 'U3', datumSljedecegKontakta: '2026-11-25', statusSlucaja: 'U praćenju' }),
    ], danas);
    expect(lista.map((z) => z.sifra)).toEqual(['U3']);
  });
  it('označava kasni / danas / za X dana i sortira po datumu', () => {
    const lista = izracunajZakazano([
      r({ sifra: 'U1', datumSljedecegKontakta: '2026-11-29' }),
      r({ sifra: 'U2', datumSljedecegKontakta: '2026-11-19' }),
      r({ sifra: 'U3', datumSljedecegKontakta: '2026-11-12' }),
    ], danas);
    expect(lista.map((z) => [z.sifra, z.oznaka, z.dana])).toEqual([
      ['U3', 'kasni', -7], ['U2', 'danas', 0], ['U1', 'uskoro', 10],
    ]);
    expect(tekstOznake(lista[0])).toBe('kasni 7 dana');
    expect(tekstOznake(lista[2])).toBe('za 10 dana');
    expect(tekstOznake({ oznaka: 'uskoro', dana: 21 })).toBe('za 21 dan');
  });
  it('kod istog datuma razgovora pobjeđuje kasnije unesen', () => {
    const lista = izracunajZakazano([
      r({ sifra: 'U1', datum: '2026-11-10', datumSljedecegKontakta: '2026-11-20' }),
      r({ sifra: 'U1', datum: '2026-11-10', datumSljedecegKontakta: '2026-12-01' }),
    ], danas);
    expect(lista[0].datum).toBe('2026-12-01');
  });
});
