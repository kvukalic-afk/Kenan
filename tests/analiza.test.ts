import { describe, expect, it } from 'vitest';
import { porukaRezima, REZIMI } from '../src/lib/analiza';

describe('AI alati u kartonu', () => {
  it('priprema i procjena koriste opis i rade i bez ranijih zapisa', () => {
    const p = porukaRezima('priprema', 'U056, razred 7-1', '', 'Razgovor s majkom zbog izostanaka.');
    expect(p).toContain('Razgovor i šta znam:');
    expect(p).toContain('Nema ranijih zapisa.');
    const t = porukaRezima('teskoce', 'U056, razred 7-1', '[20.11.2026] Razgovor: …', 'Sporo čita.');
    expect(t).toContain('Opis teškoća i sastanka:');
    expect(t).toContain('[20.11.2026]');
  });
  it('procjena teškoća izričito ne postavlja dijagnozu i upućuje na nadležne', () => {
    expect(REZIMI.teskoce.sistem).toContain('dijagnozu ne postavljaš');
    expect(REZIMI.teskoce.sistem).toContain('Stručno tijelo');
    expect(REZIMI.teskoce.obavezanOpis).toBe(true);
    expect(REZIMI.pregled.obavezanOpis).toBe(false);
  });
});
