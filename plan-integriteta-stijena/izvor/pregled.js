// Pregled: šta još treba obaviti i šta je novo u odnosu na stari plan (ver 2).
const fs = require('fs');
const path = require('path');
const L = require('./lib');
const { d, C, P, center, left, bullet, H1, H2, spacer, table, note } = L;
const OUT = path.join(__dirname, '..', 'Pregled_sta_treba_uraditi_i_sta_je_novo.docx');

const chk = (rows) => table([500, 5300, 2300, 1538], [['Rb.', 'Zadatak', 'Ko', 'Urađeno'], ...rows.map((r, i) => [`${i + 1}.`, r[0], r[1], '☐'])], { size: 18 });
const V = { N: { t: 'NOVO', b: true, fill: C.ok }, D: { t: 'Dopunjeno', b: true, fill: C.light }, I: { t: 'Ispravljeno', b: true, fill: C.mid }, Z: { t: 'Zadržano', b: true, fill: C.band } };

const ch = [
  center('JU OŠ „STIJENA“ – PLAN INTEGRITETA', { bold: true, size: 26, color: C.navy, after: 60 }),
  center('Šta još treba uraditi i šta je novo u odnosu na stari plan', { bold: true, size: 30, color: C.navy, after: 80 }),
  center('Interni pregled za direktora i radnu grupu – 23.11.2026.', { italics: true, color: C.grey, after: 240 }),
  table([3200, 3200, 3238], [['', 'Stari plan (ver 2)', 'Novi plan (za dostavu Uredu)'],
    [{ t: 'Broj stranica', b: true }, '38', '88'], [{ t: 'Pravni osnov', b: true }, 'Agencija BiH, Strategija 2015–2019', 'Zakon USK 24/25, Uputstvo 11/26, Strategija USK 2023–2027'],
    [{ t: 'Oblasti rizika', b: true }, '6 (opisno)', '18 (11 zajedničkih + 7 školskih)'], [{ t: 'Identifikovani rizici', b: true }, '6, bez skale i faktora', '42, svaki s posebnim obrascem'],
    [{ t: 'Mjere', b: true }, '7, bez veze s rizicima', '47, s aktivnostima, izvršiocem, rokom, troškom i indikatorom'], [{ t: 'Anketa', b: true }, 'U sredini dokumenta', 'Doslovno prenesena, Prilog 2 na kraju']], { size: 18, header: 1 }),

  H1('Dio 1. Šta još treba uraditi', { pb: false }),
  H2('1.1. Prije slanja Uredu'),
  chk([
    ['Upisati djelovodni broj Odluke o izmjenama i dopunama (dio 3.2) i isti broj prepisati u dijelove 2.2, 4.2, 14.1 i u dopis Uredu. Potpis i pečat.', 'Sekretar; direktor'],
    ['Upisati broj Obavijesti zaposlenima (dio 4.2), potpisati i istaći na oglasnu tablu.', 'Sekretar; direktor'],
    ['Upisati broj i potpisati Rješenje o ovlaštenom licu za prijave korupcije (dio 14.3). Važi odmah, nezavisno od plana.', 'Sekretar; direktor'],
    ['Potpisati Program rada (dio 5.2).', 'Direktor'],
    ['Održati sastanak radne grupe, odrediti zapisničara i potpisati zapisnik (dio 5.3).', 'Radna grupa'],
    ['Upisati broj i potpisati Prilog 1 – izvještaj radne grupe (sedam potpisa).', 'Svi članovi radne grupe'],
    ['Upisati broj u dopis Uredu, potpisati, ovjeriti i poslati uz plan (štampano i elektronski) i kopiju Odluke o izmjenama i dopunama.', 'Sekretar; direktor'],
  ]),
  H2('1.2. Odmah (zakonska obaveza)'),
  chk([
    ['Donijeti Pravilnik o postupku internog prijavljivanja korupcije (čl. 22. Zakona). Rok je istekao; kazna za školu 500–5.000 KM (čl. 54).', 'Direktor; sekretar'],
  ]),
  H2('1.3. Nakon mišljenja Ureda'),
  chk([
    ['Upisati broj i datum mišljenja Ureda i donijeti Odluku o usvajanju i provođenju (dio 14.1).', 'Direktor'],
    ['Upisati datum usvajanja u dio 1.', 'Sekretar'],
    ['Donijeti Rješenje o menadžeru integriteta – Dževaira Džehverović (dio 14.2).', 'Direktor'],
    ['Objaviti plan na web stranici škole i dostaviti ga Uredu u roku od 15 dana od usvajanja.', 'Direktor; sekretar'],
    ['Do 31. marta svake godine dostavljati Uredu izvještaj o provođenju plana.', 'Direktor; menadžer integriteta'],
  ]),
  H2('1.4. Moguća pitanja Ureda (podaci iz starog plana, nisu mijenjani)'),
  ...['Anketa: navedeno je 72 ispitanika (96%), a procenti odgovaraju bazi od 37 ili 74. Ako su popunjeni upitnici sačuvani, mogu se ponovo prebrojati i sačiniti zapisnik.', 'Katalog radnih mjesta daje zbir 60,52 izvršioca, a Odluka ministra 67,52.', 'Program 610-95/2025 u zaglavlju ima datum 30.01.2025., a uz potpis 31.03.2026.', 'Tri visoka rizika (odlučivanje direktora, nabavke, zapošljavanje) imaju staru ocjenu radne grupe „srednja vjerovatnoća“, iako slučajevi nisu zabilježeni.'].map((t) => bullet(t)),

  H1('Dio 2. Šta je novo u odnosu na stari plan', { pb: true }),
  P('Oznake: NOVO – dio koji nije postojao; Dopunjeno – postojeći dio proširen; Ispravljeno – greška ili zastarjeli podatak ispravljen; Zadržano – preneseno bez izmjene sadržaja. Stranice starog plana odnose se na PDF prikaz dokumenta „Plan integriteta-ver 2“.', { size: 19 }),
  table([1900, 1000, 2700, 2638, 1400], [['Dio plana', 'Stari (str.)', 'Stari plan', 'Novi plan', 'Promjena'],
    ['Naslovna strana', '1', '„Cazin, juni 2021.“', 'Datum 23.11.2026., oznaka NACRT; memorandum i fotografija zadržani', V.I],
    ['1. Osnovne informacije', '2', 'Datum usvajanja 28.01.2025. (pogrešno – to je datum odluke o izradi); 6 članova', 'Datum usvajanja upisuje se nakon mišljenja; 7 članova; osoba za nadzor i telefon', V.I],
    ['2. Uvod i pravni osnov', '6', 'Obaveza pripisana Agenciji BiH i Strategiji VM BiH', 'Zakon USK 24/25, Uputstvo 11/26, Strategija USK 2023–2027; novi dio „Tok izrade plana“', V.I],
    ['3.1 Odluka o izradi', '7', 'Odluka 610-93/2025', 'Prenesena bez izmjena', V.Z],
    ['3.2 Odluka o izmjenama i dopunama', '—', '—', 'Usklađivanje sa Zakonom; Kenan Vukalić u radnoj grupi; Sabina Žunić menadžer/koordinator', V.N],
    ['3.3 Sastav i zaduženja', '—', '—', 'Tabela 7 članova s podjelom oblasti', V.N],
    ['4. Obavještenje zaposlenima', '8', 'Obavijest 610-94/2025', 'Zadržana + nova obavijest o nastavku izrade', V.D],
    ['5. Program rada', '9–11', 'Program 610-95/2025 bez zadataka po članovima i načina praćenja', 'Zadržan + revidirani program po modelu Uputstva + zapisnik sa sastanka radne grupe', V.D],
    ['6. Zakonski okvir i interni akti', '12–13', 'Popis bez antikorupcijskih propisa i brojeva glasila', 'Dodati Zakon USK, Uputstvo, Strategija, Zakon o zaštiti ličnih podataka, brojevi glasila; popis novih obaveznih akata', V.D],
    ['7. Organizacija i katalog radnih mjesta', '14–21', '„Standardi za srednje obrazovanje“; prazna procjena za psihologa i soc. radnika; pravopisne greške', 'Ispravljeno na osnovno obrazovanje; procjena dopunjena; pravopis; nova tabela nivoa odlučivanja', V.I],
    ['8. Izvještaj o stanju integriteta', '21–23', 'Zaključak „nisu uočeni rizici“, suprotno rezultatima ankete', 'Početna procjena; tabela aspekata prema stvarnim rezultatima ankete', V.I],
    ['8.4–8.5 Kritična radna mjesta', '24–27', 'Ocjene 1–5 i opis 4 radna mjesta', 'Zadržano + veza s rizicima iz registra', V.D],
    ['9. Identifikacija i procjena rizika', '27', '6 rizika, opisne ocjene bez skale i faktora', '42 rizika u 18 oblasti; skala 1–3 × 1–3; temperaturna mapa; rang lista; poseban obrazac s faktorima S/O/I/P i postojećim kontrolama za svaki rizik', V.N],
    ['10. Status quo', '28–29', 'Rezultati ankete u tekstu; „ne postoje pravne praznine“', 'Rezultati povezani s rizicima; utvrđene praznine u odnosu na Zakon USK', V.I],
    ['11.1 Preporuke', '30–31', '6 područja, prioritet 1–5, kolona prioriteta prazna', '6 područja zadržano; prioriteti po Uputstvu; veza s rizicima', V.D],
    ['11.2 Mjere', '31', '7 mjera bez aktivnosti, troškova i indikatora', '47 mjera po obrascu Uputstva + indikator', V.N],
    ['12. Kontrolni mehanizmi', '31', '3 opća elementa', '11 elemenata: polugodišnji izvještaj, izvještaj Uredu do 31.03., procjena svake 2 godine, objava na web stranici', V.D],
    ['13. Prijava korupcije', '32–33', 'Bez zakonskih uslova i rokova; formatirano kao naslovi', 'Usklađeno sa Zakonom (čl. 13–37): ovlašteno lice i zamjena, rokovi, eksterna prijava Uredu, zaštita prijavitelja', V.I],
    ['14. Završni akti', '—', '—', 'Nacrti: Odluka o usvajanju, Rješenje o menadžeru integriteta, Rješenje o ovlaštenom licu', V.N],
    ['Prilog 1 – Izvještaj radne grupe', '33', 'Izvještaj 610-277/2026 potpisao direktor; „nema rizika“', 'Izvještaj radne grupe direktoru s potpisima svih članova', V.I],
    ['Prilog 2 – Anketa', '34–37', 'Upitnik bez rezultata na istom mjestu', 'Upitnik i rezultati doslovno, na kraju dokumenta (provjereno: 159 redova, 22 procenta)', V.Z],
    ['Dopis Uredu', '38', 'Dopis 610-278/2026 bez adresata', 'Novi dopis Uredu (zaseban dokument)', V.N]], { size: 16 }),
  spacer(6),
  note('Šta nije mijenjano', ['Izvorne potpisane odluke (610-93, 610-94, 610-95/2025), rezultati ankete, broj ispitanika i procenti preneseni su bez izmjene. Nisu preuzimani podaci ni ocjene drugih škola. Djelovodni brojevi i potpisi nisu izmišljani.'], { fill: C.light, border: C.blue, tcolor: C.navy }),
];

const doc = new d.Document({ styles: L.STYLES, numbering: L.NUMBERING, sections: [{ properties: L.portrait, ...L.headerFooter('JU OŠ „Stijena“ – interni pregled (ne dostavlja se Uredu)'), children: ch }] });
d.Packer.toBuffer(doc).then((b) => { fs.writeFileSync(OUT, b); console.log('OK', OUT); });
