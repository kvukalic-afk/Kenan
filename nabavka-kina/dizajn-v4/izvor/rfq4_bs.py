import json,base64
A=json.load(open("art.json"))
mock=base64.b64encode(open("mockup.png","rb").read()).decode()
def sv(inner,w,h): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}">{inner}</svg>'
labs="".join(f'<div class="lb">{s.replace("width=\"47.0mm\" height=\"22.0mm\"","")}</div>' for s in A["labels"])
html=f'''<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
<style>@page{{size:A4;margin:9mm 11mm}}*{{box-sizing:border-box}}body{{font-family:Inter,Arial;color:#1b2333;font-size:8.3pt;line-height:1.35;margin:0}}
.top{{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:1px solid #d9dde4;padding-bottom:2mm;margin-bottom:2.5mm}}
.brand{{font:700 13pt 'Space Grotesk';letter-spacing:3px}}.meta{{color:#5b6474;font-size:7.6pt;text-align:right}}
h1{{font:700 15pt 'Space Grotesk';margin:0 0 1mm}}h2{{font:700 8.8pt 'Space Grotesk';text-transform:uppercase;letter-spacing:1px;margin:2.6mm 0 1.4mm;padding-bottom:.8mm;border-bottom:1.4px solid #1b2333}}
p{{margin:.8mm 0}}img{{width:100%;display:block;border-radius:1.5mm}}svg{{width:100%;height:auto;display:block}}
.two{{display:grid;grid-template-columns:1fr 1fr;gap:4mm}}.panels{{display:grid;grid-template-columns:1fr 1fr;gap:2.5mm}}
.cap{{font-size:7pt;color:#5b6474;margin-top:.6mm}}table{{border-collapse:collapse;width:100%}}td{{padding:1mm 1.4mm;border-bottom:1px solid #e3e6eb;vertical-align:top}}td:first-child{{font-weight:600;width:30%}}
.labs{{display:grid;grid-template-columns:repeat(3,1fr);gap:2mm}}.lb svg{{box-shadow:0 0 0 .2mm #c9ced6}}
.prio{{background:#15213b;color:#fff;border-radius:1.5mm;padding:2mm 3mm;display:grid;grid-template-columns:repeat(3,1fr);gap:3mm;margin:2mm 0}}.prio b{{display:block;font-size:8.6pt}}.prio span{{font-size:7.4pt;color:#c9d1e0}}
</style></head><body>
<div class="top"><div class="brand">HELVERA</div><div class="meta">RFQ-HV-004 · 27.11.2026 · Denis Vukelić · peptidcentar@gmail.com</div></div>
<h1>Upit za ponudu: 100 ili 300 brendiranih kutija za bočicu (JEDAN dizajn) + naljepnice (6 dizajna)</h1>
<p>Jedan dizajn kutije za sve proizvode. Naziv proizvoda je samo na naljepnici bočice. Fajlovi spremni za štampu (1:1, višak za rez, linije reza i biga) su u prilogu.</p>
<div class="prio"><div><b>1 · Jedan dizajn kutije</b><span>Ista kutija za svih 100 / 300 kom</span></div><div><b>2 · Cijena s dostavom</b><span>Ukupno do Cazina, BiH</span></div><div><b>3 · Prvo probni primjerak</b><span>Uzorak prije serije</span></div></div>
<div class="two"><div><img src="data:image/png;base64,{mock}"><div class="cap">Prikaz dizajna: kutija 72 × 52 × 25 mm i bočica s naljepnicom</div></div>
<div><div class="panels"><div>{sv(A["front"],72,52)}<div class="cap">Prednja strana / poklopac 72 × 52</div></div><div>{sv(A["back"],72,52)}<div class="cap">Zadnja strana / dno 72 × 52</div></div>
<div>{sv(A["near"],72,25)}<div class="cap">Bočna strana 72 × 25</div></div><div>{sv(A["far"],72,25)}<div class="cap">Bočna strana 72 × 25 (zadnja)</div></div></div></div></div>
<h2>1 · Kutija (ista za sve)</h2>
<table><tr><td>Mjere (vanjske)</td><td>72 × 52 × 25 mm; bočica (promjer 16 mm, visina 35–38 mm) leži. Vaša standardna kutija sličnih mjera (±5 mm) je u redu.</td></tr>
<tr><td>Konstrukcija</td><td><b>A:</b> sklopiva kutija s preklopima na krajevima (poželjno, najjeftinije) ili <b>B:</b> kutija poklopac + dno. Dizajn je urađen po stranama, pa ga možete staviti na svoj kroj.</td></tr>
<tr><td>Karton / štampa</td><td>Bijeli karton 300–350 g, CMYK štampa cijele vanjske strane (tamnoplava), unutra bez štampe, <b>mat plastifikacija</b>. Bez folije, UV laka i reljefa.</td></tr>
<tr><td>Umetak</td><td>Čvrsto drži jednu bočicu koja leži: <b>crna EVA pjena</b> (poželjno), kartonski umetak ili plastični uložak. Molimo ponudite ono što radite.</td></tr></table>
<h2>2 · Naljepnice za bočice: 6 dizajna, 45 × 20 mm</h2>
<div class="labs">{labs}</div>
<p>Bijela mat PP/BOPP folija, CMYK, <b>trajno ljepilo za staklo, otporno na frižider (2–8 °C)</b>, izrezano na arku ili u roli. Količine: 6 × 30 (za 100 kompleta) ili 6 × 50 (za 300 kompleta).</p>
<h2>3 · Molimo ponudu za</h2>
<table><tr><td>Količine</td><td>100 i 300 kompleta (kutija + umetak + naljepnice), posebno kutije i posebno naljepnice</td></tr>
<tr><td>Dostava</td><td>Kurirom do <b>77220 Cazin, Bosna i Hercegovina</b>, s cijenom dostave i rokom</td></tr>
<tr><td>Također</td><td>Cijena probnog primjerka, rok izrade, fotografija slične kutije koju ste radili</td></tr>
<tr><td>Plaćanje</td><td>Unaprijed, uplata na račun ili kartica. Kupac je fizičko lice.</td></tr></table>
<p class="cap">Prilozi: HELVERA_kutija_72x52x25_STAMPA.pdf (štampa, 3 mm viška) · HELVERA_kutija_72x52x25_KROJ_kontrola.pdf (kontrola reza i biga) · HELVERA_naljepnice_45x20_6dizajna_STAMPA.pdf (6 naljepnica, 1 mm viška)</p>
</body></html>'''
open("rfq_v4_bs.html","w").write(html)
