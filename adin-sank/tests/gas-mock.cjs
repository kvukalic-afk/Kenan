/**
 * Mock Google Apps Script okruženja (SpreadsheetApp, LockService, Utilities, ...)
 * Code.gs se učitava u izolovani vm kontekst, isto kao na Googleovom serveru (globalne funkcije).
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

function kolonaUBroj(slova) {
  let n = 0;
  for (const ch of slova.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

function parseA1(a1) {
  const m = String(a1).match(/^([A-Z]+)(\d+)?(?::([A-Z]+)(\d+)?)?$/i);
  if (!m) throw new Error('Mock: ne razumijem A1 ' + a1);
  const c1 = kolonaUBroj(m[1]);
  const r1 = m[2] ? +m[2] : 1;
  const c2 = m[3] ? kolonaUBroj(m[3]) : c1;
  const r2 = m[4] ? +m[4] : (m[3] ? (m[2] ? +m[2] : 1000) : r1);
  return { r: r1, c: c1, nr: r2 - r1 + 1, nc: c2 - c1 + 1 };
}

/** Objekat kome svaka nepoznata metoda vraća samog sebe (formatiranje i sl.). */
function chain(target) {
  return new Proxy(target, {
    get(t, prop) {
      if (prop in t) return t[prop];
      if (typeof prop === 'symbol') return undefined;
      return () => chain(t);
    }
  });
}

class MockSheet {
  constructor(name, ss) {
    this.name = name; this.ss = ss; this.data = []; this.formule = {}; this.maxRows = 1000;
  }
  getName() { return this.name; }
  getLastRow() {
    for (let i = this.data.length - 1; i >= 0; i--) {
      if ((this.data[i] || []).some(v => v !== '' && v !== null && v !== undefined)) return i + 1;
    }
    return 0;
  }
  getLastColumn() {
    let m = 0;
    for (const r of this.data) {
      if (!r) continue;
      for (let j = r.length - 1; j >= 0; j--) if (r[j] !== '' && r[j] !== null && r[j] !== undefined) { m = Math.max(m, j + 1); break; }
    }
    return m;
  }
  getMaxRows() { return this.maxRows; }
  getRange(a, b, c, d) {
    let r, col, nr, nc;
    if (typeof a === 'string') ({ r, c: col, nr, nc } = parseA1(a));
    else { r = a; col = b; nr = c || 1; nc = d || 1; }
    return new MockRange(this, r, col, nr, nc);
  }
  getDataRange() { return this.getRange(1, 1, Math.max(1, this.getLastRow()), Math.max(1, this.getLastColumn())); }
  clear() { this.data = []; this.formule = {}; return this; }
  _set(r, c, v) {
    while (this.data.length < r) this.data.push([]);
    const row = this.data[r - 1];
    while (row.length < c) row.push('');
    row[c - 1] = v;
  }
  _get(r, c) {
    const row = this.data[r - 1];
    if (!row) return '';
    const v = row[c - 1];
    return v === undefined || v === null ? '' : v;
  }
}
const SheetProxy = (sh) => chain(sh);

class MockRange {
  constructor(sheet, r, c, nr, nc) { this.sheet = sheet; this.r = r; this.c = c; this.nr = nr; this.nc = nc; return chain(this); }
  getValues() {
    const out = [];
    for (let i = 0; i < this.nr; i++) {
      const row = [];
      for (let j = 0; j < this.nc; j++) row.push(this.sheet._get(this.r + i, this.c + j));
      out.push(row);
    }
    return out;
  }
  getValue() { return this.sheet._get(this.r, this.c); }
  setValues(v) {
    if (v.length !== this.nr || v.some(row => row.length !== this.nc)) {
      throw new Error(`Mock setValues: dimenzije ${v.length}x${v[0] && v[0].length} ne odgovaraju ${this.nr}x${this.nc}`);
    }
    v.forEach((row, i) => row.forEach((x, j) => {
      if (x instanceof Date) throw new Error('Mock: Date u ćeliji nije očekivan');
      this.sheet._set(this.r + i, this.c + j, x === undefined ? '' : x);
    }));
    return this;
  }
  setValue(x) { this.sheet._set(this.r, this.c, x); return this; }
  setFormula(f) { this.sheet._set(this.r, this.c, f); this.sheet.formule[this.r + ',' + this.c] = f; return this; }
  setFormulas(f) { f.forEach((row, i) => row.forEach((x, j) => this.sheet._set(this.r + i, this.c + j, x))); return this; }
}

class MockSpreadsheet {
  constructor() { this.sheets = [SheetProxy(new MockSheet('Sheet1', this))]; this.tz = 'Etc/GMT'; }
  getSheetByName(n) { return this.sheets.find(s => s.getName() === n) || null; }
  insertSheet(n) { const s = SheetProxy(new MockSheet(n, this)); this.sheets.push(s); return s; }
  getSheets() { return this.sheets.slice(); }
  deleteSheet(s) { this.sheets = this.sheets.filter(x => x !== s); }
  setSpreadsheetTimeZone(tz) { this.tz = tz; }
  getSpreadsheetTimeZone() { return this.tz; }
}

function formatDate(d, tz, f) {
  const parts = {};
  new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).formatToParts(d).forEach(p => { parts[p.type] = p.value; });
  const map = { yyyy: parts.year, MM: parts.month, dd: parts.day, HH: parts.hour, mm: parts.minute, ss: parts.second };
  return f.replace(/yyyy|MM|dd|HH|mm|ss/g, t => map[t]);
}

/**
 * Napravi novo okruženje s praznim Sheetom i učitanim Code.gs.
 * opcije.sada: Date ili funkcija koja vraća Date (kontrola sata).
 */
function napraviOkruzenje(opcije = {}) {
  const ss = chain(new MockSpreadsheet());
  const stats = { lockovi: 0, aktivniLock: false, flush: 0 };
  const ctx = {
    console: { log() {}, error() {}, warn() {} },
    Logger: { log() {} },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ss,
      getActive: () => ss,
      flush: () => { stats.flush++; },
      newDataValidation: () => chain({}),
      getUi: () => { throw new Error('nema UI'); }
    },
    LockService: {
      getScriptLock: () => ({
        waitLock() { if (stats.aktivniLock) throw new Error('lock zauzet'); stats.aktivniLock = true; stats.lockovi++; },
        releaseLock() { stats.aktivniLock = false; }
      })
    },
    Utilities: { formatDate, getUuid: () => crypto.randomUUID() },
    HtmlService: { createHtmlOutputFromFile: () => chain({}) },
    Session: { getScriptTimeZone: () => 'Europe/Sarajevo' }
  };
  vm.createContext(ctx);
  const kod = fs.readFileSync(path.join(__dirname, '..', 'Code.gs'), 'utf8');
  vm.runInContext(kod, ctx, { filename: 'Code.gs' });
  let sat = opcije.sada || null;
  ctx.nowDate_ = () => {
    if (!sat) return new Date();
    return typeof sat === 'function' ? sat() : new Date(sat.getTime());
  };
  ctx.__postaviSat = (d) => { sat = d; };
  ctx.__ss = ss;
  ctx.__stats = stats;
  /** Pomoćno: tabela kao niz objekata. */
  ctx.__tabela = (ime) => {
    const sh = ss.getSheetByName(ime);
    const v = sh.getDataRange().getValues();
    const kol = v[0];
    return v.slice(1).filter(r => r.some(x => x !== '')).map(r => Object.fromEntries(kol.map((k, i) => [k, r[i]])));
  };
  return ctx;
}

module.exports = { napraviOkruzenje, formatDate };
