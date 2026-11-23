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
    ['1.', 'U djelovodnik upisati četiri nova akta s datumom 23.11.2026.: Odluka o izmjenama i dopunama Odluke o izradi plana integriteta 610-1015/2026, Obavijest zaposlenima 610-1016/2026, Konačni izvještaj radne grupe 610-1017/2026, Dopis Uredu 610-1018/2026. Ako su brojevi zauzeti, javiti Kenanu Vukaliću – mijenjaju se u dokumentu.', '☐'],
    ['2.', 'Stari akti (Odluka 610-93/2025, Obavijest 610-94/2025, Program 610-95/2025) ostaju kakvi jesu – ne upisuju se ponovo.', '☐'],
    ['3.', 'Isprintati dva primjerka plana (jedan za Ured, jedan za arhivu) i dati direktoru na potpis.', '☐'],
    ['4.', 'Novu obavijest zaposlenima (str. 11) istaći na oglasnu tablu.', '☐'],
    ['5.', 'Poslati Uredu: dopis (str. 52) na vrh, ispod njega potpisan plan. Adresa: Ured za borbu protiv korupcije USK, Bihaćkih branilaca 2, 77000 Bihać (lično na protokol ili preporučeno poštom). Po potrebi i PDF elektronskom poštom (info@antikorupcijausk.ba) – prethodno provjeriti na 037/305-500.', '☐'],
    ['6.', 'Kopiju plana dati članovima radne grupe; jedan primjerak arhivirati.', '☐']], [600, 8338, 700]),
  H2('Direktor'),
  box([['Rb.', 'Potpis i pečat na sljedećim stranicama', '✓'],
    ['1.', 'Str. 10 – Odluka o izmjenama i dopunama Odluke o izradi (610-1015/2026)', '☐'],
    ['2.', 'Str. 11 – Obavijest zaposlenima (610-1016/2026)', '☐'],
    ['3.', 'Str. 46 – Konačni izvještaj radne grupe (610-1017/2026)', '☐'],
    ['4.', 'Str. 52 – Dopis Uredu (610-1018/2026)', '☐'],
    ['5.', 'Str. 5, 7 i 9 – stari akti iz 2025. (Odluka, Obavijest, Program): potpisati ih isto kao originale (isti broj i datum) ili umjesto tih stranica uložiti kopije već potpisanih originala iz arhive.', '☐'],
    [{ t: '!', b: true, color: C.red }, { t: 'Str. 47 – Nacrt odluke o usvajanju NE POTPISIVATI. Potpisuje se tek kad stigne pozitivno mišljenje Ureda.', b: true }, '']], [600, 8338, 700]),
  P('Brojevi stranica odnose se na PDF verziju; u Wordu mogu odstupati za jednu stranicu.', { size: 17, italics: true, color: C.grey, before: 40 }),
  H2('Preporuka (zakonska obaveza, nezavisno od plana)'),
  box([['1.', 'Donijeti Rješenje o određivanju ovlaštenog lica za prijem prijava korupcije – Semira Džakulić, sekretar (član 18. Zakona o prevenciji korupcije u USK).', '☐'],
    ['2.', 'Donijeti Pravilnik o postupku internog prijavljivanja korupcije (član 22. Zakona). Zakonski rok je istekao; Kenan Vukalić može pripremiti nacrt.', '☐']], [600, 8338, 700], 0),
  H2('Kad stigne mišljenje Ureda'),
  box([['1.', 'Javiti Kenanu Vukaliću – upisuje se broj mišljenja i datum usvajanja; ako Ured traži dopune, ugrađuju se u plan.', '☐'],
    ['2.', 'Direktor potpisuje Odluku o usvajanju (str. 47) s djelovodnim brojem.', '☐'],
    ['3.', 'U roku od 15 dana: objaviti plan na web stranici škole i dostaviti ga Uredu zajedno s Odlukom o usvajanju.', '☐'],
    ['4.', 'Svake godine do 31. marta: izvještaj Uredu o provođenju plana (priprema Dževaira Džehverović, potpisuje direktor).', '☐']], [600, 8338, 700], 0),
  spacer(4),
  note('Ako Ured postavi pitanje', ['- Anketa: piše 72 ispitanika, a procenti odgovaraju broju 37 – rezultati su preneseni iz originalne obrade bez izmjena. Broj izvršilaca: katalog 60,52, odluka ministra 67,52 – oba podatka su iz ranije dokumentacije škole.'], { size: 15 }),
];
const doc = new d.Document({ styles: L.STYLES, numbering: L.NUMBERING, sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 600, bottom: 600, left: 1000, right: 1000 } } }, children: ch }] });
d.Packer.toBuffer(doc).then((b) => { fs.writeFileSync(OUT, b); console.log('OK'); });
