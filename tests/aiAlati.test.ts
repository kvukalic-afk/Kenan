import { describe, expect, it } from 'vitest';
import { izvuciJSON, procitajObrazac, procitajPlan, procitajRadionicu, sistemObrasca, ucitajPripremu } from '../src/lib/aiAlati';
import { definicija } from '../src/lib/obrasci';
import { brifingZaAI, napraviBrifing, raniZnakovi, stanjeSati } from '../src/lib/brifing';
import type { BrzaBiljeska, Razgovor, Ucenik } from '../src/types';

const T = '2026-11-01T00:00:00Z';
const raz = (p: Partial<Razgovor>): Razgovor => ({ id: Math.random().toString(), createdAt: T, updatedAt: T, datum: '2026-11-20', sifra: 'U1', razred: '7-1', vrstaKontakta: '', inicirao: '', razlog: '', biljeske: '', zakljucak: '', preporuke: '', sljedeciKorak: '', datumSljedecegKontakta: '', statusSlucaja: 'Otvoren', ...p });
const bil = (p: Partial<BrzaBiljeska>): BrzaBiljeska => ({ id: Math.random().toString(), createdAt: T, updatedAt: T, datum: '2026-11-20', sifra: '', tekst: '', sroceno: '', obradjena: false, ...p });
const uc = (sifra: string, uPracenju = false): Ucenik => ({ id: sifra, sifra, razred: '6-3', ime: 'Ime', prezime: 'Prezime', status: 'Aktivan', uPracenju, napomena: '', createdAt: T, updatedAt: T } as Ucenik);

describe('obrada AI odgovora', () => {
  it('izvlači JSON iz teksta s ogradama', () => {
    expect(izvuciJSON('Evo:\n```json\n[{"a":1}]\n```')).toEqual([{ a: 1 }]);
    expect(izvuciJSON('{"x":"y"} hvala')).toEqual({ x: 'y' });
    expect(izvuciJSON('nema json-a')).toBeNull();
  });
  it('plan: odbacuje nepostojeća područja i čisti mjesece', () => {
    const p = procitajPlan('[{"podrucje":5,"sadrzaj":"Rad s učenicima","mjeseci":[9,13,"10"],"saradnici":"razrednici"},{"podrucje":12,"sadrzaj":"x"},{"podrucje":3,"sadrzaj":""}]');
    expect(p).toEqual([{ podrucje: 5, sadrzaj: 'Rad s učenicima', mjeseci: [9, 10], saradnici: 'razrednici' }]);
  });
  it('obrazac: samo poznata polja, datum u ISO, izbor iz ponuđenih', () => {
    const def = definicija('zapisnik')!;
    expect(sistemObrasca(def)).toContain('"zakljucci"');
    const v = procitajObrazac(def, '{"datum":"25.11.2026","vrstaSastanka":"nastavničko vijeće","zakljucci":["1. A","2. B"],"ucenik":"U1","nesto":"x"}');
    expect(v).toEqual({ datum: '2026-11-25', vrstaSastanka: 'Nastavničko vijeće', zakljucci: '1. A\n2. B' });
  });
  it('radionica: traži temu', () => {
    expect(procitajRadionicu('{"cilj":"x"}')).toBeNull();
    expect(procitajRadionicu('{"tema":"T","cilj":"C","tokAktivnosti":["1. a","2. b"]}')?.tok[0].voditelj).toBe('1. a\n2. b');
    const p = procitajRadionicu('{"tema":"T","zadaci":{"obrazovni":"O"},"ishodi":["a","b"],"tok":[{"etapa":"Uvodni dio","minuta":"5","voditelj":"V","ucenici":"U"},{"etapa":"Glavni dio","minuta":30}],"materijal":"papir"}')!;
    expect(p.zadaci).toEqual({ obrazovni: 'O', odgojni: '', funkcionalni: '' });
    expect(p.ishodi).toEqual(['a', 'b']);
    expect(p.tok.map((e) => e.minuta)).toEqual([5, 30]);
    expect(p.sredstva).toBe('papir');
    expect(ucitajPripremu(JSON.stringify(p))?.tema).toBe('T');
    expect(ucitajPripremu('Cilj: stari tekst')).toBeNull();
  });
});

describe('jutarnji brifing', () => {
  it('rani znakovi: rizične riječi i učestali zapisi, bez onih u praćenju', () => {
    const s = raniZnakovi('2026-11-25', [raz({ sifra: 'U2', biljeske: 'Navodi da ga udaraju na odmoru.' })],
      [bil({ sifra: 'U1', tekst: 'plače' }), bil({ sifra: 'U1', tekst: 'sama' }), bil({ sifra: 'U3', tekst: 'tuča' }), bil({ sifra: 'U4', tekst: 'ok', datum: '2026-09-01' })],
      [uc('U1'), uc('U2'), uc('U3', true), uc('U4')]);
    expect(s.map((x) => x.sifra)).toEqual(['U2', 'U1']);
    expect(s[0].razlog).toContain('nasilje');
    expect(s[1].razlog).toContain('2 zapisa');
  });
  it('40-satna sedmica: područja bez unosa nakon prve sedmice', () => {
    const ulaz = { razgovori: [raz({ datum: '2026-11-10', trajanjeMin: 60 })], radionice: [], saradnja: [], aktivnosti: [] };
    const s = stanjeSati('2026-11-25', ulaz)!;
    expect(s.ostvareno).toBe(1);
    expect(s.ocekivano).toBeGreaterThan(100);
    expect(s.bezEvidencije.map((x) => x.kod)).toContain(11);
    expect(stanjeSati('2026-11-03', ulaz)).toBeNull();
  });
  it('sažetak za AI ne sadrži imena ni bilješke', () => {
    const b = napraviBrifing({ danas: '2026-11-25', razgovori: [raz({ sifra: 'U1', biljeske: 'TAJNO', datumSljedecegKontakta: '2026-11-24', sljedeciKorak: 'pozvati majku' })], biljeske: [], ucenici: [uc('U1')], ulaz: { razgovori: [], radionice: [], saradnja: [], aktivnosti: [] }, obaveze: [] });
    const t = brifingZaAI(b, '2026-11-25');
    expect(t).toContain('U1');
    expect(t).not.toContain('TAJNO');
    expect(t).not.toContain('Prezime');
    expect(b.kontakti[0].oznaka).toBe('kasni');
  });
});
