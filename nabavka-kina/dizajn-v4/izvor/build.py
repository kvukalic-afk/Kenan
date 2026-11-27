import json
A=json.load(open("art.json"))
FONTS='<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">'
def page(body,css=""): return f'<!doctype html><html><head><meta charset="utf-8">{FONTS}<style>*{{margin:0;padding:0;box-sizing:border-box}}svg{{display:block}}html,body{{overflow:hidden}}{css}</style></head><body>{body}</body></html>'
def wrap(inner,w,h): return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}mm" height="{h}mm" viewBox="0 0 {w} {h}">{inner}</svg>'
# print files
pw,ph=A["die_print_size"]
for k in ["die_print","die_proof","die_lines"]:
    open(f"{k}.html","w").write(page(A[k],f"@page{{size:{pw}mm {ph}mm;margin:0}}"))
lab=''.join(f'<div class="pg">{s}</div>' for s in A["labels"])
open("labels_print.html","w").write(page(lab,"@page{size:47mm 22mm;margin:0}.pg{width:47mm;height:22mm;page-break-after:always;overflow:hidden}"))
# preview sheet (screen)
S=5 # px per mm scale for preview
def big(svg_inner,w,h,s=S,vb=None):
    vb=vb or f"0 0 {w} {h}"
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w*s}" height="{h*s}" viewBox="{vb}">{svg_inner}</svg>'
labs=''.join(f'<figure><div class="lb">{s.replace("width=\"47.0mm\" height=\"22.0mm\"","width=\"376\" height=\"176\"")}</div><figcaption>{n}</figcaption></figure>' for s,n in zip(A["labels_cut"],A["names"]))
prev=f'''<div class="wrap"><h1>HELVERA · kutija (ista za svih 100) + 6 naljepnica</h1>
<div class="row"><figure>{big(A["front"],72,52)}<figcaption>Prednja strana / poklopac 72 × 52 mm</figcaption></figure>
<figure>{big(A["back"],72,52)}<figcaption>Zadnja strana / dno 72 × 52 mm</figcaption></figure></div>
<div class="row"><figure>{big(A["near"],72,25)}<figcaption>Duža bočna strana (prednja) 72 × 25</figcaption></figure>
<figure>{big(A["far"],72,25)}<figcaption>Duža bočna strana (zadnja) 72 × 25</figcaption></figure>
<figure>{big(A["end"],25,52,3)}<figcaption>Kraj 25 × 52</figcaption></figure></div>
<h2>Naljepnice 45 × 20 mm (prikaz uvećan 8×)</h2><div class="grid">{labs}</div></div>'''
open("preview.html","w").write(page(prev,"body{background:#eef0f4;font-family:Inter,Arial}.wrap{padding:28px;width:1000px}h1{font:700 22px 'Space Grotesk';margin-bottom:16px}h2{font:700 17px 'Space Grotesk';margin:18px 0 10px}.row{display:flex;gap:22px;margin-bottom:14px;align-items:flex-start}figure{display:flex;flex-direction:column;gap:6px}figcaption{font-size:13px;color:#4b5466}svg{box-shadow:0 2px 10px rgba(0,0,0,.18)}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}.lb svg{box-shadow:0 1px 6px rgba(0,0,0,.2)}"))
# 3D mockup (2D affine projection)
s=7.2
ux,uy=0.92*s,0.30*s; vx,vy=-0.52*s,0.50*s; wx,wy=0,1.0*s
Ox,Oy=330,150
def M(a,b,c,d,e,f,inner): return f'<g transform="matrix({a:.4f},{b:.4f},{c:.4f},{d:.4f},{e:.2f},{f:.2f})">{inner}</g>'
def clip(w,h,inner,i): return f'<clipPath id="k{i}"><rect width="{w}" height="{h}"/></clipPath><g clip-path="url(#k{i})">{inner}</g>'
top=M(ux,uy,vx,vy,Ox,Oy,clip(72,52,A["front"],1))
nx,ny=Ox+52*vx,Oy+52*vy
near=M(ux,uy,wx,wy,nx,ny,clip(72,25,A["near"]+'<rect width="72" height="25" fill="#000" opacity=".18"/>',2))
ex,ey=Ox+72*ux,Oy+72*uy
endf=M(wx,wy,vx,vy,ex,ey,clip(25,52,A["end"]+'<rect width="25" height="52" fill="#000" opacity=".32"/>',3))
shadow=f'<ellipse cx="{Ox+36*ux+26*vx+10}" cy="{Oy+36*uy+26*vy+25*s+30}" rx="330" ry="46" fill="#000" opacity=".12" filter="url(#bl)"/>'
lab=A["labels"][0].replace('width="47.0mm" height="22.0mm"','width="300" height="140.4"')
vial=f"""<g transform="translate(905,215)"><rect x="0" y="0" width="150" height="46" rx="7" fill="url(#cap)"/>
<rect x="18" y="46" width="114" height="22" fill="url(#gl)"/>
<rect x="0" y="66" width="150" height="300" rx="16" fill="url(#gl)"/>
<svg x="0" y="150" width="150" height="140.4" viewBox="0 0 150 140.4" overflow="hidden"><g transform="translate(-36,0)">{lab}</g></svg>
<rect x="0" y="66" width="150" height="300" rx="16" fill="url(#shine)"/></g>"""
svg=f"""<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760">
<defs><filter id="bl"><feGaussianBlur stdDeviation="18"/></filter>
<linearGradient id="cap" x1="0" x2="1"><stop offset="0" stop-color="#8f96a1"/><stop offset=".45" stop-color="#eef0f3"/><stop offset="1" stop-color="#858c97"/></linearGradient>
<linearGradient id="gl" x1="0" x2="1"><stop offset="0" stop-color="#cfd6df"/><stop offset=".4" stop-color="#f7f9fb"/><stop offset="1" stop-color="#c3cbd6"/></linearGradient>
<linearGradient id="shine" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".3" stop-color="#fff" stop-opacity=".28"/><stop offset=".38" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
{shadow}{near}{endf}{top}
<ellipse cx="980" cy="590" rx="95" ry="14" fill="#000" opacity=".12" filter="url(#bl)"/>{vial}
<text x="40" y="730" font-family="Inter" font-size="17" fill="#4b5466">HELVERA · kutija 72 × 52 × 25 mm (ista za svih 100) i bočica s naljepnicom BPC-157 · prikaz</text></svg>"""
mock=svg
css="body{background:linear-gradient(#f3f4f7,#dde1e8)}"
open("mockup.html","w").write(page(mock,css))
print("built")
