/* Testovi: vlasnički PIN, proizvodi iz aplikacije, napomene, Tuya (vrata, svjetla, ulazi) uz lažni Tuya server */
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { napraviOkruzenje } = require('./gas-mock.cjs');

const SAT = new Date('2026-11-21T15:03:00Z');
const ok = r => { assert.equal(r.ok, true, JSON.stringify(r)); return JSON.parse(JSON.stringify(r)); };

function okruzenje() {
  const g = napraviOkruzenje({ sada: SAT });
  g.setupSpreadsheet();
  return g;
}
function pocetno(g, x = {}) {
  const o = {};
  ok(g.getBootstrap()).proizvodi.filter(p => p.prati_zalihu).forEach(p => { o[p.product_id] = 0; });
  return Object.assign(o, x);
}

const { lazniTuya, ID, SECRET, BRAVA, SVJETLA } = require('./lazni-tuya.cjs');

test('PIN: pogrešan 5× zaključava, promjena PIN-a radi i ne vraća se iz CONFIG-a', () => {
  const g = okruzenje();
  for (let i = 0; i < 5; i++) assert.equal(g.checkPin('0000').code, 'PIN');
  assert.equal(g.checkPin('2580').code, 'PIN_BLOK', 'i tačan PIN blokiran dok traje zaključavanje');
  g.CacheService.getScriptCache().remove('pin_greske');
  assert.equal(g.changePin('2580', '12').code, 'NOVI_PIN');
  ok(g.changePin('2580', '4711'));
  assert.equal(g.checkPin('2580').code, 'PIN');
  ok(g.checkPin('4711'));
  ok(g.getAdminData('4711'));
});

test('vlasnik dodaje i mijenja proizvod iz aplikacije; radnik ga odmah vidi', () => {
  const g = okruzenje();
  assert.equal(g.saveProduct('1111', { naziv: 'Monster' }).code, 'PIN');
  assert.equal(g.saveProduct('2580', { naziv: 'Monster', cijena: 0 }).code, 'CIJENA');
  const r = ok(g.saveProduct('2580', { naziv: 'Monster Energy', kategorija: 'Energy', cijena: '4,50', nabavna: 2.6, prati_zalihu: true, minimum: 4 }));
  assert.equal(r.product_id, 'monster_energy');
  assert.equal(r.novi, true);
  const b = ok(g.getBootstrap());
  const m = b.proizvodi.find(p => p.product_id === 'monster_energy');
  assert.equal(m.cijena, 4.5);
  assert.equal(m.prati_zalihu, true);
  assert.equal(b.proizvodi[b.proizvodi.length - 1].product_id, 'monster_energy', 'novi ide na kraj');
  // isti naziv → novi ID, ne gazi postojeći
  assert.equal(ok(g.saveProduct('2580', { naziv: 'Monster Energy', cijena: 5 })).product_id, 'monster_energy_2');
  // promjena cijene i deaktivacija postojećeg
  ok(g.saveProduct('2580', { product_id: 'redbull', naziv: 'Red Bull', kategorija: 'Energy', cijena: 4.5, nabavna: 2.3, prati_zalihu: true, aktivan: true, minimum: 6 }));
  ok(g.saveProduct('2580', { product_id: 'kong', naziv: 'Kong', kategorija: 'Energy', cijena: 2, nabavna: 1, prati_zalihu: true, aktivan: false }));
  const b2 = ok(g.getBootstrap());
  assert.equal(b2.proizvodi.find(p => p.product_id === 'redbull').cijena, 4.5);
  assert.ok(!b2.proizvodi.some(p => p.product_id === 'kong'));
  assert.equal(g.__tabela('PROIZVODI').length, 19, 'ništa obrisano');
  // vlasnik vidi i neaktivne + nabavnu
  const a = ok(g.getAdminData('2580'));
  assert.equal(a.proizvodi.find(p => p.product_id === 'kong').aktivan, false);
  assert.equal(a.proizvodi.find(p => p.product_id === 'redbull').nabavna, 2.3);
});

test('napomene radnika: upisuju se, ne utiču na brojeve, vide se u izvještaju', () => {
  const g = okruzenje();
  ok(g.startShift({ shift_id: 'N', radnik: 'Edvin', pocetna: pocetno(g, { redbull: 3 }) }));
  const r = ok(g.pushEvents('N', [
    { event_id: 'n1', shift_id: 'N', tip: 'NAPOMENA', napomena: 'Frižider curi' },
    { event_id: 'n2', shift_id: 'N', tip: 'NAPOMENA', napomena: '  ' },
    { event_id: 's1', shift_id: 'N', tip: 'SALE', product_id: 'redbull', kolicina: 1 }
  ]));
  assert.deepEqual(r.primljeno, ['n1', 's1']);
  assert.equal(r.odbijeni[0].code, 'PRAZNA_NAPOMENA');
  const z = ok(g.closeShift('N', pocetno(g, { redbull: 2 }), '4', ''));
  assert.equal(z.izvjestaj.promet, 4);
  assert.equal(z.izvjestaj.broj_razlika, 0);
  assert.deepEqual(z.izvjestaj.napomene, [{ vrijeme: '16:03', tekst: 'Frižider curi' }]);
  assert.equal(z.izvjestaj.pocetak_ts, '2026-11-21 16:03:00', 'početno brojanje vezano za tačnu sekundu');
});

test('Tuya: bez postavki jasna poruka; sve funkcije traže PIN; secret se nikad ne vraća', () => {
  const g = okruzenje();
  for (const [fn, args] of [['tuyaStatus', []], ['tuyaOtkljucaj', []], ['tuyaSvjetla', [true]], ['getUlazi', [7]], ['getTuyaSettings', []], ['tuyaAutomatika', [true]], ['saveTuyaSettings', [{}]]]) {
    assert.equal(g[fn]('9999', ...args).code, 'PIN', fn);
    g.CacheService.getScriptCache().remove('pin_greske');
  }
  assert.equal(ok(g.tuyaStatus('2580')).postavljeno, false);
  assert.equal(g.tuyaOtkljucaj('2580').code, 'NEMA_BRAVE');
  const t = lazniTuya([]);
  g.__postaviFetch(t.fetch);
  const sp = ok(g.saveTuyaSettings('2580', { access_id: ID, secret: SECRET, region: 'eu', brava_id: BRAVA, svjetla_id: SVJETLA }));
  assert.equal(sp.provjera, 'Veza s Tuyom radi.');
  const s = ok(g.getTuyaSettings('2580'));
  assert.equal(s.ima_secret, true);
  assert.ok(!JSON.stringify(s).includes(SECRET), 'secret ne ide na telefon');
  // prazan secret pri ponovnom čuvanju zadržava stari
  ok(g.saveTuyaSettings('2580', { access_id: ID, secret: '', region: 'eu', brava_id: BRAVA, svjetla_id: SVJETLA }));
  assert.equal(g.__props.TUYA_SECRET, SECRET);
  // pogrešan secret → razumljiva greška
  const los = napraviOkruzenje({ sada: SAT }); los.setupSpreadsheet(); los.__postaviFetch(t.fetch);
  assert.equal(los.saveTuyaSettings('2580', { access_id: ID, secret: 'krivo', region: 'eu' }).code, 'TUYA_PRIJAVA');
});

test('Tuya: status, otključavanje, svjetla, ponovna prijava kad token istekne', () => {
  const g = okruzenje();
  const t = lazniTuya([]);
  g.__postaviFetch(t.fetch);
  ok(g.saveTuyaSettings('2580', { access_id: ID, secret: SECRET, region: 'eu', brava_id: BRAVA, svjetla_id: SVJETLA }));
  const st = ok(g.tuyaStatus('2580'));
  assert.deepEqual(st.brava, { naziv: 'Ulazna vrata', online: true, baterija: 78, greska: '' });
  assert.equal(st.svjetla.upaljeno, false);
  assert.equal(ok(g.tuyaSvjetla('2580', true)).upaljeno, true);
  assert.equal(t.stanje.svjetlo, true);
  assert.equal(ok(g.tuyaStatus('2580')).svjetla.upaljeno, true);
  // token istekao na strani Tuye → aplikacija se sama ponovo prijavi
  t.stanje.tokeni++;
  ok(g.tuyaSvjetla('2580', false));
  assert.equal(t.stanje.svjetlo, false);
  assert.equal(ok(g.tuyaOtkljucaj('2580')).poruka, 'Vrata su otključana.');
  assert.equal(t.stanje.otkljucano, 1);
  assert.equal(t.stanje.losPotpis, 0, 'svaki zahtjev ispravno potpisan');
  assert.equal(g.__tabela('ULAZI')[0].nacin, 'Daljinski (vlasnik iz aplikacije)');
});

test('Tuya: ulazi s čipom/šifrom povezani s članovima; istekla članarina označena; bez duplikata', () => {
  const g = okruzenje();
  ok(g.startShift({ shift_id: 'C', radnik: 'Kenan', pocetna: pocetno(g) }));
  ok(g.pushEvents('C', [
    { event_id: 'c1', shift_id: 'C', tip: 'SALE', product_id: 'clan50', kolicina: 1, clan: { member_id: 'M1', ime: 'Amel Hodžić', telefon: '061' } },
    { event_id: 'c2', shift_id: 'C', tip: 'SALE', product_id: 'clan30', kolicina: 1, clan: { member_id: 'M2', ime: 'Lejla', telefon: '062' } }
  ]));
  // vlasnik upiše broj čipa za Amela; Lejla ima isteklu članarinu
  ok(g.saveMember('2580', { member_id: 'M1', ime: 'Amel Hodžić', telefon: '061', brava_id: 'CHIP-0042' }));
  g.__ss.getSheetByName('CLANOVI').getRange(3, 6).setValue('2026-11-01');
  const t0 = SAT.getTime();
  const logovi = [
    { id: 101, update_time: t0 - 3600000, status: [{ code: 'unlock_card', value: 'CHIP-0042' }], user_id: 'u1' },
    { id: 102, update_time: t0 - 1800000, status: [{ code: 'unlock_password', value: '7' }], unlock_name: 'Lejla' },
    { id: 103, update_time: t0 - 600000, status: { code: 'unlock_fingerprint', value: 3 }, user_id: 'nepoznat' }
  ];
  const t = lazniTuya(logovi);
  g.__postaviFetch(t.fetch);
  ok(g.saveTuyaSettings('2580', { access_id: ID, secret: SECRET, region: 'eu', brava_id: BRAVA }));
  const r = ok(g.getUlazi('2580', 7, true));
  assert.equal(r.poruka, 'Povučeno 3 novih ulaza.');
  assert.equal(r.danas, 3);
  const [treci, drugi, prvi] = r.ulazi; // najnoviji prvi
  assert.deepEqual([prvi.vrijeme, prvi.nacin, prvi.ime, prvi.clanarina, prvi.napomena], ['15:03', 'Čip / kartica', 'Amel Hodžić', 'aktivna do 21.12.2026.', '']);
  assert.equal(drugi.nacin, 'Šifra');
  assert.equal(drugi.ime, 'Lejla');
  assert.match(drugi.clanarina, /ISTEKLA/);
  assert.equal(drugi.napomena, 'Ušao bez važeće članarine');
  assert.equal(treci.nacin, 'Otisak prsta');
  assert.match(treci.napomena, /Nepoznat korisnik/);
  assert.equal(r.sumnjivi, 2);
  // ponovno povlačenje ne duplira
  assert.equal(ok(g.getUlazi('2580', 7, true)).poruka, 'Nema novih ulaza.');
  assert.equal(g.__tabela('ULAZI').length, 3);
});

test('Tuya: automatsko povlačenje ulaza svakih 5 min (uključi/isključi bez dupliranja okidača)', () => {
  const g = okruzenje();
  ok(g.tuyaAutomatika('2580', true));
  ok(g.tuyaAutomatika('2580', true));
  assert.equal(g.__okidaci().length, 1);
  assert.equal(g.__okidaci()[0].min, 5);
  assert.equal(ok(g.getTuyaSettings('2580')).automatika, true);
  ok(g.tuyaAutomatika('2580', false));
  assert.equal(g.__okidaci().length, 0);
  // okidač bez postavki ne pada
  assert.deepEqual(JSON.parse(JSON.stringify(g.sinhronizujUlaze())), { novih: 0 });
});

test('Tuya potpis odgovara službenom algoritmu (nezavisna provjera)', () => {
  const g = napraviOkruzenje();
  const sig = g.tuyaPotpis_('cid', 'sec', 'tok', '1700000000000', 'n1', 'POST', '/v1.0/x?a=1&b=2', '{"k":1}');
  const str = 'POST\n' + crypto.createHash('sha256').update('{"k":1}').digest('hex') + '\n\n/v1.0/x?a=1&b=2';
  assert.equal(sig, crypto.createHmac('sha256', 'sec').update('cidtok1700000000000n1' + str).digest('hex').toUpperCase());
  assert.equal(g.sha256Hex_(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
});

test('PAKET: mjesečna karta 40 + trener 60 — oboje u kasi, član dobija kartu i trenera, vlasnik vidi evidenciju', () => {
  const g = okruzenje();
  // vlasnik postavi kartu na 40 KM (primjer iz prakse)
  ok(g.saveProduct('2580', { product_id: 'clan30', naziv: 'Mjesečna karta', kategorija: 'Članarine', cijena: 40, nabavna: 0, tip: 'clanarina', aktivan: true }));
  const b = ok(g.getBootstrap());
  assert.deepEqual(b.treneri, ['Kenan', 'Edin']);
  assert.equal(b.proizvodi.find(p => p.product_id === 'trener').tip, 'trener');
  assert.equal(b.proizvodi.find(p => p.product_id === 'dnevna').tip, 'dnevna');
  ok(g.startShift({ shift_id: 'K', radnik: 'Edvin', pocetna: pocetno(g) }));
  const clan = { member_id: 'M-P', ime: 'Nermin', telefon: '061', trener: 'Edin' };
  const r = ok(g.pushEvents('K', [
    { event_id: 'k1', shift_id: 'K', tip: 'SALE', product_id: 'clan30', kolicina: 1, clan },
    { event_id: 'k2', shift_id: 'K', tip: 'SALE', product_id: 'trener', kolicina: 1, clan },
    { event_id: 'k3', shift_id: 'K', tip: 'SALE', product_id: 'dnevna', kolicina: 1 },
    { event_id: 'k4', shift_id: 'K', tip: 'SALE', product_id: 'trener', kolicina: 1, clan: { member_id: 'M-X', ime: 'Bez trenera' } }
  ]));
  assert.deepEqual(r.primljeno, ['k1', 'k2', 'k3']);
  assert.equal(r.odbijeni[0].message, 'Izaberi trenera.');
  const c = g.__tabela('CLANOVI').find(x => x.member_id === 'M-P');
  assert.equal(c.istek, '2026-12-21');
  assert.equal(c.trener, 'Edin');
  assert.equal(c.trener_do, '2026-12-21');
  assert.equal(g.__tabela('CLANOVI').length, 2, 'jedan član, ne dva (+ član iz odbijenog paketa bez trenera)');
  const z = ok(g.closeShift('K', pocetno(g), '103', ''));
  assert.equal(z.izvjestaj.promet, 103);
  assert.deepEqual(z.izvjestaj.usluge.map(u => [u.naziv, u.km]), [['Dnevna karta', 3], ['Mjesečna karta', 40], ['Lični trener (mjesečno)', 60]]);
  const a = ok(g.getAdminData('2580'));
  assert.equal(a.karte.mjesec.dnevne.kom, 1);
  assert.equal(a.karte.mjesec.mjesecne.promet, 40);
  assert.equal(a.karte.mjesec.nove, 1);
  assert.equal(a.karte.mjesec.trener.promet, 60);
  assert.equal(a.karte.mjesec.trener.profit, 0, 'trenerov novac ne ulazi u profit (ni u platu radnika) dok vlasnik ne promijeni');
  assert.equal(a.karte.aktivnih_karti, 1);
  assert.equal(a.karte.sa_trenerom[0].ime, 'Nermin');
  assert.equal(a.karte.po_treneru.Edin, 1);
  assert.equal(a.danas.profit, 43);
});

test('Postavke: vlasnik mijenja spisak radnika i trenera', () => {
  const g = okruzenje();
  assert.equal(g.saveLists('0000', { radnici: ['X'] }).code, 'PIN');
  assert.equal(g.saveLists('2580', { treneri: ' , ' }).code, 'TRENERI');
  const r = ok(g.saveLists('2580', { radnici: ['Edvin', 'Amra', 'Edvin', ' '], treneri: 'Edin, Kenan, Amar' }));
  assert.deepEqual(r.radnici, ['Edvin', 'Amra']);
  assert.deepEqual(r.treneri, ['Edin', 'Kenan', 'Amar']);
  const b = ok(g.getBootstrap());
  assert.deepEqual(b.radnici, ['Edvin', 'Amra']);
  assert.deepEqual(b.treneri, ['Edin', 'Kenan', 'Amar']);
});

test('saveProduct: tip određuje ponašanje (roba se broji, karta ne)', () => {
  const g = okruzenje();
  ok(g.saveProduct('2580', { naziv: 'Godišnja karta', kategorija: 'Članarine', cijena: 350, tip: 'clanarina', prati_zalihu: true }));
  ok(g.saveProduct('2580', { naziv: 'Proteinska čokoladica', kategorija: 'Suplementi', cijena: 3, nabavna: 1.5, tip: 'roba' }));
  const b = ok(g.getBootstrap());
  const god = b.proizvodi.find(p => p.naziv === 'Godišnja karta');
  assert.equal(god.prati_zalihu, false);
  assert.equal(god.clanarina_mjeseci, 1);
  assert.equal(god.tip, 'clanarina');
  assert.equal(b.proizvodi.find(p => p.naziv === 'Proteinska čokoladica').prati_zalihu, true);
  ok(g.saveProduct('2580', { product_id: god.product_id, naziv: 'Godišnja karta', kategorija: 'Članarine', cijena: 350, tip: 'clanarina', clanarina_mjeseci: 12 }));
  assert.equal(ok(g.getBootstrap()).proizvodi.find(p => p.naziv === 'Godišnja karta').clanarina_mjeseci, 12);
});
