/* End-to-end: pravi browser (telefon) + Index.html + Code.gs (mock Sheet) iza google.script.run */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { napraviOkruzenje } = require('./gas-mock.cjs');
const { lazniTuya, ID, SECRET, BRAVA, SVJETLA } = require('./lazni-tuya.cjs');

let playwright = null;
try { playwright = require('playwright'); } catch (e) { /* nema browsera — test se preskače */ }

const ROOT = path.join(__dirname, '..');
const SLIKE = process.env.ADIN_SLIKE || path.join(ROOT, 'tests', 'slike');
const URL = 'https://adin.test/';

const SHIM = `
(() => {
  function runner() {
    let ok = function () {}, fail = function () {};
    const t = {
      withSuccessHandler(f) { ok = f; return p; },
      withFailureHandler(f) { fail = f; return p; }
    };
    const p = new Proxy(t, { get(o, k) {
      if (k in o) return o[k];
      return (...args) => {
        window.__gas(String(k), JSON.stringify(args)).then(r => {
          const v = JSON.parse(r);
          if (v && v.__mreza) fail(new Error('NetworkError: Connection failure due to HTTP 0')); else ok(v);
        });
      };
    }});
    return p;
  }
  window.google = { script: { get run() { return runner(); } } };
})();`;

async function noviTelefon(browser, g, stanje) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, locale: 'bs-BA', timezoneId: 'Europe/Sarajevo' });
  await ctx.exposeBinding('__gas', async (_src, ime, argsJson) => {
    await new Promise(r => setTimeout(r, 40));
    if (stanje.offline) return JSON.stringify({ __mreza: true });
    stanje.pozivi.push(ime);
    return JSON.stringify(g[ime](...JSON.parse(argsJson)));
  });
  await ctx.addInitScript(SHIM);
  await ctx.route('**/*', route => {
    const u = route.request().url();
    if (u === URL) return route.fulfill({ contentType: 'text/html; charset=utf-8', body: fs.readFileSync(path.join(ROOT, 'Index.html')) });
    if (u.includes('react-dom.production.min.js')) return route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(path.join(ROOT, 'node_modules/react-dom/umd/react-dom.production.min.js')) });
    if (u.includes('react.production.min.js')) return route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(path.join(ROOT, 'node_modules/react/umd/react.production.min.js')) });
    return route.fulfill({ status: 200, body: '' }); // fontovi i sl.
  });
  const page = await ctx.newPage();
  const greske = [];
  page.on('pageerror', e => greske.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') greske.push(m.text()); });
  await page.goto(URL);
  return { ctx, page, greske };
}

const pauza = ms => new Promise(r => setTimeout(r, ms));

async function upisiBrojanje(page, vrijednosti) {
  const inputi = await page.locator('input[data-pid]').all();
  for (const inp of inputi) {
    const pid = await inp.getAttribute('data-pid');
    await inp.fill(String(vrijednosti[pid] !== undefined ? vrijednosti[pid] : 0));
  }
}
async function tap(page, pid, n = 1) {
  for (let i = 0; i < n; i++) { await page.locator(`[data-tile="${pid}"]`).click(); await pauza(220); }
}
async function cekajSync(page) {
  await page.getByTestId('sync').filter({ hasText: 'Sve spremljeno' }).waitFor({ timeout: 15000 });
}

test('E2E: scenarij prihvatanja kroz pravi ekran + offline, undo, dupli tap, drugi telefon, vlasnik', { skip: !playwright && 'playwright nije instaliran', timeout: 180000 }, async () => {
  fs.mkdirSync(SLIKE, { recursive: true });
  const g = napraviOkruzenje({ sada: () => new Date() });
  g.setupSpreadsheet();
  const browser = await playwright.chromium.launch();
  const st1 = { offline: false, pozivi: [] };
  const { page, greske } = await noviTelefon(browser, g, st1);
  try {
    /* ── 1. Ko je na smjeni ── */
    await page.getByText('Ko je na smjeni?').waitFor();
    await page.screenshot({ path: path.join(SLIKE, '1-radnik.png') });
    await page.getByRole('button', { name: 'Kenan', exact: true }).click();
    await page.getByRole('button', { name: /Dalje/ }).click();

    /* ── 2. Početna inventura ── */
    await page.getByText('Prebroji početno stanje').waitFor();
    const dugme = page.getByRole('button', { name: /za prebrojati|ZAPOČNI/ });
    assert.match(await dugme.textContent(), /Još 12 za prebrojati/);
    assert.equal(await dugme.isDisabled(), true);
    await upisiBrojanje(page, { redbull: 10, voda05: 15 });
    await page.screenshot({ path: path.join(SLIKE, '2-pocetna.png'), fullPage: false });
    await page.getByRole('button', { name: 'ZAPOČNI SMJENU' }).click();

    /* ── 3. Prodaja ── */
    await page.locator('[data-tile="redbull"]').waitFor();
    await tap(page, 'redbull', 2);
    await tap(page, 'voda05', 3);
    assert.match(await page.getByTestId('undo').textContent(), /Voda 0,5 L \+1 \(×3\)/);
    assert.match(await page.getByTestId('promet').textContent(), /11,00/);
    await page.screenshot({ path: path.join(SLIKE, '3-smjena.png') });

    // Dopuna Red Bull +5
    await page.getByRole('button', { name: '+ DOPUNA ZALIHE' }).click();
    await page.locator('[data-dopuna="redbull"]').click();
    await page.getByTestId('dopuna-kol').fill('5');
    await page.getByRole('button', { name: 'Dodaj 5 kom' }).click();
    await cekajSync(page);
    assert.match(await page.locator('[data-tile="redbull"]').textContent(), /ima 13/);

    /* ── 4. Završna inventura ── */
    await page.getByRole('button', { name: 'ZAVRŠI SMJENU' }).click();
    await page.getByRole('button', { name: 'Da, idem brojati' }).click();
    await page.getByText('Prebroji završno stanje').waitFor();
    const tekstBrojanja = await page.locator('#root').textContent();
    assert.ok(!/očekivano|prošli put/i.test(tekstBrojanja), 'radnik ne vidi očekivano stanje dok broji');
    await upisiBrojanje(page, { redbull: 12, voda05: 12 });
    await page.getByRole('button', { name: 'DALJE — KASA' }).click();
    await page.getByTestId('kasa').fill('11,00');
    assert.ok(!/Treba biti/.test(await page.locator('#root').textContent()), 'očekivana kasa se ne vidi prije unosa');
    await page.getByRole('button', { name: 'PROVJERI' }).click();
    await page.getByText('✓ poklapa se').waitFor();
    await page.getByText('⚠ 1 proizvod se ne poklapa').waitFor();
    const zavrsi = page.getByRole('button', { name: 'ZAVRŠI SMJENU' });
    assert.equal(await zavrsi.isDisabled(), true, 'razlog je obavezan');
    await page.screenshot({ path: path.join(SLIKE, '4-kasa.png') });
    await page.getByRole('button', { name: 'Ne znam' }).click();
    await zavrsi.click();

    /* ── 5. Izvještaj ── */
    await page.getByTestId('izv-promet').waitFor();
    assert.match(await page.getByTestId('izv-promet').textContent(), /11,00/);
    assert.match(await page.getByTestId('poklapa').textContent(), /11 proizvoda se poklapa/);
    assert.match(await page.getByTestId('razlike').textContent(), /1 proizvod ima razliku · −4,00 KM/);
    assert.match(await page.getByTestId('razlika-redbull').textContent(), /-1 kom · −4,00 KM/);
    assert.match(await page.getByTestId('kasa-razlika').textContent(), /0,00/);
    assert.equal(await page.locator('[data-testid^="razlika-"]').count(), 1, 'detalji samo za proizvod s razlikom');
    await page.screenshot({ path: path.join(SLIKE, '5-izvjestaj.png'), fullPage: true });

    const dog = g.__tabela('DOGADJAJI');
    assert.equal(dog.length, 6);
    assert.equal(new Set(dog.map(d => d.event_id)).size, 6);
    const sm = g.__tabela('SMJENE')[0];
    assert.equal(sm.status, 'CLOSED'); assert.equal(sm.promet, 11); assert.equal(sm.kasa_razlika, 0); assert.equal(sm.vrijednost_razlike, -4);

    /* ── Druga smjena: sugestija, dupli tap, undo, offline, refresh, drugi telefon ── */
    await page.getByRole('button', { name: 'Gotovo' }).click();
    await page.getByRole('button', { name: 'Edvin', exact: true }).click();
    await page.getByRole('button', { name: /Dalje/ }).click();
    await page.getByText('prošli put: 12').first().waitFor();
    assert.equal(await page.locator('input[data-pid="redbull"]').inputValue(), '', 'sugestija se ne upisuje automatski');
    await upisiBrojanje(page, { redbull: 12, voda05: 12, kong: 6 });
    await page.getByRole('button', { name: 'ZAPOČNI SMJENU' }).click();
    await page.locator('[data-tile="kong"]').waitFor();

    // dupli tap (dva klika odmah jedan za drugim) = 1 prodaja
    await page.locator('[data-tile="kong"]').dblclick();
    await pauza(250);
    assert.equal((await page.locator('[data-tile="kong"] .badge').textContent()).trim(), '1');
    // poništi
    await page.getByRole('button', { name: 'PONIŠTI' }).click();
    assert.equal(await page.locator('[data-tile="kong"] .badge').count(), 0);
    await cekajSync(page);
    const kong = g.__tabela('DOGADJAJI').filter(d => d.product_id === 'kong');
    assert.deepEqual(kong.map(d => [d.tip_dogadjaja, d.kolicina]), [['SALE', 1], ['UNDO_SALE', -1]]);

    // offline: prodaja radi i čeka u redu
    st1.offline = true;
    await tap(page, 'redbull', 2);
    await page.getByTestId('sync').filter({ hasText: /2 čekaju/ }).waitFor({ timeout: 8000 });
    await page.getByTestId('sync').filter({ hasText: /nema veze/ }).waitFor({ timeout: 8000 });
    assert.match(await page.getByTestId('promet').textContent(), /8,00/);
    await page.screenshot({ path: path.join(SLIKE, '6-offline.png') });
    const prije = g.__tabela('DOGADJAJI').length;
    st1.offline = false;
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await cekajSync(page);
    assert.equal(g.__tabela('DOGADJAJI').length, prije + 2);

    // refresh: smjena se vraća
    await page.reload();
    await page.getByTestId('radnik').filter({ hasText: 'Edvin' }).waitFor();
    assert.equal((await page.locator('[data-tile="redbull"] .badge').textContent()).trim(), '2');

    // paket: mjesečna karta + lični trener (Edin), novi član
    await page.locator('[data-tile="clanarina"]').click();
    await page.getByRole('button', { name: '+ Novi član' }).click();
    await page.getByPlaceholder('npr. Amel Hodžić').fill('Nermin Test');
    await page.getByPlaceholder('06x xxx xxx').fill('061 555 444');
    await page.getByRole('button', { name: 'Dalje', exact: true }).click();
    await page.locator('[data-karta="clan30"]').click();
    await page.locator('[data-trener-paket="trener"]').click();
    assert.match(await page.getByRole('button', { name: /Izaberi trenera/ }).textContent(), /Izaberi trenera/);
    await page.locator('[data-trener="Edin"]').click();
    assert.match(await page.getByTestId('paket-ukupno').textContent(), /90,00/);
    await page.screenshot({ path: path.join(SLIKE, '6b-paket.png') });
    await page.getByRole('button', { name: /NAPLAĆENO 90,00 KM/ }).click();
    await cekajSync(page);
    const nermin = g.__tabela('CLANOVI').find(c => c.ime === 'Nermin Test');
    assert.equal(nermin.trener, 'Edin');
    assert.ok(nermin.istek && nermin.trener_do);
    await page.screenshot({ path: path.join(SLIKE, '6c-smjena-karte.png') });

    // napomena za vlasnika
    await page.getByRole('button', { name: '✎ Napomena za vlasnika' }).click();
    await page.getByTestId('napomena').fill('Frižider ne hladi');
    await page.getByRole('button', { name: 'Zapiši napomenu' }).click();
    await cekajSync(page);
    assert.ok(g.__tabela('DOGADJAJI').some(d => d.tip_dogadjaja === 'NAPOMENA' && d.napomena === 'Frižider ne hladi'));

    // drugi telefon: odmah na aktivnu smjenu iz Sheeta
    const st2 = { offline: false, pozivi: [] };
    const t2 = await noviTelefon(browser, g, st2);
    await t2.page.getByTestId('radnik').filter({ hasText: 'Edvin' }).waitFor();
    assert.match(await t2.page.getByTestId('promet').textContent(), /98,00/);

    // telefon 1 offline proda još jedan; u međuvremenu vlasnik (telefon 2) zatvori smjenu bez brojanja
    st1.offline = true;
    await tap(page, 'voda05', 1);
    await t2.page.getByRole('button', { name: 'ZAVRŠI SMJENU' }).waitFor();
    // vlasnik ulazi sa početnog ekrana — na telefonu 2 otvori pregled preko novog konteksta bez smjene nije moguće,
    // zato koristimo API direktno kao da je vlasnik u pregledu, pa provjeravamo UI vlasnika posebno ispod
    const otv = g.getAdminData('2580').otvorena;
    assert.ok(otv);
    g.adminCloseShift('2580', otv.shift_id, 'test zatvaranja');
    st1.offline = false;
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await page.getByText(/zatvorena na drugom uređaju/).waitFor({ timeout: 15000 });
    await page.getByText('Ko je na smjeni?').waitFor({ timeout: 15000 });
    await cekajSync(page);

    /* ── Vlasnik ── */
    await page.getByRole('button', { name: 'Vlasnik ›' }).click();
    await page.locator('input[type="password"]').fill('1111');
    await page.getByRole('button', { name: 'Uđi' }).click();
    await page.getByText('Pogrešan PIN.').waitFor();
    await page.locator('input[type="password"]').fill('2580');
    await page.getByRole('button', { name: 'Uđi' }).click();
    await page.getByText('PLATA RADNIKA', { exact: false }).waitFor();
    await page.screenshot({ path: path.join(SLIKE, '7-vlasnik.png'), fullPage: true });
    await page.getByRole('button', { name: 'Smjene' }).click();
    await page.getByText('Kenan').first().waitFor();
    await page.locator('.listbtn').last().click();
    await page.getByTestId('razlika-redbull').waitFor();
    await page.getByRole('button', { name: 'Zalihe' }).click();
    await page.getByRole('button', { name: 'Mjesec' }).click();
    await page.getByText('TOP PROIZVODI').waitFor();
    await page.screenshot({ path: path.join(SLIKE, '8-mjesec.png'), fullPage: true });

    await page.getByRole('button', { name: 'Karte', exact: true }).click();
    await page.getByText('ČLANOVI S TRENEROM').waitFor();
    await page.getByText('Nermin Test').waitFor();
    await page.screenshot({ path: path.join(SLIKE, '8b-karte.png'), fullPage: true });

    // vlasnik dodaje novi proizvod
    await page.getByRole('button', { name: 'Proizvodi', exact: true }).click();
    await page.getByRole('button', { name: '+ Novi proizvod / ponuda' }).click();
    await page.getByTestId('p-naziv').fill('Monster');
    await page.getByTestId('p-cijena').fill('4,50');
    await page.getByTestId('p-nabavna').fill('2,60');
    await page.getByRole('button', { name: 'Sačuvaj' }).click();
    await page.locator('[data-proizvod="monster"]').waitFor();
    assert.equal(g.__tabela('PROIZVODI').find(p => p.product_id === 'monster').cijena, 4.5);

    // vrata: povezivanje s Tuyom, otključavanje, svjetla, ulazi
    const tuya = lazniTuya([{ id: 7, update_time: Date.now() - 60000, status: [{ code: 'unlock_card', value: 'CHIP-1' }] }]);
    g.__postaviFetch(tuya.fetch);
    await page.getByRole('button', { name: 'Vrata', exact: true }).click();
    await page.getByText('VEZA S TUYOM').waitFor();
    const inputi = page.locator('.card input');
    await inputi.nth(0).fill(ID);
    await inputi.nth(1).fill(SECRET);
    await inputi.nth(2).fill(BRAVA);
    await inputi.nth(3).fill(SVJETLA);
    await page.getByRole('button', { name: 'Sačuvaj i provjeri vezu' }).click();
    await page.getByText('Veza s Tuyom radi.').waitFor();
    await page.getByText('Ulazna vrata').waitFor();
    await page.getByText(/Danas: 1/).waitFor();
    await page.getByRole('button', { name: '🔓 OTKLJUČAJ VRATA' }).click();
    await page.getByRole('button', { name: 'Da, otključaj' }).click();
    await page.getByText('Vrata su otključana.').waitFor();
    assert.equal(tuya.stanje.otkljucano, 1);
    await page.getByRole('button', { name: 'Upali' }).click();
    await page.getByText('💡 upaljena').waitFor();
    assert.equal(tuya.stanje.svjetlo, true);
    await pauza(4000);
    await page.screenshot({ path: path.join(SLIKE, '9-vrata.png'), fullPage: true });
    assert.equal(tuya.stanje.losPotpis, 0);

    assert.deepEqual(greske.filter(x => !/favicon|Failed to load resource/.test(x)), [], 'nema JS grešaka u browseru');
    assert.deepEqual(t2.greske.filter(x => !/favicon|Failed to load resource/.test(x)), []);
    await t2.ctx.close();
  } finally {
    await browser.close();
  }
});
