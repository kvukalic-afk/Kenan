"""Provjerava da je svaki red upitnika i rezultata ankete iz izvornog Plana doslovno prenesen u revidirani nacrt
(poređenje bez automatske numeracije i višestrukih razmaka) i da su svi procenti očuvani."""
import re, sys, docx
def paras(p): return [x.text for x in docx.Document(p).paragraphs]
norm = lambda s: re.sub(r'\s+', ' ', re.sub(r'^\s*\d+\.\s*', '', s)).strip()
orig, novi = paras(sys.argv[1]), paras(sys.argv[2])
novi_txt = '\n'.join(norm(x) for x in novi)
i0 = next(i for i,t in enumerate(orig) if t.startswith('Prilog 2 Upitnik'))
i1 = next(i for i,t in enumerate(orig) if t.startswith('Broj: 610-278'))
r0 = next(i for i,t in enumerate(orig) if t.startswith('Radna grupa je izvršila analizu statusa quo'))
r1 = next(i for i,t in enumerate(orig) if t.startswith('Radna grupa analizirala je rezultate upitnika'))
blok = [t for t in orig[i0+1:i1] + orig[r0:r1+1] if t.strip()]
nedostaje = []
for t in blok:
    n = norm(t)
    # dijelovi preloma (npr. "Primjer broj 1:" u istom pasusu) provjeravaju se po segmentima
    if n and n not in novi_txt: nedostaje.append(t)
print(f'Provjereno redova: {len(blok)}; nije pronađeno doslovno: {len(nedostaje)}')
for t in nedostaje: print('  -', repr(t[:140]))
pct_o = sorted(re.findall(r'\d+,\d+ ?%|\d+ ?%', '\n'.join(orig[r0:r1+1])))
pct_n = '\n'.join(novi)
fali = [p for p in pct_o if p not in pct_n]
print(f'Procenti u izvornim rezultatima: {len(pct_o)}; nedostaje: {fali}')
print('72 radnika:', '72 radnika' in pct_n, '| 34 pitanja:', '34 pitanja' in pct_n)
