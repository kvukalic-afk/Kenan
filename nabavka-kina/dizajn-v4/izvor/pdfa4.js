const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
 await p.goto('file://' + require('path').resolve(process.argv[2]), { waitUntil: 'networkidle' }); await p.evaluate(()=>document.fonts.ready);
 await p.pdf({ path: process.argv[3], format: 'A4', printBackground: true, preferCSSPageSize: true, scale: 0.9 }); await b.close(); })();
