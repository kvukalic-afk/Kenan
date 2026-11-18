import urllib.parse, html, json
FROM="peptidcentar@gmail.com"
SUBJ="RFQ: 100 custom printed vial box sets, 6 designs (HELVERA)"
def body(team):
    return f"""Dear {team},

We would like a quotation for 100 custom printed packaging sets for one 2 ml glass vial (Ø16 x 35-38 mm). The full specification and the quotation form are in the attached PDF (RFQ-HV-001).

Each set includes:
- Lid-and-base box, closed size 72 x 52 x 25.5 mm, 350 g/m2 white board, CMYK print, matte lamination
- Paper insert (cradle for the vial lying horizontally)
- Vial label 45 x 20 mm, white matte BOPP, fridge-safe adhesive (2-8 °C)
- Seal sticker 12 x 22 mm

There are 6 designs with the same size and structure, mixed in one order (100 sets in total, plus spares). Print-ready vector PDF files with dielines are ready.

Price is our main criterion. Please quote:
1) unit price at 100 / 300 / 500 / 1,000 sets
2) setup, die and sample cost
3) express shipping to Bosnia and Herzegovina (DDU), plus packed weight
4) the total for 100 sets including shipping

If you have a cheaper standard structure in a similar size, please also quote it (for example a rigid box with an EVA insert).

Please confirm that you can mix the 6 designs within MOQ 100. This is a trial order. Larger repeat orders will follow if the quality is good.

Thank you. We look forward to your offer.

Best regards,
Denis Vukelić
HELVERA
{FROM}"""
def gmail(to, cc, team):
    q={"authuser":FROM,"view":"cm","fs":"1","to":to,"su":SUBJ,"body":body(team)}
    if cc: q["cc"]=cc
    return "https://mail.google.com/mail/?"+urllib.parse.urlencode(q, quote_via=urllib.parse.quote)

email=[
 dict(id="meikei",name="Guangzhou Meikei Intelligent Printing",city="Guangzhou",to="sk-jane@meikei.com.cn",cc="",team="Guangzhou Meikei team",
      why="Kutija + naljepnice, mat plastifikacija, EVA umetak · MOQ 100 · Alibaba Verified, 5–6 god.",conf="Email s njihove web stranice",tag="Opcija A"),
 dict(id="yucai",name="Shanghai Yucai Industrial",city="Shanghai",to="sales@yucai-printing.com",cc="",team="Shanghai Yucai team",
      why="Kutija za 3 ml + tray + naljepnice · MOQ 100 · Alibaba Verified, 9 god.",conf="Email s njihove web stranice",tag="Opcija A"),
 dict(id="hanlong",name="Yiwu Hanlong Crafts / Packaging",city="Yiwu",to="alicelou2146@163.com",cc="",team="Hanlong team",
      why="Rigid kartonska kutija za bočicu, custom logo · MOQ 100 · Alibaba Verified",conf="Email s njihove web stranice",tag="Opcija B"),
 dict(id="yison",name="Guangzhou Yison Printing",city="Guangzhou",to="maggie@yisonprinting.com",cc="sale016@yisonprinting.com",team="Yison Printing team",
      why="Kutija s umetkom + naljepnice · Diamond + audit · na listingu MOQ 2.000, pitamo za 100",conf="Email s njihove web stranice",tag="Opcija A"),
 dict(id="hxm",name="Hengxinmao (Xiamen) Technology",city="Xiamen",to="rita@print-unions.com",cc="",team="Hengxinmao team",
      why="Kutija + naljepnice, plastični tray · MOQ 100 · Alibaba Verified, 8 god.",conf="Email iz kopije stranice u pretraživaču, nije potvrđen. Moguće je da je ista grupa kao Xiamen Speed Print",tag="Opcija A",warn=True),
]
forms=[
 dict(id="yzm",name="Xiamen YZM Commerce & Trade (luxeprint)",plat="Alibaba",url="https://luxeprint.en.alibaba.com/",why="Kutije 1–10 ml + tray + naljepnice · MOQ 100 · 10–11 god."),
 dict(id="speed",name="Xiamen Speed Print Industrial",plat="Alibaba",url="https://speedprint.en.alibaba.com/",why="Set kutija + naljepnica · MOQ 100 · 11 god."),
 dict(id="jiguan",name="Dongguan Jiguan Technology",plat="Made-in-China",url="https://jiguantech.en.made-in-china.com/contact-info.html",why="Diamond od 2013, TÜV audit · „No MOQ“ · besplatni standardni uzorci"),
 dict(id="hxmq",name="Hengxinmao (Quanzhou) Technology",plat="Alibaba",url="https://fastprint.en.alibaba.com/",why="Luksuzna sklopiva kutija s magnetom · MOQ 100 · Opcija B"),
 dict(id="dianchuang",name="Nanchang Dian Chuang Packaging",plat="Made-in-China",url="https://dianchuangpacking.en.made-in-china.com/contact-info.html",why="Rigid kutija s magnetom · Diamond + audit · MOQ 100 · Opcija B"),
 dict(id="woolf",name="Changsha Woolf Technology",plat="Made-in-China",url="https://woolftech.en.made-in-china.com/",why="Kutije + vodootporne naljepnice · Gold + audit · MOQ 100"),
 dict(id="haitop",name="Qingdao Haitop Paper Packaging",plat="Made-in-China",url="https://haitoppackaging.en.made-in-china.com/contact-info.html",why="Kutija + naljepnica · MOQ 100"),
 dict(id="fonroon",name="Shenzhen Fonroon Packaging Printing",plat="Alibaba",url="https://fonroon.en.alibaba.com/",why="Kutija + umetak za 2/3 ml · MOQ 100 · nov dobavljač (1 god.)"),
 dict(id="caiyibiao",name="Shanghai Caiyibiao Industrial (samo naljepnice)",plat="Alibaba",url="https://www.alibaba.com/product-detail/Custom-Printing-3ml-5ml-10-ml_1601870578079.html",why="Naljepnice za bočice · MOQ 100 · 0,01–0,03 $"),
 dict(id="fuxinrui",name="Shenzhen Fuxinrui Industrial",plat="Made-in-China",url="https://medpack.en.made-in-china.com/contact-info.html",why="ISO 9001, rigid kutije · MOQ 500, za kasnije serije"),
]
E=html.escape
cards=[]
for i,s in enumerate(email,1):
    g=gmail(s["to"],s["cc"],s["team"])
    cc=f'<span class="addr" data-copy="{E(s["cc"])}">cc {E(s["cc"])}</span>' if s["cc"] else ""
    cards.append(f'''<li class="row{' warn' if s.get('warn') else ''}" data-id="{s['id']}">
  <label class="done"><input type="checkbox" id="c-{s['id']}" aria-label="Poslano: {E(s['name'])}"><span>Poslano</span></label>
  <div class="info">
    <div class="nm">{E(s['name'])} <span class="pill">{E(s['tag'])}</span></div>
    <div class="why">{E(s['why'])} · {E(s['city'])}</div>
    <div class="addrs"><span class="addr" data-copy="{E(s['to'])}">{E(s['to'])}</span>{cc}</div>
    <div class="conf">{'⚠ ' if s.get('warn') else ''}{E(s['conf'])}</div>
  </div>
  <div class="act">
    <a class="btn primary" href="{E(g)}" target="_blank" rel="noopener">Otvori u Gmailu</a>
    <button class="btn" type="button" data-copy="{E(s['to'])}">Kopiraj email</button>
  </div>
</li>''')
frows=[]
for s in forms:
    frows.append(f'''<li class="row" data-id="{s['id']}">
  <label class="done"><input type="checkbox" id="c-{s['id']}" aria-label="Poslano: {E(s['name'])}"><span>Poslano</span></label>
  <div class="info">
    <div class="nm">{E(s['name'])} <span class="pill plat">{E(s['plat'])}</span></div>
    <div class="why">{E(s['why'])}</div>
  </div>
  <div class="act">
    <a class="btn primary" href="{E(s['url'])}" target="_blank" rel="noopener">Otvori stranicu</a>
    <button class="btn" type="button" data-copytext="chat">Kopiraj poruku</button>
  </div>
</li>''')
chat=body("Sir/Madam").replace("Dear Sir/Madam,","Hello,")
tpl=open('tpl.html').read()
out=tpl.replace("%%EMAIL%%","\n".join(cards)).replace("%%FORMS%%","\n".join(frows)).replace("%%CHAT%%",json.dumps(chat)).replace("%%BODYPREVIEW%%",E(body("[Company] team"))).replace("%%SUBJ%%",E(SUBJ))
open('/home/user/Kenan/nabavka-kina/Slanje_upita.html','w').write(out)
print(len(out), max(len(gmail(s['to'],s['cc'],s['team'])) for s in email))
