import math, itertools
_c=itertools.count()
def mk():
    i=next(_c)
    return DEFS.replace('id="foil"',f'id="foil{i}"').replace('id="holo"',f'id="holo{i}"').replace('id="vign"',f'id="vign{i}"'), f'url(#foil{i})', f'url(#holo{i})', f'url(#vign{i})'
def rosette(cx, cy, R, r, d, n, steps=1400, stroke="#c9ced8", w=0.35, op=0.55):
    # hypotrochoid-based guilloche
    pts=[]
    for i in range(steps+1):
        t = 2*math.pi*n*i/steps
        x = (R-r)*math.cos(t) + d*math.cos((R-r)/r*t)
        y = (R-r)*math.sin(t) - d*math.sin((R-r)/r*t)
        pts.append(f"{cx+x:.2f},{cy+y:.2f}")
    return f'<polyline points="{" ".join(pts)}" fill="none" stroke="{stroke}" stroke-width="{w}" opacity="{op}"/>'
def waves(x0,y0,w,h,lines,amp,freq,stroke,sw=0.3,op=0.5):
    out=[]
    for k in range(lines):
        yb=y0+h*k/(lines-1)
        pts=[]
        for i in range(0,201):
            x=x0+w*i/200
            y=yb+amp*math.sin(freq*2*math.pi*i/200 + k*0.35)
            pts.append(f"{x:.2f},{y:.2f}")
        out.append(f'<polyline points="{" ".join(pts)}" fill="none" stroke="{stroke}" stroke-width="{sw}" opacity="{op}"/>')
    return "".join(out)

S=4.4  # px per mm
W,H=72*S,52*S

DEFS='''<defs>
<linearGradient id="foil" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#f4f5f7"/><stop offset=".35" stop-color="#b9bec8"/><stop offset=".55" stop-color="#ffffff"/><stop offset=".8" stop-color="#9aa0ab"/><stop offset="1" stop-color="#e3e6eb"/></linearGradient>
<linearGradient id="holo" x1="0" y1="0" x2="1" y2="0">
<stop offset="0" stop-color="#c9d8ff"/><stop offset=".2" stop-color="#f6c9f0"/><stop offset=".4" stop-color="#c9f6e6"/><stop offset=".6" stop-color="#fff3c4"/><stop offset=".8" stop-color="#cfe0ff"/><stop offset="1" stop-color="#f3d0ff"/></linearGradient>
<radialGradient id="vign" cx=".5" cy=".45" r=".75"><stop offset="0" stop-color="#1d2a47"/><stop offset="1" stop-color="#121a2e"/></radialGradient>
</defs>'''
cx,cy=W*0.5,H*0.47
defs,FOIL,HOLO,VIGN=mk()
lid=f'''<svg viewBox="0 0 {W:.0f} {H:.0f}" xmlns="http://www.w3.org/2000/svg">{defs}
<rect width="{W}" height="{H}" rx="3" fill="{VIGN}"/>
{rosette(cx,cy,60,23,38,23,stroke="#3a4a70",w=.45,op=.9)}
{rosette(cx,cy,48,17,30,17,stroke="#4a5d88",w=.35,op=.8)}
<circle cx="{cx}" cy="{cy}" r="27" fill="#141d33"/>
<circle cx="{cx}" cy="{cy}" r="27" fill="none" stroke="{FOIL}" stroke-width=".8"/>
<circle cx="{cx}" cy="{cy}" r="24.5" fill="none" stroke="{FOIL}" stroke-width=".3"/>
<g fill="{FOIL}"><rect x="{cx-9}" y="{cy-11}" width="4.2" height="22"/><rect x="{cx+4.8}" y="{cy-11}" width="4.2" height="22"/><rect x="{cx-4.8}" y="{cy-2.1}" width="9.6" height="4.2" fill="#c8322f"/></g>
<text x="{cx}" y="{H*0.86}" text-anchor="middle" font-family="Space Grotesk, Helvetica, Arial" font-weight="600" font-size="15" letter-spacing="7" fill="#dfe3ea">HELVERA</text>
<text x="{cx}" y="{H*0.935}" text-anchor="middle" font-family="Inter, Helvetica, Arial" font-size="4.6" letter-spacing="2.4" fill="#8f9bb5">LYOPHILIZED PEPTIDE · RESEARCH GRADE</text>
<line x1="14" y1="{H*0.1}" x2="{W-14}" y2="{H*0.1}" stroke="{FOIL}" stroke-width=".35" opacity=".7"/>
<text x="16" y="{H*0.075}" font-family="Inter, Helvetica, Arial" font-size="4.4" letter-spacing="1.6" fill="#8f9bb5">PREMIUM RESEARCH PEPTIDES</text>
<text x="{W-16}" y="{H*0.075}" text-anchor="end" font-family="Inter, Helvetica, Arial" font-size="4.4" letter-spacing="1.6" fill="#8f9bb5">Nº ________</text>
</svg>'''

def label(name, dose, form, color):
    defs,FOIL,HOLO,VIGN=mk()
    LW,LH=45*S,20*S
    return f'''<svg viewBox="0 0 {LW:.0f} {LH:.0f}" xmlns="http://www.w3.org/2000/svg">{defs}
<rect width="{LW}" height="{LH}" rx="2" fill="#fbfbfc"/>
{waves(0,8,LW,LH-16,9,1.6,3,"#d8dce4",.3,.9)}
<rect x="0" y="0" width="9" height="{LH}" fill="{color}"/>
{waves(0,4,9,LH-8,14,.8,6,"#ffffff",.25,.35)}
<rect x="11" y="0" width="1.6" height="{LH}" fill="{HOLO}"/>
<g fill="{FOIL}"><rect x="18" y="8" width="2.2" height="11"/><rect x="25.8" y="8" width="2.2" height="11"/></g><rect x="20.2" y="12.4" width="5.6" height="2.2" fill="#c8322f"/>
<text x="31" y="17.5" font-family="Space Grotesk, Helvetica, Arial" font-weight="600" font-size="8" letter-spacing="2.6" fill="#7d8596">HELVERA</text>
<text x="18" y="41" font-family="Space Grotesk, Helvetica, Arial" font-weight="700" font-size="17" fill="#1b2333">{name}</text>
<text x="18" y="55" font-family="Inter, Helvetica, Arial" font-weight="600" font-size="9" fill="{color}">{dose}</text>
<text x="{18+len(dose)*5.6+6:.0f}" y="55" font-family="Inter, Helvetica, Arial" font-size="6.4" fill="#5d6678">{form}</text>
<line x1="18" y1="64" x2="{LW-6}" y2="64" stroke="#c4c9d2" stroke-width=".5"/>
<text x="18" y="73" font-family="Inter, Helvetica, Arial" font-size="5.2" letter-spacing="1.2" fill="#5d6678">FOR RESEARCH USE ONLY</text>
<text x="{LW-54}" y="14" font-family="Inter, Helvetica, Arial" font-size="5" fill="#5d6678">LOT</text><line x1="{LW-42}" y1="14" x2="{LW-6}" y2="14" stroke="#c4c9d2" stroke-width=".5"/>
<text x="{LW-54}" y="25" font-family="Inter, Helvetica, Arial" font-size="5" fill="#5d6678">EXP</text><line x1="{LW-42}" y1="25" x2="{LW-6}" y2="25" stroke="#c4c9d2" stroke-width=".5"/>
<circle cx="{LW-20}" cy="47" r="10" fill="{HOLO}" opacity=".95"/><circle cx="{LW-20}" cy="47" r="10" fill="none" stroke="#aab" stroke-width=".4"/>
<text x="{LW-20}" y="49" text-anchor="middle" font-family="Inter, Helvetica, Arial" font-weight="700" font-size="5" fill="#556">AUTH</text>
</svg>'''

def seal(name,color):
    defs,FOIL,HOLO,VIGN=mk()
    SW,SH=15*S,45*S
    return f'''<svg viewBox="0 0 {SW:.0f} {SH:.0f}" xmlns="http://www.w3.org/2000/svg">{defs}
<rect width="{SW}" height="{SH}" rx="2" fill="{HOLO}"/>
{waves(0,6,SW,SH-12,18,1.2,4,"#ffffff",.35,.6)}
<rect x="0" y="{SH*0.44}" width="{SW}" height="{SH*0.12}" fill="{color}"/>
<g fill="#1b2333"><rect x="{SW/2-6}" y="18" width="2.6" height="13"/><rect x="{SW/2+3.4}" y="18" width="2.6" height="13"/><rect x="{SW/2-3.4}" y="23.3" width="6.8" height="2.4" fill="#c8322f"/></g>
<text x="{SW/2}" y="{SH*0.515}" text-anchor="middle" dominant-baseline="middle" font-family="Space Grotesk, Helvetica, Arial" font-weight="700" font-size="7" fill="#ffffff">{name}</text>
<text x="{SW/2}" y="{SH*0.72}" text-anchor="middle" font-family="Inter, Helvetica, Arial" font-size="4.6" letter-spacing="1" fill="#1b2333">SEALED</text>
<text x="{SW/2}" y="{SH*0.78}" text-anchor="middle" font-family="Inter, Helvetica, Arial" font-size="4" letter-spacing="1" fill="#1b2333">VOID IF</text>
<text x="{SW/2}" y="{SH*0.83}" text-anchor="middle" font-family="Inter, Helvetica, Arial" font-size="4" letter-spacing="1" fill="#1b2333">OPENED</text>
</svg>'''

prods=[("BPC-157","5 mg","Lyophilized peptide","#3e5f7e","BPC"),("GHK-Cu","50 mg","Lyophilized peptide","#96613f","GHK"),
       ("Semaglutide","10 mg","Lyophilized peptide","#597962","SEMA"),("HCG","5000 IU","Lyophilized powder","#814456","HCG"),
       ("Tirzepatide","10 mg","Lyophilized peptide","#5d5b83","TIRZ"),("NAD+","250 mg","Lyophilized powder","#a1873d","NAD+")]
import json
out={"lid":lid,"labels":[label(n,d,f,c) for n,d,f,c,_ in prods],"seals":[seal(s,c) for _,_,_,c,s in prods]}
json.dump(out,open("svgs.json","w"))
print("ok")
