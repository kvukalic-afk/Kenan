// Renderuje Reel kadar po kadar i sklapa MP4: node render.js [fps] [frames-dir]
// Rezultat: ../reel-zenski-termin-bez-zvuka.mp4 (1080x1920). Zvuk se dodaje u mix.sh.
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

(async () => {
  const fps = +(process.argv[2] || 30);
  const framesDir = process.argv[3] || path.join(__dirname, 'frames');
  fs.rmSync(framesDir, { recursive: true, force: true });
  fs.mkdirSync(framesDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(__dirname, 'video.html'), { waitUntil: 'networkidle' });
  await page.evaluate(() => Promise.all([document.fonts.load('800 40px Poppins'), document.fonts.load('500 40px Poppins'), document.fonts.load('italic 600 40px Lora')]));
  await page.evaluate(() => document.fonts.ready);
  const ok = await page.evaluate(() => document.fonts.check('800 40px Poppins') && document.fonts.check('italic 600 40px Lora'));
  if (!ok) throw new Error('Fontovi se nisu učitali');
  const dur = await page.evaluate(() => window.DUR);
  const total = Math.round(dur * fps);
  for (let f = 0; f < total; f++) {
    await page.evaluate(([t, f]) => window.render(t, f), [f / fps, f]);
    await page.screenshot({ path: path.join(framesDir, `f${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 93 });
    if (f % 60 === 0) process.stdout.write(`${f}/${total} `);
  }
  await browser.close();
  const out = path.join(__dirname, '..', 'reel-zenski-termin-bez-zvuka.mp4');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(framesDir, 'f%05d.jpg'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', out]);
  console.log('\nGotovo:', out);
})();
