/**
 * ═══════════════════════════════════════════════════════════════
 *  FITNESS CLUB ADIN — TUYA (vrata, svjetla, ulazi članova)
 *  Sve funkcije ovdje su SAMO za vlasnika (PIN). Radnik ih ne vidi.
 *  Ključevi (Access ID / Secret) se čuvaju u Script Properties, nikad u kodu ni u Sheetu.
 * ═══════════════════════════════════════════════════════════════
 */

var TUYA_HOSTOVI = {
  eu: 'https://openapi.tuyaeu.com',       // Centralna Evropa (BiH) — najčešće ovo
  weu: 'https://openapi-weaz.tuyaeu.com', // Zapadna Evropa
  us: 'https://openapi.tuyaus.com',
  cn: 'https://openapi.tuyacn.com',
  in: 'https://openapi.tuyain.com'
};

var TUYA_NACINI = {
  unlock_card: 'Čip / kartica', unlock_password: 'Šifra', unlock_fingerprint: 'Otisak prsta',
  unlock_temporary: 'Privremena šifra', unlock_dynamic: 'Dinamička šifra', unlock_offline_pd: 'Offline šifra',
  unlock_app: 'Aplikacija', unlock_remote: 'Daljinski', remote_no_dp_key: 'Daljinski', unlock_face: 'Lice',
  unlock_key: 'Ključ', unlock_ble: 'Bluetooth', unlock_hand: 'Dlan', unlock_finger_vein: 'Vena prsta',
  unlock_double: 'Dvostruko', unlock_identity_card: 'Lična karta', unlock_eye: 'Oko'
};

/* ═══════ POSTAVKE ═══════ */
function tuyaPostavke_() {
  var p = svojstva_().getProperties();
  return {
    accessId: s_(p.TUYA_ACCESS_ID), secret: s_(p.TUYA_SECRET), region: s_(p.TUYA_REGION) || 'eu',
    bravaId: s_(p.TUYA_BRAVA_ID), svjetlaId: s_(p.TUYA_SVJETLA_ID), svjetlaKod: s_(p.TUYA_SVJETLA_KOD) || 'switch_1',
    zadnjiUlazMs: num_(p.TUYA_ZADNJI_ULAZ_MS)
  };
}

function tuyaPostavljeno_(s) { return !!(s.accessId && s.secret); }

/* ═══════ POTPIS (Tuya Cloud API, HMAC-SHA256) ═══════ */
function hex_(bajtovi) {
  return bajtovi.map(function (b) { var x = (b < 0 ? b + 256 : b).toString(16); return x.length === 1 ? '0' + x : x; }).join('');
}

function sha256Hex_(tekst) {
  return hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, tekst || '', Utilities.Charset.UTF_8));
}

/** stringToSign = METHOD \n SHA256(body) \n (headeri) \n URL ; sign = HMAC(clientId + token + t + nonce + stringToSign) */
function tuyaPotpis_(clientId, secret, token, t, nonce, metoda, putanja, tijelo) {
  var zaPotpis = metoda + '\n' + sha256Hex_(tijelo || '') + '\n' + '' + '\n' + putanja;
  return hex_(Utilities.computeHmacSha256Signature(clientId + (token || '') + t + nonce + zaPotpis, secret)).toUpperCase();
}

function tuyaFetch_(s, metoda, putanja, tijelo, token) {
  var host = TUYA_HOSTOVI[s.region] || TUYA_HOSTOVI.eu;
  var t = String(nowDate_().getTime());
  var nonce = Utilities.getUuid();
  var body = tijelo ? JSON.stringify(tijelo) : '';
  var headeri = {
    client_id: s.accessId, t: t, nonce: nonce, sign_method: 'HMAC-SHA256',
    sign: tuyaPotpis_(s.accessId, s.secret, token, t, nonce, metoda, putanja, body)
  };
  if (token) headeri.access_token = token;
  var opcije = { method: metoda.toLowerCase(), headers: headeri, muteHttpExceptions: true, contentType: 'application/json' };
  if (body) opcije.payload = body;
  var odgovor;
  try {
    odgovor = UrlFetchApp.fetch(host + putanja, opcije);
  } catch (e) {
    throw greska_('TUYA_MREZA', 'Tuya server se ne javlja. Pokušaj ponovo.');
  }
  var json;
  try { json = JSON.parse(odgovor.getContentText()); } catch (e) { throw greska_('TUYA', 'Tuya je vratila neočekivan odgovor.'); }
  return json;
}

function tuyaToken_(s, novi) {
  var kes = CacheService.getScriptCache();
  var kljuc = 'tuya_token_' + s.accessId;
  if (!novi) { var stari = kes.get(kljuc); if (stari) return stari; }
  var r = tuyaFetch_(s, 'GET', '/v1.0/token?grant_type=1', null, '');
  if (!r.success || !r.result || !r.result.access_token) {
    throw greska_('TUYA_PRIJAVA', 'Tuya ne prihvata Access ID / Secret ili region. Provjeri postavke. (' + s_(r.msg) + ')');
  }
  var traje = Math.max(60, Math.min(21600, num_(r.result.expire_time) - 120));
  kes.put(kljuc, r.result.access_token, traje);
  return r.result.access_token;
}

/** Poziv Tuya API-ja s tokenom; jednom ponovi ako je token istekao. */
function tuyaZahtjev_(metoda, putanja, tijelo) {
  var s = tuyaPostavke_();
  if (!tuyaPostavljeno_(s)) throw greska_('TUYA_NIJE_POSTAVLJEN', 'Tuya još nije povezana. Upiši Access ID i Secret u Vlasnik → Vrata → Postavke.');
  var r = tuyaFetch_(s, metoda, putanja, tijelo, tuyaToken_(s, false));
  if (!r.success && (r.code === 1010 || r.code === 1011 || r.code === 1012)) {
    r = tuyaFetch_(s, metoda, putanja, tijelo, tuyaToken_(s, true));
  }
  if (!r.success) {
    var poruka = s_(r.msg) || 'nepoznata greška';
    if (r.code === 1106 || r.code === 2017) poruka = 'nema dozvole za ovaj uređaj (je li povezan s Tuya projektom?)';
    if (r.code === 2001 || r.code === 1109) poruka = 'uređaj nije pronađen ili nije na mreži';
    throw greska_('TUYA', 'Tuya: ' + poruka + '.');
  }
  return r.result;
}

/* ═══════ JAVNI API (vlasnik) ═══════ */
function getTuyaSettings(pin) {
  return api_(function () {
    provjeriPin_(pin);
    var s = tuyaPostavke_();
    return {
      postavljeno: tuyaPostavljeno_(s),
      access_id: s.accessId,
      ima_secret: !!s.secret,
      region: s.region, brava_id: s.bravaId, svjetla_id: s.svjetlaId, svjetla_kod: s.svjetlaKod,
      automatika: automatikaUkljucena_(),
      regioni: Object.keys(TUYA_HOSTOVI)
    };
  });
}

function saveTuyaSettings(pin, n) {
  return api_(function () {
    provjeriPin_(pin);
    n = n || {};
    var region = s_(n.region) || 'eu';
    if (!TUYA_HOSTOVI[region]) throw greska_('REGION', 'Nepoznat region.');
    var p = {
      TUYA_ACCESS_ID: s_(n.access_id).slice(0, 80), TUYA_REGION: region,
      TUYA_BRAVA_ID: s_(n.brava_id).slice(0, 80), TUYA_SVJETLA_ID: s_(n.svjetla_id).slice(0, 80),
      TUYA_SVJETLA_KOD: s_(n.svjetla_kod).slice(0, 40) || 'switch_1'
    };
    if (s_(n.secret)) p.TUYA_SECRET = s_(n.secret).slice(0, 120); // prazno = zadrži stari
    svojstva_().setProperties(p);
    try { CacheService.getScriptCache().remove('tuya_token_' + p.TUYA_ACCESS_ID); } catch (e) { /* */ }
    var s = tuyaPostavke_();
    if (!tuyaPostavljeno_(s)) return { provjera: 'Sačuvano. Fali još Access ID ili Secret.' };
    tuyaToken_(s, true); // odmah provjeri da ključevi rade
    return { provjera: 'Veza s Tuyom radi.' };
  });
}

function uredjaj_(id) {
  if (!id) return null;
  var info = {}, status = [];
  try { info = tuyaZahtjev_('GET', '/v1.0/devices/' + encodeURIComponent(id)) || {}; } catch (e) { return { id: id, greska: e.poruka || 'Nedostupno' }; }
  try { status = tuyaZahtjev_('GET', '/v1.0/devices/' + encodeURIComponent(id) + '/status') || []; } catch (e) { status = info.status || []; }
  var mapa = {};
  (status || []).forEach(function (x) { mapa[x.code] = x.value; });
  return { id: id, naziv: s_(info.name) || id, online: info.online !== false, status: mapa };
}

function tuyaStatus(pin) {
  return api_(function () {
    provjeriPin_(pin);
    var s = tuyaPostavke_();
    if (!tuyaPostavljeno_(s)) return { postavljeno: false };
    var brava = uredjaj_(s.bravaId), svjetla = uredjaj_(s.svjetlaId);
    var baterija = null;
    if (brava && brava.status) {
      ['residual_electricity', 'battery_percentage', 'battery_state'].forEach(function (k) {
        if (baterija === null && brava.status[k] !== undefined) baterija = brava.status[k];
      });
    }
    return {
      postavljeno: true,
      brava: brava ? { naziv: brava.naziv, online: brava.online, baterija: baterija, greska: brava.greska || '' } : null,
      svjetla: svjetla ? {
        naziv: svjetla.naziv, online: svjetla.online, greska: svjetla.greska || '',
        upaljeno: svjetla.status ? svjetla.status[s.svjetlaKod] === true : null
      } : null
    };
  });
}

/** Daljinsko otključavanje (brava mora podržavati "otključavanje bez šifre" preko oblaka). */
function tuyaOtkljucaj(pin) {
  return api_(function () {
    provjeriPin_(pin);
    var s = tuyaPostavke_();
    if (!s.bravaId) throw greska_('NEMA_BRAVE', 'Nije upisan ID brave.');
    var baza = '/v1.0/devices/' + encodeURIComponent(s.bravaId) + '/door-lock';
    var tiket = tuyaZahtjev_('POST', baza + '/password-ticket', {});
    if (!tiket || !tiket.ticket_id) throw greska_('TUYA', 'Brava nije izdala dozvolu za otključavanje.');
    tuyaZahtjev_('POST', baza + '/password-free/open-door', { ticket_id: tiket.ticket_id });
    var t = sada_();
    zakljucano_(function () {
      dodajRedove_(tabela_(TAB.ULAZI), [{
        izvor_id: 'APP-' + t.ms, datum: t.datum, vrijeme: t.vrijeme, nacin: 'Daljinski (vlasnik iz aplikacije)',
        korisnik_brave: '', ime: 'Vlasnik', member_id: '', clanarina: '', napomena: ''
      }]);
    });
    return { poruka: 'Vrata su otključana.' };
  });
}

function tuyaSvjetla(pin, upali) {
  return api_(function () {
    provjeriPin_(pin);
    var s = tuyaPostavke_();
    if (!s.svjetlaId) throw greska_('NEMA_SVJETLA', 'Nije upisan ID prekidača za svjetla.');
    tuyaZahtjev_('POST', '/v1.0/devices/' + encodeURIComponent(s.svjetlaId) + '/commands',
      { commands: [{ code: s.svjetlaKod, value: !!upali }] });
    return { upaljeno: !!upali };
  });
}

/* ═══════ ULAZI ČLANOVA ═══════ */

/** Jedan zapis iz Tuya dnevnika otključavanja → naš red. Tuya vraća različite oblike, zato oprezno. */
function parsirajUlaz_(log) {
  log = log || {};
  var st = log.status;
  if (Array.isArray(st)) st = st[0];
  st = st || {};
  var kod = s_(st.code || log.code || log.unlock_type || '');
  var vrijednost = s_(st.value !== undefined ? st.value : (log.value !== undefined ? log.value : ''));
  var ms = num_(log.update_time || log.gmt_create || log.time || log.create_time);
  if (ms && ms < 100000000000) ms = ms * 1000; // sekunde → ms
  var korisnikId = s_(log.user_id || log.unlock_id || '');
  var imeBrava = s_(log.unlock_name || log.nick_name || log.user_name || '');
  return {
    ms: ms,
    izvor_id: s_(log.id || log.log_id) || (ms + '|' + kod + '|' + vrijednost + '|' + korisnikId),
    nacin: TUYA_NACINI[kod] || kod || 'Nepoznato',
    kljucevi: [korisnikId, vrijednost, imeBrava].filter(function (x) { return x; }),
    korisnik_brave: [imeBrava, korisnikId || vrijednost].filter(function (x) { return x; }).join(' · ')
  };
}

/** Poveži ulaz sa članom: kolona CLANOVI.brava_id (ID korisnika / broj čipa u bravi) ili isto ime. */
function nadjiClana_(clanovi, u) {
  var k = u.kljucevi.map(function (x) { return normaliziraj_(x); });
  var nadjen = null;
  clanovi.forEach(function (c) {
    if (nadjen || !c.member_id) return;
    var b = normaliziraj_(c.brava_id);
    if (b && k.indexOf(b) >= 0) nadjen = c;
  });
  if (!nadjen) clanovi.forEach(function (c) { if (!nadjen && c.ime && k.indexOf(normaliziraj_(c.ime)) >= 0) nadjen = c; });
  return nadjen;
}

/** Povlači nove ulaze s brave u tab ULAZI. Pokreće je automatski okidač svakih 5 min (ili vlasnik ručno). */
function sinhronizujUlaze() {
  var s = tuyaPostavke_();
  if (!tuyaPostavljeno_(s) || !s.bravaId) return { novih: 0 };
  var sad = nowDate_().getTime();
  var od = s.zadnjiUlazMs ? s.zadnjiUlazMs - 10 * 60000 : sad - 24 * 3600000; // preklapanje 10 min (dedupe po ID-u)
  var logovi = [];
  for (var strana = 1; strana <= 10; strana++) {
    var r = tuyaZahtjev_('GET', '/v1.0/devices/' + encodeURIComponent(s.bravaId) +
      '/door-lock/open-logs?end_time=' + sad + '&page_no=' + strana + '&page_size=50&start_time=' + od);
    var lista = (r && (r.logs || r.list || r.records)) || (Array.isArray(r) ? r : []);
    logovi = logovi.concat(lista);
    if (!r || !r.has_more || !lista.length) break;
  }
  return zakljucano_(function () {
    var t = tabela_(TAB.ULAZI);
    var ima = {};
    t.redovi.forEach(function (x) { ima[s_(x.izvor_id)] = true; });
    var clanovi = tabela_(TAB.CLANOVI).redovi.map(clanJavno_);
    var danas = sada_().datum;
    var novi = [];
    logovi.map(parsirajUlaz_).filter(function (u) { return u.ms; }).sort(function (a, b) { return a.ms - b.ms; }).forEach(function (u) {
      if (ima[u.izvor_id]) return;
      ima[u.izvor_id] = true;
      var d = new Date(u.ms);
      var c = nadjiClana_(clanovi, u);
      var status = '', nap = '';
      if (c) {
        status = !c.istek ? 'bez članarine' : (c.istek >= fmt_(d, 'yyyy-MM-dd') ? 'aktivna do ' + dT_(c.istek) : 'ISTEKLA ' + dT_(c.istek));
        if (/ISTEKLA|bez/.test(status)) nap = 'Ušao bez važeće članarine';
      } else if (!/Daljinski|Aplikacija/.test(u.nacin)) {
        nap = 'Nepoznat korisnik brave — upiši brava_id kod člana';
      }
      novi.push({
        izvor_id: u.izvor_id, datum: fmt_(d, 'yyyy-MM-dd'), vrijeme: fmt_(d, 'HH:mm'), nacin: u.nacin,
        korisnik_brave: u.korisnik_brave, ime: c ? c.ime : '', member_id: c ? c.member_id : '',
        clanarina: status, napomena: nap
      });
    });
    if (novi.length) dodajRedove_(t, novi);
    svojstva_().setProperty('TUYA_ZADNJI_ULAZ_MS', String(sad));
    return { novih: novi.length, danas: danas };
  });
}

/** Vlasnik: ulazi za zadnjih N dana (+ odmah povuče nove s brave). */
function getUlazi(pin, dana, osvjezi) {
  return api_(function () {
    provjeriPin_(pin);
    var poruka = '';
    if (osvjezi) {
      try { var r = sinhronizujUlaze(); poruka = r.novih ? 'Povučeno ' + r.novih + ' novih ulaza.' : 'Nema novih ulaza.'; }
      catch (e) { poruka = e.poruka || 'Ulazi se trenutno ne mogu povući s brave.'; }
    }
    var n = Math.max(1, Math.min(60, Math.round(num_(dana)) || 7));
    var od = dodajDane_(sada_().datum, -(n - 1));
    var lista = tabela_(TAB.ULAZI).redovi.map(function (r) {
      return {
        izvor_id: s_(r.izvor_id), datum: datum_(r.datum), vrijeme: vrijeme_(r.vrijeme), nacin: s_(r.nacin),
        korisnik_brave: s_(r.korisnik_brave), ime: s_(r.ime), member_id: s_(r.member_id),
        clanarina: s_(r.clanarina), napomena: s_(r.napomena)
      };
    }).filter(function (u) { return u.datum >= od; });
    lista.sort(function (a, b) { return (b.datum + b.vrijeme) < (a.datum + a.vrijeme) ? -1 : 1; });
    var danas = sada_().datum;
    return {
      poruka: poruka,
      ulazi: lista.slice(0, 300),
      danas: lista.filter(function (u) { return u.datum === danas; }).length,
      sumnjivi: lista.filter(function (u) { return !!u.napomena; }).length,
      automatika: automatikaUkljucena_()
    };
  });
}

/* ═══════ AUTOMATSKO POVLAČENJE ULAZA (okidač) ═══════ */
function automatikaUkljucena_() {
  try {
    return ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'sinhronizujUlaze'; });
  } catch (e) { return false; }
}

function tuyaAutomatika(pin, ukljuci) {
  return api_(function () {
    provjeriPin_(pin);
    ScriptApp.getProjectTriggers().forEach(function (t) {
      if (t.getHandlerFunction() === 'sinhronizujUlaze') ScriptApp.deleteTrigger(t);
    });
    if (ukljuci) ScriptApp.newTrigger('sinhronizujUlaze').timeBased().everyMinutes(5).create();
    return { automatika: !!ukljuci };
  });
}
