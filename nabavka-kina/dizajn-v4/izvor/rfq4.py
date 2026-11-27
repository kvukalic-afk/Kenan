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
<div class="top"><div class="brand">HELVERA</div><div class="meta">RFQ-HV-004 · 27 Nov 2026 · Denis Vukelić · peptidcentar@gmail.com</div></div>
<h1>Quotation request: 100 or 300 branded vial boxes (ONE design) + vial labels (6 designs)</h1>
<p>One box design for all products. The product name is only on the vial label. Print-ready PDF files (1:1, bleed, cut and crease lines) are attached.</p>
<div class="prio"><div><b>1 · One box design</b><span>Same box for all 100 / 300 pcs</span></div><div><b>2 · Price incl. shipping</b><span>Total to Cazin, Bosnia and Herzegovina</span></div><div><b>3 · Sample first</b><span>Digital sample before mass production</span></div></div>
<div class="two"><div><img src="data:image/png;base64,{mock}"><div class="cap">Design preview: box 72 × 52 × 25 mm and vial with label</div></div>
<div><div class="panels"><div>{sv(A["front"],72,52)}<div class="cap">Front / top 72 × 52</div></div><div>{sv(A["back"],72,52)}<div class="cap">Back / bottom 72 × 52</div></div>
<div>{sv(A["near"],72,25)}<div class="cap">Long side 72 × 25</div></div><div>{sv(A["far"],72,25)}<div class="cap">Long side 72 × 25 (back)</div></div></div></div></div>
<h2>1 · Box (same for all)</h2>
<table><tr><td>Size (outer)</td><td>72 × 52 × 25 mm; the vial (diameter 16 mm, height 35–38 mm) lies flat. Your standard size is fine if within ±5 mm.</td></tr>
<tr><td>Structure</td><td><b>A:</b> reverse tuck end folding carton (preferred, cheapest), or <b>B:</b> two-piece lid-and-base folding box. Our artwork is made per panel, so you can place it on your own dieline.</td></tr>
<tr><td>Board / print</td><td>300–350 g white board (C1S/SBS), CMYK full-bleed outside (dark navy), inside unprinted, <b>matte lamination</b>. No foil, no UV, no embossing.</td></tr>
<tr><td>Insert</td><td>Holds one vial firmly, lying flat: <b>black EVA</b> (preferred) or white paper-card cradle or plastic tray. Please quote what you offer.</td></tr></table>
<h2>2 · Vial labels: 6 designs, 45 × 20 mm</h2>
<div class="labs">{labs}</div>
<p>White matte BOPP/PP, CMYK, <b>permanent adhesive for glass vials kept in a fridge (2–8 °C)</b>, kiss-cut on sheets or a roll. Quantities: 6 × 30 (100 sets) or 6 × 50 (300 sets).</p>
<h2>3 · Please quote</h2>
<table><tr><td>Quantities</td><td>100 sets and 300 sets (box + insert + labels)</td></tr>
<tr><td>Shipping</td><td>Air express door to door to <b>77220 Cazin, Bosnia and Herzegovina</b> (full address in the email), including any remote area surcharge; and a cheaper option (EMS / DDP) if available</td></tr>
<tr><td>Also</td><td>Sample cost, production time, transit time, photos of a similar box you made</td></tr>
<tr><td>Payment</td><td>PayPal, card or bank transfer. The buyer is a private person.</td></tr></table>
<p class="cap">Files: HELVERA_kutija_72x52x25_STAMPA.pdf (print, 3 mm bleed) · HELVERA_kutija_72x52x25_KROJ_kontrola.pdf (cut/crease proof) · HELVERA_naljepnice_45x20_6dizajna_STAMPA.pdf (6 labels, 1 mm bleed)</p>
</body></html>'''
open("rfq_v4.html","w").write(html)
