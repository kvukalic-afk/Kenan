import { describe, expect, it } from 'vitest';
import { anonimizuj, brojPerioda, naslovIzvjestaja, sazetakPerioda, stavkePerioda, tekstZaAI, vrstaPerioda, type UlazPerioda } from '../src/lib/periodIzvjestaj';

const T = '2026-11-01T00:00:00Z';
const ulaz: UlazPerioda = {
  ucenici: [
    { id: '1', sifra: 'U014', ime: 'Petar', prezime: 'Petrović', razred: '7-1', status: 'Aktivan', uPracenju: false, napomena: '', createdAt: T, updatedAt: T },
    { id: '2', sifra: 'U015', ime: 'Ali', prezime: 'Alić', razred: '7-1', status: 'Aktivan', uPracenju: false, napomena: '', createdAt: T, updatedAt: T },
  ],
  razgovori: [
    { id: 'r1', createdAt: T, updatedAt: T, datum: '2026-11-16', sifra: 'U014', razred: '7-1', vrstaKontakta: 'Individualni razgovor s učenikom', inicirao: '', razlog: 'Izostanci',
      biljeske: 'Petar Petrović kaže da mu je teško, ali se trudi. Ali Alić je bio prisutan.', zakljucak: '', preporuke: '', sljedeciKorak: '', datumSljedecegKontakta: '', statusSlucaja: 'Otvoren' },
    { id: 'r2', createdAt: T, updatedAt: T, datum: '2026-11-25', sifra: 'U015', razred: '7-1', vrstaKontakta: 'Grupni razgovor', inicirao: '', razlog: '',
      biljeske: '', zakljucak: '', preporuke: '', sljedeciKorak: '', datumSljedecegKontakta: '', statusSlucaja: 'Otvoren' },
  ],
  radionice: [],
  saradnja: [{ id: 's1', createdAt: T, updatedAt: T, datum: '2026-11-17', sifra: 'U014', ustanovaOsoba: 'Roditelj/staratelj', opisOsobe: 'majka, Ana Anić', nacin: 'Telefon', razlog: '', dogovorIshod: '' }],
  aktivnosti: [
    { id: 'a1', createdAt: T, updatedAt: T, datum: '2026-11-18', vrsta: 'Zamjena nastavnika', razred: '7-2', cas: '3', umjestoKoga: 'Emir Emirović', predmet: 'Matematika', tema: '', zapazanja: '', napomena: '' },
    { id: 'a2', createdAt: T, updatedAt: T, datum: '2026-11-19', vrsta: 'Čas odjeljenske zajednice', razred: '8-1', cas: '', umjestoKoga: '', predmet: '', tema: 'Sukobi', zapazanja: '', napomena: '' },
  ],
};

describe('izvještaj za period', () => {
  it('prepoznaje dan, sedmicu (pon–ned) i mjesec', () => {
    expect(vrstaPerioda('2026-11-20', '2026-11-20')).toBe('dan');
    expect(vrstaPerioda('2026-11-16', '2026-11-22')).toBe('sedmica');
    expect(vrstaPerioda('2026-11-17', '2026-11-23')).toBe('period');
    expect(vrstaPerioda('2026-11-01', '2026-11-30')).toBe('mjesec');
    expect(naslovIzvjestaja('2026-11-16', '2026-11-22')).toBe('SEDMIČNI IZVJEŠTAJ O RADU PSIHOLOGA');
  });
  it('bira stavke i broji samo u periodu', () => {
    const st = stavkePerioda(ulaz, '2026-11-16', '2026-11-22');
    expect(st.map((s) => s.id)).toEqual(['r1', 's1', 'a1', 'a2']);
    expect(st[2].umjesto).toBe('Emir Emirović');
    const b = brojPerioda(ulaz, '2026-11-16', '2026-11-22');
    expect(b).toMatchObject({ razgovori: 1, ucenika: 1, saradnja: 1, aktivnosti: 2, zamjene: 1, casoviOZ: 1 });
    expect(sazetakPerioda(b, '2026-11-16', '2026-11-22')).toBe('U toku sedmice evidentirano je: 1 razgovor s 1 učenikom, 1 kontakt saradnje, 1 zamjena i 1 čas odjeljenske zajednice.');
  });
  it('anonimizuje imena, ali ne obične riječi', () => {
    expect(anonimizuj('Petar Petrović kaže, ali Ali Alić šuti. Petrović Petar.', ulaz.ucenici)).toBe('U014 kaže, ali U015 šuti. U014.');
    expect(anonimizuj('Razgovarao sam s Petrom? Petar je došao.', ulaz.ucenici)).toBe('Razgovarao sam s [učenik]? [učenik] je došao.');
    expect(anonimizuj('s Petrom Petrovićem i petrovićem, ali Alića nije bilo', ulaz.ucenici)).toBe('s U014 i [učenik], ali [učenik] nije bilo');
    expect(anonimizuj('Ponavljali smo petice i petrolej.', ulaz.ucenici)).toBe('Ponavljali smo petice i petrolej.');
  });
  it('tekst za AI nema imena učenika ni nastavnika', () => {
    const t = tekstZaAI(ulaz, '2026-11-16', '2026-11-22', { biljeske: true });
    expect(t).toContain('sedmični izvještaj');
    expect(t).toContain('U014');
    expect(t).not.toMatch(/Petar|Petrović|Alić|Emirović|Ana Anić/);
    expect(t).toContain('Zamjena nastavnika');
    const bez = tekstZaAI(ulaz, '2026-11-16', '2026-11-22', { biljeske: false });
    expect(bez).not.toContain('teško');
  });
});
