const { chromium } = require('playwright');
// usage: node render.js in.html out.(pdf|png) [wmm hmm | wpx hpx]
(async () => {
  const [,, inp, out, a, b] = process.argv;
  const br = await chromium.launch(); const p = await br.newPage({ deviceScaleFactor: out.endsWith('.png') ? 2 : 1, viewport: out.endsWith('.png') ? { width: +a || 1200, height: +b || 900 } : undefined });
  await p.goto('file://' + require('path').resolve(inp), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  if (out.endsWith('.pdf')) await p.pdf({ path: out, width: a + 'mm', height: b + 'mm', printBackground: true, pageRanges: '' });
  else await p.screenshot({ path: out, fullPage: true });
  await br.close();
})();
