/* Kompajlira src/app.jsx (JSX) u čisti JavaScript i pravi jedan Index.html za Apps Script.
 * Pokretanje: npm run build   (Index.html se onda kopira u Apps Script)
 */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const src = fs.readFileSync(path.join(__dirname, 'src', 'app.jsx'), 'utf8');
const sablon = fs.readFileSync(path.join(__dirname, 'src', 'index.template.html'), 'utf8');

const verzijaTxt = new Date().toLocaleString('bs-BA', { timeZone: 'Europe/Sarajevo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const { code } = esbuild.transformSync(src.replace(/__VERZIJA__/g, verzijaTxt), {
  loader: 'jsx',
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  target: ['es2017', 'safari12', 'chrome70'],
  charset: 'utf8',
  legalComments: 'none'
});

if (/<\/script/i.test(code)) throw new Error('Kod sadrži </script — HtmlService bi ga presjekao.');
const verzija = new Date().toISOString().slice(0, 16).replace('T', ' ');
const skripta = '<script>\n/* Generisano iz src/app.jsx (' + verzija + ' UTC) — ne uređuj ručno, pokreni npm run build */\n' + code + '</script>';
const html = sablon.replace('<!--APP-->', () => skripta);
fs.writeFileSync(path.join(__dirname, 'Index.html'), html);
console.log('Index.html napravljen (' + Math.round(html.length / 1024) + ' KB)');
