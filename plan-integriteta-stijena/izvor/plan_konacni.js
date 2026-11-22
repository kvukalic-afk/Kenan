// Konačni nacrt Plana integriteta JU OŠ „Stijena“ spreman za dostavu Uredu (čista verzija, prazna polja za dopis).
const fs = require('fs');
const path = require('path');
const L = require('./lib');
L.CISTO = true;
const { d, C, P, center, right, left, bullet, H1, H2, spacer, table, kv, note, image, W_PORTRAIT: WP, AlignmentType: AT } = L;
const base = require('./rizici');
const { OBLASTI, intenzitet } = base;
const SRC = JSON.parse(fs.readFileSync(path.join(__dirname, 'izvorni_podaci.json'), 'utf8'));
const OUT = process.argv[2] || path.join(__dirname, '..', 'Plan_integriteta_JU_OS_Stijena_za_dostavu_Uredu.docx');

const ZAKON = 'Zakona o prevenciji korupcije u Unsko-sanskom kantonu („Službeni glasnik Unsko-sanskog kantona“, broj 24/25)';
const UPU = 'Uputstva za izradu i provođenje Plana integriteta u institucijama u Unsko-sanskom kantonu („Službeni glasnik Unsko-sanskog kantona“, broj 11/26)';
const STRAT = 'Strategije za borbu protiv korupcije Unsko-sanskog kantona 2023.–2027. („Službeni glasnik Unsko-sanskog kantona“, broj 26/23)';
const B = '____________';
const VL = { 1: '1 – mala', 2: '2 – umjerena', 3: '3 – velika' };
const PL = { 1: '1 – neznatne', 2: '2 – značajne', 3: '3 – vrlo značajne' };
const FILL = { Nizak: C.lo, Srednji: C.mid, Visok: C.hi };
const NIV = { Nizak: 'Nizak', Srednji: 'Umjeren', Visok: 'Visok' }; // oznake iz obrasca Uputstva

// Dosljedna primjena definicije vjerovatnoće iz Uputstva: ocjena 2 zadržana samo gdje je to ocjena radne grupe iz ranije verzije.
const V1 = ['Z1.3', 'Z7.1', 'Z8.1', 'Z10.1'];
const cist = (s) => String(s)
  .replace(/nije potvrđen([aoi]?)/g, 'nije dokumentovan$1').replace(/nisu potvrđeni/g, 'nisu dokumentovani')
  .replace(/ \(navedeno u izvornoj verziji\)/g, '').replace(/predloženo u izvornoj verziji/g, 'za prijem prijava')
  .replace(/; u izvornoj verziji je predviđeno njegovo donošenje/g, '').replace(/ \(zakonski rok je već protekao\)/g, '')
  .replace(/Nove zakonske obaveze od 2025\/2026/g, 'Nove zakonske obaveze')
  .replace(/dokumentovanje (izbora )?nije dokumentovano/g, 'dokumentovanje $1nije uspostavljeno');
const Rx = base.R.map((r) => {
  const x = { ...r };
  if (V1.includes(x.id)) { x.v = 1; x.izv = 'PR'; }
  x.f = x.f.map(([t, s]) => [t, cist(s)]); x.k = x.k.map(cist); x.ao = cist(x.ao); x.opis = cist(x.opis);
  if (x.ank && /DOPUNITI/.test(x.ank)) delete x.ank;
  x.m = x.m.map((m) => ({ ...m, rok: cist(m.rok), t: cist(m.t), tr: cist(m.tr) }));
  return { ...x, ...intenzitet(x.v, x.p) };
});
const cnt = (f) => Rx.filter(f).length;
const N = { uk: Rx.length, vis: cnt((r) => r.nivo === 'Visok'), sre: cnt((r) => r.nivo === 'Srednji'), niz: cnt((r) => r.nivo === 'Nizak'), z: cnt((r) => r.o[0] === 'Z'), s: cnt((r) => r.o[0] === 'S'), mj: Rx.reduce((a, r) => a + r.m.length, 0) };
const CLAN = [
  ['Sabina Žunić', 'pedagog', 'Menadžer/koordinator radne grupe'], ['Edin Pehlić', 'nastavnik', 'Član'], ['Dženita Hepić', 'knjigovođa', 'Član'],
  ['Elvira Vatić', 'nastavnik', 'Član'], ['Dževaira Džehverović', 'socijalni radnik', 'Član'], ['Semira Džakulić', 'sekretar škole', 'Član'], ['Kenan Vukalić', 'psiholog', 'Član'],
];
const ZAD = ['Koordinacija; oblasti S1, S2, S4, S6', 'Oblasti S1, S3, S7', 'Oblasti Z2, Z3, Z9', 'Oblasti Z5, S4, S7', 'Oblasti S2, S5, Z11', 'Oblasti Z1, Z4, Z5, Z6, Z10', 'Oblasti Z7, Z8, S5; analiza rezultata ankete'];
const brDat = () => [left(`Broj: ${B}`, { after: 0 }), left(`Datum: ${B}`)];
const potpis = (role, name) => [spacer(6), right(role, { bold: true, after: 360, keepNext: true }), right('_______________________________', { after: 0, keepNext: true }), right(name)];
const art = (n) => center(`Član ${n}.`, { bold: true, before: 80, after: 60, keepNext: true });

function naslovna() {
  return [
    new d.Paragraph({ alignment: AT.CENTER, children: [image('slike/memorandum.png', 600, 169)], spacing: { after: 300 } }),
    center('JAVNA USTANOVA OSNOVNA ŠKOLA „STIJENA“', { bold: true, size: 30, color: C.navy, after: 60 }),
    center('Stijena bb, 77224 Cazin', { size: 20, color: C.grey, after: 700 }),
    center('PLAN INTEGRITETA', { bold: true, size: 60, color: C.navy, after: 120 }),
    center('NACRT', { bold: true, size: 32, color: C.blue, after: 200 }),
    center('izrađen u skladu sa Zakonom o prevenciji korupcije u Unsko-sanskom kantonu i Uputstvom za izradu i provođenje Plana integriteta u institucijama u Unsko-sanskom kantonu', { size: 21, color: C.grey, after: 500 }),
    new d.Paragraph({ alignment: AT.CENTER, children: [image('slike/skola.jpg', 460, 227)], spacing: { after: 700 } }),
    center(`Cazin, ${B} 2026. godine`, { bold: true, size: 22 }),
  ];
}

function osnovne() {
  return [
    H1('1. Osnovne informacije o instituciji i odgovornim osobama za izradu i provođenje plana integriteta', { pb: true }),
    kv([['Naziv institucije', 'Javna ustanova Osnovna škola „Stijena“'], ['Adresa', 'Stijena bb, 77224 Cazin'], ['E-mail institucije', 'osstijena@hotmail.com'],
      ['Broj telefona institucije', '037/543-536'], ['Web stranica', 'https://os-stijena.edu.ba'], ['Ime i prezime rukovodioca institucije', 'Mersad Vatić, direktor']]),
    spacer(6),
    P('**Imena i prezimena koordinatora i članova radne grupe za izradu plana integriteta:**', { keepNext: true }),
    table([600, 3400, 2400, 3238], [['Rb.', 'Ime i prezime', 'Radno mjesto', 'Uloga u radnoj grupi'], ...CLAN.map((c, i) => [`${i + 1}.`, c[0], c[1], c[2]])], { size: 19 }),
    spacer(6),
    kv([['Datum usvajanja plana integriteta', B], ['Ime i prezime osobe zadužene za nadzor nad praćenjem provođenja plana integriteta', B], ['Broj telefona osobe zadužene za nadzor nad praćenjem provođenja plana integriteta', B]]),
  ];
}

function uvod() {
  return [
    H1('2. Uvod'),
    P('Javna ustanova Osnovna škola „Stijena“ je ustanova za osnovni odgoj i obrazovanje učenika. Prva četverogodišnja osnovna škola u Stijeni otvorena je 1929. godine. Osnivač škole je Skupština Unsko-sanskog kantona. Škola je upisana u sudski registar kod Kantonalnog suda u Bihaću rješenjem broj U/I-5/99 od 18.01.1999. godine, kojim je utvrđen i naziv JU OŠ „Stijena“.'),
    P('Škola ispunjava uslove za odgoj i obrazovanje redovnih učenika prema važećem nastavnom planu i programu za osnovnu školu. Osnovni odgoj i obrazovanje značajan je faktor razvoja mlade ličnosti, a time i općeg napretka društva. Rad škole zasniva se na zakonskim i podzakonskim propisima, Pedagoškim standardima i normativima, naučnim saznanjima i pedagoškom iskustvu, a usmjeren je na:'),
    ...['uspješnu realizaciju ciljeva i zadataka nastavnog plana i programa;', 'podizanje kvaliteta i efikasnosti odgojno-obrazovnog rada;', 'jačanje odgojne, društvene i kulturne uloge škole;', 'racionalnu organizaciju nastave i rada škole;', 'inoviranje odgojno-obrazovnog procesa i uvođenje savremenih metoda i tehnologija rada;', 'stručno usavršavanje nastavnika i stručnih saradnika i jačanje stručne službe;', 'podsticanje darovitih učenika i podršku učenicima s poteškoćama u razvoju;', 'kvalitetan, efikasan, zakonit i odgovoran rad škole.'].map((t) => bullet(t)),
    H2('2.1. Pravni osnov i svrha plana integriteta'),
    P(`Obaveza donošenja plana integriteta za javne ustanove čiji je osnivač Unsko-sanski kanton propisana je članom 43. ${ZAKON}. Plan se izrađuje u skladu s odredbama ${UPU}, koje je Vlada Unsko-sanskog kantona donijela 17. 3. 2026. godine na prijedlog Ureda za borbu protiv korupcije Unsko-sanskog kantona (u daljem tekstu: Ured), te u skladu sa mjerom 1.2.1 ${STRAT}.`),
    P('Plan integriteta je interni dokument koji sadrži detaljnu procjenu podložnosti radnih mjesta, radnih procesa i poslova nastanku i razvoju korupcije i drugih oblika pristrasnog postupanja, te skup konkretnih mjera kojima se preveniraju i otklanjaju mogućnosti za nastanak i razvoj korupcije i obezbjeđuje povjerenje građana u rad institucije (član 43. stav (1) Zakona). Plan je preventivni mehanizam: identifikacija rizika ne znači da je u školi utvrđena korupcija ili nepravilnost, nego da su prepoznate okolnosti koje bi mogle do njih dovesti.'),
    P('Cilj Plana integriteta JU OŠ „Stijena“ je održavanje i jačanje integriteta, transparentnosti i profesionalne etike, te utvrđivanje, smanjivanje, uklanjanje i sprečavanje mogućnosti za nastanak nepravilnosti u radu, etički i profesionalno neprihvatljivih postupaka i korupcije.'),
    H2('2.2. Tok izrade plana integriteta'),
    P('Izrada plana pokrenuta je Odlukom o izradi plana integriteta broj 610-93/2025 od 28.01.2025. godine. Radna grupa je izradila program rada (broj 610-95/2025), provela anonimnu anketu zaposlenih i izradila prvu verziju plana prema modelu Agencije za prevenciju korupcije i koordinaciju borbe protiv korupcije BiH. Plan je vraćen na izmjenu i doradu, o čemu je škola obavijestila Ured dopisom broj 610-278/2026 od 31.03.2026. godine.'),
    P(`Nakon stupanja na snagu Zakona o prevenciji korupcije u Unsko-sanskom kantonu (primjena od 1. 1. 2026. godine) i donošenja Uputstva, direktor je Odlukom o izmjenama i dopunama Odluke o izradi plana integriteta (broj ${B} od ${B}) uskladio postupak s novim propisima i dopunio sastav radne grupe. Radna grupa je plan u cijelosti izradila prema metodologiji i modelima Uputstva, uz korištenje rezultata ranije provedene ankete zaposlenih.`),
  ];
}

function odluke() {
  return [
    H1('3. Odluke i rješenja'),
    H2('3.1. Odluka o izradi plana integriteta'),
    ...['Broj: 610-93/2025', 'Datum: 28.01.2025. godine'].map((t, i) => left(t, { after: i ? 120 : 0 })),
    P('Na osnovu Strategije za borbu protiv korupcije 2015.-2019. godine, a u vezi sa realizacijom specifičnih mjera predviđenih Akcionim planom za provođenje Strategije za borbu protiv korupcije, direktor JU OŠ „STIJENA“ donosi:'),
    center('ODLUKU O IZRADI PLANA INTEGRITETA', { bold: true, before: 120 }),
    art(1), P('Ovom Odlukom se izražava opredijeljenost institucije za izradu plana integriteta JU OŠ „Stijena“, te se formira radna grupa koja će sačiniti prijedlog plana integriteta.'),
    art(2), P('Za koordinatora radne grupe zadužene za izradu plana integriteta u JU OŠ „Stijena, imenuje se Sabina Žunić, pedagog škole.'),
    P('Za članove radne grupe zadužene za izradu plana integriteta u JU OŠ „Stijena“, imenuju se:', { after: 40 }),
    ...['1. Edin Pehlić,nastavnik', '2. Dženita Hepić,knjigovođa škole', '3. Elvira Vatić,nastavnik', '4. Dževaira Džehverović,soc.radnik škole', '5. Semira Džakilić,sekretar škole'].map((t) => left(t, { after: 20, indent: { left: 400 } })),
    art(3), P('Radna grupa za izradu plana integriteta dužna je da u roku od 30 dana od dana imenovanja, dostavi direktoru JU OŠ „Stijena“, program rada za izradu plana integriteta.'),
    P('Radna grupa za izradu plana integriteta je dužna da sačini prijedlog plana integriteta i dostavi ga rukovodiocu institucije u roku od 3 mjeseca od dana donošenja ove odluke.'),
    P('Mandat koordinatora i članova radne grupe za izradu plana integriteta traje do donošenja Odluke/ Rješenja o usvajanju i provođenju plana integriteta.'),
    art(4), P('Svi uposleni u JU OŠ „Stijena“, dužni su da pruže radnoj grupi za izradu plana integriteta svu pomoć i informacije potrebne u procesu izrade plana integriteta.'),
    art(5), P('Ova odluka stupa na snagu danom donošenja.'),
    right('DIREKTOR ŠKOLE:', { bold: true, after: 0 }), right('/Vatić Mersad /'),
    left('Dostavljeno: 1. Koordinatoru radne grupe; 2. Članovima radne grupe; 3. Agenciji za prevenciju korupcije i koordinaciju borbe protiv korupcije; 4. Timu Ureda za borbu protiv korupcije Vlade USK-a; 5. a/a', { size: 19 }),

    H2('3.2. Odluka o izmjenama i dopunama Odluke o izradi plana integriteta', { pb: true }),
    ...brDat(),
    P(`Na osnovu člana 43. st. (2) i (5) i člana 46. stav (1) ${ZAKON}, ${UPU} i ${STRAT}, a u vezi sa realizacijom mjera i aktivnosti predviđenih Akcionim planom za njeno provođenje, direktor Javne ustanove Osnovna škola „Stijena“ donosi`),
    center('ODLUKU', { bold: true, before: 120, after: 0 }), center('o izmjenama i dopunama Odluke o izradi plana integriteta', { bold: true }),
    art(1), P('U Odluci o izradi plana integriteta JU OŠ „Stijena“ broj 610-93/2025 od 28.01.2025. godine (u daljem tekstu: Odluka) postupak izrade plana integriteta nastavlja se u skladu sa Zakonom o prevenciji korupcije u Unsko-sanskom kantonu i Uputstvom za izradu i provođenje Plana integriteta u institucijama u Unsko-sanskom kantonu.'),
    art(2), P('Član 2. Odluke mijenja se i glasi:'),
    P('„Za menadžera/koordinatora radne grupe zadužene za izradu plana integriteta u JU OŠ „Stijena“ imenuje se Sabina Žunić, pedagog škole.', { indent: { left: 400 } }),
    P('Za članove radne grupe zadužene za izradu plana integriteta u JU OŠ „Stijena“ imenuju se:', { indent: { left: 400 }, after: 40 }),
    ...CLAN.slice(1).map((c, i) => left(`${i + 1}. ${c[0]}, ${c[1]}, član`, { after: 20, indent: { left: 800 } })),
    P('“', { indent: { left: 400 } }),
    art(3), P('Član 3. stav 1. i 2. Odluke mijenjaju se i glase: „Radna grupa dužna je da u roku od 15 dana od dana donošenja Odluke o izmjenama i dopunama dostavi direktoru program rada za izradu plana integriteta. Radna grupa dužna je da sačini prijedlog plana integriteta i dostavi ga direktoru u roku od 45 dana od dana donošenja Odluke o izmjenama i dopunama.“'),
    art(4), P('Radna grupa u izradi plana koristi rezultate anonimne ankete zaposlenih provedene u postupku izrade plana integriteta 2025. godine, bez izmjene izvornih podataka.'),
    art(5), P('Ostale odredbe Odluke ostaju nepromijenjene.'),
    art(6), P('Ova odluka stupa na snagu danom donošenja.'),
    center('Obrazloženje', { bold: true, before: 120, after: 60 }),
    P('Postupak izrade plana integriteta pokrenut je prije stupanja na snagu Zakona o prevenciji korupcije u Unsko-sanskom kantonu i donošenja Uputstva, pa je postupak potrebno uskladiti s važećim propisima. Uputstvo predviđa da radna grupa najčešće broji od tri do pet članova, ali po potrebi može imati i veći broj članova, u zavisnosti od veličine institucije i broja zaposlenih. S obzirom na veličinu škole (67,52 priznatih izvršilaca) i potrebu da u radnoj grupi bude zastupljena kompletna stručna služba, radna grupa se dopunjuje psihologom škole.'),
    ...potpis('DIREKTOR ŠKOLE', 'Mersad Vatić'),
    left('Dostavljeno: menadžeru/koordinatoru radne grupe; članovima radne grupe (6x); Uredu za borbu protiv korupcije Unsko-sanskog kantona; oglasna tabla; a/a.', { size: 19 }),

    H2('3.3. Sastav radne grupe i podjela zaduženja'),
    table([500, 2500, 1700, 2100, 2838], [['Rb.', 'Ime i prezime', 'Radno mjesto', 'Uloga', 'Zaduženje po oblastima'], ...CLAN.map((c, i) => [`${i + 1}.`, c[0], c[1], c[2], ZAD[i]])], { size: 18 }),
    spacer(4),
    P('Članovi radne grupe prije početka rada potpisuju izjavu o nepostojanju sukoba interesa i izuzimaju se iz ocjene rizika u kojima imaju lični interes.', { size: 20 }),
  ];
}

function obavjestenje() {
  return [
    H1('4. Obavještenje zaposlenima'),
    H2('4.1. Obavijest o izradi plana integriteta'),
    left('Broj: 610-94/2025', { after: 0 }), left('Datum: 28.01.2025. godine'),
    center('OBAVIJEST O IZRADI PLANA INTEGRITETA', { bold: true }),
    P('PREDMET: Obavijest uposlenima o preduzimanju aktivnosti usmjerenih na izradu plana inegriteta JU OŠ „Stijena, dostavlja se:'),
    P('Poštovane kolegice i kolege,'),
    P('Agencija za prevenciju korupcije i koordinaciju borbe protiv korupcije izradila je i usvojila Pravila za izradu i provođenje planova integriteta u institucijama Bosne i Hercegovine (u daljem tekstu Pravila). U skladu sa navedenim Pravilima obaveza naše institucije je da izradi i usvoji plan integriteta.'),
    P('S tim u vezi, informišem vas da sam dana 28.01.2025. godine, donio Odluku o izradi plana integriteta i imenovanju članova radne grupe za izradu plana integriteta (broj:610-93/2025. godine).'),
    P('Ovom odlukom za koordinatora radne grupe imenovan je Sabina Žunić,pedagog škole, a za članove radne grupe imenovani su: 1. Edina Pehlić,nastavnik; 2. Dženita Hepić,knjigovođa; 3. Elvira Vatić,nastavnik; 4. Dževaira Džehverović,soc.radnik škole; 5. Semira Džakulić, sekretar škole.'),
    P('Kako bismo na što sveobuhvatniji način prikupili informacije i podatke koji su radnoj grupi potrebni za izradu plana integriteta, neophodna je podrška, pomoć te aktivno učešće svih uposlenih u našoj instituciji.'),
    P('Naglašavam obavezu da su svi uposleni u JU OŠ „Stijena“ dužni da pruže svu pomoć i informacije potrebne za proces izrade i provođenje plana integriteta, te da sarađuju sa radnom grupom.'),
    P('S poštovanjem,'), right('D I R E K T O R :', { bold: true, after: 0 }), right('/ Vatić Mersad/'),
    left('Dostavljeno: oglasna tabla; a/a', { size: 19 }),
    H2('4.2. Obavijest o nastavku izrade plana integriteta', { pb: true }),
    ...brDat(),
    P('PREDMET: Obavijest zaposlenima o preduzimanju aktivnosti usmjerenih na izradu plana integriteta JU OŠ „Stijena“, dostavlja se'),
    P('Poštovane kolegice i kolege,'),
    P('Vlada Unsko-sanskog kantona je, na prijedlog Ureda za borbu protiv korupcije Unsko-sanskog kantona, usvojila Uputstvo za izradu i provođenje planova integriteta u institucijama u Unsko-sanskom kantonu. U skladu s tim Uputstvom i Zakonom o prevenciji korupcije u Unsko-sanskom kantonu, obaveza naše institucije je da izradi i usvoji plan integriteta.'),
    P(`S tim u vezi, informišem vas da sam dana ${B} donio Odluku o izmjenama i dopunama Odluke o izradi plana integriteta (broj ${B} od dana ${B}). Ovom odlukom za menadžera/koordinatora radne grupe imenovana je Sabina Žunić, pedagog, a za članove radne grupe imenovani su: Edin Pehlić, Dženita Hepić, Elvira Vatić, Dževaira Džehverović, Semira Džakulić i Kenan Vukalić.`),
    P('Kako bismo na što sveobuhvatniji način prikupili informacije i podatke koji su radnoj grupi potrebni za izradu plana integriteta, neophodna je podrška, pomoć te aktivno učešće svih zaposlenih u našoj instituciji. Naglašavam obavezu da su svi zaposleni u JU OŠ „Stijena“ dužni da pruže svu pomoć i informacije potrebne za proces izrade i provođenje plana integriteta, te da sarađuju sa radnom grupom.'),
    P('S poštovanjem,'), ...potpis('DIREKTOR ŠKOLE', 'Mersad Vatić'),
    left('Dostavljeno: oglasna tabla; a/a.', { size: 19 }),
  ];
}

function program() {
  const rowsSrc = SRC.program.map((r) => (/^Faza/.test(r[1] || '') ? [{ t: r[1], b: true, fill: C.band, span: 2 }, { t: r[2], b: true, fill: C.band }, { t: r[3], b: true, fill: C.band }] : [r[0], r[1], r[2], r[3]]));
  const F = [
    ['Faza 1: MJERA/AKTIVNOST', 'ODGOVORNA OSOBA', 'ROK'],
    ['Donošenje Odluke o izmjenama i dopunama Odluke o izradi (imenovanje radne grupe)', 'Direktor', B],
    ['Priprema Programa rada radne grupe', 'Radna grupa', '15 dana od Odluke o izmjenama'],
    ['Odobravanje Programa rada radne grupe', 'Direktor', '3 dana od prijema Programa'],
    ['Obavještavanje zaposlenih o planiranim aktivnostima na izradi plana integriteta', 'Direktor', 'Uz odobrenje Programa'],
    ['Faza 2: MJERA/AKTIVNOST', 'ODGOVORNA OSOBA', 'ROK'],
    ['Početna procjena stanja integriteta', 'Radna grupa', '20 dana od Odluke o izmjenama'],
    ['Prikupljanje neophodne dokumentacije za izradu plana integriteta', 'Radna grupa; sekretar; knjigovođa', '20 dana od Odluke o izmjenama'],
    ['Pregled i analiza prikupljene dokumentacije u vezi sa procjenom izloženosti i otpornosti institucije rizicima', 'Radna grupa', '25 dana od Odluke o izmjenama'],
    ['Analiza rezultata anonimne ankete zaposlenih (provedene 2025. godine)', 'Radna grupa; psiholog', '25 dana od Odluke o izmjenama'],
    ['Identifikacija i analiza rizika i faktora rizika', 'Radna grupa', '30 dana od Odluke o izmjenama'],
    ['Procjena i rangiranje rizika', 'Radna grupa', '30 dana od Odluke o izmjenama'],
    ['Faza 3: MJERA/AKTIVNOST', 'ODGOVORNA OSOBA', 'ROK'],
    ['Odabir prijedloga mjera za unapređenje integriteta i određivanje prioriteta predloženih mjera', 'Radna grupa', '38 dana od Odluke o izmjenama'],
    ['Izrada i podnošenje Izvještaja o stanju integriteta u instituciji', 'Radna grupa', '42 dana od Odluke o izmjenama'],
    ['Faza 4: MJERA/AKTIVNOST', 'ODGOVORNA OSOBA', 'ROK'],
    ['Priprema i dostavljanje rukovodiocu institucije nacrta plana integriteta', 'Radna grupa', '45 dana od Odluke o izmjenama'],
    ['Pregled predloženog plana integriteta i dostavljanje istog na mišljenje Uredu za borbu protiv korupcije Unsko-sanskog kantona', 'Direktor', '8 dana od prijema nacrta'],
    ['Usvajanje plana integriteta / imenovanje osobe zadužene za nadzor nad provođenjem plana integriteta', 'Direktor', 'Nakon pozitivnog mišljenja Ureda'],
    ['Dostava usvojenog plana Uredu i objava na web stranici škole', 'Direktor; sekretar', '15 dana od usvajanja'],
  ];
  let n = 0;
  const rows = F.map((r) => { if (/^Faza/.test(r[0])) { n = 0; return [{ t: r[0], b: true, fill: C.band, span: 2 }, { t: r[1], b: true, fill: C.band }, { t: r[2], b: true, fill: C.band }]; } n++; return [`${n}.`, r[0], r[1], r[2]]; });
  const zap = [
    ['Prvi sastanak', 'Konstituisanje radne grupe; upoznavanje sa Zakonom i Uputstvom; podjela zaduženja; utvrđivanje prijedloga Programa rada'],
    ['Drugi sastanak', 'Analiza prikupljene dokumentacije i rezultata ankete; početna procjena stanja integriteta'],
    ['Treći sastanak', 'Identifikacija rizika i faktora; ocjena postojećih kontrolnih mehanizama; ocjena vjerovatnoće i posljedica'],
    ['Četvrti sastanak', 'Rangiranje rizika; prijedlog mjera, prioriteta, izvršilaca, rokova i troškova; usvajanje Izvještaja o stanju integriteta'],
  ];
  return [
    H1('5. Program rada radne grupe'),
    H2('5.1. Program rada izrade plana integriteta (broj 610-95/2025)'),
    kv([['Javna ustanova', 'Javna ustanova Osnovna škola „Stijena“'], ['Odgovorno lice', 'Direktor škole Vatić Mersad'], ['Koordinator', 'Sabina Žunić'],
      ['Članovi radne grupe', 'Edin Pehlić, Dženita Hepić, Elvira Vatić, Dževaira Džehverović, Semira Džakulić'], ['Datum donošenja odluke', '28.01.2025. godine'],
      ['Datum donošenja programa', '30.01.2025. godine'], ['Početak programa', '28.01.2025. godine'], ['Očekivani završetak', '28.02.2025. godine']], 3000, WP, { size: 19 }),
    spacer(6),
    table([500, 5638, 1800, 1700], rowsSrc, { size: 18, header: 0 }),
    H2('5.2. Program rada radne grupe za izradu plana integriteta (nastavak postupka)', { pb: true }),
    kv([['Naziv institucije', 'Javna ustanova Osnovna škola „Stijena“'], ['Rukovodilac institucije', 'Mersad Vatić, direktor'], ['Menadžer/koordinator radne grupe', 'Sabina Žunić, pedagog'],
      ['Članovi radne grupe', 'Edin Pehlić, Dženita Hepić, Elvira Vatić, Dževaira Džehverović, Semira Džakulić, Kenan Vukalić'], ['Angažovani vanjski konsultanti', 'Nema'],
      ['Datum odobravanja programa rada', B], ['Početak izrade plana integriteta', B], ['Očekivani završetak', B]], 3000, WP, { size: 19 }),
    spacer(6),
    table([600, 5038, 2200, 1800], rows, { size: 18, header: 0 }),
    spacer(6),
    P('**Zaduženja članova** radne grupe utvrđena su u dijelu 3.3. **Način praćenja provođenja programa rada:** menadžer/koordinator vodi zapisnike sa sastanaka radne grupe (datum, prisutni, dnevni red, zaključci, zaduženja i rokovi) i nakon svake faze pisano izvještava direktora. Zapisnici čine sastavni dio dokumentacije plana integriteta.'),
    ...potpis('DIREKTOR ŠKOLE', 'Mersad Vatić'),
    H2('5.3. Zapisnici sa sastanaka radne grupe', { pb: true }),
    P('Radna grupa održava najmanje četiri sastanka. Za svaki sastanak sačinjava se zapisnik prema sljedećem obrascu:'),
    ...zap.flatMap(([n2, dr]) => [
      P(`**Zapisnik – ${n2.toLowerCase()} radne grupe za izradu plana integriteta JU OŠ „Stijena“**`, { keepNext: true, before: 160, after: 60 }),
      table([2600, 7038], [[{ t: 'Datum i vrijeme', b: true, fill: C.light }, B], [{ t: 'Mjesto', b: true, fill: C.light }, B], [{ t: 'Prisutni', b: true, fill: C.light }, B], [{ t: 'Odsutni', b: true, fill: C.light }, B],
        [{ t: 'Dnevni red', b: true, fill: C.light }, dr], [{ t: 'Zaključci i zaduženja', b: true, fill: C.light }, '\n\n\n'], [{ t: 'Zapisničar / Menadžer-koordinator', b: true, fill: C.light }, `${B} / Sabina Žunić`]], { header: 0, size: 18, cantSplit: true }),
    ]),
  ];
}

function okvir() {
  const prop = [
    ['Antikorupcijski okvir', ''], ['Zakon o prevenciji korupcije u Unsko-sanskom kantonu', 'Sl. glasnik USK 24/25, 3/26'],
    ['Uputstvo za izradu i provođenje Plana integriteta u institucijama u Unsko-sanskom kantonu', 'Sl. glasnik USK 11/26'],
    ['Strategija za borbu protiv korupcije Unsko-sanskog kantona 2023.–2027.', 'Sl. glasnik USK 26/23'],
    ['Zakon o prijavljivanju i postupku provjere podataka o imovini nosilaca javnih funkcija u Unsko-sanskom kantonu', 'Sl. glasnik USK'],
    ['Zakon o zaštiti ličnih podataka', 'Sl. glasnik BiH 12/25'],
    ['Odgoj i obrazovanje', ''], ['Okvirni zakon o osnovnom i srednjem obrazovanju u Bosni i Hercegovini', 'Sl. glasnik BiH 18/03'],
    ['Zakon o osnovnom odgoju i obrazovanju', 'Sl. glasnik USK 19/23, 20/24, 5/26'], ['Pedagoški standardi i normativi za osnovno obrazovanje', 'Sl. glasnik USK 20/24'],
    ['Kolektivni ugovor za djelatnost predškolskog i osnovnog odgoja i obrazovanja za teritoriju USK', 'Sl. glasnik USK'],
    ['Rad, finansije, nabavke i uprava', ''], ['Zakon o javnim nabavkama', 'Sl. glasnik BiH 39/14, 59/22, 50/24'], ['Zakon o radu', 'Sl. novine FBiH'],
    ['Zakon o upravnom postupku', 'Sl. novine FBiH'], ['Zakon o budžetima u Federaciji Bosne i Hercegovine', 'Sl. novine FBiH'], ['Zakon o penzijskom i invalidskom osiguranju', 'Sl. novine FBiH'],
    ['Zakon o zaštiti na radu', 'Sl. novine FBiH'], ['Zakon o ministarskim, vladinim i drugim imenovanjima Federacije Bosne i Hercegovine', 'Sl. novine FBiH'],
    ['Zakon o kontroli i ograničenoj upotrebi duhana, duhanskih i ostalih proizvoda za pušenje', 'Sl. novine FBiH'], ['Uredba sa zakonskom snagom o ustanovama', ''],
  ];
  const kant = ['Pravilnik o definiranju kriterija za proglašavanje uposlenika za čijim je radom djelimično ili potpuno prestala potreba, te uvjeti preuzimanja uposlenika iz jedne škole u drugu', 'Pravilnik s kriterijima o bodovanju kandidata za prijem u radni odnos u odgojno-obrazovnim ustanovama', 'Pravilnik o praćenju, napredovanju i ocjenjivanju znanja učenika osnovne i srednje škole', 'Pravilnik o provođenju Smotre sposobnosti, znanja i stvaralaštva i sporta učenika osnovnih i srednjih škola USK-a', 'Pravilnik o polaganju stručnog ispita nastavnika i stručnih saradnika', 'Pravilnik o odgoju i obrazovanju, praćenju i ocjenjivanju djece sa poteškoćama u razvoju u USK-a', 'Pravilnik o načinu obavljanja obavezne dezinfekcije, dezinsekcije i deratizacije', 'Pravilnik o uvjetima i načinu ostvarivanja prava na naknadu plaće za vrijeme privremene spriječenosti za rad', 'Pravilnik o sadržaju i vođenju evidencije o radnicima', 'Pravilnik o učeničkim zadrugama', 'Pravilnik o kriteriju i postupku osnivanja škole kad nije osiguran dovoljan broj učenika', 'Pravilnik o stručno-pedagoškom nadzoru (Obrazac SPN 1-10)', 'Pravilnik o bržem napredovanju učenika i završavanju dva razreda u istoj školskoj godini', 'Pravilnik o upisu osnovne škole u registar', 'Pravilnik o kriterijima za proglašenje učenika generacije', 'Pravilnik o načinu i obliku provođenja odgojno-obrazovne podrške i stručnog tretmana', 'Pravilnik o vođenju evidencije o neprihvatljivim oblicima ponašanja i zaštiti učenika', 'Pravilnik o formiranju i radu školskih odbora', 'Pravilnik o kriterijima o školskim nazivima i simbolima i organizaciji školskih manifestacija', 'Pravilnik o organizaciji i realizaciji izleta, studijskih posjeta, ekskurzija, kampovanja/logorovanja, društveno-korisnog rada i drugih oblika odgojno-obrazovnog rada u osnovnoj i srednjoj školi', 'Smjernice za izuzimanje djeteta od pohađanja određene škole', 'Instrukcija o načinu vođenja dokumentacije i evidencije i izdavanja svjedodžbi', 'Protokol o postupanju u slučaju napuštanja i nepohađanja nastave', 'Protokol o postupanju u slučaju nasilja koje uključuje djecu', 'Protokol za prevenciju i postupanje u slučajevima prosjačenja i drugih oblika eksploatacije djece u Gradu Cazinu'];
  const interni = [['Pravila škole', B, 'Na snazi'], ['Pravilnik o radu', '610-1133/24 od 27.09.2024.', 'Na snazi'], ['Pravilnik o reprezentaciji i poklonima', B, 'Na snazi'], ['Pravilnik o internim kontrolama i internim kontrolnim postupcima', B, 'Na snazi'], ['Pravilnik o kućnom redu', B, 'Na snazi'], ['Pravilnik o postupku direktnog sporazuma', B, 'Na snazi; usklađuje se sa važećim Zakonom o javnim nabavkama'], ['Pravilnik o disciplinskoj i materijalnoj odgovornosti radnika', B, 'Na snazi'], ['Pravilnik o naknadi štete', B, 'Na snazi'], ['Pravilnik o radu Vijeća učenika; Poslovnik o radu Vijeća učenika', B, 'Na snazi'], ['Poslovnik o radu Vijeća roditelja škole', B, 'Na snazi'], ['Poslovnik o radu Školskog odbora', B, 'Na snazi'],
    ['Pravilnik o postupku internog prijavljivanja korupcije (čl. 22. Zakona)', B, 'Mjera M-Z10.1.1'], ['Rješenje o ovlaštenom licu za prijem prijava korupcije (čl. 18. Zakona)', B, 'Mjera M-Z10.1.1'], ['Kodeks ponašanja zaposlenih', B, 'Mjera M-Z7.1.1'], ['Akt o zaštiti ličnih podataka', B, 'Mjera M-Z4.2.1'], ['Procedura upravljanja sukobom interesa i registar izjava', B, 'Mjera M-Z8.1.1']];
  return [
    H1('6. Zakonski okvir i interni propisi'),
    P('Radna grupa je izvršila popis normativnih akata kojima se uređuje rad škole: zakona, uredbi, strateških dokumenata, kantonalnih pravilnika, instrukcija i protokola, te internih akata škole.'),
    H2('6.1. Zakoni, uredbe i strateški dokumenti'),
    table([6400, 3238], [['Propis', 'Službeno glasilo'], ...prop.map((r) => (r[1] === '' && /^[A-ZO][a-z]/.test(r[0]) && !/Zakon|Uredba/.test(r[0]) ? [{ t: r[0], b: true, fill: C.band, span: 2 }] : r))], { size: 18 }),
    H2('6.2. Kantonalni pravilnici, instrukcije i protokoli'),
    ...kant.map((t) => bullet(t, 0, { size: 20 })),
    H2('6.3. Interni akti škole'),
    table([4600, 2400, 2638], [['Interni akt', 'Broj i datum', 'Status'], ...interni], { size: 18 }),
  ];
}

function organizacija() {
  const kat = SRC.katalog.map((r) => [r[0], r[1], r[2], { t: r[3].split('\n').filter(Boolean) }, r[4] || 'Srednja odgovornost']);
  return [
    H1('7. Organizaciona struktura, katalog radnih mjesta i nivoi donošenja odluka'),
    H2('7.1. Organizaciona struktura'),
    P('Unutrašnja organizacija rada škole utvrđena je Pravilnikom o radu škole broj 610-1133/24 od 27.09.2024. godine i predstavlja osnov za obavljanje odgojno-obrazovne djelatnosti. Opis radnih mjesta osnov je za procjenu rizika, a razgovor sa zaposlenima na tim radnim mjestima daje dodatne podatke o problemima s kojima se susreću u radu. Rad škole organizovan je kako slijedi:'),
    ...['Poslovi rukovođenja školom: direktor;', 'Odgojno-obrazovni rad sa učenicima: stručni saradnici (pedagog, psiholog, socijalni radnik, bibliotekar) i nastavnici;', 'Administrativno-finansijski poslovi: sekretar-blagajnik i knjigovođa;', 'Tehničko-higijenski poslovi: domar-ložač i radnici na održavanju higijene školskog prostora.'].map((t) => bullet(t)),
    P('U skladu s Pedagoškim standardima i normativima za osnovno obrazovanje, ministar obrazovanja, nauke, kulture i sporta Unsko-sanskog kantona donio je Odluku o priznavanju broja izvršilaca za školsku 2024/2025. godinu, sa ukupno 67,52 izvršioca na neodređeno i određeno radno vrijeme. U okviru tog broja prikazana su sistematizovana radna mjesta.'),
    H2('7.2. Katalog radnih mjesta', { pb: true }),
    table([450, 1350, 850, 5388, 1600], [['Rb.', 'Naziv radnog mjesta', 'Broj izvršilaca', 'Glavni zadaci i odgovornosti', 'Procjena odgovornosti'], ...kat], { size: 17 }),
    H2('7.3. Nivoi donošenja odluka i odgovornost'),
    P('Radom škole rukovodi direktor u skladu sa zakonom, podzakonskim aktima i općim aktima škole. Direktor zastupa i predstavlja školu bez ograničenja. Poslovi direktora utvrđeni su članom 142. Zakona o osnovnom odgoju i obrazovanju i Pravilima škole. Direktor je dužan obustaviti od izvršenja opći akt Školskog odbora za koji smatra da je u suprotnosti s Ustavom ili zakonom, kao i pojedinačni akt kojim se nanosi šteta školi ili društvenoj zajednici, osim akata koji se odnose na postupak prijevremenog razrješenja ili suspenzije direktora, te o tome obavijestiti osnivača i Školski odbor.'),
    P('Školom upravlja Školski odbor, čija je nadležnost utvrđena članom 134. Zakona o osnovnom odgoju i obrazovanju i Pravilima škole. Školski odbor osigurava djelotvorno i efikasno korištenje resursa škole i brine o zakonitosti rada škole i njenih organa; donosi Pravila škole i opće akte; donosi Godišnji program rada i usvaja izvještaj o njegovoj realizaciji; usvaja finansijski plan i godišnji izvještaj o finansijskom poslovanju; odlučuje o korištenju sredstava u skladu sa zakonom; raspisuje konkurs te imenuje i razrješava direktora u skladu sa zakonom; razmatra izvještaj o radu direktora i izvještaje nadzornih tijela; rješava po prigovorima roditelja i obavlja druge poslove u skladu sa zakonom i Pravilima škole.'),
    P('Direktor za svoj rad odgovara Školskom odboru i osnivaču, Školski odbor osnivaču, a svi zaposleni direktoru škole.'),
    table([2600, 4238, 2800], [['Nivo', 'Ključne odluke', 'Odgovara'], ['Školski odbor', 'Opći akti, finansijski plan, Godišnji program rada, imenovanje direktora, prigovori roditelja', 'Osnivaču'], ['Direktor', 'Prijem i prava iz radnog odnosa, raspored poslova, utrošak sredstava, ugovori, javne nabavke, plan integriteta', 'Školskom odboru i osnivaču'], ['Nastavničko vijeće i odjeljenjska vijeća', 'Ocjenjivanje, pedagoške mjere, učenik generacije, stručna pitanja', 'Direktoru'], ['Komisije (prijem, nabavke, ispiti, popis, ekskurzije)', 'Prijedlozi i odluke u okviru rješenja o imenovanju', 'Direktoru'], ['Vijeće roditelja, Vijeće učenika', 'Savjetodavna uloga i saglasnosti propisane aktima', 'Prema poslovnicima'], ['Zaposleni', 'Izvršavanje poslova radnog mjesta', 'Direktoru']], { size: 18 }),
  ];
}

function izvjestaj() {
  const ranj = SRC.ranjiva.map((r) => { const lvl = r.slice(3).findIndex((x) => x && x.trim()) + 1; return [r[0], r[1].replace(/\n/g, ' '), r[2], { t: String(lvl), align: AT.CENTER, b: true }]; });
  const map = { Direktor: 'Z1.1, Z1.2, Z3.1, Z5.1, Z8.1, Z9.1', Nastavnik: 'S1.1–S1.3, Z8.2, Z9.1, S7.1', 'Sekretar - blagajnik': 'Z1.3, Z2.2, Z4.1, Z6.1, Z10.1', Knjigovođa: 'Z2.1, Z3.1, Z3.3, Z9.2' };
  const krit = SRC.kriticna.map((r) => [r[0], r[1], { t: r[2].split('\n').filter(Boolean).map((x) => x.replace(/^-\s*/, '- ')) }, { t: r[3].split(/\n?- /).map((x) => x.replace(/\n/g, ' ').trim()).filter(Boolean).map((x) => '- ' + x) }, { t: r[4], align: AT.CENTER, b: true }, map[r[1]] || '—']);
  return [
    H1('8. Izvještaj o stanju integriteta'),
    H2('8.1. Početna procjena stanja integriteta'),
    P('Početna procjena izvršena je na osnovu analize zakonskih i podzakonskih akata i internih propisa, opisa radnih mjesta, stručnog znanja članova radne grupe o funkcionisanju škole i rezultata anonimne ankete zaposlenih (Prilog 2). Utvrđeno je da se poslovni procesi u pravilu obavljaju u skladu s propisima i da zaposleni u velikoj mjeri imaju povjerenje u zakonitost rada škole. Istovremeno su utvrđene sljedeće slabosti:'),
    ...['sistem internog prijavljivanja nije u potpunosti usklađen sa Zakonom o prevenciji korupcije u USK, a većina zaposlenih ne zna kako anonimno prijaviti kršenje integriteta;', 'nije određena osoba niti uspostavljena procedura za upravljanje sukobom interesa;', 'interni akti nisu dostupni na jednom mjestu niti objavljeni na web stranici škole;', 'teme integriteta i etike ne razmatraju se redovno, a kodeks ponašanja zaposlenih nije donesen;', 'mali broj izvršilaca u administrativno-finansijskoj službi ograničava podjelu dužnosti;', 'kriteriji ocjenjivanja, zapošljavanja i raspodjele dodatnih zaduženja nisu dovoljno transparentni prema zaposlenima, roditeljima i kandidatima.'].map((t) => bullet(t)),
    H2('8.2. Mehanizam otpornosti institucije na eventualne propuste'),
    P('Škola ima istaknuto sanduče za prijavu koruptivnog ponašanja. Mehanizmi otpornosti su nadzor Školskog odbora i osnivača, stručno-pedagoški nadzor, prosvjetna inspekcija, interne kontrole prema Pravilniku o internim kontrolama i internim kontrolnim postupcima, kolektivno odlučivanje stručnih organa i pravo roditelja na prigovor. Ovi mehanizmi jačaju se mjerama iz dijela 11, posebno donošenjem pravilnika o internom prijavljivanju, određivanjem ovlaštenog lica i označavanjem sandučeta natpisom „ZA PRIJAVU KORUPCIJE“.'),
    H2('8.3. Analiza ranjivih aktivnosti'),
    table([1700, 3000, 2938, 2000], [['Aspekt', 'Rezultat ankete (Prilog 2)', 'Procjena radne grupe', 'Povezani rizici'],
      ['A – Rizične aktivnosti i podložnost korupciji', '64,86% ne zna kako anonimno prijaviti kršenje integriteta; 44% ne zna gdje su dostupni interni akti', 'Kontrolni okvir za prijave i dostupnost akata treba ojačati', 'Z1.3, Z10.1, Z11.2'],
      ['B – Opis radnog mjesta, konsultacije, ocjena rada', '97,30% poznaje opis radnog mjesta; 16,22% nikada ne razgovara o integritetu na sastancima', 'Dobra organizaciona jasnoća; potrebna redovna komunikacija o etici', 'Z7.1'],
      ['C – Profesionalni i privatni život', '13,51% suočeno sa situacijom u kojoj bi profesionalna odluka imala posljedice po privatni život; niko nije uključio drugoga u odlučivanje', 'Potrebna procedura prijave privatnog interesa i izuzeća', 'Z8.1, Z8.2'],
      ['D – Kontakti izvan škole', '45,95% ostvaruje kontakte izvan škole; nadređeni u većini slučajeva nije upoznat s njihovom prirodom', 'Izloženost uticaju trećih lica', 'Z7.2, Z8.1'],
      ['E – Rezultati i kvalitet', '10,81% smatra da saradnici daju prednost vlastitim interesima', 'Organizaciona kultura pretežno profesionalna', 'Z7.1'],
      ['F – Upravljanje sredstvima', '72,97% ne zna za procedure u slučaju prevare ili krađe; 40,54% ne zna za interne propise o nabavkama; 78,38% smatra potrebnim lice za sukob interesa', 'Propisi postoje, ali nisu dovoljno poznati zaposlenima', 'Z2.1, Z3.1, Z8.1']], { size: 17 }),
    H2('8.4. Analiza kritičnih aktivnosti i kritičnih radnih mjesta', { pb: true }),
    P('Radna mjesta su ocijenjena prema podložnosti koruptivnom djelovanju na skali od 1 do 5 (1 – nepostojanje prijetnji; 2 – mala vjerovatnoća; 3 – srednji nivo vjerovatnoće; 4 – visoka vjerovatnoća; 5 – velika vjerovatnoća za korupciju). Ova ocjena služi za opis radnih mjesta koja su naročito podložna korupciji (član 44. tačka b) Zakona), dok se intenzitet pojedinačnih rizika ocjenjuje metodologijom Uputstva u dijelu 9.'),
    table([450, 6188, 2000, 1000], [['Rb.', 'Ranjiva aktivnost', 'Ranjivo radno mjesto', 'Nivo (1–5)'], ...ranj], { size: 17 }),
    H2('8.5. Opis kritičnih ranjivih radnih mjesta'),
    table([400, 1300, 2900, 2600, 900, 1538], [['Rb.', 'Radno mjesto', 'Opis kritičnih aktivnosti', 'Mogući rizici', 'Nivo (1–5)', 'Rizici u registru'], ...krit], { size: 17 }),
  ];
}

function metodologija() {
  return [
    H1('9. Identifikacija, analiza i procjena rizika'),
    H2('9.1. Oblasti djelovanja i metodologija'),
    P(`Radna grupa je identifikovala i analizirala rizike u svim zajedničkim oblastima iz Tabele broj 1 Uputstva i u specifičnim oblastima koje proizilaze iz nadležnosti osnovne škole prema Zakonu o osnovnom odgoju i obrazovanju. U svakoj oblasti izdvojena su najmanje dva rizika, a za svaki rizik popunjen je poseban analitički obrazac. Ukupno je identifikovano ${N.uk} rizika (${N.z} u zajedničkim i ${N.s} u specifičnim oblastima).`),
    table([700, 6538, 2400], [['Šifra', 'Oblast djelovanja', 'Vrsta oblasti'], ...OBLASTI.map((o) => [o.id, o.naziv, o.vrsta])], { size: 18 }),
    spacer(6),
    P('Faktori (izvori) rizika razvrstani su na sistemske (S), organizacijske (O), individualne (I) i radno-procesne i proceduralne (P). Postojeće mjere ocijenjene su odgovorima na pitanja da li mjera postoji, da li se primjenjuje i da li daje očekivani efekat, pa je rizik ocijenjen kao kontrolisan, djelimično kontrolisan ili nekontrolisan.'),
    P('Vjerovatnoća nastanka korupcije ocijenjena je za period školskih godina 2022/2023–2025/2026, na osnovu evidencije prijava, nalaza inspekcijskog i drugog nadzora, disciplinskih postupaka, prigovora i stručnog znanja članova radne grupe. Kod rizika za koje radna grupa nije utvrdila pojave u posmatranom periodu, vjerovatnoća je ocijenjena kao mala (1). Ocjena umjerene vjerovatnoće (2) dodijeljena je rizicima koje je radna grupa i u ranijoj procjeni ocijenila srednjom vjerovatnoćom (zapošljavanje, javne nabavke, upravljanje, evidencije, ocjenjivanje). Posljedica je ocijenjena prema mogućoj finansijskoj, reputacionoj, kadrovskoj i operativnoj šteti i povredi prava učenika i zaposlenih.'),
    table([3238, 2133, 2133, 2134], [['Posljedica \\ Vjerovatnoća', '1 – mala', '2 – umjerena', '3 – velika'],
      [{ t: '3 – vrlo značajne', b: true }, { t: '3', fill: C.mid, align: AT.CENTER }, { t: '6', fill: C.hi, align: AT.CENTER }, { t: '9', fill: C.hi, align: AT.CENTER }],
      [{ t: '2 – značajne', b: true }, { t: '2', fill: C.lo, align: AT.CENTER }, { t: '4', fill: C.mid, align: AT.CENTER }, { t: '6', fill: C.hi, align: AT.CENTER }],
      [{ t: '1 – neznatne', b: true }, { t: '1', fill: C.lo, align: AT.CENTER }, { t: '2', fill: C.lo, align: AT.CENTER }, { t: '3', fill: C.mid, align: AT.CENTER }]], { size: 19, cantSplit: true }),
    P('Intenzitet rizika (I = V × P): nizak 1–2, umjeren (srednji) 3–4, visok 6–9. Prioritet mjere slijedi intenzitet rizika.', { size: 20, before: 80 }),
  ];
}

function registar() {
  const rows = [];
  OBLASTI.forEach((o) => {
    rows.push([{ t: `${o.id} – ${o.naziv}`, b: true, fill: C.band, span: 8 }]);
    Rx.filter((r) => r.o === o.id).forEach((r) => rows.push([{ t: r.id, b: true }, r.naziv, r.a, { t: String(r.v), align: AT.CENTER }, { t: String(r.p), align: AT.CENTER }, { t: String(r.x), align: AT.CENTER, b: true, fill: FILL[r.nivo] }, { t: NIV[r.nivo], fill: FILL[r.nivo] }, r.prioritet]));
  });
  const heat = [3, 2, 1].map((p) => [{ t: PL[p], b: true }, ...[1, 2, 3].map((v) => { const n = cnt((r) => r.v === v && r.p === p); const x = intenzitet(v, p); return { t: n ? `${n}` : '–', fill: FILL[x.nivo], align: AT.CENTER }; })]);
  return [
    H2('9.2. Tabelarni pregled identifikovanih, analiziranih i procijenjenih rizika', { pb: true }),
    P(`Identifikovano je ${N.uk} rizika: ${N.vis} visokog, ${N.sre} umjerenog i ${N.niz} niskog intenziteta.`, { keepNext: true }),
    table([800, 5900, 1900, 600, 600, 700, 1200, 2870], [['Šifra', 'Rizik', 'Analiza rizika', 'V', 'P', 'I', 'Intenzitet', 'Prioritet mjera'], ...rows], { size: 17 }),
    H2('9.3. Rangiranje rizika', { pb: true }),
    P('Broj rizika po poljima temperaturne mape:', { keepNext: true }),
    table([3500, 3690, 3690, 3690], [['Posljedica \\ Vjerovatnoća', '1 – mala', '2 – umjerena', '3 – velika'], ...heat], { size: 19, cantSplit: true }),
    spacer(6),
    P('**Rang lista rizika** (od najvišeg intenziteta):', { keepNext: true }),
    table([900, 9370, 2000, 2300], [['Šifra', 'Rizik', 'Intenzitet', 'Prioritet'], ...[...Rx].sort((a, b) => b.x - a.x || a.id.localeCompare(b.id, 'bs', { numeric: true })).filter((r) => r.x >= 3).map((r) => [{ t: r.id, b: true }, r.naziv, { t: `${r.v} × ${r.p} = ${r.x}`, fill: FILL[r.nivo] }, r.prioritet])], { size: 17 }),
    P(`Ostalih ${N.niz} rizika niskog intenziteta prikazano je u tabeli 9.2 i obuhvaćeno mjerama niskog prioriteta.`, { size: 20, before: 80 }),
  ];
}

function obrasci() {
  const out = [H2('9.4. Analitički obrasci po rizicima', { pb: true }), P('Model analitički obrazac za unošenje podataka iz procesa identifikacije, analize, procjene, rangiranja rizika i prijedloga mjera (Prilog Uputstva) popunjen je za svaki rizik pojedinačno.')];
  OBLASTI.forEach((o) => {
    Rx.filter((r) => r.o === o.id).forEach((r) => {
      const nf = r.f.length;
      const rows = [
        ['Br.', 'Faktori/izvori rizika: Sistemski (S), Organizacijski (O), Individualni (I), Radno-procesni i proceduralni (P)', 'Postojeće mjere/ kontrolni mehanizmi na snazi u instituciji', 'Analiza rizika: Kontrolisan / Djelimično kontrolisan / Nekontrolisan', 'Ocjena vjerovatnoće nastanka korupcije', 'Ocjena posljedice nastanka korupcije', 'Intenzitet rizika'],
        ...r.f.map((f, i) => (i === 0 ? [`${i + 1}.`, `(${f[0]}) ${f[1]}`, { t: r.k.map((x) => '- ' + x), rspan: nf }, { t: r.a, rspan: nf, b: true }, { t: VL[r.v], rspan: nf, align: AT.CENTER }, { t: PL[r.p], rspan: nf, align: AT.CENTER }, { t: `${NIV[r.nivo]} (${r.x})`, rspan: nf, align: AT.CENTER, b: true, fill: FILL[r.nivo] }] : [`${i + 1}.`, `(${f[0]}) ${f[1]}`])),
      ];
      out.push(
        new d.Paragraph({ keepNext: true, spacing: { before: 120, after: 40 }, children: L.runs(`Oblast funkcionisanja institucije: **${o.id} – ${o.naziv}**`, { size: 19 }) }),
        new d.Paragraph({ heading: d.HeadingLevel.HEADING_3, keepNext: true, children: L.runs(`Rizik ${r.id}: ${r.naziv}`) }),
        P(`Opis rizika: ${r.opis}`, { size: 19, keepNext: true, after: 60 }),
        table([500, 4200, 3600, 1900, 1300, 1300, 1770], rows, { size: 17, cantSplit: true }),
        table([2600, 11970], [
          [{ t: 'Obrazloženje analize', b: true, fill: C.light }, r.ao],
          ...(r.ank ? [[{ t: 'Rezultat ankete', b: true, fill: C.light }, r.ank]] : []),
          [{ t: 'Korektivno postupanje', b: true, fill: C.light }, r.kor],
          [{ t: 'Mjere (dio 11.2)', b: true, fill: C.light }, `${r.m.map((m, i) => `M-${r.id}.${i + 1}`).join('; ')} – ${r.prioritet.toLowerCase()}`],
        ], { header: 0, size: 17, cantSplit: true }),
        spacer(8),
      );
    });
  });
  return out;
}

function statusQuo() {
  return [
    H1('10. Analiza postojećeg stanja (status quo)'),
    H2('10.1. Analiza na temelju ankete'),
    P('Radna grupa je provela anonimnu anketu zaposlenih pomoću upitnika za samoprocjenu integriteta, koji sadrži 34 pitanja grupisana u šest oblasti (A–F). Upitnik i izvještaj o rezultatima nalaze se u Prilogu 2. Ključni rezultati i njihova veza s rizicima:'),
    table([1500, 3200, 3438, 1500], [['Oblast / pitanje', 'Rezultat ankete', 'Zaključak radne grupe', 'Rizici'],
      ['A / 1', '91,89% svoja radna mjesta ne smatra podložnim korupciji', 'Potrebna je edukacija o prepoznavanju rizika u svakodnevnom radu.', 'Z7.1'],
      ['A / 5, 6', '83,78% smatra da se zakonska regulativa dosljedno provodi; 78,38% ocjenjuje mehanizam odgovornosti odličnim ili dobrim', 'Visok nivo povjerenja u zakonitost rada škole.', 'Z1.1'],
      ['A / 4', '47% zna, a 44% ne zna gdje su dostupni interni akti', 'Akte je potrebno objediniti i objaviti.', 'Z1.3'],
      ['A / 3', '81,08% smatra da ne nedostaje nijedan interni akt', 'Zaposleni nisu upoznati s novim zakonskim obavezama (pravilnik o prijavljivanju, kodeks, sukob interesa).', 'Z10.1, Z7.1, Z8.1'],
      ['A / 8', '64,86% nije upoznato s načinom anonimne prijave', 'Mehanizam prijave potrebno je urediti i predstaviti zaposlenima.', 'Z10.1, Z11.2'],
      ['B / 14–18', '97,30% poznaje opis radnog mjesta; 97,30% ima konsultacije s nadređenima, od čega 16,22% nikada ne razgovara o integritetu; 100% navodi da je nadređeni dostupan', 'Jasna organizacija i dobra komunikacija; integritet treba biti redovna tema.', 'Z7.1'],
      ['C / 19, 20', '13,51% je bilo suočeno sa situacijom u kojoj bi profesionalne odluke mogle imati posljedice po privatni život; niko nije predao pitanje drugome niti uključio saradnika ili nadređenog', 'Potrebna je procedura prijave privatnog interesa i izuzeća.', 'Z8.1'],
      ['D / 21–23', '45,95% ostvaruje kontakte izvan škole; nadređeni u većini slučajeva nije upoznat s njihovom prirodom', 'Potrebna su pravila o prijavi pokušaja neprimjerenog uticaja.', 'Z7.2'],
      ['E / 24–27', '10,81% smatra da saradnici daju prednost vlastitim interesima', 'Organizaciona kultura je pretežno profesionalna.', 'Z7.1'],
      ['F / 28–34', '54,05% ocjenjuje opskrbu dovoljnom; 81,08% nikada nije čulo za prevaru ili krađu; 72,97% ne zna za procedure; 86,49% zna za plan nabavki; 40,54% ne zna za interne propise o nabavkama; 78,38% smatra potrebnim lice za sukob interesa', 'Propisi postoje, ali ih je potrebno približiti zaposlenima; potrebno je odrediti osobu za praćenje sukoba interesa.', 'Z2.1, Z3.1, Z8.1']], { size: 17 }),
    H2('10.2. Analiza na temelju zakonskog okvira'),
    P('Zakonski okvir za odgojno-obrazovnu djelatnost je uspostavljen. U odnosu na Zakon o prevenciji korupcije u USK potrebno je donijeti pravilnik o postupku internog prijavljivanja korupcije i rješenje o ovlaštenom licu, uspostaviti proceduru upravljanja sukobom interesa, donijeti kodeks ponašanja zaposlenih i akt o zaštiti ličnih podataka, te plan integriteta i interne akte objaviti na web stranici škole.'),
    H2('10.3. Analiza na temelju poslovnih procesa'),
    P('Poslovni procesi se obavljaju u skladu sa zakonskim i podzakonskim propisima i internim aktima. Kod pojedinih procesa utvrđene su slabosti: ograničena podjela dužnosti u finansijama i blagajni, izostanak pisanih kriterija za diskrecione odluke, neujednačeno dokumentovanje rada komisija, prikupljanje gotovine preko razrednika i izostanak redovne unakrsne kontrole evidencija. Za svaku slabost predložene su mjere u dijelu 11.'),
    H2('10.4. Analiza na temelju saradnje s drugim tijelima'),
    P('Škola sarađuje s osnivačem i Ministarstvom obrazovanja, nauke, kulture i sporta USK, Pedagoškim zavodom USK, prosvjetnom inspekcijom, Gradom Cazinom, centrom za socijalni rad, zdravstvenim ustanovama, drugim školama te vladinim i nevladinim organizacijama u provođenju programa i projekata. U provođenju plana integriteta škola sarađuje s Uredom za borbu protiv korupcije USK (mišljenje, izvještavanje, edukacije) i Pedagoškim zavodom USK (edukacije o integritetu u obrazovanju).'),
  ];
}

function preporuke() {
  return [
    H1('11. Preporuke za unapređenje i mjere za unapređenje integriteta'),
    H2('11.1. Preporuke za unapređenje'),
    table([450, 1700, 3088, 1500, 1500, 1400], [['Rb.', 'Područje', 'Preporuka', 'Prioritet / rizici', 'Odgovorna osoba', 'Provjera'],
      ['1.', 'Odgovornost', 'Unaprijediti mehanizam odgovornosti i transparentnost u radu i odlučivanju: registar akata i odluka, pisano obrazloženje diskrecionih odluka.', 'Visoki – Z1.1', 'Direktor', 'Godišnji izvještaj do 31. marta'],
      ['2.', 'Obuke i edukacije', 'Sačiniti godišnji plan obuke s posebnim osvrtom na etiku i integritet; upoznati zaposlene s Planom integriteta i objaviti ga na web stranici škole.', 'Niski – Z7.1', 'Direktor; pedagog; psiholog', 'Godišnji izvještaj'],
      ['3.', 'Raspolaganje materijalno-finansijskim sredstvima', 'Praćenje i nadzor nad primjenom propisa i procedura: pravilo „četiri oka“, kvartalni izvještaji, popis blagajne.', 'Umjereni – Z2.1', 'Direktor; knjigovođa; sekretar-blagajnik', 'Kvartalno'],
      ['4.', 'Javne nabavke', 'Edukacija osoba koje provode postupke; objava plana nabavki i obavještenja o zaključenim ugovorima na web stranici i u zbornici; registar ugovora.', 'Visoki – Z3.1', 'Direktor; Komisija za javne nabavke; Školski odbor', 'Kvartalno'],
      ['5.', 'Interni propisi', 'Upoznati zaposlene sa svim internim propisima i procedurama i učiniti ih dostupnim na web stranici; donijeti obavezne akte (prijave, kodeks, sukob interesa, lični podaci).', 'Umjereni – Z10.1, Z8.1', 'Direktor; sekretar', 'Polugodišnje'],
      ['6.', 'Komunikacija', 'Unaprijediti otvorenu komunikaciju i odnose među zaposlenima kroz predavanja i radionice; redovno razmatrati teme integriteta na stručnim organima.', 'Umjereni – Z11.2', 'Direktor; psiholog; pedagog', 'Godišnji izvještaj']], { size: 17 }),
  ];
}

function mjereTabela() {
  const rows = [];
  OBLASTI.forEach((o) => {
    rows.push([{ t: `${o.id} – ${o.naziv}`, b: true, fill: C.band, span: 7 }]);
    Rx.filter((r) => r.o === o.id).forEach((r) => r.m.forEach((m, i) => rows.push([
      { t: [`${r.id} – ${r.naziv}`] }, { t: [`M-${r.id}.${i + 1}`, m.t] }, { t: r.prioritet, fill: FILL[r.nivo] }, { t: m.akt.map((a) => '- ' + a) }, { t: [m.nos, `Rok: ${m.rok}`] }, m.tr, m.ind])));
  });
  return [
    H2('11.2. Mjere za unapređenje integriteta', { pb: true }),
    P(`Predloženo je ${N.mj} mjera. Mjere koje proizilaze iz zakonskih obaveza (M-Z10.1.1, M-Z10.1.2, M-Z10.2.1, M-Z11.1.1) provode se odmah, nezavisno od prioriteta. Izvršilac mjere je osoba na navedenom radnom mjestu.`, { size: 19 }),
    table([1700, 3000, 1100, 3000, 2200, 1370, 2200], [['Rizik', 'Mjera za upravljanje rizikom, odnosno za unapređenje integriteta institucije', 'Prioritet mjere', 'Aktivnosti koje je neophodno poduzeti za realizaciju mjere', 'Izvršilac mjere i rok za provođenje aktivnosti', 'Procjena eventualnih troškova za realizaciju mjere', 'Očekivani rezultat (indikator)'], ...rows], { size: 16 }),
  ];
}

function kontrola() {
  return [
    H1('12. Kontrolni mehanizmi i praćenje provođenja plana'),
    table([450, 3800, 2600, 2788], [['Rb.', 'Element (zadatak, aktivnost) kontrolnog mehanizma', 'Odgovorna osoba', 'Rok / dinamika'],
      ['1.', 'Nadzor nad poštivanjem i primjenom zakonskih propisa od strane zaposlenih', 'Školski odbor, direktor, svi zaposleni', 'Kontinuirano; pregled polugodišnje'],
      ['2.', 'Stalna edukacija i upoznavanje s propisima te njihova primjena', 'Direktor i svi zaposleni', 'Prema godišnjem planu edukacija'],
      ['3.', 'Jačanje saradnje između organizacionih struktura škole', 'Direktor i svi zaposleni', 'Teme integriteta na Nastavničkom vijeću najmanje dva puta godišnje'],
      ['4.', 'Praćenje provođenja mjera i polugodišnji izvještaj direktoru', 'Osoba zadužena za nadzor (menadžer integriteta)', 'Do 31. januara i 31. jula'],
      ['5.', 'Godišnji izvještaj o provođenju plana Uredu (provedene mjere, neprovedene mjere i razlozi – čl. 49. i 50. Zakona)', 'Direktor; menadžer integriteta', 'Do 31. marta tekuće godine za prethodnu godinu'],
      ['6.', 'Razmatranje godišnjeg izvještaja na Školskom odboru', 'Direktor; predsjednik Školskog odbora', 'Do 31. marta'],
      ['7.', 'Procjena učinkovitosti plana (čl. 48. st. (2) Zakona)', 'Direktor; menadžer integriteta', 'Svake druge godine'],
      ['8.', 'Izmjena plana kod značajnih promjena radnih mjesta, procesa ili propisa (čl. 48. st. (1) Zakona)', 'Direktor', 'Po potrebi'],
      ['9.', 'Dostava usvojenog plana Uredu (čl. 43. st. (3)) i objava na web stranici (čl. 47.)', 'Direktor; sekretar', '15 dana od usvajanja'],
      ['10.', 'Interne kontrole prema Pravilniku o internim kontrolama i internim kontrolnim postupcima', 'Direktor; knjigovođa', 'Prema Pravilniku'],
      ['11.', 'Izrada novog plana po isteku važenja (četiri godine od usvajanja)', 'Direktor', 'Šest mjeseci prije isteka']], { size: 18 }),
  ];
}

function prijave() {
  return [
    H1('13. Postupak prijave korupcije i zaštita prijavitelja'),
    P('Postupak je usklađen s članovima 13–37. Zakona o prevenciji korupcije u USK, a detaljno se uređuje Pravilnikom o postupku internog prijavljivanja korupcije (član 22. Zakona).'),
    H2('13.1. Ovlašteno lice'),
    P(`Za prijem i postupanje po prijavama korupcije direktor rješenjem određuje ovlašteno lice (član 18. Zakona): ${B} (ime i prezime, radno mjesto), kontakt: 037/543-536; osstijena@hotmail.com. Ovlašteno lice ima VII stepen stručne spreme, završen pravni fakultet (240 ECTS ili ekvivalent) i najmanje tri godine radnog iskustva nakon sticanja visoke stručne spreme, odnosno, izuzetno, VII stepen druge vrste stručne spreme.`),
    H2('13.2. Načini podnošenja prijave'),
    ...['putem protokola škole;', 'putem pošte;', 'putem elektronske pošte (osstijena@hotmail.com);', 'putem sandučeta s natpisom „ZA PRIJAVU KORUPCIJE“, postavljenog na vidnom i dostupnom mjestu (član 19. Zakona);', 'usmeno, na zapisnik kod ovlaštenog lica.'].map((t) => bullet(t)),
    P('Eksterna prijava podnosi se Uredu za borbu protiv korupcije Unsko-sanskog kantona (Bihaćkih branilaca 2, 77000 Bihać; prijave korupcije: 037/305-507, prijavikorupciju@antikorupcijausk.ba; online prijava na web stranici Ureda). Interno prijavljivanje nije uslov za eksterno prijavljivanje (član 23. Zakona).'),
    H2('13.3. Sadržaj prijave'),
    P('Prijava sadrži podatke o prijavitelju, podatke o instituciji i opis radnje ili ponašanja s konkretnim činjenicama i okolnostima, a po mogućnosti i podatke o licu za koje se sumnja da je izvršilo korupciju i raspoložive dokaze (član 15. Zakona). Ovlašteno lice postupa i po anonimnim prijavama koje sadrže podatke o instituciji i opis radnje (član 20. stav (5) Zakona).'),
    H2('13.4. Postupanje po prijavi'),
    table([5200, 4438], [['Radnja', 'Rok i osnov'],
      ['Evidentiranje prijave i provjera propisanih elemenata', 'Po prijemu (čl. 20. st. (2))'],
      ['Poziv poznatom prijavitelju da dopuni nepotpunu prijavu', 'Dopuna u roku od sedam dana (čl. 20. st. (3))'],
      ['Postupanje po potpunoj prijavi', 'Bez odlaganja, najkasnije 30 dana od prijema (čl. 21. tač. a))'],
      ['Zaštita ličnih podataka i anonimnosti prijavitelja; mjere za sprečavanje štetne radnje; utvrđivanje disciplinske i materijalne odgovornosti', 'Tokom cijelog postupka (čl. 21. tač. b)–e))'],
      ['Obavještenje prijavitelja o poduzetim mjerama i aktivnostima', '30 dana od podnošenja prijave (čl. 21. tač. f))'],
      ['Dostava prijavitelju odluke o ishodu postupka', 'Osam dana od okončanja postupka (čl. 21. tač. g))'],
      ['Prosljeđivanje prijave inspekciji kod sumnje na prekršaj', 'Pet dana od prijema (čl. 21. tač. h))'],
      ['Prosljeđivanje prijave tužilaštvu kod sumnje na krivično djelo', 'Pet dana od prijema (čl. 21. tač. i))'],
      ['Obavještenje Ureda o ishodu postupka po prijavi', 'Osam dana od okončanja postupka (čl. 21. tač. j))']], { size: 18 }),
    H2('13.5. Zaštita prijavitelja'),
    P('Prijavitelj ne smije trpiti posljedice zbog prijave korupcije (član 30. Zakona). Zabranjeno je stavljanje prijavitelja u nepovoljniji položaj, uključujući mobing, uznemiravanje, prijetnje i neravnopravan položaj u ostvarivanju prava iz radnog odnosa ili obrazovanja (član 32.). Ako prijavitelj trpi ili može trpjeti štetne posljedice, škola odmah donosi privremenu mjeru zaštite kojom se obustavlja svaka disciplinska, kadrovska ili druga mjera prema prijavitelju do okončanja postupka provjere (član 30. stav (4)). Prijavitelj može tražiti internu zaštitu od direktora u roku od 30 dana od saznanja za štetnu radnju, a najkasnije u roku od godinu dana od njenog nastanka; direktor odlučuje u roku od 30 dana (član 36.). Prijavitelj može tražiti i sudsku zaštitu (član 37.) i status zaštićenog prijavitelja kod Ureda (član 31.). Zloupotreba prijavljivanja je zabranjena (član 33.).'),
  ];
}

function zavrsni() {
  return [
    H1('14. Završni akti'),
    P('Plan integriteta i Odluka o usvajanju i provođenju plana integriteta donose se u nacrtu, a konačno se donose nakon pribavljenog pozitivnog mišljenja Ureda za borbu protiv korupcije Unsko-sanskog kantona.', { size: 20 }),
    H2('14.1. Nacrt odluke o usvajanju i provođenju plana integriteta'),
    ...brDat(),
    P(`Na osnovu člana 43., 46., 47. i 49. ${ZAKON} i ${UPU}, a nakon pribavljenog mišljenja Ureda za borbu protiv korupcije Unsko-sanskog kantona broj ${B} od ${B}, direktor Javne ustanove Osnovna škola „Stijena“ donosi`),
    center('ODLUKU', { bold: true, before: 120, after: 0 }), center('o usvajanju i provođenju Plana integriteta JU OŠ „Stijena“', { bold: true }),
    art(1), P('Ovom odlukom usvaja se Plan integriteta Javne ustanove Osnovna škola „Stijena“ koji je pripremila radna grupa za izradu plana integriteta.'),
    art(2), P(`Stupanjem na snagu ove odluke razrješavaju se dužnosti menadžer/koordinator i članovi radne grupe za izradu plana integriteta (Odluka broj 610-93/2025 od 28.01.2025. godine i Odluka o izmjenama i dopunama broj ${B} od ${B}).`),
    art(3),
    P(`(1) Za osobu zaduženu za nadzor nad provođenjem plana integriteta imenuje se: ${B} (ime i prezime i funkcija).`),
    P('(2) Osoba zadužena za nadzor nad provođenjem plana integriteta ima zadatak da prati provođenje Plana integriteta, a posebno dijela koji se odnosi na mjere za poboljšanje integriteta institucije, te davanje prijedloga za njegovo unapređenje.'),
    P('(3) Svi zaposleni u JU OŠ „Stijena“ dužni su obavijestiti osobu zaduženu za nadzor nad provođenjem plana integriteta o situaciji, pojavi ili radnji koje na osnovu razumnog uvjerenja mogu dovesti do narušavanja integriteta institucije.'),
    P('(4) Zaposleni u instituciji treba da, na zahtjev osobe zadužene za nadzor nad provođenjem plana integriteta, dostave potrebne podatke i informacije od značaja za provođenje plana integriteta, a koje nisu u suprotnosti sa važećim propisima.'),
    P('(5) Institucija svake druge godine procjenjuje učinkovitost plana integriteta, u skladu sa Uputstvom za izradu i provođenje plana integriteta. Institucija je dužna godišnje dostaviti Uredu izvještaj o provođenju plana integriteta. Izvještaj će institucija dostaviti Uredu do 31. marta tekuće godine, za prethodnu godinu.'),
    art(4), P('Plan integriteta objavljuje se na web stranici škole i dostavlja Uredu za borbu protiv korupcije Unsko-sanskog kantona u roku od 15 dana od dana donošenja ove odluke. Plan važi četiri godine od dana usvajanja.'),
    art(5), P('Ova odluka stupa na snagu danom donošenja.'),
    ...potpis('DIREKTOR ŠKOLE', 'Mersad Vatić'),
    left('Dostavljeno: Uredu za borbu protiv korupcije Unsko-sanskog kantona; osobi zaduženoj za nadzor nad provođenjem Plana integriteta; članovima radne grupe; a/a.', { size: 19 }),
    H2('14.2. Nacrt rješenja o određivanju menadžera integriteta', { pb: true }),
    ...brDat(),
    P(`Na osnovu člana 44. tačka f) i člana 46. stav (1) ${ZAKON}, direktor Javne ustanove Osnovna škola „Stijena“ donosi`),
    center('RJEŠENJE', { bold: true, before: 120, after: 0 }), center('o određivanju menadžera integriteta', { bold: true }),
    P(`1. ${B} (ime i prezime, radno mjesto) određuje se za menadžera integriteta JU OŠ „Stijena“ – osobu odgovornu za praćenje i nadzor nad provođenjem Plana integriteta.`),
    P('2. Menadžer integriteta prati provođenje mjera iz Plana integriteta, vodi evidenciju o njihovom provođenju, podnosi polugodišnji izvještaj direktoru, priprema godišnji izvještaj Uredu za borbu protiv korupcije USK i daje prijedloge za izmjenu plana.'),
    P('3. Direktor i svi zaposleni dužni su menadžeru integriteta, na njegov zahtjev, dostaviti potrebne podatke i informacije od značaja za provođenje plana integriteta (član 46. stav (2) Zakona).'),
    P('4. Rješenje stupa na snagu danom donošenja Odluke o usvajanju i provođenju plana integriteta.'),
    ...potpis('DIREKTOR ŠKOLE', 'Mersad Vatić'),
    H2('14.3. Nacrt rješenja o određivanju ovlaštenog lica za prijem prijava korupcije', { pb: true }),
    ...brDat(),
    P(`Na osnovu člana 18. ${ZAKON}, direktor Javne ustanove Osnovna škola „Stijena“ donosi`),
    center('RJEŠENJE', { bold: true, before: 120, after: 0 }), center('o određivanju ovlaštenog lica za prijem prijava korupcije i postupanje po prijavama', { bold: true }),
    P(`1. ${B} (ime i prezime, stručna sprema, radno mjesto), koji/a ispunjava uslove iz člana 18. Zakona, određuje se za ovlašteno lice za prijem prijava korupcije i postupanje po prijavama u JU OŠ „Stijena“.`),
    P(`2. U slučaju odsutnosti ili sukoba interesa ovlaštenog lica, poslove obavlja ${B} (ime i prezime, radno mjesto).`),
    P('3. Ovlašteno lice postupa po prijavama u skladu s članovima 20. i 21. Zakona i Pravilnikom o postupku internog prijavljivanja korupcije, vodi povjerljivu evidenciju prijava i štiti identitet prijavitelja.'),
    P('4. Rješenje stupa na snagu danom donošenja.'),
    ...potpis('DIREKTOR ŠKOLE', 'Mersad Vatić'),
  ];
}

function prilog1() {
  const vis = Rx.filter((r) => r.nivo === 'Visok'); const sre = Rx.filter((r) => r.nivo === 'Srednji');
  return [
    H1('Prilog 1 – Konačni izvještaj radne grupe o stanju integriteta u instituciji'),
    ...brDat(),
    left('Direktoru JU OŠ „Stijena“', { bold: true }),
    P('**Uvodni dio.** Radna grupa za izradu Plana integriteta JU OŠ „Stijena“ izradila je plan integriteta u skladu sa Zakonom o prevenciji korupcije u Unsko-sanskom kantonu i Uputstvom za izradu i provođenje Plana integriteta u institucijama u Unsko-sanskom kantonu. Radna grupa je analizirala zakonske, podzakonske i interne akte, opise radnih mjesta i rezultate anonimne ankete zaposlenih, te održala sastanke o kojima su vođeni zapisnici.'),
    P('**Početna procjena** (dio 8.1) pokazuje da se poslovni procesi u pravilu obavljaju u skladu s propisima i da zaposleni imaju povjerenje u zakonitost rada škole, uz slabosti u sistemu prijavljivanja, upravljanju sukobom interesa, dostupnosti internih akata i etičkoj komunikaciji.'),
    P('**Rezultati ankete** (dio 10.1 i Prilog 2): 64,86% zaposlenih nije upoznato s načinom anonimne prijave kršenja integriteta; 44% ne zna gdje su dostupni interni akti; 13,51% je bilo suočeno sa situacijom u kojoj bi profesionalna odluka mogla imati posljedice po privatni život; 78,38% smatra potrebnim imenovati lice za praćenje sukoba interesa.'),
    P(`**Evidencija rizika** (dio 9.2): identifikovano je ${N.uk} rizika u 11 zajedničkih i 7 specifičnih oblasti, od čega ${N.vis} visokog, ${N.sre} umjerenog i ${N.niz} niskog intenziteta. Svaki rizik prikazan je u posebnom analitičkom obrascu (dio 9.4). Predloženo je ${N.mj} mjera s izvršiocima, rokovima i procjenom troškova (dio 11.2).`),
    P('**Rizici visokog intenziteta:**', { keepNext: true, after: 40 }), ...vis.map((r) => bullet(`${r.id} – ${r.naziv} (I = ${r.x})`)),
    P('**Rizici umjerenog intenziteta s posljedicama vrlo značajnim po instituciju:**', { keepNext: true, after: 40, before: 80 }), ...sre.filter((r) => r.p === 3).map((r) => bullet(`${r.id} – ${r.naziv} (I = ${r.x})`)),
    P('**Zaključak i prijedlog.** Radna grupa predlaže direktoru da nacrt plana integriteta dostavi Uredu za borbu protiv korupcije Unsko-sanskog kantona radi davanja mišljenja i da, nakon pozitivnog mišljenja, donese Odluku o usvajanju i provođenju plana integriteta. Mjere koje proizilaze iz zakonskih obaveza (pravilnik o internom prijavljivanju, ovlašteno lice, zaštita prijavitelja) potrebno je provesti odmah. Plan treba dosljedno provoditi u svim aktivnostima škole, uz stručno, savjesno, nepristrasno i blagovremeno obavljanje poslova svih zaposlenih.', { before: 80 }),
    spacer(6),
    table([600, 3400, 2600, 3038], [['Rb.', 'Ime i prezime', 'Uloga', 'Potpis'], ...CLAN.map((c, i) => [`${i + 1}.`, c[0], c[2], ''])], { size: 19, cantSplit: true }),
  ];
}

function prilog2() {
  // Doslovni prijenos upitnika i rezultata iz izvornog plana (ver 2)
  const Q = require('./anketa_tekst.json');
  const out = [H1('Prilog 2 – Upitnik za samoprocjenu integriteta i rezultati ankete'), H2('P2.1. Upitnik za samoprocjenu integriteta'),
    P('NAPOMENA: Uposleni institucije upitnik za samoprocjenu integriteta ispunjavaju anonimno. Prilikom popunjavanja upitnika neophodno je označiti jedan odgovor na svako pitanje. Upitnik je sastavljen sa ciljem pružanja pomoći radnoj grupi za izradu plana integriteta.', { italics: true })];
  Q.upitnik.forEach((q) => {
    if (q.length === 1) { out.push(center(q[0], { bold: true, before: 200, after: 100, keepNext: true })); return; }
    const isNote = q[0].startsWith('@');
    out.push(P(isNote ? q[0].slice(1) : q[0], { bold: !isNote, keepNext: true, after: 40, before: 100, align: AT.LEFT }));
    q[1].forEach((o, i) => out.push(left(o, { after: 20, indent: { left: 567 }, keepNext: i < q[1].length - 1 })));
  });
  out.push(H2('P2.2. Rezultati ankete', { pb: true }));
  Q.rezultati.forEach((t) => out.push(t.startsWith('@') ? P(t.slice(1), { bold: true, before: 120, after: 40, keepNext: true }) : /^[A-F] [-–]/.test(t) ? left(t, { indent: { left: 400 }, after: 20 }) : P(t)));
  return out;
}

const hf = L.headerFooter('JU OŠ „Stijena“ – Plan integriteta (nacrt)');
const emptyF = { headers: { first: new d.Header({ children: [new d.Paragraph('')] }) }, footers: { first: new d.Footer({ children: [new d.Paragraph('')] }) } };
const sec = (props, children, first = false) => ({ properties: { ...props, ...(first ? { titlePage: true } : {}) }, headers: { ...hf.headers, ...(first ? emptyF.headers : {}) }, footers: { ...hf.footers, ...(first ? emptyF.footers : {}) }, children });
const doc = new d.Document({
  creator: 'JU OŠ „Stijena“', title: 'Plan integriteta JU OŠ „Stijena“ – nacrt', styles: L.STYLES, numbering: L.NUMBERING, features: { updateFields: true },
  sections: [
    sec(L.portrait, [...naslovna(), new d.Paragraph({ pageBreakBefore: true, children: [] }), ...L.toc('Sadržaj'), ...osnovne(), ...uvod(), ...odluke(), ...obavjestenje(), ...program(), ...okvir(), ...organizacija(), ...izvjestaj(), ...metodologija()], true),
    sec(L.landscape, [...registar(), ...obrasci()]),
    sec(L.portrait, [...statusQuo(), ...preporuke()]),
    sec(L.landscape, [...mjereTabela()]),
    sec(L.portrait, [...kontrola(), ...prijave(), ...zavrsni(), ...prilog1(), ...prilog2()]),
  ],
});
d.Packer.toBuffer(doc).then((b) => { fs.writeFileSync(OUT, b); console.log('OK', OUT, b.length, N); });
