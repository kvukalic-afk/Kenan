// Izvještaj o reviziji Plana integriteta JU OŠ „Stijena“ (istraživanje, uporedna analiza, ispravke, kontrolna lista, podaci za potvrdu).
const fs = require('fs');
const path = require('path');
const L = require('./lib');
const { d, C, P, center, left, bullet, H1, H2, spacer, table, kv, note, W_PORTRAIT: WP, AlignmentType: AT } = L;
const { R, OBLASTI, intenzitet } = require('./rizici');
const OUT = process.argv[2] || path.join(__dirname, '..', 'Izvjestaj_o_reviziji_Plana_integriteta_JU_OS_Stijena_2026.docx');
const Rx = R.map((r) => ({ ...r, ...intenzitet(r.v, r.p) }));
const MJ = Rx.reduce((a, r) => a + r.m.length, 0);

const URL = {
  upu: 'https://antikorupcijausk.ba/V2/wp-content/uploads/2026/03/Uputstvo-za-izradu-i-provodjenje-Plana-integriteta-u-institucijama-u-Unsko-sanskom-kantonu.docx',
  zak: 'https://antikorupcijausk.ba/V2/wp-content/uploads/2025/12/Zakon-o-prevenciji-korupcije-u-Unsko-sanskom-kantonu.pdf',
  reg: 'https://antikorupcijausk.ba/V2/planovi-integriteta/',
  par: 'https://www.paragraf.ba/sluzbena-glasila/arhiva-sluzbenog-glasnika-unsko-sanskog-kantona.html',
  ured: 'https://antikorupcijausk.ba/V2/wp-content/uploads/2025/12/Plan-integriteta-Ureda-za-borbu-protiv-korupcije-Unsko-sanskog-kantona.pdf',
  min: 'https://vladausk.ba/v4//files/media/pdf/6994f803182fe4.15409565_Plan%20integriteta%20decembar%202024..pdf',
  web: 'https://os-stijena.edu.ba/dokumenti/',
};

// Škole s registra Ureda (stranica „Planovi integriteta“, podaci učitani 21. 11. 2026.) – broj identifikovanih rizika
const SKOLE = [['JU OŠ „Gornje Prekounje – Ripač“ Bihać', 39], ['JU OŠ „Kulen-Vakuf, Orašac“ Kulen Vakuf', 38], ['JU „Mašinsko-saobraćajna mješovita srednja škola“ Bihać', 35], ['JU OŠ „Harmani I“ Bihać', 32], ['JU OŠ „Jezerski“ Bosanska Krupa', 29],
  ['JU OŠ „Prva sanska škola“ Sanski Most', 24], ['JU OŠ „Hasan Kikić“ Sanski Most', 24], ['JU OŠ „Skender Kulenović“ Sanski Most (II)', 24], ['JU OŠ „Vrhpolje“ Sanski Most', 24], ['JU OŠ „Prva osnovna škola“ Bosanska Krupa', 23], ['JU OŠ „Gata Ilidža – Vrsta“ Bihać', 23],
  ['JU OŠ „Ostrožac“ Cazin', 22], ['JU „Gimnazija“ Sanski Most', 22], ['JU „Mješovita srednja škola“ Sanski Most', 22], ['JU „Gimnazija“ Velika Kladuša', 22], ['JU OŠ „Pećigrad“ Cazin', 22],
  ['JU OŠ „Podzvizd“ Velika Kladuša', 21], ['JU OŠ „Skender Kulenović“ Sanski Most', 21], ['JU OŠ „1. Mart“ Velika Kladuša', 21], ['JU OŠ „Todorovo“ Velika Kladuša', 21], ['JU OŠ „Crvarevac“ Velika Kladuša', 21], ['JU „Druga srednja škola“ Velika Kladuša', 21],
  ['JU OŠ „Donja Vidovska“ Velika Kladuša', 20], ['JU OŠ „Cazin I“ Cazin', 19], ['JU OŠ „Prva osnovna škola“ Velika Kladuša', 19], ['JU „Mješovita elektrotehnička i drvoprerađivačka srednja škola“ Bihać', 19], ['JU OŠ „Skokovi“ Cazin', 19], ['JU „I srednja škola dr. Husein Džanić“ Velika Kladuša', 19], ['JU OŠ „5. Oktobar“ Sanski Most', 19],
  ['JU „Srednja poljoprivredna škola Sanus Futurum“ Sanski Most', 18], ['JU „Gimnazija Bihać“ Bihać', 17], ['JU OŠ „Prekounje“ Bihać', 17], ['JU „Mješovita srednja škola“ Bihać', 16], ['JU OŠ „Lejla Hairlahović Hušić“ Cazin', 16], ['JU OŠ „Šturlić“ Cazin', 15],
  ['JU OŠ „Sead Ćehić“ Velika Kladuša', 14], ['JU OŠ „Sanica“ Ključ', 14], ['JU OŠ „Mirsad Salkić“ Bužim', 13], ['JU OŠ „Liskovac“ Cazin', 13], ['JU OŠ „Gornja Koprivna“ Cazin', 12], ['JU OŠ „Mahala“ Sanski Most', 11], ['JU OŠ „Ahmet Hromadžić“ Bosanski Petrovac', 10],
  ['JU OŠ „25. Novembar“ Velika Kladuša', 8], ['JU „Mješovita srednja škola prof. Omer Filipović“ Ključ', 8], ['JU OŠ „Velagići“ Ključ', 8], ['JU OŠ „Otoka“ Bosanska Otoka', 8], ['JU OŠ „Harmani II“ Bihać', 8], ['JU OŠ „Fadil Bilal“ Velika Kladuša', 8], ['JU OŠ „Ćoralići“ Cazin', 8], ['JU OŠ „Druga osnovna škola“ Bosanska Krupa', 8], ['JU OŠ „Ključ“ Ključ', 8], ['JU „Medicinska škola“ Bihać', 8],
  ['JU OŠ „Suljo Mirvić“ Bužim', 6], ['JU „Gimnazija“ Cazin', 6], ['JU OŠ „Bužim“ Bužim', 5], ['JU „Mješovita srednja škola Bosanski Petrovac“ Bosanski Petrovac', 5], ['JU OŠ „Todorovska Slapnica“ Velika Kladuša', 3]];

function naslovna() {
  return [
    new d.Paragraph({ alignment: AT.CENTER, children: [L.image('slike/memorandum.png', 560, 157)], spacing: { after: 500 } }),
    center('JU OSNOVNA ŠKOLA „STIJENA“', { bold: true, size: 28, color: C.navy, after: 400 }),
    center('IZVJEŠTAJ O REVIZIJI PLANA INTEGRITETA', { bold: true, size: 40, color: C.navy, after: 160 }),
    center('Istraživanje izvora, uporedna analiza, pregled ispravki, kontrolna lista usklađenosti i spisak podataka za službenu potvrdu', { size: 22, color: C.blue, after: 600 }),
    kv([
      ['Predmet revizije', 'Plan integriteta JU OŠ „Stijena“, verzija 2 (dokument „Plan integriteta-ver 2.docx“)'],
      ['Rezultat revizije', 'Revidirani nacrt Plana integriteta (DOCX i PDF), novembar 2026.'],
      ['Mjerodavni propisi', 'Zakon o prevenciji korupcije u USK (Sl. glasnik USK 24/25); Uputstvo za izradu i provođenje Plana integriteta u institucijama u USK (Vlada USK, 17. 3. 2026.)'],
      ['Namjena', 'Radni materijal za radnu grupu i direktora škole; nije službeni akt škole'],
      ['Datum', '21. 11. 2026.'],
    ], 2600),
    spacer(20),
    note('Ograničenja', ['Izvještaj ne garantuje pozitivno mišljenje Ureda za borbu protiv korupcije USK. Njegov cilj je da dokument bude potpun, provjerljiv i usklađen s propisima. Sve tvrdnje o drugim institucijama zasnivaju se isključivo na javno dostupnim izvorima navedenim u dijelu 1, odnosno na dokumentu koji je dostavljen uz zadatak.']),
  ];
}

function izvori() {
  return [
    H1('1. Izvori i hijerarhija'),
    P('Primijenjena je hijerarhija izvora: (1) važeći propisi i zvanično Uputstvo USK; (2) provjereni podaci JU OŠ „Stijena“; (3) primjeri drugih institucija, i to samo ako su u skladu s Uputstvom. Nijedan podatak, rezultat ankete ni ocjena rizika drugih institucija nisu preuzeti.'),
    table([400, 3300, 3700, 2238], [['Rb.', 'Izvor', 'Poveznica / porijeklo', 'Status provjere'],
      ['1.', 'Zakon o prevenciji korupcije u Unsko-sanskom kantonu, Sl. glasnik USK 24/25 (29. 10. 2025.)', URL.zak, 'Pročitan cijeli tekst. Stupa na snagu osmog dana od objave; primjena od 1. 1. 2026. (čl. 60.). Ispravka (Sl. glasnik USK 3/26) nije dostupna – potvrditi.'],
      ['2.', 'Uputstvo za izradu i provođenje Plana integriteta u institucijama u USK (Vlada USK, 16. sjednica, 17. 3. 2026.), s modelima i obrascima', URL.upu, 'Pročitan cijeli tekst s prilozima (verzija objavljena na stranici Ureda 30. 3. 2026.). Prema arhivi Paragraf objavljeno je u Sl. glasniku USK 11/2026 od 8. 5. 2026. – potvrditi.'],
      ['3.', 'Arhiva Službenog glasnika USK (Paragraf)', URL.par, 'Korištena za broj i datum glasila; puni tekstovi su iza prijave.'],
      ['4.', 'Ured za borbu protiv korupcije USK – stranica „Planovi integriteta“ (registar)', URL.reg, 'Pročitani podaci: 220 institucija u obavezi; 145 usvojilo; 31 u procesu; 44 nije pristupilo; broj rizika za 143 institucije.'],
      ['5.', 'Plan integriteta JU OŠ „Liskovac“, Cazin (DOCX, posljednja izmjena 7. 2. 2025.)', 'Dostavljen uz zadatak; javna objava nije pronađena', 'Analiziran u cjelini (dio 3).'],
      ['6.', 'Plan integriteta JU OŠ „Harmani II“, Bihać', 'Nije pronađen na internetu; web domen škole nije dostupan', 'Nije moguće analizirati. Registar Ureda navodi 8 rizika.'],
      ['7.', 'Plan integriteta Ministarstva za pitanja boraca i RVI USK (decembar 2024.)', URL.min, 'Korišten samo kao primjer strukture i definicija kantonalnog organa; nije škola.'],
      ['8.', 'Plan integriteta Ureda za borbu protiv korupcije USK', URL.ured, 'Skenirani PDF bez tekstualnog sloja; nije analiziran.'],
      ['9.', 'Web stranica JU OŠ „Stijena“', URL.web, 'Rubrika „Dokumenti“: „Dokumenti još nisu objavljeni“ (21. 11. 2026.). Adresa: Stijena bb, 77224 Cazin.'],
      ['10.', 'Plan integriteta JU OŠ „Stijena“, verzija 2', 'Dostavljen uz zadatak (DOCX)', 'Analiziran u cjelini; stranice iz PDF prikaza (38 stranica).']], { size: 17 }),
    spacer(6),
    note('Razlika između objave, usvajanja i pozitivnog mišljenja', [
      '- Objava: dokument je javno dostupan. Objava sama ne dokazuje ni usvajanje ni mišljenje.',
      '- Formalno usvajanje: postoji odluka rukovodioca o usvajanju i provođenju plana.',
      '- Pozitivno mišljenje: pisani akt Ureda (broj i datum) kojim se potvrđuje usklađenost nacrta. Prema Uputstvu prethodi usvajanju.',
      '- Registar Ureda prikazuje broj identifikovanih rizika po instituciji i zbirne podatke o usvajanju, ali ne navodi broj i datum mišljenja za pojedinačnu instituciju. Zato ni za jedan pronađeni plan nije bilo moguće provjeriti dokaz pozitivnog mišljenja.',
    ], { fill: C.light, border: C.blue, tcolor: C.navy }),
  ];
}

function istrazivanje() {
  const half = Math.ceil(SKOLE.length / 2);
  const rows = [];
  for (let i = 0; i < half; i++) {
    const a = SKOLE[i]; const b = SKOLE[i + half];
    const hl = (x) => (x && /Liskovac|Harmani II/.test(x[0]) ? C.mid : undefined);
    rows.push([{ t: a[0], fill: hl(a) }, { t: String(a[1]), align: AT.CENTER, fill: hl(a) }, { t: b ? b[0] : '', fill: hl(b) }, { t: b ? String(b[1]) : '', align: AT.CENTER, fill: hl(b) }]);
  }
  return [
    H1('2. Istraživanje planova integriteta u Unsko-sanskom kantonu'),
    H2('2.1. Zbirni podaci Ureda'),
    P('Prema stranici „Planovi integriteta“ Ureda za borbu protiv korupcije USK (podaci preuzeti 21. 11. 2026.), obavezu donošenja plana ima 220 institucija: 145 je usvojilo plan (65,9%), 31 je u procesu, a 44 nisu pristupile izradi. Za 143 institucije objavljen je broj identifikovanih rizika (prosječno oko 25). Od toga je 56 osnovnih i srednjih škola. JU OŠ „Stijena“ nije na listi institucija s objavljenim brojem rizika.'),
    H2('2.2. Škole na registru Ureda (broj identifikovanih rizika)'),
    P('Uputstvo iz 2026. zahtijeva najmanje dva rizika za svaku od 11 zajedničkih oblasti (najmanje 22), uz rizike u specifičnim oblastima. Planovi s manjim brojem rizika najvjerovatnije su doneseni prije Uputstva iz 2026. i nisu pogodni kao kvantitativni uzor. Označene su škole iz zadatka.', { size: 19 }),
    table([3900, 919, 3900, 919], [['Škola', 'Rizici', 'Škola', 'Rizici'], ...rows], { size: 16 }),
    spacer(6),
    note('Zaključak istraživanja', [
      '- Na javnim web stranicama nije pronađen nijedan plan osnovne škole iz USK uz koji je objavljen dokaz pozitivnog mišljenja Ureda (broj i datum).',
      '- JU OŠ „Liskovac“: na registru Ureda s 13 rizika; dostavljeni dokument (februar 2025.) sadrži 11 rizičnih procesa, pa nije potvrđeno da je riječ o istoj verziji. Status mišljenja nije provjerljiv.',
      '- JU OŠ „Harmani II“: na registru Ureda s 8 rizika; dokument nije javno dostupan. Status mišljenja nije provjerljiv.',
      '- Zbog toga je kao jedini mjerodavni uzor primijenjeno Uputstvo iz 2026. s modelima obrazaca, a primjeri su korišteni samo za dobru praksu u formi.',
    ]),
  ];
}

function uporedna() {
  return [
    H1('3. Uporedna analiza'),
    H2('3.1. Stijena (ver 2), Liskovac i revidirani nacrt u odnosu na Uputstvo'),
    table([1900, 2100, 1950, 1950, 1738], [['Kriterij', 'Zahtjev Uputstva / Zakona', 'Stijena ver 2', 'Liskovac (feb. 2025.)', 'Revidirani nacrt Stijena'],
      ['Pravni osnov', 'Zakon USK 24/25 (čl. 43); Uputstvo 2026; Strategija USK 2023–2027', 'Strategija 2015–2019; pravila Agencije BiH', 'Zakon o Agenciji BiH; Strategija USK 2023–2027; pozivanje na „Zakon o prevenciji i suzbijanju korupcije u USK“ (u februaru 2025. nije postojao)', 'Usklađeno; izvorni akti nepromijenjeni, nacrti novih akata'],
      ['Menadžer integriteta', 'Rješenje rukovodioca (čl. 46. Zakona); menadžer/koordinator u odluci', 'Koordinator; nema rješenja', 'Rješenje o menadžeru (dobra praksa)', 'Koordinator kao menadžer u nacrtu odluke; nacrt rješenja (14.3)'],
      ['Radna grupa', 'Najčešće 3–5 članova, po potrebi više, prema veličini institucije', '6 osoba', '5 osoba', '7 osoba (dopuna psihologom), uz obrazloženje'],
      ['Program rada', 'Zadaci članova, rokovi, način praćenja', 'Faze i rokovi; bez zadataka po članovima i načina praćenja', 'Faze i rokovi; zapisnici 4 sastanka (dobra praksa)', 'Faze, rokovi, zaduženja, način praćenja, zapisnici'],
      ['Oblasti', '11 zajedničkih + specifične', '6 opisnih oblasti', '8 općih + 3 specifične', '11 zajedničkih + 7 specifičnih'],
      ['Broj rizika', 'Najmanje 2 po oblasti; poseban obrazac za svaki rizik', '6 rizika u jednoj tabeli', '11 rizičnih procesa', `${Rx.length} rizika, ${Rx.length} obrazaca`],
      ['Faktori S/O/I/P i kontrole', 'Obavezno', 'Ne', 'Da (dobra praksa)', 'Da, uz ocjenu djelotvornosti'],
      ['Skala V × P', '1–3 × 1–3; nizak 1–2, srednji 3–4, visok 6–9', 'Opisne ocjene bez skale', 'Skala 1–3, ali s posljedicom „4“ kod jednog rizika i neusklađenim nivoom u zbirnoj tabeli', 'Skala Uputstva; radne ocjene s izvorom ocjene'],
      ['Mjere', 'Rizik, mjera, prioritet, aktivnosti, izvršilac i rok, troškovi', 'Bez veze s rizicima, bez troškova', 'Prioritet, izvršilac, troškovi, indikatori; bez kolone aktivnosti', `${MJ} mjera s aktivnostima, troškovima i indikatorima`],
      ['Anketa', 'Anonimna; statistička obrada; rezultati u Izvještaju o stanju integriteta', 'Narativni rezultati; neusklađen broj ispitanika', 'Tabelarna obrada po pitanjima (dobra praksa), uz računske greške', 'Izvorni rezultati doslovno u Prilogu 2; napomena o neslaganjima'],
      ['Završni akti', 'Nacrt odluke o usvajanju; mišljenje Ureda; dostava; objava', 'Konačni izvještaj potpisuje direktor; mišljenje se traži od Agencije', 'Mišljenje se traži od Agencije', 'Nacrti: dopis Uredu, odluka o usvajanju, rješenja (14.1–14.4)'],
      ['Prijave i zaštita prijavitelja', 'Čl. 13–37. i 18, 19, 22. Zakona', 'Djelimično; bez uslova iz čl. 18, natpisa i eksterne prijave', 'Opisano kroz rizike', 'Usklađeno sa Zakonom (dio 13)']], { size: 16 }),
    H2('3.2. Preuzeta dobra praksa i ono što nije preuzeto'),
    P('**Preuzeto (u skladu s Uputstvom):** rješenje o menadžeru integriteta; poseban analitički obrazac po riziku s faktorima S/O/I/P; kolona indikatora u tabeli mjera; vođenje zapisnika sa sastanaka radne grupe; jasno razdvajanje zajedničkih i specifičnih oblasti.'),
    P('**Nije preuzeto:** ocjene rizika, rezultati ankete, broj i vrsta rizika, specifični rizici Liskovca (npr. nevažeća Pravila škole); ocjena posljedice izvan skale; pravni osnov koji se poziva na nepostojeći zakon; traženje mišljenja od Agencije umjesto od Ureda.'),
    P('**Pouke iz grešaka u primjeru:** računske greške u obradi ankete (npr. „Da: 2 … 96,15%“), datumi koji prethode imenovanju radne grupe i nesklad zbirne i pojedinačne ocjene intenziteta pokazuju potrebu za završnom kontrolom brojeva i datuma. Ta kontrola je provedena u revidiranom nacrtu Stijene (dio 4 i Prilog 2, napomena P2.3).'),
  ];
}

function ispravke() {
  const rows = [
    ['1', 'Naslovna: „Cazin, juni 2021. godine“, neusklađeno s aktima iz 2025/2026.', 'Datum nacrta (novembar 2026.), status dokumenta, memorandum i fotografija zadržani', 'Naslovna'],
    ['2', '„Datum usvajanje plana 28.01.2025.“ – plan nije usvojen; to je datum Odluke o izradi', 'Upisuje se nakon pozitivnog mišljenja i Odluke o usvajanju', '1'],
    ['2', 'Osoba za nadzor navedena prije usvajanja', 'Označena kao prijedlog; imenuje se Odlukom o usvajanju', '1, 14.2'],
    ['3–5', 'Nabrajanja iz „Postupka prijave korupcije“ formatirana kao naslovi 1. nivoa ulaze u sadržaj', 'Ispravljena hijerarhija naslova; automatski sadržaj', 'Sadržaj, 13'],
    ['6', 'Obaveza izrade pripisana Agenciji BiH i Strategiji Vijeća ministara', 'Pravni osnov: čl. 43. Zakona USK, Uputstvo 2026, Strategija USK 2023–2027; dodata hronologija postupka i zakonski rokovi', '2.1, 2.2'],
    ['7', 'Odluka 610-93/2025: osnov Strategija 2015–2019; prezime „Džakilić“', 'Izvorni akt prenesen bez izmjena, uz napomenu; nacrt Odluke o izmjenama i dopunama', '3.1, 3.2'],
    ['8', 'Obavijest 610-94/2025: „Edina Pehlić“; pozivanje na pravila Agencije', 'Izvorni akt nepromijenjen; nacrt nove obavijesti prema modelu Uputstva', '4.1, 4.2'],
    ['9–11', 'Program: datum 30.01.2025. naspram „Stijena, 31.03.2026.“; mišljenje Agencije umjesto Ureda; bez zaduženja i načina praćenja; „mjeta“', 'Izvorni program prenesen s napomenom; revidirani program', '5.1, 5.2'],
    ['12–13', 'Zakonski okvir bez Zakona USK 24/25, Uputstva, Strategije USK i Zakona o zaštiti ličnih podataka; bez brojeva glasila', 'Dopunjeno; neprovjereni brojevi glasila označeni za potvrdu; popis obaveznih internih akata', '6'],
    ['14', '„Pedagoški standardi … za srednje obrazovanje“; „Stručni radadnici“', 'Ispravljeno na osnovno obrazovanje; pravopis', '7.1'],
    ['15–20', 'Katalog: psiholog i socijalni radnik bez procjene odgovornosti; zbir 60,52 naspram 67,52 izvršilaca; pravopisne greške', 'Prijedlog procjene; napomena o neusklađenosti; tehničke ispravke', '7.1, 7.2'],
    ['21', 'Brojevi članova zakona i Pravila škole za nadležnosti nisu provjerljivi', 'Zadržano, označeno za potvrdu; dodata tabela nivoa odlučivanja', '7.3'],
    ['21–23', 'Izvještaj o integritetu: „nisu uočeni rizici“, u suprotnosti s rezultatima ankete (64,86%, 44%, 13,51%)', 'Revidirana tabela: izvorna ocjena, rezultat ankete i stručna procjena odvojeni', '8.1–8.3'],
    ['24–26', 'Skala 1–5 za radna mjesta miješana s procjenom rizika; rezultati pitanja 13 ne postoje', 'Zadržano za čl. 44. tač. b) Zakona, uz razgraničenje od metodologije Uputstva', '8.4, 8.5'],
    ['27', 'Tabela procjene: 6 rizika, opisne ocjene, bez faktora i kontrola; naslov formatiran kao Heading 1', `${Rx.length} rizika u 18 oblasti, poseban obrazac za svaki; izvorne ocjene prevedene na skalu`, '9'],
    ['28–29', 'Rezultati ankete u glavnom tekstu; 72 ispitanika naspram procenata na bazi 37', 'Doslovno premješteni u Prilog 2; interpretacija odvojena; napomena P2.3', '10.1, Prilog 2'],
    ['29', '„Ne postoje pravne praznine“', 'Utvrđene praznine u odnosu na Zakon USK', '10.2'],
    ['30–31', 'Preporuke: skala prioriteta 1–5, prazna kolona prioriteta, rokovi „kontinuirano“ bez dinamike', 'Prioriteti prema Uputstvu, veza s rizicima, dinamika provjere', '11.1'],
    ['31', 'Mjere: 7 mjera bez veze s rizicima, aktivnosti, troškova i indikatora; „pravilnik o transparentnom zapošljavanju“ izvan nadležnosti škole', `${MJ} mjera prema obrascu Uputstva; mapiranje 7 izvornih mjera`, '11.1, 11.2'],
    ['31', 'Kontrolni mehanizmi uopćeni; nema izvještavanja Uredu, procjene učinkovitosti ni objave', 'Dopunjeno čl. 43, 47–50. Zakona', '12'],
    ['32–33', 'Prijave: bez uslova za ovlašteno lice (čl. 18), natpisa (čl. 19), dopune u 7 dana i anonimnih prijava (čl. 20), eksterne prijave (čl. 23) i zaštite (čl. 30–37); „Džaklić“', 'Usklađeno sa Zakonom', '13'],
    ['33', 'Konačni izvještaj 610-277/2026 potpisuje direktor; navodi model Agencije i tvrdi da rizika nema', 'Nacrt izvještaja radne grupe direktoru (Prilog 1 u smislu Uputstva)', '15'],
    ['34–37', 'Upitnik u sredini dokumenta', 'Doslovno prenesen na kraj, uz izvorne rezultate', 'Prilog 2'],
    ['38', 'Dopis 610-278/2026 bez navedenog adresata', 'Nacrt dopisa Uredu za borbu protiv korupcije USK', '14.1'],
    ['—', 'Nedostaju nacrti Odluke o usvajanju, Rješenja o menadžeru i Rješenja o ovlaštenom licu', 'Dodani prema modelima Uputstva i Zakona', '14.2–14.4'],
  ];
  return [
    H1('4. Pregled važnijih ispravki (sa stranicama originala)'),
    P('Stranice se odnose na PDF prikaz izvorne datoteke „Plan integriteta-ver 2.docx“ (38 stranica). U programu Microsoft Word prijelom može odstupati za jednu stranicu. Kolona „Nacrt“ upućuje na dio revidiranog nacrta.', { size: 19 }),
    table([800, 3900, 3638, 1300], [['Str.', 'Uočeni nedostatak (original)', 'Ispravka u revidiranom nacrtu', 'Nacrt (dio)'], ...rows], { size: 16 }),
  ];
}

function kontrolna() {
  const OK = { t: 'Ispunjeno', fill: C.ok }; const DJ = { t: 'Djelimično', fill: C.mid }; const NE = { t: 'Škola dostavlja', fill: C.hi };
  const rows = [
    ['Uputstvo – sadržaj', 'Osnovne informacije o instituciji (model)', '1', OK, 'Datum usvajanja i osoba za nadzor upisuju se nakon mišljenja'],
    ['Uputstvo – sadržaj', 'Odluka o izradi plana', '3.1, 3.2', DJ, 'Postoji 610-93/2025; nacrt izmjena čeka potpis direktora'],
    ['Uputstvo – sadržaj', 'Obavijest zaposlenima', '4.1, 4.2', DJ, 'Postoji 610-94/2025; nova obavijest u nacrtu'],
    ['Uputstvo – sadržaj', 'Program rada (zadaci, rokovi, način praćenja)', '5.2', DJ, 'Odobrava direktor'],
    ['Uputstvo – sadržaj', 'Tabelarni pregled identifikovanih, analiziranih i procijenjenih rizika', '9.3', OK, `${Rx.length} rizika`],
    ['Uputstvo – sadržaj', 'Mjere i preporuke za unapređenje integriteta', '11', OK, `${MJ} mjera`],
    ['Uputstvo – sadržaj', 'Odluka o usvajanju i provođenju (nacrt)', '14.2', OK, 'Donosi se nakon pozitivnog mišljenja'],
    ['Uputstvo – Faza I', 'Menadžer/koordinator i članovi; obaveze rukovodioca', '3.2, 3.3', DJ, 'Potpis direktora'],
    ['Uputstvo – Faza II', 'Sve zajedničke oblasti iz Tabele 1', '9.3', OK, '11 od 11'],
    ['Uputstvo – Faza II', 'Specifične oblasti', '9.3', OK, '7 oblasti'],
    ['Uputstvo – Faza II', 'Najmanje dva rizika po oblasti', '9.3', OK, 'Najmanje 2 u svakoj od 18 oblasti'],
    ['Uputstvo – Faza II', 'Poseban obrazac za svaki rizik', '9.5', OK, ''],
    ['Uputstvo – Faza II', 'Faktori S/O/I/P za svaki rizik', '9.5', OK, ''],
    ['Uputstvo – Faza II', 'Ocjena postojećih mjera (kontrolisan / djelimično / nekontrolisan)', '9.5', OK, 'Potvrda radne grupe'],
    ['Uputstvo – Faza II', 'Skala V i P 1–3, intenzitet V × P, rangiranje', '9.1, 9.4', OK, 'Radne ocjene'],
    ['Uputstvo – Faza II', 'Određen vremenski period za vjerovatnoću', '9.1', DJ, '2022/23–2025/26 – potvrditi'],
    ['Uputstvo – Faza II', 'Anonimna anketa i statistička obrada', 'Prilog 2', DJ, 'Provedena; neslaganja u broju ispitanika'],
    ['Uputstvo – Faza III', 'Mjere povezane s faktorima; prioritet prema intenzitetu; aktivnosti, izvršilac, rok, troškovi', '11.2', OK, ''],
    ['Uputstvo – Faza III', 'Izvještaj o stanju integriteta (uvod, anketa, evidencija rizika, prikaz rizika)', '8, 9, 15', OK, ''],
    ['Uputstvo – Faza IV', 'Dostava Uredu na mišljenje', '14.1', DJ, 'Nacrt dopisa'],
    ['Uputstvo – Faza IV', 'Razrješenje RG, imenovanje osobe za nadzor, način izvještavanja', '14.2', OK, ''],
    ['Uputstvo – praćenje', 'Godišnji izvještaj Uredu; važenje četiri godine', '12', OK, ''],
    ['Uputstvo – prilozi', 'Prilog 1 (izvještaj RG), Prilog 2 (upitnik)', '15, Prilog 2', OK, ''],
    ['Zakon čl. 44', 'Sadržaj a)–g): procjena, radna mjesta, vrste rizika, mjere, rokovi, menadžer', '8–11, 14.3', OK, ''],
    ['Zakon čl. 43. st. (3), čl. 47', 'Dostava Uredu u 15 dana; objava na web stranici', '12, 14.2', DJ, 'Nakon usvajanja'],
    ['Zakon čl. 48–50', 'Procjena svake druge godine; izvještaj do 31. marta; sadržaj izvještaja', '12', OK, ''],
    ['Zakon čl. 46', 'Rješenje o menadžeru integriteta', '14.3', DJ, 'Nacrt'],
    ['Zakon čl. 18', 'Ovlašteno lice s propisanim kvalifikacijama', '13.1, 14.4', NE, 'Potvrditi uslove i rješenje'],
    ['Zakon čl. 19', 'Sanduče s natpisom „ZA PRIJAVU KORUPCIJE“', '13.2', NE, 'Potvrditi natpis'],
    ['Zakon čl. 22', 'Pravilnik o internom prijavljivanju korupcije', '13.6', NE, 'Potvrditi da li je donesen'],
    ['Zadatak – anketa', 'Upitnik, broj ispitanika i procenti preneseni doslovno, na kraju dokumenta', 'Prilog 2', OK, 'Provjereno poređenjem s originalom'],
    ['Zadatak – kostur', 'Redoslijed i dijelovi Stijene očuvani', 'Cijeli nacrt', OK, 'Svih 14 dijelova iz zadatka'],
    ['Zadatak – radna grupa', 'Sastav od sedam članova zakonito predložen', '3.2, 3.3', DJ, 'Imenovanje nakon potpisa direktora'],
    ['Zadatak – činjenice', 'Nijedna službena činjenica nije izmišljena', 'Cijeli nacrt', OK, 'Brojevi, datumi i potpisi ostavljeni prazni ili označeni [POTVRDITI]'],
  ];
  return [
    H1('5. Kontrolna lista usklađenosti s Uputstvom i Zakonom'),
    P('Status „ispunjeno“ znači da je zahtjev obrađen u nacrtu. „Djelimično“ znači da zavisi od potpisa ili potvrde škole. „Škola dostavlja“ znači da nacrt ne može ispuniti zahtjev bez podataka ili akata škole.', { size: 19 }),
    table([1700, 3500, 1100, 1200, 2138], [['Izvor zahtjeva', 'Zahtjev', 'Dio nacrta', 'Status', 'Napomena'], ...rows], { size: 16 }),
  ];
}

function potvrde() {
  const rows = [
    ['Akti', 'Potpisana Odluka o izmjenama i dopunama Odluke o izradi (broj, datum); imenovanje Kenana Vukalića; ispravno pisanje imena „Semira Džakulić/Džakilić/Džaklić“, „Edin/Edina Pehlić“ i „Vukalić“.'],
    ['Akti', 'Akt kojim je ranija verzija vraćena na doradu (pošiljalac, broj, datum, primjedbe); datum i adresat dostave ranije verzije; adresat i ishod dopisa 610-278/2026.'],
    ['Akti', 'Stvarni datum Programa rada 610-95/2025 (30.01.2025. ili 31.03.2026.).'],
    ['Akti', 'Pravilnik o internom prijavljivanju korupcije (čl. 22), rješenje o ovlaštenom licu i dokaz o ispunjenosti uslova iz čl. 18; natpis na sandučetu.'],
    ['Akti', 'Datumi i brojevi internih akata iz dijela 6.3 (Pravila škole sa saglasnošću, Pravilnik o direktnom sporazumu, o reprezentaciji i poklonima, o internim kontrolama i dr.); postojanje kodeksa ponašanja i akta o zaštiti ličnih podataka.'],
    ['Akti', 'Prijedlog osobe za nadzor/menadžera integriteta (u originalu Dževaira Džehverović) – odluka direktora.'],
    ['Kadrovi', 'Odluka ministra o broju izvršilaca (2024/25 i važeća); stvarni broj zaposlenih; objašnjenje razlike 60,52 / 67,52 / 75.'],
    ['Anketa', 'Broj obrađenih upitnika (72 ili 37); zbirna tabela po pitanjima ili izvorni upitnici; rezultati pitanja 2, 7, 9, 10, 11, 12, 13, 16, 22, 23, 26 i 33; datum distribucije i rok popunjavanja. Ne provodi se nova anketa; dopunjuju se samo izostali postojeći podaci.'],
    ['Ocjene rizika', 'Za period 2022/23–2025/26 isključivo brojčani podaci: prijave korupcije, nalazi inspekcije i revizije, disciplinski postupci, žalbe roditelja, sudski sporovi (radi potvrde ocjene vjerovatnoće).'],
    ['Ocjene rizika', 'Zapisnik radne grupe o potvrđivanju ili obrazloženoj korekciji radnih ocjena za svaki rizik.'],
    ['Propisi', 'Brojevi službenih glasila označeni [POTVRDITI] u dijelu 6.1; sadržaj ispravke Zakona (Sl. glasnik USK 3/26); broj i datum Sl. glasnika s Uputstvom (11/2026).'],
    ['Organizacija', 'Da li škola daje prostor na korištenje trećim licima; način prikupljanja uplata roditelja; korištenje elektronskog dnevnika ili drugih elektronskih evidencija.'],
    ['Radna grupa', 'Izjave članova o nepostojanju sukoba interesa; zapisnici sa sastanaka (ako postoje iz 2025.).'],
  ];
  return [
    H1('6. Podaci, odluke i dokazi koje škola mora dostaviti ili potvrditi'),
    table([1500, 8138], [['Vrsta', 'Šta je potrebno'], ...rows], { size: 18 }),
    spacer(6),
    note('Prioritet', ['Prvo je potrebno pribaviti akt s primjedbama na raniju verziju (ako postoji), zatim potpisati Odluku o izmjenama i dopunama, potvrditi broj ispitanika ankete i status pravilnika o internom prijavljivanju. Ostali podaci potrebni su prije dostave nacrta Uredu.']),
  ];
}

const hf = L.headerFooter('JU OŠ „Stijena“ – Izvještaj o reviziji Plana integriteta (2026)');
const doc = new d.Document({
  creator: 'Revizija Plana integriteta', title: 'Izvještaj o reviziji Plana integriteta JU OŠ „Stijena“',
  styles: L.STYLES, numbering: L.NUMBERING, features: { updateFields: true },
  sections: [{ properties: { ...L.portrait, titlePage: true }, headers: { ...hf.headers, first: new d.Header({ children: [new d.Paragraph('')] }) }, footers: { ...hf.footers, first: new d.Footer({ children: [new d.Paragraph('')] }) },
    children: [...naslovna(), new d.Paragraph({ pageBreakBefore: true, children: [] }), ...L.toc('Sadržaj'), ...izvori(), ...istrazivanje(), ...uporedna(), ...ispravke(), ...kontrolna(), ...potvrde()] }],
});
d.Packer.toBuffer(doc).then((b) => { fs.writeFileSync(OUT, b); console.log('OK', OUT, b.length); });
