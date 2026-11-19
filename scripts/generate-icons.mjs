// Pravi PNG ikonice iz SVG-a (pokreni: npm run icons). Treba Playwright/Chromium.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { readFileSync, writeFileSync } from 'node:fs';

const svg = readFileSync(new URL('../public/icon.svg', import.meta.url), 'utf8');
// maskable: pozadina do ruba, motiv u sigurnoj zoni (80%)
const maskable = svg
  .replace(/<rect [^>]*rx="112"[^>]*\/>/, '<rect width="512" height="512" fill="#17556b"/>')
  .replace('<g id="motiv">', '<g id="motiv" transform="translate(51.2 51.2) scale(0.8)">');

const ciljevi = [
  { fajl: 'icon-192.png', velicina: 192, izvor: svg },
  { fajl: 'icon-512.png', velicina: 512, izvor: svg },
  { fajl: 'maskable-512.png', velicina: 512, izvor: maskable },
  { fajl: 'apple-touch-icon.png', velicina: 180, izvor: maskable },
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const c of ciljevi) {
  await page.setViewportSize({ width: c.velicina, height: c.velicina });
  await page.setContent(`<html><body style="margin:0;background:transparent">${c.izvor.replace('<svg ', `<svg width="${c.velicina}" height="${c.velicina}" `)}</body></html>`);
  const png = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: c.velicina, height: c.velicina } });
  writeFileSync(new URL(`../public/${c.fajl}`, import.meta.url), png);
  console.log('napravljeno', c.fajl);
}
await browser.close();
