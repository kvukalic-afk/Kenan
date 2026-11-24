/**
 * ═══════════════════════════════════════════════════════════════
 *  FITNESS CLUB ADIN — EVIDENCIJA ŠANKA (backend)
 *  Google Apps Script. Google Sheet je JEDINI izvor istine.
 * ═══════════════════════════════════════════════════════════════
 */

/* ═══════ POSTAVKE — mijenjaj samo ovdje ═══════ */
var CONFIG = {
  ADMIN_PIN: '2580',                 // početni PIN za vlasnika (poslije se mijenja u aplikaciji: Vlasnik → Postavke)
  RADNICI: ['Kenan', 'Edin'],       // velika dugmad na prvom ekranu (+ "Drugi") — mijenja se i u aplikaciji
  TRENERI: ['Kenan', 'Edin'],        // ko može biti lični trener — mijenja se i u aplikaciji
  VLASNICI: 'Edin & Kenan',          // pozdrav u vlasničkom pregledu
  TZ: 'Europe/Sarajevo',
  PREVOZ: 0.03,                      // 3% na nabavnu cijenu robe (prevoz)
  PLATA_UDIO: 0.30,                  // plata radnika = 30% sedmičnog profita
  STARA_SMJENA_SATI: 14,             // upozorenje za zaboravljenu otvorenu smjenu
  ISTICE_DANA: 5,                    // "ističe u narednih 5 dana"
  RAZLOZI: ['Greška u kucanju', 'Gratis / poklon', 'Lom ili isteklo', 'Ne znam']
};

/* ═══════ STRUKTURA TABELA ═══════ */
var TAB = {
  PROIZVODI: 'PROIZVODI', SMJENE: 'SMJENE', DOGADJAJI: 'DOGADJAJI',
  INVENTURA: 'INVENTURA', CLANOVI: 'CLANOVI', PREGLED: 'PREGLED', ULAZI: 'ULAZI', TRENINZI: 'TRENINZI'
};

var KOLONE = {
  PROIZVODI: ['product_id', 'kategorija', 'naziv', 'cijena', 'nabavna_cijena', 'prati_zalihu',
    'aktivan', 'redoslijed', 'minimum', 'clanarina_mjeseci', 'tip', 'dodao'],
  SMJENE: ['shift_id', 'datum', 'radnik', 'vrijeme_pocetka', 'vrijeme_kraja', 'status',
    'ukupno_prodano_klikovima', 'ukupno_prodano_po_inventuri', 'promet', 'kasa_ocekivano',
    'kasa_stvarno', 'kasa_razlika', 'kasa_razlog', 'broj_razlika', 'vrijednost_razlike',
    'created_at', 'updated_at', 'kasa_pocetna', 'uzeto_iz_kase', 'potrosnja_nabavna'],
  DOGADJAJI: ['event_id', 'shift_id', 'datum', 'timestamp', 'radnik', 'tip_dogadjaja',
    'product_id', 'proizvod', 'kolicina', 'cijena', 'ukupno', 'napomena', 'osoba'],
  INVENTURA: ['shift_id', 'datum', 'radnik', 'product_id', 'proizvod', 'pocetno_stanje',
    'dopunjeno', 'evidentirano_prodano', 'ocekivano_zavrsno', 'stvarno_zavrsno',
    'prodano_po_inventuri', 'razlika_kom', 'razlika_KM', 'potroseno'],
  CLANOVI: ['member_id', 'ime', 'telefon', 'vrsta', 'pocetak', 'istek', 'zadnje_produzenje',
    'napomena', 'aktivan', 'brava_id', 'trener', 'trener_do'],
  ULAZI: ['izvor_id', 'datum', 'vrijeme', 'nacin', 'korisnik_brave', 'ime', 'member_id', 'clanarina', 'napomena'],
  TRENINZI: ['termin_id', 'osobe', 'dan', 'vrijeme', 'trening', 'trener', 'napomena', 'aktivan']
};

// Kolone koje moraju ostati čisti tekst (da ih Sheets ne pretvori u datum/vrijeme/broj)
var TEKST_KOLONE = {
  PROIZVODI: ['product_id'],
  SMJENE: ['shift_id', 'datum', 'vrijeme_pocetka', 'vrijeme_kraja', 'created_at', 'updated_at'],
  DOGADJAJI: ['event_id', 'shift_id', 'datum', 'timestamp', 'product_id'],
  INVENTURA: ['shift_id', 'datum', 'product_id'],
  CLANOVI: ['member_id', 'telefon', 'pocetak', 'istek', 'zadnje_produzenje', 'brava_id', 'trener_do'],
  ULAZI: ['izvor_id', 'datum', 'vrijeme', 'korisnik_brave', 'member_id'],
  TRENINZI: ['termin_id', 'dan', 'vrijeme']
};

var SEED_PROIZVODI = [
  // product_id, kategorija, naziv, cijena, nabavna, prati_zalihu, aktivan, redoslijed, minimum, clanarina_mjeseci, tip
  ['voda05', 'Voda', 'Voda 0,5 L', 1.00, 0.50, true, true, 10, 6, 0, 'roba'],
  ['voda1', 'Voda', 'Voda 1 L', 2.00, 0.80, true, true, 20, 4, 0, 'roba'],
  ['redbull', 'Energy', 'Red Bull', 4.00, 2.30, true, true, 30, 6, 0, 'roba'],
  ['rodeo', 'Energy', 'Rodeo', 2.00, 1.00, true, true, 40, 4, 0, 'roba'],
  ['xl', 'Energy', 'XL', 2.00, 1.00, true, true, 50, 4, 0, 'roba'],
  ['kong', 'Energy', 'Kong', 2.00, 1.00, true, true, 60, 4, 0, 'roba'],
  ['sultan_power', 'Energy', 'Sultan Power', 2.00, 1.00, true, true, 70, 4, 0, 'roba'],
  ['sultan_kola', 'Sokovi', 'Sultan Kola', 2.00, 1.00, true, true, 80, 4, 0, 'roba'],
  ['powerade', 'Sport', 'PowerRade', 2.50, 1.70, true, true, 90, 4, 0, 'roba'],
  ['protein', 'Suplementi', 'Protein', 3.00, 2.30, true, true, 100, 3, 0, 'roba'],
  ['kreatin', 'Suplementi', 'Kreatin', 2.00, 1.10, true, true, 110, 3, 0, 'roba'],
  ['preworkout', 'Suplementi', 'Preworkout', 4.00, 3.00, true, true, 120, 3, 0, 'roba'],
  ['dnevna', 'Karte', 'Dnevna karta', 3.00, 0, false, true, 130, 0, 0, 'dnevna'],
  ['peskir', 'Usluge', 'Peškir najam', 2.00, 0, false, true, 140, 0, 0, 'usluga'],
  ['clan30', 'Članarine', 'Mjesečna članarina', 30.00, 0, false, true, 150, 0, 1, 'clanarina'],
  ['clan50', 'Članarine', 'Mjesečna 24/7', 50.00, 20.00, false, true, 160, 0, 1, 'clanarina'],
  ['trener', 'Trener', 'Lični trener (mjesečno)', 60.00, 60.00, false, true, 170, 0, 1, 'trener']
];

var TIPOVI = ['SALE', 'UNDO_SALE', 'RESTOCK', 'ADJUSTMENT', 'NAPOMENA', 'POTROSNJA', 'KASA_IZLAZ'];
var MAX_PROIZVODA_U_PREGLEDU = 40;
var TIPOVI_PROIZVODA = ['roba', 'usluga', 'dnevna', 'clanarina', 'trener'];
var VERZIJA_SEME = '6';
var DANI = ['pon', 'uto', 'sri', 'cet', 'pet', 'sub', 'ned'];   // povećaj kad se mijenja struktura tabela — nadogradnja se radi sama pri prvom otvaranju

/* ═══════════════════════════════════════════════════════════════
 *  WEB APLIKACIJA
 * ═══════════════════════════════════════════════════════════════ */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Adin Šank')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover')
    .addMetaTag('apple-mobile-web-app-capable', 'yes')
    .addMetaTag('mobile-web-app-capable', 'yes');
}

function onOpen() {
  try {
    SpreadsheetApp.getUi().createMenu('Adin Šank')
      .addItem('Postavi / popravi tabele', 'setupSpreadsheet')
      .addItem('Obnovi PREGLED (formule)', 'obnoviPregled')
      .addToUi();
  } catch (e) { /* nema UI (npr. pokrenuto iz web aplikacije) */ }
}

/* ═══════════════════════════════════════════════════════════════
 *  POMOĆNE FUNKCIJE
 * ═══════════════════════════════════════════════════════════════ */
function greska_(kod, poruka) {
  var e = new Error(poruka);
  e.kod = kod;
  e.poruka = poruka;
  return e;
}

/** Svaki javni API poziv prolazi ovuda: uvijek vraća {ok:true,...} ili {ok:false, code, message}. */
function api_(fn) {
  try {
    var r = fn() || {};
    r.ok = true;
    return r;
  } catch (e) {
    if (e && e.kod) return { ok: false, code: e.kod, message: e.poruka };
    try { console.error(e && e.stack ? e.stack : e); } catch (x) { /* */ }
    return { ok: false, code: 'GRESKA', message: 'Nešto nije u redu na serveru. Pokušaj ponovo za par sekundi.' };
  }
}

function zakljucano_(fn) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (e) {
    throw greska_('ZAUZETO', 'Server je trenutno zauzet. Pokušaj ponovo za par sekundi.');
  }
  try {
    var r = fn();
    SpreadsheetApp.flush();
    return r;
  } finally {
    lock.releaseLock();
  }
}

function svojstva_() { return PropertiesService.getScriptProperties(); }

/** Liste koje vlasnik mijenja u aplikaciji (Postavke); ako nisu mijenjane — iz CONFIG-a. */
function lista_(kljuc, pod) {
  try {
    var v = JSON.parse(svojstva_().getProperty(kljuc) || 'null');
    if (Array.isArray(v) && v.length) return v.map(String);
  } catch (e) { /* */ }
  return pod.slice();
}
function radnici_() { return lista_('RADNICI', CONFIG.RADNICI); }
function treneri_() { return lista_('TRENERI', CONFIG.TRENERI); }

function aktivniPin_() {
  var p = svojstva_().getProperty('ADMIN_PIN');
  return p ? String(p) : String(CONFIG.ADMIN_PIN);
}

/** Provjera PIN-a; nakon 5 pogrešnih pokušaja zaključava se na 10 minuta. */
function provjeriPin_(pin) {
  var kes = CacheService.getScriptCache();
  var greske = Number(kes.get('pin_greske') || 0);
  if (greske >= 5) throw greska_('PIN_BLOK', 'Previše pogrešnih pokušaja. Pokušaj ponovo za 10 minuta.');
  if (String(pin || '') !== aktivniPin_()) {
    kes.put('pin_greske', String(greske + 1), 600);
    throw greska_('PIN', 'Pogrešan PIN.');
  }
  if (greske) kes.remove('pin_greske');
}

function nowDate_() { return new Date(); }
function fmt_(d, f) { return Utilities.formatDate(d, CONFIG.TZ, f); }
function sada_() {
  var d = nowDate_();
  return { datum: fmt_(d, 'yyyy-MM-dd'), vrijeme: fmt_(d, 'HH:mm'), ts: fmt_(d, 'yyyy-MM-dd HH:mm:ss'), ms: d.getTime() };
}

function jeDatum_(v) { return Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime()); }

/** Vrijednost ćelije → tekst (Date se formatira u sarajevskom vremenu). */
function s_(v) {
  if (v === null || v === undefined) return '';
  if (jeDatum_(v)) return fmt_(v, 'yyyy-MM-dd HH:mm:ss');
  return String(v).trim();
}

/** Ćelija → 'yyyy-MM-dd' (prihvata i Date i "21.11.2026"). */
function datum_(v) {
  if (jeDatum_(v)) return fmt_(v, 'yyyy-MM-dd');
  var t = s_(v);
  var m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return m[1] + '-' + pad2_(m[2]) + '-' + pad2_(m[3]);
  m = t.match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/);
  if (m) return m[3] + '-' + pad2_(m[2]) + '-' + pad2_(m[1]);
  return '';
}

/** Ćelija → 'HH:mm'. */
function vrijeme_(v) {
  if (jeDatum_(v)) return fmt_(v, 'HH:mm');
  var m = s_(v).match(/(\d{1,2}):(\d{2})/);
  return m ? pad2_(m[1]) + ':' + m[2] : '';
}

function pad2_(n) { return ('0' + String(Number(n))).slice(-2); }

function num_(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  var n = Number(String(v).replace(/\s/g, '').replace(',', '.'));
  return isFinite(n) ? n : 0;
}

function bool_(v) {
  if (v === true) return true;
  if (v === false || v === null || v === undefined) return false;
  var t = String(v).trim().toLowerCase();
  return t === 'true' || t === 'da' || t === 'yes' || t === '1' || t === 'x' || t === 'istina';
}

function r2_(n) { return Math.round((Number(n) || 0) * 100) / 100; }

function noviId_(prefiks) {
  var u;
  try { u = Utilities.getUuid(); } catch (e) { u = String(Date.now()) + Math.random().toString(36).slice(2); }
  return prefiks + u;
}

/** 'yyyy-MM-dd' → broj dana od epohe (UTC, bez problema s ljetnim računanjem). */
function danBroj_(d) {
  var m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return Math.round(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000);
}

function danUDatum_(n) {
  var d = new Date(n * 86400000);
  return d.getUTCFullYear() + '-' + pad2_(d.getUTCMonth() + 1) + '-' + pad2_(d.getUTCDate());
}

function dodajDane_(d, n) { return danUDatum_(danBroj_(d) + n); }

/** Dodaje mjesece; 31.01. + 1 mjesec = 28/29.02. */
function dodajMjesece_(d, n) {
  var m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
  var y = +m[1], mj = +m[2] - 1 + n, dan = +m[3];
  y += Math.floor(mj / 12);
  mj = ((mj % 12) + 12) % 12;
  var maxDan = new Date(Date.UTC(y, mj + 1, 0)).getUTCDate();
  return y + '-' + pad2_(mj + 1) + '-' + pad2_(Math.min(dan, maxDan));
}

/** Produženje članarine: od isteka ako još važi, inače od danas. */
function produziClanarinu_(istek, danas, mjeseci) {
  var aktivna = !!istek && istek >= danas;
  var osnova = aktivna ? istek : danas;
  return { aktivna: aktivna, osnova: osnova, istek: dodajMjesece_(osnova, mjeseci || 1) };
}

/** 'yyyy-MM-dd HH:mm:ss' (sarajevsko vrijeme) → minute; služi samo za razlike. */
function tsMin_(ts) {
  var m = String(ts || '').match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (!m) return null;
  return Math.round(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) / 60000);
}

function dT_(d) {
  var m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? m[3] + '.' + m[2] + '.' + m[1] + '.' : String(d);
}

/** Periodi za pregled (sedmica počinje ponedjeljkom). */
function periodi_(danas) {
  var n = danBroj_(danas);
  var danUSedmici = (new Date(n * 86400000).getUTCDay() + 6) % 7; // pon=0 ... ned=6
  var ponedjeljak = n - danUSedmici;
  return {
    danas: danas,
    od7: danUDatum_(n - 6),
    mjesecOd: danas.slice(0, 8) + '01',
    sedmicaOd: danUDatum_(ponedjeljak),
    proslaOd: danUDatum_(ponedjeljak - 7),
    proslaDo: danUDatum_(ponedjeljak - 1)
  };
}

function normaliziraj_(t) {
  return String(t || '').toLowerCase()
    .replace(/[čć]/g, 'c').replace(/đ/g, 'dj').replace(/š/g, 's').replace(/ž/g, 'z').trim();
}

/* ═══════ RAD S TABELAMA ═══════ */
function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

function list_(ime) {
  var sh = ss_().getSheetByName(ime);
  if (!sh) {
    osigurajTabele_();
    sh = ss_().getSheetByName(ime);
  }
  if (!sh) throw greska_('NEMA_TABELE', 'Tabela ' + ime + ' ne postoji. Vlasnik treba pokrenuti setupSpreadsheet.');
  return sh;
}

/** Čita cijelu tabelu u objekte po imenima kolona (redoslijed kolona u Sheetu nije bitan). */
function tabela_(ime) {
  var sh = list_(ime);
  var lr = sh.getLastRow(), lc = sh.getLastColumn();
  if (lr < 1 || lc < 1) return { sh: sh, kol: [], redovi: [] };
  var v = sh.getRange(1, 1, lr, lc).getValues();
  var kol = v[0].map(function (k) { return String(k).trim(); });
  var redovi = [];
  for (var i = 1; i < v.length; i++) {
    var prazan = true, o = { _red: i + 1 };
    for (var j = 0; j < kol.length; j++) {
      if (!kol[j]) continue;
      o[kol[j]] = v[i][j];
      if (v[i][j] !== '' && v[i][j] !== null) prazan = false;
    }
    if (!prazan) redovi.push(o);
  }
  return { sh: sh, kol: kol, redovi: redovi };
}

function uRed_(t, o, stari) {
  return t.kol.map(function (k) {
    if (!k) return stari ? stari[k] : '';
    if (o.hasOwnProperty(k) && o[k] !== undefined && o[k] !== null) return o[k];
    if (stari && stari.hasOwnProperty(k)) return stari[k];
    return '';
  });
}

function dodajRedove_(t, objekti) {
  if (!objekti.length) return;
  var redovi = objekti.map(function (o) { return uRed_(t, o, null); });
  var start = t.sh.getLastRow() + 1;
  t.sh.getRange(start, 1, redovi.length, t.kol.length).setValues(redovi);
}

function azurirajRed_(t, stari, izmjene) {
  t.sh.getRange(stari._red, 1, 1, t.kol.length).setValues([uRed_(t, izmjene, stari)]);
  for (var k in izmjene) if (izmjene.hasOwnProperty(k)) stari[k] = izmjene[k];
}

/** Samo kolona event_id — brza provjera duplikata. */
function postojeciEventId_() {
  var sh = list_(TAB.DOGADJAJI);
  var lr = sh.getLastRow();
  var set = {};
  if (lr < 2) return set;
  var lc = sh.getLastColumn();
  var zaglavlje = sh.getRange(1, 1, 1, lc).getValues()[0].map(function (k) { return String(k).trim(); });
  var c = zaglavlje.indexOf('event_id') + 1;
  if (c < 1) return set;
  var v = sh.getRange(2, c, lr - 1, 1).getValues();
  for (var i = 0; i < v.length; i++) if (v[i][0] !== '') set[String(v[i][0])] = true;
  return set;
}

/* ═══════ PROIZVODI ═══════ */
function proizvodi_(sviUkljucujuciNeaktivne) {
  var t = tabela_(TAB.PROIZVODI);
  var lista = t.redovi.filter(function (r) { return s_(r.product_id); }).map(function (r) {
    return {
      product_id: s_(r.product_id),
      kategorija: s_(r.kategorija) || 'Ostalo',
      naziv: s_(r.naziv) || s_(r.product_id),
      cijena: r2_(num_(r.cijena)),
      nabavna: num_(r.nabavna_cijena),
      prati_zalihu: bool_(r.prati_zalihu),
      aktivan: s_(r.aktivan) === '' ? true : bool_(r.aktivan),
      redoslijed: s_(r.redoslijed) === '' ? 9999 : num_(r.redoslijed),
      minimum: num_(r.minimum),
      clanarina_mjeseci: Math.max(0, Math.round(num_(r.clanarina_mjeseci))),
      dodao: s_(r.dodao)
    };
  });
  lista.forEach(function (p, i) { p.tip = tipProizvoda_(t.redovi.filter(function (r) { return s_(r.product_id); })[i], p); });
  lista.sort(function (a, b) { return a.redoslijed - b.redoslijed || (a.naziv < b.naziv ? -1 : 1); });
  return sviUkljucujuciNeaktivne ? lista : lista.filter(function (p) { return p.aktivan; });
}

/** Vrsta proizvoda: iz kolone `tip`, a ako je prazna — pogađa se (stari Sheet ostaje ispravan). */
function tipProizvoda_(r, p) {
  var t = s_(r && r.tip).toLowerCase();
  if (TIPOVI_PROIZVODA.indexOf(t) >= 0) return t;
  if (p.prati_zalihu) return 'roba';
  if (p.clanarina_mjeseci > 0) return /trener|trening personal|personal/i.test(p.naziv) ? 'trener' : 'clanarina';
  if (/dnevn/i.test(p.naziv) || p.product_id === 'dnevna') return 'dnevna';
  return 'usluga';
}
function jeClanarina_(p) { return p.tip === 'clanarina'; }
function jeTrener_(p) { return p.tip === 'trener'; }
function trebaClana_(p) { return p.tip === 'clanarina' || p.tip === 'trener'; }

/** Trošak po komadu: roba = nabavna + prevoz, usluge/članarine = nabavna kakva jeste. */
function trosak_(p) {
  return p.prati_zalihu ? p.nabavna * (1 + CONFIG.PREVOZ) : p.nabavna;
}

function javniProizvod_(p) {
  return {
    product_id: p.product_id, kategorija: p.kategorija, naziv: p.naziv, cijena: p.cijena,
    prati_zalihu: p.prati_zalihu, minimum: p.minimum, clanarina_mjeseci: p.clanarina_mjeseci, tip: p.tip
  };
}

/* ═══════════════════════════════════════════════════════════════
 *  ČISTA POSLOVNA LOGIKA (bez Sheeta — testira se u Nodeu)
 * ═══════════════════════════════════════════════════════════════ */

/** Sabira događaje po proizvodu. UNDO_SALE ima negativnu količinu. */
function sazetakDogadjaja_(dogadjaji, cijene) {
  var s = {};
  (dogadjaji || []).forEach(function (e) {
    var pid = s_(e.product_id);
    var tip = s_(e.tip_dogadjaja || e.tip);
    var q = num_(e.kolicina);
    if (!s[pid]) s[pid] = { prodano: 0, dopunjeno: 0, korekcija: 0, promet: 0, potroseno: 0 };
    var x = s[pid];
    if (tip === 'SALE' || tip === 'UNDO_SALE') {
      if (tip === 'UNDO_SALE') q = -Math.abs(q);
      x.prodano += q;
      var uk = (e.ukupno !== undefined && e.ukupno !== '') ? num_(e.ukupno) : q * num_(cijene && cijene[pid]);
      if (tip === 'UNDO_SALE') uk = -Math.abs(uk);
      x.promet += uk;
    } else if (tip === 'RESTOCK') {
      x.dopunjeno += q;
    } else if (tip === 'ADJUSTMENT') {
      x.korekcija += q;
    } else if (tip === 'POTROSNJA') {
      x.potroseno += q;
    }
  });
  return s;
}

/**
 * Obračun smjene po formulama:
 *   ocekivano_zavrsno    = pocetno + dopunjeno − evidentirano_prodano
 *   prodano_po_inventuri = pocetno + dopunjeno − stvarno_zavrsno
 *   razlika_kom          = stvarno_zavrsno − ocekivano_zavrsno
 *   razlika_KM           = razlika_kom × cijena
 * (ADJUSTMENT se računa kao dio "dopunjeno".)
 */
/* Potrošnja osoblja/vlasnika se oduzima od očekivanog: ocekivano = pocetno + dopunjeno − prodano − potrošeno. */
function obracunSmjene_(proizvodi, pocetna, dogadjaji, brojanje) {
  var cijene = {};
  proizvodi.forEach(function (p) { cijene[p.product_id] = p.cijena; });
  var s = sazetakDogadjaja_(dogadjaji, cijene);
  var nula = { prodano: 0, dopunjeno: 0, korekcija: 0, promet: 0, potroseno: 0 };
  var poId = {};
  proizvodi.forEach(function (p) { poId[p.product_id] = p; });

  var ids = Object.keys(pocetna || {});
  // redoslijed kao u listi proizvoda
  ids.sort(function (a, b) {
    var pa = poId[a] ? poId[a].redoslijed : 99999, pb = poId[b] ? poId[b].redoslijed : 99999;
    return pa - pb;
  });

  var stavke = ids.map(function (pid) {
    var p = poId[pid] || { product_id: pid, naziv: pid, cijena: 0 };
    var x = s[pid] || nula;
    var poc = Math.round(num_(pocetna[pid]));
    var dop = x.dopunjeno + x.korekcija;
    var pot = x.potroseno || 0;
    var ocek = poc + dop - x.prodano - pot;
    var imaBroj = brojanje && brojanje[pid] !== undefined && brojanje[pid] !== null && brojanje[pid] !== '';
    var stv = imaBroj ? Math.round(num_(brojanje[pid])) : null;
    var raz = stv === null ? null : stv - ocek;
    return {
      product_id: pid, naziv: p.naziv, cijena: p.cijena,
      pocetno: poc, dopunjeno: dop, prodano_klik: x.prodano, potroseno: pot, ocekivano: ocek,
      stvarno: stv,
      prodano_inventura: stv === null ? null : poc + dop - pot - stv,
      razlika_kom: raz,
      razlika_km: raz === null ? null : r2_(raz * p.cijena)
    };
  });

  var upozorenja = [];
  stavke.forEach(function (st) {
    if (st.stvarno !== null && st.stvarno > st.pocetno + st.dopunjeno) {
      upozorenja.push(st.naziv + ': prebrojano ' + st.stvarno + ', a početno + dopuna je samo ' +
        (st.pocetno + st.dopunjeno) + '. Provjeri je li dopuna evidentirana.');
    }
  });

  var usluge = [];
  Object.keys(s).forEach(function (pid) {
    if (pocetna && pocetna.hasOwnProperty(pid)) return;
    if (s[pid].prodano === 0 && r2_(s[pid].promet) === 0) return;
    var p = poId[pid] || { naziv: pid, redoslijed: 99999 };
    usluge.push({ product_id: pid, naziv: p.naziv, kom: s[pid].prodano, km: r2_(s[pid].promet), _r: p.redoslijed });
  });
  usluge.sort(function (a, b) { return a._r - b._r; });
  usluge.forEach(function (u) { delete u._r; });

  var promet = 0, kom = 0;
  Object.keys(s).forEach(function (pid) { promet += s[pid].promet; kom += s[pid].prodano; });

  // potrošnja osoblja/vlasnika (po osobi) i novac uzet iz kase
  var potMapa = {}, uzeto = 0, izlazi = [];
  (dogadjaji || []).forEach(function (e) {
    var tip = s_(e.tip_dogadjaja || e.tip);
    if (tip === 'POTROSNJA') {
      var o = s_(e.osoba) || '—', pid = s_(e.product_id), p = poId[pid] || { naziv: pid, nabavna: 0, cijena: 0, prati_zalihu: true };
      var k = o + '|' + pid;
      if (!potMapa[k]) potMapa[k] = { osoba: o, product_id: pid, naziv: p.naziv, kom: 0, nabavna: 0, prodajna: 0 };
      var q = num_(e.kolicina);
      potMapa[k].kom += q;
      potMapa[k].nabavna += q * trosak_(p);
      potMapa[k].prodajna += q * (p.cijena || 0);
    } else if (tip === 'KASA_IZLAZ') {
      var iznos = Math.abs(num_(e.cijena !== undefined && e.cijena !== '' ? e.cijena : e.iznos));
      uzeto += iznos;
      izlazi.push({ vrijeme: vrijeme_(e.timestamp), osoba: s_(e.osoba), iznos: r2_(iznos), napomena: s_(e.napomena) });
    }
  });
  var potrosnja = Object.keys(potMapa).map(function (k) { var x = potMapa[k]; x.nabavna = r2_(x.nabavna); x.prodajna = r2_(x.prodajna); return x; })
    .filter(function (x) { return x.kom !== 0; })
    .sort(function (a, b) { return a.osoba < b.osoba ? -1 : a.osoba > b.osoba ? 1 : 0; });
  var problemi = stavke.filter(function (st) { return st.razlika_kom !== null && st.razlika_kom !== 0; });
  var poInv = 0, sveIzbrojano = stavke.length > 0;
  stavke.forEach(function (st) { if (st.prodano_inventura === null) sveIzbrojano = false; else poInv += st.prodano_inventura; });

  return {
    stavke: stavke,
    usluge: usluge,
    promet: r2_(promet),
    prodano_kom: kom,
    prodano_po_inventuri: sveIzbrojano ? poInv : null,
    broj_razlika: problemi.length,
    vrijednost_razlike: r2_(problemi.reduce(function (a, st) { return a + st.razlika_km; }, 0)),
    upozorenja: upozorenja,
    potrosnja: potrosnja,
    potrosnja_nabavna: r2_(potrosnja.reduce(function (a, x) { return a + x.nabavna; }, 0)),
    uzeto_iz_kase: r2_(uzeto),
    kasa_izlazi: izlazi
  };
}

/** U kasi treba biti = početna gotovina + promet − novac uzet iz kase. */
function kasaTreba_(kasaPocetna, ob) {
  return r2_(num_(kasaPocetna) + ob.promet - ob.uzeto_iz_kase);
}

/** Provjera brojanja: svaki proizvod mora imati cijeli broj ≥ 0 (i nula se upisuje). */
function provjeriBrojanje_(roba, mapa, rijec) {
  mapa = mapa || {};
  var fali = [], los = [], izlaz = {};
  roba.forEach(function (p) {
    var v = mapa[p.product_id];
    if (v === undefined || v === null || String(v).trim() === '') { fali.push(p.naziv); return; }
    var n = Number(String(v).replace(',', '.'));
    if (!isFinite(n) || n < 0 || Math.floor(n) !== n) { los.push(p.naziv); return; }
    izlaz[p.product_id] = n;
  });
  if (los.length) throw greska_('NEISPRAVAN_BROJ', 'Stanje mora biti cijeli broj, nula ili više (' + los.join(', ') + ').');
  if (fali.length) throw greska_('NIJE_SVE_PREBROJANO', 'Nije uneseno ' + rijec + ' stanje za: ' + fali.join(', ') + '.');
  return izlaz;
}

/* ═══════════════════════════════════════════════════════════════
 *  SETUP (idempotentan — nikad ne briše podatke)
 * ═══════════════════════════════════════════════════════════════ */
function setupSpreadsheet() {
  var poruka = zakljucano_(function () { return osigurajTabele_(true); });
  try { Logger.log(poruka); } catch (e) { /* */ }
  return poruka;
}

function osigurajTabele_(formatiraj) {
  var ss = ss_();
  try { ss.setSpreadsheetTimeZone(CONFIG.TZ); } catch (e) { /* */ }
  var uradjeno = [];

  Object.keys(KOLONE).forEach(function (ime) {
    var sh = ss.getSheetByName(ime);
    if (!sh) { sh = ss.insertSheet(ime); uradjeno.push('napravljena tabela ' + ime); }
    var kol = KOLONE[ime];
    var lc = sh.getLastColumn();
    if (sh.getLastRow() === 0 || lc === 0) {
      sh.getRange(1, 1, 1, kol.length).setValues([kol]);
    } else {
      // dodaj samo kolone koje fale, na kraj — postojeće se ne diraju
      var postojece = sh.getRange(1, 1, 1, lc).getValues()[0].map(function (k) { return String(k).trim(); });
      var fale = kol.filter(function (k) { return postojece.indexOf(k) < 0; });
      if (fale.length) {
        sh.getRange(1, lc + 1, 1, fale.length).setValues([fale]);
        uradjeno.push(ime + ': dodane kolone ' + fale.join(', '));
      }
    }
    if (formatiraj) formatirajTabelu_(sh, ime);
  });

  var pr = ss.getSheetByName(TAB.PROIZVODI);
  if (pr.getLastRow() <= 1) {
    var t = tabela_(TAB.PROIZVODI);
    dodajRedove_(t, SEED_PROIZVODI.map(function (r) {
      var o = {};
      KOLONE.PROIZVODI.forEach(function (k, i) { o[k] = r[i]; });
      return o;
    }));
    uradjeno.push('upisano ' + SEED_PROIZVODI.length + ' proizvoda');
    if (formatiraj) checkboxeProizvoda_(pr);
  }

  // stari Sheet (prije paketa s trenerom): dodaj proizvod "trener" jednom, nikad ponovo ako ga vlasnik obriše
  try {
    if (!svojstva_().getProperty('SEED_TRENER')) {
      var tp = tabela_(TAB.PROIZVODI);
      if (!tp.redovi.some(function (r) { return s_(r.product_id) === 'trener'; })) {
        var o = {};
        KOLONE.PROIZVODI.forEach(function (k, i) { o[k] = SEED_PROIZVODI[SEED_PROIZVODI.length - 1][i]; });
        dodajRedove_(tp, [o]);
        uradjeno.push('dodan proizvod Lični trener');
      }
      svojstva_().setProperty('SEED_TRENER', '1');
    }
  } catch (e) { /* */ }

  // primjer termina iz dogovora s vlasnikom (jednom; poslije se uređuje u Vlasnik → Raspored)
  try {
    if (!svojstva_().getProperty('SEED_RASPORED')) {
      var tt = tabela_(TAB.TRENINZI);
      if (!tt.redovi.length) {
        dodajRedove_(tt, ['ned', 'pon', 'uto', 'sri', 'cet'].map(function (d) {
          return { termin_id: 'T-enes', osobe: 'Enes Velić + supruga, Nino', dan: d, vrijeme: '19:00', trening: '', trener: '', napomena: '', aktivan: true };
        }));
        uradjeno.push('upisan primjer rasporeda treninga');
      }
      svojstva_().setProperty('SEED_RASPORED', '1');
    }
  } catch (e) { /* */ }

  var pg = ss.getSheetByName(TAB.PREGLED);
  if (!pg) {
    pg = ss.insertSheet(TAB.PREGLED);
    napisiPregled_(pg);
    uradjeno.push('napravljen PREGLED');
  } else if (pg.getLastRow() === 0) {
    napisiPregled_(pg);
    uradjeno.push('napisan PREGLED');
  }

  // ukloni prazan početni list ("Sheet1", "List 1"...) ako je potpuno prazan
  ss.getSheets().forEach(function (sh) {
    var n = sh.getName();
    if (/^(sheet|list|tabela|tablica|lista)\s*1$/i.test(n) && sh.getLastRow() === 0 && sh.getLastColumn() === 0 && ss.getSheets().length > 1) {
      ss.deleteSheet(sh);
    }
  });

  return uradjeno.length ? 'Gotovo: ' + uradjeno.join('; ') + '.' : 'Sve tabele već postoje. Ništa nije mijenjano.';
}

function formatirajTabelu_(sh, ime) {
  var kol = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function (k) { return String(k).trim(); });
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, kol.length).setFontWeight('bold').setBackground('#191A1D').setFontColor('#E8A33D');
  var redova = Math.max(sh.getMaxRows() - 1, 1);
  (TEKST_KOLONE[ime] || []).forEach(function (k) {
    var c = kol.indexOf(k) + 1;
    if (c > 0) sh.getRange(2, c, redova, 1).setNumberFormat('@');
  });
  ['cijena', 'nabavna_cijena', 'ukupno', 'promet', 'kasa_ocekivano', 'kasa_stvarno', 'kasa_razlika',
    'vrijednost_razlike', 'razlika_KM'].forEach(function (k) {
    var c = kol.indexOf(k) + 1;
    if (c > 0) sh.getRange(2, c, redova, 1).setNumberFormat('0.00');
  });
  for (var i = 1; i <= kol.length; i++) sh.setColumnWidth(i, Math.max(90, Math.min(220, kol[i - 1].length * 9 + 30)));
}

function checkboxeProizvoda_(sh) {
  var kol = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function (k) { return String(k).trim(); });
  var n = sh.getLastRow() - 1;
  if (n < 1) return;
  var pravilo = SpreadsheetApp.newDataValidation().requireCheckbox().build();
  ['prati_zalihu', 'aktivan'].forEach(function (k) {
    var c = kol.indexOf(k) + 1;
    if (c > 0) sh.getRange(2, c, n, 1).setDataValidation(pravilo);
  });
}

/** Ponovo ispiše PREGLED (samo formule; podaci se ne diraju). */
function obnoviPregled() {
  var ss = ss_();
  var pg = ss.getSheetByName(TAB.PREGLED) || ss.insertSheet(TAB.PREGLED);
  pg.clear();
  napisiPregled_(pg);
  return 'PREGLED je obnovljen.';
}

function napisiPregled_(pg) {
  var N = MAX_PROIZVODA_U_PREGLEDU;
  var prvi = 17, zadnji = prvi + N - 1;          // redovi tabele po proizvodu
  var D = 'DOGADJAJI!$A:$L';
  var prodaja = "(F='SALE' or F='UNDO_SALE')";
  var q = function (uslov) {
    return '=IFERROR(QUERY(' + D + ',"select G, sum(I), sum(K) where ' + prodaja + ' and ' + uslov +
      ' group by G label sum(I) \'kom\', sum(K) \'km\'",1),"")';
  };
  var vl = function (kolona, blok, idx) {
    return '=IF($A{r}="","",IFERROR(VLOOKUP($A{r},' + blok + ',' + idx + ',FALSE),0))'.replace(/\{r\}/g, kolona);
  };

  var v = [];
  v.push(['A1', 'FITNESS CLUB ADIN — PREGLED (automatski, ne upisuj ništa ovdje)']);
  v.push(['A3', 'Danas']);                 v.push(['B3', '=TEXT(TODAY(),"yyyy-mm-dd")']);
  v.push(['A4', '7 dana od']);             v.push(['B4', '=TEXT(TODAY()-6,"yyyy-mm-dd")']);
  v.push(['A5', 'Mjesec od']);             v.push(['B5', '=TEXT(EOMONTH(TODAY(),-1)+1,"yyyy-mm-dd")']);
  v.push(['A6', 'Ova sedmica od (pon)']);  v.push(['B6', '=TEXT(TODAY()-WEEKDAY(TODAY(),3),"yyyy-mm-dd")']);
  v.push(['A7', 'Prošla sedmica od']);     v.push(['B7', '=TEXT(TODAY()-WEEKDAY(TODAY(),3)-7,"yyyy-mm-dd")']);
  v.push(['A8', 'Prošla sedmica do']);     v.push(['B8', '=TEXT(TODAY()-WEEKDAY(TODAY(),3)-1,"yyyy-mm-dd")']);

  var rng = function (c) { return c + prvi + ':' + c + zadnji; };
  v.push(['D3', 'Promet danas (KM)']);               v.push(['E3', '=SUM(' + rng('E') + ')']);
  v.push(['D4', 'Promet zadnjih 7 dana (KM)']);      v.push(['E4', '=SUM(' + rng('G') + ')']);
  v.push(['D5', 'Promet ovaj mjesec (KM)']);         v.push(['E5', '=SUM(' + rng('I') + ')']);
  v.push(['D6', 'Profit ovaj mjesec (KM)']);         v.push(['E6', '=SUM(' + rng('J') + ')']);
  v.push(['D7', 'Profit ova sedmica (KM)']);         v.push(['E7', '=SUM(' + rng('M') + ')']);
  v.push(['D8', 'Profit prošla sedmica (KM)']);      v.push(['E8', '=SUM(' + rng('P') + ')']);
  v.push(['D9', 'Plata za prošlu sedmicu — ' + Math.round(CONFIG.PLATA_UDIO * 100) + '% (isplata u ponedjeljak)']);
  v.push(['E9', '=ROUND(E8*' + CONFIG.PLATA_UDIO + ',2)']);
  v.push(['D10', 'Plata ova sedmica do sada (' + Math.round(CONFIG.PLATA_UDIO * 100) + '%)']);
  v.push(['E10', '=ROUND(E7*' + CONFIG.PLATA_UDIO + ',2)']);
  v.push(['D11', 'Razlike inventure ovaj mjesec (KM)']);
  v.push(['E11', '=SUMPRODUCT((SMJENE!$B$2:$B>=$B$5)*(SMJENE!$F$2:$F="CLOSED"),SMJENE!$O$2:$O)']);
  v.push(['D12', 'Razlike kase ovaj mjesec (KM)']);
  v.push(['E12', '=SUMPRODUCT((SMJENE!$B$2:$B>=$B$5)*(SMJENE!$F$2:$F="CLOSED"),SMJENE!$L$2:$L)']);
  v.push(['D13', 'Otvorena smjena (radnik, od)']);
  v.push(['E13', '=IFERROR(QUERY(SMJENE!$A$2:$F,"select C, D where F=\'OPEN\'",0),"nema")']);

  // pomoćni blokovi (QUERY po periodu)
  v.push(['R15', 'pomoćno: danas']);          v.push(['R16', q("C = '\"&$B$3&\"'")]);
  v.push(['V15', 'pomoćno: 7 dana']);         v.push(['V16', q("C >= '\"&$B$4&\"' and C <= '\"&$B$3&\"'")]);
  v.push(['Z15', 'pomoćno: mjesec']);         v.push(['Z16', q("C >= '\"&$B$5&\"'")]);
  v.push(['AD15', 'pomoćno: ova sedmica']);   v.push(['AD16', q("C >= '\"&$B$6&\"'")]);
  v.push(['AH15', 'pomoćno: prošla sedmica']); v.push(['AH16', q("C >= '\"&$B$7&\"' and C <= '\"&$B$8&\"'")]);

  var zag = ['product_id', 'Proizvod', 'Trošak/kom', 'Kom danas', 'KM danas', 'Kom 7 dana', 'KM 7 dana',
    'Kom mjesec', 'KM mjesec', 'Profit mjesec', 'Kom ova sed.', 'KM ova sed.', 'Profit ova sed.',
    'Kom prošla sed.', 'KM prošla sed.', 'Profit prošla sed.'];
  var slova = 'ABCDEFGHIJKLMNOP'.split('');
  zag.forEach(function (z, i) { v.push([slova[i] + '16', z]); });

  var formule = [];
  for (var r = prvi; r <= zadnji; r++) {
    var pr = r - prvi + 2; // red u PROIZVODI
    var R = String(r);
    var prati = 'OR(LOWER(PROIZVODI!F' + pr + '&"")="true",LOWER(PROIZVODI!F' + pr + '&"")="da")';
    formule.push([
      '=IF(PROIZVODI!A' + pr + '="","",PROIZVODI!A' + pr + ')',
      '=IF($A' + R + '="","",PROIZVODI!C' + pr + ')',
      '=IF($A' + R + '="","",IF(' + prati + ',N(PROIZVODI!E' + pr + ')*' + (1 + CONFIG.PREVOZ) + ',N(PROIZVODI!E' + pr + ')))',
      vl(R, '$R$17:$T$200', 2), vl(R, '$R$17:$T$200', 3),
      vl(R, '$V$17:$X$200', 2), vl(R, '$V$17:$X$200', 3),
      vl(R, '$Z$17:$AB$200', 2), vl(R, '$Z$17:$AB$200', 3),
      '=IF($A' + R + '="","",ROUND(I' + R + '-H' + R + '*C' + R + ',2))',
      vl(R, '$AD$17:$AF$200', 2), vl(R, '$AD$17:$AF$200', 3),
      '=IF($A' + R + '="","",ROUND(L' + R + '-K' + R + '*C' + R + ',2))',
      vl(R, '$AH$17:$AJ$200', 2), vl(R, '$AH$17:$AJ$200', 3),
      '=IF($A' + R + '="","",ROUND(O' + R + '-N' + R + '*C' + R + ',2))'
    ]);
  }

  var ispod = zadnji + 3;
  v.push(['A' + ispod, 'TOP 5 PROIZVODA OVAJ MJESEC']);
  v.push(['A' + (ispod + 1), '=IFERROR(QUERY($A$16:$P$' + zadnji + ',"select B, H, I, J where H > 0 order by H desc limit 5 label B \'Proizvod\', H \'Kom\', I \'KM\', J \'Profit\'",1),"Još nema prodaje")']);
  v.push(['G' + ispod, 'PRODAJA PO RADNIKU OVAJ MJESEC']);
  v.push(['G' + (ispod + 1), '=IFERROR(QUERY(' + D + ',"select E, sum(I), sum(K) where ' + prodaja + ' and C >= \'"&$B$5&"\' group by E order by sum(K) desc label E \'Radnik\', sum(I) \'Kom\', sum(K) \'Promet KM\'",1),"Još nema prodaje")']);
  v.push(['L' + ispod, 'ČLANARINE: ISTIČU U ' + CONFIG.ISTICE_DANA + ' DANA / ISTEKLE']);
  v.push(['L' + (ispod + 1), '=IFERROR(QUERY(CLANOVI!$A:$I,"select B, C, D, F where F <= \'"&TEXT(TODAY()+' + CONFIG.ISTICE_DANA + ',"yyyy-mm-dd")&"\' and F >= \'"&TEXT(TODAY()-30,"yyyy-mm-dd")&"\' order by F label B \'Ime\', C \'Telefon\', D \'Vrsta\', F \'Ističe\'",1),"Nema")']);

  var hist = ispod + 10;
  v.push(['A' + hist, 'HISTORIJA SMJENA (zadnjih 30)']);
  v.push(['A' + (hist + 1), '=IFERROR(QUERY(SMJENE!$A:$Q,"select B, C, D, E, I, K, L, M, N, O where F=\'CLOSED\' order by P desc limit 30 label B \'Datum\', C \'Radnik\', D \'Od\', E \'Do\', I \'Promet\', K \'Kasa\', L \'Razlika kase\', M \'Razlog\', N \'Br. razlika\', O \'Razlike KM\'",1),"Još nema zatvorenih smjena")']);

  v.forEach(function (x) {
    var cell = pg.getRange(x[0]);
    if (String(x[1]).charAt(0) === '=') cell.setFormula(x[1]); else cell.setValue(x[1]);
  });
  pg.getRange(prvi, 1, formule.length, 16).setFormulas(formule);

  try {
    pg.getRange('A1').setFontWeight('bold').setFontSize(14);
    pg.getRange('A16:P16').setFontWeight('bold').setBackground('#191A1D').setFontColor('#E8A33D');
    pg.getRange('D3:D13').setFontWeight('bold');
    pg.getRange('E3:E12').setNumberFormat('0.00');
    pg.getRange('C' + prvi + ':P' + zadnji).setNumberFormat('0.00');
    pg.getRange('A' + ispod + ':Q' + ispod).setFontWeight('bold');
    pg.getRange('A' + hist).setFontWeight('bold');
    pg.getRange('R15:AJ15').setFontColor('#999999');
    pg.setColumnWidth(1, 150); pg.setColumnWidth(2, 150); pg.setColumnWidth(4, 260);
    pg.setFrozenRows(0);
  } catch (e) { /* formatiranje nije kritično */ }
}

/* ═══════════════════════════════════════════════════════════════
 *  ČITANJE STANJA
 * ═══════════════════════════════════════════════════════════════ */
function clanJavno_(r) {
  return {
    member_id: s_(r.member_id), ime: s_(r.ime), telefon: s_(r.telefon), vrsta: s_(r.vrsta),
    pocetak: datum_(r.pocetak), istek: datum_(r.istek), napomena: s_(r.napomena),
    aktivan: s_(r.aktivan) === '' ? true : bool_(r.aktivan), brava_id: s_(r.brava_id),
    trener: s_(r.trener), trener_do: datum_(r.trener_do)
  };
}

function dogadjajiSmjene_(shiftId, tDog) {
  var t = tDog || tabela_(TAB.DOGADJAJI);
  return t.redovi.filter(function (r) { return s_(r.shift_id) === shiftId; }).map(function (r) {
    return {
      event_id: s_(r.event_id), shift_id: shiftId, tip: s_(r.tip_dogadjaja), product_id: s_(r.product_id),
      kolicina: num_(r.kolicina), ukupno: num_(r.ukupno), cijena: num_(r.cijena), timestamp: s_(r.timestamp), napomena: s_(r.napomena),
      osoba: s_(r.osoba)
    };
  });
}

function pocetnaSmjene_(shiftId, tInv) {
  var t = tInv || tabela_(TAB.INVENTURA);
  var poc = {}, broj = {}, imaBroj = false;
  t.redovi.forEach(function (r) {
    if (s_(r.shift_id) !== shiftId) return;
    var pid = s_(r.product_id);
    poc[pid] = Math.round(num_(r.pocetno_stanje));
    if (s_(r.stvarno_zavrsno) !== '') { broj[pid] = Math.round(num_(r.stvarno_zavrsno)); imaBroj = true; }
  });
  return { pocetna: poc, brojanje: imaBroj ? broj : null };
}

function smjenaJavno_(r, tInv, tDog) {
  var id = s_(r.shift_id);
  return {
    shift_id: id, radnik: s_(r.radnik), datum: datum_(r.datum), vrijeme_pocetka: vrijeme_(r.vrijeme_pocetka),
    pocetak_ts: s_(r.created_at), status: s_(r.status), kasa_pocetna: r2_(num_(r.kasa_pocetna)),
    pocetna: pocetnaSmjene_(id, tInv).pocetna,
    dogadjaji: dogadjajiSmjene_(id, tDog)
  };
}

/** Zadnje prebrojano stanje po proizvodu (sugestija za sljedeću smjenu). */
function prijedlog_(tInv) {
  var t = tInv || tabela_(TAB.INVENTURA);
  var p = {};
  t.redovi.forEach(function (r) {
    if (s_(r.stvarno_zavrsno) !== '') p[s_(r.product_id)] = Math.round(num_(r.stvarno_zavrsno));
  });
  return p;
}

function izvjestaj_(red, proizvodi, pocetna, dogadjaji, brojanje) {
  var ob = obracunSmjene_(proizvodi, pocetna, dogadjaji, brojanje);
  var od = s_(red.created_at), doo = s_(red.status) === 'CLOSED' ? s_(red.updated_at) : '';
  var a = tsMin_(od), b = tsMin_(doo);
  return {
    shift_id: s_(red.shift_id), radnik: s_(red.radnik), datum: datum_(red.datum),
    pocetak: vrijeme_(red.vrijeme_pocetka), kraj: vrijeme_(red.vrijeme_kraja),
    trajanje_min: (a !== null && b !== null) ? Math.max(0, b - a) : null,
    status: s_(red.status),
    prodano_kom: ob.prodano_kom, prodano_po_inventuri: ob.prodano_po_inventuri, promet: ob.promet,
    kasa_pocetna: r2_(num_(red.kasa_pocetna)),
    uzeto_iz_kase: ob.uzeto_iz_kase, kasa_izlazi: ob.kasa_izlazi,
    kasa_ocekivano: kasaTreba_(red.kasa_pocetna, ob),
    potrosnja: ob.potrosnja, potrosnja_nabavna: ob.potrosnja_nabavna,
    kasa_stvarno: s_(red.kasa_stvarno) === '' ? null : r2_(num_(red.kasa_stvarno)),
    kasa_razlika: s_(red.kasa_razlika) === '' ? null : r2_(num_(red.kasa_razlika)),
    kasa_razlog: s_(red.kasa_razlog),
    broj_razlika: ob.broj_razlika, vrijednost_razlike: ob.vrijednost_razlike,
    bez_brojanja: !brojanje,
    pocetak_ts: s_(red.created_at),
    stavke: ob.stavke, usluge: ob.usluge, upozorenja: ob.upozorenja,
    napomene: (dogadjaji || []).filter(function (e) { return e.tip === 'NAPOMENA'; }).map(function (e) {
      return { vrijeme: vrijeme_(e.timestamp), tekst: e.napomena };
    })
  };
}

/* ═══════════════════════════════════════════════════════════════
 *  JAVNI API — RADNIK
 * ═══════════════════════════════════════════════════════════════ */
/** Nakon ažuriranja koda: tabele se same nadograde (nove kolone/proizvodi), bez ručnog setupSpreadsheet. */
function nadogradiAkoTreba_() {
  if (svojstva_().getProperty('VERZIJA_SEME') === VERZIJA_SEME) return;
  zakljucano_(function () {
    if (svojstva_().getProperty('VERZIJA_SEME') === VERZIJA_SEME) return;
    osigurajTabele_(true);
    svojstva_().setProperty('VERZIJA_SEME', VERZIJA_SEME);
  });
}

function getBootstrap() {
  return api_(function () {
    nadogradiAkoTreba_();
    var proizvodi = proizvodi_();
    var sm = tabela_(TAB.SMJENE);
    var tInv = tabela_(TAB.INVENTURA);
    var otvorena = null;
    sm.redovi.forEach(function (r) { if (s_(r.status) === 'OPEN') otvorena = r; });
    var aktivna = otvorena ? smjenaJavno_(otvorena, tInv, null) : null;
    var clanovi = tabela_(TAB.CLANOVI).redovi.map(clanJavno_).filter(function (c) { return c.member_id && c.aktivan; });
    var t = sada_();
    return {
      proizvodi: proizvodi.map(javniProizvod_),
      aktivna: aktivna,
      prijedlog: prijedlog_(tInv),
      radnici: radnici_(),
      treneri: treneri_(),
      razlozi: CONFIG.RAZLOZI,
      clanovi: clanovi,
      raspored: raspored_(),
      danas: t.datum,
      server_ts: t.ts
    };
  });
}

function startShift(podaci) {
  return api_(function () {
    return zakljucano_(function () {
      var p = podaci || {};
      var radnik = s_(p.radnik).slice(0, 60);
      if (!radnik) throw greska_('NEMA_RADNIKA', 'Izaberi ko je na smjeni.');
      var shiftId = s_(p.shift_id).slice(0, 80) || noviId_('S');

      var sm = tabela_(TAB.SMJENE);
      var otvorena = null, ista = null;
      sm.redovi.forEach(function (r) {
        if (s_(r.status) === 'OPEN') otvorena = r;
        if (s_(r.shift_id) === shiftId) ista = r;
      });
      // Nikad dvije otvorene smjene: vrati postojeću (bez greške koja plaši radnika).
      if (otvorena) return { postojeca: true, smjena: smjenaJavno_(otvorena) };
      if (ista) throw greska_('SMJENA_ZATVORENA', 'Ova smjena je već završena. Počni novu.');

      var roba = proizvodi_().filter(function (x) { return x.prati_zalihu; });
      var pocetna = provjeriBrojanje_(roba, p.pocetna, 'početno');
      var kasaPocetna = 0;
      if (p.kasa_pocetna !== undefined && p.kasa_pocetna !== null && s_(p.kasa_pocetna) !== '') {
        kasaPocetna = Number(s_(p.kasa_pocetna).replace(/\s/g, '').replace(',', '.'));
        if (!isFinite(kasaPocetna) || kasaPocetna < 0 || kasaPocetna > 100000) throw greska_('KASA', 'Upiši koliko je gotovine u kasi na početku (0 ili više).');
        kasaPocetna = r2_(kasaPocetna);
      }
      var t = sada_();
      dodajRedove_(sm, [{
        shift_id: shiftId, datum: t.datum, radnik: radnik, vrijeme_pocetka: t.vrijeme, vrijeme_kraja: '',
        status: 'OPEN', created_at: t.ts, updated_at: t.ts, kasa_pocetna: kasaPocetna
      }]);
      dodajRedove_(tabela_(TAB.INVENTURA), roba.map(function (x) {
        return {
          shift_id: shiftId, datum: t.datum, radnik: radnik, product_id: x.product_id, proizvod: x.naziv,
          pocetno_stanje: pocetna[x.product_id]
        };
      }));
      return {
        postojeca: false,
        smjena: {
          shift_id: shiftId, radnik: radnik, datum: t.datum, vrijeme_pocetka: t.vrijeme, pocetak_ts: t.ts,
          status: 'OPEN', pocetna: pocetna, dogadjaji: [], kasa_pocetna: kasaPocetna
        }
      };
    });
  });
}

/**
 * Prima batch događaja. Idempotentno: event_id koji već postoji se ne upisuje ponovo, ali se vraća kao uspjeh.
 * Vraća: primljeno[], duplikati[], odbijeni[{event_id, code, message}], clanovi[] (ažurirani članovi).
 */
function pushEvents(shiftId, events) {
  return api_(function () {
    if (Array.isArray(shiftId) && events === undefined) { events = shiftId; shiftId = ''; }
    events = Array.isArray(events) ? events : [];
    if (events.length > 500) throw greska_('PREVISE', 'Previše promjena odjednom. Pokušaj ponovo.');
    if (!events.length) return { primljeno: [], duplikati: [], odbijeni: [], clanovi: [] };
    return zakljucano_(function () { return obradiDogadjaje_(s_(shiftId), events); });
  });
}

function obradiDogadjaje_(shiftId, events) {
  var t = sada_();
  var postoji = postojeciEventId_();
  var smjene = {};
  tabela_(TAB.SMJENE).redovi.forEach(function (r) { smjene[s_(r.shift_id)] = r; });
  var sviProizvodi = {};
  proizvodi_(true).forEach(function (p) { sviProizvodi[p.product_id] = p; });

  var trebaNeto = events.some(function (e) { return s_(e.tip) === 'UNDO_SALE' || (s_(e.tip) === 'POTROSNJA' && Number(e.kolicina) < 0); });
  var tDog = null, neto = {}, netoPot = {};
  if (trebaNeto) {
    tDog = tabela_(TAB.DOGADJAJI);
    tDog.redovi.forEach(function (r) {
      var tip = s_(r.tip_dogadjaja);
      if (tip === 'POTROSNJA') {
        var kp0 = s_(r.shift_id) + '|' + s_(r.product_id) + '|' + s_(r.osoba);
        netoPot[kp0] = (netoPot[kp0] || 0) + num_(r.kolicina);
        return;
      }
      if (tip !== 'SALE' && tip !== 'UNDO_SALE') return;
      var k = s_(r.shift_id) + '|' + s_(r.product_id);
      neto[k] = (neto[k] || 0) + num_(r.kolicina);
    });
  }
  var tClan = null;
  var izlaz = { primljeno: [], duplikati: [], odbijeni: [], clanovi: [] };
  var noviRedovi = [];
  var odbij = function (id, kod, poruka) { izlaz.odbijeni.push({ event_id: id, code: kod, message: poruka }); };

  events.forEach(function (e) {
    e = e || {};
    var id = s_(e.event_id).slice(0, 80);
    if (!id) { odbij('', 'NEMA_ID', 'Događaj bez oznake.'); return; }
    if (postoji[id]) { izlaz.duplikati.push(id); return; }

    var sid = s_(e.shift_id) || shiftId;
    var sm = smjene[sid];
    if (!sm) { odbij(id, 'NEMA_SMJENE', 'Smjena ne postoji.'); return; }
    if (s_(sm.status) !== 'OPEN') { odbij(id, 'SMJENA_ZATVORENA', 'Smjena je već zatvorena, promjena nije upisana.'); return; }

    var tip = s_(e.tip);
    if (TIPOVI.indexOf(tip) < 0) { odbij(id, 'NEPOZNAT_TIP', 'Nepoznata vrsta promjene.'); return; }
    if (tip === 'NAPOMENA') {
      var tekst = s_(e.napomena).slice(0, 500);
      if (!tekst) { odbij(id, 'PRAZNA_NAPOMENA', 'Napomena je prazna.'); return; }
      postoji[id] = true;
      noviRedovi.push({
        event_id: id, shift_id: sid, datum: t.datum, timestamp: t.ts, radnik: s_(sm.radnik),
        tip_dogadjaja: 'NAPOMENA', product_id: '', proizvod: '', kolicina: 0, cijena: 0, ukupno: 0, napomena: tekst
      });
      izlaz.primljeno.push(id);
      return;
    }
    if (tip === 'KASA_IZLAZ') {
      var iznos = Number(s_(e.iznos).replace(',', '.'));
      var ko = s_(e.osoba).slice(0, 40);
      if (!isFinite(iznos) || iznos <= 0 || iznos > 100000) { odbij(id, 'IZNOS', 'Neispravan iznos.'); return; }
      if (!ko) { odbij(id, 'OSOBA', 'Upiši ko je uzeo novac.'); return; }
      postoji[id] = true;
      noviRedovi.push({
        event_id: id, shift_id: sid, datum: t.datum, timestamp: t.ts, radnik: s_(sm.radnik),
        tip_dogadjaja: 'KASA_IZLAZ', product_id: '', proizvod: 'Uzeto iz kase', kolicina: 0, cijena: r2_(iznos), ukupno: 0,
        napomena: s_(e.napomena).slice(0, 200), osoba: ko
      });
      izlaz.primljeno.push(id);
      return;
    }
    var p = sviProizvodi[s_(e.product_id)];
    if (!p) { odbij(id, 'NEMA_PROIZVODA', 'Proizvod ne postoji.'); return; }
    var q = Number(e.kolicina);
    if (!isFinite(q) || Math.floor(q) !== q || q === 0) { odbij(id, 'KOLICINA', 'Neispravna količina.'); return; }

    var napomena = s_(e.napomena).slice(0, 200);
    var ukupno = 0, osoba = '';
    var kljuc = sid + '|' + p.product_id;

    if (tip === 'SALE') {
      if (q < 1 || q > 50) { odbij(id, 'KOLICINA', 'Neispravna količina.'); return; }
      if (trebaClana_(p)) {
        if (q !== 1) { odbij(id, 'KOLICINA', 'Članarina se prodaje jedna po jedna.'); return; }
        if (!tClan) tClan = tabela_(TAB.CLANOVI);
        var rez = jeTrener_(p) ? prodajTrenera_(tClan, e.clan, p, t) : prodajClanarinu_(tClan, e.clan, p, t);
        if (rez.greska) { odbij(id, 'CLAN', rez.greska); return; }
        napomena = (napomena ? napomena + ' · ' : '') + rez.napomena;
        izlaz.clanovi.push(rez.clan);
      }
      ukupno = r2_(q * p.cijena);
    } else if (tip === 'UNDO_SALE') {
      q = -Math.abs(q);
      if (trebaClana_(p)) { odbij(id, 'CLAN_UNDO', 'Članarina se ne poništava ovdje. Javi vlasniku.'); return; }
      if ((neto[kljuc] || 0) + q < 0) { odbij(id, 'NEMA_STA_PONISTITI', 'Nema prodaje koja bi se poništila.'); return; }
      ukupno = r2_(q * p.cijena);
    } else if (tip === 'RESTOCK') {
      if (!p.prati_zalihu) { odbij(id, 'NE_PRATI_ZALIHU', 'Za ovaj proizvod se ne vodi zaliha.'); return; }
      if (q < 1 || q > 1000) { odbij(id, 'KOLICINA', 'Neispravna količina dopune.'); return; }
    } else if (tip === 'ADJUSTMENT') {
      if (!p.prati_zalihu) { odbij(id, 'NE_PRATI_ZALIHU', 'Za ovaj proizvod se ne vodi zaliha.'); return; }
      if (Math.abs(q) > 1000) { odbij(id, 'KOLICINA', 'Neispravna količina.'); return; }
    } else if (tip === 'POTROSNJA') {
      if (!p.prati_zalihu) { odbij(id, 'NE_PRATI_ZALIHU', 'Potrošnja se bilježi samo za robu.'); return; }
      osoba = s_(e.osoba).slice(0, 40);
      if (!osoba) { odbij(id, 'OSOBA', 'Izaberi ko je potrošio.'); return; }
      if (Math.abs(q) > 50) { odbij(id, 'KOLICINA', 'Neispravna količina.'); return; }
      var kp = sid + '|' + p.product_id + '|' + osoba;
      if (q < 0 && (netoPot[kp] || 0) + q < 0) { odbij(id, 'NEMA_STA_PONISTITI', 'Nema te potrošnje za poništiti.'); return; }
      netoPot[kp] = (netoPot[kp] || 0) + q;
    }

    var klijentMs = Number(e.klijent_ms);
    if (isFinite(klijentMs) && klijentMs > 0 && t.ms - klijentMs > 120000) {
      napomena = (napomena ? napomena + ' · ' : '') + 'poslano naknadno, tapnuto u ' +
        fmt_(new Date(klijentMs), 'HH:mm') + ' (sat telefona)';
    }

    if (tip === 'SALE' || tip === 'UNDO_SALE') neto[kljuc] = (neto[kljuc] || 0) + q;
    postoji[id] = true;
    noviRedovi.push({
      event_id: id, shift_id: sid, datum: t.datum, timestamp: t.ts, radnik: s_(sm.radnik),
      tip_dogadjaja: tip, product_id: p.product_id, proizvod: p.naziv, kolicina: q, cijena: p.cijena,
      ukupno: ukupno, napomena: napomena, osoba: osoba
    });
    izlaz.primljeno.push(id);
  });

  if (noviRedovi.length) dodajRedove_(tDog || tabela_(TAB.DOGADJAJI), noviRedovi);
  return izlaz;
}

/** Upisuje/produžava člana. Ne baca grešku nego vraća {greska} da se ostatak batcha ipak upiše. */
function prodajClanarinu_(tClan, c, p, t) {
  c = c || {};
  var mid = s_(c.member_id).slice(0, 80);
  if (!mid) return { greska: 'Nije izabran član.' };
  var red = null;
  tClan.redovi.forEach(function (r) { if (s_(r.member_id) === mid) red = r; });
  if (!red) {
    var ime = s_(c.ime).slice(0, 80);
    if (!ime) return { greska: 'Upiši ime novog člana.' };
    var pr = produziClanarinu_('', t.datum, p.clanarina_mjeseci);
    var novi = {
      member_id: mid, ime: ime, telefon: s_(c.telefon).slice(0, 40), vrsta: p.product_id,
      pocetak: t.datum, istek: pr.istek, zadnje_produzenje: t.datum, napomena: '', aktivan: true
    };
    dodajRedove_(tClan, [novi]);
    novi._red = tClan.sh.getLastRow();
    tClan.redovi.push(novi);
    return { clan: clanJavno_(novi), napomena: 'Novi član ' + ime + ', važi do ' + dT_(pr.istek) };
  }
  var istek = datum_(red.istek);
  var prod = produziClanarinu_(istek, t.datum, p.clanarina_mjeseci);
  var izmjene = { vrsta: p.product_id, istek: prod.istek, zadnje_produzenje: t.datum, aktivan: true };
  if (!prod.aktivna) izmjene.pocetak = t.datum;
  azurirajRed_(tClan, red, izmjene);
  return { clan: clanJavno_(red), napomena: 'Član ' + s_(red.ime) + ', važi do ' + dT_(prod.istek) };
}

/** Nađe člana ili ga napravi (novi član: ime + telefon). */
function nadjiIliNapraviClana_(tClan, c, t) {
  c = c || {};
  var mid = s_(c.member_id).slice(0, 80);
  if (!mid) return { greska: 'Nije izabran član.' };
  var red = null;
  tClan.redovi.forEach(function (r) { if (s_(r.member_id) === mid) red = r; });
  if (red) return { red: red, novi: false };
  var ime = s_(c.ime).slice(0, 80);
  if (!ime) return { greska: 'Upiši ime novog člana.' };
  var novi = {
    member_id: mid, ime: ime, telefon: s_(c.telefon).slice(0, 40), vrsta: '', pocetak: '', istek: '',
    zadnje_produzenje: '', napomena: '', aktivan: true, trener: '', trener_do: ''
  };
  dodajRedove_(tClan, [novi]);
  novi._red = tClan.sh.getLastRow();
  tClan.redovi.push(novi);
  return { red: novi, novi: true };
}

/** Lični trener (dodatak na kartu): bilježi trenera i do kada važi. */
function prodajTrenera_(tClan, c, p, t) {
  var n = nadjiIliNapraviClana_(tClan, c, t);
  if (n.greska) return n;
  var trener = s_(c && c.trener).slice(0, 60);
  if (!trener) return { greska: 'Izaberi trenera.' };
  var prod = produziClanarinu_(datum_(n.red.trener_do), t.datum, p.clanarina_mjeseci || 1);
  azurirajRed_(tClan, n.red, { trener: trener, trener_do: prod.istek, aktivan: true });
  return { clan: clanJavno_(n.red), napomena: 'Trener ' + trener + ' za ' + s_(n.red.ime) + ', do ' + dT_(prod.istek) };
}

/**
 * Zatvaranje smjene. Ako je već zatvorena (npr. ponovljen zahtjev nakon pada interneta), vraća postojeći izvještaj.
 */
function closeShift(shiftId, brojanje, kasaStvarno, razlog) {
  return api_(function () {
    if (shiftId && typeof shiftId === 'object') {
      var o = shiftId;
      shiftId = o.shift_id; brojanje = o.brojanje || o.zavrsno; kasaStvarno = o.kasa_stvarno; razlog = o.razlog;
    }
    return zakljucano_(function () {
      var id = s_(shiftId);
      var sm = tabela_(TAB.SMJENE);
      var red = null;
      sm.redovi.forEach(function (r) { if (s_(r.shift_id) === id) red = r; });
      if (!red) throw greska_('NEMA_SMJENE', 'Smjena ne postoji.');

      var proizvodi = proizvodi_(true);
      var tInv = tabela_(TAB.INVENTURA);
      var tDog = tabela_(TAB.DOGADJAJI);
      var dog = dogadjajiSmjene_(id, tDog);
      var ps = pocetnaSmjene_(id, tInv);

      if (s_(red.status) === 'CLOSED') {
        return { vec_zatvorena: true, izvjestaj: izvjestaj_(red, proizvodi, ps.pocetna, dog, ps.brojanje) };
      }

      var poId = {};
      proizvodi.forEach(function (p) { poId[p.product_id] = p; });
      var roba = Object.keys(ps.pocetna).map(function (pid) {
        return poId[pid] || { product_id: pid, naziv: pid, cijena: 0, prati_zalihu: true };
      });
      var broj = provjeriBrojanje_(roba, brojanje, 'završno');

      var kasaTxt = s_(kasaStvarno).replace(/\s/g, '').replace(',', '.');
      var kasa = Number(kasaTxt);
      if (kasaTxt === '' || !isFinite(kasa) || kasa < 0) {
        throw greska_('KASA', 'Upiši koliko je gotovine u kasi (0 ili više).');
      }
      kasa = r2_(kasa);

      var ob = obracunSmjene_(proizvodi, ps.pocetna, dog, broj);
      var kasaOcek = kasaTreba_(red.kasa_pocetna, ob);
      var kasaRazlika = r2_(kasa - kasaOcek);
      var razlogTxt = s_(razlog).slice(0, 200);
      if ((kasaRazlika !== 0 || ob.broj_razlika > 0) && !razlogTxt) {
        throw greska_('RAZLOG', 'Nešto se ne poklapa. Izaberi razlog.');
      }

      var t = sada_();
      var poPid = {};
      ob.stavke.forEach(function (st) { poPid[st.product_id] = st; });
      tInv.redovi.forEach(function (r) {
        if (s_(r.shift_id) !== id) return;
        var st = poPid[s_(r.product_id)];
        if (!st) return;
        azurirajRed_(tInv, r, {
          dopunjeno: st.dopunjeno, evidentirano_prodano: st.prodano_klik, ocekivano_zavrsno: st.ocekivano,
          stvarno_zavrsno: st.stvarno, prodano_po_inventuri: st.prodano_inventura,
          razlika_kom: st.razlika_kom, razlika_KM: st.razlika_km, potroseno: st.potroseno
        });
      });
      azurirajRed_(sm, red, {
        vrijeme_kraja: t.vrijeme, status: 'CLOSED',
        ukupno_prodano_klikovima: ob.prodano_kom, ukupno_prodano_po_inventuri: ob.prodano_po_inventuri,
        promet: ob.promet, kasa_ocekivano: kasaOcek, kasa_stvarno: kasa, kasa_razlika: kasaRazlika,
        uzeto_iz_kase: ob.uzeto_iz_kase, potrosnja_nabavna: ob.potrosnja_nabavna,
        kasa_razlog: (kasaRazlika !== 0 || ob.broj_razlika > 0) ? razlogTxt : '',
        broj_razlika: ob.broj_razlika, vrijednost_razlike: ob.vrijednost_razlike, updated_at: t.ts
      });
      return { vec_zatvorena: false, izvjestaj: izvjestaj_(red, proizvodi, ps.pocetna, dog, broj) };
    });
  });
}

/** Pretraga članova (radnik, za prodaju članarine). */
function searchMembers(upit) {
  return api_(function () {
    var q = normaliziraj_(upit);
    var lista = tabela_(TAB.CLANOVI).redovi.map(clanJavno_).filter(function (c) {
      if (!c.member_id || !c.aktivan) return false;
      return !q || normaliziraj_(c.ime).indexOf(q) >= 0 || c.telefon.replace(/\D/g, '').indexOf(q.replace(/\D/g, '') || '§') >= 0;
    });
    lista.sort(function (a, b) { return a.ime.localeCompare(b.ime); });
    return { clanovi: q ? lista.slice(0, 30) : lista };
  });
}

/* ═══════════════════════════════════════════════════════════════
 *  JAVNI API — VLASNIK (PIN)
 * ═══════════════════════════════════════════════════════════════ */
function checkPin(pin) {
  return api_(function () { provjeriPin_(pin); return {}; });
}

function getHistory(pin, limit) {
  return api_(function () {
    provjeriPin_(pin);
    var n = Math.max(1, Math.min(200, Math.round(num_(limit)) || 30));
    var lista = tabela_(TAB.SMJENE).redovi.filter(function (r) { return s_(r.shift_id); }).map(function (r) {
      return {
        shift_id: s_(r.shift_id), datum: datum_(r.datum), radnik: s_(r.radnik),
        pocetak: vrijeme_(r.vrijeme_pocetka), kraj: vrijeme_(r.vrijeme_kraja), status: s_(r.status),
        prodano: num_(r.ukupno_prodano_klikovima), promet: r2_(num_(r.promet)),
        kasa_razlika: s_(r.kasa_razlika) === '' ? null : r2_(num_(r.kasa_razlika)),
        kasa_razlog: s_(r.kasa_razlog),
        broj_razlika: num_(r.broj_razlika), vrijednost_razlike: r2_(num_(r.vrijednost_razlike)),
        _ts: s_(r.created_at)
      };
    });
    lista.sort(function (a, b) { return a._ts < b._ts ? 1 : -1; });
    lista = lista.slice(0, n);
    lista.forEach(function (x) { delete x._ts; });
    return { smjene: lista };
  });
}

function getShiftDetails(pin, shiftId) {
  return api_(function () {
    provjeriPin_(pin);
    var id = s_(shiftId);
    var red = null;
    tabela_(TAB.SMJENE).redovi.forEach(function (r) { if (s_(r.shift_id) === id) red = r; });
    if (!red) throw greska_('NEMA_SMJENE', 'Smjena ne postoji.');
    var ps = pocetnaSmjene_(id);
    return { izvjestaj: izvjestaj_(red, proizvodi_(true), ps.pocetna, dogadjajiSmjene_(id), ps.brojanje) };
  });
}

function getExpiringMembers(pin) {
  return api_(function () {
    provjeriPin_(pin);
    return clanoviPregled_(tabela_(TAB.CLANOVI).redovi.map(clanJavno_), sada_().datum);
  });
}

function clanoviPregled_(clanovi, danas) {
  var d0 = danBroj_(danas);
  var istice = [], istekli = [], aktivnih = 0;
  clanovi.forEach(function (c) {
    if (!c.member_id || !c.aktivan || !c.istek) return;
    var dana = danBroj_(c.istek) - d0;
    c.dana = dana;
    if (dana >= 0) aktivnih++;
    if (dana >= 0 && dana <= CONFIG.ISTICE_DANA) istice.push(c);
    else if (dana < 0 && dana >= -60) istekli.push(c);
  });
  istice.sort(function (a, b) { return a.dana - b.dana; });
  istekli.sort(function (a, b) { return b.dana - a.dana; });
  return { istice: istice, istekli: istekli, aktivnih: aktivnih };
}

function saveMember(pin, clan) {
  return api_(function () {
    provjeriPin_(pin);
    return zakljucano_(function () {
      clan = clan || {};
      var t = tabela_(TAB.CLANOVI);
      var mid = s_(clan.member_id);
      var red = null;
      t.redovi.forEach(function (r) { if (mid && s_(r.member_id) === mid) red = r; });
      var ime = s_(clan.ime).slice(0, 80);
      if (!ime) throw greska_('IME', 'Upiši ime člana.');
      var izmjene = { ime: ime, telefon: s_(clan.telefon).slice(0, 40), napomena: s_(clan.napomena).slice(0, 200) };
      if (clan.brava_id !== undefined) izmjene.brava_id = s_(clan.brava_id).slice(0, 80);
      if (clan.aktivan !== undefined) izmjene.aktivan = !!clan.aktivan;
      if (clan.istek !== undefined && clan.istek !== '') {
        var ist = datum_(clan.istek);
        if (!ist) throw greska_('DATUM', 'Neispravan datum isteka.');
        izmjene.istek = ist;
      }
      if (red) {
        azurirajRed_(t, red, izmjene);
        return { clan: clanJavno_(red) };
      }
      var novi = {
        member_id: mid || noviId_('M'), vrsta: s_(clan.vrsta), pocetak: '', istek: izmjene.istek || '',
        zadnje_produzenje: '', aktivan: true
      };
      for (var k in izmjene) if (izmjene.hasOwnProperty(k)) novi[k] = izmjene[k];
      dodajRedove_(t, [novi]);
      return { clan: clanJavno_(novi) };
    });
  });
}

/** Vlasnik zatvara zaboravljenu smjenu bez brojanja (brojevi se NE izmišljaju). */
function adminCloseShift(pin, shiftId, napomena) {
  return api_(function () {
    provjeriPin_(pin);
    var nap = s_(napomena).slice(0, 200);
    if (!nap) throw greska_('NAPOMENA', 'Upiši napomenu zašto zatvaraš smjenu.');
    return zakljucano_(function () {
      var id = s_(shiftId);
      var sm = tabela_(TAB.SMJENE);
      var red = null;
      sm.redovi.forEach(function (r) { if (s_(r.shift_id) === id) red = r; });
      if (!red) throw greska_('NEMA_SMJENE', 'Smjena ne postoji.');
      if (s_(red.status) !== 'OPEN') throw greska_('SMJENA_ZATVORENA', 'Smjena je već zatvorena.');
      var proizvodi = proizvodi_(true);
      var tInv = tabela_(TAB.INVENTURA);
      var dog = dogadjajiSmjene_(id);
      var ps = pocetnaSmjene_(id, tInv);
      var ob = obracunSmjene_(proizvodi, ps.pocetna, dog, null);
      var poPid = {};
      ob.stavke.forEach(function (st) { poPid[st.product_id] = st; });
      tInv.redovi.forEach(function (r) {
        if (s_(r.shift_id) !== id || !poPid[s_(r.product_id)]) return;
        var st = poPid[s_(r.product_id)];
        azurirajRed_(tInv, r, { dopunjeno: st.dopunjeno, evidentirano_prodano: st.prodano_klik, ocekivano_zavrsno: st.ocekivano });
      });
      var t = sada_();
      azurirajRed_(sm, red, {
        vrijeme_kraja: t.vrijeme, status: 'CLOSED', ukupno_prodano_klikovima: ob.prodano_kom,
        promet: ob.promet, kasa_ocekivano: kasaTreba_(red.kasa_pocetna, ob),
        uzeto_iz_kase: ob.uzeto_iz_kase, potrosnja_nabavna: ob.potrosnja_nabavna,
        kasa_razlog: 'Zatvorio vlasnik bez brojanja: ' + nap, updated_at: t.ts
      });
      return { izvjestaj: izvjestaj_(red, proizvodi, ps.pocetna, dog, null) };
    });
  });
}

/** Sve što vlasnik vidi u aplikaciji — jedan poziv. */
function getAdminData(pin) {
  return api_(function () {
    provjeriPin_(pin);
    var t = sada_();
    var per = periodi_(t.datum);
    var proizvodi = proizvodi_(true);
    var poId = {};
    proizvodi.forEach(function (p) { poId[p.product_id] = p; });
    var tDog = tabela_(TAB.DOGADJAJI);
    var tSm = tabela_(TAB.SMJENE);
    var tInv = tabela_(TAB.INVENTURA);

    var prazno = function () { return { promet: 0, profit: 0, kom: 0 }; };
    var danas = prazno(), sedmica = prazno(), prosla = prazno(), mjesec = prazno(), d7 = prazno();
    var poProizvodu = {}, poRadniku = {};
    var kartePrazno = function () { return { dnevne: prazno(), mjesecne: prazno(), trener: prazno() }; };
    var karte = { danas: kartePrazno(), mjesec: kartePrazno() };
    karte.mjesec.nove = 0; karte.mjesec.produzene = 0;
    var osoblje = { danas: {}, mjesec: {} };
    var dodajOsobi = function (grupa, osoba, polje, vrijednost, stavka) {
      var o = osoblje[grupa][osoba] || (osoblje[grupa][osoba] = { osoba: osoba, kom: 0, nabavna: 0, uzeto: 0, stavke: {} });
      o[polje] += vrijednost;
      if (stavka) o.stavke[stavka.naziv] = (o.stavke[stavka.naziv] || 0) + stavka.kom;
    };
    tDog.redovi.forEach(function (r) {
      var tip = s_(r.tip_dogadjaja);
      if (tip === 'POTROSNJA' || tip === 'KASA_IZLAZ') {
        var dd = datum_(r.datum), os = s_(r.osoba) || '—';
        var grupe = [];
        if (dd === per.danas) grupe.push('danas');
        if (dd >= per.mjesecOd && dd <= per.danas) grupe.push('mjesec');
        grupe.forEach(function (gr) {
          if (tip === 'KASA_IZLAZ') { dodajOsobi(gr, os, 'uzeto', num_(r.cijena)); return; }
          var pp = poId[s_(r.product_id)] || { nabavna: 0, prati_zalihu: true, naziv: s_(r.proizvod) };
          var qq = num_(r.kolicina);
          dodajOsobi(gr, os, 'kom', qq, { naziv: pp.naziv || s_(r.proizvod), kom: qq });
          dodajOsobi(gr, os, 'nabavna', qq * trosak_(pp));
        });
        return;
      }
      if (tip !== 'SALE' && tip !== 'UNDO_SALE') return;
      var d = datum_(r.datum), pid = s_(r.product_id);
      var p = poId[pid] || { nabavna: 0, prati_zalihu: false, naziv: s_(r.proizvod) };
      var q = num_(r.kolicina), uk = num_(r.ukupno);
      var pr = uk - q * trosak_(p);
      var dodaj = function (o) { o.promet += uk; o.profit += pr; o.kom += q; };
      var kt = p.tip ? karteGrupa_(p.tip) : null;
      if (kt) {
        var napo = s_(r.napomena);
        if (d === per.danas) dodaj(karte.danas[kt]);
        if (d >= per.mjesecOd && d <= per.danas) {
          dodaj(karte.mjesec[kt]);
          if (kt === 'mjesecne' && tip === 'SALE') { if (/^Novi član/.test(napo)) karte.mjesec.nove++; else karte.mjesec.produzene++; }
        }
      }
      if (d === per.danas) dodaj(danas);
      if (d >= per.od7 && d <= per.danas) dodaj(d7);
      if (d >= per.sedmicaOd && d <= per.danas) dodaj(sedmica);
      if (d >= per.proslaOd && d <= per.proslaDo) dodaj(prosla);
      if (d >= per.mjesecOd && d <= per.danas) {
        dodaj(mjesec);
        if (!poProizvodu[pid]) poProizvodu[pid] = { product_id: pid, naziv: p.naziv, kom: 0, promet: 0, profit: 0 };
        dodaj(poProizvodu[pid]);
        var rad = s_(r.radnik) || '—';
        if (!poRadniku[rad]) poRadniku[rad] = { radnik: rad, kom: 0, promet: 0, profit: 0 };
        dodaj(poRadniku[rad]);
      }
    });
    var zaokruzi = function (o) { o.promet = r2_(o.promet); o.profit = r2_(o.profit); return o; };
    [danas, sedmica, prosla, mjesec, d7].forEach(zaokruzi);
    ['danas', 'mjesec'].forEach(function (k) { ['dnevne', 'mjesecne', 'trener'].forEach(function (g) { zaokruzi(karte[k][g]); }); });
    var sviCl = tabela_(TAB.CLANOVI).redovi.map(clanJavno_).filter(function (c) { return c.member_id && c.aktivan; });
    karte.aktivnih_karti = sviCl.filter(function (c) { return c.istek && c.istek >= t.datum; }).length;
    karte.sa_trenerom = sviCl.filter(function (c) { return c.trener_do && c.trener_do >= t.datum; })
      .map(function (c) { return { member_id: c.member_id, ime: c.ime, telefon: c.telefon, trener: c.trener, trener_do: c.trener_do, istek: c.istek }; })
      .sort(function (a, b) { return a.trener_do < b.trener_do ? -1 : 1; });
    karte.po_treneru = {};
    karte.sa_trenerom.forEach(function (c) { karte.po_treneru[c.trener] = (karte.po_treneru[c.trener] || 0) + 1; });

    var manjak = 0, visak = 0, kasaRaz = 0, smjenaMj = 0;
    var otvorena = null;
    tSm.redovi.forEach(function (r) {
      if (s_(r.status) === 'OPEN') otvorena = r;
      if (s_(r.status) !== 'CLOSED' || datum_(r.datum) < per.mjesecOd) return;
      smjenaMj++;
      var v = num_(r.vrijednost_razlike);
      if (v < 0) manjak += v; else visak += v;
      kasaRaz += num_(r.kasa_razlika);
    });

    var otv = null, zalihe = [];
    var robaAktivna = proizvodi.filter(function (p) { return p.prati_zalihu && p.aktivan; });
    if (otvorena) {
      var sid = s_(otvorena.shift_id);
      var ps = pocetnaSmjene_(sid, tInv);
      var ob = obracunSmjene_(proizvodi, ps.pocetna, dogadjajiSmjene_(sid, tDog), null);
      var sati = (tsMin_(t.ts) - tsMin_(s_(otvorena.created_at))) / 60;
      otv = {
        shift_id: sid, radnik: s_(otvorena.radnik), datum: datum_(otvorena.datum),
        od: vrijeme_(otvorena.vrijeme_pocetka), sati: Math.round(sati * 10) / 10,
        stara: sati >= CONFIG.STARA_SMJENA_SATI, promet: ob.promet, kom: ob.prodano_kom,
        kasa_pocetna: r2_(num_(otvorena.kasa_pocetna)), uzeto_iz_kase: ob.uzeto_iz_kase, kasa_treba: kasaTreba_(otvorena.kasa_pocetna, ob)
      };
      var ocek = {};
      ob.stavke.forEach(function (st) { ocek[st.product_id] = st.ocekivano; });
      zalihe = robaAktivna.map(function (p) {
        var k = ocek.hasOwnProperty(p.product_id) ? ocek[p.product_id] : null;
        return { product_id: p.product_id, naziv: p.naziv, kolicina: k, minimum: p.minimum, izvor: 'očekivano sada', nisko: k !== null && k <= p.minimum };
      });
    } else {
      var pr = prijedlog_(tInv);
      zalihe = robaAktivna.map(function (p) {
        var k = pr.hasOwnProperty(p.product_id) ? pr[p.product_id] : null;
        return { product_id: p.product_id, naziv: p.naziv, kolicina: k, minimum: p.minimum, izvor: 'zadnje brojanje', nisko: k !== null && k <= p.minimum };
      });
    }

    var top = Object.keys(poProizvodu).map(function (k) { return zaokruzi(poProizvodu[k]); })
      .filter(function (x) { return x.kom > 0; })
      .sort(function (a, b) { return b.promet - a.promet; }).slice(0, 5);
    var radnici = Object.keys(poRadniku).map(function (k) { return zaokruzi(poRadniku[k]); })
      .sort(function (a, b) { return b.promet - a.promet; });

    return {
      danas_datum: t.datum,
      periodi: per,
      otvorena: otv,
      danas: danas,
      d7: d7,
      sedmica: sedmica,
      prosla: prosla,
      plata: {
        udio: CONFIG.PLATA_UDIO,
        prosla: r2_(Math.max(0, prosla.profit) * CONFIG.PLATA_UDIO),
        ova_do_sada: r2_(Math.max(0, sedmica.profit) * CONFIG.PLATA_UDIO)
      },
      mjesec: {
        promet: mjesec.promet, profit: mjesec.profit, kom: mjesec.kom, smjena: smjenaMj,
        manjak_km: r2_(manjak), visak_km: r2_(visak), kasa_razlike: r2_(kasaRaz),
        top: top, po_radniku: radnici
      },
      zalihe: zalihe,
      clanovi: clanoviPregled_(tabela_(TAB.CLANOVI).redovi.map(clanJavno_), t.datum),
      svi_clanovi: tabela_(TAB.CLANOVI).redovi.map(clanJavno_).filter(function (c) { return c.member_id; }),
      proizvodi: proizvodi.map(function (p) {
        return {
          product_id: p.product_id, kategorija: p.kategorija, naziv: p.naziv, cijena: p.cijena, nabavna: p.nabavna,
          prati_zalihu: p.prati_zalihu, aktivan: p.aktivan, minimum: p.minimum, redoslijed: p.redoslijed,
          clanarina_mjeseci: p.clanarina_mjeseci, tip: p.tip, dodao: p.dodao
        };
      }),
      karte: karte,
      osoblje: ['danas', 'mjesec'].reduce(function (acc, gr) {
        acc[gr] = Object.keys(osoblje[gr]).map(function (k) {
          var o = osoblje[gr][k];
          return {
            osoba: o.osoba, kom: o.kom, nabavna: r2_(o.nabavna), uzeto: r2_(o.uzeto),
            stavke: Object.keys(o.stavke).filter(function (n) { return o.stavke[n]; }).map(function (n) { return { naziv: n, kom: o.stavke[n] }; })
          };
        }).sort(function (a, b) { return b.nabavna + b.uzeto - a.nabavna - a.uzeto; });
        return acc;
      }, {}),
      raspored: raspored_(),
      treneri: treneri_(),
      radnici: radnici_(),
      vlasnici: CONFIG.VLASNICI
    };
  });
}

/** Vlasnik mijenja PIN (4–8 cifara). */
function changePin(pin, noviPin) {
  return api_(function () {
    provjeriPin_(pin);
    var n = s_(noviPin);
    if (!/^\d{4,8}$/.test(n)) throw greska_('NOVI_PIN', 'Novi PIN mora imati 4 do 8 cifara.');
    svojstva_().setProperty('ADMIN_PIN', n);
    return {};
  });
}

function slug_(t) {
  return normaliziraj_(t).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30) || 'proizvod';
}

/**
 * Vlasnik dodaje novi proizvod ili mijenja postojeći (cijena, nabavna, minimum, aktivan...).
 * Proizvodi se nikad ne brišu — samo deaktiviraju, da historija ostane tačna.
 */
function saveProduct(pin, p) {
  return api_(function () {
    provjeriPin_(pin);
    p = p || {};
    return zakljucano_(function () {
      var t = tabela_(TAB.PROIZVODI);
      var id = s_(p.product_id);
      var red = null;
      t.redovi.forEach(function (r) { if (id && s_(r.product_id) === id) red = r; });
      var naziv = s_(p.naziv).slice(0, 60);
      if (!naziv) throw greska_('NAZIV', 'Upiši naziv proizvoda.');
      var cijena = num_(p.cijena);
      if (!(cijena > 0) || cijena > 10000) throw greska_('CIJENA', 'Cijena mora biti veća od nule.');
      var nabavna = num_(p.nabavna);
      if (nabavna < 0) throw greska_('NABAVNA', 'Nabavna cijena ne može biti negativna.');
      var izmjene = {
        naziv: naziv, kategorija: s_(p.kategorija).slice(0, 30) || 'Ostalo', cijena: r2_(cijena), nabavna_cijena: nabavna,
        prati_zalihu: !!p.prati_zalihu, aktivan: p.aktivan === undefined ? true : !!p.aktivan,
        minimum: Math.max(0, Math.round(num_(p.minimum))),
        clanarina_mjeseci: Math.max(0, Math.round(num_(p.clanarina_mjeseci)))
      };
      var tip = s_(p.tip).toLowerCase();
      if (TIPOVI_PROIZVODA.indexOf(tip) < 0) tip = izmjene.prati_zalihu ? 'roba' : (izmjene.clanarina_mjeseci > 0 ? 'clanarina' : 'usluga');
      izmjene.tip = tip;
      izmjene.dodao = ''; // vlasnik je pregledao/potvrdio proizvod
      if (tip === 'roba') izmjene.prati_zalihu = true;
      else izmjene.prati_zalihu = false;
      if (tip === 'clanarina' || tip === 'trener') izmjene.clanarina_mjeseci = izmjene.clanarina_mjeseci || 1;
      else izmjene.clanarina_mjeseci = 0;
      if (red) {
        if (s_(p.redoslijed) !== '') izmjene.redoslijed = num_(p.redoslijed);
        azurirajRed_(t, red, izmjene);
        return { product_id: id, novi: false };
      }
      var postojeci = {}, maxRed = 0;
      t.redovi.forEach(function (r) { postojeci[s_(r.product_id)] = true; maxRed = Math.max(maxRed, num_(r.redoslijed)); });
      var novi = id || slug_(naziv), k = novi, i = 2;
      while (postojeci[k]) k = novi + '_' + (i++);
      izmjene.product_id = k;
      izmjene.redoslijed = s_(p.redoslijed) !== '' ? num_(p.redoslijed) : maxRed + 10;
      dodajRedove_(t, [izmjene]);
      if (t.sh.getLastRow() > 1) { try { checkboxeProizvoda_(t.sh); } catch (e) { /* */ } }
      return { product_id: k, novi: true };
    });
  });
}

function karteGrupa_(tip) {
  return tip === 'dnevna' ? 'dnevne' : tip === 'clanarina' ? 'mjesecne' : tip === 'trener' ? 'trener' : null;
}

/** Vlasnik mijenja spisak radnika i trenera (dugmad u aplikaciji). */
function saveLists(pin, liste) {
  return api_(function () {
    provjeriPin_(pin);
    liste = liste || {};
    var ocisti = function (l) {
      var v = (Array.isArray(l) ? l : String(l || '').split(',')).map(function (x) { return s_(x).slice(0, 40); }).filter(function (x) { return x; });
      var jed = [];
      v.forEach(function (x) { if (jed.indexOf(x) < 0) jed.push(x); });
      return jed.slice(0, 12);
    };
    if (liste.radnici !== undefined) {
      var r = ocisti(liste.radnici);
      if (!r.length) throw greska_('RADNICI', 'Upiši bar jednog radnika.');
      svojstva_().setProperty('RADNICI', JSON.stringify(r));
    }
    if (liste.treneri !== undefined) {
      var tr = ocisti(liste.treneri);
      if (!tr.length) throw greska_('TRENERI', 'Upiši bar jednog trenera.');
      svojstva_().setProperty('TRENERI', JSON.stringify(tr));
    }
    return { radnici: radnici_(), treneri: treneri_() };
  });
}

/**
 * Radnik dodaje NOVO piće ili uslugu (npr. stigao novi proizvod usred smjene).
 * Ne može mijenjati postojeće proizvode, cijene, karte ni trenere — to radi samo vlasnik (PIN).
 * Ako je smjena u toku i proizvod se broji, ulazi u inventuru te smjene s početnim stanjem 0
 * (komadi koje stavlja upisuju se kao DOPUNA, pa se na kraju normalno prebroje).
 */
function addProductRadnik(podaci) {
  return api_(function () {
    var p = podaci || {};
    var naziv = s_(p.naziv).replace(/\s+/g, ' ').slice(0, 60);
    if (naziv.length < 2) throw greska_('NAZIV', 'Upiši naziv.');
    var cijena = num_(p.cijena);
    if (!(cijena > 0) || cijena > 200) throw greska_('CIJENA', 'Upiši cijenu (veću od 0).');
    var tip = s_(p.tip) === 'usluga' ? 'usluga' : 'roba';
    var radnik = s_(p.radnik).slice(0, 40) || 'radnik';
    return zakljucano_(function () {
      var t = tabela_(TAB.PROIZVODI);
      var isti = null, maxRed = 0, postojeci = {};
      t.redovi.forEach(function (r) {
        postojeci[s_(r.product_id)] = true;
        maxRed = Math.max(maxRed, num_(r.redoslijed));
        if (normaliziraj_(r.naziv) === normaliziraj_(naziv)) isti = r;
      });
      if (isti) {
        var aktivan = s_(isti.aktivan) === '' ? true : bool_(isti.aktivan);
        throw greska_('POSTOJI', aktivan ? '„' + s_(isti.naziv) + '" već postoji na listi.' : '„' + s_(isti.naziv) + '" postoji, ali ga je vlasnik isključio. Javi vlasniku.');
      }
      var id = slug_(naziv), k = id, i = 2;
      while (postojeci[k]) k = id + '_' + (i++);
      var t0 = sada_();
      var novi = {
        product_id: k, kategorija: s_(p.kategorija).slice(0, 30) || (tip === 'usluga' ? 'Usluge' : 'Ostalo'), naziv: naziv,
        cijena: r2_(cijena), nabavna_cijena: 0, prati_zalihu: tip === 'roba', aktivan: true, redoslijed: maxRed + 10,
        minimum: tip === 'roba' ? 3 : 0, clanarina_mjeseci: 0, tip: tip,
        dodao: radnik + ' ' + t0.datum + ' ' + t0.vrijeme
      };
      dodajRedove_(t, [novi]);
      try { checkboxeProizvoda_(t.sh); } catch (e) { /* */ }

      var uSmjenu = false;
      var sid = s_(p.shift_id);
      if (sid && tip === 'roba') {
        var sm = null;
        tabela_(TAB.SMJENE).redovi.forEach(function (r) { if (s_(r.shift_id) === sid) sm = r; });
        if (sm && s_(sm.status) === 'OPEN') {
          dodajRedove_(tabela_(TAB.INVENTURA), [{
            shift_id: sid, datum: datum_(sm.datum), radnik: s_(sm.radnik), product_id: k, proizvod: naziv, pocetno_stanje: 0
          }]);
          uSmjenu = true;
        }
      }
      var proizvod = null;
      proizvodi_().forEach(function (x) { if (x.product_id === k) proizvod = javniProizvod_(x); });
      return { proizvod: proizvod, u_smjenu: uSmjenu, proizvodi: proizvodi_().map(javniProizvod_) };
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
 *  RASPORED TRENINGA (planer: ko dolazi koji dan, u koliko sati, šta trenira)
 *  Tabela TRENINZI: jedan red = jedan termin u jednom danu.
 * ═══════════════════════════════════════════════════════════════ */
function danKljuc_(v) {
  var t = normaliziraj_(v).slice(0, 3);
  var mapa = { pon: 'pon', uto: 'uto', sri: 'sri', cet: 'cet', pet: 'pet', sub: 'sub', ned: 'ned', mon: 'pon', tue: 'uto', wed: 'sri', thu: 'cet', fri: 'pet', sat: 'sub', sun: 'ned' };
  return mapa[t] || '';
}

/** Dan u sedmici za 'yyyy-MM-dd' → 'pon'…'ned'. */
function danUSedmici_(datum) {
  var n = danBroj_(datum);
  return DANI[(new Date(n * 86400000).getUTCDay() + 6) % 7];
}

function raspored_() {
  var lista = [];
  tabela_(TAB.TRENINZI).redovi.forEach(function (r) {
    var aktivan = s_(r.aktivan) === '' ? true : bool_(r.aktivan);
    var dan = danKljuc_(r.dan);
    if (!aktivan || !dan || !s_(r.osobe)) return;
    lista.push({
      termin_id: s_(r.termin_id), osobe: s_(r.osobe), dan: dan, vrijeme: vrijeme_(r.vrijeme),
      trening: s_(r.trening), trener: s_(r.trener), napomena: s_(r.napomena)
    });
  });
  lista.sort(function (a, b) { return DANI.indexOf(a.dan) - DANI.indexOf(b.dan) || (a.vrijeme < b.vrijeme ? -1 : a.vrijeme > b.vrijeme ? 1 : 0); });
  return lista;
}

/**
 * Vlasnik sprema termin: osobe, vrijeme, trener, napomena i za svaki izabrani dan šta se trenira.
 * dani = { pon: 'Prsa + triceps', sri: 'Noge', ... } — dan koji nije naveden se isključuje.
 */
function saveTermin(pin, termin) {
  return api_(function () {
    provjeriPin_(pin);
    var x = termin || {};
    var osobe = s_(x.osobe).slice(0, 120);
    if (!osobe) throw greska_('OSOBE', 'Upiši ko trenira.');
    var vrijeme = vrijeme_(x.vrijeme);
    if (!vrijeme) throw greska_('VRIJEME', 'Upiši vrijeme (npr. 19:00).');
    var dani = {};
    Object.keys(x.dani || {}).forEach(function (k) { var d = danKljuc_(k); if (d) dani[d] = s_(x.dani[k]).slice(0, 200); });
    if (!Object.keys(dani).length) throw greska_('DANI', 'Izaberi bar jedan dan.');
    return zakljucano_(function () {
      var t = tabela_(TAB.TRENINZI);
      var id = s_(x.termin_id) || noviId_('T');
      var zajedno = { osobe: osobe, vrijeme: vrijeme, trener: s_(x.trener).slice(0, 40), napomena: s_(x.napomena).slice(0, 200) };
      var vidjeni = {};
      t.redovi.forEach(function (r) {
        if (s_(r.termin_id) !== id) return;
        var d = danKljuc_(r.dan);
        if (dani.hasOwnProperty(d) && !vidjeni[d]) {
          vidjeni[d] = true;
          azurirajRed_(t, r, Object.assign({ trening: dani[d], aktivan: true }, zajedno));
        } else {
          azurirajRed_(t, r, { aktivan: false });
        }
      });
      var novi = Object.keys(dani).filter(function (d) { return !vidjeni[d]; }).map(function (d) {
        return Object.assign({ termin_id: id, dan: d, trening: dani[d], aktivan: true }, zajedno);
      });
      if (novi.length) dodajRedove_(t, novi);
      return { termin_id: id, raspored: raspored_() };
    });
  });
}

/** Ukloni termin iz rasporeda (redovi ostaju u tabeli kao neaktivni). */
function deleteTermin(pin, terminId) {
  return api_(function () {
    provjeriPin_(pin);
    var id = s_(terminId);
    return zakljucano_(function () {
      var t = tabela_(TAB.TRENINZI);
      var n = 0;
      t.redovi.forEach(function (r) { if (s_(r.termin_id) === id) { azurirajRed_(t, r, { aktivan: false }); n++; } });
      if (!n) throw greska_('NEMA_TERMINA', 'Termin ne postoji.');
      return { raspored: raspored_() };
    });
  });
}
