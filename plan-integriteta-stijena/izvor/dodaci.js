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
    left(`Broj: ${B}`, { after: 0 }), left(`Datum: ${B}`, { after: 160 }),
    left('UNSKO-SANSKI KANTON', { bold: true, after: 0 }), left('URED ZA BORBU PROTIV KORUPCIJE UNSKO-SANSKOG KANTONA', { bold: true, after: 0 }), left('Bihaćkih branilaca 2', { after: 0 }), left('77000 Bihać', { after: 160 }),
    P('PREDMET: Nacrt Plana integriteta JU OŠ „Stijena“ – mišljenje, traži se', { bold: true, after: 140 }),
    P('Poštovani,'),
    P('u skladu sa članom 43. Zakona o prevenciji korupcije u Unsko-sanskom kantonu („Službeni glasnik Unsko-sanskog kantona“, broj 24/25) i Fazom IV Uputstva za izradu i provođenje Plana integriteta u institucijama u Unsko-sanskom kantonu („Službeni glasnik Unsko-sanskog kantona“, broj 11/26), dostavljamo Vam Nacrt Plana integriteta JU OŠ „Stijena“ i Nacrt Odluke o usvajanju i provođenju plana integriteta, radi davanja mišljenja.'),
    P(`Raniju verziju plana, dostavljenu uz dopis broj 610-278/2026 od 31.03.2026. godine, radna grupa je u cijelosti preradila u skladu sa navedenim Zakonom i Uputstvom, na osnovu Odluke o izmjenama i dopunama Odluke o izradi plana integriteta broj ${B} od ${B}. Nacrt obuhvata sve zajedničke oblasti iz Uputstva i specifične oblasti rada osnovne škole, sa poseban analitičkim obrascem za svaki identifikovani rizik, plan mjera za unapređenje integriteta, izvještaj radne grupe o stanju integriteta i upitnik sa rezultatima ankete zaposlenih.`.replace('sa poseban', 'sa posebnim')),
    P('Molimo Vas da nam dostavite mišljenje, odnosno preporuke za eventualnu doradu nacrta. Nakon pribavljenog mišljenja, plan će biti usvojen, objavljen na web stranici škole i dostavljen Uredu u roku od 15 dana od dana usvajanja.'),
    P(`Kontakt osoba za plan integriteta: Sabina Žunić, pedagog, menadžer/koordinator radne grupe (tel. 037/543-536, e-mail: osstijena@hotmail.com).`),
    P('S poštovanjem,', { before: 60 }),
    right('DIREKTOR ŠKOLE', { bold: true, after: 280 }), right('_______________________________', { after: 0 }), right('Mersad Vatić'),
    left('Prilozi:', { bold: true, before: 100, after: 20 }),
    ...['Nacrt Plana integriteta JU OŠ „Stijena“ (sa Prilogom 1 – Izvještaj radne grupe o stanju integriteta i Prilogom 2 – Upitnik i rezultati ankete);', 'Nacrt Odluke o usvajanju i provođenju plana integriteta (sastavni dio nacrta, dio 14.1);', `Odluka o izmjenama i dopunama Odluke o izradi plana integriteta broj ${B}.`].map((t) => bullet(t)),
    left('Dostavljeno: naslovu; menadžeru/koordinatoru radne grupe; a/a.', { size: 19, before: 80 }),
  ];
  return new d.Document({ styles: L.STYLES, numbering: L.NUMBERING, sections: [{ properties: L.portrait, children: ch }] });
}

function spisak() {
  const chk = (rows) => table([500, 5200, 2600, 1338], [['Rb.', 'Šta treba uraditi', 'Ko', 'Urađeno'], ...rows.map((r, i) => [`${i + 1}.`, r[0], r[1], '☐'])], { size: 18 });
  const ch = [
    center('JU OŠ „STIJENA“ – PLAN INTEGRITETA', { bold: true, size: 26, color: C.navy, after: 60 }),
    center('Spisak za direktora i radnu grupu prije slanja nacrta Uredu', { bold: true, size: 30, color: C.navy, after: 120 }),
    center('Interni radni dokument – ne dostavlja se Uredu', { italics: true, color: C.red, after: 300 }),
    note('Ukratko', ['Nacrt plana je sadržajno završen i urađen po Uputstvu i modelima obrazaca. Prije slanja potrebno je: (1) donijeti i potpisati akte, (2) upisati prazna polja, (3) na sastanku radne grupe potvrditi ocjene rizika i navode o postojećoj praksi, (4) razjasniti broj ispitanika ankete. Ništa od toga nije moguće uraditi bez podataka i potpisa škole, pa nije izmišljano.'], { fill: C.light, border: C.blue, tcolor: C.navy }),

    H2('A. Odluke koje direktor mora donijeti prije slanja', { pb: false }),
    chk([
      ['Potpisati Odluku o izmjenama i dopunama Odluke o izradi (dio 3.2) – njome se Kenan Vukalić imenuje u radnu grupu i postupak usklađuje sa Zakonom. Upisati broj i datum na svim mjestima (2.2, 3.2, 4.2, 14.1 i dopis).', 'Direktor; sekretar (djelovodnik)'],
      ['Objaviti Obavijest zaposlenima (dio 4.2) na oglasnoj tabli.', 'Direktor'],
      ['Odobriti Program rada (dio 5.2) i upisati datume odobravanja, početka i očekivanog završetka.', 'Direktor'],
      ['Odlučiti ko će biti osoba zadužena za nadzor (menadžer integriteta) nakon usvajanja. U staroj verziji je predložena Dževaira Džehverović. Ime se upisuje tek u Odluku o usvajanju (14.1) i Rješenje (14.2), nakon mišljenja Ureda.', 'Direktor'],
      ['Rješenjem odrediti ovlašteno lice za prijave korupcije (14.3). Zakonski uslov (čl. 18): VII stepen, pravni fakultet 240 ECTS i 3 godine iskustva, ili izuzetno VII stepen druge struke. Provjeriti diplomu predložene osobe (u staroj verziji: sekretar). Odrediti i zamjenu. Ovo je zakonska obaveza nezavisna od plana.', 'Direktor; sekretar'],
      ['Donijeti Pravilnik o postupku internog prijavljivanja korupcije (čl. 22. Zakona), ako već nije donesen. Zakonski rok od 30 dana od stupanja Zakona na snagu je istekao (kazna 500–5.000 KM za instituciju, čl. 54).', 'Direktor; sekretar'],
      ['Na sanduče za prijave postaviti natpis „ZA PRIJAVU KORUPCIJE“ (čl. 19. Zakona).', 'Direktor; domar'],
    ]),

    H2('B. Prazna polja koja treba upisati'),
    table([3400, 6238], [['Mjesto u planu', 'Šta upisati'],
      ['Naslovna strana', 'Datum: Cazin, ____ 2026.'],
      ['1. Osnovne informacije', 'Datum usvajanja, osoba za nadzor i telefon – tek nakon mišljenja Ureda i Odluke o usvajanju (do tada ostaju prazni).'],
      ['2.2, 3.2, 4.2', 'Broj i datum Odluke o izmjenama i dopunama; broj i datum Obavijesti; potpis direktora.'],
      ['5.2 Program rada', 'Datum odobravanja, početak, očekivani završetak, rok za prvu aktivnost u Fazi 1.'],
      ['5.3 Zapisnici', 'Za svaki stvarno održan sastanak: datum, mjesto, prisutni, zaključci, zapisničar. Uz plan dostaviti potpisane zapisnike.'],
      ['6.3 Interni akti', 'Broj i datum svakog internog akta (Pravila škole, pravilnici, poslovnici) i novih akata kad se donesu.'],
      ['13.1 i 14.3', 'Ime ovlaštenog lica i zamjene.'],
      ['14.1 Odluka o usvajanju', 'Broj i datum mišljenja Ureda, broj Odluke o izmjenama, osoba za nadzor – nakon mišljenja.'],
      ['14.2 Rješenje o menadžeru', 'Ime menadžera integriteta – nakon mišljenja.'],
      ['Prilog 1', 'Broj, datum i potpisi svih sedam članova radne grupe.'],
      ['Dopis Uredu', 'Broj, datum, broj Odluke o izmjenama, potpis i pečat.']], { size: 18 }),

    H2('C. Šta radna grupa mora potvrditi na sastanku (uz zapisnik)'),
    chk([
      ['Ocjene vjerovatnoće i posljedice za svih 42 rizika. Posebno tri rizika visokog intenziteta: Z1.1 (odlučivanje rukovodioca), Z3.1 (javne nabavke), Z5.1 (prijem u radni odnos). Ocjena 2 za ove rizike preuzeta je iz vaše stare tabele („srednja vjerovatnoća“); ako u periodu 2022–2026 nije bilo zabilježenih slučajeva, prema Uputstvu ocjena treba biti 1.', 'Cijela radna grupa'],
      ['Navod da u periodu 2022/23–2025/26 nije bilo zabilježenih slučajeva korupcije (dijelovi 8.1 i 9.1) – provjeriti evidenciju prijava, nalaze inspekcije i revizije, disciplinske postupke i prigovore.', 'Sekretar; direktor'],
      ['Navode o postojećoj praksi u obrascima, koji su procjena, a ne utvrđena činjenica: nenajavljeni popisi blagajne; potpisivanje izjava o sukobu interesa u nabavkama i komisijama; postojanje kodeksa ponašanja i akta o zaštiti ličnih podataka; evidencija ključeva i pečata; prikupljanje gotovine preko razrednika; korištenje e-dnevnika; davanje prostora škole na korištenje. Gdje je stanje drugačije, ispraviti obrazac i mjeru.', 'Članovi prema oblastima (3.3)'],
      ['Izvršioce, rokove i troškove mjera; knjigovođa da procijeni iznose za ormare za dokumentaciju, natpis i plaćenu obuku iz javnih nabavki.', 'Radna grupa; knjigovođa'],
      ['Zaduženja po oblastima (3.3) i izjave članova o nepostojanju sukoba interesa.', 'Menadžer/koordinator'],
    ]),

    H2('D. Podaci koje treba provjeriti (moguće primjedbe Ureda)'),
    table([500, 4300, 4838], [['Rb.', 'Pitanje', 'Zašto je važno'],
      ['1.', 'Broj ispitanika ankete: navedeno je 72 radnika (96%), ali svi procenti odgovaraju bazi od 37 (ili 74) ispitanika (npr. 34/37 = 91,89%).', 'Ured bi mogao primijetiti neslaganje. Rezultati u planu nisu mijenjani. Provjeriti izvorne upitnike: ako je greška tehnička, sačiniti zapisnik o ispravci prije slanja.'],
      ['2.', 'Broj izvršilaca: Odluka ministra 67,52, a zbir u katalogu radnih mjesta 60,52.', 'Nedostaje 7,00 izvršilaca u katalogu (dio 7.2). Dopuniti radna mjesta koja nedostaju ili ispraviti broj. Provjeriti postoji li novija odluka za 2026/27.'],
      ['3.', 'Pisanje imena: „Semira Džakulić“ (u Odluci 610-93/2025 piše „Džakilić“), „Edin Pehlić“ (u Obavijesti 610-94/2025 piše „Edina“), „Kenan Vukalić“.', 'Izvorni akti preneseni su kako jesu; novi akti koriste ispravno ime – potvrditi prema personalnoj evidenciji.'],
      ['4.', 'Program 610-95/2025: u zaglavlju 30.01.2025., a uz potpis „Stijena, 31.03.2026.“.', 'Izvorni akt prenesen je kako jeste; provjeriti izvornik.'],
      ['5.', 'Akt Agencije/Ureda kojim je ranija verzija vraćena na doradu.', 'Provjeriti da su sve tadašnje primjedbe riješene u ovom nacrtu.'],
      ['6.', 'Pravila škole – datum donošenja i saglasnost.', 'Upisati u 6.3; ako Pravila nisu usklađena sa Zakonom iz 2023., to je dodatni rizik.'],
      ['7.', 'Ispravka Zakona o prevenciji korupcije (Sl. glasnik USK 3/26).', 'Sadržaj nije bio dostupan; provjeriti da ne mijenja citirane članove.'],
      ['8.', 'Rezultati pitanja ankete 2, 7, 9–13, 16, 22, 23, 26 i 33 nisu bili iskazani u staroj verziji.', 'Ako postoje izvorni upitnici, rezultati se mogu dodati u Prilog 2 (bez mijenjanja postojećih).']], { size: 17 }),

    H2('E. Šta nije urađeno i zašto'),
    ...['Nova anketa nije provedena niti predložena – korišteni su postojeći rezultati, prenseni doslovno (provjereno: 159 redova i 22 procenta).'.replace('prenseni', 'preneseni'),
      'Nisu upisana imena, brojevi, datumi, potpisi ni održani sastanci koje škola nije dostavila – ostavljena su prazna polja.',
      'Podaci, ocjene i rezultati drugih škola nisu preuzeti. Javno nije pronađen nijedan plan škole iz USK s dokazom pozitivnog mišljenja Ureda; plan OŠ „Harmani II“ nije javno dostupan. Kao uzor korišteni su modeli iz Uputstva i dobra praksa iz plana OŠ „Liskovac“ (rješenje o menadžeru, obrazac po riziku, kolona indikatora, zapisnici radne grupe).',
      'Za zakone FBiH (rad, upravni postupak, budžeti, PIO, zaštita na radu) navedeno je samo službeno glasilo bez brojeva – brojevi se mogu dopisati u dio 6.1.',
      'Napomena o neslaganju broja ispitanika nije stavljena u plan koji ide Uredu, nego u ovaj spisak (tačka D1).',
      'Plan nije objavljen na web stranici niti dostavljen – to slijedi nakon mišljenja Ureda i usvajanja (15 dana).'].map((t) => bullet(t)),

    H2('F. Redoslijed do slanja'),
    ...['Direktor potpisuje Odluku o izmjenama i dopunama i objavljuje Obavijest (A1–A2).', 'Direktor odobrava Program rada (A3).', 'Radna grupa održava sastanke, potvrđuje ocjene i navode (C) i popunjava zapisnike (5.3).', 'Sekretar upisuje brojeve i datume akata (B) i provjerava podatke iz tačke D.', 'Direktor određuje ovlašteno lice, donosi pravilnik o prijavama i postavlja natpis (A5–A7) – odmah, nezavisno od plana.', 'Radna grupa potpisuje Prilog 1 i predaje nacrt direktoru.', 'Direktor potpisuje dopis i šalje Uredu nacrt plana (DOCX/PDF i štampano), uz Odluku o izmjenama i zapisnike.', 'Nakon pozitivnog mišljenja: upisati broj mišljenja, imenovati menadžera i osobu za nadzor, donijeti Odluku o usvajanju, objaviti plan na web stranici i dostaviti ga Uredu u roku od 15 dana.'].map((t, i) => left(`${i + 1}. ${t}`, { after: 60 })),
  ];
  return new d.Document({ styles: L.STYLES, numbering: L.NUMBERING, sections: [{ properties: L.portrait, ...L.headerFooter('JU OŠ „Stijena“ – interni spisak (ne dostavlja se Uredu)'), children: ch }] });
}

Promise.all([['Dopis_Uredu_zahtjev_za_misljenje.docx', dopis()], ['Spisak_za_direktora_prije_slanja.docx', spisak()]].map(([f, doc]) => d.Packer.toBuffer(doc).then((b) => { fs.writeFileSync(path.join(DIR, f), b); console.log('OK', f); })));
