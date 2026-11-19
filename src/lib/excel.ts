// Izvoz u Excel (SheetJS, uključen lokalno – učitava se tek kad zatreba).
// Datumi su pravi Excel datumi (serijski broj) s formatom DD.MM.YYYY.
// SheetJS Community ne piše stilove ćelija, pa se prelamanje teksta dodaje
// naknadnom izmjenom xl/styles.xml unutar .xlsx (zip) fajla.

import type { Snimak } from './backup';
import { izracunajStatistiku, type Statistika } from './statistika';
import { nazivSkolskeGodine } from './datum';

type XLSXMod = typeof import('xlsx');

const FORMAT_DATUMA = 'dd.mm.yyyy';

/** "2026-11-19" → Excel serijski broj (1900 sistem) */
export function excelDatum(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return null;
  return (Date.UTC(+m[1], +m[2] - 1, +m[3]) - Date.UTC(1899, 11, 30)) / 86400000;
}

interface Kolona<T> {
  naslov: string;
  sirina: number;
  vrijednost: (r: T) => string | number | boolean | null | undefined;
  datum?: boolean;
}

function napraviList<T>(X: XLSXMod, redovi: T[], kolone: Kolona<T>[]) {
  const ws: Record<string, unknown> = {};
  kolone.forEach((k, c) => {
    ws[X.utils.encode_cell({ r: 0, c })] = { t: 's', v: k.naslov };
  });
  redovi.forEach((red, i) => {
    kolone.forEach((k, c) => {
      const adr = X.utils.encode_cell({ r: i + 1, c });
      const v = k.vrijednost(red);
      if (k.datum) {
        const n = excelDatum(String(v ?? ''));
        if (n != null) ws[adr] = { t: 'n', v: n, z: FORMAT_DATUMA };
        return;
      }
      if (v === null || v === undefined || v === '') return;
      if (typeof v === 'number') ws[adr] = { t: 'n', v };
      else if (typeof v === 'boolean') ws[adr] = { t: 's', v: v ? 'da' : 'ne' };
      else ws[adr] = { t: 's', v: String(v) };
    });
  });
  ws['!ref'] = X.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(redovi.length, 1), c: kolone.length - 1 } });
  ws['!cols'] = kolone.map((k) => ({ wch: k.sirina }));
  ws['!autofilter'] = { ref: X.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(redovi.length, 1), c: kolone.length - 1 } }) };
  return ws;
}

function listStatistike(X: XLSXMod, s: Statistika) {
  const aoa: (string | number)[][] = [];
  aoa.push([`Statistika za školsku ${nazivSkolskeGodine(s.pocetak)}. godinu`]);
  aoa.push([]);
  aoa.push(['Mjesec', 'Razgovori', 'Radionice', 'Učesnici radionica', 'Kontakti saradnje']);
  for (const m of s.mjeseci) aoa.push([m.naziv, m.razgovori, m.radionice, m.ucesnici, m.saradnja]);
  for (const z of [s.polugodisteI, s.polugodisteII, s.ukupno]) aoa.push([z.naziv, z.razgovori, z.radionice, z.ucesnici, z.saradnja]);
  aoa.push([]);
  aoa.push(['Broj različitih učenika s kojima je rađeno', s.razlicitihUcenika]);
  aoa.push(['Učenici u praćenju', s.uPracenju]);
  aoa.push(['Ukupno učenika (aktivni)', s.aktivnihUcenika]);
  const raspodjele: [string, { naziv: string; broj: number }[]][] = [
    ['Razgovori po razlogu', s.poRazlogu],
    ['Razgovori po vrsti kontakta', s.poVrstiKontakta],
    ['Status slučajeva (zadnji razgovor po učeniku)', s.statusSlucajeva],
    ['Radionice po oblasti', s.radionicePoOblasti],
    ['Saradnja po ustanovi/osobi', s.saradnjaPoUstanovi],
  ];
  for (const [naslov, r] of raspodjele) {
    aoa.push([]);
    aoa.push([naslov, 'Broj']);
    if (!r.length) aoa.push(['–', 0]);
    for (const x of r) aoa.push([x.naziv, x.broj]);
  }
  const ws = X.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{ wch: 46 }, { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 18 }];
  return ws;
}

/** Dodaje prelamanje teksta i poravnanje na vrh svim stilovima ćelija. */
export function dodajPrelamanje(X: XLSXMod, data: Uint8Array): Uint8Array {
  const CFB = (X as unknown as { CFB: any }).CFB;
  const zip = CFB.read(data, { type: 'array' });
  const putanja = zip.FullPaths.findIndex((p: string) => /xl\/styles\.xml$/.test(p));
  if (putanja < 0) return data;
  const unos = zip.FileIndex[putanja];
  let xml = new TextDecoder().decode(unos.content);
  xml = xml.replace(/<cellXfs([^>]*)>([\s\S]*?)<\/cellXfs>/, (_m: string, attrs: string, unutra: string) => {
    const izmijenjeno = unutra.replace(/<xf\b([^>]*?)(\/>|>([\s\S]*?)<\/xf>)/g, (_x: string, a: string, kraj: string, sadrzaj?: string) => {
      const atributi = a.includes('applyAlignment') ? a : `${a} applyAlignment="1"`;
      const bezAlign = (kraj === '/>' ? '' : (sadrzaj ?? '')).replace(/<alignment[^>]*\/>/g, '');
      return `<xf${atributi}><alignment vertical="top" wrapText="1"/>${bezAlign}</xf>`;
    });
    return `<cellXfs${attrs}>${izmijenjeno}</cellXfs>`;
  });
  unos.content = new TextEncoder().encode(xml);
  return CFB.write(zip, { fileType: 'zip', type: 'array' }) as Uint8Array;
}

export function nazivExcelFajla(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `Evidencija_psiholog_${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.xlsx`;
}

export async function napraviExcel(s: Snimak, skolskaGodina: number, imena = true): Promise<Uint8Array> {
  const X = await import('xlsx');
  const wb = X.utils.book_new();
  const dn = (b: boolean) => (b ? 'da' : 'ne');
  const razrednik = new Map((s.razredi ?? []).map((r) => [r.razred, r.razrednik]));
  const poSifri = new Map(s.ucenici.map((u) => [u.sifra, u]));
  const imeZa = (sifra: string) => {
    const u = poSifri.get(sifra);
    return u ? [u.ime, u.prezime].filter(Boolean).join(' ') : '';
  };
  const kolonaImena = <T,>(sifra: (r: T) => string): Kolona<T>[] => (imena ? [{ naslov: 'Ime i prezime', sirina: 24, vrijednost: (r) => imeZa(sifra(r)) }] : []);

  const ucenici = [...s.ucenici].sort((a, b) => a.razred.localeCompare(b.razred, 'bs', { numeric: true })
    || (a.prezime ?? '').localeCompare(b.prezime ?? '', 'bs') || a.sifra.localeCompare(b.sifra, 'bs', { numeric: true }));
  X.utils.book_append_sheet(wb, napraviList(X, ucenici, [
    { naslov: 'Šifra', sirina: 10, vrijednost: (u) => u.sifra },
    ...(imena ? [
      { naslov: 'Prezime', sirina: 18, vrijednost: (u: (typeof ucenici)[number]) => u.prezime },
      { naslov: 'Ime', sirina: 14, vrijednost: (u: (typeof ucenici)[number]) => u.ime },
    ] : []),
    { naslov: 'Razred', sirina: 9, vrijednost: (u) => u.razred },
    { naslov: 'Razrednik', sirina: 22, vrijednost: (u) => razrednik.get(u.razred) ?? '' },
    { naslov: 'Status', sirina: 12, vrijednost: (u) => u.status },
    { naslov: 'U praćenju', sirina: 11, vrijednost: (u) => dn(u.uPracenju) },
    { naslov: 'Napomena', sirina: 50, vrijednost: (u) => u.napomena },
  ]) as never, 'Učenici');

  const razgovori = [...s.razgovori].sort((a, b) => a.datum.localeCompare(b.datum));
  X.utils.book_append_sheet(wb, napraviList(X, razgovori, [
    { naslov: 'Datum', sirina: 11, vrijednost: (r) => r.datum, datum: true },
    { naslov: 'Šifra', sirina: 9, vrijednost: (r) => r.sifra },
    ...kolonaImena<(typeof razgovori)[number]>((r) => r.sifra),
    { naslov: 'Razred', sirina: 8, vrijednost: (r) => r.razred },
    { naslov: 'Vrsta kontakta', sirina: 24, vrijednost: (r) => r.vrstaKontakta },
    { naslov: 'Inicirao', sirina: 16, vrijednost: (r) => r.inicirao },
    { naslov: 'Razlog', sirina: 24, vrijednost: (r) => r.razlog },
    { naslov: 'Bilješke', sirina: 60, vrijednost: (r) => r.biljeske },
    { naslov: 'Zaključak', sirina: 40, vrijednost: (r) => r.zakljucak },
    { naslov: 'Preporuke', sirina: 40, vrijednost: (r) => r.preporuke },
    { naslov: 'Sljedeći korak', sirina: 30, vrijednost: (r) => r.sljedeciKorak },
    { naslov: 'Datum sljedećeg kontakta', sirina: 13, vrijednost: (r) => r.datumSljedecegKontakta, datum: true },
    { naslov: 'Status slučaja', sirina: 14, vrijednost: (r) => r.statusSlucaja },
  ]) as never, 'Razgovori');

  const radionice = [...s.radionice].sort((a, b) => a.datum.localeCompare(b.datum));
  X.utils.book_append_sheet(wb, napraviList(X, radionice, [
    { naslov: 'Datum', sirina: 11, vrijednost: (r) => r.datum, datum: true },
    { naslov: 'Razred', sirina: 12, vrijednost: (r) => r.razred },
    { naslov: 'Tema', sirina: 32, vrijednost: (r) => r.tema },
    { naslov: 'Oblast', sirina: 24, vrijednost: (r) => r.oblast },
    { naslov: 'Ciljna grupa', sirina: 12, vrijednost: (r) => r.ciljnaGrupa },
    { naslov: 'Broj učesnika', sirina: 9, vrijednost: (r) => r.brojUcesnika },
    { naslov: 'Trajanje (min)', sirina: 9, vrijednost: (r) => r.trajanjeMin },
    { naslov: 'Cilj', sirina: 40, vrijednost: (r) => r.cilj },
    { naslov: 'Tok aktivnosti', sirina: 60, vrijednost: (r) => r.tokAktivnosti },
    { naslov: 'Zapažanja', sirina: 50, vrijednost: (r) => r.zapazanja },
    { naslov: 'Učenici za praćenje', sirina: 28, vrijednost: (r) => (r.ucenicizaPracenje ?? []).map((x) => (imena && imeZa(x) ? `${imeZa(x)} (${x})` : x)).join(', ') },
    { naslov: 'Evaluacija', sirina: 40, vrijednost: (r) => r.evaluacija },
    { naslov: 'Napomena', sirina: 30, vrijednost: (r) => r.napomena },
  ]) as never, 'Radionice');

  const saradnja = [...s.saradnja].sort((a, b) => a.datum.localeCompare(b.datum));
  X.utils.book_append_sheet(wb, napraviList(X, saradnja, [
    { naslov: 'Datum', sirina: 11, vrijednost: (r) => r.datum, datum: true },
    { naslov: 'Šifra učenika', sirina: 10, vrijednost: (r) => r.sifra },
    ...kolonaImena<(typeof saradnja)[number]>((r) => r.sifra),
    { naslov: 'Ustanova / osoba', sirina: 26, vrijednost: (r) => r.ustanovaOsoba },
    { naslov: 'Opis osobe', sirina: 24, vrijednost: (r) => r.opisOsobe },
    { naslov: 'Način', sirina: 11, vrijednost: (r) => r.nacin },
    { naslov: 'Razlog', sirina: 40, vrijednost: (r) => r.razlog },
    { naslov: 'Dogovor / ishod', sirina: 50, vrijednost: (r) => r.dogovorIshod },
  ]) as never, 'Saradnja');

  const stat = izracunajStatistiku(s, skolskaGodina, 'godina');
  X.utils.book_append_sheet(wb, listStatistike(X, stat), 'Statistika');

  wb.Props = { Title: 'Evidencija psihologa', Author: '' };
  const data = X.write(wb, { bookType: 'xlsx', type: 'array', compression: true }) as ArrayBuffer;
  return dodajPrelamanje(X, new Uint8Array(data));
}
