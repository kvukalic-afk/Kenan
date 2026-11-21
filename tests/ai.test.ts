import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { db } from '../src/db/db';
import { SISTEM, tekstZaKopiranje } from '../src/lib/ai';

describe('AI: tekst koji napušta uređaj', () => {
  it('ne sadrži imena učenika (čita spisak iz baze)', async () => {
    const T = '2026-11-01T00:00:00Z';
    await db.ucenici.put({ id: 'x', sifra: 'U056', ime: 'Petar', prezime: 'Petrović', razred: '7-1', status: 'Aktivan', uPracenju: false, napomena: '', createdAt: T, updatedAt: T });
    const t = await tekstZaKopiranje('hodnik, Petar Petrović plakao, petrović kaže da ga diraju', 'biljeska', 'razgovor s Petrom Petrovićem');
    expect(t).toContain('U056');
    expect(t).not.toMatch(/Petar|Petrović/i);
    expect(t.startsWith(SISTEM)).toBe(true);
  });
});
