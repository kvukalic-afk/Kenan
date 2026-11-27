# HELVERA v4: one branded box (same for all) + 6 vial labels. All units in mm.
import math, json
NAVY="#15213b"; NAVY2="#1c2b4b"; SILVER="#d9dee7"; MUTE="#9aa6bd"; RED="#c8322f"; LINE="#2e3f66"
FONT_D="'Space Grotesk', Inter, Arial, sans-serif"; FONT_B="Inter, Arial, sans-serif"

def rosette(cx,cy,R,r,d,n,stroke,w,op,steps=1600):
    pts=[]
    for i in range(steps+1):
        t=2*math.pi*n*i/steps
        x=(R-r)*math.cos(t)+d*math.cos((R-r)/r*t); y=(R-r)*math.sin(t)-d*math.sin((R-r)/r*t)
        pts.append(f"{cx+x:.3f},{cy+y:.3f}")
    return f'<polyline points="{" ".join(pts)}" fill="none" stroke="{stroke}" stroke-width="{w}" opacity="{op}"/>'

def waves(x0,y0,w,h,lines,amp,freq,stroke,sw,op):
    out=[]
    for k in range(lines):
        yb=y0+h*k/max(lines-1,1); pts=[]
        for i in range(161):
            x=x0+w*i/160; y=yb+amp*math.sin(freq*2*math.pi*i/160+k*0.4)
            pts.append(f"{x:.3f},{y:.3f}")
        out.append(f'<polyline points="{" ".join(pts)}" fill="none" stroke="{stroke}" stroke-width="{sw}" opacity="{op}"/>')
    return "".join(out)

def mark(x,y,h,bar=SILVER):
    # HELVERA "H" mark: two bars + red crossbar (brand logo, no Swiss cross)
    bw=h*0.2; gap=h*0.42; W=2*bw+gap
    return (f'<g><rect x="{x:.3f}" y="{y:.3f}" width="{bw:.3f}" height="{h:.3f}" fill="{bar}"/>'
            f'<rect x="{x+bw+gap:.3f}" y="{y:.3f}" width="{bw:.3f}" height="{h:.3f}" fill="{bar}"/>'
            f'<rect x="{x+bw:.3f}" y="{y+h/2-bw/2:.3f}" width="{gap:.3f}" height="{bw:.3f}" fill="{RED}"/></g>'), W

def t(x,y,s,size,fill,font=FONT_B,weight=400,anchor="start",ls=0):
    return f'<text x="{x:.3f}" y="{y:.3f}" font-family="{font}" font-weight="{weight}" font-size="{size:.3f}" letter-spacing="{ls:.3f}" fill="{fill}" text-anchor="{anchor}">{s}</text>'

# ---------- box panels (each drawn in its own local coords, origin top-left) ----------
def front(L=72,W=52):
    cx,cy=L/2,W*0.43
    m,mw=mark(cx-4.6,cy-11.5,9.2)
    return f'''<rect x="-3" y="-3" width="{L+6}" height="{W+6}" fill="{NAVY}"/>
{rosette(cx,cy,24,9,15,9,LINE,0.14,0.95)}
{rosette(cx,cy,19,7,11.5,7,"#26365c",0.12,0.95)}
<circle cx="{cx}" cy="{cy-6.9}" r="9.6" fill="{NAVY}"/>
<circle cx="{cx}" cy="{cy-6.9}" r="9.6" fill="none" stroke="{SILVER}" stroke-width="0.22"/>
<circle cx="{cx}" cy="{cy-6.9}" r="8.7" fill="none" stroke="{SILVER}" stroke-width="0.1" opacity=".7"/>
{m}
<rect x="{cx-21}" y="{cy+5.2}" width="42" height="9.2" fill="{NAVY}"/>
{t(cx+0.9,cy+12.4,"HELVERA",7.6,SILVER,FONT_D,600,"middle",1.8)}
<line x1="{cx-9}" y1="{cy+15.6}" x2="{cx+9}" y2="{cy+15.6}" stroke="{RED}" stroke-width="0.35"/>
{t(cx+0.35,cy+19.6,"PREMIUM RESEARCH PEPTIDES",1.85,MUTE,FONT_B,500,"middle",0.7)}
<rect x="3" y="3" width="{L-6}" height="{W-6}" fill="none" stroke="{SILVER}" stroke-width="0.15" opacity=".55"/>
{t(5.2,W-5.2,"1 VIAL · LYOPHILIZED",1.6,MUTE,FONT_B,500,"start",0.45)}
{t(L-5.2,W-5.2,"STORE AT 2–8 °C",1.6,MUTE,FONT_B,500,"end",0.45)}'''

def back(L=72,W=52):
    m,mw=mark(6,6,4.2)
    lines=[("CONTENTS","One glass vial. Product name, strength, LOT number and"),
           ("","expiry date are printed on the vial label."),
           ("STORAGE","Store at 2–8 °C. Protect from light. Keep dry."),
           ("","After reconstitution, follow the protocol of your laboratory."),
           ("NOTICE","For laboratory research use only."),
           ("","Not for human or veterinary use."),("","Keep out of reach of children.")]
    out=[f'<rect x="-3" y="-3" width="{L+6}" height="{W+6}" fill="{NAVY}"/>',
         waves(0,W-14,L,10,7,0.7,2.2,LINE,0.12,0.9), m,
         t(6+mw+2.2,9.6,"HELVERA",3.4,SILVER,FONT_D,600,"start",0.9),
         f'<line x1="6" y1="13.6" x2="{L-6}" y2="13.6" stroke="{SILVER}" stroke-width="0.15" opacity=".6"/>']
    y=18.2
    for i,(h,s_) in enumerate(lines):
        if h and i>0: y+=1.3
        if h: out.append(t(6,y,h,1.55,"#ffffff",FONT_B,700,"start",0.4))
        out.append(t(19,y,s_,1.75,SILVER,FONT_B,400))
        y+=2.55
    out.append(f'<rect x="{L-30}" y="{W-12}" width="24" height="7" rx="0.8" fill="#ffffff"/>')
    out.append(t(L-28.6,W-9.6,"PRODUCT / LOT",1.25,"#5d6678",FONT_B,600,"start",0.3))
    out.append(t(6,W-6.6,"See vial label for product details.",1.5,MUTE))
    return "".join(out)

def side_near(L=72,D=25):
    m,mw=mark(6,D/2-2.6,5.2)
    return (f'<rect x="-3" y="-3" width="{L+6}" height="{D+6}" fill="{NAVY}"/>'+m+
            t(6+mw+2.2,D/2+1.6,"HELVERA",4.2,SILVER,FONT_D,600,"start",1.0)+
            f'<line x1="{L-30.8}" y1="{D/2-1.9}" x2="{L-30.8}" y2="{D/2+1.6}" stroke="{RED}" stroke-width="0.35"/>'+
            t(L-6,D/2-0.3,"PREMIUM RESEARCH",1.6,MUTE,FONT_B,500,"end",0.45)+
            t(L-6,D/2+2.1,"PEPTIDES",1.6,MUTE,FONT_B,500,"end",0.45))

def side_far(L=72,D=25):
    return (f'<rect x="-3" y="-3" width="{L+6}" height="{D+6}" fill="{NAVY}"/>'+
            t(L/2,D/2-0.6,"FOR LABORATORY RESEARCH USE ONLY",1.7,SILVER,FONT_B,600,"middle",0.5)+
            t(L/2,D/2+2.4,"STORE AT 2–8 °C · PROTECT FROM LIGHT",1.5,MUTE,FONT_B,500,"middle",0.45))

def end_panel(W=52,D=25):
    # drawn as D wide x W tall (as it sits on the dieline), logo + vertical word
    m,mw=mark(D/2-3,W/2-3,6)
    return f'<rect x="-3" y="-3" width="{D+6}" height="{W+6}" fill="{NAVY}"/>'+m

# ---------- dieline: reverse tuck end, 72 (L) x 52 (W) x 25 (D), landscape ----------
L,W,D=72,52,25; TUCK=14; DUST=19; GLUE=12
rows=[("far",D),("front",W),("near",D),("back",W)]
def dieline_svg(with_lines=True, with_art=True):
    ox,oy=D+TUCK+6, 6   # origin of main panel column
    pw=L+2*(D+TUCK)+12; ph=2*D+2*W+GLUE+12
    g=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{pw}mm" height="{ph}mm" viewBox="0 0 {pw} {ph}">']
    ys={}; y=oy
    for n,h in rows: ys[n]=(y,h); y+=h
    # clip for art with 3 mm bleed: use full cut outline expanded via stroke trick -> simple: bleed rects per piece
    cut=[]  # polygons
    crease=[]
    def poly(pts): return " ".join(f"{ox+x:.3f},{oy+y_:.3f}" for x,y_ in pts)
    # main panel block (relative coords, y from 0 at top of 'far')
    yf,yfr,yn,yb=0,D,D+W,2*D+W
    yend=2*D+2*W
    # outline pieces
    pieces=[]
    # main rectangle with glue flap at bottom (attached to back bottom edge)
    pieces.append([(0,0),(L,0),(L,yend),(L-3,yend+GLUE),(3,yend+GLUE),(0,yend)])
    # front closing flap + tuck on right
    fr=[(L,yfr),(L+D,yfr),(L+D,yfr+1),(L+D+TUCK-3,yfr+2.5),(L+D+TUCK,yfr+6),(L+D+TUCK,yfr+W-6),(L+D+TUCK-3,yfr+W-2.5),(L+D,yfr+W-1),(L+D,yfr+W),(L,yfr+W)]
    pieces.append(fr)
    # back closing flap + tuck on left (reverse tuck)
    bk=[(0,yb),(-D,yb),(-D,yb+1),(-D-TUCK+3,yb+2.5),(-D-TUCK,yb+6),(-D-TUCK,yb+W-6),(-D-TUCK+3,yb+W-2.5),(-D,yb+W-1),(-D,yb+W),(0,yb+W)]
    pieces.append(bk)
    # dust flaps on side rows, both ends
    for (y0,h) in [(yf,D),(yn,D)]:
        pieces.append([(L,y0+0.5),(L+DUST,y0+3),(L+DUST,y0+h-3),(L,y0+h-0.5)])
        pieces.append([(0,y0+0.5),(-DUST,y0+3),(-DUST,y0+h-3),(0,y0+h-0.5)])
    if with_art:
        g.append('<defs>')
        for i,p in enumerate(pieces):
            g.append(f'<clipPath id="c{i}"><polygon points="{poly(p)}" /></clipPath>')
        g.append('</defs>')
        # bleed: draw navy under every piece, inflated by stroke 6 (=3 mm bleed)
        for p in pieces:
            g.append(f'<polygon points="{poly(p)}" fill="{NAVY}" stroke="{NAVY}" stroke-width="6" stroke-linejoin="miter"/>')
        def place(art,x,y,rot=0,w=0,h=0):
            if rot==180: return f'<g transform="translate({ox+x+w:.3f},{oy+y+h:.3f}) rotate(180)">{art}</g>'
            return f'<g transform="translate({ox+x:.3f},{oy+y:.3f})">{art}</g>'
        g.append(place(side_far(L,D),0,yf,180,L,D))
        g.append(place(front(L,W),0,yfr))
        g.append(place(side_near(L,D),0,yn))
        g.append(place(back(L,W),0,yb))
        g.append(f'<g clip-path="url(#c1)">{place(end_panel(W,D),L,yfr)}</g>')
        g.append(f'<g clip-path="url(#c2)">{place(end_panel(W,D),-D,yb)}</g>')
    if with_lines:
        for p in pieces:
            pass
        # outer cut = union outline: draw each piece outline but skip shared edges -> draw full then creases over
        for p in pieces:
            g.append(f'<polygon points="{poly(p)}" fill="none" stroke="#ff00ff" stroke-width="0.25"/>')
        cr=[(0,yfr,L,yfr),(0,yn,L,yn),(0,yb,L,yb),(0,yend,L,yend),
            (L,yfr,L,yfr+W),(L+D,yfr,L+D,yfr+W),(0,yb,0,yb+W),(-D,yb,-D,yb+W),
            (L,yf,L,yf+D),(0,yf,0,yf+D),(L,yn,L,yn+D),(0,yn,0,yn+D)]
        for x1,y1,x2,y2 in cr:
            g.append(f'<line x1="{ox+x1}" y1="{oy+y1}" x2="{ox+x2}" y2="{oy+y2}" stroke="#00a651" stroke-width="0.3" stroke-dasharray="1.2 0.8"/>')
        g.append(t(ox,oy+yend+GLUE+4.5,"HELVERA box · reverse tuck end · 72 × 52 × 25 mm (outer) · magenta = cut · green dashed = crease · 3 mm bleed · scale 1:1",2.2,"#333"))
    g.append('</svg>')
    return "".join(g), pw, ph

# ---------- labels 45 x 20 (+1 mm bleed) ----------
prods=[("BPC-157","5 mg","Lyophilized peptide","#3e5f7e"),("GHK-Cu","50 mg","Lyophilized peptide","#96613f"),
       ("Semaglutide","10 mg","Lyophilized peptide","#597962"),("HCG","5000 IU","Lyophilized powder","#814456"),
       ("Tirzepatide","10 mg","Lyophilized peptide","#5d5b83"),("NAD+","250 mg","Lyophilized powder","#a1873d")]
def label(name,dose,form,color,bleed=1.0,cut=False):
    LW,LH=45,20; b=bleed
    m,mw=mark(9.2,2.4,2.6,NAVY)
    fs=4.3 if len(name)<=7 else 3.55
    s=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{LW+2*b}mm" height="{LH+2*b}mm" viewBox="{-b} {-b} {LW+2*b} {LH+2*b}">',
       f'<rect x="{-b}" y="{-b}" width="{LW+2*b}" height="{LH+2*b}" fill="#ffffff"/>',
       waves(7,3,LW-7,LH-6,8,0.45,2.6,"#dfe3ea",0.1,1),
       f'<rect x="{-b}" y="{-b}" width="{6.6+b}" height="{LH+2*b}" fill="{color}"/>',
       waves(-b,1.5,6.6+b,LH-3,12,0.35,5,"#ffffff",0.08,0.45),
       f'<rect x="6.6" y="{-b}" width="0.6" height="{LH+2*b}" fill="{NAVY}"/>',
       f'<g transform="translate(3.6,{LH/2}) rotate(-90)">'+t(0,0.6,"HELVERA",1.55,"#ffffff",FONT_D,600,"middle",0.55)+'</g>',
       m, t(9.2+mw+1.0,4.75,"HELVERA",2.0,NAVY,FONT_D,600,"start",0.5),
       t(9.2,10.2,name,fs,"#141b2a",FONT_D,700),
       t(9.2,13.7,dose,2.45,color,FONT_B,700),
       t(9.2+len(dose)*1.42+1.6,13.6,form,1.45,"#5d6678",FONT_B,500),
       f'<line x1="9.2" y1="15.4" x2="{LW-1.8}" y2="15.4" stroke="#c4c9d2" stroke-width="0.12"/>',
       t(9.2,17.6,"FOR RESEARCH USE ONLY · STORE AT 2–8 °C",1.22,"#4b5466",FONT_B,600,"start",0.12),
       t(33.2,4.2,"LOT",1.3,"#5d6678",FONT_B,600), f'<line x1="36.7" y1="4.3" x2="{LW-1.8}" y2="4.3" stroke="#aeb4bf" stroke-width="0.12"/>',
       t(33.2,7.6,"EXP",1.3,"#5d6678",FONT_B,600), f'<line x1="36.7" y1="7.7" x2="{LW-1.8}" y2="7.7" stroke="#aeb4bf" stroke-width="0.12"/>']
    if cut: s.append(f'<rect x="0" y="0" width="{LW}" height="{LH}" rx="1" fill="none" stroke="#ff00ff" stroke-width="0.12"/>')
    s.append('</svg>')
    return "".join(s)

out={"front":front(),"back":back(),"near":side_near(),"far":side_far(),"end":end_panel(),
     "labels":[label(*p) for p in prods],"labels_cut":[label(*p,cut=True) for p in prods],
     "names":[p[0] for p in prods]}
for k,(art,pw,ph) in {"die_print":dieline_svg(False,True),"die_proof":dieline_svg(True,True),"die_lines":dieline_svg(True,False)}.items():
    out[k]=art; out[k+"_size"]=[pw,ph]
json.dump(out,open("art.json","w"))
print("ok", out["die_print_size"])
