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
  assert.equal(g.__tabela('PROIZVODI').length, 18, 'ništa obrisano');
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
