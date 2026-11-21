import 'fake-indexeddb/auto';
import { beforeAll, describe, expect, it } from 'vitest';
import { db } from '../src/db/db';
import { anonimizujSve, SISTEM, tekstZaKopiranje } from '../src/lib/ai';

const T = '2026-11-01T00:00:00Z';
beforeAll(async () => {
  await db.ucenici.put({ id: 'x', sifra: 'U056', ime: 'Petar', prezime: 'Petrović', razred: '7-1', status: 'Aktivan', uPracenju: false, napomena: '', createdAt: T, updatedAt: T });
  await db.razredi.put({ id: 'r', razred: '7-1', razrednik: 'Marko Marković', createdAt: T, updatedAt: T });
});

describe('AI: tekst koji napušta uređaj', () => {
  it('ne sadrži imena učenika (čita spisak iz baze)', async () => {
    const t = await tekstZaKopiranje('hodnik, Petar Petrović plakao, petrović kaže da ga diraju', 'biljeska', 'razgovor s Petrom Petrovićem');
    expect(t).toContain('U056');
    expect(t).not.toMatch(/Petar|Petrović/i);
    expect(t.startsWith(SISTEM)).toBe(true);
  });
  it('imena razrednika postaju uloga, i u padežima', async () => {
    const t = await anonimizujSve('Razgovarala sam s Markom Markovićem o Petru. Marković kaže da Petar Petrović kasni.');
    expect(t).not.toMatch(/Mark|Petr/);
    expect(t).toContain('razrednik 7-1');
    expect(t).toContain('U056');
  });
});
