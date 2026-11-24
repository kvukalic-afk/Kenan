// Jednostranična uputa za sekretara i direktora prije slanja plana Uredu.
const fs = require('fs'); const path = require('path');
const L = require('./lib'); const { d, C, P, center, left, H2, table, note, spacer } = L;
const OUT = path.join(__dirname, '..', 'Uputa_za_sekretara_i_direktora.docx');
const box = (rows, w, h = 1) => table(w, rows, { size: 16, header: h });
const ch = [
  center('JU OŠ „STIJENA“ – PLAN INTEGRITETA', { bold: true, size: 24, color: C.navy, after: 40 }),
  center('Šta uraditi prije slanja Uredu za borbu protiv korupcije USK', { bold: true, size: 26, color: C.navy, after: 160 }),
  H2('Sekretar', { pb: false }),
  box([['Rb.', 'Zadatak', '✓'],
    ['1.', 'Svi djelovodni brojevi i datumi su kao u originalu (610-93, 610-94, 610-95/2025; 610-277 i 610-278/2026 od 31.03.2026.). Nema novih akata ni novih brojeva – ništa se ne upisuje u djelovodnik.', '☐'],
    ['2.', 'Datum usvajanja plana (str. 2) i datum Odluke o usvajanju (str. 44) je 20.11.2026. Broj Odluke o usvajanju upisati iz djelovodnika ako je već dodijeljen.', '☐'],
    ['3.', 'Isprintati dva primjerka plana (jedan za Ured, jedan za arhivu) i dati direktoru na potpis.', '☐'],
    ['4.', 'Na str. 43 (Konačni izvještaj) prikupiti potpise svih sedam članova radne grupe.', '☐'],
    ['5.', 'Poslati Uredu: dopis (str. 49) na vrh, ispod njega potpisan plan. Adresa: Ured za borbu protiv korupcije USK, Bihaćkih branilaca 2, 77000 Bihać (lično na protokol ili preporučeno poštom). Po potrebi i PDF elektronskom poštom (info@antikorupcijausk.ba) – prethodno provjeriti na 037/305-500.', '☐'],
    ['6.', 'Kopiju plana dati članovima radne grupe; jedan primjerak arhivirati.', '☐']], [600, 8338, 700]),
  H2('Direktor'),
  box([['Rb.', 'Potpis i pečat na sljedećim stranicama', '✓'],
    ['1.', 'Str. 43 – Konačni izvještaj radne grupe (610-277/2026 od 31.03.2026.)', '☐'],
    ['2.', 'Str. 49 – Dopis Uredu (610-278/2026 od 31.03.2026.)', '☐'],
    ['3.', 'Str. 5, 6 i 9 – stari akti iz 2025. (Odluka, Obavijest, Program): potpisati ih isto kao originale (isti broj i datum) ili umjesto tih stranica uložiti kopije već potpisanih originala iz arhive.', '☐'],
    [{ t: '!', b: true, color: C.red }, { t: 'Str. 44 – Odluka o usvajanju (datum 20.11.2026.): prema Uputstvu Uredu se šalje kao nacrt, a konačno se potpisuje nakon pozitivnog mišljenja Ureda.', b: true }, '']], [600, 8338, 700]),
  P('Brojevi stranica odnose se na PDF verziju; u Wordu mogu odstupati za jednu stranicu.', { size: 17, italics: true, color: C.grey, before: 40 }),
  H2('Preporuka (zakonska obaveza, nezavisno od plana)'),
  box([['1.', 'Donijeti Rješenje o određivanju ovlaštenog lica za prijem prijava korupcije – Semira Džakulić, sekretar (član 18. Zakona o prevenciji korupcije u USK).', '☐'],
    ['2.', 'Donijeti Pravilnik o postupku internog prijavljivanja korupcije (član 22. Zakona). Zakonski rok je istekao; Kenan Vukalić može pripremiti nacrt.', '☐']], [600, 8338, 700], 0),
  H2('Kad stigne mišljenje Ureda'),
  box([['1.', 'Javiti Kenanu Vukaliću – upisuje se broj mišljenja i datum usvajanja; ako Ured traži dopune, ugrađuju se u plan.', '☐'],
    ['2.', 'Direktor potpisuje Odluku o usvajanju (str. 44) s djelovodnim brojem.', '☐'],
    ['3.', 'U roku od 15 dana: objaviti plan na web stranici škole i dostaviti ga Uredu zajedno s Odlukom o usvajanju.', '☐'],
    ['4.', 'Svake godine do 31. marta: izvještaj Uredu o provođenju plana (priprema Dževaira Džehverović, potpisuje direktor).', '☐']], [600, 8338, 700], 0),
  spacer(4),
  note('Ako Ured postavi pitanje', ['- Anketa: piše 72 ispitanika, a procenti odgovaraju broju 37 – rezultati su preneseni iz originalne obrade bez izmjena. Broj izvršilaca: katalog 60,52, odluka ministra 67,52 – oba podatka su iz ranije dokumentacije škole.'], { size: 15 }),
];
const doc = new d.Document({ styles: L.STYLES, numbering: L.NUMBERING, sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 600, bottom: 600, left: 1000, right: 1000 } } }, children: ch }] });
d.Packer.toBuffer(doc).then((b) => { fs.writeFileSync(OUT, b); console.log('OK'); });
