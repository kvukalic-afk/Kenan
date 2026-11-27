/* Testovi čiste logike frontenda (blok @logika iz src/app.jsx) */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { napraviOkruzenje } = require('./gas-mock.cjs');

function ucitajLogiku(izvor) {
  const m = izvor.match(/\/\* @logika-start[\s\S]*?\*\/([\s\S]*?)\/\* @logika-end \*\//);
  assert.ok(m, 'blok @logika nije pronađen');
  const ctx = { module: { exports: {} }, Intl, Date, Math, crypto: require('crypto') };
  vm.createContext(ctx);
  vm.runInContext(m[1], ctx);
  return ctx.module.exports;
}
const L = ucitajLogiku(fs.readFileSync(path.join(__dirname, '..', 'src', 'app.jsx'), 'utf8'));

const proizvodi = [
  { product_id: 'redbull', naziv: 'Red Bull', cijena: 4, prati_zalihu: true, kategorija: 'Energy' },
  { product_id: 'voda05', naziv: 'Voda 0,5 L', cijena: 1, prati_zalihu: true, kategorija: 'Voda' },
  { product_id: 'dnevna', naziv: 'Dnevni trening', cijena: 3, prati_zalihu: false, kategorija: 'Usluge' }
];
const e = (tip, pid, kolicina = 1) => ({ event_id: L.uid('E'), tip, product_id: pid, kolicina });

test('stanje smjene: scenarij prihvatanja (isto kao backend)', () => {
  const smjena = {
    pocetna: { redbull: 10, voda05: 15 },
    dogadjaji: [e('SALE', 'redbull'), e('SALE', 'redbull'), e('SALE', 'voda05'), e('SALE', 'voda05'), e('SALE', 'voda05'), e('RESTOCK', 'redbull', 5)]
  };
  const st = L.stanjeSmjene(smjena, proizvodi);
  assert.equal(st.ocekivano.redbull, 13);
  assert.equal(st.ocekivano.voda05, 12);
  assert.equal(st.promet, 11);
  assert.equal(st.kom, 5);
  const pr = L.provjeraZavrsnog(smjena, proizvodi, { redbull: '12', voda05: '12' }, '11,00');
  assert.equal(pr.razlikeRobe, 1);
  assert.equal(pr.kasaRazlika, 0);
  assert.equal(pr.trebaRazlog, true);
  const pr2 = L.provjeraZavrsnog(smjena, proizvodi, { redbull: '13', voda05: '12' }, '11');
  assert.equal(pr2.trebaRazlog, false);
  assert.equal(L.provjeraZavrsnog(smjena, proizvodi, {}, '').kasaRazlika, null);
  assert.equal(L.provjeraZavrsnog(smjena, proizvodi, {}, '10.5').kasaRazlika, -0.5);
});

test('undo: UNDO_SALE (pozitivna ili negativna količina) uvijek oduzima', () => {
  const smjena = { pocetna: { redbull: 5 }, dogadjaji: [e('SALE', 'redbull'), e('SALE', 'redbull'), e('UNDO_SALE', 'redbull', -1), e('UNDO_SALE', 'redbull', 1)] };
  const st = L.stanjeSmjene(smjena, proizvodi);
  assert.equal(st.prodano('redbull'), 0);
  assert.equal(st.promet, 0);
  assert.equal(st.ocekivano.redbull, 5);
});

test('frontend i backend računaju isto (nasumične smjene)', () => {
  const g = napraviOkruzenje();
  for (let k = 0; k < 200; k++) {
    const pocetna = { redbull: Math.floor(Math.random() * 20), voda05: Math.floor(Math.random() * 20) };
    const dog = [];
    for (let i = 0; i < 30; i++) {
      const r = Math.random();
      const pid = ['redbull', 'voda05', 'dnevna'][Math.floor(Math.random() * 3)];
      if (r < 0.7) dog.push(e('SALE', pid));
      else if (r < 0.85) dog.push(e('UNDO_SALE', pid, -1));
      else if (pid !== 'dnevna') dog.push(e('RESTOCK', pid, Math.ceil(Math.random() * 10)));
    }
    const fe = L.stanjeSmjene({ pocetna, dogadjaji: dog }, proizvodi);
    const be = g.obracunSmjene_(proizvodi.map(p => Object.assign({ redoslijed: 1 }, p)), pocetna, dog, null);
    assert.equal(fe.promet, be.promet);
    assert.equal(fe.kom, be.prodano_kom);
    for (const s of be.stavke) assert.equal(fe.ocekivano[s.product_id], s.ocekivano);
  }
});

test('red čekanja: dodavanje bez duplikata, uklanjanje, batch po smjeni', () => {
  let red = [];
  const a = { event_id: 'a', shift_id: 'S1' }, b = { event_id: 'b', shift_id: 'S1' }, c = { event_id: 'c', shift_id: 'S2' };
  red = L.dodajURed(red, a); red = L.dodajURed(red, a); red = L.dodajURed(red, b); red = L.dodajURed(red, c);
  assert.equal(red.length, 3);
  const batch = L.sljedeciBatch(red, 100);
  assert.equal(batch.shift_id, 'S1');
  assert.deepEqual(batch.events.map(x => x.event_id), ['a', 'b']);
  red = L.ukloniIzReda(red, ['a', 'b', 'nepostoji']);
  assert.deepEqual(red.map(x => x.event_id), ['c']);
  assert.equal(L.sljedeciBatch([], 100), null);
  // isti event_id pri svakom ponovnom slanju
  const kopija = JSON.parse(JSON.stringify(red));
  assert.equal(L.sljedeciBatch(kopija).events[0].event_id, 'c');
});

test('backoff: 2, 4, 8, 16, 30, 30 s', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 9].map(L.pauza), [2000, 4000, 8000, 16000, 30000, 30000]);
});

test('spajanje server + lokalni događaji bez dupliranja', () => {
  const s = [{ event_id: 'x' }, { event_id: 'y' }];
  const l = [{ event_id: 'y' }, { event_id: 'z' }];
  assert.deepEqual(L.spojiDogadjaje(s, l).map(x => x.event_id), ['x', 'y', 'z']);
});

test('dupli tap: <150 ms ignorisano, brzi tapovi 3× po ~200 ms prolaze', () => {
  const z = {};
  assert.equal(L.dozvoliTap(z, 'redbull', 1000), true);
  assert.equal(L.dozvoliTap(z, 'redbull', 1060), false);
  assert.equal(L.dozvoliTap(z, 'voda05', 1070), true, 'drugi proizvod nije blokiran');
  assert.equal(L.dozvoliTap(z, 'redbull', 1200), true);
  assert.equal(L.dozvoliTap(z, 'redbull', 1400), true);
});

test('članarina: produženje i pretraga', () => {
  assert.equal(L.produzenje('2026-12-01', '2026-11-21', 1).istek, '2027-01-01');
  assert.equal(L.produzenje('2026-11-01', '2026-11-21', 1).istek, '2026-12-21');
  assert.equal(L.produzenje('', '2026-01-31', 1).istek, '2026-02-28');
  const cl = [{ ime: 'Šemsa Čolić', telefon: '061 222 333' }, { ime: 'Amel', telefon: '062' }];
  assert.equal(L.traziClanove(cl, 'semsa colic').length, 1);
  assert.equal(L.traziClanove(cl, '222').length, 1);
  assert.equal(L.traziClanove(cl, '').length, 2);
});

test('formatiranje: KM, datum, trajanje, tekst izvještaja', () => {
  assert.equal(L.km(11), '11,00');
  assert.equal(L.km(-4), '−4,00');
  assert.equal(L.km(1234.5), '1.234,50');
  assert.equal(L.km(0.1 + 0.2), '0,30');
  assert.equal(L.dT('2026-11-21'), '21.11.2026.');
  assert.equal(L.trajanje(390), '6 h 30 min');
  assert.equal(L.danasSarajevo(new Date('2026-11-21T23:30:00Z')), '2026-11-22');
  const t = L.tekstIzvjestaja({
    radnik: 'Kenan', datum: '2026-11-21', pocetak: '16:03', kraj: '22:33', trajanje_min: 390, prodano_kom: 5, promet: 11,
    kasa_stvarno: 11, kasa_razlika: 0, vrijednost_razlike: -4, kasa_razlog: 'Ne znam',
    stavke: [{ naziv: 'Red Bull', razlika_kom: -1, razlika_km: -4, ocekivano: 13, stvarno: 12 }, { naziv: 'Voda', razlika_kom: 0 }], usluge: []
  });
  assert.match(t, /Promet: 11,00 KM/);
  assert.match(t, /✓ 1 se poklapa, ⚠ 1 s razlikom/);
  assert.match(t, /Red Bull: -1 kom \(−4,00 KM\)/);
});

test('UID je jedinstven', () => {
  const s = new Set();
  for (let i = 0; i < 5000; i++) s.add(L.uid('E'));
  assert.equal(s.size, 5000);
});

test('paket: karta + trener, samo trener, tip proizvoda', () => {
  const karta = { product_id: 'clan30', naziv: 'Mjesečna karta', cijena: 40, clanarina_mjeseci: 1, tip: 'clanarina' };
  const tr = { product_id: 'trener', naziv: 'Lični trener', cijena: 60, clanarina_mjeseci: 1, tip: 'trener' };
  const clan = { istek: '2026-12-01', trener_do: '' };
  const p1 = L.paket(karta, tr, '', clan, '2026-11-21');
  assert.equal(p1.ukupno, 100);
  assert.equal(p1.spreman, false, 'trener mora biti izabran');
  const p2 = L.paket(karta, tr, 'Edin', clan, '2026-11-21');
  assert.equal(p2.spreman, true);
  assert.equal(p2.stavke.map(x => x.do).join(','), '2027-01-01,2026-12-21');
  assert.equal(L.paket(null, null, '', clan, '2026-11-21').spreman, false);
  assert.equal(L.paket(null, tr, 'Kenan', clan, '2026-11-21').ukupno, 60);
  const d = L.podijeli([karta, tr, { naziv: 'Dnevni trening', cijena: 3 }, { naziv: 'Red Bull', prati_zalihu: true }, { naziv: 'Peškir', cijena: 2 }]);
  assert.equal([d.clanarine.length, d.treneri.length, d.dnevne.length, d.roba.length, d.usluge.length].join(), '1,1,1,1,1');
});

test('raspored: dan u sedmici, termini za dan, grupisanje termina', () => {
  assert.equal(L.danUSedmici('2026-11-22'), 'ned');
  assert.equal(L.danUSedmici('2026-11-24'), 'uto');
  const r = [
    { termin_id: 'a', osobe: 'Enes', dan: 'pon', vrijeme: '19:00', trening: 'Prsa' },
    { termin_id: 'b', osobe: 'Amra', dan: 'pon', vrijeme: '07:30', trening: 'Full body' },
    { termin_id: 'a', osobe: 'Enes', dan: 'uto', vrijeme: '19:00', trening: 'Leđa' }
  ];
  assert.equal(L.zaDan(r, 'pon').map(x => x.osobe).join(), 'Amra,Enes');
  const t = L.termini(r);
  assert.equal(t.length, 2);
  assert.equal(JSON.stringify(t[0].dani), JSON.stringify({ pon: 'Prsa', uto: 'Leđa' }));
});

test('paket s prilagođenom cijenom trenera', () => {
  const karta = { product_id: 'clan30', naziv: 'Karta', cijena: 40, clanarina_mjeseci: 1, tip: 'clanarina' };
  const tr = { product_id: 'trener_plan', naziv: 'Plan', cijena: 40, clanarina_mjeseci: 1, tip: 'trener' };
  const a = L.paket(karta, tr, 'Edin', { istek: '' }, '2026-11-21', '30,5');
  assert.equal(a.ukupno, 70.5);
  assert.equal(a.stavke[1].prilagodjena, true);
  assert.equal(a.stavke[1].standardna, 40);
  const b = L.paket(karta, tr, 'Edin', { istek: '' }, '2026-11-21', '40');
  assert.equal(b.stavke[1].prilagodjena, false);
  assert.equal(L.paket(karta, tr, 'Edin', {}, '2026-11-21', 'abc').spreman, false);
  assert.equal(L.paket(karta, tr, 'Edin', {}, '2026-11-21', '0').spreman, false);
  assert.equal(L.paket(karta, tr, 'Edin', {}, '2026-11-21').ukupno, 80);
  assert.equal(L.cijenaIzUnosa('3000'), null);
});

test('nestalo: samo ono što je bilo na zalihi i došlo do nule', () => {
  const prod = [
    { product_id: 'malina', naziv: 'Protein malina', prati_zalihu: true }, { product_id: 'cokolada', naziv: 'Protein čokolada', prati_zalihu: true },
    { product_id: 'rodeo', naziv: 'Rodeo', prati_zalihu: true }, { product_id: 'dnevna', naziv: 'Dnevna', prati_zalihu: false }
  ];
  const smjena = { pocetna: { malina: 2, cokolada: 5, rodeo: 0 }, dogadjaji: [
    { tip: 'SALE', product_id: 'malina', kolicina: 1 }, { tip: 'POTROSNJA', product_id: 'malina', kolicina: 1, osoba: 'Edin' }, { tip: 'SALE', product_id: 'cokolada', kolicina: 1 }
  ] };
  const st = L.stanjeSmjene(smjena, prod);
  assert.equal(L.nestalo(smjena, prod, st).map(p => p.naziv).join(), 'Protein malina');
  // dopuna vraća zalihu
  smjena.dogadjaji.push({ tip: 'RESTOCK', product_id: 'malina', kolicina: 30 });
  assert.equal(L.nestalo(smjena, prod, L.stanjeSmjene(smjena, prod)).length, 0);
  // potrošnja po računu
  assert.equal(JSON.stringify(st.potrosnjaOsobe), JSON.stringify({ Edin: { malina: 1 } }));
});

test('mjere: protein ima/nema, kreatin % — ne ulaze u očekivano ni u razlike; NEMA baner', () => {
  const prod = [
    { product_id: 'protein', naziv: 'Protein vanilija', prati_zalihu: true, jedinica: 'ima', cijena: 3 },
    { product_id: 'protein_malina', naziv: 'Protein malina', prati_zalihu: true, jedinica: 'ima', cijena: 3 },
    { product_id: 'kreatin', naziv: 'Kreatin', prati_zalihu: true, jedinica: '%', cijena: 2 },
    { product_id: 'redbull', naziv: 'Red Bull', prati_zalihu: true, cijena: 4 }
  ];
  const smjena = { pocetna: { protein: 1, protein_malina: 0, kreatin: 8, redbull: 5 }, dogadjaji: [
    { tip: 'SALE', product_id: 'protein', kolicina: 1 }, { tip: 'SALE', product_id: 'protein', kolicina: 1 }, { tip: 'SALE', product_id: 'redbull', kolicina: 1 }
  ] };
  const st = L.stanjeSmjene(smjena, prod);
  assert.equal(JSON.stringify(st.ocekivano), JSON.stringify({ redbull: 4 }));
  assert.equal(st.promet, 10);
  assert.equal(L.nestalo(smjena, prod, st).map(p => p.naziv).join(), 'Protein malina,Kreatin');
  assert.deepEqual([L.opisMjere(prod[0], 1), L.opisMjere(prod[1], 0), L.opisMjere(prod[2], 8)], ['ima', 'NEMA', '8%']);
  const pr = L.provjeraZavrsnog(smjena, prod, { protein: '0', protein_malina: '0', kreatin: '5', redbull: '4' }, '10');
  assert.equal(pr.razlikeRobe, 0, 'okusi i % nisu razlike');
  assert.equal(pr.trebaRazlog, false);
});

test('mjere: "stiglo" i "nova kanta" usred smjene', () => {
  const prod = [
    { product_id: 'protein_malina', naziv: 'Protein malina', prati_zalihu: true, jedinica: 'ima', cijena: 3 },
    { product_id: 'kreatin', naziv: 'Kreatin', prati_zalihu: true, jedinica: '%', cijena: 2 }
  ];
  const smjena = { pocetna: { protein_malina: 0, kreatin: 5 }, dogadjaji: [] };
  let st = L.stanjeSmjene(smjena, prod);
  assert.equal(L.nestalo(smjena, prod, st).length, 2);
  smjena.dogadjaji.push({ tip: 'RESTOCK', product_id: 'protein_malina', kolicina: 1 }, { tip: 'RESTOCK', product_id: 'kreatin', kolicina: 1 });
  st = L.stanjeSmjene(smjena, prod);
  assert.deepEqual([L.trenutnoMjera(prod[0], smjena, st), L.trenutnoMjera(prod[1], smjena, st)], [1, 100]);
  assert.equal(L.nestalo(smjena, prod, st).length, 0);
});

test('preskočeno = nema: prazna polja postaju 0, upisano ostaje', () => {
  const roba = [{ product_id: 'a', naziv: 'A' }, { product_id: 'b', naziv: 'B' }, { product_id: 'c', naziv: 'C' }];
  const v = { a: '5', b: '' };
  assert.deepEqual(Object.assign({}, L.saNulama(roba, v)), { a: '5', b: '0', c: '0' });
  assert.deepEqual(Object.assign({}, v), { a: '5', b: '' }, 'original se ne mijenja');
  assert.equal(L.nedostaje(roba, L.saNulama(roba, v)).length, 0);
});

test('način brojanja otvorene smjene ima prednost nad novim načinom proizvoda', () => {
  const proizvodi = [
    { product_id: 'protein', naziv: 'Protein vanilija', jedinica: '%', paket: 0 },
    { product_id: 'redbull', naziv: 'Red Bull', jedinica: 'kom', paket: 24 },
    { product_id: 'kreatin', naziv: 'Kreatin', jedinica: '%' }
  ];
  const smjena = { mjere: { protein: 'ima', redbull: 'kom', kreatin: '%' } };
  const u = L.uSmjeni(proizvodi, smjena);
  assert.deepEqual(u.map(p => L.mjera(p)).join(','), 'ima,kom,posto');
  assert.equal(u[1], proizvodi[1], 'nepromijenjen proizvod je isti objekat');
  assert.equal(proizvodi[0].jedinica, '%', 'original se ne mijenja');
  assert.equal(L.uSmjeni(proizvodi, null), proizvodi);
  assert.equal(L.uSmjeni(proizvodi, { mjere: {} })[0], proizvodi[0]);
});

test('razlike po imenu i ispravke poslije provjere', () => {
  const proizvodi = [
    { product_id: 'voda', naziv: 'Voda', cijena: 1, prati_zalihu: true },
    { product_id: 'rb', naziv: 'Red Bull', cijena: 4, prati_zalihu: true },
    { product_id: 'protein', naziv: 'Protein', cijena: 3, prati_zalihu: true, jedinica: '%' }
  ];
  const smjena = { pocetna: { voda: 10, rb: 6, protein: 80 }, kasa_pocetna: 20,
    dogadjaji: [{ event_id: 'e1', tip: 'SALE', product_id: 'rb', kolicina: 2 }] };
  const pr = L.provjeraZavrsnog(smjena, proizvodi, { voda: '0', rb: '3', protein: '70' }, '28');
  assert.equal(pr.razlikePid.join(','), 'voda,rb', 'protein u % nema razliku');
  assert.equal(pr.kasaRazlika, 0);
  const prva = { roba: { voda: '0', rb: '3', protein: '70' }, kasa: '28' };
  assert.equal(L.ispravke(prva, proizvodi, { voda: '10', rb: '4', protein: '70' }, '28'),
    'Ispravljeno poslije provjere: Voda 0 → 10; Red Bull 3 → 4');
  assert.equal(L.ispravke(prva, proizvodi, { voda: '0', rb: '3', protein: '60' }, '30,5'),
    'Ispravljeno poslije provjere: Protein 70% → 60%; kasa 28,00 → 30,50 KM');
  assert.equal(L.ispravke(prva, proizvodi, prva.roba, '28'), '', 'bez promjena nema napomene');
  assert.equal(L.ispravke(null, proizvodi, prva.roba, '28'), '');
});

test('analiza rada: tekst za Claudea nosi uvide, brojke i detalje (ugovor backend ↔ telefon)', () => {
  const g = napraviOkruzenje({ sada: new Date('2026-11-21T15:03:00Z') });
  g.setupSpreadsheet();
  const ms = Date.parse('2026-11-21T14:00:00Z');
  const z = (i, vrsta, x = {}) => Object.assign({ id: 'T-test' + i, vrsta, ms, radnik: 'Edin', shift_id: 'S1', ekran: 'smjena', verzija: 'v', uredjaj: 'Android' }, x);
  const paket = [];
  for (let i = 0; i < 4; i++) paket.push(z(i, 'ponisti', { pid: 'redbull', trajanje: 2 }));
  paket.push(z(10, 'brojanje', { ekran: 'pocetna', trajanje: 480, detalji: JSON.stringify({ preskoceno: 6, prosli: 9 }) }));
  paket.push(z(11, 'prozor', { detalji: 'dopuna', broj: 0, trajanje: 15 }));
  paket.push(z(12, 'greska', { detalji: 'Upiši gotovinu u kasi' }));
  paket.push(z(13, 'ekran', { ekran: 'zavrsna', detalji: 'smjena', trajanje: 30 }));
  assert.equal(JSON.parse(JSON.stringify(g.zabiljeziTrag(paket))).primljeno.length, paket.length);
  const a = JSON.parse(JSON.stringify(g.getAnalizaRada('2308', 7)));
  const t = L.tekstAnalize(a);
  assert.match(t, /^ANALIZA RADA — Fitness Club Adin, 15\.11\.2026\. – 21\.11\.2026\. \(7 dana\)/);
  assert.match(t, /Smjena: 1 · zapisa: 8 · radnici: Edin/);
  assert.match(t, /UVIDI:\n1\. \[SREDNJA\] Početno brojanje traje oko 8 min/);
  assert.match(t, /Često poništavanje: Red Bull \(4×\) — 4 od toga u prvih 5 sekundi/);
  assert.match(t, /BROJANJE: početak medijan 8 min \(najduže 8\), preskočeno ~6, „prošli put" ~9 · kraj nema podataka/);
  assert.match(t, /PONIŠTAVANJA: Red Bull 4× \(4 odmah\)/);
  assert.match(t, /PROZORI: Dopuna zalihe 1× \(bez unosa 1, Ø 15 s\)/);
  assert.match(t, /PORUKE O GREŠCI: „Upiši gotovinu u kasi" 1×/);
  assert.match(t, /NAZAD: sa završnog brojanja na prodaju 1×/);
  assert.equal(L.tekstAnalize(null), '');
  const g2 = napraviOkruzenje({ sada: new Date('2026-11-21T15:03:00Z') });
  g2.setupSpreadsheet();
  const prazno = L.tekstAnalize(JSON.parse(JSON.stringify(g2.getAnalizaRada('2308', 1))));
  assert.match(prazno, /\(1 dan\)/);
  assert.match(prazno, /Još nema zapisa/);
});
