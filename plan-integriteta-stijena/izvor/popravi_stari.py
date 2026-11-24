"""Popravlja ORIGINALNI Plan integriteta JU OŠ „Stijena“ (ver 2) uz minimalne izmjene:
datumi 23.11.2026, dodavanje Kenana Vukalića, usklađivanje sa Zakonom USK 24/25 i Uputstvom 11/26,
bez diranja ankete i njenih podataka. Upotreba: python3 popravi_stari.py ulaz.docx rizici.json izlaz.docx"""
import copy, json, re, sys
import docx
from docx.enum.text import WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt

SRC, RJ, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
d = docx.Document(SRC)
R = json.load(open(RJ))
MRK = re.compile(r'\s*\[(?:POTVRDITI|DOPUNITI|PRIJEDLOG|RADNA OCJENA)[^\]]*\]')
def _cl(o):
    if isinstance(o, str): return MRK.sub('', o)
    if isinstance(o, list): return [_cl(x) for x in o]
    if isinstance(o, dict): return {k: _cl(v) for k, v in o.items()}
    return o
R = _cl(R)
_TERM = [('Menadžer integriteta', 'Osoba zadužena za nadzor'), ('menadžera integriteta', 'osobe zadužene za nadzor'), ('menadžeru integriteta', 'osobi zaduženoj za nadzor'), ('menadžer integriteta', 'osoba zadužena za nadzor')]
def _term(o):
    if isinstance(o, str):
        for a, b in _TERM: o = o.replace(a, b)
        return o
    if isinstance(o, list): return [_term(x) for x in o]
    if isinstance(o, dict): return {k: _term(v) for k, v in o.items()}
    return o
R = _term(R)
TBL = list(d.tables)  # reference na izvorne tabele prije umetanja novih
B = '____________'
BR = {'odluka': B, 'obavijest': B, 'izvjestaj': '610-277/2026', 'dopis': '610-278/2026'}  # izvještaj i dopis: originalni brojevi
norm = lambda s: re.sub(r'\s+', ' ', s or '').strip()

# ───────── pomoćne funkcije
def paras():
    return d.paragraphs

def find(sub, nth=0, start=None):
    hits = [p for p in paras() if sub in norm(p.text)]
    if start is not None:
        idx = [i for i, p in enumerate(paras()) if p._p is start._p][0]
        hits = [p for p in paras()[idx + 1:] if sub in norm(p.text)]
    assert len(hits) > nth, 'NIJE NAĐENO: ' + sub
    return hits[nth]

def set_text(p, text):
    runs = p.runs
    if not runs:
        p.add_run(text); return p
    runs[0].text = text
    for r in runs[1:]:
        r._r.getparent().remove(r._r)
    return p

def replace_in(p, old, new):
    """Zamjena unutar runova (čuva formatiranje); ako je tekst razbijen po runovima, zamjenjuje cijeli paragraf."""
    for r in p.runs:
        if old in r.text:
            r.text = r.text.replace(old, new); return
    full = p.text
    assert old in full or old in norm(full), 'NEMA U PARAGRAFU: ' + old
    set_text(p, norm(full).replace(old, new) if old not in full else full.replace(old, new))

def add_after(p, text, like=None):
    src = like if like is not None else p
    new = copy.deepcopy(src._p)
    p._p.addnext(new)
    np_ = docx.text.paragraph.Paragraph(new, p._parent)
    set_text(np_, text)
    return np_

def add_before(p, text):
    new = copy.deepcopy(p._p)
    p._p.addprevious(new)
    np_ = docx.text.paragraph.Paragraph(new, p._parent)
    set_text(np_, text)
    return np_

def cell_set(c, text, size=None, bold=None):
    ps = c.paragraphs
    for extra in ps[1:]:
        extra._p.getparent().remove(extra._p)
    p = ps[0]
    set_text(p, text) if p.runs else p.add_run(text)
    for r in p.runs:
        if size: r.font.size = Pt(size)
        if bold is not None: r.bold = bold

def shade(c, fill):
    tcPr = c._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd'); shd.set(qn('w:val'), 'clear'); shd.set(qn('w:color'), 'auto'); shd.set(qn('w:fill'), fill)
    tcPr.append(shd)

def mk_table(rows, widths_cm, header=1, size=8, fills=None):
    t = d.add_table(rows=len(rows), cols=len(widths_cm))
    t.style = d.styles['Table Grid']
    t.autofit = False
    for ri, row in enumerate(rows):
        tr = t.rows[ri]
        if ri < header:
            trPr = tr._tr.get_or_add_trPr(); th = OxmlElement('w:tblHeader'); th.set(qn('w:val'), 'true'); trPr.append(th)
        trPr = tr._tr.get_or_add_trPr(); cs = OxmlElement('w:cantSplit'); cs.set(qn('w:val'), 'true'); trPr.append(cs)
        ci = 0
        for val in row:
            span = 1
            if isinstance(val, tuple): val, span = val
            c = tr.cells[ci]
            if span > 1:
                c = c.merge(tr.cells[ci + span - 1])
            lines = val if isinstance(val, list) else [val]
            cell_set(c, lines[0], size, bold=(ri < header))
            for ln in lines[1:]:
                np_ = c.add_paragraph(); rr = np_.add_run(ln); rr.font.size = Pt(size)
            for p in c.paragraphs:
                p.paragraph_format.space_after = Pt(0); p.paragraph_format.space_before = Pt(0)
                for rr in p.runs:
                    rr.font.name = 'Times New Roman'; rr._r.get_or_add_rPr().get_or_add_rFonts().set(qn('w:hAnsi'), 'Times New Roman')
            if ri < header: shade(c, 'D9E2F3')
            if fills and (ri, ci) in fills: shade(c, fills[(ri, ci)])
            ci += span
    for ri, tr in enumerate(t.rows):
        for ci, c in enumerate(tr.cells):
            c.width = Cm(widths_cm[min(ci, len(widths_cm) - 1)])
    tw = [int(w * 567) for w in widths_cm]
    tblPr = t._tbl.tblPr
    lay = OxmlElement('w:tblLayout'); lay.set(qn('w:type'), 'fixed'); tblPr.append(lay)
    tblW = tblPr.find(qn('w:tblW'))
    if tblW is None:
        tblW = OxmlElement('w:tblW'); tblPr.append(tblW)
    tblW.set(qn('w:w'), str(sum(tw))); tblW.set(qn('w:type'), 'dxa')
    for gc, w in zip(t._tbl.tblGrid.findall(qn('w:gridCol')), tw):
        gc.set(qn('w:w'), str(w))
    for tr in t.rows:
        for ci, c in enumerate(tr.cells):
            tcW = c._tc.get_or_add_tcPr().find(qn('w:tcW'))
            if tcW is not None:
                tcW.set(qn('w:w'), str(tw[min(ci, len(tw) - 1)])); tcW.set(qn('w:type'), 'dxa')
    return t

def place_after(anchor_el, t):
    anchor_el.addnext(t._tbl); return t._tbl

def new_par_after(anchor_el, text, bold=False, size=None, style='Normal', page_break=False, keep=False):
    p = d.add_paragraph(style=style)
    p.paragraph_format.keep_with_next = keep or bold
    if page_break:
        p.add_run().add_break(WD_BREAK.PAGE)
    r = p.add_run(text); r.bold = bold
    r.font.name = 'Times New Roman'; r._r.get_or_add_rPr().get_or_add_rFonts().set(qn('w:hAnsi'), 'Times New Roman')
    r.font.size = Pt(size) if size else Pt(12)
    anchor_el.addnext(p._p)
    return p._p

FILL = {'Nizak': 'C6E0B4', 'Srednji': 'FFE699', 'Visok': 'F8CBAD'}
NIV = {'Nizak': 'Nizak', 'Srednji': 'Umjeren', 'Visok': 'Visok'}
VL = {1: '1 – mala', 2: '2 – umjerena', 3: '3 – velika'}
PL = {1: '1 – neznatne', 2: '2 – značajne', 3: '3 – vrlo značajne'}

# ───────── 1. Naslovna i osnovne informacije
replace_in(find('Cazin, juni 2021'), 'juni 2021. godine', '23.11.2026. godine')
set_text(find('Datum usvajanje plana integriteta'), f'Datum usvajanja plana integriteta {B}')
for old, new in [('1. Sabina Žunić,pedagog - koordinator radne grupe', '1. Sabina Žunić, pedagog - koordinator radne grupe'), ('3. Dženita Hepić,knjigovođa', '3. Dženita Hepić, knjigovođa'), ('5. Dževaira Džehverović, soc.radnik', '5. Dževaira Džehverović, soc. radnik')]:
    hit = [p for p in paras() if norm(p.text) == old]
    if hit: set_text(hit[0], new)
p6 = find('6. Semira Džakulić,sekretar')
set_text(p6, '6. Semira Džakulić, sekretar')
add_after(p6, '7. Kenan Vukalić, psiholog')

# ───────── 2. Uvod – pravni osnov
set_text(find('Agencija za prevenciju korupcije i koordinaciju borbe protiv korupcije u BiH obavezala'),
         'Zakonom o prevenciji korupcije u Unsko-sanskom kantonu („Službeni glasnik Unsko-sanskog kantona“, broj 24/25) propisana je obaveza svih javnih ustanova čiji je osnivač Unsko-sanski kanton da donesu i provode plan integriteta, u skladu sa Uputstvom za izradu i provođenje Plana integriteta u institucijama u Unsko-sanskom kantonu („Službeni glasnik Unsko-sanskog kantona“, broj 11/26) i Strategijom za borbu protiv korupcije Unsko-sanskog kantona 2023.–2027.')

replace_in(find('Imajući u vidu naprijed navedeno, direktor škole je donio odluku o izradi Plana integriteta'), 'koja je pristupila izradi plana.', 'koja je pristupila izradi plana. Odlukom o izmjenama i dopunama Odluke o izradi plana integriteta broj\u00a0' + BR['odluka'] + ' od ' + B + ' godine postupak izrade usklađen je sa Zakonom o prevenciji korupcije u Unsko-sanskom kantonu i Uputstvom, a radna grupa dopunjena psihologom škole.')

# ───────── 3–5. Izvorni akti (Odluka 610-93/2025, Obavijest 610-94/2025, Program 610-95/2025) ostaju NEPROMIJENJENI.
# Izmjene se uvode novom Odlukom o izmjenama i dopunama i novom obaviješću, koje se umeću iza Programa rada.
from docx.enum.text import WD_ALIGN_PARAGRAPH as _AL
_AMAP = {'L': _AL.LEFT, 'C': _AL.CENTER, 'R': _AL.RIGHT, 'J': _AL.JUSTIFY}
def write_block(anchor, lines):
    for text, bold, pb, al in lines:
        anchor = new_par_after(anchor, text, bold=bold, page_break=pb)
        _pp = docx.text.paragraph.Paragraph(anchor, None)
        _pp.alignment = _AMAP[al]
        _pp.paragraph_format.space_after = Pt(4)
        if text in ('ODLUKU', 'OBAVIJEST') or (text.startswith('Član ') and len(text) < 9):
            _pp.paragraph_format.space_before = Pt(6)
    return anchor
_N93 = '610‑93/2025'
_zk0 = find('ZAKONSKI OKVIR I INTERNI PROPISI')._p.getprevious()
while _zk0 is not None and _zk0.tag == qn('w:p') and not ''.join(t.text or '' for t in _zk0.iter(qn('w:t'))).strip() and _zk0.find('.//' + qn('w:br')) is None and _zk0.find('.//' + qn('w:sectPr')) is None and _zk0.find('.//' + qn('w:drawing')) is None:
    _rm = _zk0; _zk0 = _zk0.getprevious(); _rm.getparent().remove(_rm)
_prev_is_break = _zk0.find('.//' + qn('w:br')) is not None
izm = [
    (f"Broj: {BR['odluka']}", False, not _prev_is_break, 'L'), (f'Datum: {B} godine', False, False, 'L'),
    ('Na osnovu člana 43. st. (2) i (5) Zakona o prevenciji korupcije u Unsko-sanskom kantonu („Službeni glasnik Unsko-sanskog kantona“, broj 24/25), Uputstva za izradu i provođenje Plana integriteta u institucijama u Unsko-sanskom kantonu („Službeni glasnik Unsko-sanskog kantona“, broj 11/26) i Strategije za borbu protiv korupcije Unsko-sanskog kantona 2023.-2027. („Službeni glasnik Unsko-sanskog kantona“, broj 26/23), direktor JU OŠ „Stijena“ donosi:', False, False, 'J'),
    ('ODLUKU', True, False, 'C'), ('O IZMJENAMA I DOPUNAMA ODLUKE O IZRADI PLANA INTEGRITETA', True, False, 'C'),
    ('Član 1.', True, False, 'C'),
    (f'Odluka o izradi plana integriteta JU OŠ „Stijena“ broj: {_N93} od 28.01.2025. godine (u daljem tekstu: Odluka) i postupak izrade plana integriteta usklađuju se sa Zakonom o prevenciji korupcije u Unsko-sanskom kantonu i Uputstvom za izradu i provođenje Plana integriteta u institucijama u Unsko-sanskom kantonu.', False, False, 'J'),
    ('Član 2.', True, False, 'C'),
    ('U članu 2. Odluke, iza tačke 5. dodaje se nova tačka 6. koja glasi: „6. Kenan Vukalić, psiholog škole“.', False, False, 'J'),
    ('Prezime člana radne grupe navedenog pod tačkom 5. člana 2. Odluke ispravno glasi: Džakulić (Semira Džakulić, sekretar škole).', False, False, 'J'),
    ('Član 3.', True, False, 'C'),
    ('Mišljenje o nacrtu plana integriteta traži se od Ureda za borbu protiv korupcije Unsko-sanskog kantona, a plan integriteta usvaja se nakon pribavljenog pozitivnog mišljenja Ureda. U skladu s tim, u Programu rada izrade Plana integriteta (broj: 610‑95/2025), u Fazi 4, aktivnosti dostavljanja nacrta na mišljenje i usvajanja plana integriteta odnose se na Ured za borbu protiv korupcije Unsko-sanskog kantona.', False, False, 'J'),
    ('Član 4.', True, False, 'C'),
    ('Radna grupa za izradu plana integriteta dužna je da revidirani prijedlog plana integriteta, usklađen sa Uputstvom, dostavi direktoru škole danom donošenja ove odluke.', False, False, 'J'),
    ('Član 5.', True, False, 'C'),
    ('Ostale odredbe Odluke ostaju nepromijenjene. Ova odluka stupa na snagu danom donošenja.', False, False, 'J'),
    ('DIREKTOR ŠKOLE:', True, False, 'R'), ('___________________', False, False, 'R'), ('/Vatić Mersad/', False, False, 'R'),
    ('Dostavljeno: 1. Koordinatoru radne grupe; 2. Članovima radne grupe; 3. Uredu za borbu protiv korupcije Unsko-sanskog kantona; 4. a/a', False, False, 'L'),
]
oba = [
    (f"Broj: {BR['obavijest']}", False, True, 'L'), (f'Datum: {B} godine', False, False, 'L'),
    ('OBAVIJEST', True, False, 'C'), ('O IZMJENAMA I DOPUNAMA ODLUKE O IZRADI PLANA INTEGRITETA', True, False, 'C'),
    ('PREDMET: Obavijest uposlenima o nastavku aktivnosti usmjerenih na izradu plana integriteta JU OŠ „Stijena“, dostavlja se:', False, False, 'J'),
    ('Poštovane kolegice i kolege,', False, False, 'L'),
    ('Zakonom o prevenciji korupcije u Unsko-sanskom kantonu i Uputstvom za izradu i provođenje Plana integriteta u institucijama u Unsko-sanskom kantonu, koje je donijela Vlada Unsko-sanskog kantona, uređen je postupak izrade i usvajanja plana integriteta u našem kantonu. S tim u vezi, informišem vas da sam donio Odluku o izmjenama i dopunama Odluke o izradi plana integriteta (broj: ' + BR['odluka'].replace('-', '‑') + '), kojom je postupak izrade plana usklađen s navedenim propisima, a radna grupa dopunjena.', False, False, 'J'),
    ('Radnu grupu za izradu plana integriteta čine: Sabina Žunić, pedagog škole – koordinator, te članovi Edin Pehlić, nastavnik; Dženita Hepić, knjigovođa; Elvira Vatić, nastavnik; Dževaira Džehverović, soc. radnik; Semira Džakulić, sekretar škole i Kenan Vukalić, psiholog škole.', False, False, 'J'),
    ('Naglašavam obavezu da su svi uposleni u JU OŠ „Stijena“ dužni da pruže svu pomoć i informacije potrebne za proces izrade i provođenje plana integriteta, te da sarađuju sa radnom grupom.', False, False, 'J'),
    ('S poštovanjem,', False, False, 'L'),
    ('D I R E K T O R :', True, False, 'R'), ('___________________', False, False, 'R'), ('/Vatić Mersad/', False, False, 'R'),
    ('Dostavljeno: oglasna tabla; a/a', False, False, 'L'),
]
_zk = find('ZAKONSKI OKVIR I INTERNI PROPISI')
_anc = _zk._p.getprevious()
_anc = write_block(_anc, izm)
_anc = write_block(_anc, oba)
_zk.paragraph_format.page_break_before = True

# ───────── 6. Zakonski okvir – dodati antikorupcijske propise
ok = find('Okvirni zakon o osnovnom i srednjem obrazovanju u BiH')
add_before(ok, 'Zakon o prevenciji korupcije u Unsko-sanskom kantonu („Službeni glasnik USK“, broj 24/25)')
add_before(ok, 'Uputstvo za izradu i provođenje Plana integriteta u institucijama u Unsko-sanskom kantonu („Službeni glasnik USK“, broj 11/26)')
add_before(ok, 'Strategija za borbu protiv korupcije Unsko-sanskog kantona 2023.–2027. („Službeni glasnik USK“, broj 26/23)')
replace_in(find('Zakon o osnovnom odgoju i obrazovanju u USK'), 'Zakon o osnovnom odgoju i obrazovanju u USK-a', 'Zakon o osnovnom odgoju i obrazovanju („Službeni glasnik USK“, br. 19/23, 20/24 i 5/26)') if 'USK-a' in find('Zakon o osnovnom odgoju i obrazovanju u USK').text else None

# ───────── 7. Organizacija
replace_in(find('Stručni radadnici'), 'radadnici', 'saradnici')
replace_in(find('Pedagoškim standardima i normativima za srednje obrazovanje'), 'za srednje obrazovanje', 'za osnovno obrazovanje')
T1 = TBL[1]
for ri in (3, 4):
    c = T1.rows[ri].cells[4]
    if not norm(c.text): cell_set(c, 'Srednja odgovornost')

# ───────── 8. Tabela procjene rizika → registar + analitički obrasci (Uputstvo: min. 2 rizika po oblasti, poseban obrazac za svaki rizik)
T5 = TBL[5]
anchor = T5._tbl
txt = ('Rizici su identifikovani u svih 11 zajedničkih oblasti iz Uputstva i u specifičnim oblastima rada škole, najmanje dva po oblasti. '
       'Vjerovatnoća (V) i posljedica (P) ocjenjuju se ocjenom 1–3 (V: 1 – korupcija se nije pojavila ili se pojavljivala vrlo rijetko, 2 – pojavljivala se u više slučajeva, 3 – pojavljivala se često; '
       'P: 1 – neznatne, 2 – značajne, 3 – vrlo značajne posljedice). Intenzitet rizika I = V × P: nizak 1–2, umjeren 3–4, visok 6–9. '
       'Vjerovatnoća je ocijenjena za period školskih godina 2022/2023–2025/2026; u tom periodu nisu zabilježeni slučajevi korupcije. '
       'Rizici zapošljavanja, javnih nabavki, upravljanja, evidencija i ocjenjivanja zadržali su ocjenu radne grupe iz ranije procjene.')
p_meth = new_par_after(T5._tbl.getprevious(), txt)  # metodologija prije tabele
reg = [['Šifra', 'Oblast', 'Rizik', 'V', 'P', 'I', 'Intenzitet']]
fills = {}
for o in R['oblasti']:
    for r in [x for x in R['rizici'] if x['o'] == o['id']]:
        reg.append([r['id'], o['naziv'], r['naziv'], str(r['v']), str(r['p']), str(r['x']), NIV[r['nivo']]])
        fills[(len(reg) - 1, 6)] = FILL[r['nivo']]
treg = mk_table(reg, [1.2, 3.6, 6.2, 0.8, 0.8, 0.8, 2.6], fills=fills)
T5._tbl.addnext(treg._tbl)
T5._tbl.getparent().remove(T5._tbl)
last = treg._tbl
last = new_par_after(last, 'Analitički obrasci po rizicima', bold=True, size=12)
last = new_par_after(last, 'Za svaki rizik popunjen je poseban obrazac prema modelu iz Uputstva.')
for o in R['oblasti']:
    for r in [x for x in R['rizici'] if x['o'] == o['id']]:
        last = new_par_after(last, f"Oblast: {o['id']} – {o['naziv']} ({o['vrsta'].lower()} oblast) | Rizik {r['id']}: {r['naziv']}", bold=True, size=9)
        rows = [['Br.', 'Faktori/izvori rizika: Sistemski (S), Organizacijski (O), Individualni (I), Radno-procesni i proceduralni (P)', 'Postojeće mjere/ kontrolni mehanizmi na snazi u instituciji', 'Analiza rizika', 'Ocjena vjerovatnoće nastanka korupcije', 'Ocjena posljedice nastanka korupcije', 'Intenzitet rizika'],
                ['1.', [f"{i + 1}. ({f[0]}) {f[1]}" for i, f in enumerate(r['f'])], ['• ' + k for k in r['k']], r['a'], VL[r['v']], PL[r['p']], f"{NIV[r['nivo']]} ({r['x']})"]]
        t = mk_table(rows, [0.7, 4.6, 3.8, 2.0, 1.6, 1.6, 1.7], fills={(1, 6): FILL[r['nivo']]})
        last.addnext(t._tbl); last = t._tbl

# ───────── 9. Preporuke – popuniti prazan prioritet (skala 1–5 iz originala)
T6 = TBL[6]
for ri, pr in zip(range(3, 9), ['1', '3', '2', '1', '2', '3']):
    c = T6.rows[ri].cells[2]
    if not norm(c.text): cell_set(c, pr, size=9)

# ───────── 10. Mjere – tabela po modelu Uputstva
T7 = TBL[7]
mj = [['Rizik', 'Mjera za upravljanje rizikom, odnosno za unapređenje integriteta institucije', 'Prioritet mjere', 'Aktivnosti koje je neophodno poduzeti za realizaciju mjere', 'Izvršilac mjere i rok za provođenje aktivnosti', 'Procjena eventualnih troškova za realizaciju mjere']]
fills = {}
for o in R['oblasti']:
    for r in [x for x in R['rizici'] if x['o'] == o['id']]:
        for i, m in enumerate(r['m']):
            mj.append([f"{r['id']} – {r['naziv']}", m['t'], r['prioritet'], ['• ' + a for a in m['akt']], [m['nos'], 'Rok: ' + m['rok']], m['tr']])
            fills[(len(mj) - 1, 2)] = FILL[r['nivo']]
tm = mk_table(mj, [2.6, 3.8, 1.5, 3.6, 2.8, 1.7], fills=fills)
T7._tbl.addnext(tm._tbl)
T7._tbl.getparent().remove(T7._tbl)

# ───────── 11. Postupak prijave korupcije – stil i usklađivanje sa Zakonom
start = find('POSTUPAK PRIJAVE KORUPCIJE')
end = find('KONAČNI IZVJEŠTAJ RADNE GRUPE')
inside = False
for p in paras():
    if p._p is start._p: inside = True; continue
    if p._p is end._p: break
    if inside and p.style.name.startswith('Heading'):
        is_sub = bool(re.match(r'^\d\.\s', norm(p.text)))
        p.style = d.styles['Normal']
        for r in p.runs: r.bold = is_sub
set_text(find('Ovlašteno lice: Sekretar škole'), 'Ovlašteno lice: Semira Džakulić, sekretar škole (član 18. Zakona o prevenciji korupcije u USK). Prijava se može podnijeti i direktoru škole kao odgovornom licu institucije (član 17. Zakona).')
replace_in(find('putem sandučeta za prijavu korupcije'), 'putem sandučeta za prijavu korupcije', 'putem sandučeta s natpisom „ZA PRIJAVU KORUPCIJE“')
add_after(find('usmeno na zapisnik'), '•\tEksterna prijava podnosi se Uredu za borbu protiv korupcije USK (037/305-507, prijavikorupciju@antikorupcijausk.ba); interna prijava nije uslov za eksternu.')
replace_in(find('provjeriti potpunost prijave'), 'provjeriti potpunost prijave', 'provjeriti potpunost prijave i, po potrebi, pozvati prijavitelja da je dopuni u roku od 7 dana')
po = find('obavijestiti prijavitelja o ishodu')
replace_in(po, 'obavijestiti prijavitelja o ishodu', 'obavijestiti prijavitelja o poduzetim mjerama u roku od 30 dana i dostaviti mu odluku o ishodu u roku od 8 dana od okončanja postupka')
add_after(po, '•\tobavijestiti Ured o ishodu postupka u roku od 8 dana od okončanja postupka')
replace_in(find('prijava se prosljeđuje nadležnim organima'), 'prijava se prosljeđuje nadležnim organima', 'prijava se u roku od 5 dana prosljeđuje nadležnoj inspekciji, odnosno tužilaštvu')
replace_in(find('Škola garantuje zaštitu identiteta i prava prijavitelja'), 'prava prijavitelja.', 'prava prijavitelja. Ako prijavitelj trpi ili može trpjeti štetne posljedice, škola odmah donosi privremenu mjeru zaštite (član 30. Zakona).')
set_text(find('Pravilnik o prijavi korupcije u roku od 30 dana'), 'Pravilnik o postupku internog prijavljivanja korupcije (član 22. Zakona), odmah, a najkasnije u roku od 30 dana od usvajanja Plana integriteta.')

# ───────── 12. Konačni izvještaj
set_text(find('je izradila Plan integriteta u skladu sa Smjernicama'),
         'Javna ustanova JU OŠ „Stijena“ izradila je Plan integriteta u skladu sa Zakonom o prevenciji korupcije u Unsko-sanskom kantonu („Službeni glasnik USK“, broj 24/25) i Uputstvom za izradu i provođenje Plana integriteta u institucijama u Unsko-sanskom kantonu, koje je donijela Vlada Unsko-sanskog kantona, uz korištenje Upitnika za samoprocjenu integriteta unutar institucije.')
set_text(find('Radna grupa izvijestila je direktora škole o rezultatima upitnika'),
         'Radna grupa izvijestila je direktora škole o rezultatima upitnika i izrađenom Planu integriteta. Prethodna verzija plana vraćena je na izmjenu i doradu; plan je u cijelosti usklađen sa Zakonom i Uputstvom i dostavlja se Uredu za borbu protiv korupcije Unsko-sanskog kantona radi davanja mišljenja.')
replace_in(find('Direktor škole će donijeti Odluku o usvajanju Plana integriteta'), 'Direktor škole će donijeti', 'Nakon pozitivnog mišljenja Ureda, direktor škole će donijeti')
set_text(find('uočeno je da u školi ne postoje rizici osjetljivosti'),
         'Nakon razmatranja i analize upitnika, analize zakonskih i podzakonskih propisa i internih akata kojima je uređen rad škole, uočeno je da u školi nisu zabilježeni slučajevi korupcije, ali da postoje rizici u pojedinim oblastima rada, koji su identifikovani, procijenjeni i obuhvaćeni mjerama za upravljanje rizicima.')
set_text(find('Broj: 610-277/2026'), f"Broj: {BR['izvjestaj']}")
# datum konačnog izvještaja ostaje originalan (31.03.2026.)
set_text(find('Članovima Radne grupe 5x'), 'Članovima Radne grupe 7x')

# ───────── 13. Nacrt odluke o usvajanju (Uputstvo: plan i odluka se dostavljaju u nacrtu)
prilog = find('Prilog 2 Upitnik za samoprocjenu integriteta')
anchor = prilog._p.getprevious()
from docx.enum.text import WD_ALIGN_PARAGRAPH as _AL
_ODL = BR['odluka'].replace('-', '‑')
lines = [
    # (tekst, bold, prijelom prije, poravnanje: L/C/R/J)
    ('NACRT', True, True, 'R'),
    (f'Broj: {B}', False, False, 'L'), (f'Datum: {B}', False, False, 'L'),
    (f'Na osnovu člana 43., 46., 47. i 49. Zakona o prevenciji korupcije u Unsko-sanskom kantonu („Službeni glasnik USK“, broj 24/25) i Uputstva za izradu i provođenje Plana integriteta u institucijama u Unsko-sanskom kantonu („Službeni glasnik USK“, broj 11/26), a nakon pribavljenog mišljenja Ureda za borbu protiv korupcije Unsko-sanskog kantona broj {B} od {B}, direktor JU OŠ „Stijena“ donosi', False, False, 'J'),
    ('ODLUKU', True, False, 'C'), ('o usvajanju i provođenju Plana integriteta JU OŠ „Stijena“', True, False, 'C'),
    ('Član 1.', True, False, 'C'),
    ('Ovom odlukom usvaja se Plan integriteta JU OŠ „Stijena“ koji je pripremila radna grupa za izradu plana integriteta.', False, False, 'J'),
    ('Član 2.', True, False, 'C'),
    ('Stupanjem na snagu ove odluke razrješavaju se dužnosti koordinator i članovi radne grupe za izradu plana integriteta (Odluka broj 610‑93/2025 od 28.01.2025. godine i Odluka o izmjenama i dopunama broj ' + _ODL + ' od ' + B + ' godine).', False, False, 'J'),
    ('Član 3.', True, False, 'C'),
    ('(1) Za osobu zaduženu za nadzor nad provođenjem plana integriteta (menadžera integriteta) imenuje se Dževaira Džehverović, soc. radnik.', False, False, 'J'),
    ('(2) Osoba zadužena za nadzor nad provođenjem plana integriteta ima zadatak da prati provođenje Plana integriteta, a posebno dijela koji se odnosi na mjere za poboljšanje integriteta institucije, te davanje prijedloga za njegovo unapređenje.', False, False, 'J'),
    ('(3) Svi uposleni u JU OŠ „Stijena“ dužni su obavijestiti osobu zaduženu za nadzor nad provođenjem plana integriteta o situaciji, pojavi ili radnji koje na osnovu razumnog uvjerenja mogu dovesti do narušavanja integriteta institucije.', False, False, 'J'),
    ('(4) Uposleni u instituciji treba da, na zahtjev osobe zadužene za nadzor nad provođenjem plana integriteta, dostave potrebne podatke i informacije od značaja za provođenje plana integriteta, a koje nisu u suprotnosti sa važećim propisima.', False, False, 'J'),
    ('(5) Institucija svake druge godine procjenjuje učinkovitost plana integriteta, u skladu sa Uputstvom za izradu i provođenje plana integriteta. Institucija je dužna godišnje dostaviti Uredu izvještaj o provođenju plana integriteta. Izvještaj će institucija dostaviti Uredu do 31. marta tekuće godine, za prethodnu godinu.', False, False, 'J'),
    ('Član 4.', True, False, 'C'),
    ('Plan integriteta objavljuje se na web stranici škole i dostavlja Uredu za borbu protiv korupcije Unsko-sanskog kantona u roku od 15 dana od dana donošenja ove odluke. Plan važi četiri godine od dana usvajanja.', False, False, 'J'),
    ('Član 5.', True, False, 'C'),
    ('Ova odluka stupa na snagu danom donošenja.', False, False, 'J'),
    ('Direktor škole:', False, False, 'R'), ('____________________', False, False, 'R'), ('/Vatić Mersad/', False, False, 'R'),
    ('Dostavljeno: 1. Uredu za borbu protiv korupcije Unsko-sanskog kantona; 2. Osobi zaduženoj za nadzor nad provođenjem Plana integriteta; 3. Članovima Radne grupe; 4. a/a', False, False, 'L'),
]
_AMAP = {'L': _AL.LEFT, 'C': _AL.CENTER, 'R': _AL.RIGHT, 'J': _AL.JUSTIFY}
for text, bold, pb, al in lines:
    anchor = new_par_after(anchor, text, bold=bold, page_break=pb)
    _pp = docx.text.paragraph.Paragraph(anchor, None)
    _pp.alignment = _AMAP[al]
    _pp.paragraph_format.space_after = Pt(4)
    if text in ('ODLUKU',) or text.startswith('Član ') and len(text) < 9:
        _pp.paragraph_format.space_before = Pt(6)
# Prilog 2 uvijek počinje na novoj stranici
prilog.paragraph_format.page_break_before = True

# ───────── 14. Dopis Uredu
set_text(find('Broj: 610-278/2026'), f"Broj: {BR['dopis']}")
# datum dopisa ostaje originalan (31.03.2026.)
predmet = find('PREDMET: Plan integriteta JU OŠ „Stijena“,mišljenje')
set_text(predmet, 'PREDMET: Plan integriteta JU OŠ „Stijena“, mišljenje – traži se')
add_before(predmet, 'Uredu za borbu protiv korupcije Unsko-sanskog kantona, Bihaćkih branilaca 2, 77000 Bihać')
set_text(find('Poštovani,dostavljamo vam izmjenjeni Plan integriteta'),
         'Poštovani, dostavljamo Vam izmijenjeni Plan integriteta JU OŠ „Stijena“ na mišljenje. Prethodni Plan integriteta bio je dostavljen Agenciji za prevenciju korupcije i koordinaciju borbe protiv korupcije i vraćen na izmjenu i doradu zbog uočenih nedostataka. Plan je usklađen sa Zakonom o prevenciji korupcije u Unsko-sanskom kantonu i Uputstvom za izradu i provođenje Plana integriteta u institucijama u Unsko-sanskom kantonu, a uz njega se dostavlja i nacrt Odluke o usvajanju i provođenju plana integriteta.')
set_text(find('Radna grupa za izradu Plana integriteta je izmjenila i doradila vraćeni plan'),
         'Radna grupa za izradu Plana integriteta izmijenila je i doradila vraćeni plan, te Vam dostavljamo izmijenjenu verziju na mišljenje i daljnje postupanje.')

# ───────── uklanjanje praznih paragrafa između sadržaja i prijeloma stranice
sdt = d.element.body.find(qn('w:sdt'))
nxt = sdt.getnext()
while nxt is not None and nxt.tag == qn('w:p') and not ''.join(t.text or '' for t in nxt.iter(qn('w:t'))).strip() and nxt.find('.//' + qn('w:br')) is None and nxt.find('.//' + qn('w:sectPr')) is None:
    rem = nxt; nxt = nxt.getnext(); rem.getparent().remove(rem)

# ───────── 15. Usklađivanje opisnih ocjena radne grupe sa registrom rizika i rezultatima ankete (anketa se ne dira)
def cell_with(tbl, sub):
    for r in tbl.rows:
        for c in r.cells:
            if sub in norm(c.text): return c
    raise AssertionError('NEMA ĆELIJE: ' + sub)
T2 = TBL[2]
_asp = [
    ('Nisu uočene rizične aktivnosti, odnosno radna mjesta podložna', 'Većina zaposlenih (91,89%) svoja radna mjesta ne smatra podložnim koruptivnom djelovanju (podmićivanje, iznuda, favorizovanje, utaja/pronevjera), ali 64,86% zaposlenih nije upoznato s načinom anonimnog prijavljivanja kršenja integriteta. Postoji potreba za: uvođenjem dodatnih otvorenih komunikacionih kanala, edukacijom zaposlenih o etici i integritetu, te upoznavanjem sa posljedicama i uzrocima korupcije i aktivnim učešćem u njenoj prevenciji, povećanjem djelotvornosti unutrašnje kontrole i mehanizma odgovornosti.', 'Umjerena osjetljivost'),
    ('odnosno svi zaposleni su upoznati sa opisom svog radnog mjesta', 'Nisu uočeni značajniji problemi: zaposleni su upoznati sa opisom svog radnog mjesta (97,30%), radni procesi obavljaju se u skladu sa datim ovlaštenjima, a nadređeni je dostupan za konsultacije. Teme integriteta ne razmatraju se redovno na poslovnim sastancima (16,22% nikada).', 'Slaba osjetljivost'),
    ('odnosno većina zaposlenih nije bila suočena sa pitanjima', 'Većina zaposlenih nije bila suočena sa pitanjima u kojima bi njihove profesionalne odluke mogle ostaviti posljedice po privatni život. Zaposleni koji su bili u takvoj situaciji (13,51%) nisu pitanje prepustili drugome niti uključili saradnika ili nadređenog, što ukazuje na potrebu uređenja postupka izuzeća i prijave sukoba interesa.', 'Umjerena osjetljivost'),
    ('odnosno svi kontakti su precizirani u skladu sa utvrđenim poslovima', 'Kontakti sa osobama izvan škole (45,95% zaposlenih) odvijaju se u okviru utvrđenih poslova; nadređeni u većini slučajeva nije upoznat sa vrstom i prirodom tih kontakata.', 'Slaba osjetljivost'),
    ('odnosno većina zaposlenih smatra da se posao obavlja kvalitetno', 'Nisu uočeni značajniji problemi: većina zaposlenih smatra da se posao obavlja kvalitetno i profesionalno.', 'Slaba osjetljivost'),
    ('U školi nisu uočeni mogući problemi i potencijalni rizici. Upravljanje sredstvima', 'Upravljanje sredstvima i stvarima koje pripadaju instituciji propisano je podzakonskim i internim propisima i ostvaruje se kroz odobrena budžetska sredstva sa tačno utvrđenim načinom njihove potrošnje. Dio zaposlenih nije upoznat sa internim propisima o javnim nabavkama (40,54%) i procedurama u slučaju prevare ili krađe (72,97%).', 'Umjerena osjetljivost'),
]
for sub, new, status in _asp:
    row = [r for r in T2.rows if any(sub in norm(c.text) for c in r.cells)][0]
    cells = []
    for c in row.cells:
        if c._tc not in [x._tc for x in cells]: cells.append(c)
    cell_set(cells[1], new)
    cell_set(cells[3], status)
set_text(find('Prema ocjeni radne grupe zakonski okvir za funkcionisanje škole je određen u potpunosti'),
         'Prema ocjeni radne grupe zakonski okvir za funkcionisanje škole je uspostavljen. U odnosu na Zakon o prevenciji korupcije u Unsko-sanskom kantonu potrebno je donijeti pravilnik o postupku internog prijavljivanja korupcije i rješenje o ovlaštenom licu, urediti postupak prijave i upravljanja sukobom interesa i donijeti kodeks ponašanja zaposlenih, što je obuhvaćeno mjerama ovog plana.')
set_text(find('Svi poslovni procesi se izvršavaju u skladu sa važećim zakonskim i podzakonskim aktima'),
         'Poslovni procesi se izvršavaju u skladu sa važećim zakonskim i podzakonskim aktima. Kod pojedinih procesa (zapošljavanje, javne nabavke, finansijsko i blagajničko poslovanje, vođenje evidencija, ocjenjivanje učenika, prijavljivanje nepravilnosti) identifikovani su rizici, koji su procijenjeni i obuhvaćeni mjerama za upravljanje rizicima.')
set_text(find('Svi poslovni procesi odvijaju se u skladu sa zakonskim i podzakonskim propisima'), 'Poslovni procesi u pravilu se odvijaju u skladu sa zakonskim i podzakonskim propisima,')

# ───────── 16. Konačni izvještaj potpisuje radna grupa (Uputstvo: radna grupa podnosi izvještaj rukovodiocu)
_kb = find(f"Broj: {BR['izvjestaj']}")
_a = _kb._p.getprevious()
_a = new_par_after(_a, 'Radna grupa za izradu Plana integriteta:', bold=True)
for nm in ['Sabina Žunić, koordinator', 'Edin Pehlić, član', 'Dženita Hepić, član', 'Elvira Vatić, član', 'Dževaira Džehverović, član', 'Semira Džakulić, član', 'Kenan Vukalić, član']:
    _a = new_par_after(_a, f'{nm}  ______________________')
    docx.text.paragraph.Paragraph(_a, None).paragraph_format.space_after = Pt(2)
docx.text.paragraph.Paragraph(_a, None).paragraph_format.space_after = Pt(12)

# ───────── 17. Font u izvornim tabelama malo smanjen radi čitljivosti i manjeg prelamanja
def tbl_font(tbl, size, head=None):
    for r in tbl.rows:
        for c in r.cells:
            for p_ in c.paragraphs:
                for rr in p_.runs:
                    cur = rr.font.size.pt if rr.font.size else None
                    rr.font.size = Pt(head if (head and cur and cur >= 14) else size)
tbl_font(TBL[0], 11, head=12)
for k in (1, 2, 3, 4):
    tbl_font(TBL[k], 10)
tbl_font(TBL[8], 11)

# ───────── 18. Zaglavlja izvornih tabela: ponavljanje na novoj stranici i bez prelamanja reda zaglavlja
for k in (0, 1, 2, 3, 4, 6, 8):
    tr = TBL[k].rows[0]._tr
    trPr = tr.get_or_add_trPr()
    for tag in ('w:cantSplit', 'w:tblHeader'):
        if trPr.find(qn(tag)) is None:
            e = OxmlElement(tag); e.set(qn('w:val'), 'true'); trPr.append(e)
find('Izvještaj o integritetu – Analiza ranjivih aktivnosti').paragraph_format.page_break_before = True

# ───────── samostalni ručni prijelomi stranice → „početak na novoj stranici“ na sljedećem paragrafu (sprječava prazne stranice)
for el in list(d.element.body.iterchildren()):
    if el.tag != qn('w:p') or el.find('.//' + qn('w:sectPr')) is not None: continue
    if ''.join(t.text or '' for t in el.iter(qn('w:t'))).strip(): continue
    brs = el.findall('.//' + qn('w:br'))
    if not brs or any(b.get(qn('w:type')) != 'page' for b in brs): continue
    nxt = el.getnext()
    while nxt is not None and nxt.tag == qn('w:p') and not ''.join(t.text or '' for t in nxt.iter(qn('w:t'))).strip() and nxt.find('.//' + qn('w:br')) is None and nxt.find('.//' + qn('w:drawing')) is None and nxt.find('.//' + qn('w:sectPr')) is None:
        rm = nxt; nxt = nxt.getnext(); rm.getparent().remove(rm)
    if nxt is None or nxt.tag != qn('w:p'): continue
    docx.text.paragraph.Paragraph(nxt, None).paragraph_format.page_break_before = True
    el.getparent().remove(el)

# prazni paragrafi neposredno ispred paragrafa koji počinje na novoj stranici nemaju svrhu (mogu stvoriti praznu stranicu)
for el in list(d.element.body.iterchildren()):
    if el.tag == qn('w:p') and el.find('.//' + qn('w:pageBreakBefore')) is not None:
        prv = el.getprevious()
        while prv is not None and prv.tag == qn('w:p') and not ''.join(t.text or '' for t in prv.iter(qn('w:t'))).strip() and prv.find('.//' + qn('w:br')) is None and prv.find('.//' + qn('w:sectPr')) is None and prv.find('.//' + qn('w:drawing')) is None:
            rm = prv; prv = prv.getprevious(); rm.getparent().remove(rm)

# ───────── ažuriranje sadržaja pri otvaranju u Wordu
settings = d.settings.element
uf = OxmlElement('w:updateFields'); uf.set(qn('w:val'), 'true'); settings.append(uf)
d.core_properties.last_modified_by = 'JU OŠ Stijena'
d.save(OUT)
print('OK', OUT)
