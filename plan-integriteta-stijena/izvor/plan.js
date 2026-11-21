// Izrada revidiranog nacrta Plana integriteta JU OŠ „Stijena“ (DOCX).
const fs = require('fs');
const path = require('path');
const L = require('./lib');
const { d, C, P, center, right, left, bullet, H1, H2, H3, spacer, table, kv, note, image, signature, W_PORTRAIT: WP, W_LANDSCAPE: WL, AlignmentType: AT } = L;
const { OBLASTI, R, intenzitet } = require('./rizici');
const SRC = JSON.parse(fs.readFileSync(path.join(__dirname, 'izvorni_podaci.json'), 'utf8'));
const OUT = process.argv[2] || path.join(__dirname, '..', 'Plan_integriteta_JU_OS_Stijena_revidirani_nacrt_2026.docx');

const ZAKON = 'Zakon o prevenciji korupcije u Unsko-sanskom kantonu („Službeni glasnik Unsko-sanskog kantona“, broj 24/25)';
const UPUTSTVO = 'Uputstvo za izradu i provođenje Plana integriteta u institucijama u Unsko-sanskom kantonu (Vlada Unsko-sanskog kantona, 16. sjednica, 17. 3. 2026.)';
const VL = { 1: '1 – mala', 2: '2 – umjerena', 3: '3 – velika' };
const PL = { 1: '1 – neznatne', 2: '2 – značajne', 3: '3 – vrlo značajne' };
const FILL = { Nizak: C.lo, Srednji: C.mid, Visok: C.hi };
const oblast = (id) => OBLASTI.find((o) => o.id === id);
const Rx = R.map((r) => ({ ...r, ...intenzitet(r.v, r.p) }));
const cnt = (f) => Rx.filter(f).length;
const N = { uk: Rx.length, vis: cnt((r) => r.nivo === 'Visok'), sre: cnt((r) => r.nivo === 'Srednji'), niz: cnt((r) => r.nivo === 'Nizak'),
  z: cnt((r) => r.o.startsWith('Z')), s: cnt((r) => r.o.startsWith('S')), mj: Rx.reduce((a, r) => a + r.m.length, 0) };

const CLAN = [
  ['Sabina Žunić', 'pedagog', 'Menadžer/koordinator radne grupe', 'Koordinacija; Faze I–IV; oblasti S1, S2, S4, S6', 'Odluka 610-93/2025 (zadržava se)'],
  ['Edin Pehlić', 'nastavnik', 'Član', 'Oblasti S1, S3, S7 (nastavni proces)', 'Odluka 610-93/2025 (zadržava se)'],
  ['Dženita Hepić', 'knjigovođa', 'Član', 'Oblasti Z2, Z3, Z9 (finansije, nabavke, donacije)', 'Odluka 610-93/2025 (zadržava se)'],
  ['Elvira Vatić', 'nastavnik', 'Član', 'Oblasti Z5 (raspodjela zaduženja), S4, S7', 'Odluka 610-93/2025 (zadržava se)'],
  ['Dževaira Džehverović', 'socijalni radnik', 'Član', 'Oblasti S2, S5, Z11; prijedlog za praćenje provođenja', 'Odluka 610-93/2025 (zadržava se)'],
  ['Semira Džakulić [POTVRDITI pisanje prezimena]', 'sekretar škole', 'Član', 'Oblasti Z1, Z4, Z5, Z6, Z10 (pravni okvir, dokumentacija, prijave)', 'Odluka 610-93/2025 (zadržava se)'],
  ['Kenan Vukalić', 'psiholog', 'Član – PRIJEDLOG', 'Oblasti Z7, Z8, S5; stručna interpretacija postojećih rezultata ankete (bez izmjene izvornih podataka)', 'Nacrt Odluke o izmjenama i dopunama (dio 3.2) – nije doneseno'],
];

// ─────────────────────────── NASLOVNA
function naslovna() {
  return [
    new d.Paragraph({ alignment: AT.CENTER, children: [image('slike/memorandum.png', 600, 169)], spacing: { after: 300 } }),
    center('JAVNA USTANOVA OSNOVNA ŠKOLA „STIJENA“', { bold: true, size: 30, color: C.navy, after: 60 }),
    center('Stijena bb, 77224 Cazin', { size: 20, color: C.grey, after: 600 }),
    center('PLAN INTEGRITETA', { bold: true, size: 56, color: C.navy, after: 160 }),
    center('Revidirani nacrt usklađen sa Zakonom o prevenciji korupcije u Unsko-sanskom kantonu i Uputstvom za izradu i provođenje Plana integriteta u institucijama u Unsko-sanskom kantonu (2026)', { size: 22, color: C.blue, after: 400 }),
    new d.Paragraph({ alignment: AT.CENTER, children: [image('slike/skola.jpg', 460, 227)], spacing: { after: 400 } }),
    note('STATUS DOKUMENTA', [
      'Ovo je radni nacrt za razmatranje na radnoj grupi. Dokument nije usvojen i nije dobio mišljenje Ureda za borbu protiv korupcije Unsko-sanskog kantona.',
      'Plan se usvaja Odlukom direktora tek nakon pribavljenog pozitivnog mišljenja Ureda (Faza IV Uputstva).',
      'Oznake [POTVRDITI] i [DOPUNITI] označavaju podatke koje škola mora službeno potvrditi ili dostaviti. Ocjene rizika su radne ocjene koje potvrđuje radna grupa.',
    ], { fill: C.light, border: C.blue, tcolor: C.navy }),
    spacer(20),
    center('Cazin, novembar 2026. godine', { bold: true, size: 22 }),
  ];
}

// ─────────────────────────── 1. OSNOVNE INFORMACIJE
function osnovne() {
  return [
    H1('1. Osnovne informacije o instituciji i odgovornim osobama za izradu i provođenje plana integriteta', { pb: true }),
    P('Obrazac prema Prilogu Uputstva („Osnovne informacije o instituciji i odgovornim osobama za izradu plana integriteta“).', { italics: true, size: 19, color: C.grey }),
    kv([
      ['Naziv institucije', 'Javna ustanova Osnovna škola „Stijena“'],
      ['Adresa', 'Stijena bb, 77224 Cazin'],
      ['E-mail institucije', 'osstijena@hotmail.com'],
      ['Broj telefona institucije', '037/543-536'],
      ['Web stranica', 'https://os-stijena.edu.ba'],
      ['Ime i prezime rukovodioca institucije', 'Mersad Vatić, direktor'],
    ]),
    spacer(6),
    P('**Imena i prezimena koordinatora i članova radne grupe za izradu plana integriteta** (sastav prema važećoj Odluci broj 610-93/2025 i prijedlogu dopune iz dijela 3.2):', { keepNext: true }),
    table([500, 3100, 1800, 4238], [
      ['Rb.', 'Ime i prezime', 'Funkcija u školi', 'Uloga u radnoj grupi'],
      ...CLAN.map((c, i) => [`${i + 1}.`, c[0], c[1], c[2]]),
    ], { size: 19 }),
    spacer(6),
    kv([
      ['Datum usvajanja plana integriteta', 'Upisuje se nakon pribavljenog pozitivnog mišljenja Ureda za borbu protiv korupcije USK i donošenja Odluke o usvajanju i provođenju plana integriteta. (Datum „28.01.2025.“ iz izvorne verzije odnosi se na Odluku o izradi, a ne na usvajanje.)'],
      ['Ime i prezime osobe zadužene za nadzor nad praćenjem provođenja plana integriteta', 'Imenuje se Odlukom o usvajanju i provođenju plana integriteta. Prijedlog iz izvorne verzije: Dževaira Džehverović, socijalni radnik [POTVRDITI odlukom direktora].'],
      ['Broj telefona osobe zadužene za nadzor', '062/192-401 (prema izvornoj verziji) [POTVRDITI]'],
    ]),
  ];
}

// ─────────────────────────── 2. UVOD
function uvod() {
  return [
    H1('2. Uvod'),
    P('Javna ustanova Osnovna škola „Stijena“ je ustanova za osnovni odgoj i obrazovanje učenika. Prva četverogodišnja osnovna škola u Stijeni otvorena je 1929. godine. Osnivač škole je Skupština Unsko-sanskog kantona. JU OŠ „Stijena“ upisana je u sudski registar kod Kantonalnog suda u Bihaću, rješenjem broj U/I-5/99 od 18.01.1999. godine, kojim je utvrđen i naziv škole.'),
    P('JU OŠ „Stijena“ ispunjava uslove za odgoj i obrazovanje redovnih učenika prema važećem nastavnom planu i programu za osnovnu školu. Osnovni odgoj i obrazovanje značajan je faktor razvoja mlade ličnosti, a time posredno i neposredno i općeg napretka društva. Koncept rada škole zasniva se na zakonskim i podzakonskim propisima, Pedagoškim standardima i normativima, naučnim saznanjima i pedagoškom iskustvu, a usmjeren je na:'),
    ...['uspješnu realizaciju ciljeva i zadataka nastavnog plana i programa osnovne škole;', 'podizanje kvaliteta i efikasnosti odgojno-obrazovnog rada;', 'jačanje odgojne, društvene i kulturne uloge škole;', 'racionalizaciju nastave i bolju organizaciju rada škole;', 'inoviranje odgojno-obrazovnog procesa u skladu sa tehnološkim razvojem;', 'uvođenje savremenih oblika, metoda i tehnologija rada;', 'stvaranje povoljnih uslova za stručno usavršavanje nastavnika i stručnih saradnika;', 'jačanje stručne i pedagoške službe i primjenu naučnih rezultata u školskoj praksi;', 'podsticanje darovitih učenika i podršku učenicima s poteškoćama u razvoju;', 'kvalitetan, efikasan i odgovoran rad škole.'].map((t) => bullet(t)),
    H2('2.1. Pravni osnov i svrha plana integriteta'),
    P(`Obaveza donošenja plana integriteta za javne ustanove čiji je osnivač Unsko-sanski kanton propisana je članom 43. ${ZAKON}. Plan se donosi u skladu sa Uputstvom koje na prijedlog Ureda za borbu protiv korupcije Unsko-sanskog kantona (u daljem tekstu: Ured) donosi Vlada Unsko-sanskog kantona (član 43. stav (5) Zakona), u skladu s metodologijom Agencije za prevenciju korupcije i koordinaciju borbe protiv korupcije BiH. Na snazi je ${UPUTSTVO}. Plan doprinosi i realizaciji Strategije za borbu protiv korupcije Unsko-sanskog kantona 2023.–2027. („Službeni glasnik Unsko-sanskog kantona“, broj 26/23), prioritet 1.2. i mjera 1.2.1.`),
    P('Plan integriteta je interni dokument koji sadrži detaljnu procjenu podložnosti radnih mjesta, radnih procesa i poslova nastanku i razvoju korupcije i drugih oblika pristrasnog postupanja, te skup konkretnih mjera kojima se preveniraju i otklanjaju mogućnosti za nastanak i razvoj korupcije i obezbjeđuje povjerenje građana u rad institucije (član 43. stav (1) Zakona). Plan je preventivni mehanizam: objektivna samoprocjena rizika ne znači priznanje postojanja korupcije ili nepravilnosti u školi, nego prepoznavanje slabosti koje bi mogle dovesti do njih.'),
    P('Cilj Plana integriteta JU OŠ „Stijena“ je održavanje i jačanje integriteta, transparentnosti i profesionalne etike, te utvrđivanje, smanjivanje, uklanjanje i sprečavanje mogućnosti za nastanak nepravilnosti u radu, etički i profesionalno neprihvatljivih postupaka i korupcije.'),
    H2('2.2. Hronologija postupka i odnos prema ranijoj verziji'),
    P('Postupak izrade plana pokrenut je početkom 2025. godine, prije donošenja Zakona o prevenciji korupcije u USK i važećeg Uputstva. Ranija verzija (označena kao „ver 2“) izrađena je prema smjernicama i modelu Agencije za prevenciju korupcije i koordinaciju borbe protiv korupcije BiH. Ovaj nacrt zadržava osnovni kostur te verzije i usklađuje ga s novim propisima. Izvorni potpisani akti se ne mijenjaju; potrebne izmjene predložene su kao nacrti novih akata.', { keepNext: true }),
    table([1700, 3300, 4638], [
      ['Datum', 'Akt / događaj', 'Napomena'],
      ['18.01.1999.', 'Rješenje Kantonalnog suda u Bihaću U/I-5/99', 'Upis škole u sudski registar'],
      ['27.09.2024.', 'Pravilnik o radu, broj 610-1133/24', 'Unutrašnja organizacija škole'],
      ['28.01.2025.', 'Odluka o izradi plana integriteta, broj 610-93/2025', 'Imenovan koordinator i pet članova radne grupe'],
      ['28.01.2025.', 'Obavijest zaposlenima, broj 610-94/2025', 'Objavljena na oglasnoj tabli'],
      ['30.01.2025. [POTVRDITI]', 'Program rada izrade plana, broj 610-95/2025', 'Uz potpis je naveden datum „Stijena, 31.03.2026.“ – neusklađeno'],
      ['do 14.02.2025. (planirano)', 'Anonimna anketa zaposlenih', 'Stvarni period provođenja [POTVRDITI]; rezultati u Prilogu 2'],
      ['[POTVRDITI]', 'Dostava ranije verzije Agenciji radi mišljenja', 'Prema dopisu 610-278/2026, plan je vraćen na izmjenu i doradu; akt s primjedbama [DOPUNITI]'],
      ['29.10.2025.', 'Objavljen Zakon o prevenciji korupcije u USK (Sl. glasnik USK 24/25)', 'Stupa na snagu osmog dana od objave; primjenjuje se od 1. 1. 2026. (član 60.)'],
      ['30.01.2026.', 'Ispravka Zakona (Sl. glasnik USK 3/26)', 'Sadržaj ispravke [POTVRDITI]'],
      ['17.03.2026.', 'Vlada USK donijela Uputstvo za izradu i provođenje Plana integriteta', 'Objavljeno na web stranici Ureda; u Sl. glasniku USK broj 11/2026 [POTVRDITI broj i datum]'],
      ['31.03.2026.', 'Konačni izvještaj radne grupe 610-277/2026 i dopis 610-278/2026 (zahtjev za mišljenje)', 'Adresat i ishod zahtjeva [POTVRDITI]'],
      ['novembar 2026.', 'Revidirani nacrt (ovaj dokument)', 'Usklađivanje sa Zakonom i Uputstvom; prijedlog dopune radne grupe'],
    ], { size: 18 }),
    spacer(6),
    note('Rokovi iz Zakona', [
      '- Član 43. stav (2) Zakona: institucije donose planove integriteta u roku od 90 dana od stupanja Zakona na snagu. Prema obračunu radne grupe taj je rok istekao početkom februara 2026. godine [POTVRDITI pravno tumačenje], zbog čega je potrebno postupak okončati bez odlaganja.',
      '- Član 43. stav (6) Zakona izuzima samo institucije koje su plan donijele do početka primjene Zakona. JU OŠ „Stijena“ plan nije usvojila, pa obaveza u cijelosti važi.',
      '- Član 22. Zakona: pravilnik o internom prijavljivanju korupcije donosi se u roku od 30 dana od stupanja Zakona na snagu [POTVRDITI da li je donesen].',
    ]),
  ];
}

// ─────────────────────────── 3. ODLUKE I RJEŠENJA
function odluke() {
  return [
    H1('3. Odluke i rješenja'),
    H2('3.1. Odluka o izradi plana integriteta (izvorni akt – prijepis)'),
    P('Prijepis izvornog akta. Tekst se ne mijenja; uočene neusklađenosti navedene su u napomeni ispod akta.', { italics: true, size: 19, color: C.grey }),
    left('Broj: 610-93/2025', { after: 0 }), left('Datum: 28.01.2025. godine'),
    P('Na osnovu Strategije za borbu protiv korupcije 2015.-2019. godine, a u vezi sa realizacijom specifičnih mjera predviđenih Akcionim planom za provođenje Strategije za borbu protiv korupcije, direktor JU OŠ „STIJENA“ donosi:'),
    center('ODLUKU O IZRADI PLANA INTEGRITETA', { bold: true, before: 120 }),
    center('Član 1.', { bold: true, after: 60 }),
    P('Ovom Odlukom se izražava opredijeljenost institucije za izradu plana integriteta JU OŠ „Stijena“, te se formira radna grupa koja će sačiniti prijedlog plana integriteta.'),
    center('Član 2.', { bold: true, after: 60 }),
    P('Za koordinatora radne grupe zadužene za izradu plana integriteta u JU OŠ „Stijena, imenuje se Sabina Žunić, pedagog škole.'),
    P('Za članove radne grupe zadužene za izradu plana integriteta u JU OŠ „Stijena“, imenuju se:', { after: 40 }),
    ...['1. Edin Pehlić,nastavnik', '2. Dženita Hepić,knjigovođa škole', '3. Elvira Vatić,nastavnik', '4. Dževaira Džehverović,soc.radnik škole', '5. Semira Džakilić,sekretar škole'].map((t) => left(t, { after: 20, indent: { left: 400 } })),
    center('Član 3.', { bold: true, before: 120, after: 60 }),
    P('Radna grupa za izradu plana integriteta dužna je da u roku od 30 dana od dana imenovanja, dostavi direktoru JU OŠ „Stijena“, program rada za izradu plana integriteta.'),
    P('Radna grupa za izradu plana integriteta je dužna da sačini prijedlog plana integriteta i dostavi ga rukovodiocu institucije u roku od 3 mjeseca od dana donošenja ove odluke.'),
    P('Mandat koordinatora i članova radne grupe za izradu plana integriteta traje do donošenja Odluke/ Rješenja o usvajanju i provođenju plana integriteta.'),
    center('Član 4.', { bold: true, after: 60 }),
    P('Svi uposleni u JU OŠ „Stijena“, dužni su da pruže radnoj grupi za izradu plana integriteta svu pomoć i informacije potrebne u procesu izrade plana integriteta.'),
    center('Član 5.', { bold: true, after: 60 }),
    P('Ova odluka stupa na snagu danom donošenja.'),
    right('DIREKTOR ŠKOLE:', { bold: true, after: 0 }), right('/Vatić Mersad /'),
    left('Dostavljeno: 1. Koordinatoru radne grupe; 2. Članovima radne grupe; 3. Agenciji za prevenciju korupcije i koordinaciju borbe protiv korupcije; 4. Timu Ureda za borbu protiv korupcije Vlade USK-a; 5. a/a', { size: 19 }),
    note('Napomena radne grupe uz izvorni akt (ne mijenja akt)', [
      '- Pravni osnov (Strategija 2015.–2019.) nije usklađen s važećim propisima: od 2026. osnov je član 43. Zakona o prevenciji korupcije u USK i Uputstvo iz 2026. godine.',
      '- Prezime sekretara škole u aktima se navodi različito („Džakilić“, „Džakulić“, „Džaklić“), a u Obavijesti je naveden „Edina Pehlić“ umjesto „Edin Pehlić“ [POTVRDITI ispravno pisanje].',
      '- Usklađivanje i dopuna sastava radne grupe predlažu se Odlukom o izmjenama i dopunama (dio 3.2), bez retroaktivne izmjene izvornog akta.',
    ]),
    H2('3.2. NACRT – Odluka o izmjenama i dopunama Odluke o izradi plana integriteta', { pb: true }),
    note(null, ['[NACRT] Akt nije donesen. Broj, datum i potpis upisuje direktor škole. Tekst je usklađen s modelom odluke iz Uputstva.'], { fill: C.light, border: C.blue }),
    spacer(4),
    left('Broj: ______________', { after: 0 }), left('Datum: ______________'),
    P(`Na osnovu člana 43. st. (2) i (5) i člana 46. stav (1) ${ZAKON}, ${UPUTSTVO.replace('Uputstvo', 'Uputstva')} i Strategije za borbu protiv korupcije Unsko-sanskog kantona 2023.–2027. („Službeni glasnik Unsko-sanskog kantona“, broj 26/23), a u vezi sa realizacijom mjera i aktivnosti predviđenih Akcionim planom za njeno provođenje, direktor Javne ustanove Osnovna škola „Stijena“ donosi`),
    center('ODLUKU', { bold: true, before: 120, after: 0 }),
    center('o izmjenama i dopunama Odluke o izradi Plana integriteta', { bold: true }),
    center('Član 1.', { bold: true, after: 60 }),
    P('U Odluci o izradi Plana integriteta JU OŠ „Stijena“ broj 610-93/2025 od 28.01.2025. godine (u daljem tekstu: Odluka) postupak izrade plana integriteta nastavlja se u skladu sa Zakonom o prevenciji korupcije u Unsko-sanskom kantonu i Uputstvom za izradu i provođenje Plana integriteta u institucijama u Unsko-sanskom kantonu.'),
    center('Član 2.', { bold: true, after: 60 }),
    P('Član 2. Odluke mijenja se i glasi:'),
    P('„Za menadžera/koordinatora radne grupe zadužene za izradu plana integriteta u JU OŠ „Stijena“ imenuje se Sabina Žunić, pedagog škole.', { indent: { left: 400 } }),
    P('Za članove radne grupe zadužene za izradu plana integriteta u JU OŠ „Stijena“ imenuju se:', { indent: { left: 400 }, after: 40 }),
    ...CLAN.slice(1).map((c, i) => left(`${i + 1}. ${c[0].replace(' [POTVRDITI pisanje prezimena]', '')}, ${c[1]}, član`, { after: 20, indent: { left: 800 } })),
    P('“', { indent: { left: 400 } }),
    center('Član 3.', { bold: true, after: 60 }),
    P('Član 3. stav 1. i 2. Odluke mijenjaju se i glase: „Radna grupa dužna je da u roku od 15 dana od dana donošenja Odluke o izmjenama i dopunama dostavi direktoru revidirani program rada za izradu plana integriteta. Radna grupa dužna je da sačini revidirani prijedlog plana integriteta i dostavi ga direktoru u roku od 60 dana od dana donošenja Odluke o izmjenama i dopunama.“'),
    center('Član 4.', { bold: true, after: 60 }),
    P('Radna grupa u izradi revidiranog plana koristi rezultate anonimne ankete zaposlenih provedene u postupku izrade plana integriteta 2025. godine, bez izmjene izvornih podataka.'),
    center('Član 5.', { bold: true, after: 60 }),
    P('Ostale odredbe Odluke ostaju nepromijenjene.'),
    center('Član 6.', { bold: true, after: 60 }),
    P('Ova odluka stupa na snagu danom donošenja.'),
    center('Obrazloženje', { bold: true, before: 120, after: 60 }),
    P('Postupak izrade plana integriteta pokrenut je Odlukom broj 610-93/2025, prije stupanja na snagu Zakona o prevenciji korupcije u Unsko-sanskom kantonu i donošenja Uputstva. Usklađivanje je neophodno radi pribavljanja mišljenja Ureda i usvajanja plana. Uputstvo navodi da radna grupa najčešće broji od tri do pet članova, ali po potrebi može imati i veći broj članova, u zavisnosti od veličine institucije i broja uposlenih; model obrasca „Osnovne informacije“ predviđa do sedam članova. S obzirom na veličinu škole (67,52 priznatih izvršilaca za školsku 2024/2025. godinu) i potrebu da u radnoj grupi bude zastupljena kompletna stručna služba, radna grupa se dopunjuje psihologom škole, čime ukupno broji sedam osoba.'),
    ...signature('DIREKTOR ŠKOLE', 'Mersad Vatić'),
    left('Dostavljeno: menadžeru/koordinatoru radne grupe; članovima radne grupe (6x); Uredu za borbu protiv korupcije Unsko-sanskog kantona; oglasna tabla; a/a.', { size: 19 }),
    H2('3.3. Sastav radne grupe i podjela zaduženja (prijedlog)', { pb: true }),
    P('Sastav radne grupe zadržava sve postojeće članove imenovane Odlukom broj 610-93/2025 i dopunjuje se psihologom škole. Zaduženja po oblastima su prijedlog radnoj grupi i unose se u revidirani program rada.'),
    table([400, 2300, 1300, 1700, 2238, 1700], [
      ['Rb.', 'Ime i prezime', 'Funkcija', 'Uloga', 'Predložene oblasti', 'Osnov imenovanja'],
      ...CLAN.map((c, i) => [`${i + 1}.`, c[0], c[1], c[2], c[3], c[4]]),
    ], { size: 18 }),
    spacer(6),
    note('Pravni okvir za sastav od sedam članova', [
      '- Uputstvo ne propisuje najveći broj članova: „Radna grupa najčešće broji od tri do pet članova, ali po potrebi može imati i veći broj članova, u zavisnosti od veličine institucije i broja uposlenih. Članove radne grupe potrebno je odabrati među predstavnicima ključnih organizacionih oblasti i funkcija institucije.“',
      '- Imenovanje novog člana vrši direktor Odlukom o izmjenama i dopunama Odluke o izradi (dio 3.2); imenovanje nije izvršeno dok direktor ne potpiše akt.',
      '- Preporučuje se da svi članovi radne grupe potpišu izjavu o nepostojanju sukoba interesa u odnosu na procese čiji se rizici ocjenjuju; član se izuzima iz ocjene rizika u kojima ima lični interes.',
    ]),
  ];
}

// ─────────────────────────── 4. OBAVJEŠTENJE
function obavjestenje() {
  return [
    H1('4. Obavještenje zaposlenima'),
    H2('4.1. Obavijest o izradi plana integriteta (izvorni akt – prijepis)'),
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
    note('Napomena uz izvorni akt', ['- Obavijest se poziva na pravila Agencije za prevenciju korupcije BiH; od 2026. primjenjuje se Uputstvo Vlade USK. Zaposleni se o nastavku postupka obavještavaju novom obavijesti (dio 4.2).']),
    H2('4.2. NACRT – Obavijest zaposlenima o nastavku i usklađivanju izrade plana integriteta', { pb: true }),
    note(null, ['[NACRT] Obavijest se upućuje nakon donošenja Odluke o izmjenama i dopunama (dio 3.2). Tekst prati model obavijesti iz Uputstva.'], { fill: C.light, border: C.blue }),
    spacer(4),
    left('Broj: ______________', { after: 0 }), left('Datum: ______________'),
    P('PREDMET: Obavijest zaposlenima o preduzimanju aktivnosti usmjerenih na izradu plana integriteta JU OŠ „Stijena“, dostavlja se'),
    P('Poštovane kolegice i kolege,'),
    P('Vlada Unsko-sanskog kantona je, na prijedlog Ureda za borbu protiv korupcije Unsko-sanskog kantona, donijela Uputstvo za izradu i provođenje Plana integriteta u institucijama u Unsko-sanskom kantonu, a Zakonom o prevenciji korupcije u Unsko-sanskom kantonu propisana je obaveza svih javnih ustanova da donesu i provode plan integriteta. U skladu s tim propisima naša škola nastavlja i usklađuje izradu plana integriteta započetu 2025. godine.'),
    P('Informišem vas da sam dana ____________ donio Odluku o izmjenama i dopunama Odluke o izradi plana integriteta (broj ____________). Za menadžera/koordinatora radne grupe imenovana je Sabina Žunić, pedagog, a za članove radne grupe: Edin Pehlić, Dženita Hepić, Elvira Vatić, Dževaira Džehverović, Semira Džakulić i Kenan Vukalić.'),
    P('Radna grupa će koristiti rezultate anonimne ankete koju ste popunili 2025. godine. Neophodna je vaša podrška, pomoć i aktivno učešće. Svi zaposleni dužni su menadžeru integriteta i radnoj grupi, na njihov zahtjev, dostaviti potrebne podatke i informacije od značaja za izradu i provođenje plana integriteta (član 46. stav (2) Zakona).'),
    P('S poštovanjem,'),
    ...signature('DIREKTOR ŠKOLE', 'Mersad Vatić'),
    left('Dostavljeno: oglasna tabla; web stranica škole; a/a.', { size: 19 }),
  ];
}

// ─────────────────────────── 5. PROGRAM RADA
function program() {
  const src = SRC.program.map((r) => r.map((c) => c));
  const rowsSrc = src.map((r, i) => {
    if (/^Faza/.test(r[1] || '')) return [{ t: r[1], b: true, fill: C.band, span: 2 }, { t: r[2], b: true, fill: C.band }, { t: r[3], b: true, fill: C.band }];
    return [r[0], r[1], r[2], r[3]];
  });
  const faze = [
    ['Faza I: Pripremna faza', 'Odgovorna osoba', 'Rok (prijedlog)'],
    ['Donošenje Odluke o izmjenama i dopunama Odluke o izradi (dio 3.2)', 'Direktor', 'U roku od 7 dana od razmatranja nacrta'],
    ['Priprema revidiranog Programa rada', 'Radna grupa', '15 dana od Odluke o izmjenama'],
    ['Odobravanje revidiranog Programa rada', 'Direktor', '3 dana od prijema prijedloga'],
    ['Obavještavanje zaposlenih (dio 4.2)', 'Direktor; menadžer/koordinator', 'Uz odobrenje Programa'],
    ['Faza II: Identifikacija, analiza i procjena rizika', 'Odgovorna osoba', 'Rok (prijedlog)'],
    ['Početna procjena stanja integriteta (ažuriranje)', 'Radna grupa', '20 dana od Odluke o izmjenama'],
    ['Prikupljanje i analiza dokumentacije (lista u Izvještaju o reviziji, dio E)', 'Radna grupa; sekretar; knjigovođa', '20 dana od Odluke o izmjenama'],
    ['Korištenje rezultata provedene ankete (Prilog 2) – nova anketa se ne provodi', 'Radna grupa; psiholog (interpretacija)', 'Bez posebnog roka'],
    ['Potvrđivanje faktora, kontrola i radnih ocjena za svaki rizik (dio 9)', 'Radna grupa', '35 dana od Odluke o izmjenama'],
    ['Procjena i rangiranje rizika', 'Radna grupa', '35 dana od Odluke o izmjenama'],
    ['Faza III: Izrada mjera i preporuka', 'Odgovorna osoba', 'Rok (prijedlog)'],
    ['Potvrđivanje mjera, prioriteta, izvršilaca, rokova i troškova (dio 11)', 'Radna grupa', '45 dana od Odluke o izmjenama'],
    ['Izrada i podnošenje Izvještaja o stanju integriteta (dio 15)', 'Radna grupa', '50 dana od Odluke o izmjenama'],
    ['Faza IV: Usvajanje plana integriteta', 'Odgovorna osoba', 'Rok (prijedlog)'],
    ['Dostavljanje nacrta plana direktoru', 'Menadžer/koordinator', '60 dana od Odluke o izmjenama'],
    ['Pregled nacrta i dostavljanje Uredu na mišljenje (dio 14.1)', 'Direktor', '8 dana od prijema nacrta'],
    ['Usvajanje plana, razrješenje radne grupe, imenovanje osobe za nadzor (dio 14.2–14.3)', 'Direktor', 'Nakon pozitivnog mišljenja Ureda'],
    ['Dostava usvojenog plana Uredu i objava na web stranici (čl. 43. st. (3) i čl. 47. Zakona)', 'Direktor; sekretar', '15 dana od usvajanja'],
  ];
  return [
    H1('5. Program rada radne grupe'),
    H2('5.1. Program rada izrade plana integriteta (izvorni akt, broj 610-95/2025 – prijepis tabele)'),
    kv([
      ['Javna ustanova', 'Javna ustanova Osnovna škola „Stijena“'], ['Odgovorno lice', 'Direktor škole Vatić Mersad'],
      ['Koordinator', 'Sabina Žunić'], ['Članovi radne grupe', 'Edin Pehlić, Dženita Hepić, Elvira Vatić, Dževaira Džehverović, Semira Džakulić'],
      ['Datum donošenja odluke', '28.01.2025. godine'], ['Datum donošenja programa', '30.01.2025. godine'],
      ['Početak programa', '28.01.2025. godine'], ['Očekivani završetak', '28.02.2025. godine'],
    ], 3000, WP, { size: 19 }),
    spacer(6),
    table([500, 5638, 1800, 1700], rowsSrc, { size: 18, header: 0 }),
    P('Uz potpis direktora navedeno je: „Stijena, 31.03.2026.“, broj 610-95/2025.', { size: 19, italics: true, before: 80 }),
    note('Napomena uz izvorni program', [
      '- Datum programa (30.01.2025.) i datum uz potpis (31.03.2026.) nisu usklađeni [POTVRDITI].',
      '- U Fazi 4 mišljenje se traži od „Agencije (Tima za sprečavanje korupcije)“; prema Uputstvu iz 2026. mišljenje daje Ured za borbu protiv korupcije Unsko-sanskog kantona.',
      '- Program nema elemente koje Uputstvo sada traži: zadatke po članovima i način praćenja provođenja programa. Ti elementi dodani su u revidiranom programu (dio 5.2).',
    ]),
    H2('5.2. NACRT – Revidirani program rada radne grupe', { pb: true }),
    kv([
      ['Naziv institucije', 'Javna ustanova Osnovna škola „Stijena“'], ['Rukovodilac institucije', 'Mersad Vatić, direktor'],
      ['Menadžer/koordinator radne grupe', 'Sabina Žunić, pedagog'],
      ['Članovi radne grupe', 'Edin Pehlić, Dženita Hepić, Elvira Vatić, Dževaira Džehverović, Semira Džakulić, Kenan Vukalić (prijedlog)'],
      ['Angažovani vanjski konsultanti', 'Nema'],
      ['Datum odobravanja programa rada', '______________ (upisuje direktor)'],
      ['Početak izrade (nastavak postupka)', 'Dan donošenja Odluke o izmjenama i dopunama'],
      ['Očekivani završetak (nacrt direktoru)', '60 dana od Odluke o izmjenama i dopunama'],
    ], 3000, WP, { size: 19 }),
    spacer(6),
    table([600, 5038, 2200, 1800], faze.map((r, i) => (/^Faza/.test(r[0]) ? [{ t: r[0], b: true, fill: C.band, span: 2 }, { t: r[1], b: true, fill: C.band }, { t: r[2], b: true, fill: C.band }] : [String(faze.slice(0, i).reverse().findIndex((x) => /^Faza/.test(x[0])) + 1) + '.', r[0], r[1], r[2]])), { size: 18, header: 0 }),
    spacer(6),
    P('**Način praćenja provođenja programa rada:** menadžer/koordinator vodi zapisnike sa sastanaka radne grupe (datum, prisutni, zaključci, zaduženja, rokovi) i nakon svake faze pisano izvještava direktora. Zapisnici se prilažu dokumentaciji plana integriteta.'),
    ...signature('DIREKTOR ŠKOLE (odobrava)', 'Mersad Vatić'),
  ];
}

// ─────────────────────────── 6. ZAKONSKI OKVIR
function okvir() {
  const prop = [
    ['Antikorupcijski okvir', '', ''],
    ['Zakon o prevenciji korupcije u Unsko-sanskom kantonu', 'Sl. glasnik USK 24/25; ispravka 3/26', 'Provjereno (tekst 24/25); ispravka [POTVRDITI]'],
    ['Uputstvo za izradu i provođenje Plana integriteta u institucijama u USK', 'Vlada USK, 17. 3. 2026.; Sl. glasnik USK 11/2026', 'Tekst provjeren; broj glasila [POTVRDITI]'],
    ['Strategija za borbu protiv korupcije Unsko-sanskog kantona 2023.–2027.', 'Sl. glasnik USK 26/23', 'Prema modelu odluke iz Uputstva'],
    ['Zakon o prijavljivanju i postupku provjere podataka o imovini nosilaca javnih funkcija u USK', 'Sl. glasnik USK [POTVRDITI broj]', 'Primjenjuje se na nosioce javnih funkcija'],
    ['Zakon o zaštiti ličnih podataka', 'Sl. glasnik BiH 12/25', 'Prema članu 58. Zakona o prevenciji korupcije u USK'],
    ['Odgoj i obrazovanje', '', ''],
    ['Okvirni zakon o osnovnom i srednjem obrazovanju u BiH', 'Sl. glasnik BiH [POTVRDITI broj]', 'Iz izvorne verzije'],
    ['Zakon o osnovnom odgoju i obrazovanju USK', 'Sl. glasnik USK [POTVRDITI važeći tekst]', 'Iz izvorne verzije'],
    ['Pedagoški standardi i normativi za osnovno obrazovanje USK', 'Sl. glasnik USK 20/24 [POTVRDITI]', 'Iz izvorne verzije'],
    ['Kolektivni ugovor za djelatnost predškolskog i osnovnog odgoja i obrazovanja za teritoriju USK', '[POTVRDITI]', 'Iz izvorne verzije'],
    ['Rad, finansije, nabavke, uprava', '', ''],
    ['Zakon o radu (FBiH)', '[POTVRDITI]', 'Iz izvorne verzije'],
    ['Zakon o upravnom postupku (FBiH)', '[POTVRDITI]', 'Iz izvorne verzije'],
    ['Zakon o javnim nabavkama (BiH)', '[POTVRDITI]', 'Iz izvorne verzije'],
    ['Zakon o budžetima u FBiH', '[POTVRDITI]', 'Iz izvorne verzije'],
    ['Zakon o penzijskom i invalidskom osiguranju', '[POTVRDITI]', 'Iz izvorne verzije'],
    ['Zakon o zaštiti na radu', '[POTVRDITI]', 'Iz izvorne verzije'],
    ['Zakon o ministarskim, vladinim i drugim imenovanjima FBiH', '[POTVRDITI]', 'Iz izvorne verzije'],
    ['Zakon o kontroli i ograničenoj upotrebi duhana, duhanskih i ostalih proizvoda za pušenje', '[POTVRDITI]', 'Iz izvorne verzije'],
    ['Uredba sa zakonskom snagom o ustanovama', '[POTVRDITI da li je i dalje važeći propis]', 'Iz izvorne verzije'],
  ];
  const kant = ['Pravilnik o definiranju kriterija za proglašavanje uposlenika za čijim je radom djelimično ili potpuno prestala potreba, te uvjeti preuzimanja uposlenika iz jedne škole u drugu',
    'Pravilnik s kriterijima o bodovanju kandidata za prijem u radni odnos u odgojno-obrazovnim ustanovama', 'Pravilnik o praćenju, napredovanju i ocjenjivanju znanja učenika osnovne i srednje škole',
    'Pravilnik o provođenju Smotre sposobnosti, znanja i stvaralaštva i sporta učenika osnovnih i srednjih škola USK-a', 'Pravilnik o polaganju stručnog ispita nastavnika i stručnih saradnika',
    'Pravilnik o odgoju i obrazovanju, praćenju i ocjenjivanju djece sa poteškoćama u razvoju u USK-a', 'Pravilnik o načinu obavljanja obavezne dezinfekcije, dezinsekcije i deratizacije',
    'Pravilnik o uvjetima i načinu ostvarivanja prava na naknadu plaće za vrijeme privremene spriječenosti za rad', 'Pravilnik o sadržaju i vođenju evidencije o radnicima', 'Pravilnik o učeničkim zadrugama',
    'Pravilnik o kriteriju i postupku osnivanja škole kad nije osiguran dovoljan broj učenika', 'Pravilnik o stručno-pedagoškom nadzoru (Obrazac SPN 1-10)', 'Pravilnik o bržem napredovanju učenika i završavanju dva razreda u istoj školskoj godini',
    'Pravilnik o upisu osnovne škole u registar', 'Pravilnik o kriterijima za proglašenje učenika generacije', 'Pravilnik o načinu i obliku provođenja odgojno-obrazovne podrške i stručnog tretmana',
    'Pravilnik o vođenju evidencije o neprihvatljivim oblicima ponašanja i zaštiti učenika', 'Pravilnik o formiranju i radu školskih odbora', 'Pravilnik o kriterijima o školskim nazivima i simbolima i organizaciji školskih manifestacija',
    'Pravilnik o organizaciji i realizaciji izleta, studijskih posjeta, ekskurzija, kampovanja/logorovanja, društveno-korisnog rada i drugih oblika odgojno-obrazovnog rada u osnovnoj i srednjoj školi',
    'Smjernice za izuzimanje djeteta od pohađanja određene škole', 'Instrukcija o načinu vođenja dokumentacije i evidencije i izdavanja svjedodžbi',
    'Protokol o postupanju u slučaju napuštanja i nepohađanja nastave', 'Protokol o postupanju u slučaju nasilja koje uključuje djecu', 'Protokol za prevenciju i postupanje u slučajevima prosjačenja i drugih oblika eksploatacije djece u Gradu Cazinu'];
  const interni = [
    ['Pravila škole', '[POTVRDITI datum i saglasnost]', 'Postoji'], ['Pravilnik o radu', '610-1133/24 od 27.09.2024.', 'Postoji'],
    ['Pravilnik o reprezentaciji i poklonima', '[POTVRDITI]', 'Postoji'], ['Pravilnik o internim kontrolama i internim kontrolnim postupcima', '[POTVRDITI]', 'Postoji'],
    ['Pravilnik o kućnom redu', '[POTVRDITI]', 'Postoji'], ['Pravilnik o postupku direktnog sporazuma', '[POTVRDITI]', 'Postoji; uskladiti sa važećim Zakonom o javnim nabavkama'],
    ['Pravilnik o disciplinskoj i materijalnoj odgovornosti radnika', '[POTVRDITI]', 'Postoji'], ['Pravilnik o naknadi štete', '[POTVRDITI]', 'Postoji'],
    ['Pravilnik o radu Vijeća učenika; Poslovnik o radu Vijeća učenika', '[POTVRDITI]', 'Postoji'], ['Poslovnik o radu Vijeća roditelja škole', '[POTVRDITI]', 'Postoji'],
    ['Poslovnik o radu Školskog odbora', '[POTVRDITI]', 'Postoji'],
    ['Pravilnik o postupku internog prijavljivanja korupcije (čl. 22. Zakona)', '–', 'Obavezan; nije naveden u popisu [POTVRDITI] – mjera Z10.1'],
    ['Rješenje o ovlaštenom licu za prijem prijava (čl. 18. Zakona)', '–', 'Obavezno [POTVRDITI] – mjera Z10.1'],
    ['Kodeks ponašanja zaposlenih', '–', 'Nije naveden u popisu [POTVRDITI] – mjera Z7.1'],
    ['Akt o zaštiti ličnih podataka i evidencija obrade', '–', 'Nije naveden u popisu [POTVRDITI] – mjera Z4.2'],
    ['Procedura upravljanja sukobom interesa i registar izjava', '–', 'Ne postoji – mjera Z8.1'],
  ];
  return [
    H1('6. Zakonski okvir i interni propisi'),
    P('Radna grupa je izvršila popis normativnih akata kojima se uređuje rad škole. Popis iz izvorne verzije je zadržan i dopunjen antikorupcijskim propisima koji su stupili na snagu 2025. i 2026. godine. Brojevi službenih glasila koje radna grupa nije mogla provjeriti označeni su za službenu potvrdu.'),
    H2('6.1. Zakoni, uredbe i strateški dokumenti'),
    table([4300, 2700, 2638], [['Propis', 'Službeno glasilo', 'Status provjere / napomena'],
      ...prop.map((r) => (r[1] === '' && r[2] === '' ? [{ t: r[0], b: true, fill: C.band, span: 3 }] : r))], { size: 18 }),
    H2('6.2. Kantonalni pravilnici, instrukcije i protokoli (iz izvorne verzije)'),
    ...kant.map((t) => bullet(t, 0, { size: 20 })),
    H2('6.3. Interni akti škole'),
    table([4300, 2200, 3138], [['Interni akt', 'Broj i datum', 'Status'], ...interni], { size: 18 }),
  ];
}

// ─────────────────────────── 7. ORGANIZACIONA STRUKTURA
function organizacija() {
  const kat = SRC.katalog.map((r) => {
    let odg = r[4];
    if (!odg && /Psiholog|Socijalni/.test(r[1])) odg = 'Srednja odgovornost [PRIJEDLOG – u izvornoj verziji nije popunjeno]';
    return [r[0], r[1], r[2], { t: r[3].split('\n').filter(Boolean) }, odg];
  });
  return [
    H1('7. Organizaciona struktura, katalog radnih mjesta i nivoi donošenja odluka'),
    H2('7.1. Organizaciona struktura'),
    P('Opis radnih mjesta iz akta o unutrašnjoj organizaciji neophodan je osnov za procjenu rizika, a razgovor sa zaposlenima na tim radnim mjestima daje dodatne podatke o problemima s kojima se susreću u radu.'),
    P('Unutrašnja organizacija rada škole utvrđena je Pravilnikom o radu škole broj 610-1133/24 od 27.09.2024. godine i predstavlja osnov za obavljanje odgojno-obrazovne djelatnosti. Rad škole organizovan je kako slijedi:'),
    ...['Poslovi rukovođenja školom: direktor;', 'Odgojno-obrazovni rad sa učenicima: stručni saradnici (pedagog, psiholog, socijalni radnik, bibliotekar) i nastavnici;', 'Administrativno-finansijski poslovi: sekretar-blagajnik i knjigovođa;', 'Tehničko-higijenski poslovi: domar-ložač i radnici na održavanju higijene školskog prostora.'].map((t) => bullet(t)),
    P('U skladu s Pedagoškim standardima i normativima i informacijom o početku školske 2024/2025. godine, ministar Ministarstva obrazovanja, nauke, kulture i sporta USK donio je Odluku o priznavanju broja izvršilaca za školsku 2024/2025. godinu, sa ukupno 67,52 izvršioca na neodređeno i određeno radno vrijeme. [POTVRDITI broj i datum Odluke ministra; u izvornoj verziji navedeni su „standardi i normativi za srednje obrazovanje“, što je ispravljeno na osnovno obrazovanje.]'),
    note('Neusklađenost broja izvršilaca', ['Zbir izvršilaca u katalogu radnih mjesta iznosi 60,52, a Odluka ministra priznaje 67,52 izvršioca (razlika 7,00). U anketi je navedeno 72 ispitanika (96% zaposlenih). Radna grupa treba utvrditi stvarni broj zaposlenih i dopuniti katalog radnim mjestima koja nedostaju [POTVRDITI].']),
    H2('7.2. Katalog radnih mjesta', { pb: true }),
    P('Opisi poslova preneseni su iz izvorne verzije uz tehničke (pravopisne) ispravke, bez promjene sadržaja.', { italics: true, size: 19, color: C.grey }),
    table([450, 1350, 850, 5388, 1600], [['Rb.', 'Naziv radnog mjesta', 'Broj izvršilaca', 'Glavni zadaci i odgovornosti', 'Procjena odgovornosti'], ...kat], { size: 17 }),
    H2('7.3. Nivoi donošenja odluka i odgovornost'),
    P('Radom škole rukovodi direktor u skladu sa zakonom, podzakonskim aktima i općim aktima škole. Direktor zastupa i predstavlja školu bez ograničenja. Nadležnosti direktora utvrđene su članom 142. Zakona o osnovnom odgoju i obrazovanju i članom 108. Pravila škole [POTVRDITI usklađenost brojeva članova s važećim tekstom]. Direktor je dužan obustaviti od izvršenja opći akt Školskog odbora za koji smatra da je u suprotnosti s Ustavom ili zakonom, kao i pojedinačni akt kojim se nanosi šteta školi ili društvenoj zajednici, osim akata koji se odnose na postupak prijevremenog razrješenja ili suspenzije direktora, te o tome obavijestiti osnivača i Školski odbor.'),
    P('Školom upravlja Školski odbor. Nadležnosti Školskog odbora utvrđene su članom 134. Zakona o osnovnom odgoju i obrazovanju i članom 84. Pravila škole [POTVRDITI]. Školski odbor osigurava djelotvorno i efikasno korištenje resursa škole i brine o zakonitosti rada škole i njenih organa; donosi Pravila škole i opće akte; donosi Godišnji program rada i usvaja izvještaj o njegovoj realizaciji; usvaja finansijski plan i godišnji izvještaj o finansijskom poslovanju; odlučuje o korištenju sredstava preko iznosa utvrđenog propisima; raspisuje konkurs i imenuje i razrješava direktora u skladu sa zakonom; razmatra izvještaj o radu direktora, izvještaje i preporuke nadzornih tijela; rješava po prigovorima roditelja i obavlja druge poslove u skladu sa zakonom i Pravilima škole. Predsjednik i članovi Školskog odbora odgovorni su za zakonitost njegovog rada.'),
    table([2600, 4238, 2800], [['Nivo', 'Ključne odluke', 'Odgovara'],
      ['Školski odbor', 'Opći akti, finansijski plan, Godišnji program rada, imenovanje direktora, prigovori roditelja', 'Osnivaču'],
      ['Direktor', 'Prijem i prava iz radnog odnosa, raspored poslova, utrošak sredstava, ugovori, javne nabavke, plan integriteta', 'Školskom odboru i osnivaču'],
      ['Nastavničko vijeće i odjeljenjska vijeća', 'Ocjenjivanje, pedagoške mjere, učenik generacije, stručna pitanja', 'Direktoru (prema Pravilima škole)'],
      ['Komisije (prijem, nabavke, ispiti, popis, ekskurzije)', 'Prijedlozi i odluke u okviru rješenja o imenovanju', 'Direktoru'],
      ['Vijeće roditelja, Vijeće učenika', 'Savjetodavna uloga, saglasnosti propisane aktima', 'Prema poslovnicima'],
      ['Zaposleni', 'Izvršavanje poslova radnog mjesta', 'Direktoru']], { size: 18 }),
  ];
}

// ─────────────────────────── 8. IZVJEŠTAJ O INTEGRITETU (aspekti, radna mjesta)
function izvjestajIntegritet() {
  const ranj = SRC.ranjiva.map((r) => {
    const lvl = r.slice(3).findIndex((x) => x && x.trim()) + 1;
    return [r[0], r[1].replace(/\n/g, ' '), r[2], { t: String(lvl), align: AT.CENTER, b: true }];
  });
  const krit = SRC.kriticna.map((r) => [r[0], r[1], { t: r[2].split('\n').filter(Boolean).map((x) => x.replace(/^-\s*/, '- ')) }, { t: r[3].split(/\n?- /).map((x) => x.replace(/\n/g, ' ').trim()).filter(Boolean).map((x) => '- ' + x) }, { t: r[4], align: AT.CENTER, b: true }]);
  const map = { 'Direktor': 'Z1.1, Z1.2, Z3.1, Z5.1, Z8.1, Z9.1', 'Nastavnik': 'S1.1–S1.3, Z8.2, Z9.1, S7.1', 'Sekretar - blagajnik': 'Z1.3, Z2.2, Z4.1, Z6.1, Z10.1', 'Knjigovođa': 'Z2.1, Z3.1, Z3.3, Z9.2' };
  return [
    H1('8. Izvještaj o stanju integriteta'),
    P('Prema Uputstvu, izvještaj o stanju integriteta sadrži početnu procjenu stanja na osnovu stručnog znanja članova radne grupe, rezultate anketnog upitnika, evidenciju rizika i prikaz svakog identifikovanog rizika. Ovaj dio sadrži početnu procjenu i analizu ranjivih aktivnosti i radnih mjesta. Evidencija i prikaz rizika nalaze se u dijelu 9, a sažetak u Konačnom izvještaju radne grupe (dio 15).'),
    H2('8.1. Početna procjena stanja integriteta'),
    P('Početna procjena zasniva se na analizi zakonskih i podzakonskih akata i internih propisa, opisa radnih mjesta i rezultata anonimne ankete zaposlenih (Prilog 2). Radna grupa nema podatke o dokumentovanim slučajevima korupcije u školi u posmatranom periodu [POTVRDITI uvidom u evidencije prijava, inspekcijske nalaze i disciplinske postupke za period 2022–2026]. Utvrđene su sljedeće sistemske slabosti:'),
    ...['sistem internog prijavljivanja nije u potpunosti usklađen sa Zakonom o prevenciji korupcije u USK, a većina zaposlenih ne zna kako anonimno prijaviti kršenje integriteta;',
      'ne postoji imenovana osoba ni procedura za upravljanje sukobom interesa;',
      'interni akti nisu dostupni na jednom mjestu ni objavljeni na web stranici;',
      'teme integriteta i etike rijetko se razmatraju, a kodeks ponašanja nije naveden među internim aktima;',
      'zbog malog broja izvršilaca u administrativno-finansijskoj službi ograničena je podjela dužnosti;',
      'kriteriji ocjenjivanja, zapošljavanja i dodatnih zaduženja nisu dovoljno transparentni prema zaposlenima, roditeljima i kandidatima.'].map((t) => bullet(t)),
    H2('8.2. Mehanizam otpornosti institucije na eventualne propuste'),
    P('Škola ima istaknuto sanduče za prijavu koruptivnog ponašanja. Postojeći mehanizmi otpornosti su nadzor Školskog odbora i osnivača, stručno-pedagoški nadzor, prosvjetna inspekcija, interne kontrole prema Pravilniku o internim kontrolama, kolektivno odlučivanje stručnih organa i pravo roditelja na prigovor. Da bi ti mehanizmi bili djelotvorni, potrebno je sanduče označiti natpisom „ZA PRIJAVU KORUPCIJE“ (član 19. Zakona), donijeti pravilnik o internom prijavljivanju i rješenje o ovlaštenom licu, te zaposlene informisati o načinima prijave (rizik Z10.1).'),
    H2('8.3. Analiza ranjivih aktivnosti po aspektima ankete'),
    P('Tabela zadržava aspekte i opisne ocjene iz izvorne verzije, a revidirana ocjena zasniva se na stvarnim rezultatima ankete (Prilog 2). Rezultati ankete i stručna procjena su odvojeni.', { keepNext: true }),
    table([1500, 1500, 3138, 2000, 1500], [['Aspekt', 'Izvorna ocjena (ver 2)', 'Rezultat ankete (Prilog 2) → stručna procjena', 'Povezani rizici', 'Revidirana ocjena'],
      ['A – Rizične aktivnosti i podložnost korupciji', 'Slaba osjetljivost', 'Anketa: 64,86% ne zna kako anonimno prijaviti; 44% ne zna gdje su akti. → Procjena: kontrolni okvir za prijave i dostupnost akata je slab.', 'Z1.3, Z10.1, Z11.2', 'Potrebne mjere visokog prioriteta'],
      ['B – Opis radnog mjesta, konsultacije, ocjena rada', 'Slaba osjetljivost', 'Anketa: 97,30% poznaje opis radnog mjesta; 16,22% nikada nije razgovaralo o integritetu. → Procjena: dobra organizaciona jasnoća, slaba etička komunikacija.', 'Z7.1', 'Umjerena osjetljivost'],
      ['C – Profesionalni i privatni život', 'Slaba osjetljivost', 'Anketa: 13,51% suočeno sa situacijom mogućeg sukoba interesa; niko nije tražio izuzeće ni uključio drugoga. → Procjena: sukob interesa se ne prepoznaje i ne upravlja se njime.', 'Z8.1, Z8.2', 'Potrebne mjere visokog prioriteta'],
      ['D – Kontakti izvan škole', 'Nema osjetljivosti', 'Anketa: 45,95% ima kontakte izvan škole; nadređeni u većini slučajeva nije upoznat s njima. → Procjena: izloženost uticaju trećih lica.', 'Z7.2, Z8.1', 'Umjerena osjetljivost'],
      ['E – Rezultati i kvalitet', 'Slaba osjetljivost', 'Anketa: 10,81% smatra da saradnici daju prednost vlastitim interesima. → Procjena: organizaciona kultura uglavnom profesionalna.', 'Z7.1', 'Slaba osjetljivost'],
      ['F – Upravljanje sredstvima', 'Slaba osjetljivost', 'Anketa: 72,97% ne zna za procedure kod prevare ili krađe; 40,54% ne zna za interne propise o nabavkama; 78,38% traži lice za sukob interesa. → Procjena: propisi postoje, ali nisu poznati.', 'Z2.1, Z3.1, Z8.1', 'Umjerena osjetljivost']], { size: 17 }),
    H2('8.4. Analiza kritičnih aktivnosti i kritičnih radnih mjesta', { pb: true }),
    P('Analiza kritičnih aktivnosti i radnih mjesta zadržana je iz izvorne verzije jer odgovara zahtjevu iz člana 44. tačka b) Zakona (opis radnih mjesta, radnih procesa i poslova koji su naročito podložni korupciji). Radna mjesta su ocijenjena na skali od 1 do 5. Ta skala služi samo za rangiranje radnih mjesta; intenzitet rizika ocjenjuje se isključivo skalom Uputstva (dio 9).'),
    ...['1 – Nepostojanje prijetnji: ne postoje uslovi za korupciju, ne postoje informacije i ne donose se odluke;', '2 – Mala vjerovatnoća: informacije su ograničene, ne postoji komunikacija izvan institucije;', '3 – Srednji nivo vjerovatnoće: uticaj na dio radnih procesa, ograničena ovlaštenja, određivanje zadataka;', '4 – Visoka vjerovatnoća: lice posjeduje informacije i komunicira sa subjektima izvan institucije;', '5 – Velika vjerovatnoća za korupciju: ovlaštenja bez ograničenja, donošenje strateških odluka.'].map((t) => bullet(t, 0, { size: 20 })),
    P('**Katalog radnih mjesta podložnih koruptivnom djelovanju** (izvorne ocjene radne grupe):', { before: 120, keepNext: true }),
    table([450, 6188, 2000, 1000], [['Rb.', 'Ranjiva aktivnost', 'Ranjivo radno mjesto', 'Nivo (1–5)'], ...ranj], { size: 17 }),
    note('Napomena', ['U anketi je postavljeno pitanje 13 (ocjena radnih mjesta prema podložnosti na skali 1–5), ali rezultati tog pitanja nisu iskazani. Nije poznato da li su ocjene iz tabele izvedene iz ankete ili iz procjene radne grupe [POTVRDITI]. Psiholog i socijalni radnik obuhvaćeni su ocjenom „stručni saradnici“ (nivo 2); bibliotekar je ocijenjen zasebno.']),
    H2('8.5. Opis kritičnih ranjivih radnih mjesta'),
    P('Na osnovu analize, najrizičnija radna mjesta su (izvorni podaci, dopunjeni vezom s registrom rizika):', { keepNext: true }),
    table([400, 1300, 2900, 2600, 900, 1538], [['Rb.', 'Radno mjesto', 'Opis kritičnih aktivnosti', 'Mogući rizici', 'Nivo (1–5)', 'Rizici u registru'],
      ...krit.map((r) => [...r, map[r[1]] || '—'])], { size: 17 }),
  ];
}

// ─────────────────────────── 9. RIZICI
function metodologija() {
  return [
    H1('9. Identifikacija, analiza i procjena rizika'),
    H2('9.1. Metodologija (prema Uputstvu iz 2026)'),
    P('Rizici su identifikovani i analizirani u svim zajedničkim oblastima iz Tabele broj 1 Uputstva i u specifičnim oblastima koje proizilaze iz nadležnosti osnovne škole. Za svaku oblast izdvojena su najmanje dva rizika, a za svaki rizik popunjen je poseban analitički obrazac.'),
    table([2600, 7038], [['Element', 'Primjena u ovom planu'],
      ['Oblasti', `11 zajedničkih oblasti (Z1–Z11) i 7 specifičnih oblasti (S1–S7); ukupno ${N.uk} rizika (${N.z} u zajedničkim i ${N.s} u specifičnim oblastima).`],
      ['Faktori (izvori) rizika', 'Sistemski (S), organizacijski (O), individualni (I), radno-procesni i proceduralni (P).'],
      ['Ocjena postojećih mjera', 'Da li mjera postoji, da li se primjenjuje i da li daje očekivani efekat → rizik kontrolisan, djelimično kontrolisan ili nekontrolisan.'],
      ['Vjerovatnoća (V)', '1 – korupcija se nije pojavila ili se pojavljivala vrlo rijetko; 2 – pojavljivala se u više slučajeva; 3 – pojavljivala se često. Posmatrani period: školske godine 2022/23–2025/26 [POTVRDITI].'],
      ['Posljedica (P)', '1 – neznatne; 2 – značajne; 3 – vrlo značajne po instituciju (finansijske, reputacione, kadrovske, operativne i druge).'],
      ['Intenzitet (I = V × P)', 'Nizak (1–2), srednji (3–4), visok (6–9). U obrascu Uputstva srednji intenzitet nosi oznaku „umjeren“. Prioritet mjere slijedi intenzitet: visoki, umjereni, niski.']], { size: 18 }),
    spacer(6),
    P('**Temperaturna mapa intenziteta rizika (Tabela broj 2 Uputstva)**', { keepNext: true, align: AT.LEFT }),
    table([3238, 2133, 2133, 2134], [
      ['Posljedica \\ Vjerovatnoća', '1 – mala', '2 – umjerena', '3 – velika'],
      [{ t: '3 – vrlo značajne', b: true }, { t: '3', fill: C.mid, align: AT.CENTER }, { t: '6', fill: C.hi, align: AT.CENTER }, { t: '9', fill: C.hi, align: AT.CENTER }],
      [{ t: '2 – značajne', b: true }, { t: '2', fill: C.lo, align: AT.CENTER }, { t: '4', fill: C.mid, align: AT.CENTER }, { t: '6', fill: C.hi, align: AT.CENTER }],
      [{ t: '1 – neznatne', b: true }, { t: '1', fill: C.lo, align: AT.CENTER }, { t: '2', fill: C.lo, align: AT.CENTER }, { t: '3', fill: C.mid, align: AT.CENTER }],
    ], { size: 19, cantSplit: true }),
    spacer(6),
    note('Status ocjena – pravilo radnih ocjena', [
      'Sve ocjene vjerovatnoće i posljedice u ovom nacrtu su RADNE OCJENE koje radna grupa mora potvrditi ili obrazloženo korigovati. Primijenjena su sljedeća pravila:',
      '- Gdje postoji izvorna ocjena radne grupe iz verzije 2 (Tabela procjene rizika), ona je prevedena na skalu Uputstva: „niska“ = 1, „srednja“ = 2, „visoka“ = 3 (oznaka izvora: RG ver 2).',
      '- Gdje anketa pokazuje slabost kontrolnog okvira, vjerovatnoća je ocijenjena sa 2 (oznaka izvora: anketa).',
      '- U ostalim slučajevima, kada nema dokumentovanih pojava, vjerovatnoća je ocijenjena sa 1 (oznaka izvora: prijedlog revizije). Ocjena 3 nije dodijeljena nijednom riziku jer ne postoje dokazi o čestim pojavama.',
      '- Uputstvo vjerovatnoću 2 vezuje za pojavu korupcije „u više slučajeva u prošlosti“. Ako radna grupa u evidencijama ne nađe takve pojave, a anketni pokazatelj smatra nedovoljnim, ocjenu treba korigovati na 1 i to zapisnički obrazložiti.',
      '- Nijedna ocjena nije preuzeta iz planova drugih institucija.',
    ], { fill: C.light, border: C.blue, tcolor: C.navy }),
    H2('9.2. Izvorna tabela procjene rizika (verzija 2) i njeno preuzimanje'),
    P('Izvorna tabela koristila je opisne ocjene bez propisane skale. Rizici iz nje zadržani su i razrađeni u registru:', { keepNext: true }),
    table([450, 1500, 2300, 1050, 1050, 1000, 2288], [['R.br', 'Oblast rada', 'Identifikovani rizik (izvorno)', 'Vjerovatnoća', 'Posljedica', 'Nivo', 'Šifra u registru / nova ocjena'],
      ['1', 'Zapošljavanje', 'Netransparentan prijem radnika', 'Srednja', 'Visoka', 'VISOK', 'Z5.1 → 2 × 3 = 6, visok'],
      ['2', 'Javne nabavke', 'Nepravilnosti u postupku nabavki', 'Srednja', 'Visoka', 'VISOK', 'Z3.1 → 2 × 3 = 6, visok'],
      ['3', 'Finansije', 'Nepravilno trošenje sredstava', 'Niska', 'Visoka', 'SREDNJI', 'Z2.1 → 1 × 3 = 3, srednji'],
      ['4', 'Ocjenjivanje', 'Subjektivno ocjenjivanje učenika', 'Srednja', 'Srednja', 'SREDNJI', 'S1.1 → 2 × 2 = 4, srednji'],
      ['5', 'Evidencije', 'Neažurno vođenje dokumentacije', 'Srednja', 'Srednja', 'SREDNJI', 'Z4.1 → 2 × 2 = 4, srednji'],
      ['6', 'Upravljanje', 'Netransparentno donošenje odluka', 'Srednja', 'Visoka', 'VISOK', 'Z1.1 → 2 × 3 = 6, visok']], { size: 18 }),
  ];
}

function registar() {
  const rows = [];
  OBLASTI.forEach((o) => {
    rows.push([{ t: `${o.id} – ${o.naziv} (${o.vrsta.toLowerCase()} oblast)`, b: true, fill: C.band, span: 8 }]);
    Rx.filter((r) => r.o === o.id).forEach((r) => rows.push([
      { t: r.id, b: true }, r.naziv, r.a, { t: String(r.v), align: AT.CENTER }, { t: String(r.p), align: AT.CENTER },
      { t: String(r.x), align: AT.CENTER, b: true, fill: FILL[r.nivo] }, { t: r.nivo, fill: FILL[r.nivo] }, r.prioritet]));
  });
  const heat = [3, 2, 1].map((p) => [{ t: PL[p], b: true }, ...[1, 2, 3].map((v) => { const n = cnt((r) => r.v === v && r.p === p); const x = intenzitet(v, p); return { t: n ? `${n} (I=${x.x})` : '–', fill: FILL[x.nivo], align: AT.CENTER }; })]);
  const rang = [...Rx].sort((a, b) => b.x - a.x || a.id.localeCompare(b.id, 'bs', { numeric: true }));
  return [
    H2('9.3. Evidencija rizika (tabelarni pregled svih rizika)', { pb: true }),
    P(`Ukupno je identifikovano ${N.uk} rizika: ${N.vis} visokog, ${N.sre} srednjeg i ${N.niz} niskog intenziteta (radne ocjene).`, { keepNext: true }),
    table([800, 5900, 1900, 600, 600, 700, 1200, 2870], [['Šifra', 'Rizik', 'Analiza rizika', 'V', 'P', 'I', 'Intenzitet', 'Prioritet mjera'], ...rows], { size: 17 }),
    H2('9.4. Raspodjela rizika na temperaturnoj mapi i rang lista', { pb: true }),
    table([3500, 3690, 3690, 3690], [['Posljedica \\ Vjerovatnoća', '1 – mala', '2 – umjerena', '3 – velika'], ...heat], { size: 19, cantSplit: true }),
    spacer(6),
    P('**Rang lista rizika visokog intenziteta** (prioritetni za provođenje mjera):', { keepNext: true }),
    table([900, 8170, 2500, 3000], [['Šifra', 'Rizik', 'Intenzitet', 'Izvor ocjene'],
      ...rang.filter((r) => r.nivo === 'Visok').map((r) => [{ t: r.id, b: true }, r.naziv, { t: `${r.v} × ${r.p} = ${r.x} (visok)`, fill: C.hi }, { RG2026: 'Izvorna ocjena RG (ver 2)', ANK: 'Indikator iz ankete', PR: 'Prijedlog revizije' }[r.izv]])], { size: 18 }),
  ];
}

function obrasci() {
  const out = [H2('9.5. Analitički obrasci po rizicima', { pb: true }),
    P('Za svaki rizik popunjen je poseban obrazac Uputstva („Model analitički obrazac za unošenje podataka iz procesa identifikacije, analize, procjene i rangiranja rizika i prijedloga mjera“). Dopunski red sadrži obrazloženje, vezu s anketom, korektivno postupanje i šifre mjera iz dijela 11.')];
  OBLASTI.forEach((o) => {
    Rx.filter((r) => r.o === o.id).forEach((r, idx) => {
      const nf = r.f.length;
      const izv = { RG2026: 'Izvorna ocjena radne grupe (ver 2), prevedena na skalu Uputstva', ANK: 'Indikator iz ankete (Prilog 2)', PR: 'Prijedlog revizije – nema dokumentovanih pojava' }[r.izv];
      const rows = [
        ['Br.', 'Faktori/izvori rizika: Sistemski (S), Organizacijski (O), Individualni (I), Radno-procesni i proceduralni (P)', 'Postojeće mjere / kontrolni mehanizmi na snazi u instituciji', 'Analiza rizika (kontrolisan / djelimično kontrolisan / nekontrolisan)', 'Ocjena vjerovatnoće nastanka korupcije', 'Ocjena posljedice nastanka korupcije', 'Intenzitet rizika'],
        ...r.f.map((f, i) => (i === 0 ? [
          `${i + 1}.`, `(${f[0]}) ${f[1]}`,
          { t: r.k.map((x) => '- ' + x), rspan: nf }, { t: r.a, rspan: nf, b: true },
          { t: VL[r.v], rspan: nf, align: AT.CENTER }, { t: PL[r.p], rspan: nf, align: AT.CENTER },
          { t: `${r.x} – ${r.nivo}`, rspan: nf, align: AT.CENTER, b: true, fill: FILL[r.nivo] },
        ] : [`${i + 1}.`, `(${f[0]}) ${f[1]}`])),
      ];
      out.push(
        new d.Paragraph({ heading: d.HeadingLevel.HEADING_3, keepNext: true, pageBreakBefore: false, children: L.runs(`Rizik ${r.id}: ${r.naziv}`) }),
        P(`Oblast funkcionisanja institucije: **${o.id} – ${o.naziv}** (${o.vrsta.toLowerCase()} oblast). Opis rizika: ${r.opis}`, { size: 19, keepNext: true, after: 60 }),
        table([500, 4200, 3600, 1900, 1300, 1300, 1770], rows, { size: 17, cantSplit: true }),
        table([2600, 11970], [
          [{ t: 'Djelotvornost postojećih kontrola', b: true, fill: C.light }, r.ao],
          ...(r.ank ? [[{ t: 'Veza s anketom (izvorni podatak)', b: true, fill: C.light }, r.ank]] : []),
          [{ t: 'Izvor i status ocjene', b: true, fill: C.light }, `${izv}. [RADNA OCJENA – potvrđuje radna grupa]`],
          [{ t: 'Korektivno postupanje', b: true, fill: C.light }, r.kor],
          [{ t: 'Mjere (dio 11.2)', b: true, fill: C.light }, `${r.m.map((m, i) => `M-${r.id}.${i + 1}`).join('; ')} – ${r.prioritet.toLowerCase()}`],
        ], { header: 0, size: 17, cantSplit: true }),
        spacer(8),
      );
    });
  });
  return out;
}

// ─────────────────────────── 10. STATUS QUO
function statusQuo() {
  return [
    H1('10. Analiza postojećeg stanja (status quo)'),
    H2('10.1. Analiza na temelju ankete'),
    P('Radna grupa je provela anonimnu anketu zaposlenih pomoću upitnika za samoprocjenu integriteta (34 pitanja u šest oblasti, A–F). Upitnik, broj ispitanika, procenti i izvorni tekst rezultata preneseni su bez izmjena u Prilog 2, na kraju dokumenta. U ovom dijelu data je samo stručna interpretacija postojećih rezultata i njihova veza s rizicima. Rezultati ankete i stručna procjena su odvojeni.'),
    table([1500, 3000, 3638, 1500], [['Oblast / pitanje', 'Rezultat ankete (izvorni podatak)', 'Stručna interpretacija', 'Rizici'],
      ['A / 1', '91,89% svoja radna mjesta ne smatra podložnim korupciji', 'Niska samopercepcija rizika je očekivana kod samoprocjene i ne znači odsustvo rizika; potrebna je edukacija o prepoznavanju rizika.', 'Z7.1'],
      ['A / 5, 6', '83,78% smatra da se zakonska regulativa dosljedno provodi; 78,38% ocjenjuje mehanizam odgovornosti odličnim ili dobrim', 'Pozitivan pokazatelj povjerenja u zakonitost rada. Struktura preostalih odgovora nije iskazana.', 'Z1.1'],
      ['A / 4', '47% zna, a 44% ne zna gdje su dostupni interni akti', 'Gotovo polovina zaposlenih nema siguran pristup pravilima → rizik proizvoljnosti.', 'Z1.3'],
      ['A / 3', '81,08% smatra da ne nedostaje nijedan interni akt', 'Nesklad sa stvarnim zakonskim obavezama (pravilnik o internom prijavljivanju, kodeks, sukob interesa) ukazuje na nepoznavanje novih obaveza.', 'Z10.1, Z7.1, Z8.1'],
      ['A / 8', '64,86% nije upoznato s načinom anonimne prijave', 'Najznačajniji nalaz: mehanizam prijave praktično nije poznat zaposlenima.', 'Z10.1, Z11.2'],
      ['B / 14, 15, 17, 18', '97,30% poznaje opis radnog mjesta; 97,30% ima konsultacije, od čega 16,22% nikada ne razgovara o integritetu; 100% navodi da je nadređeni dostupan', 'Jasna organizacija i dobra komunikacija; integritet nije redovna tema.', 'Z7.1'],
      ['C / 19, 20', '13,51% je bilo suočeno s mogućim sukobom interesa; niko nije predao pitanje drugome ni uključio saradnika ili nadređenog', 'Sukob interesa se ne prepoznaje i ne upravlja se njime; potrebna je procedura izuzeća.', 'Z8.1'],
      ['D / 21–23', '45,95% ima kontakte izvan škole; nadređeni u većini slučajeva nije upoznat s njima (brojčani podatak nije iskazan)', 'Izloženost uticaju trećih lica; bez brojčanog podatka nalaz je indikativan.', 'Z7.2'],
      ['E / 24–27', '10,81% smatra da saradnici daju prednost vlastitim interesima; 64,86% se „ne slaže“ (formulacija u izvornom tekstu povezuje pitanja 24 i 25)', 'Organizaciona kultura je pretežno profesionalna. Rezultat 64,86% nije moguće pouzdano pripisati jednom pitanju (vidjeti napomenu u Prilogu 2).', 'Z7.1'],
      ['F / 28–34', '54,05% ocjenjuje opskrbu dovoljnom; 81,08% nikada nije čulo za prevaru ili krađu; 72,97% ne zna za procedure; 86,49% zna za plan nabavki; 40,54% ne zna za interne propise o nabavkama; 78,38% smatra potrebnim lice za sukob interesa', 'Propisi postoje, ali nisu poznati; zaposleni jasno traže uspostavu odgovornosti za sukob interesa.', 'Z2.1, Z3.1, Z8.1']], { size: 17 }),
    spacer(6),
    P('U izvornoj analizi je, nakon primjene „formule osjetljivosti na korupciju“, zaključeno da u školi postoji mala mogućnost nastajanja koruptivnih radnji i da su posljedice neznatne. Ta formula pripada ranijem modelu Agencije i nije dio Uputstva iz 2026. Zaključak je zadržan kao izvorni podatak (Prilog 2), a intenzitet rizika u ovom planu ocijenjen je isključivo metodologijom Uputstva.'),
    H2('10.2. Analiza na temelju zakonskog okvira'),
    P('Izvorna ocjena da „ne postoje pravne praznine“ revidira se. Zakonski okvir za odgojno-obrazovnu djelatnost je uspostavljen, ali su utvrđene sljedeće praznine u odnosu na Zakon o prevenciji korupcije u USK i Uputstvo:'),
    ...['pravilnik o postupku internog prijavljivanja korupcije (član 22.) nije naveden među internim aktima;', 'nije potvrđeno rješenje o ovlaštenom licu i ispunjenost uslova iz člana 18. Zakona;', 'ne postoji procedura upravljanja sukobom interesa ni registar izjava;', 'kodeks ponašanja zaposlenih i akt o zaštiti ličnih podataka nisu navedeni među internim aktima;', 'plan integriteta i interni akti nisu objavljeni na web stranici škole (rubrika „Dokumenti“ je prazna).'].map((t) => bullet(t)),
    H2('10.3. Analiza na temelju poslovnih procesa'),
    P('Poslovni procesi se obavljaju u skladu sa zakonskim i podzakonskim propisima. Kod pojedinih procesa utvrđene su slabosti: ograničena podjela dužnosti u finansijama i blagajni, izostanak pisanih kriterija za diskrecione odluke, neujednačeno dokumentovanje rada komisija, prikupljanje gotovine preko razrednika i izostanak redovne unakrsne kontrole evidencija. Za svaku slabost predložene su mjere u dijelu 11.'),
    H2('10.4. Analiza na temelju saradnje s drugim tijelima'),
    P('Radi efikasnijeg ostvarivanja odgojno-obrazovnih ciljeva, škola sarađuje s osnivačem i Ministarstvom obrazovanja, nauke, kulture i sporta USK, Pedagoškim zavodom USK, prosvjetnom inspekcijom, Gradom Cazinom, centrom za socijalni rad, zdravstvenim ustanovama, drugim školama, te vladinim i nevladinim organizacijama u provođenju programa i projekata, uz saglasnost ministarstva. Za plan integriteta posebno je važna saradnja s Uredom za borbu protiv korupcije USK (mišljenje, izvještavanje, edukacije, eksterne prijave) i Pedagoškim zavodom USK (program „Put integriteta“ i edukacije o integritetu u obrazovanju).'),
  ];
}

// ─────────────────────────── 11. PREPORUKE I MJERE
function preporuke() {
  return [
    H1('11. Preporuke za unapređenje i plan upravljanja rizicima'),
    H2('11.1. Preporuke za unapređenje'),
    P('Preporuke iz izvorne verzije su zadržane. Raniji prioriteti (skala 1–5) zamijenjeni su prioritetima Uputstva (visoki, umjereni, niski), koji proizilaze iz intenziteta povezanih rizika.', { keepNext: true }),
    table([450, 1700, 3088, 1500, 1500, 1400], [['Rb.', 'Područje (izvorno)', 'Preporuka (izvorno, dopunjeno)', 'Prioritet / rizici', 'Odgovorna osoba', 'Provjera'],
      ['1.', 'Odgovornost', 'Unaprijediti mehanizam odgovornosti i transparentnost u radu i odlučivanju: registar akata i odluka, pisano obrazloženje diskrecionih odluka.', 'Visoki – Z1.1, Z1.3', 'Direktor', 'Godišnji izvještaj do 31. marta'],
      ['2.', 'Obuke i edukacije', 'Sačiniti godišnji plan obuke s posebnim osvrtom na etiku i integritet; upoznati zaposlene s Planom integriteta i objaviti ga na web stranici škole.', 'Umjereni – Z7.1', 'Direktor; pedagog; psiholog', 'Godišnji izvještaj'],
      ['3.', 'Raspolaganje materijalno-finansijskim sredstvima', 'Praćenje i nadzor nad primjenom propisa i procedura: pravilo „četiri oka“, kvartalni izvještaji, popis blagajne.', 'Umjereni – Z2.1, Z2.2', 'Direktor; knjigovođa; sekretar-blagajnik', 'Kvartalno'],
      ['4.', 'Javne nabavke', 'Edukacija osoba koje provode postupke; objava plana nabavki i obavještenja o zaključenim ugovorima na web stranici i u zbornici; registar ugovora.', 'Visoki – Z3.1, Z3.2', 'Direktor; Komisija za javne nabavke; Školski odbor', 'Kvartalno'],
      ['5.', 'Interni propisi', 'Upoznati zaposlene sa svim internim propisima i procedurama i učiniti ih dostupnim na web stranici; donijeti obavezne akte (prijave, kodeks, sukob interesa, lični podaci).', 'Visoki – Z1.3, Z10.1, Z8.1', 'Direktor; sekretar', 'Polugodišnje'],
      ['6.', 'Komunikacija', 'Unaprijediti otvorenu komunikaciju i odnose među zaposlenima kroz predavanja i radionice; redovno razmatrati teme integriteta na stručnim organima.', 'Umjereni – Z7.1, Z11.2', 'Direktor; psiholog; pedagog', 'Godišnji izvještaj']], { size: 17 }),
    spacer(6),
    P('**Obrada mjera iz izvorne verzije (Tabela „Mjere za upravljanje rizicima“):**', { keepNext: true }),
    table([450, 3000, 1300, 4888], [['R.br', 'Izvorna mjera', 'Izvorni rok', 'Obrada u revidiranom planu'],
      ['1', 'Donošenje pravilnika o transparentnom zapošljavanju', '30 dana', 'Kriterije propisuje kantonalni Pravilnik s kriterijima o bodovanju kandidata, pa škola ne donosi vlastite kriterije. Mjera je zamijenjena mjerama M-Z5.1.1, M-Z5.1.2 i M-Z5.2.1 (objava rang-lista, izjave komisije, standardizovani intervju).'],
      ['2', 'Uvođenje evidencije javnih nabavki', 'Kontinuirano', 'Zadržana i precizirana: M-Z3.1.1 (registar ugovora, objava plana).'],
      ['3', 'Interna finansijska kontrola', 'Kvartalno', 'Zadržana i precizirana: M-Z2.1.1.'],
      ['4', 'Standardizacija ocjenjivanja', 'Kontinuirano', 'Zadržana i precizirana: M-S1.1.1, M-S1.3.1.'],
      ['5', 'Kontrola i ažuriranje evidencija', 'Kontinuirano', 'Zadržana i precizirana: M-Z4.1.1.'],
      ['6', 'Edukacija zaposlenih o integritetu', 'Godišnje', 'Zadržana i precizirana: M-Z7.1.2.'],
      ['7', 'Uspostavljanje sistema prijave korupcije', '30 dana', 'Zadržana i usklađena sa Zakonom: M-Z10.1.1, M-Z10.1.2, M-Z10.2.1.']], { size: 17 }),
  ];
}

function mjereTabela() {
  const rows = [];
  OBLASTI.forEach((o) => {
    rows.push([{ t: `${o.id} – ${o.naziv}`, b: true, fill: C.band, span: 7 }]);
    Rx.filter((r) => r.o === o.id).forEach((r) => r.m.forEach((m, i) => rows.push([
      { t: [`${r.id} – ${r.naziv}`, `I = ${r.x} (${r.nivo.toLowerCase()})`] },
      { t: [`M-${r.id}.${i + 1} (${m.tip === 'P' ? 'preventivna' : 'korektivna'})`, m.t] },
      { t: r.prioritet, fill: FILL[r.nivo] },
      { t: m.akt.map((a) => '- ' + a) },
      { t: [m.nos, `Rok: ${m.rok}`] },
      m.tr, m.ind])));
  });
  return [
    H2('11.2. Mjere za unapređenje integriteta (plan upravljanja rizicima)', { pb: true }),
    P(`Tabela slijedi obrazac Uputstva „Mjere za unapređenje integriteta“, dopunjen kolonom s indikatorima i dokazima provođenja. Ukupno je predloženo ${N.mj} mjera. Kad je u koloni izvršioca navedena funkcija, odgovorna je osoba koja tu funkciju obavlja u trenutku provođenja mjere. Rok „kontinuirano“ uvijek je praćen dinamikom provjere.`, { size: 19 }),
    table([1700, 3000, 1100, 3000, 2200, 1370, 2200], [['Rizik', 'Mjera za upravljanje rizikom / unapređenje integriteta', 'Prioritet mjere', 'Aktivnosti potrebne za realizaciju mjere', 'Izvršilac mjere i rok', 'Procjena troškova', 'Indikator i dokaz provođenja'], ...rows], { size: 16 }),
  ];
}

// ─────────────────────────── 12. KONTROLNI MEHANIZMI
function kontrola() {
  return [
    H1('12. Kontrolni mehanizmi i praćenje provođenja plana'),
    P('Kontrolni mehanizmi osiguravaju provođenje preventivnih mjera i redovno izvještavanje. Elementi iz izvorne verzije su zadržani i dopunjeni obavezama iz Zakona i Uputstva.', { keepNext: true }),
    table([450, 3800, 2600, 2788], [['Rb.', 'Element (zadatak, aktivnost) kontrolnog mehanizma', 'Odgovorna osoba', 'Rok / dinamika i dokaz'],
      ['1.', 'Nadzor nad poštivanjem i primjenom zakonskih propisa od strane zaposlenih (izvorno)', 'Školski odbor, direktor, svi zaposleni', 'Kontinuirano; zapisnici Školskog odbora, polugodišnji pregled'],
      ['2.', 'Stalna edukacija i upoznavanje s propisima (izvorno)', 'Direktor i svi zaposleni', 'Godišnji plan edukacija; liste prisutnih'],
      ['3.', 'Jačanje saradnje između organizacionih struktura škole (izvorno)', 'Direktor i svi zaposleni', 'Kontinuirano; teme integriteta na Nastavničkom vijeću najmanje dva puta godišnje'],
      ['4.', 'Praćenje provođenja mjera i polugodišnji izvještaj direktoru', 'Menadžer integriteta (osoba zadužena za nadzor)', 'Do 31. januara i 31. jula; pisani izvještaj'],
      ['5.', 'Godišnji izvještaj o provođenju plana Uredu za borbu protiv korupcije USK (čl. 49. i 50. Zakona): provedene mjere, neprovedene mjere i razlozi', 'Direktor; menadžer integriteta', 'Do 31. marta tekuće godine za prethodnu godinu; dokaz o dostavi'],
      ['6.', 'Razmatranje godišnjeg izvještaja na Školskom odboru', 'Direktor; predsjednik Školskog odbora', 'Do 31. marta; zaključak Školskog odbora'],
      ['7.', 'Procjena učinkovitosti plana svake druge godine (čl. 48. st. (2) Zakona)', 'Direktor; menadžer integriteta', 'Svake druge godine uz godišnji izvještaj; izvještaj o procjeni'],
      ['8.', 'Izmjena plana kad se značajno promijene radna mjesta, procesi ili propisi (čl. 48. st. (1) Zakona)', 'Direktor', 'Po potrebi; odluka o izmjeni'],
      ['9.', 'Dostava usvojenog plana Uredu (čl. 43. st. (3)) i objava na web stranici (čl. 47.)', 'Direktor; sekretar', '15 dana od usvajanja; link na objavu'],
      ['10.', 'Interne kontrole prema Pravilniku o internim kontrolama i internim kontrolnim postupcima', 'Direktor; knjigovođa', 'Prema Pravilniku; zapisnici'],
      ['11.', 'Revizija plana po isteku važenja (četiri godine od usvajanja – Uputstvo)', 'Direktor', 'Šest mjeseci prije isteka; odluka o izradi novog plana']], { size: 18 }),
    spacer(6),
    note('Sadržaj godišnjeg izvještaja (član 50. Zakona)', ['- podaci o tome koje su mjere iz plana provedene (uz indikatore iz dijela 11.2);', '- navođenje mjera koje nisu provedene;', '- razlozi zbog kojih mjere nisu provedene i novi rokovi.'], { fill: C.light, border: C.blue, tcolor: C.navy }),
  ];
}

// ─────────────────────────── 13. PRIJAVE
function prijave() {
  return [
    H1('13. Postupak prijave korupcije i zaštita prijavitelja'),
    P('Postupak je usklađen s članovima 13–37. Zakona o prevenciji korupcije u USK. Detaljna pravila uređuju se Pravilnikom o postupku internog prijavljivanja korupcije (član 22. Zakona), čije je donošenje mjera visokog prioriteta (M-Z10.1.1).'),
    H2('13.1. Ovlašteno lice'),
    P('Direktor rješenjem određuje ovlašteno lice za prijem i postupanje po prijavama korupcije (član 18. Zakona). U izvornoj verziji predloženo je da to bude sekretar škole, Semira Džakulić (kontakt: 037/543-536; osstijena@hotmail.com). Ovlašteno lice mora imati VII stepen stručne spreme, završen pravni fakultet (240 ECTS ili ekvivalent) i najmanje tri godine radnog iskustva nakon sticanja visoke stručne spreme; izuzetno, ovlašteno lice može biti lice sa VII stepenom druge vrste stručne spreme (član 18. st. (2) i (3) Zakona) [POTVRDITI ispunjenost uslova i broj rješenja].'),
    H2('13.2. Načini podnošenja prijave'),
    P('Prijava se može podnijeti (član 13. stav (2) Zakona):', { keepNext: true }),
    ...['putem protokola škole;', 'putem pošte;', 'putem elektronske pošte (osstijena@hotmail.com);', 'putem sandučeta s jasnom naznakom „ZA PRIJAVU KORUPCIJE“, postavljenog na vidnom i dostupnom mjestu (član 19. Zakona);', 'usmeno, na zapisnik kod ovlaštenog lica.'].map((t) => bullet(t)),
    P('Eksterna prijava podnosi se Uredu za borbu protiv korupcije Unsko-sanskog kantona (Bihaćkih branilaca 2, 77000 Bihać; 037/305-500; info@antikorupcijausk.ba; online prijava na web stranici Ureda). Interno prijavljivanje nije uslov za eksterno (član 23. Zakona).'),
    H2('13.3. Sadržaj prijave'),
    P('Prijava sadrži podatke o prijavitelju, podatke o instituciji, opis radnje ili ponašanja s konkretnim činjenicama i okolnostima, a po mogućnosti i podatke o licu za koje se sumnja da je izvršilo korupciju i raspoložive dokaze (član 15. Zakona). Ovlašteno lice dužno je postupati i po anonimnim prijavama koje sadrže podatke o instituciji i opis radnje (član 20. stav (5) Zakona).'),
    H2('13.4. Postupanje po prijavi'),
    ...['ovlašteno lice evidentira prijavu i utvrđuje da li sadrži propisane elemente; ako ne sadrži, poziva prijavitelja čiji je identitet poznat da je dopuni u roku od sedam dana (član 20.);', 'po potpunoj prijavi postupa bez odlaganja, a najkasnije u roku od 30 dana od prijema (član 21.);', 'osigurava zaštitu ličnih podataka i anonimnost prijavitelja;', 'poduzima mjere kojima se sprečava ili otklanja štetna radnja i mjere na utvrđivanju disciplinske i materijalne odgovornosti;', 'obavještava prijavitelja o poduzetim mjerama;', 'u slučaju sumnje na krivično djelo, prijavu prosljeđuje nadležnim organima.'].map((t) => bullet(t)),
    H2('13.5. Zaštita prijavitelja'),
    P('Prijavitelj ne smije trpiti posljedice zbog prijave korupcije (član 30. Zakona). Zabranjeno je stavljanje prijavitelja u nepovoljniji položaj, uključujući mobing, uznemiravanje, prijetnje, neravnopravan položaj u ostvarivanju prava iz radnog odnosa ili obrazovanja, raspoređivanje i druge štetne radnje (član 32.). Ako prijavitelj trpi ili može trpjeti štetne posljedice, škola je dužna odmah donijeti privremenu mjeru zaštite kojom se obustavlja svaka disciplinska, kadrovska ili druga mjera prema prijavitelju do okončanja postupka (član 30. stav (4)). Prijavitelj može tražiti internu zaštitu od direktora u roku od 30 dana od saznanja za štetnu radnju (član 36.), eksternu zaštitu pred sudom (član 37.) i status zaštićenog prijavitelja kod Ureda (član 31.). Zloupotreba prijavljivanja je zabranjena (član 33.).'),
    H2('13.6. Interni akt'),
    P('Škola donosi Pravilnik o postupku internog prijavljivanja korupcije i čini ga dostupnim svim zaposlenima (član 22. Zakona). Zakonski rok za donošenje pravilnika (30 dana od stupanja Zakona na snagu) je protekao, pa se pravilnik donosi odmah, a najkasnije u roku od 30 dana od usvajanja ovog plana [POTVRDITI da li je pravilnik već donesen].'),
  ];
}

// ─────────────────────────── 14. NACRTI AKATA
function nacrti() {
  const zag = () => [left('Broj: ______________', { after: 0 }), left('Datum: ______________')];
  return [
    H1('14. Nacrti akata za završni postupak'),
    note(null, ['[NACRT] Akti u ovom dijelu nisu doneseni. Tekst prati modele iz Uputstva. Brojeve, datume, imena i potpise upisuje direktor u trenutku donošenja.'], { fill: C.light, border: C.blue }),
    H2('14.1. Dopis Uredu za borbu protiv korupcije USK – zahtjev za mišljenje'),
    ...zag(),
    left('Ured za borbu protiv korupcije Unsko-sanskog kantona', { bold: true, after: 0 }), left('Bihaćkih branilaca 2, 77000 Bihać'),
    P('PREDMET: Nacrt Plana integriteta JU OŠ „Stijena“ – zahtjev za mišljenje', { bold: true }),
    P('Poštovani, u skladu s Fazom IV Uputstva za izradu i provođenje Plana integriteta u institucijama u Unsko-sanskom kantonu, dostavljamo Vam revidirani nacrt Plana integriteta JU OŠ „Stijena“ radi davanja mišljenja. Nacrt je usklađen sa Zakonom o prevenciji korupcije u Unsko-sanskom kantonu i navedenim Uputstvom, a u odnosu na verziju dostavljenu uz dopis broj 610-278/2026 od 31.03.2026. godine sadrži analizu svih zajedničkih i specifičnih oblasti, poseban analitički obrazac za svaki rizik, plan mjera s prioritetima, izvršiocima, rokovima i troškovima, te izvorne rezultate ankete zaposlenih. Molimo Vas da nam dostavite mišljenje, odnosno eventualne preporuke za doradu.'),
    left('Prilog: Nacrt Plana integriteta JU OŠ „Stijena“ (u elektronskoj i štampanoj formi).', { size: 19 }),
    ...signature('DIREKTOR ŠKOLE', 'Mersad Vatić'),
    H2('14.2. Odluka o usvajanju i provođenju plana integriteta', { pb: true }),
    ...zag(),
    P(`Na osnovu člana 43., 46., 47. i 49. ${ZAKON} i ${UPUTSTVO.replace('Uputstvo', 'Uputstva')}, a nakon pribavljenog pozitivnog mišljenja Ureda za borbu protiv korupcije Unsko-sanskog kantona broj ____________ od ____________, direktor Javne ustanove Osnovna škola „Stijena“ donosi`),
    center('ODLUKU', { bold: true, before: 120, after: 0 }), center('o usvajanju i provođenju Plana integriteta JU OŠ „Stijena“', { bold: true }),
    center('Član 1.', { bold: true, after: 60 }), P('Ovom odlukom usvaja se Plan integriteta Javne ustanove Osnovna škola „Stijena“ koji je pripremila radna grupa za izradu plana integriteta.'),
    center('Član 2.', { bold: true, after: 60 }), P('Stupanjem na snagu ove odluke razrješavaju se dužnosti menadžer/koordinator i članovi radne grupe za izradu plana integriteta (Odluka broj 610-93/2025 od 28.01.2025. godine i Odluka o izmjenama i dopunama broj ____________ od ____________).'),
    center('Član 3.', { bold: true, after: 60 }),
    P('(1) Za osobu zaduženu za nadzor nad provođenjem plana integriteta (menadžera integriteta) imenuje se: ______________________ (ime, prezime i funkcija).'),
    P('(2) Osoba zadužena za nadzor nad provođenjem plana integriteta prati provođenje Plana integriteta, a posebno dijela koji se odnosi na mjere za poboljšanje integriteta, daje prijedloge za njegovo unapređenje i podnosi direktoru polugodišnji izvještaj o provođenju plana.'),
    P('(3) Svi zaposleni u JU OŠ „Stijena“ dužni su obavijestiti osobu zaduženu za nadzor o situaciji, pojavi ili radnji koja na osnovu razumnog uvjerenja može dovesti do narušavanja integriteta institucije.'),
    P('(4) Zaposleni su dužni, na zahtjev osobe zadužene za nadzor, dostaviti potrebne podatke i informacije od značaja za provođenje plana integriteta, koje nisu u suprotnosti s važećim propisima.'),
    P('(5) Škola svake druge godine procjenjuje učinkovitost plana integriteta, u skladu s Uputstvom. Škola je dužna godišnje dostaviti Uredu izvještaj o provođenju plana integriteta, do 31. marta tekuće godine za prethodnu godinu.'),
    center('Član 4.', { bold: true, after: 60 }), P('Plan integriteta objavljuje se na web stranici škole i dostavlja Uredu za borbu protiv korupcije Unsko-sanskog kantona u roku od 15 dana od dana donošenja ove odluke. Plan važi četiri godine od dana usvajanja.'),
    center('Član 5.', { bold: true, after: 60 }), P('Ova odluka stupa na snagu danom donošenja.'),
    ...signature('DIREKTOR ŠKOLE', 'Mersad Vatić'),
    left('Dostavljeno: Uredu za borbu protiv korupcije Unsko-sanskog kantona; osobi zaduženoj za nadzor nad provođenjem Plana integriteta; članovima radne grupe; Školskom odboru (na znanje); web stranica; a/a.', { size: 19 }),
    H2('14.3. Rješenje o određivanju menadžera integriteta', { pb: true }),
    ...zag(),
    P(`Na osnovu člana 44. tačka f) i člana 46. stav (1) ${ZAKON}, direktor Javne ustanove Osnovna škola „Stijena“ donosi`),
    center('RJEŠENJE', { bold: true, before: 120, after: 0 }), center('o određivanju menadžera integriteta', { bold: true }),
    P('1. ______________________ (ime i prezime, funkcija) određuje se za menadžera integriteta JU OŠ „Stijena“ – lice odgovorno za provođenje Plana integriteta i osobu zaduženu za nadzor nad njegovim provođenjem.'),
    P('2. Menadžer integriteta prati provođenje mjera iz Plana integriteta, vodi evidenciju o njihovom provođenju, podnosi polugodišnji izvještaj direktoru i priprema godišnji izvještaj Uredu za borbu protiv korupcije USK, daje prijedloge za izmjenu plana i vodi registar izjava o sukobu interesa ako mu je to povjereno.'),
    P('3. Direktor i svi zaposleni dužni su menadžeru integriteta, na njegov zahtjev, dostaviti potrebne podatke i informacije od značaja za provođenje plana integriteta (član 46. stav (2) Zakona).'),
    P('4. Rješenje stupa na snagu danom donošenja Odluke o usvajanju i provođenju plana integriteta.'),
    ...signature('DIREKTOR ŠKOLE', 'Mersad Vatić'),
    H2('14.4. Rješenje o određivanju ovlaštenog lica za prijem i postupanje po prijavama korupcije', { pb: true }),
    ...zag(),
    P(`Na osnovu člana 18. ${ZAKON}, direktor Javne ustanove Osnovna škola „Stijena“ donosi`),
    center('RJEŠENJE', { bold: true, before: 120, after: 0 }), center('o određivanju ovlaštenog lica za prijem prijava korupcije i postupanje po prijavama', { bold: true }),
    P('1. ______________________ (ime i prezime, stručna sprema, radno mjesto) određuje se za ovlašteno lice za prijem prijava korupcije i postupanje po prijavama u JU OŠ „Stijena“.'),
    P('2. Ovlašteno lice postupa po prijavama u skladu s članovima 20. i 21. Zakona i Pravilnikom o postupku internog prijavljivanja korupcije, vodi evidenciju prijava i štiti identitet prijavitelja.'),
    P('3. Rješenje stupa na snagu danom donošenja.'),
    note('Uslov iz člana 18. Zakona', ['Ovlašteno lice mora imati VII stepen stručne spreme, završen pravni fakultet (240 ECTS ili ekvivalent) i najmanje tri godine radnog iskustva nakon sticanja VSS; izuzetno, VII stepen druge vrste stručne spreme. Prije donošenja rješenja potvrditi da predloženo lice ispunjava uslove [POTVRDITI].']),
    ...signature('DIREKTOR ŠKOLE', 'Mersad Vatić'),
  ];
}

// ─────────────────────────── 15. KONAČNI IZVJEŠTAJ
function konacni() {
  const vis = Rx.filter((r) => r.nivo === 'Visok');
  return [
    H1('15. Konačni izvještaj radne grupe (Izvještaj o stanju integriteta)'),
    note(null, ['[NACRT] Izvještaj radne grupe direktoru u smislu Faze III Uputstva (Prilog 1 uz plan integriteta). Zamjenjuje Konačni izvještaj broj 610-277/2026 od 31.03.2026. godine, koji se arhivira uz raniju verziju. Broj, datum i potpise upisuje radna grupa nakon razmatranja.'], { fill: C.light, border: C.blue }),
    ...[left('Broj: ______________', { after: 0 }), left('Datum: ______________')],
    left('Direktoru JU OŠ „Stijena“', { bold: true }),
    P('Radna grupa za izradu Plana integriteta JU OŠ „Stijena“ izradila je revidirani nacrt plana integriteta u skladu sa Zakonom o prevenciji korupcije u Unsko-sanskom kantonu i Uputstvom za izradu i provođenje Plana integriteta u institucijama u Unsko-sanskom kantonu. Ranija verzija, izrađena prema modelu Agencije za prevenciju korupcije i koordinaciju borbe protiv korupcije BiH, vraćena je na izmjenu i doradu.'),
    P('**Provedene aktivnosti:** analiza zakonskih, podzakonskih i internih akata; analiza opisa radnih mjesta; analiza rezultata anonimne ankete zaposlenih provedene 2025. godine (Prilog 2); identifikacija rizika u 11 zajedničkih i 7 specifičnih oblasti; analiza faktora rizika i postojećih kontrolnih mehanizama; ocjena intenziteta rizika i izrada prijedloga mjera.'),
    P(`**Rezultati:** identifikovano je ${N.uk} rizika, od čega ${N.vis} visokog, ${N.sre} srednjeg i ${N.niz} niskog intenziteta (radne ocjene). Predloženo je ${N.mj} mjera s izvršiocima, rokovima, procjenom troškova i indikatorima.`),
    P('**Rizici visokog intenziteta:**', { keepNext: true, after: 40 }),
    ...vis.map((r) => bullet(`${r.id} – ${r.naziv} (I = ${r.x})`)),
    P('**Zaključak:** Revidirana analiza ne potvrđuje raniji zaključak da u školi „ne postoje rizici osjetljivosti“. Nema dokumentovanih slučajeva korupcije [POTVRDITI], a zaposleni u velikoj mjeri imaju povjerenje u zakonitost rada. Ipak, postoje sistemske slabosti: mehanizam prijave korupcije nije poznat većini zaposlenih, sukob interesa se ne prepoznaje i ne upravlja se njime, a interni akti nisu dostupni na jednom mjestu. Radna grupa preporučuje da se mjere visokog prioriteta provedu u roku od 30 do 90 dana od usvajanja plana, a plan dosljedno provodi u svim aktivnostima škole, uz stručno, savjesno, nepristrasno i blagovremeno obavljanje poslova svih zaposlenih.'),
    P('**Prijedlog direktoru:** razmotriti nacrt, dostaviti ga Uredu za borbu protiv korupcije USK radi mišljenja i, nakon pozitivnog mišljenja, donijeti Odluku o usvajanju i provođenju plana integriteta.'),
    spacer(6),
    table([600, 3400, 2600, 3038], [['Rb.', 'Ime i prezime', 'Uloga', 'Potpis'], ...CLAN.map((c, i) => [`${i + 1}.`, c[0].replace(' [POTVRDITI pisanje prezimena]', ''), c[2].replace(' – PRIJEDLOG', ' (nakon imenovanja)'), ''])], { size: 19, cantSplit: true }),
  ];
}

// ─────────────────────────── PRILOG 2 – ANKETA (doslovno)
function anketa() {
  const Q = [
    ['A - Procjena rizičnih aktivnosti i podložnosti koruptivnom djelovanju'],
    ['1. Da li obavljate aktivnosti koje su, po Vašem mišljenju, podložne nepravilnostima, korupciji i koruptivnom dejstvu?', ['1. Da', '2. Ne']],
    ['2. Ukoliko obavljate aktivnosti koje su podložne nepravilnostima, korupciji i koruptivnom dejstvu (tzv.“rizične aktivnosti“), možete li navesti dva primjera za iste: Primjer broj 1:______________________________________________________________', ['Primjer broj 2:______________________________________________________________']],
    ['3. Da li smatrate da u Školi nedostaje neki interni akt koji se odnosi na neko osjetljivo područje?', ['1. Da', '2. Ne', 'U slučaju odgovora DA navedite koji __________________________________________']],
    ['4. Da li su svi interni propisi dostupni na jednom mjestu unutar Škole?', ['1. Da', '2. Ne', '3. Ne znam']],
    ['5. Da li se po Vašem mišljenju u radu Škole dosljedno provodi zakonska regulativa?', ['1. Da', '2. Ne', '3. Djelimično']],
    ['6. Kako biste ocijenili mehanizman odgovornosti u školi?', ['1. Odlična', '2. Dobra', '3. Nedovoljna', '4. Ne mogu to procijeniti']],
    ['7. Da li je bilo određenih pokušaja osoba unutar ili van Vaše institucije da utiču na profesionalne odluke Vas ili nekog Vašeg saradnika?', ['1. Da', '2. Ne', '3. Ne želim odgovoriti na ovo pitanje']],
    ['8. Da li ste upoznati sa načinom na koji možete anonimno prijaviti kršenje integriteta unutar Vaše institucije?', ['1. Da', '2. Ne']],
    ['9. Ako je odgovor DA, navedite način na koji možete anonimno prijaviti kršenje integriteta unutar Vaše institucije:', ['_________________________________________________________________________']],
    ['10. Da li u Vašoj instituciji postoje propisi koji se odnose na prihvatanje poklona ili znakova gostoprimstva?', ['1. Da', '2. Ne', '3. Ne znam']],
    ['11. Da li ste upoznati sa sadržajem Pravilnika kojim je regulisan prijem uposlenika u radni odnos?', ['1. Da', '2. Ne']],
    ['12. Da li biste prijavili slučajeve neregularnog zapošljavanja u Vašoj ustanovi, kršenja internih akata kao i ostale oblike nepravilnosti u radu ustanove?', ['1. Da', '2. Ne', '3. Ne znam kome bih prijavio/la navedne nepravilnosti']],
    ['13. Ocjenite radna mjesta prema podložnosti koruptivnim djelovanjima (5 – velika vjerovatnoća za korupciju, 4 – visoka vjerovatnoća, 3 - srednja vjerovatnoća, 2 – mala vjerovatnoća, 1 – nepostojanje prijetnje):', ['Direktor ____, profesor/nastavnik____, pedagog___, sekretar___, knjigovođa___, bibliotekar___, domar/ložač___, pomoćno tehničko osoblje___.']],
    ['B – Opis radnog mjesta , poslovna konsultacija i izvještavanje/ocjena rada'],
    ['14. Da li Vam je poznat opis Vašeg radnog mjesta?', ['1. Da', '2. Ne']],
    ['15. Da li se održavaju zajedničke poslovne konsultacije (sastanci) sa Vašim nadređenima i bliskim saradnicima?', ['1. Da', '2. Ne']],
    ['16. Ukoliko održavate zajedničke poslovne konsultacije (sastanke), navedite njihovu prosječnu učestalost?', ['1. Manje od jednom mjesečno', '2. Jednom mjesečno', '3. Više od jednom mjesečno']],
    ['17. Ukoliko održavate zajedničke poslovne konsultacije, navedite koliko često razgovarate na temu jačanja ličnog i institucionalnog integriteta?', ['1. Nikada', '2. Manje od jednom mjesečno', '3. Jednom mjesečno', '4. Više od jednom mjesečno']],
    ['18. Da li je Vaš nadređeni brzo i lahko dostupan za konsultacije?', ['1. Da', '2. Ne']],
    ['C- Profesionalni život u odnosu na privatni'],
    ['19. Da li ste ikada bili suočeni sa pitanjima/poslovima u kojima bi Vaše profesionalne odluke mogle ostaviti posljedice po vaš privatni život?', ['1. Da', '2. Ne']],
    ['20. Ukoliko je odgovor na prethodno pitanje „Da“, da li ste to pitanje/posao predali nekom drugom na rješavanje, da li ste tražili svoje izuzeće prilikom donošenja odluka ili ste uključili saradnika ili nadređenog pri donošenju odluke?', ['1. Da', '2. Ne', '3. Nisam znao kako bih postupio/la u navedenoj situaciji']],
    ['D – Kontakti sa osobama izvan Škole u okviru Vaših poslovnih aktivnosti'],
    ['21. Kontaktirate li sa osobama izvan Vaše institucije u okviru obavljanja Vaših redovnih poslovnih aktivnosti?', ['1.Da', '2.Ne']],
    ['22. Da li Vaš nadređeni zna sa kojim osobama izvan Vaše institucije kontaktirate u okviru obavljanja Vaših redovnih poslovnih aktivnosti?', ['1. Da', '2. Ne']],
    ['23. Da li je vaš nadređeni upoznat sa tematikom i prirodom tih kontakata?', ['1. Da', '2. Ne', '3. Ne znam']],
    ['E – Rezultati i njihov kvalitet'],
    ['24. U instituciji u kojoj sam zaposlen/a važnije je uraditi poslove/radne zadatke u skladu sa pravilima nego ih završiti na vrijeme.', ['1. Slažem se', '2. Niti se slažem, niti se ne slažem', '3. Ne slažem se']],
    ['25. U instituciji u kojoj sam zaposlen/a količina obavljenog posla je često važnija od kvaliteta obavljenog posla.', ['1. Slažem se', '2. Niti se slažem, niti se ne slažem', '3. Ne slažem se']],
    ['26. U instituciji u kojoj sam zaposlen/a često je dozvoljena improvizacija sa ciljem ostvarivanja rezultata.', ['1. Slažem se', '2. Niti se slažem, niti se ne slažem', '3. Ne slažem se']],
    ['27. U instituciji u kojoj sam zaposlen/a većina saradnika daje prednost vlastitim interesima u odnosu na profesionalni rad.', ['1. Slažem se', '2. Niti se slažem, niti se ne slažem', '3. Ne slažem se']],
    ['F - Upravljanje sredstvima i stvarima koje pripadaju školi'],
    ['28. Kako ocjenjujete opskrbu materijalom, sredstvima rada, prostorom za rad (prostorije, namještaj, oprema)?', ['1.Sasvim dovoljno', '2.Generalno dovoljno', '3.Nedovoljno, ali se snalazimo', '4.Nedovoljno i to prouzrokuje poteškoće u mom radu', '5.Ne mogu to procijeniti']],
    ['29. Da li ste čuli za slučajeve prevare, krađe ili drugih radnji koje predstavljaju kršenje integriteta unutar Vaše institucije?', ['1. Da', '2. Ne']],
    ['30. Da li, unutar Vaše institucije postoje izrađeni propisi/usvojene procedure koji se odnose na prethodno navedene slučajeve te da li se navedeni propisi/procedure provode u praksi?', ['1. Da', '2. Ne', '3. Ne znam']],
    ['31. Da li se izrađuje godišnji plan javnih nabavki u skladu sa odobrenim budžetskim sredstvima?', ['1. Da', '2. Ne', '3. Ne znam']],
    ['32. Da li postoje interni propisi kojima su regulisane procedure javnih nabavki u Školi?', ['1. Da', '2. Ne', '3. Ne znam']],
    ['33. Da li je u Vašoj instituciji imenovano lice koje ima zadatak da prati da li su zaposleni u sukobu interesa prilikom obavljanja djelatnosti?', ['1. Da', '2. Ne', '3. Ne znam']],
    ['34. Da li mislite da je potrebno imenovati lice koje će pratiti da li su zaposleni u sukobu interesa prilikom obavljanja djelatnosti?', ['1. Da', '2. Ne']],
    ['@Ukoliko imate dodatne napomene i komentare, odnosno prijedloge mjera za izbjegavanje rizika, molimo da navedete:', ['____________________________________________________________________________', '____________________________________________________________________________', '____________________________________________________________________________']],
  ];
  const upitnik = [];
  Q.forEach((q) => {
    if (q.length === 1) { upitnik.push(center(q[0], { bold: true, before: 200, after: 100, keepNext: true })); return; }
    const isNote = q[0].startsWith('@');
    upitnik.push(P(isNote ? q[0].slice(1) : q[0], { bold: !isNote, keepNext: true, after: 40, before: 100, align: AT.LEFT }));
    q[1].forEach((o, i) => upitnik.push(left(o, { after: 20, indent: { left: 567 }, keepNext: i < q[1].length - 1 })));
  });
  const rez = [
    'Radna grupa je izvršila analizu statusa quo kroz analizu upitnika za samoprocjenu integriteta. Upitnik je bio jednoobrazan za sve radnike i sastoji se od 34 pitanja, koja su grupisana u 6 oblasti. Upitnik su popunila 72 radnika, odnosno 96 % zaposlenih u školi. Tri zaposlenika nisu dostavila ispunjenu anketu.',
    'Oblasti navedene u upitniku su:',
    'A - Procjena rizičnih aktivnosti i podložnosti koruptivnom djelovanju;', 'B - Opis radnog mjesta, poslovna konsultacija i izvještavanje/ocjena rada;', 'C – Profesionalni život u odnosu na privatni', 'D - Kontakti sa osobama izvan škole u okviru Vaših poslovnih aktivnosti', 'E – Rezultati i njihov kvalitet', 'F - Upravljanje sredstvima i stvarima koje pripadaju školi.',
    'Upitnici su popunjavani ručno i anonimnost popunjavanja upitnika je bila osigurana. Radna grupa je analizu radila ručno po principu brojčanog i procentualnog iskazivanja odgovora na postavljena pitanja. Kasnije je primjenjena formula osjetljivosti na korupciju, kako bi se dobili podaci o intervalu osjetljivosti po pojedinim pitanjima, odnosno aspektima/dijelovima upitnika.',
    'U nastavku su prikazani važniji rezultati upitnika:',
    '@Dio A.',
    'Većina radnika (91,89%) svoja radna mjesta je ocijenila kao radna mjesta koja nisu podložna koruptivnom djelovanju (podmićivanje, utaja, pronevjera, favorizovanje). 83,78% radnika smatra da se u školi dosljedno provodi zakonska regulativa. Većina radnika (78,38%) ocijenilo je mehanizam odgovornosti u školi odličnim i dobrim. 47% radnika je upoznato gdje su dostupni interni akti unutar škole, 44% radnika ne zna gdje su dostupni interni akti unutar škole, a 81,08 % radnika ne smatra da u školi nedostaje neki interni akt koji se odnosi na neko osjetljivo područje (npr. ocjenjivanje učenika). 64,86% zaposlenih nije upoznato sa načinom na koji mogu anonimno prijaviti kršenje integriteta unutar institucije.',
    '@Dio B.',
    '97,30% radnika je upoznato sa opisom i odgovornostima radnog mjesta koje obavljaju.',
    '97,30% radnika održava zajedničke poslovne konsultacije sa nadređenima i bliskim saradnicima, pri čemu 16,22% radnika na pomenutim sastancima nikada nije razgovaralo na temu jačanja ličnog i institucionalnog integriteta. 100 % zaposlenih se slaže da im je nadređeni brzo i lahko dostupan za konsultacije.',
    '@Dio C.',
    '13,51% anketiranih je bilo suočeno sa pitanjima u kojima bi njihove profesionalne odluke mogle ostaviti posljedice po privatni život, od kojih niko pomenuta pitanja nije predao nekom drugom na rješavanje, odnosno uključio  saradnika ili nadređenog pri donošenju odluke.',
    '@Dio D.',
    '45,95% radnika kontaktira sa osobama izvan škole u okviru vlastitih poslovnih aktivnosti. Nadređeni u većini slučajeva nije upoznat sa vrstom, sadržajem i prirodom kontakata koji se ostvaruju sa osobama izvan škole u okviru poslovnih aktivnosti.',
    '@Dio E.',
    'Samo 10,81% radnika smatra da većina saradnika daje prednost vlastitim interesima u odnosu na profesionalni rad. Većina zaposlenih 64,86% se ne slaže kada je u pitanju količina obavljenog posla na uštrb kvaliteta, odnosno kada treba birati između posla urađenog po pravilima i posla urađenog na vrijeme.',
    '@Dio F.',
    '54,05 % zaposlenih smatra da je opskrba materijalom i sredstvima za rad sasvim, odnosno generalno dovoljna,a nema uposlenika koji smatraju da im nedovoljna opskrba materijalom prouzrokuje poteškoće u radu. 81,08% zaposlenih nikada čuo za slučajeve prevare, krađe ili drugih radnji koje predstavljaju kršenje integriteta u školi, dok 72,97% ne zna da li unutar škole postoje izrađeni propisi/procedure koji se odnose na prethodno navedeno. 86,49% radnika upoznato je da se godišnji plan javnih nabavki izrađuje u skladu sa potrebama i odobrenim budžetom, ali 40,54% ih ne zna da li postoje interni propisi kojima je regulisano provođenje postupaka javnih nabavki. 78,38% zaposlenih smatra da je potrebno imenovati lice koje će pratiti da li su zaposleni u sukobu interesa prilikom obavljanja djelatnosti.',
    'Radna grupa analizirala je rezultate upitnika primjenjujući formulu osjetljivosti na korupciju. Nakon analize upitnika utvrđeno je da u školi postoji mala mogućnost nastajanja koruptivnih radnji i pri tome su posljedice po instituciju neznatne.',
  ];
  return [
    H1('Prilog 2 – Upitnik za samoprocjenu integriteta i rezultati ankete'),
    note('Pravilo prijenosa', ['Upitnik i rezultati preneseni su doslovno iz izvorne verzije Plana (ver 2), uključujući numeraciju, formulacije, broj ispitanika i procente. Izmjene su isključivo tehničke i vizuelne (prijelom i raspored). Anketa je provedena i ne ponavlja se. Uočena neslaganja navedena su u posebnoj napomeni (P2.3) i ne mijenjaju izvorne podatke.'], { fill: C.light, border: C.blue, tcolor: C.navy }),
    H2('P2.1. Upitnik za samoprocjenu integriteta (izvorni tekst)'),
    P('NAPOMENA: Uposleni institucije upitnik za samoprocjenu integriteta ispunjavaju anonimno. Prilikom popunjavanja upitnika neophodno je označiti jedan odgovor na svako pitanje. Upitnik je sastavljen sa ciljem pružanja pomoći radnoj grupi za izradu plana integriteta.', { italics: true }),
    ...upitnik,
    H2('P2.2. Rezultati ankete – izvorni tekst analize (doslovni prijenos)', { pb: true }),
    ...rez.map((t) => (t.startsWith('@') ? P(t.slice(1), { bold: true, before: 120, after: 40, keepNext: true }) : /^[A-F] [-–]/.test(t) ? left(t, { indent: { left: 400 }, after: 20 }) : P(t))),
    H2('P2.3. Napomena za provjeru (odvojeno od izvornih podataka)', { pb: true }),
    P('Napomena je stručna kontrola izvornih podataka. Izvorni rezultati nisu mijenjani. Radna grupa treba provjeriti navedena neslaganja na osnovu izvornih (popunjenih) upitnika ili zbirne tabele i, ako je potrebno, sačiniti zapisnik o ispravci tehničke greške.', { size: 20 }),
    table([500, 3600, 5538], [['Rb.', 'Uočeno neslaganje', 'Obrazloženje i potrebna provjera'],
      ['1.', 'Broj ispitanika: 72 radnika (96%)', 'Svi procenti s dvije decimale (91,89; 83,78; 78,38; 81,08; 64,86; 97,30; 16,22; 13,51; 45,95; 10,81; 54,05; 72,97; 86,49; 40,54) odgovaraju razlomcima s nazivnikom 37 (npr. 34/37 = 91,89%; 24/37 = 64,86%), a ne nazivniku 72 (1/72 = 1,39%). Moguće je da je obrađeno 37 upitnika ili da su procenti računati na drugoj osnovi. [POTVRDITI stvarni broj obrađenih upitnika]'],
      ['2.', '72 radnika = 96% zaposlenih; tri zaposlenika nisu dostavila upitnik', 'Iz navedenog proizlazi 75 zaposlenih, dok je priznato 67,52 izvršilaca, a katalog radnih mjesta iskazuje 60,52. [POTVRDITI broj zaposlenih u vrijeme ankete]'],
      ['3.', 'Pitanje 4: 47% zna, 44% ne zna gdje su akti', 'Zbir je 91%; preostalih 9% (odgovor „Ne“ ili bez odgovora) nije iskazano. Procenti nisu iskazani s dvije decimale kao ostali.'],
      ['4.', 'Dio E: „64,86% se ne slaže kada je u pitanju količina … odnosno kada treba birati između posla po pravilima i posla na vrijeme“', 'Rečenica spaja tvrdnje iz pitanja 24 i 25, koje imaju suprotan smjer. Nije moguće utvrditi na koje se pitanje rezultat odnosi. [POTVRDITI]'],
      ['5.', 'Pitanja bez iskazanog rezultata', 'Nisu iskazani rezultati pitanja 2, 7, 9, 10, 11, 12, 13, 16, 22, 23, 26 i 33, ni dodatni komentari. Ti podaci su važni za rizike Z7.2, Z9.1, Z5.1 i analizu radnih mjesta (8.4). [DOPUNITI iz izvornih upitnika, bez izmjene postojećih rezultata]'],
      ['6.', 'Izvorna analiza (Izvještaj o integritetu) navodi da se konsultacije „u pravilu odvijaju dva puta godišnje“', 'Ponuđeni odgovori na pitanje 16 su „manje od jednom mjesečno“, „jednom mjesečno“ i „više od jednom mjesečno“; navod nije moguće izvesti iz ponuđenih odgovora. [POTVRDITI]'],
      ['7.', 'Formula osjetljivosti na korupciju', 'Formula i međurezultati nisu prikazani pa zaključak nije moguće provjeriti. Formula nije dio metodologije Uputstva iz 2026.'],
      ['8.', 'Datum i način provođenja ankete', 'Program predviđa provođenje do 14.02.2025.; stvarni datum distribucije i rok popunjavanja nisu navedeni (Uputstvo preporučuje rok od 3 do 10 dana). [POTVRDITI]']], { size: 17 }),
  ];
}

// ─────────────────────────── DOKUMENT
const hf = L.headerFooter('JU OŠ „Stijena“ – Plan integriteta (revidirani nacrt, 2026)');
const emptyHF = { headers: { first: new d.Header({ children: [new d.Paragraph('')] }) }, footers: { first: new d.Footer({ children: [new d.Paragraph('')] }) } };
const sec = (props, children, first = false) => ({ properties: { ...props, ...(first ? { titlePage: true } : {}) }, headers: { ...hf.headers, ...(first ? emptyHF.headers : {}) }, footers: { ...hf.footers, ...(first ? emptyHF.footers : {}) }, children });

const doc = new d.Document({
  creator: 'Radna grupa za izradu Plana integriteta JU OŠ „Stijena“',
  title: 'Plan integriteta JU OŠ „Stijena“ – revidirani nacrt 2026',
  description: 'Revidirani nacrt Plana integriteta usklađen sa Zakonom o prevenciji korupcije u USK (24/25) i Uputstvom (2026)',
  styles: L.STYLES, numbering: L.NUMBERING, features: { updateFields: true },
  sections: [
    sec(L.portrait, [...naslovna(), new d.Paragraph({ pageBreakBefore: true, children: [] }), ...L.toc('Sadržaj'), ...osnovne(), ...uvod(), ...odluke(), ...obavjestenje(), ...program(), ...okvir(), ...organizacija(), ...izvjestajIntegritet(), ...metodologija()], true),
    sec(L.landscape, [...registar(), ...obrasci()]),
    sec(L.portrait, [...statusQuo(), ...preporuke()]),
    sec(L.landscape, [...mjereTabela()]),
    sec(L.portrait, [...kontrola(), ...prijave(), ...nacrti(), ...konacni(), ...anketa()]),
  ],
});

d.Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(OUT, buf); console.log('OK', OUT, buf.length, N); });
