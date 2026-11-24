/* FITNESS CLUB ADIN — Evidencija šanka (frontend)
 * Izvor: src/app.jsx  →  build.cjs  →  Index.html (ne uređuj Index.html ručno)
 */

/* @logika-start — čista logika bez Reacta (testira se u Nodeu) */
var Logika = (function () {
  function uid(prefiks) {
    try {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) return prefiks + crypto.randomUUID();
    } catch (e) { /* */ }
    var t = Date.now().toString(36), r = '';
    for (var i = 0; i < 4; i++) r += Math.random().toString(36).slice(2, 8);
    return prefiks + t + '-' + r;
  }

  function km(n) {
    var x = Math.round((Number(n) || 0) * 100) / 100;
    var neg = x < 0; x = Math.abs(x);
    var cijeli = Math.floor(x + 1e-9), dec = Math.round((x - cijeli) * 100);
    if (dec === 100) { cijeli += 1; dec = 0; }
    var s = String(cijeli).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (neg ? '−' : '') + s + ',' + (dec < 10 ? '0' : '') + dec;
  }

  function dT(d) {
    var m = String(d || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? m[3] + '.' + m[2] + '.' + m[1] + '.' : String(d || '');
  }

  function trajanje(min) {
    if (min === null || min === undefined || isNaN(min)) return '';
    min = Math.max(0, Math.round(min));
    return Math.floor(min / 60) + ' h ' + (min % 60 < 10 ? '0' : '') + (min % 60) + ' min';
  }

  function danasSarajevo(d) {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Sarajevo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d || new Date());
    } catch (e) {
      var x = d || new Date();
      return x.getFullYear() + '-' + ('0' + (x.getMonth() + 1)).slice(-2) + '-' + ('0' + x.getDate()).slice(-2);
    }
  }

  /** Stanje aktivne smjene iz događaja: prodano, dopunjeno, očekivano, promet. */
  function stanjeSmjene(smjena, proizvodi) {
    var cijene = {}, po = {};
    (proizvodi || []).forEach(function (p) { cijene[p.product_id] = p.cijena; });
    var promet = 0, kom = 0;
    ((smjena && smjena.dogadjaji) || []).forEach(function (e) {
      var pid = e.product_id, q = Number(e.kolicina) || 0;
      if (!po[pid]) po[pid] = { prodano: 0, dopunjeno: 0 };
      if (e.tip === 'SALE' || e.tip === 'UNDO_SALE') {
        if (e.tip === 'UNDO_SALE') q = -Math.abs(q);
        po[pid].prodano += q;
        kom += q;
        var uk = (e.ukupno !== undefined && e.ukupno !== null && e.ukupno !== '') ? Number(e.ukupno) : q * (cijene[pid] || 0);
        if (e.tip === 'UNDO_SALE') uk = -Math.abs(uk);
        promet += uk;
      } else if (e.tip === 'RESTOCK' || e.tip === 'ADJUSTMENT') {
        po[pid].dopunjeno += q;
      }
    });
    var pocetna = (smjena && smjena.pocetna) || {};
    var ocekivano = {};
    Object.keys(pocetna).forEach(function (pid) {
      var x = po[pid] || { prodano: 0, dopunjeno: 0 };
      ocekivano[pid] = (Number(pocetna[pid]) || 0) + x.dopunjeno - x.prodano;
    });
    return {
      prodano: function (pid) { return po[pid] ? po[pid].prodano : 0; },
      dopunjeno: function (pid) { return po[pid] ? po[pid].dopunjeno : 0; },
      ocekivano: ocekivano,
      promet: Math.round(promet * 100) / 100,
      kom: kom
    };
  }

  /** Poređenje završnog brojanja i kase (radniku se očekivano ne pokazuje dok ne unese). */
  function provjeraZavrsnog(smjena, proizvodi, brojanje, kasa) {
    var st = stanjeSmjene(smjena, proizvodi);
    var razlike = [];
    Object.keys(st.ocekivano).forEach(function (pid) {
      var v = brojanje[pid];
      if (v === undefined || v === '') return;
      if (Number(v) !== st.ocekivano[pid]) razlike.push(pid);
    });
    var kasaBroj = Number(String(kasa === undefined || kasa === null ? '' : kasa).replace(/\s/g, '').replace(',', '.'));
    var imaKasu = String(kasa === undefined || kasa === null ? '' : kasa).trim() !== '' && isFinite(kasaBroj) && kasaBroj >= 0;
    var kasaRazlika = imaKasu ? Math.round((kasaBroj - st.promet) * 100) / 100 : null;
    return {
      razlikeRobe: razlike.length,
      kasaOcekivano: st.promet,
      kasaRazlika: kasaRazlika,
      trebaRazlog: razlike.length > 0 || (kasaRazlika !== null && kasaRazlika !== 0)
    };
  }

  function nedostaje(roba, vrijednosti) {
    return roba.filter(function (p) { var v = vrijednosti[p.product_id]; return v === undefined || v === null || v === ''; });
  }

  /* ── red čekanja ── */
  function dodajURed(red, e) {
    if (red.some(function (x) { return x.event_id === e.event_id; })) return red;
    return red.concat([e]);
  }
  function ukloniIzReda(red, ids) {
    var s = {};
    ids.forEach(function (id) { s[id] = true; });
    return red.filter(function (e) { return !s[e.event_id]; });
  }
  function sljedeciBatch(red, max) {
    if (!red.length) return null;
    var sid = red[0].shift_id;
    return { shift_id: sid, events: red.filter(function (e) { return e.shift_id === sid; }).slice(0, max || 100) };
  }
  /** Pauza prije ponovnog pokušaja: 2 s, 4 s, 8 s, 16 s, 30 s ... */
  function pauza(pokusaj) { return Math.min(30000, 2000 * Math.pow(2, Math.max(0, pokusaj - 1))); }
  /** Događaji sa servera + lokalni koji još nisu stigli na server. */
  function spojiDogadjaje(serverski, lokalni) {
    var ima = {};
    (serverski || []).forEach(function (e) { ima[e.event_id] = true; });
    return (serverski || []).concat((lokalni || []).filter(function (e) { return !ima[e.event_id]; }));
  }
  /** Zaštita od duplog tapa: isti proizvod unutar `ms` se ignoriše. */
  function dozvoliTap(zadnji, pid, sada, ms) {
    if (zadnji[pid] && sada - zadnji[pid] < (ms || 150)) return false;
    zadnji[pid] = sada;
    return true;
  }

  /* ── članarine ── */
  function dodajMjesece(d, n) {
    var m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
    var y = +m[1], mj = +m[2] - 1 + n, dan = +m[3];
    y += Math.floor(mj / 12);
    mj = ((mj % 12) + 12) % 12;
    var maxDan = new Date(Date.UTC(y, mj + 1, 0)).getUTCDate();
    return y + '-' + ('0' + (mj + 1)).slice(-2) + '-' + ('0' + Math.min(dan, maxDan)).slice(-2);
  }
  function produzenje(istek, danas, mjeseci) {
    var aktivna = !!istek && istek >= danas;
    return { aktivna: aktivna, istek: dodajMjesece(aktivna ? istek : danas, mjeseci || 1) };
  }
  function normaliziraj(t) {
    return String(t || '').toLowerCase().replace(/[čć]/g, 'c').replace(/đ/g, 'dj').replace(/š/g, 's').replace(/ž/g, 'z').trim();
  }
  function traziClanove(clanovi, upit) {
    var q = normaliziraj(upit), cifre = q.replace(/\D/g, '');
    var l = (clanovi || []).filter(function (c) {
      if (!q) return true;
      return normaliziraj(c.ime).indexOf(q) >= 0 || (cifre.length >= 3 && String(c.telefon || '').replace(/\D/g, '').indexOf(cifre) >= 0);
    });
    l.sort(function (a, b) { return String(a.ime).localeCompare(String(b.ime)); });
    return l;
  }

  /** Vrsta proizvoda (stari podaci bez kolone tip se pogađaju isto kao na serveru). */
  function tip(p) {
    if (p.tip) return p.tip;
    if (p.prati_zalihu) return 'roba';
    if (p.clanarina_mjeseci > 0) return /trener|personal/i.test(p.naziv) ? 'trener' : 'clanarina';
    if (/dnevn/i.test(p.naziv) || p.product_id === 'dnevna') return 'dnevna';
    return 'usluga';
  }
  function podijeli(proizvodi) {
    var o = { dnevne: [], clanarine: [], treneri: [], roba: [], usluge: [] };
    (proizvodi || []).forEach(function (p) {
      var t = tip(p);
      (t === 'dnevna' ? o.dnevne : t === 'clanarina' ? o.clanarine : t === 'trener' ? o.treneri : t === 'roba' ? o.roba : o.usluge).push(p);
    });
    return o;
  }
  /** Paket = karta (može i bez) + trener (može i bez). */
  function paket(karta, trener, trenerIme, clan, danas) {
    var stavke = [], ukupno = 0;
    if (karta) {
      var pk = produzenje(clan && clan.istek, danas, karta.clanarina_mjeseci);
      stavke.push({ p: karta, tekst: karta.naziv, cijena: karta.cijena, do: pk.istek });
      ukupno += karta.cijena;
    }
    if (trener) {
      var pt = produzenje(clan && clan.trener_do, danas, trener.clanarina_mjeseci);
      stavke.push({ p: trener, tekst: trener.naziv + (trenerIme ? ' — ' + trenerIme : ''), cijena: trener.cijena, do: pt.istek });
      ukupno += trener.cijena;
    }
    var spreman = stavke.length > 0 && (!trener || !!trenerIme);
    return { stavke: stavke, ukupno: Math.round(ukupno * 100) / 100, spreman: spreman };
  }

  /* ── raspored treninga ── */
  var DANI = ['pon', 'uto', 'sri', 'cet', 'pet', 'sub', 'ned'];
  var DANI_IME = { pon: 'Ponedjeljak', uto: 'Utorak', sri: 'Srijeda', cet: 'Četvrtak', pet: 'Petak', sub: 'Subota', ned: 'Nedjelja' };
  function danUSedmici(datum) {
    var m = String(datum).match(/^(\d{4})-(\d{2})-(\d{2})/);
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return DANI[(d.getUTCDay() + 6) % 7];
  }
  function zaDan(raspored, dan) {
    return (raspored || []).filter(function (r) { return r.dan === dan; })
      .sort(function (a, b) { return a.vrijeme < b.vrijeme ? -1 : a.vrijeme > b.vrijeme ? 1 : 0; });
  }
  /** Termini grupisani po terminu (za uređivanje): {termin_id, osobe, vrijeme, trener, napomena, dani:{pon:'…'}} */
  function termini(raspored) {
    var m = {}, red = [];
    (raspored || []).forEach(function (r) {
      if (!m[r.termin_id]) { m[r.termin_id] = { termin_id: r.termin_id, osobe: r.osobe, vrijeme: r.vrijeme, trener: r.trener, napomena: r.napomena, dani: {} }; red.push(m[r.termin_id]); }
      m[r.termin_id].dani[r.dan] = r.trening;
    });
    return red;
  }

  function grupisi(lista) {
    var red = [];
    lista.forEach(function (p) {
      var g = null;
      for (var i = 0; i < red.length; i++) if (red[i].ime === p.kategorija) g = red[i];
      if (!g) { g = { ime: p.kategorija, stavke: [] }; red.push(g); }
      g.stavke.push(p);
    });
    return red;
  }

  /** Tekst izvještaja za Viber/WhatsApp. */
  function tekstIzvjestaja(izv) {
    var L = [];
    L.push('FITNESS CLUB ADIN — smjena');
    L.push(izv.radnik + ', ' + dT(izv.datum) + ' ' + izv.pocetak + '–' + izv.kraj + (izv.trajanje_min !== null && izv.trajanje_min !== undefined ? ' (' + trajanje(izv.trajanje_min) + ')' : ''));
    L.push('Prodano: ' + izv.prodano_kom + ' kom · Promet: ' + km(izv.promet) + ' KM');
    if (izv.kasa_stvarno !== null && izv.kasa_stvarno !== undefined) {
      L.push('Kasa: ' + km(izv.kasa_stvarno) + ' KM' + (izv.kasa_razlika ? ' (razlika ' + (izv.kasa_razlika > 0 ? '+' : '') + km(izv.kasa_razlika) + ' KM)' : ' ✓'));
    }
    var problemi = (izv.stavke || []).filter(function (s) { return s.razlika_kom; });
    var ok = (izv.stavke || []).length - problemi.length;
    if (izv.bez_brojanja) L.push('Inventura: nije prebrojano');
    else L.push('Inventura: ✓ ' + ok + ' se poklapa' + (problemi.length ? ', ⚠ ' + problemi.length + ' s razlikom (' + km(izv.vrijednost_razlike) + ' KM)' : ''));
    problemi.forEach(function (s) {
      L.push('• ' + s.naziv + ': ' + (s.razlika_kom > 0 ? '+' : '') + s.razlika_kom + ' kom (' + km(s.razlika_km) + ' KM) — očekivano ' + s.ocekivano + ', prebrojano ' + s.stvarno);
    });
    if (izv.kasa_razlog) L.push('Razlog: ' + izv.kasa_razlog);
    (izv.usluge || []).forEach(function (u) { L.push(u.naziv + ': ' + u.kom + ' × = ' + km(u.km) + ' KM'); });
    (izv.napomene || []).forEach(function (n) { L.push('Napomena ' + n.vrijeme + ': ' + n.tekst); });
    return L.join('\n');
  }

  return {
    uid: uid, km: km, dT: dT, trajanje: trajanje, danasSarajevo: danasSarajevo,
    stanjeSmjene: stanjeSmjene, provjeraZavrsnog: provjeraZavrsnog, nedostaje: nedostaje,
    dodajURed: dodajURed, ukloniIzReda: ukloniIzReda, sljedeciBatch: sljedeciBatch, pauza: pauza,
    spojiDogadjaje: spojiDogadjaje, dozvoliTap: dozvoliTap,
    dodajMjesece: dodajMjesece, produzenje: produzenje, normaliziraj: normaliziraj, traziClanove: traziClanove,
    grupisi: grupisi, tekstIzvjestaja: tekstIzvjestaja, tip: tip, podijeli: podijeli, paket: paket,
    DANI: DANI, DANI_IME: DANI_IME, danUSedmici: danUSedmici, zaDan: zaDan, termini: termini
  };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Logika;
/* @logika-end */

const { useState, useEffect, useRef, useCallback } = React;
const { km, dT } = Logika;

/* ═══════ VEZA SA SERVEROM ═══════ */
const MREZNA = 'Nema veze sa serverom. Provjeri internet.';
function api(fn, ...args) {
  return new Promise((res, rej) => {
    const g = window.google;
    if (!g || !g.script || !g.script.run) {
      rej({ code: 'NEMA_GOOGLE', message: 'Aplikacija se mora otvoriti preko Google linka.', mreza: true });
      return;
    }
    let gotovo = false;
    const t = setTimeout(() => { if (!gotovo) { gotovo = true; rej({ code: 'TIMEOUT', message: MREZNA, mreza: true }); } }, 30000);
    g.script.run
      .withSuccessHandler(r => {
        if (gotovo) return; gotovo = true; clearTimeout(t);
        if (r && r.ok === false) rej({ code: r.code || 'GRESKA', message: r.message || 'Greška. Pokušaj ponovo.', mreza: false });
        else res(r || {});
      })
      .withFailureHandler(() => {
        if (gotovo) return; gotovo = true; clearTimeout(t);
        rej({ code: 'MREZA', message: MREZNA, mreza: true });
      })[fn](...args);
  });
}

/* ═══════ LOKALNA MEMORIJA (samo cache + red čekanja) ═══════ */
const LS = { RED: 'adin_red_v2', CACHE: 'adin_cache_v2', START: 'adin_start_v2', NACRT: 'adin_nacrt_v2' };
const ls = {
  get(k, pod) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : pod; } catch (e) { return pod; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* */ } }
};

/** useState koji se čuva u localStorage (nacrti brojanja preživljavaju refresh). */
function useNacrt(kljuc, pocetno) {
  const [v, setV] = useState(() => ls.get(LS.NACRT + ':' + kljuc, pocetno));
  const postavi = useCallback(f => {
    setV(staro => { const novo = typeof f === 'function' ? f(staro) : f; ls.set(LS.NACRT + ':' + kljuc, novo); return novo; });
  }, [kljuc]);
  return [v, postavi];
}
function obrisiNacrte() {
  try { Object.keys(localStorage).forEach(k => { if (k.indexOf(LS.NACRT) === 0) localStorage.removeItem(k); }); } catch (e) { /* */ }
}

function vibriraj(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* */ } }

/* ═══════ APLIKACIJA ═══════ */
function App() {
  const [faza, setFaza] = useState('ucitavanje');
  const [podaci, setPodaci] = useState({ proizvodi: [], prijedlog: {}, radnici: ['Kenan', 'Edin'], razlozi: [], clanovi: [] });
  const [smjena, setSmjenaS] = useState(null);
  const [radnik, setRadnik] = useState('');
  const [red, setRed] = useState(() => ls.get(LS.RED, []));
  const [sinh, setSinh] = useState('ok');
  const [greska, setGreska] = useState('');
  const [toast, setToast] = useState(null);
  const [izvjestaj, setIzvjestaj] = useState(null);
  const [radi, setRadi] = useState(false);

  const redRef = useRef(red);
  const smjenaRef = useRef(smjena);
  const saljeRef = useRef(false);
  const pokusajRef = useRef(0);
  const timerRef = useRef(null);
  const toastTimer = useRef(null);

  const setSmjena = useCallback(f => {
    setSmjenaS(s => { const n = typeof f === 'function' ? f(s) : f; smjenaRef.current = n; return n; });
  }, []);
  const spremiRed = useCallback(r => { redRef.current = r; setRed(r); ls.set(LS.RED, r); }, []);

  const pokaziToast = useCallback((tekst, vrsta) => {
    clearTimeout(toastTimer.current);
    setToast({ tekst, vrsta: vrsta || 'info' });
    toastTimer.current = setTimeout(() => setToast(null), vrsta === 'err' ? 6000 : 3500);
  }, []);

  /* ── učitavanje ── */
  const ucitaj = useCallback(async () => {
    try {
      const r = await api('getBootstrap');
      const p = { proizvodi: r.proizvodi, prijedlog: r.prijedlog || {}, radnici: r.radnici || [], treneri: r.treneri || [], razlozi: r.razlozi || [], clanovi: r.clanovi || [], raspored: r.raspored || [] };
      setPodaci(p);
      ls.set(LS.CACHE, p);
      if (r.aktivna) {
        const lokalni = redRef.current.filter(e => e.shift_id === r.aktivna.shift_id);
        setSmjena({ ...r.aktivna, dogadjaji: Logika.spojiDogadjaje(r.aktivna.dogadjaji, lokalni) });
        setFaza('smjena');
      } else {
        setSmjena(null);
        setFaza(f => (f === 'ucitavanje' || f === 'smjena' || f === 'greska') ? 'radnik' : f);
      }
      return true;
    } catch (e) {
      const c = ls.get(LS.CACHE, null);
      if (c && c.proizvodi && c.proizvodi.length) {
        setPodaci(c);
        setFaza(f => (f === 'ucitavanje' ? 'radnik' : f));
        pokaziToast('Nema interneta — prikazujem zadnje sačuvane podatke.', 'err');
      } else {
        setGreska(e.mreza ? 'Nema veze sa serverom. Provjeri internet pa pokušaj ponovo.' : e.message);
        setFaza('greska');
      }
      return false;
    }
  }, [setSmjena, pokaziToast]);

  useEffect(() => { ucitaj(); }, [ucitaj]);

  /* ── slanje reda čekanja ── */
  const obradiOdbijene = useCallback((odbijeni) => {
    if (!odbijeni.length) return;
    const ids = {};
    odbijeni.forEach(o => { ids[o.event_id] = true; });
    setSmjena(s => s ? { ...s, dogadjaji: s.dogadjaji.filter(e => !ids[e.event_id]) } : s);
    const zatvorena = odbijeni.some(o => o.code === 'SMJENA_ZATVORENA' || o.code === 'NEMA_SMJENE');
    if (zatvorena) {
      pokaziToast('Ova smjena je zatvorena na drugom uređaju. ' + odbijeni.length + ' promjena nije upisano.', 'err');
      ucitaj();
    } else {
      pokaziToast('Jedna promjena nije prihvaćena: ' + odbijeni[0].message, 'err');
    }
  }, [setSmjena, pokaziToast, ucitaj]);

  const posalji = useCallback(async () => {
    if (saljeRef.current) return;
    const batch = Logika.sljedeciBatch(redRef.current, 100);
    if (!batch) { setSinh('ok'); return; }
    saljeRef.current = true;
    setSinh('salje');
    let dalje = 0;
    try {
      const ocisceni = batch.events.map(e => {
        const o = { event_id: e.event_id, shift_id: e.shift_id, tip: e.tip, product_id: e.product_id, kolicina: e.kolicina, napomena: e.napomena || '', klijent_ms: e.klijent_ms };
        if (e.clan) o.clan = e.clan;
        return o;
      });
      const rez = await api('pushEvents', batch.shift_id, ocisceni);
      const gotovi = [].concat(rez.primljeno || [], rez.duplikati || [], (rez.odbijeni || []).map(o => o.event_id));
      spremiRed(Logika.ukloniIzReda(redRef.current, gotovi));
      obradiOdbijene(rez.odbijeni || []);
      if (rez.clanovi && rez.clanovi.length) {
        setPodaci(p => {
          const m = {}; p.clanovi.forEach(c => { m[c.member_id] = c; });
          rez.clanovi.forEach(c => { m[c.member_id] = c; });
          const n = { ...p, clanovi: Object.keys(m).map(k => m[k]) };
          ls.set(LS.CACHE, n);
          return n;
        });
      }
      pokusajRef.current = 0;
      setSinh(redRef.current.length ? 'salje' : 'ok');
      if (redRef.current.length) dalje = 50;
    } catch (e) {
      if (!e.mreza && e.code !== 'ZAUZETO') {
        // server je odbio cijeli zahtjev (ne bi se smjelo desiti) — ne gubimo podatke, pokušavamo kasnije
      }
      pokusajRef.current += 1;
      setSinh('greska');
      dalje = Logika.pauza(pokusajRef.current);
    } finally {
      saljeRef.current = false;
    }
    if (dalje) zakazi(dalje);
  }, [spremiRed, obradiOdbijene]); // eslint-disable-line

  const zakazi = useCallback((ms) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { posalji(); }, ms);
  }, [posalji]);

  useEffect(() => {
    const naMrezu = () => { pokusajRef.current = 0; zakazi(0); };
    const vidljivo = () => { if (document.visibilityState === 'visible' && redRef.current.length) zakazi(0); };
    window.addEventListener('online', naMrezu);
    document.addEventListener('visibilitychange', vidljivo);
    const stalno = setInterval(() => { if (redRef.current.length && !saljeRef.current && pokusajRef.current === 0) zakazi(0); }, 15000);
    if (redRef.current.length) zakazi(500);
    return () => { window.removeEventListener('online', naMrezu); document.removeEventListener('visibilitychange', vidljivo); clearInterval(stalno); };
  }, [zakazi]);

  /** Pošalji sve što čeka; vraća true ako je red prazan. */
  const isprazniRed = useCallback(async () => {
    for (let i = 0; i < 8 && redRef.current.length; i++) {
      while (saljeRef.current) await new Promise(r => setTimeout(r, 100));
      clearTimeout(timerRef.current);
      const prije = redRef.current.length;
      await posalji();
      if (redRef.current.length >= prije) break; // nije uspjelo
    }
    return redRef.current.length === 0;
  }, [posalji]);

  /* ── akcije ── */
  const zapocni = async (pocetna) => {
    const st = ls.get(LS.START, null);
    const shift_id = (st && st.radnik === radnik) ? st.shift_id : Logika.uid('S');
    ls.set(LS.START, { shift_id, radnik });
    setRadi(true); setGreska('');
    try {
      const r = await api('startShift', { shift_id, radnik, pocetna });
      ls.del(LS.START);
      obrisiNacrte();
      const lokalni = redRef.current.filter(e => e.shift_id === r.smjena.shift_id);
      setSmjena({ ...r.smjena, dogadjaji: Logika.spojiDogadjaje(r.smjena.dogadjaji, lokalni) });
      setFaza('smjena');
      window.scrollTo(0, 0);
      if (r.postojeca && r.smjena.shift_id !== shift_id) {
        pokaziToast('Smjena je već bila otvorena (' + r.smjena.radnik + ', od ' + r.smjena.vrijeme_pocetka + '). Nastavljaš nju.');
      }
    } catch (e) {
      setGreska(e.mreza ? 'Nema veze sa serverom. Ništa nije izgubljeno — provjeri internet pa klikni ponovo.' : e.message);
    } finally { setRadi(false); }
  };

  const dodaj = useCallback((tip, product_id, kolicina, napomena, clan) => {
    const s = smjenaRef.current;
    if (!s) return null;
    const e = {
      event_id: Logika.uid('E'), shift_id: s.shift_id, tip, product_id,
      kolicina: tip === 'UNDO_SALE' ? -Math.abs(kolicina) : kolicina,
      napomena: napomena || '', klijent_ms: Date.now()
    };
    if (clan) e.clan = clan;
    // prvo lokalno (red + ekran), pa slanje u pozadini
    spremiRed(Logika.dodajURed(redRef.current, e));
    setSmjena(x => x ? { ...x, dogadjaji: x.dogadjaji.concat([e]) } : x);
    zakazi(400);
    return e;
  }, [spremiRed, setSmjena, zakazi]);

  const zavrsi = async (brojanje, kasa, razlog) => {
    setRadi(true); setGreska('');
    try {
      const prazno = await isprazniRed();
      if (!prazno) {
        setGreska('Još ' + redRef.current.length + ' promjena nije poslano na server. Provjeri internet pa klikni ponovo. Ništa nije izgubljeno.');
        return;
      }
      const s = smjenaRef.current;
      const r = await api('closeShift', s.shift_id, brojanje, kasa, razlog || '');
      obrisiNacrte();
      setIzvjestaj(r.izvjestaj);
      setSmjena(null);
      setFaza('izvjestaj');
      window.scrollTo(0, 0);
      api('getBootstrap').then(b => setPodaci(p => ({ ...p, prijedlog: b.prijedlog || {}, proizvodi: b.proizvodi || p.proizvodi }))).catch(() => {});
    } catch (e) {
      setGreska(e.mreza ? 'Nema veze sa serverom. Ništa nije izgubljeno — provjeri internet pa klikni ponovo.' : e.message);
    } finally { setRadi(false); }
  };

  /** Radnik je dodao novi proizvod: osvježi listu; ako je smjena u toku i roba se broji, uđe u njenu inventuru. */
  const noviProizvod = useCallback((r, kol) => {
    setPodaci(p => { const n = { ...p, proizvodi: r.proizvodi || p.proizvodi }; ls.set(LS.CACHE, n); return n; });
    if (r.u_smjenu && r.proizvod) {
      setSmjena(s => s ? { ...s, pocetna: { ...s.pocetna, [r.proizvod.product_id]: 0 } } : s);
      if (kol > 0) dodaj('RESTOCK', r.proizvod.product_id, kol, 'Novi proizvod');
    }
    pokaziToast('✓ Dodano: ' + r.proizvod.naziv + (kol > 0 ? ' (+' + kol + ' kom)' : '') + '. Vlasnik će ga vidjeti označenog kao novo.', 'ok');
  }, [setSmjena, dodaj, pokaziToast]);

  /* ── render ── */
  const zaglavlje = (
    <div className="head">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Amblem v={34} />
        <div>
        <div className="logo">FITNESS CLUB <span className="zl">ADIN</span></div>
        <div className="logoSub">{faza === 'admin' ? 'VLASNIČKI PREGLED' : 'RECEPCIJA · ŠANK'}</div>
        </div>
      </div>
      <Sync stanje={sinh} broj={red.length} />
    </div>
  );
  const toastEl = toast && <div className="toast" style={{ borderColor: toast.vrsta === 'err' ? 'var(--red)' : toast.vrsta === 'ok' ? 'var(--green)' : 'var(--line)' }}
>{toast.tekst}</div>;

  if (faza === 'ucitavanje') return (
    <div className="splash"><Amblem v={96} /><div className="logo" style={{ fontSize: 15, marginTop: 18 }}>FITNESS CLUB <span className="zl">ADIN</span></div><div className="logoSub" style={{ marginTop: 8 }}>UČITAVAM…</div></div>
  );
  if (faza === 'greska') return <>{zaglavlje}<div className="wrap"><div className="err">{greska}</div>
    <button className="btn" onClick={() => location.reload()}>Pokušaj ponovo</button></div></>;

  return (
    <>
      {zaglavlje}
      {toastEl}
      {faza === 'radnik' && <Radnik radnici={podaci.radnici} izabran={radnik} raspored={podaci.raspored || []}
        onDalje={ime => { setRadnik(ime); setGreska(''); setFaza('pocetna'); window.scrollTo(0, 0); }}
        onAdmin={() => setFaza('admin')} />}

      {faza === 'pocetna' && <Pocetna proizvodi={podaci.proizvodi} prijedlog={podaci.prijedlog} radnik={radnik} onNovi={noviProizvod}
        greska={greska} radi={radi} nazad={() => { setGreska(''); setFaza('radnik'); }} onStart={zapocni} />}

      {faza === 'smjena' && smjena && <Smjena smjena={smjena} raspored={podaci.raspored || []} proizvodi={podaci.proizvodi} clanovi={podaci.clanovi} treneri={podaci.treneri || []} onNovi={noviProizvod}
        dodaj={dodaj} pokaziToast={pokaziToast} setClanovi={c => setPodaci(p => ({ ...p, clanovi: c }))}
        onZavrsi={() => { setGreska(''); setFaza('zavrsna'); window.scrollTo(0, 0); }} />}

      {faza === 'zavrsna' && smjena && <Zavrsna smjena={smjena} proizvodi={podaci.proizvodi} razlozi={podaci.razlozi}
        greska={greska} radi={radi} cekaju={red.length}
        nazad={() => { setGreska(''); setFaza('smjena'); }} onGotovo={zavrsi} />}

      {faza === 'izvjestaj' && izvjestaj && <Izvjestaj izv={izvjestaj} pokaziToast={pokaziToast}
        onNovo={() => { setIzvjestaj(null); setRadnik(''); setFaza('radnik'); window.scrollTo(0, 0); }} />}

      {faza === 'admin' && <Admin nazad={() => { ucitaj(); setFaza(smjenaRef.current ? 'smjena' : 'radnik'); }} pokaziToast={pokaziToast} />}
    </>
  );
}

/* ═══════ BREND: AMBLEM KLUBA ═══════ */
function Amblem({ v }) {
  const n = v || 34;
  return (
    <svg width={n} height={n} viewBox="0 0 64 64" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}>
      <defs>
        <linearGradient id="adinZlato" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F7D58B" /><stop offset=".5" stopColor="#E8A33D" /><stop offset="1" stopColor="#B8741F" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="#141417" stroke="url(#adinZlato)" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="25.5" fill="none" stroke="url(#adinZlato)" strokeOpacity=".35" strokeWidth="1" />
      <path d="M21 46 L32 16 L43 46" fill="none" stroke="url(#adinZlato)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="13" y="33" width="38" height="3.2" rx="1.6" fill="url(#adinZlato)" />
      <rect x="10" y="28.5" width="4.5" height="12.2" rx="1.6" fill="url(#adinZlato)" />
      <rect x="49.5" y="28.5" width="4.5" height="12.2" rx="1.6" fill="url(#adinZlato)" />
    </svg>
  );
}

/* ═══════ DANAS NA TRENINGU (podsjetnik na vrhu) ═══════ */
function DanasTrening({ raspored }) {
  const [sutra, setSutra] = useState(false);
  const danas = Logika.danasSarajevo();
  const sutraDatum = Logika.danasSarajevo(new Date(Date.now() + 86400000));
  const dan = Logika.danUSedmici(sutra ? sutraDatum : danas);
  const lista = Logika.zaDan(raspored, dan);
  return (
    <div className="card trening" data-testid="danas-trening">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div className="lab" style={{ marginBottom: 0, color: 'var(--gold)' }}>🏋️ {sutra ? 'SUTRA' : 'DANAS'} NA TRENINGU · {Logika.DANI_IME[dan].toUpperCase()}</div>
        <button className="linkbtn" style={{ padding: '4px 0' }} onClick={() => setSutra(!sutra)}>{sutra ? '← danas' : 'sutra →'}</button>
      </div>
      {!lista.length && <div className="sit">Nema zakazanih treninga.</div>}
      {lista.map((t, i) => (
        <div key={t.termin_id + i} className="termin">
          <div className="vr">{t.vrijeme}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{t.osobe}</div>
            <div style={{ fontSize: 14, color: t.trening ? 'var(--text)' : 'var(--dim)' }}>{t.trening || 'plan nije upisan'}</div>
            {(t.trener || t.napomena) && <div className="sit">{t.trener ? 'trener ' + t.trener : ''}{t.trener && t.napomena ? ' · ' : ''}{t.napomena}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════ SYNC INDIKATOR ═══════ */
function Sync({ stanje, broj }) {
  if (broj === 0 && stanje !== 'greska') {
    return <div className="sync" data-testid="sync"><span className="dot" style={{ background: 'var(--green)' }} />✓ Sve spremljeno</div>;
  }
  const boja = stanje === 'greska' ? 'var(--red)' : 'var(--gold)';
  const tekst = broj === 1 ? '1 čeka' : broj + ' čekaju';
  return (
    <div className="sync" data-testid="sync">
      <span className="dot" style={{ background: boja }} />
      <span>⟳ {tekst} sinhronizaciju{stanje === 'greska' ? <><br /><span style={{ color: 'var(--red)' }}>nema veze, pokušavam ponovo</span></> : null}</span>
    </div>
  );
}

/* ═══════ 1. KO JE NA SMJENI ═══════ */
function Radnik({ radnici, izabran, onDalje, onAdmin, raspored }) {
  const lista = radnici && radnici.length ? radnici : ['Kenan', 'Edin'];
  const [izbor, setIzbor] = useState(izabran && lista.indexOf(izabran) < 0 ? 'Drugi' : (izabran || null));
  const [drugi, setDrugi] = useState(izabran && lista.indexOf(izabran) < 0 ? izabran : '');
  const ime = izbor === 'Drugi' ? drugi.trim() : izbor;

  return (
    <div className="wrap">
      <div className="hero">
        <Amblem v={72} />
        <div>
          <div className="lab" style={{ marginBottom: 4 }}>STIJENA · CAZIN</div>
          <div className="h1">Ko je na smjeni?</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {lista.concat(['Drugi']).map(r => (
          <button key={r} className={'pick' + (izbor === r ? ' on' : '')} onClick={() => setIzbor(r)}>{r}</button>
        ))}
      </div>
      {izbor === 'Drugi' && (
        <input className="inp" value={drugi} autoFocus maxLength={60}
          onChange={e => setDrugi(e.target.value)} placeholder="Upiši ime" />
      )}
      <button className="btn" disabled={!ime} onClick={() => onDalje(ime)}>Dalje — prebroji robu</button>
      <DanasTrening raspored={raspored} />
      <div style={{ textAlign: 'center', marginTop: 30 }}>
        <button className="linkbtn" onClick={onAdmin}>Vlasnik ›</button>
      </div>
      <div className="sit" style={{ textAlign: 'center', opacity: .5 }}>verzija __VERZIJA__</div>
    </div>
  );
}

/* ═══════ BROJAČ (−  18  +) ═══════ */
function Brojac({ pid, naziv, pod, v, set }) {
  const n = v === '' || v === undefined ? null : Number(v);
  const prazno = v === '' || v === undefined;
  return (
    <div className={'row' + (prazno ? ' prazno' : '')}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 15.5, fontWeight: 500 }}>{naziv}</div>
        {pod !== undefined && pod !== null && <div className="sit">prošli put: {pod}</div>}
      </div>
      <div className="cnt">
        <button className="cbtn" aria-label={'manje ' + naziv} onClick={() => set(String(Math.max(0, (n || 0) - 1)))}>−</button>
        <input className={'cin' + (prazno ? ' prazno' : '')} data-pid={pid} inputMode="numeric" pattern="[0-9]*"
          value={v === undefined ? '' : v} placeholder="—" maxLength={4}
          onFocus={e => e.target.select()}
          onChange={e => set(e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, ''))} />
        <button className="cbtn" aria-label={'više ' + naziv} onClick={() => set(String((n || 0) + 1))}>+</button>
      </div>
    </div>
  );
}

/* ═══════ 2. POČETNA INVENTURA ═══════ */
function Pocetna({ proizvodi, prijedlog, radnik, greska, radi, nazad, onStart, onNovi }) {
  const roba = proizvodi.filter(p => p.prati_zalihu);
  const [novi, setNovi] = useState(false);
  const [v, setV] = useNacrt('pocetno', {});
  const fali = Logika.nedostaje(roba, v);
  const post = (id, nov) => setV(s => ({ ...s, [id]: nov }));

  return (
    <div className="wrap" style={{ paddingBottom: 32 }}>
      <div className="h1">Prebroji početno stanje</div>
      <div className="info">
        <b style={{ color: 'var(--text)' }}>{radnik}</b> · Prebroji svaki proizvod u frižideru i na polici. Upiši i <b style={{ color: 'var(--text)' }}>0</b> ako nečega nema.
        „Prošli put" je samo podsjetnik — broji stvarno stanje.
      </div>
      {Logika.grupisi(roba).map(g => (
        <div key={g.ime}>
          <div className="grp">{g.ime.toUpperCase()}</div>
          <div className="card0">
            {g.stavke.map(p => (
              <Brojac key={p.product_id} pid={p.product_id} naziv={p.naziv} pod={prijedlog[p.product_id]}
                v={v[p.product_id]} set={n => post(p.product_id, n)} />
            ))}
          </div>
        </div>
      ))}
      <button className="btn2 novo" onClick={() => setNovi(true)}>＋ Ima nešto čega nema na listi? Dodaj novo piće</button>
      {novi && <NoviProizvod proizvodi={proizvodi} radnik={radnik} zatvori={() => setNovi(false)}
        gotovo={(r, kol) => { setNovi(false); onNovi(r, kol); }} />}
      {greska && <div className="err">{greska}</div>}
      <button className="btn" disabled={fali.length > 0 || radi} onClick={() => {
        const o = {}; roba.forEach(p => { o[p.product_id] = Number(v[p.product_id]); }); onStart(o);
      }}>
        {radi ? 'Počinjem…' : fali.length > 0 ? 'Još ' + fali.length + ' za prebrojati' : 'ZAPOČNI SMJENU'}
      </button>
      <button className="btn2" onClick={nazad}>Nazad</button>
    </div>
  );
}

/* ═══════ 3. AKTIVNA SMJENA ═══════ */
function Smjena({ smjena, raspored, proizvodi, clanovi, treneri, dodaj, pokaziToast, setClanovi, onZavrsi, onNovi }) {
  const [zadnji, setZadnji] = useState(null);  // {p, n}
  const [sheet, setSheet] = useState(null);    // dopuna | ispravka | clan | zavrsi
  const [hit, setHit] = useState(null);
  const [sada, setSada] = useState(Date.now());
  const tapovi = useRef({});
  const hitTimer = useRef(null);

  useEffect(() => { const t = setInterval(() => setSada(Date.now()), 30000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (!zadnji) return;
    const t = setTimeout(() => setZadnji(null), 7000);
    return () => clearTimeout(t);
  }, [zadnji]);

  const st = Logika.stanjeSmjene(smjena, proizvodi);
  const dio = Logika.podijeli(proizvodi);
  const obicni = dio.dnevne.concat(dio.roba, dio.usluge);
  const clanarine = dio.clanarine;
  const paketi = dio.clanarine.concat(dio.treneri);
  const brojClanarina = dio.clanarine.reduce((a, p) => a + st.prodano(p.product_id), 0);
  const brojTrenera = dio.treneri.reduce((a, p) => a + st.prodano(p.product_id), 0);

  const prodaj = (p) => {
    if (!Logika.dozvoliTap(tapovi.current, p.product_id, Date.now(), 150)) return;
    dodaj('SALE', p.product_id, 1);
    setZadnji(z => (z && z.p.product_id === p.product_id) ? { p, n: z.n + 1, k: Date.now() } : { p, n: 1, k: Date.now() });
    setHit(p.product_id);
    clearTimeout(hitTimer.current);
    hitTimer.current = setTimeout(() => setHit(null), 140);
    vibriraj(12);
  };

  const ponisti = () => {
    if (!zadnji) return;
    // zaštita: brzi drugi tap na pločicu ne smije "pogoditi" PONIŠTI koje se upravo pojavilo
    if (Date.now() - zadnji.k < 500) return;
    dodaj('UNDO_SALE', zadnji.p.product_id, 1, 'Poništeno na šanku');
    vibriraj([8, 40, 8]);
    setZadnji(z => (z && z.n > 1) ? { ...z, n: z.n - 1, k: Date.now() } : null);
  };

  const trajanjeTekst = (() => {
    const m = String(smjena.pocetak_ts || '').match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
    let min;
    if (m) {
      const sad = new Date(sada);
      const sar = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Sarajevo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(sad);
      const d = {}; sar.forEach(x => { d[x.type] = x.value; });
      min = (Date.UTC(+d.year, +d.month - 1, +d.day, +d.hour, +d.minute) - Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])) / 60000;
    } else {
      const [h, mi] = String(smjena.vrijeme_pocetka || '0:0').split(':').map(Number);
      const d = new Date(sada);
      min = (d.getHours() * 60 + d.getMinutes()) - (h * 60 + mi);
      if (min < 0) min += 1440;
    }
    min = Math.max(0, Math.round(min));
    return Math.floor(min / 60) + 'h ' + String(min % 60).padStart(2, '0') + 'm';
  })();

  const grupe = Logika.grupisi(dio.roba);
  if (dio.usluge.length) grupe.push({ ime: 'Usluge', stavke: dio.usluge });

  return (
    <>
      <div className="wrap" style={{ paddingBottom: 170 }}>
        <div className="card" style={{ padding: '12px 15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="lab" style={{ marginBottom: 4 }}>SMJENA U TOKU</div>
              <div style={{ fontSize: 17, fontWeight: 600 }} data-testid="radnik">{smjena.radnik}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="sit">od {smjena.vrijeme_pocetka}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--gold)' }}>{trajanjeTekst}</div>
            </div>
          </div>
        </div>

        {Logika.zaDan(raspored, Logika.danUSedmici(Logika.danasSarajevo())).length > 0 && <DanasTrening raspored={raspored} />}

        {(dio.dnevne.length > 0 || paketi.length > 0) && (
          <div>
            <div className="grp">KARTE I ČLANARINE</div>
            <div className="grid">
              {dio.dnevne.map(p => {
                const kom = st.prodano(p.product_id);
                return (
                  <button key={p.product_id} data-tile={p.product_id} className={'tile karta' + (hit === p.product_id ? ' hit' : '')} onClick={() => prodaj(p)}>
                    {kom > 0 && <span className="badge">{kom}</span>}
                    <span className="ik">🎫</span>
                    <span className="nm">{p.naziv}</span>
                    <span className="bot"><span className="pr">{km(p.cijena)} KM</span><span className="st">1 tap</span></span>
                  </button>
                );
              })}
              {paketi.length > 0 && (
                <button className="tile karta zlatna" data-tile="clanarina" onClick={() => setSheet('clan')}>
                  {brojClanarina + brojTrenera > 0 && <span className="badge">{brojClanarina + brojTrenera}</span>}
                  <span className="ik">🏋️</span>
                  <span className="nm">Mjesečna karta{dio.treneri.length ? ' / trener' : ''}</span>
                  <span className="bot"><span className="pr">{clanarine.map(p => km(p.cijena).replace(',00', '')).join(' · ')}{dio.treneri.length ? ' + ' + dio.treneri.map(p => km(p.cijena).replace(',00', '')).join(' · ') : ''} KM</span></span>
                </button>
              )}
            </div>
          </div>
        )}

        {grupe.map(g => (
          <div key={g.ime}>
            <div className="grp">{g.ime.toUpperCase()}</div>
            <div className="grid">
              {g.stavke.map(p => {
                const kom = st.prodano(p.product_id);
                const ost = p.prati_zalihu && st.ocekivano.hasOwnProperty(p.product_id) ? st.ocekivano[p.product_id] : null;
                const nisko = ost !== null && ost <= Math.max(2, p.minimum || 0);
                return (
                  <button key={p.product_id} data-tile={p.product_id}
                    className={'tile' + (hit === p.product_id ? ' hit' : '')} onClick={() => prodaj(p)}>
                    {kom > 0 && <span className="badge">{kom}</span>}
                    <span className="nm">{p.naziv}</span>
                    <span className="bot">
                      <span className="pr">{km(p.cijena)} KM</span>
                      {ost !== null && <span className={'st' + (nisko ? ' low' : '')}>ima {ost}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button className="btn2" style={{ flex: 2 }} onClick={() => setSheet('dopuna')}>+ DOPUNA ZALIHE</button>
          <button className="btn2" style={{ flex: 1 }} onClick={() => setSheet('ispravka')}>Ispravka</button>
        </div>
        <button className="btn2 novo" onClick={() => setSheet('novi')}>＋ Novo piće / proizvod (nema na listi)</button>
        <button className="btn2" onClick={() => setSheet('napomena')}>✎ Napomena za vlasnika</button>
      </div>

      {zadnji && (
        <div className="undo" data-testid="undo">
          <span>✓ {zadnji.p.naziv} +1{zadnji.n > 1 ? ' (×' + zadnji.n + ')' : ''}</span>
          <button onClick={ponisti}>PONIŠTI</button>
        </div>
      )}

      <div className="dock">
        <div>
          <div style={{ fontSize: 9.5, letterSpacing: 1.6, color: 'var(--dim)' }}>{st.kom} KOM · U KASI TREBA BITI</div>
          <div className="n" data-testid="promet">{km(st.promet)}<span className="u">KM</span></div>
        </div>
        <button onClick={() => setSheet('zavrsi')}>ZAVRŠI SMJENU</button>
      </div>

      {sheet === 'novi' && <NoviProizvod proizvodi={proizvodi} radnik={smjena.radnik} shiftId={smjena.shift_id}
        zatvori={() => setSheet(null)} gotovo={(r, kol) => { setSheet(null); onNovi(r, kol); }} />}

      {sheet === 'dopuna' && <Dopuna proizvodi={proizvodi.filter(p => p.prati_zalihu && smjena.pocetna.hasOwnProperty(p.product_id))}
        noviProizvod={() => setSheet('novi')}
        zatvori={() => setSheet(null)}
        potvrdi={(p, kol) => { dodaj('RESTOCK', p.product_id, kol); setSheet(null); pokaziToast('✓ Dopuna: ' + p.naziv + ' +' + kol, 'ok'); }} />}

      {sheet === 'napomena' && <Napomena zatvori={() => setSheet(null)}
        posalji={t => { dodaj('NAPOMENA', '', 0, t); setSheet(null); pokaziToast('✓ Napomena zapisana. Vlasnik je vidi u izvještaju.', 'ok'); }} />}

      {sheet === 'ispravka' && <Ispravka proizvodi={obicni} st={st} zatvori={() => setSheet(null)}
        ponisti={p => { dodaj('UNDO_SALE', p.product_id, 1, 'Ispravka'); vibriraj(10); }} />}

      {sheet === 'clan' && <Clanarina clanarine={dio.clanarine} trenerProizvodi={dio.treneri} treneri={treneri} clanovi={clanovi} zatvori={() => setSheet(null)}
        potvrdi={(clan, pk, trenerIme) => {
          const payload = { member_id: clan.member_id, ime: clan.ime, telefon: clan.telefon || '' };
          const azuriran = { ...clan };
          pk.stavke.forEach(st0 => {
            if (Logika.tip(st0.p) === 'trener') {
              dodaj('SALE', st0.p.product_id, 1, '', { ...payload, trener: trenerIme });
              azuriran.trener = trenerIme; azuriran.trener_do = st0.do;
            } else {
              dodaj('SALE', st0.p.product_id, 1, '', payload);
              azuriran.vrsta = st0.p.product_id; azuriran.istek = st0.do;
            }
          });
          delete azuriran.novi;
          setClanovi(clanovi.filter(c => c.member_id !== clan.member_id).concat([azuriran]));
          setSheet(null);
          pokaziToast('✓ ' + clan.ime + ': naplaćeno ' + km(pk.ukupno) + ' KM' + (azuriran.istek ? ', karta do ' + dT(azuriran.istek) : ''), 'ok');
          vibriraj(15);
        }} />}

      {sheet === 'zavrsi' && (
        <Sheet naslov="Završiti smjenu?" zatvori={() => setSheet(null)}>
          <div className="info">Ideš na završno brojanje robe i kase. Prodaja se poslije toga više ne kuca.</div>
          <button className="btn" onClick={() => { setSheet(null); onZavrsi(); }}>Da, idem brojati</button>
          <button className="btn2" style={{ marginTop: 10 }} onClick={() => setSheet(null)}>Ne, nastavljam prodaju</button>
        </Sheet>
      )}
    </>
  );
}

/** Radnik dodaje novi proizvod (samo novi — postojeće cijene mijenja vlasnik). */
function NoviProizvod({ proizvodi, radnik, shiftId, zatvori, gotovo }) {
  const [naziv, setNaziv] = useState('');
  const [tip, setTip] = useState('roba');
  const kategorije = [];
  proizvodi.filter(p => Logika.tip(p) === 'roba').forEach(p => { if (kategorije.indexOf(p.kategorija) < 0) kategorije.push(p.kategorija); });
  const [kat, setKat] = useState(kategorije[0] || 'Ostalo');
  const [novaKat, setNovaKat] = useState(false);
  const [cijena, setCijena] = useState('');
  const [kol, setKol] = useState('');
  const [radi, setRadi] = useState(false);
  const [gr, setGr] = useState('');
  const c = Number(String(cijena).replace(',', '.'));
  const k = Number(kol) || 0;
  const posalji = async () => {
    setRadi(true); setGr('');
    try {
      const r = await api('addProductRadnik', { naziv: naziv.trim(), kategorija: tip === 'usluga' ? 'Usluge' : kat, cijena: c, tip, radnik, shift_id: shiftId || '' });
      gotovo(r, tip === 'roba' && shiftId ? k : 0);
    } catch (e) { setGr(e.mreza ? 'Za dodavanje novog proizvoda treba internet. Pokušaj ponovo.' : e.message); }
    finally { setRadi(false); }
  };
  return (
    <Sheet naslov="Novi proizvod" zatvori={zatvori}>
      <div className="lab">ŠTA JE?</div>
      <div className="two">
        <button className={'chip' + (tip === 'roba' ? ' on' : '')} style={{ flex: 1 }} onClick={() => setTip('roba')}>🥤 Piće / roba<div className="sit">broji se</div></button>
        <button className={'chip' + (tip === 'usluga' ? ' on' : '')} style={{ flex: 1 }} onClick={() => setTip('usluga')}>🧾 Usluga<div className="sit">ne broji se</div></button>
      </div>
      <div className="lab" style={{ marginTop: 14 }}>NAZIV</div>
      <input className="inp" data-testid="novi-naziv" autoFocus maxLength={60} value={naziv} onChange={e => setNaziv(e.target.value)} placeholder={tip === 'roba' ? 'npr. Monster Mango' : 'npr. Ormarić najam'} />
      {tip === 'roba' && <>
        <div className="lab" style={{ marginTop: 14 }}>GDJE SPADA</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {kategorije.map(x => <button key={x} className={'chip' + (!novaKat && kat === x ? ' on' : '')} onClick={() => { setNovaKat(false); setKat(x); }}>{x}</button>)}
          <button className={'chip' + (novaKat ? ' on' : '')} onClick={() => { setNovaKat(true); setKat(''); }}>+ drugo</button>
        </div>
        {novaKat && <input className="inp" style={{ marginTop: 8 }} placeholder="npr. Grickalice" value={kat} onChange={e => setKat(e.target.value)} />}
      </>}
      <div className="lab" style={{ marginTop: 14 }}>CIJENA ZA KUPCA (KM)</div>
      <input className="inp" data-testid="novi-cijena" inputMode="decimal" value={cijena} placeholder="0,00" onChange={e => setCijena(e.target.value.replace(/[^\d.,]/g, '').slice(0, 7))} />
      {tip === 'roba' && shiftId && <>
        <div className="lab" style={{ marginTop: 14 }}>KOLIKO KOMADA STAVLJAŠ SADA?</div>
        <input className="inp" data-testid="novi-kol" inputMode="numeric" value={kol} placeholder="0" onChange={e => setKol(e.target.value.replace(/\D/g, '').slice(0, 4))} />
      </>}
      <div className="sit" style={{ marginTop: 10 }}>Vlasnik dobija obavještenje i provjerava cijenu. Postojeće proizvode i cijene ovdje ne možeš mijenjati.</div>
      {gr && <div className="err" style={{ marginTop: 10 }}>{gr}</div>}
      <button className="btn" style={{ marginTop: 12 }} disabled={radi || naziv.trim().length < 2 || !(c > 0) || (tip === 'roba' && !String(kat).trim())} onClick={posalji}>
        {radi ? 'Dodajem…' : 'Dodaj' + (tip === 'roba' && shiftId && k > 0 ? ' (' + k + ' kom)' : '')}
      </button>
    </Sheet>
  );
}

function Dopuna({ proizvodi, zatvori, potvrdi, noviProizvod }) {
  const [p, setP] = useState(null);
  const [kol, setKol] = useState('');
  const n = Number(kol) || 0;
  return (
    <Sheet naslov={p ? 'Dopuna — ' + p.naziv : 'Šta si dopunio?'} zatvori={zatvori}>
      {!p ? (
        <div className="card0">
          {proizvodi.map(x => (
            <button key={x.product_id} className="listbtn" data-dopuna={x.product_id} onClick={() => { setP(x); setKol(''); }}>
              <span>{x.naziv}</span><span className="sit">›</span>
            </button>
          ))}
          <button className="listbtn" style={{ color: 'var(--gold)' }} onClick={noviProizvod}>
            <span>＋ Novo piće koje nije na listi</span><span className="sit">›</span>
          </button>
        </div>
      ) : (
        <>
          <div className="sit" style={{ textAlign: 'center' }}>Koliko komada si stavio?</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, margin: '10px 0 14px' }}>
            <button className="cbtn" style={{ width: 60, height: 60, borderRadius: '50%' }} onClick={() => setKol(String(Math.max(1, n - 1)))}>−</button>
            <input className="cin" data-testid="dopuna-kol" inputMode="numeric" pattern="[0-9]*" value={kol} placeholder="0"
              style={{ width: 110, height: 64, fontSize: 34, color: 'var(--gold)' }} autoFocus
              onChange={e => setKol(e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 4))} />
            <button className="cbtn" style={{ width: 60, height: 60, borderRadius: '50%' }} onClick={() => setKol(String(n + 1))}>+</button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[6, 12, 24].map(x => (
              <button key={x} className={'chip' + (n === x ? ' on' : '')} style={{ flex: 1 }} onClick={() => setKol(String(x))}>{x}</button>
            ))}
          </div>
          <button className="btn" style={{ marginTop: 14 }} disabled={n < 1} onClick={() => potvrdi(p, n)}>
            {n < 1 ? 'Upiši količinu' : 'Dodaj ' + n + ' kom'}
          </button>
          <button className="btn2" style={{ marginTop: 10 }} onClick={() => setP(null)}>Nazad na listu</button>
        </>
      )}
    </Sheet>
  );
}

function Napomena({ zatvori, posalji }) {
  const [t, setT] = useState('');
  return (
    <Sheet naslov="Napomena za vlasnika" zatvori={zatvori}>
      <textarea className="inp" data-testid="napomena" autoFocus maxLength={500} value={t} onChange={e => setT(e.target.value)}
        placeholder="npr. Frižider ne hladi, nestalo čaša, član X dolazi sutra platiti…" style={{ minHeight: 120, resize: 'vertical' }} />
      <button className="btn" style={{ marginTop: 12 }} disabled={!t.trim()} onClick={() => posalji(t.trim())}>Zapiši napomenu</button>
    </Sheet>
  );
}

function Ispravka({ proizvodi, st, zatvori, ponisti }) {
  const prodani = proizvodi.filter(p => st.prodano(p.product_id) > 0);
  return (
    <Sheet naslov="Ispravka prodaje" zatvori={zatvori}>
      <div className="info" style={{ marginBottom: 12 }}>Ako si pogrešno kucao, skini višak ovdje (−1 po kliku). Ništa se ne briše — ispravka se bilježi.</div>
      {!prodani.length && <div className="info">Još ništa nije prodano.</div>}
      {prodani.length > 0 && (
        <div className="card0">
          {prodani.map(p => (
            <div className="row" key={p.product_id}>
              <div><div style={{ fontSize: 15.5 }}>{p.naziv}</div><div className="sit">prodano {st.prodano(p.product_id)}</div></div>
              <button className="chip" style={{ minWidth: 72, color: 'var(--red)', borderColor: 'rgba(229,84,75,.5)' }} onClick={() => ponisti(p)}>−1</button>
            </div>
          ))}
        </div>
      )}
      <button className="btn2" style={{ marginTop: 12 }} onClick={zatvori}>Gotovo</button>
    </Sheet>
  );
}

/* ═══════ ČLANARINA / PAKET (3 koraka: član → karta + trener → naplati) ═══════ */
function Clanarina({ clanarine, trenerProizvodi, treneri, clanovi, zatvori, potvrdi }) {
  const [korak, setKorak] = useState('clan');  // clan | novi | paket
  const [upit, setUpit] = useState('');
  const [clan, setClan] = useState(null);
  const [ime, setIme] = useState('');
  const [tel, setTel] = useState('');
  const [karta, setKarta] = useState(null);
  const [trener, setTrener] = useState(null);
  const [trenerIme, setTrenerIme] = useState('');
  const danas = Logika.danasSarajevo();
  const lista = Logika.traziClanove(clanovi, upit).slice(0, 40);
  const pk = Logika.paket(karta, trener, trenerIme, clan, danas);
  const listaTrenera = treneri && treneri.length ? treneri : ['Kenan', 'Edin'];

  const izaberi = c => {
    setClan(c); setTrener(null); setTrenerIme(c.trener || '');
    setKarta(clanarine.find(p => p.product_id === c.vrsta) || (clanarine.length === 1 ? clanarine[0] : null));
    setKorak('paket');
  };
  const naslov = korak === 'clan' ? 'Mjesečna karta — ko plaća?' : korak === 'novi' ? 'Novi član' : (clan && clan.ime);
  const stanjeClana = c => {
    if (!c.istek) return { t: 'nema karte', b: 'var(--dim)' };
    const dana = Math.round((Date.parse(c.istek) - Date.parse(danas)) / 86400000);
    return dana < 0 ? { t: 'istekla ' + dT(c.istek), b: 'var(--red)' } : { t: 'do ' + dT(c.istek), b: dana <= 5 ? 'var(--gold)' : 'var(--green)' };
  };

  return (
    <Sheet naslov={naslov} zatvori={zatvori}>
      {korak === 'clan' && (
        <>
          <input className="inp" placeholder="Traži po imenu ili telefonu…" value={upit} onChange={e => setUpit(e.target.value)} />
          <button className="btn" style={{ marginTop: 10 }} onClick={() => { setIme(upit.trim()); setKorak('novi'); }}>+ Novi član</button>
          <div className="card0" style={{ marginTop: 12 }}>
            {!lista.length && <div className="info" style={{ border: 'none' }}>{upit ? 'Nema takvog člana. Klikni „Novi član".' : 'Još nema upisanih članova.'}</div>}
            {lista.map(c => {
              const sc = stanjeClana(c);
              return (
                <button key={c.member_id} className="listbtn" onClick={() => izaberi(c)}>
                  <span>{c.ime}<div className="sit">{c.telefon}{c.trener_do && c.trener_do >= danas ? ' · 🏋️ ' + c.trener : ''}</div></span>
                  <span className="sit" style={{ color: sc.b, textAlign: 'right' }}>{sc.t}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
      {korak === 'novi' && (
        <>
          <div className="lab">IME I PREZIME</div>
          <input className="inp" value={ime} autoFocus maxLength={80} onChange={e => setIme(e.target.value)} placeholder="npr. Amel Hodžić" />
          <div className="lab" style={{ marginTop: 14 }}>TELEFON</div>
          <input className="inp" value={tel} inputMode="tel" maxLength={40} onChange={e => setTel(e.target.value)} placeholder="06x xxx xxx" />
          <button className="btn" style={{ marginTop: 14 }} disabled={ime.trim().length < 2}
            onClick={() => izaberi({ member_id: Logika.uid('M'), ime: ime.trim(), telefon: tel.trim(), istek: '', trener: '', trener_do: '', novi: true })}>Dalje</button>
          <button className="btn2" style={{ marginTop: 10 }} onClick={() => setKorak('clan')}>Nazad</button>
        </>
      )}
      {korak === 'paket' && clan && (
        <>
          <div className="sit" style={{ marginBottom: 12 }}>
            {clan.novi ? 'Novi član' : 'Karta: ' + stanjeClana(clan).t}{clan.trener_do ? ' · trener ' + clan.trener + ' do ' + dT(clan.trener_do) : ''}
          </div>
          {clanarine.length > 0 && <>
            <div className="lab">KARTA</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {clanarine.map(p => {
                const on = karta && karta.product_id === p.product_id;
                return (
                  <button key={p.product_id} data-karta={p.product_id} className={'pick' + (on ? ' on' : '')}
                    style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 60 }}
                    onClick={() => setKarta(on ? null : p)}>
                    <span style={{ fontSize: 16 }}>{on ? '✓ ' : ''}{p.naziv}<div className="sit">važiće do {dT(Logika.produzenje(clan.istek, danas, p.clanarina_mjeseci).istek)}</div></span>
                    <span style={{ color: 'var(--gold)', fontSize: 17 }}>{km(p.cijena)}</span>
                  </button>
                );
              })}
            </div>
          </>}
          {trenerProizvodi.length > 0 && <>
            <div className="lab" style={{ marginTop: 16 }}>LIČNI TRENER (DODATNO)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {trenerProizvodi.map(p => {
                const on = trener && trener.product_id === p.product_id;
                return (
                  <button key={p.product_id} data-trener-paket={p.product_id} className={'pick' + (on ? ' on' : '')}
                    style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 56 }}
                    onClick={() => setTrener(on ? null : p)}>
                    <span style={{ fontSize: 16 }}>{on ? '✓ ' : '+ '}{p.naziv}</span>
                    <span style={{ color: 'var(--gold)', fontSize: 17 }}>{km(p.cijena)}</span>
                  </button>
                );
              })}
            </div>
            {trener && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {listaTrenera.map(t => <button key={t} data-trener={t} className={'chip' + (trenerIme === t ? ' on' : '')} style={{ flex: 1, minWidth: 90 }} onClick={() => setTrenerIme(t)}>{t}</button>)}
              </div>
            )}
          </>}
          {pk.stavke.length > 0 && (
            <div className="card racun" style={{ marginTop: 16 }}>
              {pk.stavke.map((x, i) => <div className="ln" key={i}><span>{x.tekst}<div className="sit">do {dT(x.do)}</div></span><b>{km(x.cijena)} KM</b></div>)}
              <div className="ln" style={{ borderTop: '1px solid var(--line)', marginTop: 4, paddingTop: 10 }}>
                <span style={{ fontWeight: 600 }}>UKUPNO</span><b style={{ color: 'var(--gold)', fontSize: 22 }} data-testid="paket-ukupno">{km(pk.ukupno)} KM</b>
              </div>
            </div>
          )}
          <button className="btn" style={{ marginTop: 14 }} disabled={!pk.spreman} onClick={() => potvrdi(clan, pk, trener ? trenerIme : '')}>
            {!pk.stavke.length ? 'Izaberi kartu ili trenera' : trener && !trenerIme ? 'Izaberi trenera' : 'NAPLAĆENO ' + km(pk.ukupno) + ' KM'}
          </button>
          <button className="btn2" style={{ marginTop: 10 }} onClick={() => setKorak(clan.novi ? 'novi' : 'clan')}>Nazad</button>
        </>
      )}
    </Sheet>
  );
}

/* ═══════ 4. ZAVRŠNA INVENTURA + KASA ═══════ */
function Zavrsna({ smjena, proizvodi, razlozi, greska, radi, cekaju, nazad, onGotovo }) {
  const poId = {};
  proizvodi.forEach(p => { poId[p.product_id] = p; });
  const roba = Object.keys(smjena.pocetna).map(pid => poId[pid] || { product_id: pid, naziv: pid, kategorija: 'Ostalo', cijena: 0 });
  const [v, setV] = useNacrt('zavrsno:' + smjena.shift_id, {});
  const [korak, setKorak] = useState('brojanje');
  const [kasa, setKasa] = useNacrt('kasa:' + smjena.shift_id, '');
  const [provjereno, setProvjereno] = useState(false);
  const [razlog, setRazlog] = useState('');
  const fali = Logika.nedostaje(roba, v);
  const pr = Logika.provjeraZavrsnog(smjena, proizvodi, v, kasa);
  const kasaOk = pr.kasaRazlika !== null;
  const lista = (razlozi && razlozi.length) ? razlozi : ['Greška u kucanju', 'Gratis / poklon', 'Lom ili isteklo', 'Ne znam'];

  if (korak === 'brojanje') {
    return (
      <div className="wrap" style={{ paddingBottom: 32 }}>
        <div className="h1">Prebroji završno stanje</div>
        <div className="info">Prebroji ponovo <b style={{ color: 'var(--text)' }}>sve</b>, i upiši 0 gdje nema ništa. Poslije toga upisuješ gotovinu iz kase.</div>
        {Logika.grupisi(roba).map(g => (
          <div key={g.ime}>
            <div className="grp">{g.ime.toUpperCase()}</div>
            <div className="card0">
              {g.stavke.map(p => (
                <Brojac key={p.product_id} pid={p.product_id} naziv={p.naziv} v={v[p.product_id]}
                  set={n => setV(s => ({ ...s, [p.product_id]: n }))} />
              ))}
            </div>
          </div>
        ))}
        <button className="btn" disabled={fali.length > 0} onClick={() => { setKorak('kasa'); setProvjereno(false); window.scrollTo(0, 0); }}>
          {fali.length > 0 ? 'Još ' + fali.length + ' za prebrojati' : 'DALJE — KASA'}
        </button>
        <button className="btn2" onClick={nazad}>Nazad na prodaju</button>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ paddingBottom: 32 }}>
      <div className="h1">Gotovina u kasi</div>
      <div className="info">Prebroji sav novac u kasi i upiši iznos.</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input className="inp" data-testid="kasa" inputMode="decimal" value={kasa} placeholder="0,00"
          style={{ fontSize: 30, fontWeight: 700, textAlign: 'center', minHeight: 70 }}
          onChange={e => { setKasa(e.target.value.replace(/[^\d.,]/g, '').slice(0, 9)); setProvjereno(false); setRazlog(''); }} />
        <span style={{ fontSize: 18, color: 'var(--dim)' }}>KM</span>
      </div>
      {!provjereno && (
        <button className="btn" disabled={!kasaOk} onClick={() => setProvjereno(true)}>PROVJERI</button>
      )}
      {provjereno && kasaOk && (
        <>
          <div className="card">
            <div className="ln"><span>Treba biti u kasi</span><b>{km(pr.kasaOcekivano)} KM</b></div>
            <div className="ln"><span>Upisao si</span><b>{km(Number(String(kasa).replace(',', '.')))} KM</b></div>
            <div className="ln" style={{ borderTop: '1px solid var(--line)', marginTop: 4, paddingTop: 9 }}>
              <span>Kasa</span>
              <b style={{ color: pr.kasaRazlika === 0 ? 'var(--green)' : 'var(--red)' }}>
                {pr.kasaRazlika === 0 ? '✓ poklapa se' : (pr.kasaRazlika > 0 ? 'višak +' : 'manjak ') + km(pr.kasaRazlika) + ' KM'}
              </b>
            </div>
            <div className="ln"><span>Roba</span>
              <b style={{ color: pr.razlikeRobe ? 'var(--red)' : 'var(--green)' }}>
                {pr.razlikeRobe ? '⚠ ' + pr.razlikeRobe + (pr.razlikeRobe === 1 ? ' proizvod se ne poklapa' : ' proizvoda se ne poklapa') : '✓ sve se poklapa'}
              </b>
            </div>
          </div>
          {pr.trebaRazlog && (
            <>
              <div className="warn">Nešto se ne poklapa. Ako nisi siguran, vrati se i prebroji robu ponovo. Ako je sve tačno, izaberi razlog:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {lista.map(r => <button key={r} className={'chip' + (razlog === r ? ' on' : '')} onClick={() => setRazlog(r)}>{r}</button>)}
              </div>
            </>
          )}
          {cekaju > 0 && <div className="warn">⟳ {cekaju} promjena još čeka slanje. Biće poslane prije zatvaranja.</div>}
          {greska && <div className="err">{greska}</div>}
          <button className="btn" disabled={radi || (pr.trebaRazlog && !razlog)}
            onClick={() => {
              const b = {}; roba.forEach(p => { b[p.product_id] = Number(v[p.product_id]); });
              onGotovo(b, String(kasa).replace(',', '.'), pr.trebaRazlog ? razlog : '');
            }}>
            {radi ? 'Zatvaram smjenu…' : 'ZAVRŠI SMJENU'}
          </button>
        </>
      )}
      <button className="btn2" onClick={() => { setKorak('brojanje'); setProvjereno(false); }}>Nazad na brojanje robe</button>
    </div>
  );
}

/* ═══════ 5. IZVJEŠTAJ SMJENE ═══════ */
function DetaljRazlike({ s }) {
  return (
    <div className="card" style={{ borderColor: 'var(--red)' }}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{s.naziv}</div>
      <div className="ln"><span>Početno</span><b>{s.pocetno}</b></div>
      <div className="ln"><span>Dopunjeno</span><b>{s.dopunjeno}</b></div>
      <div className="ln"><span>Prodano (klikovi)</span><b>{s.prodano_klik}</b></div>
      <div className="ln"><span>Očekivano završno</span><b>{s.ocekivano}</b></div>
      <div className="ln"><span>Stvarno završno</span><b>{s.stvarno}</b></div>
      <div className="ln"><span>Prodano po inventuri</span><b>{s.prodano_inventura}</b></div>
      <div className="ln" style={{ borderTop: '1px solid var(--line)', marginTop: 6, paddingTop: 9 }}>
        <span style={{ color: 'var(--red)' }}>Razlika</span>
        <b style={{ color: 'var(--red)' }} data-testid={'razlika-' + s.product_id}>{s.razlika_kom > 0 ? '+' : ''}{s.razlika_kom} kom · {km(s.razlika_km)} KM</b>
      </div>
      <div className="sit" style={{ marginTop: 8, lineHeight: 1.5 }}>
        {s.razlika_kom < 0
          ? 'Fali ' + Math.abs(s.razlika_kom) + ' kom. Vjerovatno prodaja koja nije kucana.'
          : 'Ima ' + s.razlika_kom + ' kom više. Provjeri je li dopuna evidentirana ili je prodaja kucana greškom.'}
      </div>
    </div>
  );
}

function Izvjestaj({ izv, onNovo, pokaziToast, uAdminu }) {
  const problemi = (izv.stavke || []).filter(s => s.razlika_kom);
  const ok = (izv.stavke || []).length - problemi.length;
  const tekst = Logika.tekstIzvjestaja(izv);
  const [pokaziTekst, setPokaziTekst] = useState(false);

  const kopiraj = async () => {
    let uspjeh = false;
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(tekst); uspjeh = true; } } catch (e) { /* */ }
    if (!uspjeh) {
      try {
        const ta = document.createElement('textarea'); ta.value = tekst; ta.setAttribute('readonly', '');
        ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
        uspjeh = document.execCommand('copy'); document.body.removeChild(ta);
      } catch (e) { /* */ }
    }
    if (uspjeh) pokaziToast('✓ Izvještaj kopiran. Zalijepi ga u Viber ili WhatsApp.', 'ok');
    else setPokaziTekst(true);
  };

  return (
    <div className="wrap" style={{ paddingBottom: 32 }}>
      <div className="card" style={{ borderColor: izv.status === 'OPEN' ? 'var(--gold)' : 'var(--green)' }}>
        <div className="lab" style={{ color: izv.status === 'OPEN' ? 'var(--gold)' : 'var(--green)' }}>{izv.status === 'OPEN' ? 'SMJENA U TOKU' : 'SMJENA ZAVRŠENA'}</div>
        <div style={{ fontSize: 21, fontWeight: 600 }}>{izv.radnik}</div>
        <div className="sit">{dT(izv.datum)} · {izv.pocetak}{izv.kraj ? ' — ' + izv.kraj : ''}{izv.trajanje_min !== null ? ' · ' + Logika.trajanje(izv.trajanje_min) : ''}</div>
      </div>

      <div className="two">
        <div className="box">
          <div className="lab">PRODANO</div>
          <div className="big">{izv.prodano_kom}<span style={{ fontSize: 12, color: 'var(--dim)', marginLeft: 4 }}>kom</span></div>
        </div>
        <div className="box">
          <div className="lab">PROMET</div>
          <div className="big" style={{ color: 'var(--gold)' }} data-testid="izv-promet">{km(izv.promet)}<span style={{ fontSize: 12, color: 'var(--dim)', marginLeft: 4 }}>KM</span></div>
        </div>
      </div>

      {izv.kasa_stvarno !== null && izv.kasa_stvarno !== undefined && (
        <div className="card" style={{ borderColor: izv.kasa_razlika ? 'var(--red)' : 'var(--line)' }}>
          <div className="lab">KASA</div>
          <div className="ln"><span>Treba biti</span><b>{km(izv.kasa_ocekivano)} KM</b></div>
          <div className="ln"><span>U kasi</span><b>{km(izv.kasa_stvarno)} KM</b></div>
          <div className="ln"><span>Razlika</span><b data-testid="kasa-razlika" style={{ color: izv.kasa_razlika ? 'var(--red)' : 'var(--green)' }}>{izv.kasa_razlika ? km(izv.kasa_razlika) + ' KM' : '✓ 0,00 KM'}</b></div>
        </div>
      )}

      <div className="card">
        <div className="lab">INVENTURA</div>
        {izv.bez_brojanja ? <div style={{ fontSize: 14, color: 'var(--gold)' }}>Nije prebrojano (zatvorio vlasnik).</div> : <>
          <div style={{ fontSize: 15, color: 'var(--green)' }} data-testid="poklapa">✓ {ok} {ok === 1 ? 'proizvod se poklapa' : 'proizvoda se poklapa'}</div>
          {problemi.length > 0 && (
            <div style={{ fontSize: 15, color: 'var(--red)', marginTop: 5 }} data-testid="razlike">
              ⚠ {problemi.length} {problemi.length === 1 ? 'proizvod ima razliku' : 'proizvoda imaju razliku'} · {km(izv.vrijednost_razlike)} KM
            </div>
          )}
        </>}
        {izv.kasa_razlog && <div className="sit" style={{ marginTop: 8 }}>Razlog: {izv.kasa_razlog}</div>}
      </div>

      {(izv.upozorenja || []).map((u, i) => <div className="warn" key={i}>⚠ {u}</div>)}
      {problemi.map(s => <DetaljRazlike key={s.product_id} s={s} />)}

      {izv.usluge && izv.usluge.length > 0 && (
        <div className="card">
          <div className="lab">KARTE, ČLANARINE I USLUGE</div>
          {izv.usluge.map(u => <div className="ln" key={u.product_id}><span>{u.naziv}</span><b>{u.kom} kom · {km(u.km)} KM</b></div>)}
        </div>
      )}

      {izv.napomene && izv.napomene.length > 0 && (
        <div className="card">
          <div className="lab">NAPOMENE RADNIKA</div>
          {izv.napomene.map((n, i) => <div className="ln" key={i} style={{ justifyContent: 'flex-start' }}><span className="sit" style={{ marginTop: 0, minWidth: 44 }}>{n.vrijeme}</span><span>{n.tekst}</span></div>)}
        </div>
      )}

      <button className="btn2" onClick={kopiraj}>Kopiraj izvještaj (Viber / WhatsApp)</button>
      {pokaziTekst && <textarea className="inp" readOnly value={tekst} style={{ minHeight: 180, fontSize: 13 }} onFocus={e => e.target.select()} />}
      {!uAdminu && <button className="btn" onClick={onNovo}>Gotovo</button>}
    </div>
  );
}

/* ═══════ 6. VLASNIK ═══════ */
function Admin({ nazad, pokaziToast }) {
  const [pin, setPin] = useState(() => { try { return sessionStorage.getItem('adin_pin') || ''; } catch (e) { return ''; } });
  const [unos, setUnos] = useState('');
  const [ulogovan, setUlogovan] = useState(false);
  const [greska, setGreska] = useState('');
  const [tab, setTab] = useState('danas');
  const [d, setD] = useState(null);
  const [radi, setRadi] = useState(false);

  const ucitaj = useCallback(async (p) => {
    setRadi(true); setGreska('');
    try {
      const r = await api('getAdminData', p);
      setD(r); setUlogovan(true); setPin(p);
      try { sessionStorage.setItem('adin_pin', p); } catch (e) { /* */ }
    } catch (e) {
      if (e.code === 'PIN') { setUlogovan(false); try { sessionStorage.removeItem('adin_pin'); } catch (x) { /* */ } }
      setGreska(e.message);
    } finally { setRadi(false); }
  }, []);

  useEffect(() => { if (pin) ucitaj(pin); }, []); // eslint-disable-line

  if (!ulogovan) {
    return (
      <div className="wrap">
        <div className="h1">Vlasnik</div>
        <div className="lab">PIN</div>
        <input className="inp" type="password" inputMode="numeric" pattern="[0-9]*" autoFocus value={unos}
          style={{ fontSize: 26, letterSpacing: 8, textAlign: 'center' }}
          onChange={e => setUnos(e.target.value.replace(/\D/g, '').slice(0, 8))}
          onKeyDown={e => { if (e.key === 'Enter' && unos) ucitaj(unos); }} />
        {greska && <div className="err">{greska}</div>}
        <button className="btn" disabled={!unos || radi} onClick={() => ucitaj(unos)}>{radi ? 'Provjeravam…' : 'Uđi'}</button>
        <button className="btn2" onClick={nazad}>Nazad</button>
      </div>
    );
  }

  return (
    <div className="wrap">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="lab" style={{ marginBottom: 2 }}>DOBRO DOŠLI</div>
          <div className="h1" style={{ fontSize: 21 }}>{(d && d.vlasnici) || 'Vlasnici'}</div>
        </div>
        <button className="chip" onClick={() => ucitaj(pin)} disabled={radi}>{radi ? '…' : '↻ Osvježi'}</button>
      </div>
      <div className="tabs">
        {[['danas', 'Danas'], ['raspored', 'Raspored'], ['karte', 'Karte'], ['vrata', 'Vrata'], ['smjene', 'Smjene'], ['clanovi', 'Članovi'], ['zalihe', 'Zalihe'], ['proizvodi', 'Proizvodi'], ['mjesec', 'Mjesec'], ['postavke', 'Postavke']].map(([k, n]) =>
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{n}</button>)}
      </div>
      {greska && <div className="err">{greska}</div>}
      {d && tab === 'danas' && <AdminDanas d={d} pin={pin} osvjezi={() => ucitaj(pin)} pokaziToast={pokaziToast} />}
      {d && tab === 'zalihe' && <AdminZalihe d={d} />}
      {d && tab === 'karte' && <AdminKarte d={d} />}
      {d && tab === 'raspored' && <AdminRaspored d={d} pin={pin} osvjezi={() => ucitaj(pin)} pokaziToast={pokaziToast} />}
      {d && tab === 'clanovi' && <AdminClanovi d={d} pin={pin} osvjezi={() => ucitaj(pin)} pokaziToast={pokaziToast} />}
      {d && tab === 'proizvodi' && <AdminProizvodi d={d} pin={pin} osvjezi={() => ucitaj(pin)} pokaziToast={pokaziToast} />}
      {d && tab === 'vrata' && <AdminVrata pin={pin} pokaziToast={pokaziToast} />}
      {d && tab === 'postavke' && <AdminPostavke d={d} osvjezi={() => ucitaj(pin)} pin={pin} setPin={p => { setPin(p); try { sessionStorage.setItem('adin_pin', p); } catch (e) { /* */ } }} pokaziToast={pokaziToast} />}
      {d && tab === 'smjene' && <AdminSmjene pin={pin} pokaziToast={pokaziToast} />}
      {d && tab === 'mjesec' && <AdminMjesec d={d} />}
      <button className="btn2" style={{ marginTop: 10 }} onClick={() => { try { sessionStorage.removeItem('adin_pin'); } catch (e) { /* */ } nazad(); }}>Izađi iz pregleda</button>
    </div>
  );
}

function Broj({ lab, v, boja, sit }) {
  return (
    <div className="box">
      <div className="lab">{lab}</div>
      <div className="big" style={{ fontSize: 24, color: boja || 'var(--text)' }}>{v}</div>
      {sit && <div className="sit">{sit}</div>}
    </div>
  );
}

function AdminDanas({ d, pin, osvjezi, pokaziToast }) {
  const [zatvaranje, setZatvaranje] = useState(false);
  const [nap, setNap] = useState('');
  const [radi, setRadi] = useState(false);
  const [gr, setGr] = useState('');
  const o = d.otvorena;
  const zatvori = async () => {
    setRadi(true); setGr('');
    try { await api('adminCloseShift', pin, o.shift_id, nap); setZatvaranje(false); pokaziToast('✓ Smjena zatvorena.', 'ok'); osvjezi(); }
    catch (e) { setGr(e.message); } finally { setRadi(false); }
  };
  return (
    <>
      {o ? (
        <div className={o.stara ? 'err' : 'card'} style={o.stara ? {} : { borderColor: 'var(--gold)' }}>
          <div className="lab" style={{ color: o.stara ? 'var(--red)' : 'var(--gold)' }}>{o.stara ? '⚠ SMJENA OTVORENA PREDUGO' : 'SMJENA U TOKU'}</div>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)' }}>{o.radnik} · od {o.od} ({dT(o.datum)})</div>
          <div className="sit">{o.sati} h · {o.kom} kom · {km(o.promet)} KM</div>
          {o.stara && <div style={{ marginTop: 8, color: 'var(--text)', fontSize: 13 }}>Vjerovatno je zaboravljeno zatvaranje. Najbolje je da radnik sam završi smjenu s brojanjem. Ako to nije moguće, zatvori je ovdje.</div>}
          {!zatvaranje && <button className="btn2" style={{ marginTop: 10 }} onClick={() => setZatvaranje(true)}>Zatvori bez brojanja…</button>}
          {zatvaranje && <>
            <input className="inp" style={{ marginTop: 10 }} placeholder="Napomena (obavezno)" value={nap} onChange={e => setNap(e.target.value)} />
            {gr && <div className="err" style={{ marginTop: 8 }}>{gr}</div>}
            <button className="btn red" disabled={!nap.trim() || radi} onClick={zatvori}>{radi ? 'Zatvaram…' : 'Zatvori smjenu'}</button>
          </>}
        </div>
      ) : <div className="info">Trenutno nema otvorene smjene.</div>}
      <div className="two">
        <Broj lab="PROMET DANAS" v={km(d.danas.promet)} boja="var(--gold)" sit={d.danas.kom + ' kom'} />
        <Broj lab="PROFIT DANAS" v={km(d.danas.profit)} boja="var(--green)" />
      </div>
      <div className="two">
        <Broj lab="PROFIT OVE SEDMICE" v={km(d.sedmica.profit)} sit={'promet ' + km(d.sedmica.promet) + ' KM'} />
        <Broj lab="ZADNJIH 7 DANA" v={km(d.d7.promet)} sit="promet KM" />
      </div>
      <div className="card" style={{ borderColor: 'var(--gold)' }}>
        <div className="lab">PLATA RADNIKA ({Math.round(d.plata.udio * 100)}% SEDMIČNOG PROFITA)</div>
        <div className="ln"><span>Za prošlu sedmicu ({dT(d.periodi.proslaOd)}–{dT(d.periodi.proslaDo)}) — isplata u ponedjeljak</span><b style={{ color: 'var(--gold)', fontSize: 18 }}>{km(d.plata.prosla)} KM</b></div>
        <div className="ln"><span>Ova sedmica do sada</span><b>{km(d.plata.ova_do_sada)} KM</b></div>
        <div className="sit">Profit prošle sedmice: {km(d.prosla.profit)} KM (promet {km(d.prosla.promet)} KM)</div>
      </div>
      {(d.clanovi.istice.length > 0 || d.clanovi.istekli.length > 0) && (
        <div className="warn">Članarine: {d.clanovi.istice.length} ističe u narednih 5 dana, {d.clanovi.istekli.length} isteklo. Vidi tab „Članovi".</div>
      )}
      {(d.proizvodi || []).some(p => p.dodao) && <div className="warn">★ Radnik je dodao novi proizvod: {(d.proizvodi || []).filter(p => p.dodao).map(p => p.naziv).join(', ')}. Provjeri cijenu i upiši nabavnu u tabu „Proizvodi".</div>}
      {d.zalihe.some(z => z.nisko) && <div className="warn">Nisko na zalihi: {d.zalihe.filter(z => z.nisko).map(z => z.naziv + ' (' + z.kolicina + ')').join(', ')}</div>}
    </>
  );
}

function AdminRaspored({ d, pin, osvjezi, pokaziToast }) {
  const [uredi, setUredi] = useState(null);
  const raspored = d.raspored || [];
  const termini = Logika.termini(raspored);
  return (
    <>
      <div className="info">Ovo radnik vidi na početku dana i tokom smjene: ko dolazi, u koliko sati i šta taj dan trenira.</div>
      <button className="btn" onClick={() => setUredi({ termin_id: '', osobe: '', vrijeme: '19:00', trener: '', napomena: '', dani: {} })}>+ Novi termin</button>
      {Logika.DANI.map(dan => {
        const lista = Logika.zaDan(raspored, dan);
        return (
          <div key={dan}>
            <div className="grp">{Logika.DANI_IME[dan].toUpperCase()}</div>
            <div className="card0">
              {!lista.length && <div className="sit" style={{ padding: '12px 14px', marginTop: 0 }}>—</div>}
              {lista.map((t, i) => (
                <button key={t.termin_id + i} className="listbtn" data-termin={t.termin_id} onClick={() => setUredi(termini.find(x => x.termin_id === t.termin_id))}>
                  <span><b style={{ color: 'var(--gold)' }}>{t.vrijeme}</b> {t.osobe}<div className="sit">{t.trening || 'plan nije upisan'}{t.trener ? ' · ' + t.trener : ''}</div></span>
                  <span className="sit">uredi ›</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
      {uredi && <UrediTermin t={uredi} treneri={d.treneri || []} pin={pin} zatvori={() => setUredi(null)}
        gotovo={poruka => { setUredi(null); pokaziToast(poruka, 'ok'); osvjezi(); }} />}
    </>
  );
}

function UrediTermin({ t, treneri, pin, zatvori, gotovo }) {
  const [x, setX] = useState({ ...t, dani: { ...t.dani } });
  const [radi, setRadi] = useState(false);
  const [gr, setGr] = useState('');
  const prebaci = dan => setX(s => { const d = { ...s.dani }; if (d.hasOwnProperty(dan)) delete d[dan]; else d[dan] = ''; return { ...s, dani: d }; });
  const sacuvaj = async () => {
    setRadi(true); setGr('');
    try { await api('saveTermin', pin, x); gotovo('✓ Raspored sačuvan.'); } catch (e) { setGr(e.message); } finally { setRadi(false); }
  };
  const obrisi = async () => {
    setRadi(true); setGr('');
    try { await api('deleteTermin', pin, x.termin_id); gotovo('Termin uklonjen iz rasporeda.'); } catch (e) { setGr(e.message); } finally { setRadi(false); }
  };
  const izabrani = Logika.DANI.filter(d => x.dani.hasOwnProperty(d));
  return (
    <Sheet naslov={t.termin_id ? 'Uredi termin' : 'Novi termin'} zatvori={zatvori}>
      <div className="lab">KO TRENIRA</div>
      <input className="inp" data-testid="t-osobe" value={x.osobe} maxLength={120} placeholder="npr. Enes Velić + supruga, Nino" onChange={e => setX({ ...x, osobe: e.target.value })} />
      <div className="two" style={{ marginTop: 12 }}>
        <div style={{ flex: 1 }}><div className="lab">VRIJEME</div>
          <input className="inp" type="time" data-testid="t-vrijeme" value={x.vrijeme} onChange={e => setX({ ...x, vrijeme: e.target.value })} /></div>
      </div>
      <div className="lab" style={{ marginTop: 12 }}>TRENER</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <button className={'chip' + (!x.trener ? ' on' : '')} onClick={() => setX({ ...x, trener: '' })}>bez trenera</button>
        {treneri.map(tr => <button key={tr} className={'chip' + (x.trener === tr ? ' on' : '')} onClick={() => setX({ ...x, trener: tr })}>{tr}</button>)}
      </div>
      <div className="lab" style={{ marginTop: 14 }}>DANI</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {Logika.DANI.map(dan => <button key={dan} data-dan={dan} className={'chip' + (x.dani.hasOwnProperty(dan) ? ' on' : '')} style={{ minWidth: 56 }} onClick={() => prebaci(dan)}>{Logika.DANI_IME[dan].slice(0, 3)}</button>)}
      </div>
      {izabrani.length > 0 && <div className="lab" style={{ marginTop: 14 }}>ŠTA TRENIRA KOJI DAN</div>}
      {izabrani.map(dan => (
        <div key={dan} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 84, flexShrink: 0, fontSize: 14, color: 'var(--dim)' }}>{Logika.DANI_IME[dan]}</div>
          <input className="inp" data-trening={dan} value={x.dani[dan]} maxLength={200} placeholder="npr. Noge + core"
            onChange={e => { const v = e.target.value; setX(s => ({ ...s, dani: { ...s.dani, [dan]: v } })); }} />
        </div>
      ))}
      <div className="lab" style={{ marginTop: 6 }}>NAPOMENA (NIJE OBAVEZNO)</div>
      <input className="inp" value={x.napomena || ''} maxLength={200} placeholder="npr. donijeti peškir, plaća krajem mjeseca" onChange={e => setX({ ...x, napomena: e.target.value })} />
      {gr && <div className="err" style={{ marginTop: 10 }}>{gr}</div>}
      <button className="btn" style={{ marginTop: 12 }} disabled={radi || !x.osobe.trim() || !x.vrijeme || !izabrani.length} onClick={sacuvaj}>{radi ? 'Čuvam…' : 'Sačuvaj'}</button>
      {t.termin_id && <button className="btn2" style={{ marginTop: 10, color: 'var(--red)' }} disabled={radi} onClick={obrisi}>Ukloni termin iz rasporeda</button>}
    </Sheet>
  );
}

function AdminKarte({ d }) {
  const k = d.karte;
  if (!k) return null;
  const red = (lab, x, dod) => (
    <div className="ln"><span>{lab}{dod ? <div className="sit">{dod}</div> : null}</span><b>{x.kom} kom · <span style={{ color: 'var(--gold)' }}>{km(x.promet)} KM</span></b></div>
  );
  return (
    <>
      <div className="two">
        <Broj lab="AKTIVNIH KARTI" v={k.aktivnih_karti} boja="var(--gold)" sit="članova s važećom kartom" />
        <Broj lab="S TRENEROM" v={k.sa_trenerom.length} boja="var(--green)" sit={Object.keys(k.po_treneru).map(t => t + ' ' + k.po_treneru[t]).join(' · ') || '—'} />
      </div>
      <div className="card">
        <div className="lab">DANAS</div>
        {red('🎫 Dnevne karte', k.danas.dnevne)}
        {red('🏋️ Mjesečne karte', k.danas.mjesecne)}
        {red('💪 Trener', k.danas.trener)}
      </div>
      <div className="card">
        <div className="lab">OVAJ MJESEC (OD {dT(d.periodi.mjesecOd)})</div>
        {red('🎫 Dnevne karte', k.mjesec.dnevne)}
        {red('🏋️ Mjesečne karte', k.mjesec.mjesecne, 'nove: ' + k.mjesec.nove + ' · produžene: ' + k.mjesec.produzene)}
        {red('💪 Trener', k.mjesec.trener)}
        <div className="ln" style={{ borderTop: '1px solid var(--line)', marginTop: 4, paddingTop: 9 }}>
          <span>Ukupno karte i treneri</span>
          <b style={{ color: 'var(--gold)' }}>{km(k.mjesec.dnevne.promet + k.mjesec.mjesecne.promet + k.mjesec.trener.promet)} KM</b>
        </div>
      </div>
      <div className="grp">ČLANOVI S TRENEROM</div>
      <div className="card0">
        {!k.sa_trenerom.length && <div className="info" style={{ border: 'none' }}>Trenutno niko.</div>}
        {k.sa_trenerom.map(c => (
          <div className="row" key={c.member_id} style={{ minHeight: 60 }}>
            <span style={{ fontSize: 15 }}>{c.ime}<div className="sit">trener <b style={{ color: 'var(--text)' }}>{c.trener}</b> do {dT(c.trener_do)}{c.istek ? ' · karta do ' + dT(c.istek) : ''}</div></span>
            <Telefon broj={c.telefon} />
          </div>
        ))}
      </div>
    </>
  );
}

function AdminZalihe({ d }) {
  return (
    <>
      <div className="info">{d.otvorena ? 'Očekivano stanje sada (početno + dopuna − prodaja u ovoj smjeni).' : 'Stanje sa zadnjeg brojanja.'} Crveno = na minimumu ili ispod (minimum se mijenja u tabeli PROIZVODI).</div>
      <div className="card0">
        {d.zalihe.map(z => (
          <div className="row" key={z.product_id} style={{ minHeight: 52 }}>
            <span style={{ fontSize: 15 }}>{z.naziv}<div className="sit">minimum {z.minimum}</div></span>
            <b style={{ fontSize: 20, color: z.nisko ? 'var(--red)' : 'var(--text)' }}>{z.kolicina === null ? '—' : z.kolicina}</b>
          </div>
        ))}
      </div>
    </>
  );
}

function Telefon({ broj }) {
  if (!broj) return null;
  return <a href={'tel:' + String(broj).replace(/[^\d+]/g, '')} className="chip" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', flexShrink: 0 }}>📞 {broj}</a>;
}

function AdminClanovi({ d, pin, osvjezi, pokaziToast }) {
  const c = d.clanovi;
  const [upit, setUpit] = useState('');
  const [uredi, setUredi] = useState(null);
  const svi = Logika.traziClanove(d.svi_clanovi || [], upit);
  const red = (x, boja, tekst) => (
    <div className="row" key={x.member_id} style={{ minHeight: 60 }}>
      <span style={{ fontSize: 15 }}>{x.ime}<div className="sit" style={{ color: boja }}>{tekst}</div></span>
      <Telefon broj={x.telefon} />
    </div>
  );
  return (
    <>
      <div className="info">Aktivnih članarina: <b style={{ color: 'var(--text)' }}>{c.aktivnih}</b>. Članove i telefone možeš mijenjati u tabeli CLANOVI.</div>
      <div className="grp">ISTIČE U NAREDNIH 5 DANA</div>
      <div className="card0">
        {!c.istice.length && <div className="info" style={{ border: 'none' }}>Niko.</div>}
        {c.istice.map(x => red(x, 'var(--gold)', (x.dana === 0 ? 'ističe danas' : 'ističe za ' + x.dana + (x.dana === 1 ? ' dan' : ' dana')) + ' · ' + dT(x.istek)))}
      </div>
      <div className="grp">ISTEKLO (ZADNJIH 60 DANA)</div>
      <div className="card0">
        {!c.istekli.length && <div className="info" style={{ border: 'none' }}>Niko.</div>}
        {c.istekli.map(x => red(x, 'var(--red)', 'isteklo ' + dT(x.istek)))}
      </div>
      <div className="grp">SVI ČLANOVI ({(d.svi_clanovi || []).length})</div>
      <input className="inp" placeholder="Traži po imenu ili telefonu…" value={upit} onChange={e => setUpit(e.target.value)} />
      <div className="card0">
        {svi.slice(0, 60).map(x => (
          <button key={x.member_id} className="listbtn" onClick={() => setUredi({ ...x })}>
            <span>{x.ime}<div className="sit">{x.telefon || 'bez telefona'}{x.trener ? ' · 🏋️ ' + x.trener + (x.trener_do ? ' do ' + dT(x.trener_do) : '') : ''}{x.brava_id ? ' · čip: ' + x.brava_id : ''}{x.aktivan ? '' : ' · NEAKTIVAN'}</div></span>
            <span className="sit" style={{ textAlign: 'right' }}>{x.istek ? 'do ' + dT(x.istek) : ''}<br />uredi ›</span>
          </button>
        ))}
      </div>
      {uredi && <UrediClana c={uredi} pin={pin} zatvori={() => setUredi(null)} gotovo={() => { setUredi(null); pokaziToast('✓ Član sačuvan.', 'ok'); osvjezi(); }} />}
    </>
  );
}

function UrediClana({ c, pin, zatvori, gotovo }) {
  const [x, setX] = useState(c);
  const [radi, setRadi] = useState(false);
  const [gr, setGr] = useState('');
  const sacuvaj = async () => {
    setRadi(true); setGr('');
    try { await api('saveMember', pin, { member_id: x.member_id, ime: x.ime, telefon: x.telefon, napomena: x.napomena, brava_id: x.brava_id, aktivan: x.aktivan }); gotovo(); }
    catch (e) { setGr(e.message); } finally { setRadi(false); }
  };
  return (
    <Sheet naslov={'Član — ' + c.ime} zatvori={zatvori}>
      <div className="lab">IME I PREZIME</div>
      <input className="inp" value={x.ime} onChange={e => setX({ ...x, ime: e.target.value })} />
      <div className="lab" style={{ marginTop: 12 }}>TELEFON</div>
      <input className="inp" inputMode="tel" value={x.telefon || ''} onChange={e => setX({ ...x, telefon: e.target.value })} />
      <div className="lab" style={{ marginTop: 12 }}>ČIP / ŠIFRA U BRAVI (ID IZ TUYA APLIKACIJE)</div>
      <input className="inp" value={x.brava_id || ''} placeholder="npr. broj kartice ili ime korisnika u bravi" onChange={e => setX({ ...x, brava_id: e.target.value })} />
      <div className="sit" style={{ marginTop: 6 }}>Ovim se ulazak na vrata povezuje s članom i njegovom članarinom.</div>
      <div className="lab" style={{ marginTop: 12 }}>NAPOMENA</div>
      <input className="inp" value={x.napomena || ''} onChange={e => setX({ ...x, napomena: e.target.value })} />
      <button className={'chip' + (x.aktivan ? ' on' : '')} style={{ marginTop: 12, width: '100%' }} onClick={() => setX({ ...x, aktivan: !x.aktivan })}>
        {x.aktivan ? '✓ Aktivan član' : 'Neaktivan (sakriven radniku)'}
      </button>
      {gr && <div className="err" style={{ marginTop: 10 }}>{gr}</div>}
      <button className="btn" style={{ marginTop: 12 }} disabled={radi || !x.ime.trim()} onClick={sacuvaj}>{radi ? 'Čuvam…' : 'Sačuvaj'}</button>
    </Sheet>
  );
}

/* ═══════ VLASNIK: PROIZVODI ═══════ */
function AdminProizvodi({ d, pin, osvjezi, pokaziToast }) {
  const [uredi, setUredi] = useState(null);
  const kategorije = [];
  d.proizvodi.forEach(p => { if (kategorije.indexOf(p.kategorija) < 0) kategorije.push(p.kategorija); });
  return (
    <>
      {d.proizvodi.some(p => p.dodao) && <div className="warn">★ Radnik je dodao {d.proizvodi.filter(p => p.dodao).length} {d.proizvodi.filter(p => p.dodao).length === 1 ? 'novi proizvod' : 'nova proizvoda'}. Otvori ga, provjeri cijenu i upiši nabavnu.</div>}
      <div className="info">Ovdje dodaješ nove stvari i mijenjaš cijene. Proizvod se nikad ne briše, samo isključi (da historija ostane tačna). Radnik promjenu vidi kad ponovo otvori aplikaciju.</div>
      <button className="btn" onClick={() => setUredi({ product_id: '', naziv: '', kategorija: kategorije[0] || 'Ostalo', cijena: '', nabavna: '', minimum: 3, prati_zalihu: true, aktivan: true, clanarina_mjeseci: 0, tip: 'roba' })}>+ Novi proizvod / ponuda</button>
      {Logika.grupisi(d.proizvodi).map(g => (
        <div key={g.ime}>
          <div className="grp">{g.ime.toUpperCase()}</div>
          <div className="card0">
            {g.stavke.map(p => (
              <button key={p.product_id} className="listbtn" data-proizvod={p.product_id} onClick={() => setUredi({ ...p, cijena: String(p.cijena).replace('.', ','), nabavna: String(p.nabavna).replace('.', ',') })}
                style={p.aktivan ? (p.dodao ? { background: 'rgba(232,163,61,.08)' } : {}) : { opacity: .45 }}>
                <span>{p.naziv}{p.dodao && <div className="sit" style={{ color: 'var(--gold)' }}>★ NOVO — dodao {p.dodao}. Provjeri cijenu, upiši nabavnu i sačuvaj.</div>}<div className="sit">{p.aktivan ? '' : 'ISKLJUČEN · '}{{ roba: 'roba', dnevna: 'dnevna karta', clanarina: 'mjesečna karta', trener: 'trener', usluga: 'usluga' }[Logika.tip(p)]} · nabavna {km(p.nabavna)}{p.prati_zalihu ? ' · min ' + p.minimum : ''}</div></span>
                <b style={{ color: 'var(--gold)' }}>{km(p.cijena)} KM</b>
              </button>
            ))}
          </div>
        </div>
      ))}
      {uredi && <UrediProizvod p={uredi} kategorije={kategorije} pin={pin} zatvori={() => setUredi(null)}
        gotovo={novi => { setUredi(null); pokaziToast(novi ? '✓ Proizvod dodan.' : '✓ Proizvod sačuvan.', 'ok'); osvjezi(); }} />}
    </>
  );
}

function UrediProizvod({ p, kategorije, pin, zatvori, gotovo }) {
  const [x, setX] = useState(p);
  const [novaKat, setNovaKat] = useState(false);
  const [radi, setRadi] = useState(false);
  const [gr, setGr] = useState('');
  const broj = v => Number(String(v).replace(',', '.'));
  const tip = x.tip || Logika.tip(x);
  const clanarina = tip === 'clanarina' || tip === 'trener';
  const VRSTE = [['roba', 'Roba (broji se)'], ['dnevna', 'Dnevna karta'], ['clanarina', 'Mjesečna karta'], ['trener', 'Lični trener'], ['usluga', 'Ostala usluga']];
  const sacuvaj = async () => {
    setRadi(true); setGr('');
    try {
      const r = await api('saveProduct', pin, { ...x, tip, cijena: broj(x.cijena), nabavna: broj(x.nabavna || 0), clanarina_mjeseci: Number(x.clanarina_mjeseci) || 0 });
      gotovo(r.novi);
    } catch (e) { setGr(e.message); } finally { setRadi(false); }
  };
  const decimal = v => v.replace(/[^\d.,]/g, '').slice(0, 8);
  return (
    <Sheet naslov={p.product_id ? p.naziv : 'Novi proizvod'} zatvori={zatvori}>
      <div className="lab">NAZIV</div>
      <input className="inp" data-testid="p-naziv" value={x.naziv} maxLength={60} onChange={e => setX({ ...x, naziv: e.target.value })} placeholder="npr. Monster" />
      <div className="lab" style={{ marginTop: 12 }}>KATEGORIJA</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {kategorije.map(k => <button key={k} className={'chip' + (!novaKat && x.kategorija === k ? ' on' : '')} onClick={() => { setNovaKat(false); setX({ ...x, kategorija: k }); }}>{k}</button>)}
        <button className={'chip' + (novaKat ? ' on' : '')} onClick={() => { setNovaKat(true); setX({ ...x, kategorija: '' }); }}>+ nova</button>
      </div>
      {novaKat && <input className="inp" style={{ marginTop: 8 }} placeholder="Naziv kategorije" value={x.kategorija} onChange={e => setX({ ...x, kategorija: e.target.value })} />}
      <div className="two" style={{ marginTop: 12 }}>
        <div style={{ flex: 1 }}><div className="lab">PRODAJNA (KM)</div>
          <input className="inp" data-testid="p-cijena" inputMode="decimal" value={x.cijena} onChange={e => setX({ ...x, cijena: decimal(e.target.value) })} placeholder="0,00" /></div>
        <div style={{ flex: 1 }}><div className="lab">{tip === 'trener' ? 'IDE TRENERU (KM)' : 'NABAVNA (KM)'}</div>
          <input className="inp" data-testid="p-nabavna" inputMode="decimal" value={x.nabavna} onChange={e => setX({ ...x, nabavna: decimal(e.target.value) })} placeholder="0,00" /></div>
      </div>
      <div className="lab" style={{ marginTop: 12 }}>VRSTA</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {VRSTE.map(([k, n]) => <button key={k} className={'chip' + (tip === k ? ' on' : '')} onClick={() => setX({ ...x, tip: k, prati_zalihu: k === 'roba', clanarina_mjeseci: (k === 'clanarina' || k === 'trener') ? (x.clanarina_mjeseci || 1) : 0 })}>{n}</button>)}
      </div>
      <div className="sit" style={{ marginTop: 6 }}>
        {tip === 'roba' ? 'Broji se na početku i kraju smjene.' : tip === 'dnevna' ? 'Jedan tap = jedna karta, na vrhu ekrana prodaje.' : tip === 'clanarina' ? 'Prodaje se članu; produžava datum važenja karte.' : tip === 'trener' ? 'Dodatak na kartu; bira se trener. Nabavna = koliko ide treneru (ako je ista kao cijena, ne ulazi u profit ni u platu radnika).' : 'Jedan tap = jedna prodaja, bez brojanja.'}
      </div>
      {clanarina && (
        <div style={{ marginTop: 12 }}><div className="lab">TRAJE (MJESECI)</div>
          <input className="inp" inputMode="numeric" value={x.clanarina_mjeseci} onChange={e => setX({ ...x, clanarina_mjeseci: e.target.value.replace(/\D/g, '').slice(0, 2) })} /></div>
      )}
      {tip === 'roba' && (
        <div style={{ marginTop: 12 }}><div className="lab">UPOZORI KAD PADNE NA (KOM)</div>
          <input className="inp" inputMode="numeric" value={x.minimum} onChange={e => setX({ ...x, minimum: e.target.value.replace(/\D/g, '').slice(0, 4) })} /></div>
      )}
      <button className={'chip' + (x.aktivan ? ' on' : '')} style={{ marginTop: 12, width: '100%' }} onClick={() => setX({ ...x, aktivan: !x.aktivan })}>
        {x.aktivan ? '✓ Uključen (radnik ga vidi)' : 'Isključen (sakriven radniku)'}
      </button>
      {gr && <div className="err" style={{ marginTop: 10 }}>{gr}</div>}
      <button className="btn" style={{ marginTop: 12 }} disabled={radi || !x.naziv.trim() || !(broj(x.cijena) > 0) || !String(x.kategorija).trim()} onClick={sacuvaj}>
        {radi ? 'Čuvam…' : 'Sačuvaj'}
      </button>
    </Sheet>
  );
}

/* ═══════ VLASNIK: VRATA, SVJETLA, ULAZI (TUYA) ═══════ */
function AdminVrata({ pin, pokaziToast }) {
  const [post, setPost] = useState(null);
  const [st, setSt] = useState(null);
  const [ul, setUl] = useState(null);
  const [gr, setGr] = useState('');
  const [radi, setRadi] = useState('');
  const [potvrda, setPotvrda] = useState(false);
  const [forma, setForma] = useState(false);

  const ucitaj = useCallback(async () => {
    setGr('');
    try {
      const p = await api('getTuyaSettings', pin);
      setPost(p);
      if (!p.postavljeno) { setForma(true); return; }
      api('tuyaStatus', pin).then(setSt).catch(e => setGr(e.message));
      api('getUlazi', pin, 7, true).then(setUl).catch(e => setGr(e.message));
    } catch (e) { setGr(e.message); }
  }, [pin]);
  useEffect(() => { ucitaj(); }, [ucitaj]);

  const akcija = async (naziv, fn) => {
    setRadi(naziv); setGr('');
    try { await fn(); } catch (e) { setGr(e.message); } finally { setRadi(''); }
  };
  const otkljucaj = () => akcija('vrata', async () => {
    const r = await api('tuyaOtkljucaj', pin); setPotvrda(false); pokaziToast('🔓 ' + r.poruka, 'ok'); vibriraj(30);
    api('getUlazi', pin, 7, false).then(setUl).catch(() => {});
  });
  const svjetla = upali => akcija('svjetla', async () => {
    await api('tuyaSvjetla', pin, upali); setSt(s => s && s.svjetla ? { ...s, svjetla: { ...s.svjetla, upaljeno: upali } } : s);
    pokaziToast(upali ? '💡 Svjetla upaljena.' : 'Svjetla ugašena.', 'ok');
  });
  const automatika = uklj => akcija('auto', async () => {
    await api('tuyaAutomatika', pin, uklj); setPost(p => ({ ...p, automatika: uklj }));
    pokaziToast(uklj ? '✓ Ulazi se sami povlače svakih 5 minuta.' : 'Automatsko povlačenje isključeno.', 'ok');
  });

  if (!post) return <>{gr ? <div className="err">{gr}</div> : <div className="info">Učitavam…</div>}</>;

  return (
    <>
      {gr && <div className="err">{gr}</div>}
      {post.postavljeno && (
        <>
          <div className="card">
            <div className="lab">VRATA</div>
            {!st ? <div className="sit">Provjeravam bravu…</div> : !st.brava ? <div className="sit">ID brave nije upisan (Postavke veze ispod).</div> : (
              <div className="ln"><span>{st.brava.naziv}</span>
                <b style={{ color: st.brava.greska || !st.brava.online ? 'var(--red)' : 'var(--green)' }}>
                  {st.brava.greska || (st.brava.online ? 'na mreži' : 'NIJE NA MREŽI')}{st.brava.baterija !== null && st.brava.baterija !== undefined ? ' · 🔋 ' + st.brava.baterija + (typeof st.brava.baterija === 'number' ? '%' : '') : ''}
                </b></div>
            )}
            {post.brava_id && <button className="btn" style={{ marginTop: 10 }} onClick={() => setPotvrda(true)}>🔓 OTKLJUČAJ VRATA</button>}
          </div>
          {post.svjetla_id && (
            <div className="card">
              <div className="lab">SVJETLA</div>
              {st && st.svjetla && <div className="ln"><span>{st.svjetla.naziv}</span>
                <b style={{ color: st.svjetla.upaljeno ? 'var(--gold)' : 'var(--dim)' }}>{st.svjetla.greska || (st.svjetla.upaljeno === null ? '—' : st.svjetla.upaljeno ? '💡 upaljena' : 'ugašena')}</b></div>}
              <div className="two" style={{ marginTop: 8 }}>
                <button className="btn2" style={{ flex: 1, color: 'var(--gold)', borderColor: 'var(--gold)' }} disabled={!!radi} onClick={() => svjetla(true)}>Upali</button>
                <button className="btn2" style={{ flex: 1 }} disabled={!!radi} onClick={() => svjetla(false)}>Ugasi</button>
              </div>
              <div className="sit" style={{ marginTop: 8 }}>Automatsko paljenje kad član otključa (i gašenje 1 h poslije) podešava se u Tuya aplikaciji — vidi uputu TUYA_POVEZIVANJE.</div>
            </div>
          )}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="lab" style={{ marginBottom: 0 }}>ULAZI (7 DANA)</div>
              <button className="chip" disabled={!!radi} onClick={() => akcija('ulazi', async () => { const r = await api('getUlazi', pin, 7, true); setUl(r); if (r.poruka) pokaziToast(r.poruka); })}>↻ Povuci s brave</button>
            </div>
            {!ul ? <div className="sit" style={{ marginTop: 8 }}>Učitavam…</div> : <>
              <div style={{ fontSize: 14, marginTop: 10 }}>Danas: <b>{ul.danas}</b> ulazaka{ul.sumnjivi ? <span style={{ color: 'var(--red)' }}> · ⚠ {ul.sumnjivi} za provjeru</span> : null}</div>
              <button className={'chip' + (post.automatika ? ' on' : '')} style={{ width: '100%', marginTop: 10 }} disabled={!!radi} onClick={() => automatika(!post.automatika)}>
                {post.automatika ? '✓ Automatski svakih 5 min (klikni da isključiš)' : 'Uključi automatsko povlačenje ulaza'}
              </button>
            </>}
          </div>
          {ul && ul.ulazi.length > 0 && (
            <div className="card0">
              {ul.ulazi.map(u => (
                <div className="row" key={u.izvor_id} style={u.napomena ? { background: 'rgba(229,84,75,.07)' } : {}}>
                  <span style={{ fontSize: 14.5 }}>{u.ime || u.korisnik_brave || 'Nepoznat'}
                    <div className="sit">{u.nacin}{u.clanarina ? ' · ' + u.clanarina : ''}</div>
                    {u.napomena && <div className="sit" style={{ color: 'var(--red)' }}>⚠ {u.napomena}</div>}
                  </span>
                  <span className="sit" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{dT(u.datum).slice(0, 6)}<br /><b style={{ color: 'var(--text)', fontSize: 15 }}>{u.vrijeme}</b></span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {!forma && <button className="btn2" onClick={() => setForma(true)}>Postavke veze s Tuyom</button>}
      {forma && <TuyaForma post={post} pin={pin} gotovo={poruka => { setForma(false); pokaziToast('✓ ' + poruka, 'ok'); ucitaj(); }} />}
      {potvrda && (
        <Sheet naslov="Otključati vrata?" zatvori={() => setPotvrda(false)}>
          <div className="warn">Vrata će se otključati odmah, odakle god da si. Ulazak se bilježi kao "Daljinski (vlasnik)".</div>
          <button className="btn" style={{ marginTop: 12 }} disabled={radi === 'vrata'} onClick={otkljucaj}>{radi === 'vrata' ? 'Otključavam…' : 'Da, otključaj'}</button>
          <button className="btn2" style={{ marginTop: 10 }} onClick={() => setPotvrda(false)}>Odustani</button>
        </Sheet>
      )}
    </>
  );
}

function TuyaForma({ post, pin, gotovo }) {
  const [x, setX] = useState({ access_id: post.access_id || '', secret: '', region: post.region || 'eu', brava_id: post.brava_id || '', svjetla_id: post.svjetla_id || '', svjetla_kod: post.svjetla_kod || 'switch_1' });
  const [radi, setRadi] = useState(false);
  const [gr, setGr] = useState('');
  const polje = (k, lab, ph, tip) => (
    <div style={{ marginTop: 10 }}><div className="lab">{lab}</div>
      <input className="inp" type={tip || 'text'} autoCapitalize="off" autoCorrect="off" spellCheck={false} value={x[k]} placeholder={ph} onChange={e => setX({ ...x, [k]: e.target.value.trim() })} /></div>
  );
  return (
    <div className="card">
      <div className="lab">VEZA S TUYOM</div>
      <div className="sit">Podatke dobiješ na iot.tuya.com (korak po korak u uputi TUYA_POVEZIVANJE). Secret se čuva samo na Google serveru i nikad se više ne prikazuje.</div>
      {polje('access_id', 'ACCESS ID / CLIENT ID', '')}
      {polje('secret', 'ACCESS SECRET', post.ima_secret ? '•••••• (sačuvan — ostavi prazno)' : '', 'password')}
      <div className="lab" style={{ marginTop: 10 }}>DATA CENTAR</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[['eu', 'Central Europe'], ['weu', 'Western Europe'], ['us', 'America'], ['in', 'India'], ['cn', 'China']].map(([k, n]) =>
          <button key={k} className={'chip' + (x.region === k ? ' on' : '')} onClick={() => setX({ ...x, region: k })}>{n}</button>)}
      </div>
      {polje('brava_id', 'DEVICE ID BRAVE', 'npr. bf12ab34cd56ef7890xyz')}
      {polje('svjetla_id', 'DEVICE ID PREKIDAČA ZA SVJETLA (NIJE OBAVEZNO)', '')}
      {polje('svjetla_kod', 'KOD PREKIDAČA', 'switch_1')}
      {gr && <div className="err" style={{ marginTop: 10 }}>{gr}</div>}
      <button className="btn" style={{ marginTop: 12 }} disabled={radi || !x.access_id} onClick={async () => {
        setRadi(true); setGr('');
        try { const r = await api('saveTuyaSettings', pin, x); gotovo(r.provjera); } catch (e) { setGr(e.message); } finally { setRadi(false); }
      }}>{radi ? 'Provjeravam vezu…' : 'Sačuvaj i provjeri vezu'}</button>
    </div>
  );
}

/* ═══════ VLASNIK: POSTAVKE ═══════ */
function AdminPostavke({ d, osvjezi, pin, setPin, pokaziToast }) {
  return (
    <>
      <AdminListe d={d} pin={pin} osvjezi={osvjezi} pokaziToast={pokaziToast} />
      <AdminPin pin={pin} setPin={setPin} pokaziToast={pokaziToast} />
    </>
  );
}

function AdminListe({ d, pin, osvjezi, pokaziToast }) {
  const [radnici, setRadnici] = useState((d.radnici || []).join(', '));
  const [treneri, setTreneri] = useState((d.treneri || []).join(', '));
  const [radi, setRadi] = useState(false);
  const [gr, setGr] = useState('');
  return (
    <div className="card">
      <div className="lab">RADNICI I TRENERI</div>
      <div className="sit">Imena odvoji zarezom. Radnici su dugmad na prvom ekranu, a treneri se biraju pri prodaji paketa s trenerom.</div>
      <div className="lab" style={{ marginTop: 12 }}>RADNICI NA ŠANKU</div>
      <input className="inp" value={radnici} onChange={e => setRadnici(e.target.value)} placeholder="Kenan, Edin" />
      <div className="lab" style={{ marginTop: 12 }}>TRENERI</div>
      <input className="inp" value={treneri} onChange={e => setTreneri(e.target.value)} placeholder="Kenan, Edin" />
      {gr && <div className="err" style={{ marginTop: 10 }}>{gr}</div>}
      <button className="btn" style={{ marginTop: 12 }} disabled={radi} onClick={async () => {
        setRadi(true); setGr('');
        try { await api('saveLists', pin, { radnici, treneri }); pokaziToast('✓ Sačuvano. Radnik promjenu vidi kad ponovo otvori aplikaciju.', 'ok'); osvjezi(); }
        catch (e) { setGr(e.message); } finally { setRadi(false); }
      }}>Sačuvaj</button>
    </div>
  );
}

function AdminPin({ pin, setPin, pokaziToast }) {
  const [novi, setNovi] = useState('');
  const [opet, setOpet] = useState('');
  const [gr, setGr] = useState('');
  const [radi, setRadi] = useState(false);
  return (
    <div className="card">
      <div className="lab">PROMJENA PIN-A</div>
      <div className="sit">PIN štiti pregled, proizvode, vrata i svjetla. Radnik ga ne smije znati. Nakon 5 pogrešnih pokušaja pristup se zaključa na 10 minuta.</div>
      <input className="inp" style={{ marginTop: 10, letterSpacing: 6, textAlign: 'center' }} type="password" inputMode="numeric" placeholder="novi PIN (4–8 cifara)"
        value={novi} onChange={e => setNovi(e.target.value.replace(/\D/g, '').slice(0, 8))} />
      <input className="inp" style={{ marginTop: 8, letterSpacing: 6, textAlign: 'center' }} type="password" inputMode="numeric" placeholder="ponovi novi PIN"
        value={opet} onChange={e => setOpet(e.target.value.replace(/\D/g, '').slice(0, 8))} />
      {opet && novi !== opet && <div className="sit" style={{ color: 'var(--red)' }}>PIN-ovi se ne poklapaju.</div>}
      {gr && <div className="err" style={{ marginTop: 10 }}>{gr}</div>}
      <button className="btn" style={{ marginTop: 12 }} disabled={radi || novi.length < 4 || novi !== opet} onClick={async () => {
        setRadi(true); setGr('');
        try { await api('changePin', pin, novi); setPin(novi); setNovi(''); setOpet(''); pokaziToast('✓ PIN promijenjen.', 'ok'); }
        catch (e) { setGr(e.message); } finally { setRadi(false); }
      }}>Promijeni PIN</button>
    </div>
  );
}

function AdminSmjene({ pin, pokaziToast }) {
  const [lista, setLista] = useState(null);
  const [otvoren, setOtvoren] = useState(null);
  const [detalj, setDetalj] = useState(null);
  const [gr, setGr] = useState('');
  useEffect(() => { api('getHistory', pin, 40).then(r => setLista(r.smjene)).catch(e => { setGr(e.message); setLista([]); }); }, [pin]);
  const otvori = async (id) => {
    if (otvoren === id) { setOtvoren(null); return; }
    setOtvoren(id); setDetalj(null);
    try { const r = await api('getShiftDetails', pin, id); setDetalj(r.izvjestaj); } catch (e) { setGr(e.message); }
  };
  return (
    <>
      {gr && <div className="err">{gr}</div>}
      {!lista && <div className="info">Učitavam…</div>}
      {lista && !lista.length && <div className="info">Još nema smjena.</div>}
      {lista && lista.map(s => (
        <div className="card0" key={s.shift_id} style={s.broj_razlika || s.kasa_razlika ? { borderColor: 'rgba(229,84,75,.6)' } : {}}>
          <button onClick={() => otvori(s.shift_id)} className="listbtn" style={{ borderBottom: 'none' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{dT(s.datum)} · {s.radnik}</div>
              <div className="sit">{s.pocetak}–{s.kraj || '…'} · {s.prodano} kom{s.status === 'OPEN' ? ' · U TOKU' : ''}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--gold)', fontWeight: 700 }}>{km(s.promet)} KM</div>
              <div className="sit" style={{ color: s.broj_razlika || s.kasa_razlika ? 'var(--red)' : 'var(--green)' }}>
                {s.status === 'OPEN' ? '' : s.broj_razlika || s.kasa_razlika
                  ? [s.broj_razlika ? s.broj_razlika + ' razl. ' + km(s.vrijednost_razlike) : '', s.kasa_razlika ? 'kasa ' + km(s.kasa_razlika) : ''].filter(Boolean).join(' · ')
                  : 'sve se poklapa'}
              </div>
            </div>
          </button>
          {otvoren === s.shift_id && (
            <div style={{ borderTop: '1px solid var(--line)' }}>
              {!detalj ? <div className="info" style={{ border: 'none' }}>Učitavam…</div> : <Izvjestaj izv={detalj} uAdminu pokaziToast={pokaziToast} />}
            </div>
          )}
        </div>
      ))}
    </>
  );
}

function AdminMjesec({ d }) {
  const m = d.mjesec;
  return (
    <>
      <div className="sit">Od {dT(d.periodi.mjesecOd)} do danas · {m.smjena} zatvorenih smjena</div>
      <div className="two">
        <Broj lab="PROMET" v={km(m.promet)} boja="var(--gold)" sit={m.kom + ' kom'} />
        <Broj lab="PROFIT" v={km(m.profit)} boja="var(--green)" />
      </div>
      <div className="two">
        <Broj lab="MANJAK ROBE" v={km(m.manjak_km)} boja={m.manjak_km < 0 ? 'var(--red)' : 'var(--text)'} sit={m.visak_km ? 'višak ' + km(m.visak_km) + ' KM' : ''} />
        <Broj lab="RAZLIKE KASE" v={km(m.kasa_razlike)} boja={m.kasa_razlike ? 'var(--red)' : 'var(--text)'} />
      </div>
      <div className="card">
        <div className="lab">TOP PROIZVODI (PO PROMETU)</div>
        {!m.top.length && <div className="sit">Još nema prodaje.</div>}
        {m.top.map((t, i) => <div className="ln" key={t.product_id}><span>{i + 1}. {t.naziv}</span><b>{t.kom} kom · {km(t.promet)} KM <span style={{ color: 'var(--green)', fontWeight: 400 }}>({km(t.profit)})</span></b></div>)}
      </div>
      <div className="card">
        <div className="lab">PO RADNIKU</div>
        {!m.po_radniku.length && <div className="sit">Još nema prodaje.</div>}
        {m.po_radniku.map(r => <div className="ln" key={r.radnik}><span>{r.radnik}</span><b>{r.kom} kom · {km(r.promet)} KM</b></div>)}
      </div>
      <div className="sit">Detaljna tabela po proizvodima je u Google Sheetu, tab PREGLED.</div>
    </>
  );
}

/* ═══════ SITNO ═══════ */
function Sheet({ naslov, zatvori, children }) {
  return (
    <div className="ovl" onClick={zatvori}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 17, fontWeight: 600 }}>{naslov}</span>
          <button onClick={zatvori} aria-label="Zatvori" style={{ width: 44, height: 44, background: 'none', border: 'none', color: 'var(--dim)', fontSize: 20 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
