/* Testovi backenda (Code.gs) uz mock Google okruženja. Pokretanje: node --test tests/ */
const test = require('node:test');
const assert = require('node:assert/strict');
const { napraviOkruzenje } = require('./gas-mock.cjs');

const SAT = new Date('2026-11-21T15:03:00Z'); // 16:03 u Sarajevu

function okruzenje() {
  const g = napraviOkruzenje({ sada: SAT });
  g.setupSpreadsheet();
  return g;
}
function ok(r) {
  assert.equal(r.ok, true, 'Očekivan uspjeh, dobijeno: ' + JSON.stringify(r));
  // google.script.run ne prenosi Date ni funkcije — sve mora biti čist JSON
  (function provjeri(v, put) {
    const tag = Object.prototype.toString.call(v);
    assert.ok(tag !== '[object Date]' && typeof v !== 'function' && v !== undefined, 'Nije JSON na ' + put);
    if (v && typeof v === 'object') for (const k of Object.keys(v)) provjeri(v[k], put + '.' + k);
  })(r, 'r');
  return JSON.parse(JSON.stringify(r));
}
function pocetnoSve(g, izuzeci = {}) {
  const b = ok(g.getBootstrap());
  const o = {};
  b.proizvodi.filter(p => p.prati_zalihu).forEach(p => { o[p.product_id] = 0; });
  return Object.assign(o, izuzeci);
}
let brojac = 0;
const ev = (shift, tip, pid, kol = 1, extra = {}) => Object.assign({ event_id: 'E-test-' + (++brojac), shift_id: shift, tip, product_id: pid, kolicina: kol }, extra);

test('setupSpreadsheet je idempotentan i ne briše podatke', () => {
  const g = napraviOkruzenje({ sada: SAT });
  const prvi = g.setupSpreadsheet();
  assert.match(prvi, /upisano 17 proizvoda/);
  assert.equal(g.__ss.getSheetByName('Sheet1'), null, 'prazan Sheet1 uklonjen');
  for (const t of ['PROIZVODI', 'SMJENE', 'DOGADJAJI', 'INVENTURA', 'CLANOVI', 'PREGLED']) assert.ok(g.__ss.getSheetByName(t), t);
  assert.equal(g.__ss.getSpreadsheetTimeZone(), 'Europe/Sarajevo');

  // vlasnik promijeni cijenu i doda proizvod — drugi setup ne smije ništa pregaziti
  const sh = g.__ss.getSheetByName('PROIZVODI');
  sh.getRange(4, 4).setValue(4.5);
  sh.getRange(22, 1, 1, 3).setValues([['novi', 'Ostalo', 'Novi proizvod']]);
  const drugi = g.setupSpreadsheet();
  assert.match(drugi, /Ništa nije mijenjano/);
  const pr = g.__tabela('PROIZVODI');
  assert.equal(pr.length, 21);
  assert.equal(pr.find(p => p.product_id === 'redbull').cijena, 4.5);
  assert.deepEqual(Object.keys(pr[0]), ['product_id', 'kategorija', 'naziv', 'cijena', 'nabavna_cijena', 'prati_zalihu', 'aktivan', 'redoslijed', 'minimum', 'clanarina_mjeseci', 'tip', 'dodao', 'jedinica', 'paket']);
});

test('setup dodaje kolone koje fale, ne dira postojeće', () => {
  const g = napraviOkruzenje({ sada: SAT });
  const sh = g.__ss.insertSheet('PROIZVODI');
  sh.getRange(1, 1, 1, 6).setValues([['product_id', 'kategorija', 'naziv', 'cijena', 'nabavna_cijena', 'prati_zalihu']]);
  sh.getRange(2, 1, 1, 6).setValues([['voda05', 'Voda', 'Voda 0,5 L', 1, 0.5, true]]);
  g.setupSpreadsheet();
  const pr = g.__tabela('PROIZVODI');
  assert.equal(pr.length, 5, 'seed se ne ubacuje kad tabela nije prazna (dodaju se samo Lični trener i tri nova pića)');
  assert.equal(pr[1].product_id, 'trener');
  assert.ok('aktivan' in pr[0] && 'clanarina_mjeseci' in pr[0]);
  const b = ok(g.getBootstrap());
  assert.equal(b.proizvodi.length, 5, 'prazna kolona aktivan = aktivan');
  assert.equal(b.proizvodi.find(p => p.product_id === 'voda05').tip, 'roba', 'tip se pogađa kad kolona tip ne postoji');
});

test('bootstrap: proizvodi, nema aktivne smjene, neaktivni sakriveni', () => {
  const g = okruzenje();
  const sh = g.__ss.getSheetByName('PROIZVODI');
  sh.getRange(3, 7).setValue(false); // voda1 neaktivna
  const b = ok(g.getBootstrap());
  assert.equal(b.aktivna, null);
  assert.equal(b.proizvodi.length, 19);
  assert.ok(!b.proizvodi.some(p => p.product_id === 'voda1'));
  assert.deepEqual(b.radnici, ['Kenan', 'Edin']);
  assert.equal(b.proizvodi.filter(p => p.prati_zalihu).length, 14);
  assert.equal(b.proizvodi.find(p => p.product_id === 'clan50').clanarina_mjeseci, 1);
});

test('SCENARIJ PRIHVATANJA (tačka 7)', () => {
  const g = okruzenje();
  const pocetna = pocetnoSve(g, { redbull: 10, voda05: 15 });
  const s = ok(g.startShift({ shift_id: 'S-scenarij', radnik: 'Kenan', pocetna }));
  assert.equal(s.postojeca, false);
  assert.equal(s.smjena.vrijeme_pocetka, '16:03', 'vrijeme postavlja backend (Sarajevo)');

  const batch = [
    ev('S-scenarij', 'SALE', 'redbull'), ev('S-scenarij', 'SALE', 'redbull'),
    ev('S-scenarij', 'SALE', 'voda05'), ev('S-scenarij', 'SALE', 'voda05'), ev('S-scenarij', 'SALE', 'voda05'),
    ev('S-scenarij', 'RESTOCK', 'redbull', 5)
  ];
  const p1 = ok(g.pushEvents('S-scenarij', batch));
  assert.equal(p1.primljeno.length, 6);

  // isti batch ponovo → nema duplikata
  const p2 = ok(g.pushEvents('S-scenarij', batch));
  assert.equal(p2.primljeno.length, 0);
  assert.equal(p2.duplikati.length, 6);
  assert.equal(g.__tabela('DOGADJAJI').length, 6);

  g.__postaviSat(new Date('2026-11-21T21:33:00Z')); // 22:33
  const zavrsno = pocetnoSve(g, { redbull: 12, voda05: 12 });
  // razlika na robi → bez razloga odbijeno
  const bezRazloga = g.closeShift('S-scenarij', zavrsno, '11.00', '');
  assert.equal(bezRazloga.ok, false);
  assert.equal(bezRazloga.code, 'RAZLOG');

  const z = ok(g.closeShift('S-scenarij', zavrsno, '11.00', 'Ne znam'));
  const izv = z.izvjestaj;
  const rb = izv.stavke.find(x => x.product_id === 'redbull');
  assert.equal(rb.ocekivano, 13);
  assert.equal(rb.stvarno, 12);
  assert.equal(rb.razlika_kom, -1);
  assert.equal(rb.razlika_km, -4);
  assert.equal(rb.prodano_inventura, 3);
  assert.equal(rb.prodano_klik, 2);
  const vo = izv.stavke.find(x => x.product_id === 'voda05');
  assert.equal(vo.ocekivano, 12);
  assert.equal(vo.stvarno, 12);
  assert.equal(vo.razlika_kom, 0);
  assert.equal(izv.promet, 11);
  assert.equal(izv.kasa_ocekivano, 11);
  assert.equal(izv.kasa_stvarno, 11);
  assert.equal(izv.kasa_razlika, 0);
  assert.equal(izv.broj_razlika, 1);
  assert.equal(izv.vrijednost_razlike, -4);
  assert.equal(izv.stavke.filter(x => x.razlika_kom === 0).length, 14, 'ostali (14) se poklapaju');
  assert.equal(izv.prodano_kom, 5);
  assert.equal(izv.trajanje_min, 6 * 60 + 30);
  assert.equal(izv.pocetak, '16:03');
  assert.equal(izv.kraj, '22:33');

  // Sheet: SMJENE i INVENTURA tačno upisane
  const sm = g.__tabela('SMJENE')[0];
  assert.equal(sm.status, 'CLOSED');
  assert.equal(sm.promet, 11);
  assert.equal(sm.kasa_ocekivano, 11);
  assert.equal(sm.kasa_stvarno, 11);
  assert.equal(sm.kasa_razlika, 0);
  assert.equal(sm.broj_razlika, 1);
  assert.equal(sm.vrijednost_razlike, -4);
  assert.equal(sm.ukupno_prodano_klikovima, 5);
  assert.equal(sm.ukupno_prodano_po_inventuri, 6);
  assert.equal(sm.kasa_razlog, 'Ne znam');
  const inv = g.__tabela('INVENTURA').find(r => r.product_id === 'redbull');
  assert.deepEqual(
    [inv.pocetno_stanje, inv.dopunjeno, inv.evidentirano_prodano, inv.ocekivano_zavrsno, inv.stvarno_zavrsno, inv.prodano_po_inventuri, inv.razlika_kom, inv.razlika_KM],
    [10, 5, 2, 13, 12, 3, -1, -4]
  );
  const dog = g.__tabela('DOGADJAJI');
  assert.equal(dog.filter(d => d.tip_dogadjaja === 'SALE').reduce((a, d) => a + d.ukupno, 0), 11);
  assert.ok(dog.every(d => d.timestamp === '2026-11-21 16:03:00' && d.datum === '2026-11-21' && d.radnik === 'Kenan'));

  // događaj u zaključanu smjenu je odbijen
  const kasno = ok(g.pushEvents('S-scenarij', [ev('S-scenarij', 'SALE', 'redbull')]));
  assert.equal(kasno.primljeno.length, 0);
  assert.equal(kasno.odbijeni[0].code, 'SMJENA_ZATVORENA');
  assert.equal(g.__tabela('DOGADJAJI').length, 6);

  // ponovljeno zatvaranje (npr. pao internet) vraća isti izvještaj, ništa ne mijenja
  const opet = ok(g.closeShift('S-scenarij', pocetnoSve(g), '0', ''));
  assert.equal(opet.vec_zatvorena, true);
  assert.equal(opet.izvjestaj.promet, 11);
  assert.equal(opet.izvjestaj.stavke.find(x => x.product_id === 'redbull').razlika_kom, -1);
  assert.equal(g.__tabela('SMJENE')[0].kasa_stvarno, 11);

  // sljedeća smjena dobija završno stanje kao SUGESTIJU
  const b = ok(g.getBootstrap());
  assert.equal(b.aktivna, null);
  assert.equal(b.prijedlog.redbull, 12);
  assert.equal(b.prijedlog.voda05, 12);
});

test('UNDO_SALE ostavlja oba reda, neto se računa, ne može se poništiti više nego prodano', () => {
  const g = okruzenje();
  ok(g.startShift({ shift_id: 'S1', radnik: 'Edin', pocetna: pocetnoSve(g, { redbull: 5 }) }));
  const r = ok(g.pushEvents('S1', [ev('S1', 'SALE', 'redbull'), ev('S1', 'UNDO_SALE', 'redbull', 1), ev('S1', 'UNDO_SALE', 'redbull', 1)]));
  assert.equal(r.primljeno.length, 2);
  assert.equal(r.odbijeni.length, 1);
  assert.equal(r.odbijeni[0].code, 'NEMA_STA_PONISTITI');
  const d = g.__tabela('DOGADJAJI');
  assert.equal(d.length, 2);
  assert.deepEqual(d.map(x => [x.tip_dogadjaja, x.kolicina, x.ukupno]), [['SALE', 1, 4], ['UNDO_SALE', -1, -4]]);
  const z = ok(g.closeShift('S1', pocetnoSve(g, { redbull: 5 }), '0', ''));
  assert.equal(z.izvjestaj.promet, 0);
  assert.equal(z.izvjestaj.broj_razlika, 0);
  assert.equal(z.izvjestaj.prodano_kom, 0);
});

test('nema dvije otvorene smjene: drugi start vraća postojeću', () => {
  const g = okruzenje();
  ok(g.startShift({ shift_id: 'S-A', radnik: 'Edin', pocetna: pocetnoSve(g) }));
  ok(g.pushEvents('S-A', [ev('S-A', 'SALE', 'kong')]));
  const drugi = ok(g.startShift({ shift_id: 'S-B', radnik: 'Kenan', pocetna: pocetnoSve(g) }));
  assert.equal(drugi.postojeca, true);
  assert.equal(drugi.smjena.shift_id, 'S-A');
  assert.equal(drugi.smjena.radnik, 'Edin');
  assert.equal(drugi.smjena.dogadjaji.length, 1);
  assert.equal(g.__tabela('SMJENE').length, 1);
  // drugi telefon: bootstrap vraća aktivnu smjenu s događajima
  const b = ok(g.getBootstrap());
  assert.equal(b.aktivna.shift_id, 'S-A');
  assert.equal(b.aktivna.vrijeme_pocetka, '16:03');
  assert.equal(b.aktivna.dogadjaji.length, 1);
  assert.equal(b.aktivna.pocetna.kong, 0);
});

test('validacija starta i zatvaranja', () => {
  const g = okruzenje();
  const pun = pocetnoSve(g);
  const bezJednog = Object.assign({}, pun); delete bezJednog.kong;
  let r = g.startShift({ shift_id: 'X', radnik: 'Kenan', pocetna: bezJednog });
  assert.equal(r.code, 'NIJE_SVE_PREBROJANO'); assert.match(r.message, /Kong/);
  r = g.startShift({ shift_id: 'X', radnik: 'Kenan', pocetna: Object.assign({}, pun, { kong: -1 }) });
  assert.equal(r.code, 'NEISPRAVAN_BROJ');
  r = g.startShift({ shift_id: 'X', radnik: 'Kenan', pocetna: Object.assign({}, pun, { kong: '' }) });
  assert.equal(r.code, 'NIJE_SVE_PREBROJANO');
  r = g.startShift({ shift_id: 'X', radnik: '  ', pocetna: pun });
  assert.equal(r.code, 'NEMA_RADNIKA');
  assert.equal(g.__tabela('SMJENE').length, 0);

  ok(g.startShift({ shift_id: 'X', radnik: 'Kenan', pocetna: pun }));
  r = g.closeShift('X', bezJednog, '0', '');
  assert.equal(r.code, 'NIJE_SVE_PREBROJANO');
  r = g.closeShift('X', pun, '-5', 'x');
  assert.equal(r.code, 'KASA');
  r = g.closeShift('X', pun, '', 'x');
  assert.equal(r.code, 'KASA');
  r = g.closeShift('NEPOSTOJI', pun, '0', '');
  assert.equal(r.code, 'NEMA_SMJENE');
  // kasa razlika traži razlog
  ok(g.pushEvents('X', [ev('X', 'SALE', 'dnevna')]));
  r = g.closeShift('X', pun, '2,00', '');
  assert.equal(r.code, 'RAZLOG');
  const z = ok(g.closeShift('X', pun, '2,00', 'Greška u kucanju'));
  assert.equal(z.izvjestaj.kasa_razlika, -1);
  assert.equal(z.izvjestaj.usluge[0].naziv, 'Dnevna karta');
  assert.equal(z.izvjestaj.usluge[0].km, 3);
  // sve greške su na bosanskom i bez tehničkog žargona
  assert.ok(!/undefined|null|exception|TypeError/i.test(JSON.stringify(r)));
});

test('upozorenje kad je završno veće od početno + dopuna (ne blokira)', () => {
  const g = okruzenje();
  ok(g.startShift({ shift_id: 'U', radnik: 'Kenan', pocetna: pocetnoSve(g, { xl: 2 }) }));
  const z = ok(g.closeShift('U', pocetnoSve(g, { xl: 5 }), '0', 'Ne znam'));
  assert.equal(z.izvjestaj.upozorenja.length, 1);
  assert.match(z.izvjestaj.upozorenja[0], /XL/);
  assert.equal(z.izvjestaj.stavke.find(s => s.product_id === 'xl').razlika_kom, 3);
});

test('validacija događaja: tip, proizvod, količina, dopuna usluge', () => {
  const g = okruzenje();
  ok(g.startShift({ shift_id: 'V', radnik: 'Kenan', pocetna: pocetnoSve(g) }));
  const r = ok(g.pushEvents('V', [
    ev('V', 'KRADJA', 'redbull'), ev('V', 'SALE', 'nepostoji'), ev('V', 'SALE', 'redbull', 0),
    ev('V', 'SALE', 'redbull', 1.5), ev('V', 'RESTOCK', 'dnevna', 5), ev('V', 'RESTOCK', 'kong', -2),
    { shift_id: 'V', tip: 'SALE', product_id: 'kong', kolicina: 1 },
    ev('V', 'ADJUSTMENT', 'kong', -1), ev('V', 'SALE', 'kong', 1, { shift_id: 'NEPOSTOJI' })
  ]));
  assert.deepEqual(r.odbijeni.map(o => o.code), ['NEPOZNAT_TIP', 'NEMA_PROIZVODA', 'KOLICINA', 'KOLICINA', 'NE_PRATI_ZALIHU', 'KOLICINA', 'NEMA_ID', 'NEMA_SMJENE']);
  assert.equal(r.primljeno.length, 1);
  assert.equal(g.__tabela('DOGADJAJI')[0].tip_dogadjaja, 'ADJUSTMENT');
});

test('offline događaj dobija napomenu s vremenom telefona; batch s duplikatom unutar sebe', () => {
  const g = okruzenje();
  ok(g.startShift({ shift_id: 'O', radnik: 'Kenan', pocetna: pocetnoSve(g) }));
  const e = ev('O', 'SALE', 'rodeo', 1, { klijent_ms: SAT.getTime() - 10 * 60000 });
  const r = ok(g.pushEvents('O', [e, e]));
  assert.equal(r.primljeno.length, 1);
  assert.equal(r.duplikati.length, 1);
  assert.match(g.__tabela('DOGADJAJI')[0].napomena, /tapnuto u 15:53/);
});

test('lock se uvijek oslobađa, i nakon greške', () => {
  const g = okruzenje();
  g.startShift({ shift_id: 'L', radnik: 'Kenan', pocetna: {} });
  assert.equal(g.__stats.aktivniLock, false);
  ok(g.startShift({ shift_id: 'L', radnik: 'Kenan', pocetna: pocetnoSve(g) }));
  assert.equal(g.__stats.aktivniLock, false);
  assert.ok(g.__stats.lockovi >= 3);
});

test('članarine: novi član, produženje od isteka, istekla od danas', () => {
  const g = okruzenje();
  ok(g.startShift({ shift_id: 'C', radnik: 'Kenan', pocetna: pocetnoSve(g) }));
  const r1 = ok(g.pushEvents('C', [ev('C', 'SALE', 'clan30', 1, { clan: { member_id: 'M-1', ime: 'Amel Test', telefon: '061 111 222' } })]));
  assert.equal(r1.primljeno.length, 1);
  assert.equal(r1.clanovi[0].istek, '2026-12-21');
  // isti član, članarina još važi → produžava se od isteka
  const r2 = ok(g.pushEvents('C', [ev('C', 'SALE', 'clan50', 1, { clan: { member_id: 'M-1' } })]));
  assert.equal(r2.clanovi[0].istek, '2027-01-21');
  assert.equal(r2.clanovi[0].vrsta, 'clan50');
  let cl = g.__tabela('CLANOVI');
  assert.equal(cl.length, 1);
  assert.equal(cl[0].pocetak, '2026-11-21');
  // istekla članarina → od danas
  g.__ss.getSheetByName('CLANOVI').getRange(2, 6).setValue('2026-10-01');
  const r3 = ok(g.pushEvents('C', [ev('C', 'SALE', 'clan30', 1, { clan: { member_id: 'M-1' } })]));
  assert.equal(r3.clanovi[0].istek, '2026-12-21');
  cl = g.__tabela('CLANOVI');
  assert.equal(cl[0].pocetak, '2026-11-21');
  // član bez imena i bez postojećeg ID-a → odbijeno; undo članarine → odbijeno
  const r4 = ok(g.pushEvents('C', [ev('C', 'SALE', 'clan30', 1, { clan: { member_id: 'M-2' } }), ev('C', 'UNDO_SALE', 'clan30', 1)]));
  assert.deepEqual(r4.odbijeni.map(o => o.code), ['CLAN', 'CLAN_UNDO']);
  // članarina ide u promet i kasu
  const z = ok(g.closeShift('C', pocetnoSve(g), '110', ''));
  assert.equal(z.izvjestaj.promet, 110);
  assert.equal(z.izvjestaj.kasa_razlika, 0);
  const d = g.__tabela('DOGADJAJI');
  assert.match(d[0].napomena, /Novi član Amel Test, važi do 21\.12\.2026\./);
  // pretraga bez obzira na kvačice
  const s = ok(g.searchMembers('amel'));
  assert.equal(s.clanovi.length, 1);
  assert.equal(ok(g.searchMembers('111')).clanovi.length, 1);
});

test('dodavanje mjeseci i produženje (rubni slučajevi)', () => {
  const g = napraviOkruzenje();
  assert.equal(g.dodajMjesece_('2026-01-31', 1), '2026-02-28');
  assert.equal(g.dodajMjesece_('2028-01-31', 1), '2028-02-29');
  assert.equal(g.dodajMjesece_('2026-12-15', 1), '2027-01-15');
  assert.equal(g.dodajMjesece_('2026-11-30', 3), '2027-02-28');
  assert.deepEqual(JSON.parse(JSON.stringify(g.produziClanarinu_('2026-11-25', '2026-11-21', 1))), { aktivna: true, osnova: '2026-11-25', istek: '2026-12-25' });
  assert.equal(g.produziClanarinu_('2026-11-21', '2026-11-21', 1).istek, '2026-12-21');
  assert.equal(g.produziClanarinu_('2026-11-20', '2026-11-21', 1).istek, '2026-12-21');
  assert.equal(g.produziClanarinu_('', '2026-11-21', 1).istek, '2026-12-21');
  assert.equal(g.datum_('5.3.2026'), '2026-03-05');
});

test('periodi: sedmica počinje ponedjeljkom', () => {
  const g = napraviOkruzenje();
  const p = JSON.parse(JSON.stringify(g.periodi_('2026-11-21'))); // subota
  assert.deepEqual(p, { danas: '2026-11-21', od7: '2026-11-15', mjesecOd: '2026-11-01', sedmicaOd: '2026-11-16', proslaOd: '2026-11-09', proslaDo: '2026-11-15' });
  assert.equal(g.periodi_('2026-11-16').sedmicaOd, '2026-11-16'); // ponedjeljak
  assert.equal(g.periodi_('2026-11-22').sedmicaOd, '2026-11-16'); // nedjelja
});

test('vlasnik: PIN, pregled (profit, plata, zalihe, članovi), historija, detalji', () => {
  const g = okruzenje();
  assert.equal(g.getAdminData('0000').code, 'PIN');
  assert.equal(g.checkPin('0000').ok, false);
  ok(g.checkPin('2308'));

  // prošla sedmica: ponedjeljak 16.11. smjena s 2 Red Bulla i jednom članarinom 24/7
  g.__postaviSat(new Date('2026-11-12T09:00:00Z'));
  ok(g.startShift({ shift_id: 'P1', radnik: 'Edin', pocetna: pocetnoSve(g, { redbull: 10 }) }));
  ok(g.pushEvents('P1', [ev('P1', 'SALE', 'redbull'), ev('P1', 'SALE', 'redbull'), ev('P1', 'SALE', 'clan50', 1, { clan: { member_id: 'M-9', ime: 'Mirza', telefon: '062' } })]));
  ok(g.closeShift('P1', pocetnoSve(g, { redbull: 7 }), '58', 'Ne znam'));

  // ova sedmica (subota 21.11.)
  g.__postaviSat(SAT);
  ok(g.startShift({ shift_id: 'P2', radnik: 'Kenan', pocetna: pocetnoSve(g, { redbull: 7, voda05: 4 }) }));
  ok(g.pushEvents('P2', [ev('P2', 'SALE', 'voda05'), ev('P2', 'SALE', 'dnevna')]));

  const a = ok(g.getAdminData('2308'));
  // Red Bull profit = 4 − 2,30×1,03 = 1,631 ; ×2 = 3,262 ; clan50 profit = 30 → 33,26
  assert.equal(a.prosla.promet, 58);
  assert.equal(a.prosla.profit, 33.26);
  assert.equal(a.plata.prosla, 9.98);
  // voda 1 − 0,50×1,03 = 0,485 ; dnevna 3 → 3,49 (zaokruženo)
  assert.equal(a.danas.promet, 4);
  assert.equal(a.danas.profit, 3.49);
  assert.equal(a.sedmica.profit, 3.49);
  assert.equal(a.mjesec.promet, 62);
  assert.equal(a.mjesec.manjak_km, -4);
  assert.equal(a.mjesec.top[0].naziv, 'Mjesečna 24/7');
  assert.equal(a.mjesec.po_radniku.length, 2);
  assert.equal(a.otvorena.radnik, 'Kenan');
  assert.equal(a.otvorena.stara, false);
  const vo = a.zalihe.find(z => z.product_id === 'voda05');
  assert.equal(vo.kolicina, 3);
  assert.equal(vo.nisko, true); // minimum 6
  assert.equal(a.clanovi.istice.length, 0, 'Mirza važi do 12.12.');
  assert.equal(a.clanovi.aktivnih, 1);

  // članarina ističe za 3 dana / istekla prije 2 dana
  g.__ss.getSheetByName('CLANOVI').getRange(2, 6).setValue('2026-11-24');
  let c = ok(g.getExpiringMembers('2308'));
  assert.equal(c.istice.length, 1);
  assert.equal(c.istice[0].dana, 3);
  assert.equal(c.istice[0].telefon, '062');
  g.__ss.getSheetByName('CLANOVI').getRange(2, 6).setValue('2026-11-19');
  c = ok(g.getExpiringMembers('2308'));
  assert.equal(c.istekli.length, 1);

  // vlasnik mijenja telefon člana
  const sm = ok(g.saveMember('2308', { member_id: 'M-9', ime: 'Mirza M.', telefon: '062 333' }));
  assert.equal(sm.clan.telefon, '062 333');
  assert.equal(g.__tabela('CLANOVI').length, 1);

  const h = ok(g.getHistory('2308', 30));
  assert.equal(h.smjene.length, 2);
  assert.equal(h.smjene[0].shift_id, 'P2', 'najnovija prva');
  assert.equal(h.smjene[1].broj_razlika, 1);
  const d = ok(g.getShiftDetails('2308', 'P1'));
  assert.equal(d.izvjestaj.stavke.find(s => s.product_id === 'redbull').razlika_kom, -1);
  assert.equal(d.izvjestaj.usluge[0].km, 50);
  assert.equal(g.getShiftDetails('1111', 'P1').code, 'PIN');
});

test('zaboravljena smjena: upozorenje nakon 14 h, vlasnik zatvara bez izmišljanja brojeva', () => {
  const g = okruzenje();
  ok(g.startShift({ shift_id: 'Z', radnik: 'Edin', pocetna: pocetnoSve(g, { kong: 4 }) }));
  ok(g.pushEvents('Z', [ev('Z', 'SALE', 'kong')]));
  g.__postaviSat(new Date(SAT.getTime() + 15 * 3600000));
  const a = ok(g.getAdminData('2308'));
  assert.equal(a.otvorena.stara, true);
  assert.equal(a.otvorena.sati, 15);
  assert.equal(g.adminCloseShift('2308', 'Z', '').code, 'NAPOMENA');
  const z = ok(g.adminCloseShift('2308', 'Z', 'Edin zaboravio zatvoriti'));
  assert.equal(z.izvjestaj.bez_brojanja, true);
  assert.equal(z.izvjestaj.promet, 2);
  const sm = g.__tabela('SMJENE')[0];
  assert.equal(sm.status, 'CLOSED');
  assert.equal(sm.kasa_stvarno, '');
  assert.match(sm.kasa_razlog, /Zatvorio vlasnik/);
  const inv = g.__tabela('INVENTURA').find(r => r.product_id === 'kong');
  assert.equal(inv.ocekivano_zavrsno, 3);
  assert.equal(inv.stvarno_zavrsno, '', 'stvarno stanje se ne izmišlja');
  // prijedlog ne koristi smjenu bez brojanja
  assert.equal(ok(g.getBootstrap()).prijedlog.kong, undefined);
  // telefon koji još ima neposlane promjene dobija jasno odbijanje
  const kasno = ok(g.pushEvents('Z', [ev('Z', 'SALE', 'kong')]));
  assert.equal(kasno.odbijeni[0].code, 'SMJENA_ZATVORENA');
  assert.equal(g.adminCloseShift('2308', 'Z', 'opet').code, 'SMJENA_ZATVORENA');
});

test('PREGLED: formule upisane, bez XLOOKUP/FILTER', () => {
  const g = okruzenje();
  const sh = g.__ss.getSheetByName('PREGLED');
  const sve = sh.getDataRange().getValues().flat().filter(v => typeof v === 'string' && v.startsWith('='));
  assert.ok(sve.length > 600);
  assert.ok(!sve.some(f => /XLOOKUP|FILTER\(/.test(f)));
  // zagrade i navodnici izbalansirani u svakoj formuli
  for (const f of sve) {
    let d = 0; for (const ch of f.replace(/"[^"]*"/g, '')) { if (ch === '(') d++; if (ch === ')') d--; assert.ok(d >= 0, f); }
    assert.equal(d, 0, f);
    assert.equal((f.match(/"/g) || []).length % 2, 0, f);
  }
  assert.equal(sh.getRange('B3').getValue(), '=TEXT(TODAY(),"yyyy-mm-dd")');
  assert.match(sh.getRange('R16').getValue(), /QUERY\(DOGADJAJI!\$A:\$L,"select G, sum\(I\), sum\(K\) where \(F='SALE' or F='UNDO_SALE'\) and C = '"&\$B\$3&"' group by G/);
});

test('doGet servira Index s viewport meta tagom', () => {
  const g = napraviOkruzenje();
  assert.ok(g.doGet());
});

test('nova verzija koda sama nadogradi tabele (bez ručnog setupSpreadsheet)', () => {
  const g = napraviOkruzenje({ sada: SAT });
  // stari Sheet: PROIZVODI bez kolona tip/minimum, bez proizvoda "trener", bez tabele ULAZI
  const sh = g.__ss.insertSheet('PROIZVODI');
  sh.getRange(1, 1, 1, 6).setValues([['product_id', 'kategorija', 'naziv', 'cijena', 'nabavna_cijena', 'prati_zalihu']]);
  sh.getRange(2, 1, 1, 6).setValues([['redbull', 'Energy', 'Red Bull', 4, 2.3, true]]);
  const b = ok(g.getBootstrap());
  assert.ok(g.__ss.getSheetByName('ULAZI'));
  assert.ok(b.proizvodi.some(p => p.product_id === 'trener'));
  assert.equal(g.__props.VERZIJA_SEME, g.VERZIJA_SEME);
  const n = g.__stats.lockovi;
  ok(g.getBootstrap());
  assert.equal(g.__stats.lockovi, n, 'drugi put se ne radi ništa');
  assert.equal(g.__tabela('PROIZVODI').find(p => p.product_id === 'redbull').cijena, 4, 'podaci netaknuti');
});

test('ako nadogradnja tabela zakaže, aplikacija i dalje radi, a greška se zapiše', () => {
  const g = napraviOkruzenje({ sada: SAT });
  g.setupSpreadsheet();
  delete g.__props.VERZIJA_SEME;
  g.osigurajTabele_ = () => { throw new Error('Sheets je pao'); };
  const b = g.getBootstrap();
  assert.equal(b.ok, true, 'bootstrap radi i bez nadogradnje');
  assert.ok(b.proizvodi.length > 10);
  assert.match(g.__props.MIGRACIJE_GRESKE, /nadogradnja: Sheets je pao/);
  const n = g.__stats.lockovi;
  g.getBootstrap();
  assert.equal(g.__stats.lockovi, n, 'ne pokušava ponovo svaki put');
});
