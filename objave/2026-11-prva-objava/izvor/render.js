// Renderuje karusel u PNG: node render.js
// Feed 4:5 (1080x1350) za Instagram/Facebook i 9:16 (1080x1920) za TikTok foto-mod.
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const file = 'file://' + path.join(__dirname, 'karusel.html');
  const out = path.join(__dirname, '..');
  for (const [f, dir, h] of [['feed', 'feed-4x5', 1350], ['tall', 'tiktok-9x16', 1920]]) {
    const page = await browser.newPage({ viewport: { width: 1080, height: h }, deviceScaleFactor: 1 });
    await page.goto(`${file}?f=${f}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const ok = await page.evaluate(() => document.fonts.check('800 40px Poppins') && document.fonts.check('italic 600 40px Lora'));
    if (!ok) throw new Error('Fontovi se nisu učitali');
    for (let i = 1; i <= 7; i++) {
      await page.locator(`#s${i}`).screenshot({ path: path.join(out, dir, `slajd-${String(i).padStart(2, '0')}.png`) });
    }
    await page.close();
  }
  await browser.close();
  console.log('Gotovo');
})();
