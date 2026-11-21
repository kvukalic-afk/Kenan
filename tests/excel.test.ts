import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { excelDatum, napraviExcel, nazivExcelFajla } from '../src/lib/excel';

describe('Excel izvoz', () => {
  it('datum je pravi Excel serijski broj', () => {
    expect(excelDatum('1900-03-01')).toBe(61);
    expect(excelDatum('2026-11-19')).toBe(46345);
    expect(excelDatum('')).toBeNull();
  });
  it('naziv fajla', () => {
    expect(nazivExcelFajla(new Date(2026, 10, 19))).toBe('Evidencija_psiholog_2026-11-19.xlsx');
  });
  it('pravi listove s bosanskim zaglavljima, datumima i prelamanjem', async () => {
    const T = '2026-11-01T00:00:00Z';
    const data = await napraviExcel({
      ucenici: [{ id: '1', sifra: 'U014', ime: 'Petar', prezime: 'Petrović', razred: '6-2', status: 'Aktivan', uPracenju: true, napomena: '', createdAt: T, updatedAt: T }],
      razgovori: [{ id: 'r', createdAt: T, updatedAt: T, datum: '2026-11-19', sifra: 'U014', razred: '6-2', vrstaKontakta: 'Grupni razgovor', inicirao: '', razlog: 'Izostanci',
        biljeske: 'Dug tekst '.repeat(30), zakljucak: '', preporuke: '', sljedeciKorak: '', datumSljedecegKontakta: '', statusSlucaja: 'Otvoren' }],
      radionice: [], saradnja: [], sifrarnik: [], razredi: [{ id: 'r', razred: '6-2', razrednik: 'Ana Anić', createdAt: T, updatedAt: T }],
      aktivnosti: [{ id: 'a', createdAt: T, updatedAt: T, datum: '2026-11-19', vrsta: 'Zamjena nastavnika', razred: '7-1', cas: '3', umjestoKoga: 'Ana Anić', predmet: 'Matematika', tema: 'Ponavljanje', zapazanja: '', napomena: '' }], plan: [], brzeBiljeske: [], obrisano: [], postavke: null,
    }, 2026);
    const wb = XLSX.read(data, { type: 'array', cellStyles: true, cellNF: true });
    expect(wb.SheetNames).toEqual(['Učenici', 'Razgovori', 'Radionice', 'Saradnja', 'Ostale aktivnosti', 'Statistika']);
    expect(wb.Sheets['Ostale aktivnosti']['B2'].v).toBe('Zamjena nastavnika');
    const ws = wb.Sheets['Razgovori'];
    expect(ws['A1'].v).toBe('Datum');
    expect(ws['A2'].v).toBe(46345);
    expect(ws['A2'].z).toBe('dd.mm.yyyy');
    const zip = (XLSX as any).CFB.read(data, { type: 'array' });
    const i = zip.FullPaths.findIndex((p: string) => p.endsWith('xl/styles.xml'));
    expect(new TextDecoder().decode(zip.FileIndex[i].content)).toContain('wrapText="1"');
  });
});
