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
  assert.equal(g.__tabela('PROIZVODI').length, 22, 'ništa obrisano');
  // vlasnik vidi i neaktivne + nabavnu
  const a = ok(g.getAdminData('2580'));
  assert.equal(a.proizvodi.find(p => p.product_id === 'kong').aktivan, false);
  assert.equal(a.proizvodi.find(p => p.product_id === 'redbull').nabavna, 2.3);
});

test('napomene radnika: upisuju se, ne utiču na brojeve, vide se u izvještaju', () => {
  const g = okruzenje();
  ok(g.startShift({ shift_id: 'N', radnik: 'Edin', pocetna: pocetno(g, { redbull: 3 }) }));
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
  ok(g.startShift({ shift_id: 'K', radnik: 'Edin', pocetna: pocetno(g) }));
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
  const r = ok(g.saveLists('2580', { radnici: ['Edin', 'Amra', 'Edin', ' '], treneri: 'Edin, Kenan, Amar' }));
  assert.deepEqual(r.radnici, ['Edin', 'Amra']);
  assert.deepEqual(r.treneri, ['Edin', 'Kenan', 'Amar']);
  const b = ok(g.getBootstrap());
  assert.deepEqual(b.radnici, ['Edin', 'Amra']);
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

test('radnik dodaje novo piće: odmah se prodaje i broji, vlasnik vidi „dodao", cijene postojećih ne može mijenjati', () => {
  const g = okruzenje();
  // prije smjene (na početnom brojanju)
  const r0 = ok(g.addProductRadnik({ naziv: 'Bang Energy', kategorija: 'Energy', cijena: '4,00', tip: 'roba', radnik: 'Edin' }));
  assert.equal(r0.proizvod.product_id, 'bang_energy');
  assert.equal(r0.proizvod.prati_zalihu, true);
  assert.equal(r0.u_smjenu, false);
  assert.equal(g.addProductRadnik({ naziv: 'red bull', cijena: 9, radnik: 'Edin' }).code, 'POSTOJI', 'ne može "prepraviti" Red Bull');
  assert.equal(g.addProductRadnik({ naziv: 'X', cijena: 2 }).code, 'NAZIV');
  assert.equal(g.addProductRadnik({ naziv: 'Skupo', cijena: 0 }).code, 'CIJENA');
  ok(g.saveProduct('2580', { product_id: 'kong', naziv: 'Kong', kategorija: 'Energy', cijena: 2, nabavna: 1, tip: 'roba', aktivan: false }));
  assert.match(g.addProductRadnik({ naziv: 'Kong', cijena: 2 }).message, /isključio/);

  // usred smjene: novo piće ulazi u inventuru s 0 + dopuna
  ok(g.startShift({ shift_id: 'R', radnik: 'Edin', pocetna: pocetno(g) }));
  const r1 = ok(g.addProductRadnik({ naziv: 'Monster Mango', kategorija: 'Energy', cijena: 4.5, tip: 'roba', radnik: 'Edin', shift_id: 'R' }));
  assert.equal(r1.u_smjenu, true);
  ok(g.pushEvents('R', [
    { event_id: 'r1', shift_id: 'R', tip: 'RESTOCK', product_id: 'monster_mango', kolicina: 6 },
    { event_id: 'r2', shift_id: 'R', tip: 'SALE', product_id: 'monster_mango', kolicina: 1 }
  ]));
  const brojanje = pocetno(g);
  assert.equal(brojanje.monster_mango, 0, 'novo piće se traži i u završnom brojanju');
  brojanje.monster_mango = 5;
  const z = ok(g.closeShift('R', brojanje, '4.5', ''));
  const mm = z.izvjestaj.stavke.find(s => s.product_id === 'monster_mango');
  assert.deepEqual([mm.pocetno, mm.dopunjeno, mm.prodano_klik, mm.ocekivano, mm.razlika_kom], [0, 6, 1, 5, 0]);
  // vlasnik vidi ko je dodao; kad sačuva (potvrdi), oznaka nestaje
  let a = ok(g.getAdminData('2580'));
  assert.match(a.proizvodi.find(p => p.product_id === 'monster_mango').dodao, /^Edin 2026-11-21 16:03/);
  ok(g.saveProduct('2580', { product_id: 'monster_mango', naziv: 'Monster Mango', kategorija: 'Energy', cijena: 4.5, nabavna: 2.4, tip: 'roba', aktivan: true }));
  a = ok(g.getAdminData('2580'));
  assert.equal(a.proizvodi.find(p => p.product_id === 'monster_mango').dodao, '');
});

test('raspored treninga: primjer Enes (ned–čet 19h), uređivanje po danima, brisanje, prikaz radniku', () => {
  const g = okruzenje();
  let b = ok(g.getBootstrap());
  assert.deepEqual(b.raspored.map(r => r.dan), ['pon', 'uto', 'sri', 'cet', 'ned']);
  assert.ok(b.raspored.every(r => r.vrijeme === '19:00' && /Enes Velić/.test(r.osobe)));
  assert.equal(g.danUSedmici_('2026-11-22'), 'ned');
  assert.equal(g.danUSedmici_('2026-11-23'), 'pon');
  // vlasnik upiše šta trenira po danima; srijedu ukloni, doda petak
  const r = ok(g.saveTermin('2580', { termin_id: 'T-enes', osobe: 'Enes Velić + supruga, Nino', vrijeme: '19:00', trener: 'Kenan',
    dani: { ned: 'Noge', pon: 'Prsa + triceps', uto: 'Leđa + biceps', cet: 'Ramena', pet: 'Kardio' } }));
  assert.deepEqual(r.raspored.map(x => x.dan + ':' + x.trening), ['pon:Prsa + triceps', 'uto:Leđa + biceps', 'cet:Ramena', 'pet:Kardio', 'ned:Noge']);
  assert.ok(r.raspored.every(x => x.trener === 'Kenan'));
  // drugi termin isti dan, ranije — sortira se po vremenu
  ok(g.saveTermin('2580', { osobe: 'Amra', vrijeme: '7:30', dani: { pon: 'Full body' } }));
  b = ok(g.getBootstrap());
  const pon = b.raspored.filter(x => x.dan === 'pon');
  assert.deepEqual(pon.map(x => x.vrijeme + ' ' + x.osobe.split(' ')[0]), ['07:30 Amra', '19:00 Enes']);
  // validacija i PIN
  assert.equal(g.saveTermin('1111', {}).code, 'PIN');
  assert.equal(g.saveTermin('2580', { osobe: 'X', vrijeme: '19:00', dani: {} }).code, 'DANI');
  assert.equal(g.saveTermin('2580', { osobe: 'X', vrijeme: 'navečer', dani: { pon: '' } }).code, 'VRIJEME');
  // brisanje: nestane iz rasporeda, redovi ostaju (neaktivni)
  const n = g.__tabela('TRENINZI').length;
  ok(g.deleteTermin('2580', 'T-enes'));
  assert.ok(!ok(g.getBootstrap()).raspored.some(x => x.termin_id === 'T-enes'));
  assert.equal(g.__tabela('TRENINZI').length, n);
  // ponovni setup ne vraća obrisani primjer
  g.setupSpreadsheet();
  assert.ok(!ok(g.getBootstrap()).raspored.some(x => x.termin_id === 'T-enes'));
});

test('kasa na početku + potrošnja osoblja + uzeto iz kase: tačan obračun kase i zalihe', () => {
  const g = okruzenje();
  assert.equal(g.startShift({ shift_id: 'X', radnik: 'Edin', pocetna: pocetno(g), kasa_pocetna: '-5' }).code, 'KASA');
  const s = ok(g.startShift({ shift_id: 'K1', radnik: 'Edin', pocetna: pocetno(g, { protein: 10, redbull: 6 }), kasa_pocetna: '50,00' }));
  assert.equal(s.smjena.kasa_pocetna, 50);
  const r = ok(g.pushEvents('K1', [
    { event_id: 'a1', shift_id: 'K1', tip: 'SALE', product_id: 'redbull', kolicina: 1 },                 // +4 KM
    { event_id: 'a2', shift_id: 'K1', tip: 'POTROSNJA', product_id: 'protein', kolicina: 2, osoba: 'Edin' },
    { event_id: 'a3', shift_id: 'K1', tip: 'POTROSNJA', product_id: 'redbull', kolicina: 1, osoba: 'Kenan' },
    { event_id: 'a4', shift_id: 'K1', tip: 'POTROSNJA', product_id: 'protein', kolicina: -1, osoba: 'Edin' }, // ispravka
    { event_id: 'a5', shift_id: 'K1', tip: 'POTROSNJA', product_id: 'protein', kolicina: -5, osoba: 'Edin' }, // više nego što ima
    { event_id: 'a6', shift_id: 'K1', tip: 'POTROSNJA', product_id: 'protein', kolicina: 1 },                 // bez osobe
    { event_id: 'a7', shift_id: 'K1', tip: 'POTROSNJA', product_id: 'dnevna', kolicina: 1, osoba: 'Edin' },   // nije roba
    { event_id: 'a8', shift_id: 'K1', tip: 'KASA_IZLAZ', iznos: '20', osoba: 'Kenan', napomena: 'za struju' },
    { event_id: 'a9', shift_id: 'K1', tip: 'KASA_IZLAZ', iznos: '0', osoba: 'Kenan' }
  ]));
  assert.deepEqual(r.primljeno, ['a1', 'a2', 'a3', 'a4', 'a8']);
  assert.deepEqual(r.odbijeni.map(o => o.code), ['NEMA_STA_PONISTITI', 'OSOBA', 'NE_PRATI_ZALIHU', 'IZNOS']);
  // protein: 10 − 1 (Edin neto) = 9 ; red bull: 6 − 1 prodan − 1 Kenan = 4 ; kasa: 50 + 4 − 20 = 34
  const z = ok(g.closeShift('K1', pocetno(g, { protein: 9, redbull: 4 }), '34', ''));
  const iz = z.izvjestaj;
  assert.equal(iz.broj_razlika, 0, 'potrošnja nije manjak');
  assert.equal(iz.kasa_pocetna, 50);
  assert.equal(iz.uzeto_iz_kase, 20);
  assert.equal(iz.kasa_ocekivano, 34);
  assert.equal(iz.kasa_razlika, 0);
  assert.equal(iz.promet, 4, 'potrošnja i uzeto ne utiču na promet');
  assert.deepEqual(iz.potrosnja.map(x => x.osoba + ':' + x.naziv + ':' + x.kom), ['Edin:Protein:1', 'Kenan:Red Bull:1']);
  assert.equal(iz.potrosnja[0].nabavna, 2.37); // 2,30 × 1,03
  assert.equal(iz.kasa_izlazi[0].napomena, 'za struju');
  const pr = iz.stavke.find(x => x.product_id === 'protein');
  assert.deepEqual([pr.potroseno, pr.ocekivano, pr.prodano_inventura], [1, 9, 0]);
  const sm = g.__tabela('SMJENE')[0];
  assert.deepEqual([sm.kasa_pocetna, sm.kasa_ocekivano, sm.uzeto_iz_kase], [50, 34, 20]);
  assert.equal(g.__tabela('INVENTURA').find(x => x.product_id === 'protein').potroseno, 1);
  // vlasnik vidi ko je koliko potrošio / uzeo
  const a = ok(g.getAdminData('2580'));
  const edin = a.osoblje.mjesec.find(o => o.osoba === 'Edin');
  const kenan = a.osoblje.mjesec.find(o => o.osoba === 'Kenan');
  assert.equal(edin.kom, 1);
  assert.deepEqual(edin.stavke, [{ naziv: 'Protein', kom: 1 }]);
  assert.equal(kenan.uzeto, 20);
  assert.equal(kenan.nabavna, 2.37);
});

test('nova pića (Mega Watt, Hell, Monster) i stanje koje je javio vlasnik: podsjetnik, ne zamjena brojanja', () => {
  const g = okruzenje();
  const b = ok(g.getBootstrap());
  const prod = id => b.proizvodi.find(p => p.product_id === id);
  assert.deepEqual([prod('mega_watt').cijena, prod('hell_0_5_l').cijena, prod('monster').cijena], [2, 3, 4]);
  assert.ok(['mega_watt', 'hell_0_5_l', 'monster'].every(id => prod(id).prati_zalihu && prod(id).kategorija === 'Energy'));
  const pr = g.__tabela('PROIZVODI');
  assert.deepEqual([pr.find(p => p.product_id === 'mega_watt').nabavna_cijena, pr.find(p => p.product_id === 'hell_0_5_l').nabavna_cijena, pr.find(p => p.product_id === 'monster').nabavna_cijena], [1, 1.65, 2.8]);
  assert.deepEqual(JSON.parse(JSON.stringify(b.prijavljeno)), { powerade: 2, voda1: 23, voda05: 73, redbull: 9, sultan_kola: 12, mega_watt: 71, hell_0_5_l: 10, monster: 4 });
  // ponovni setup ne dodaje duplikate
  g.setupSpreadsheet();
  assert.equal(g.__tabela('PROIZVODI').filter(p => p.naziv === 'Monster').length, 1);
  // podsjetnik ne popunjava brojanje: smjena traži prave brojeve, a poslije starta podsjetnik nestaje
  assert.equal(g.startShift({ shift_id: 'Z', radnik: 'Kenan', pocetna: {} }).code, 'NIJE_SVE_PREBROJANO');
  ok(g.startShift({ shift_id: 'Z', radnik: 'Kenan', pocetna: pocetno(g, { mega_watt: 70, monster: 4 }) }));
  assert.deepEqual(JSON.parse(JSON.stringify(ok(g.getBootstrap()).prijavljeno)), {});
});
