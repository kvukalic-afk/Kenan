// Dopis Uredu i spisak otvorenih pitanja za direktora i radnu grupu.
const fs = require('fs');
const path = require('path');
const L = require('./lib');
const { d, C, P, center, right, left, bullet, H1, H2, spacer, table, note, image, AlignmentType: AT } = L;
const B = '____________';
const DIR = path.join(__dirname, '..');

function dopis() {
  const ch = [
    new d.Paragraph({ alignment: AT.CENTER, children: [image('slike/memorandum.png', 520, 146)], spacing: { after: 160 } }),
    left(`Broj: ${B}`, { after: 0 }), left('Datum: 23.11.2026. godine', { after: 160 }),
    left('UNSKO-SANSKI KANTON', { bold: true, after: 0 }), left('URED ZA BORBU PROTIV KORUPCIJE UNSKO-SANSKOG KANTONA', { bold: true, after: 0 }), left('Bihaćkih branilaca 2', { after: 0 }), left('77000 Bihać', { after: 160 }),
    P('PREDMET: Nacrt Plana integriteta JU OŠ „Stijena“ – mišljenje, traži se', { bold: true, after: 140 }),
    P('Poštovani,'),
    P('u skladu sa članom 43. Zakona o prevenciji korupcije u Unsko-sanskom kantonu („Službeni glasnik Unsko-sanskog kantona“, broj 24/25) i Fazom IV Uputstva za izradu i provođenje Plana integriteta u institucijama u Unsko-sanskom kantonu („Službeni glasnik Unsko-sanskog kantona“, broj 11/26), dostavljamo Vam Nacrt Plana integriteta JU OŠ „Stijena“ i Nacrt Odluke o usvajanju i provođenju plana integriteta, radi davanja mišljenja.'),
    P(`Raniju verziju plana, dostavljenu uz dopis broj 610-278/2026 od 31.03.2026. godine, radna grupa je u cijelosti preradila u skladu sa navedenim Zakonom i Uputstvom, na osnovu Odluke o izmjenama i dopunama Odluke o izradi plana integriteta broj ${B} od 23.11.2026. godine. Nacrt obuhvata sve zajedničke oblasti iz Uputstva i specifične oblasti rada osnovne škole, sa poseban analitičkim obrascem za svaki identifikovani rizik, plan mjera za unapređenje integriteta, izvještaj radne grupe o stanju integriteta i upitnik sa rezultatima ankete zaposlenih.`.replace('sa poseban', 'sa posebnim')),
    P('Molimo Vas da nam dostavite mišljenje, odnosno preporuke za eventualnu doradu nacrta. Nakon pribavljenog mišljenja, plan će biti usvojen, objavljen na web stranici škole i dostavljen Uredu u roku od 15 dana od dana usvajanja.'),
    P(`Kontakt osoba za plan integriteta: Sabina Žunić, pedagog, menadžer/koordinator radne grupe (tel. 037/543-536, e-mail: osstijena@hotmail.com).`),
    P('S poštovanjem,', { before: 60 }),
    right('DIREKTOR ŠKOLE', { bold: true, after: 280 }), right('_______________________________', { after: 0 }), right('Mersad Vatić'),
    left('Prilozi:', { bold: true, before: 100, after: 20 }),
    ...['Nacrt Plana integriteta JU OŠ „Stijena“ (sa Prilogom 1 – Izvještaj radne grupe o stanju integriteta i Prilogom 2 – Upitnik i rezultati ankete);', 'Nacrt Odluke o usvajanju i provođenju plana integriteta (sastavni dio nacrta, dio 14.1);', `Odluka o izmjenama i dopunama Odluke o izradi plana integriteta broj ${B} od 23.11.2026. godine.`].map((t) => bullet(t)),
    left('Dostavljeno: naslovu; menadžeru/koordinatoru radne grupe; a/a.', { size: 19, before: 80 }),
  ];
  return new d.Document({ styles: L.STYLES, numbering: L.NUMBERING, sections: [{ properties: L.portrait, children: ch }] });
}

function spisak() {
  const chk = (rows) => table([500, 6400, 1400, 1338], [['Rb.', 'Šta treba uraditi', 'Ko', 'Urađeno'], ...rows.map((r, i) => [`${i + 1}.`, r[0], r[1], '☐'])], { size: 18 });
  const ch = [
    center('JU OŠ „STIJENA“ – PLAN INTEGRITETA', { bold: true, size: 26, color: C.navy, after: 60 }),
    center('Šta još treba uraditi prije slanja Uredu', { bold: true, size: 30, color: C.navy, after: 120 }),
    center('Interni dokument – ne dostavlja se Uredu', { italics: true, color: C.red, after: 300 }),
    H2('A. Upisati djelovodne brojeve i potpisati (sve s datumom 23.11.2026.)', { pb: false }),
    chk([
      ['Odluka o izmjenama i dopunama Odluke o izradi plana integriteta (dio 3.2) – upisati broj; isti broj upisati i u dijelove 2.2, 4.2 i 14.1 te u dopis Uredu. Potpis i pečat direktora.', 'Sekretar; direktor'],
      ['Obavijest zaposlenima (dio 4.2) – broj; potpis; istaći na oglasnu tablu.', 'Sekretar; direktor'],
      ['Rješenje o ovlaštenom licu za prijave korupcije (dio 14.3; Semira Džakulić, zamjena Mersad Vatić) – broj; potpis. Ovo rješenje važi odmah, nezavisno od plana.', 'Sekretar; direktor'],
      ['Program rada (dio 5.2) – potpis direktora.', 'Direktor'],
      ['Zapisnik sa sastanka radne grupe (dio 5.3) – održati sastanak, odrediti zapisničara, potpisati.', 'Radna grupa'],
      ['Prilog 1 (izvještaj radne grupe) – broj i potpisi svih sedam članova.', 'Radna grupa'],
      ['Dopis Uredu – broj, potpis, pečat; poslati uz plan (štampano i elektronski) i kopiju Odluke o izmjenama i dopunama.', 'Sekretar; direktor'],
    ]),
    H2('B. Ostaje prazno do mišljenja Ureda (tako i treba)'),
    ...['Datum usvajanja plana (dio 1).', 'Odluka o usvajanju i provođenju (dio 14.1) – broj, datum i broj/datum mišljenja Ureda.', 'Rješenje o menadžeru integriteta (dio 14.2; Dževaira Džehverović) – broj i datum.', 'Nakon usvajanja: objaviti plan na web stranici škole i dostaviti ga Uredu u roku od 15 dana.'].map((t) => bullet(t)),
    H2('C. Preporučujem uraditi odmah (zakonske obaveze)'),
    ...['Donijeti Pravilnik o postupku internog prijavljivanja korupcije (čl. 22. Zakona) – zakonski rok je istekao; kazna za instituciju 500–5.000 KM (čl. 54).', 'Ako u međuvremenu donesete kodeks ponašanja ili akt o zaštiti ličnih podataka, javite mi da ažuriram status u dijelu 6.3.'].map((t) => bullet(t)),
    H2('D. Poznata otvorena pitanja (Ured ih može primijetiti)'),
    table([500, 4300, 4838], [['Rb.', 'Pitanje', 'Kako je riješeno u planu'],
      ['1.', 'Anketa: piše 72 ispitanika (96%), a svi procenti odgovaraju bazi od 37 ili 74 ispitanika.', 'Rezultati su preneseni doslovno, bez izmjena. Ako Ured pita: obrada je rađena ručno; ako su popunjeni upitnici sačuvani, mogu se ponovo prebrojati i sačiniti zapisnik.'],
      ['2.', 'Katalog radnih mjesta daje zbir 60,52 izvršioca, a Odluka ministra 67,52.', 'Oba podatka su prenesena iz starog plana. Razlika je vjerovatno radna mjesta koja u katalogu nisu navedena (npr. asistenti ili dijelovi normi).'],
      ['3.', 'Program 610-95/2025: u zaglavlju 30.01.2025., uz potpis 31.03.2026.', 'Izvorni akt prenesen kakav jeste. Vjerovatno je program donesen 30.01.2025. (uzastopni brojevi 93–95/2025), a 31.03.2026. je datum ponovnog potpisivanja.'],
      ['4.', 'Ocjene vjerovatnoće za tri visoka rizika (direktor, nabavke, zapošljavanje).', 'Zadržana stara ocjena radne grupe „srednja“. Ured može tražiti obrazloženje; odgovor: ocjena odražava izloženost tih procesa, iako slučajevi nisu zabilježeni.']], { size: 17 }),
    H2('E. Šta nisam uradio i zašto'),
    ...['Nisam izmišljao djelovodne brojeve ni potpise – upisuju se pri potpisivanju.', 'Nisam provodio novu anketu niti mijenjao rezultate.', 'Nisam preuzimao podatke ni ocjene drugih škola; plan „Harmani II“ nije javno dostupan, a nijedan javni plan škole iz USK nema objavljeno pozitivno mišljenje. Forma prati modele Uputstva i dobru praksu plana OŠ „Liskovac“.', 'Brojeve internih akata (osim Pravilnika o radu) nisam navodio – Uputstvo ih ne traži.', 'Za zakone FBiH nisam upisivao brojeve Službenih novina.'].map((t) => bullet(t)),
  ];
  return new d.Document({ styles: L.STYLES, numbering: L.NUMBERING, sections: [{ properties: L.portrait, ...L.headerFooter('JU OŠ „Stijena“ – interni spisak (ne dostavlja se Uredu)'), children: ch }] });
}

Promise.all([['Dopis_Uredu_zahtjev_za_misljenje.docx', dopis()], ['Spisak_za_direktora_prije_slanja.docx', spisak()]].map(([f, doc]) => d.Packer.toBuffer(doc).then((b) => { fs.writeFileSync(path.join(DIR, f), b); console.log('OK', f); })));
