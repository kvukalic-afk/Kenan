"""Unosi odgovore škole (23.11.2026) u plan_konacni.js."""
import re
s = open('plan_konacni.js').read()

def rep(a, b):
    global s
    assert a in s, 'NIJE NAĐENO: ' + a[:90]
    s = s.replace(a, b, 1)

rep("const Rx = base.R.map((r) => {\n  const x = { ...r };",
"""const PATCH = {
  'Z2.3': (r) => { r.f = [['P', 'Popis imovine se vrši jednom godišnje; zaduženja opreme po zaposlenima nisu potpuna.'], ['O', 'Školski prostor se povremeno ustupa trećim licima (npr. lokalnom sportskom klubu); svako korištenje treba biti zasnovano na pisanoj odluci ili ugovoru.']]; },
  'Z4.2': (r) => { r.m = [{ ...r.m[0], t: 'Donijeti interni akt o zaštiti ličnih podataka i osigurati ormare s bravom za čuvanje povjerljive dokumentacije stručne službe (pedagog, psiholog, socijalni radnik) i kadrovskih dosijea.', tr: 'Iz budžeta škole, prema ponudi' }]; },
  'Z6.1': (r) => { r.f = [['P', 'Prostorije s osjetljivom dokumentacijom i blagajnom ne zaključavaju se dosljedno van radnog vremena.'], ['O', 'Evidencija zaduženja ključeva i pečata ne provjerava se periodično.']]; r.k = ['Evidencija zaduženja ključeva i pečata', ...r.k]; r.ao = 'Evidencija zaduženja ključeva i pečata postoji; periodična provjera nije propisana.'; r.m = [{ ...r.m[0], t: 'Godišnje provjeravati evidenciju zaduženja pečata, štambilja i ključeva i njenu usklađenost sa stvarnim stanjem.', akt: ['Godišnja provjera evidencije uz zapisnik', 'Ažuriranje evidencije pri svakoj promjeni zaduženja'], rok: 'Godišnje, septembar', ind: 'Zapisnik o godišnjoj provjeri' }]; },
  'Z6.2': (r) => { r.opis = 'Mogućnost neovlaštenog pristupa elektronskom dnevniku i drugim elektronskim evidencijama, dijeljenja pristupnih podataka ili gubitka podataka.'; },
  'Z10.1': (r) => { r.k = ['Sanduče s natpisom „ZA PRIJAVU KORUPCIJE“ na vidnom mjestu', 'Ovlašteno lice za prijem prijava (sekretar škole)']; r.ao = 'Sanduče s propisanim natpisom postoji; pravilnik o internom prijavljivanju, rješenje o ovlaštenom licu i evidencija prijava se uspostavljaju.'; r.m = [r.m[0], { ...r.m[1], t: 'Sanduče komisijski otvarati i voditi evidenciju prijava; informisati zaposlene, učenike i roditelje o načinima prijave korupcije.', akt: ['Utvrditi dinamiku komisijskog otvaranja sandučeta (najmanje mjesečno)', 'Održati informisanje na Nastavničkom vijeću i roditeljskim sastancima'], tr: 'Bez dodatnih troškova', ind: 'Zapisnici o otvaranju sandučeta; evidencija informisanja' }]; },
  'S3.1': (r) => { r.k = ['Prikupljanje ponuda više agencija', ...r.k]; r.ao = 'Ponude više agencija se prikupljaju; javno poređenje ponuda i raspored pogodnosti nisu dokumentovani.'; },
};
const Rx = base.R.map((r0) => {
  const r = JSON.parse(JSON.stringify(r0)); if (PATCH[r.id]) PATCH[r.id](r);
  const x = { ...r };""")

rep("center(`Cazin, ${B} 2026. godine`", "center('Cazin, 23.11.2026. godine'")
rep("const brDat = () => [left(`Broj: ${B}`, { after: 0 }), left(`Datum: ${B}`)];",
    "const brDat = (dt = '23.11.2026. godine') => [left(`Broj: ${B}`, { after: 0 }), left(`Datum: ${dt}`)];")
rep("kv([['Datum usvajanja plana integriteta', B], ['Ime i prezime osobe zadužene za nadzor nad praćenjem provođenja plana integriteta', B], ['Broj telefona osobe zadužene za nadzor nad praćenjem provođenja plana integriteta', B]])",
    "kv([['Datum usvajanja plana integriteta', B], ['Ime i prezime osobe zadužene za nadzor nad praćenjem provođenja plana integriteta', 'Dževaira Džehverović, socijalni radnik'], ['Broj telefona osobe zadužene za nadzor nad praćenjem provođenja plana integriteta', '062/192-401']])")
rep("(broj ${B} od ${B}) uskladio", "(broj ${B} od 23.11.2026. godine) uskladio")
rep("provela anonimnu anketu zaposlenih i izradila", "provela anonimnu anketu zaposlenih u skladu s programom (rok: 14.02.2025.) i izradila")
rep("Radna grupa dužna je da u roku od 15 dana od dana donošenja Odluke o izmjenama i dopunama dostavi direktoru program rada za izradu plana integriteta. Radna grupa dužna je da sačini prijedlog plana integriteta i dostavi ga direktoru u roku od 45 dana od dana donošenja Odluke o izmjenama i dopunama.",
    "Radna grupa dužna je da direktoru dostavi program rada i prijedlog plana integriteta izrađen u skladu s Uputstvom, najkasnije u roku od 30 dana od dana donošenja Odluke o izmjenama i dopunama.")
rep("provedene u postupku izrade plana integriteta 2025. godine, bez izmjene", "provedene u skladu s Programom rada broj 610-95/2025, bez izmjene")
rep("informišem vas da sam dana ${B} donio Odluku o izmjenama i dopunama Odluke o izradi plana integriteta (broj ${B} od dana ${B}).",
    "informišem vas da sam dana 23.11.2026. godine donio Odluku o izmjenama i dopunama Odluke o izradi plana integriteta (broj ${B} od dana 23.11.2026. godine).")
rep("['Datum odobravanja programa rada', B], ['Početak izrade plana integriteta', B], ['Očekivani završetak', B]]",
    "['Datum odobravanja programa rada', '23.11.2026. godine'], ['Početak izrade plana integriteta', '28.01.2025. godine (nastavak 23.11.2026. godine)'], ['Očekivani završetak', '23.11.2026. godine (dostava nacrta direktoru)']]")

a = s.index("  const F = [\n    ['Faza 1: MJERA/AKTIVNOST'"); b = s.index("  let n = 0;")
s = s[:a] + """  const IZ = 'Izvršeno, 23.11.2026.';
  const F = [
    ['Faza 1: MJERA/AKTIVNOST', 'ODGOVORNA OSOBA', 'ROK'],
    ['Donošenje Odluke o izmjenama i dopunama Odluke o izradi (imenovanje radne grupe)', 'Direktor', IZ],
    ['Priprema Programa rada radne grupe', 'Radna grupa', IZ],
    ['Odobravanje Programa rada radne grupe', 'Direktor', IZ],
    ['Obavještavanje zaposlenih o planiranim aktivnostima na izradi plana integriteta', 'Direktor', IZ],
    ['Faza 2: MJERA/AKTIVNOST', 'ODGOVORNA OSOBA', 'ROK'],
    ['Početna procjena stanja integriteta', 'Radna grupa', IZ],
    ['Prikupljanje neophodne dokumentacije za izradu plana integriteta', 'Radna grupa; sekretar; knjigovođa', IZ],
    ['Pregled i analiza prikupljene dokumentacije u vezi sa procjenom izloženosti i otpornosti institucije rizicima', 'Radna grupa', IZ],
    ['Analiza rezultata anonimne ankete zaposlenih (provedene u skladu s Programom 610-95/2025)', 'Radna grupa; psiholog', IZ],
    ['Identifikacija i analiza rizika i faktora rizika', 'Radna grupa', IZ],
    ['Procjena i rangiranje rizika', 'Radna grupa', IZ],
    ['Faza 3: MJERA/AKTIVNOST', 'ODGOVORNA OSOBA', 'ROK'],
    ['Odabir prijedloga mjera za unapređenje integriteta i određivanje prioriteta predloženih mjera', 'Radna grupa', IZ],
    ['Izrada i podnošenje Izvještaja o stanju integriteta u instituciji', 'Radna grupa', IZ],
    ['Faza 4: MJERA/AKTIVNOST', 'ODGOVORNA OSOBA', 'ROK'],
    ['Priprema i dostavljanje rukovodiocu institucije nacrta plana integriteta', 'Radna grupa', '23.11.2026.'],
    ['Pregled predloženog plana integriteta i dostavljanje istog na mišljenje Uredu za borbu protiv korupcije Unsko-sanskog kantona', 'Direktor', '23.11.2026.'],
    ['Usvajanje plana integriteta / imenovanje osobe zadužene za nadzor nad provođenjem plana integriteta', 'Direktor', 'Nakon pozitivnog mišljenja Ureda'],
    ['Dostava usvojenog plana Uredu i objava na web stranici škole', 'Direktor; sekretar', '15 dana od usvajanja'],
  ];
""" + s[b:]

a = s.index("    H2('5.3. Zapisnici sa sastanaka radne grupe', { pb: true }),"); b = s.index("  ];\n}\n\nfunction okvir()")
s = s[:a] + """    H2('5.3. Zapisnik sa sastanka radne grupe', { pb: true }),
    P('**Zapisnik sa sastanka radne grupe za izradu plana integriteta JU OŠ „Stijena“**', { keepNext: true, after: 60 }),
    table([2600, 7038], [[{ t: 'Datum', b: true, fill: C.light }, '23.11.2026. godine'], [{ t: 'Mjesto', b: true, fill: C.light }, 'JU OŠ „Stijena“, Stijena bb, Cazin'],
      [{ t: 'Prisutni', b: true, fill: C.light }, CLAN.map((c) => `${c[0]}, ${c[1]}`).join('; ')], [{ t: 'Odsutni', b: true, fill: C.light }, '—'],
      [{ t: 'Dnevni red', b: true, fill: C.light }, ['1. Usklađivanje izrade plana integriteta sa Zakonom o prevenciji korupcije u USK i Uputstvom', '2. Razmatranje rezultata ankete zaposlenih i početne procjene stanja integriteta', '3. Utvrđivanje rizika, ocjena njihovog intenziteta i prijedlog mjera', '4. Utvrđivanje Izvještaja o stanju integriteta i nacrta plana integriteta']],
      [{ t: 'Zaključci', b: true, fill: C.light }, [`1. Utvrđen je nacrt Plana integriteta JU OŠ „Stijena“ sa ${N.uk} identifikovana rizika i ${N.mj} mjera za unapređenje integriteta.`, '2. Usvojen je Izvještaj radne grupe o stanju integriteta (Prilog 1).', '3. Nacrt plana dostavlja se direktoru s prijedlogom da ga uputi Uredu za borbu protiv korupcije USK radi davanja mišljenja.']],
      [{ t: 'Zapisničar', b: true, fill: C.light }, '_______________________________'], [{ t: 'Menadžer/koordinator', b: true, fill: C.light }, 'Sabina Žunić  _______________________']], { header: 0, size: 18, cantSplit: true }),
""" + s[b:]

rep("const interni = [['Pravila škole', B, 'Na snazi'], ['Pravilnik o radu', '610-1133/24 od 27.09.2024.', 'Na snazi'],",
    "const interni = [['Pravila škole', 'Na snazi'], ['Pravilnik o radu (broj 610-1133/24 od 27.09.2024.)', 'Na snazi'],")
s = re.sub(r"\['([^'\]]+)', B, '([^']+)'\]", r"['\1', '\2']", s)
rep("table([4600, 2400, 2638], [['Interni akt', 'Broj i datum', 'Status'], ...interni], { size: 18 }),",
    "table([6000, 3638], [['Interni akt', 'Status'], ...interni.map((r) => [r[0], r[1].replace('Mjera ', 'Donosi se – mjera ')])], { size: 18 }),")
rep("posebno donošenjem pravilnika o internom prijavljivanju, određivanjem ovlaštenog lica i označavanjem sandučeta natpisom „ZA PRIJAVU KORUPCIJE“.",
    "posebno donošenjem pravilnika o internom prijavljivanju i rješenja o ovlaštenom licu.")
rep("P('Škola ima istaknuto sanduče za prijavu koruptivnog ponašanja.", "P('Škola ima na vidnom mjestu istaknuto sanduče s natpisom „ZA PRIJAVU KORUPCIJE“.")
rep("koji sadrži 34 pitanja grupisana u šest oblasti (A–F). Upitnik i izvještaj",
    "koji sadrži 34 pitanja grupisana u šest oblasti (A–F), u skladu s Programom rada broj 610-95/2025 (rok: 14.02.2025.). Upitnik i izvještaj")
rep("P(`Za prijem i postupanje po prijavama korupcije direktor rješenjem određuje ovlašteno lice (član 18. Zakona): ${B} (ime i prezime, radno mjesto), kontakt: 037/543-536; osstijena@hotmail.com. Ovlašteno lice ima VII stepen stručne spreme, završen pravni fakultet (240 ECTS ili ekvivalent) i najmanje tri godine radnog iskustva nakon sticanja visoke stručne spreme, odnosno, izuzetno, VII stepen druge vrste stručne spreme.`)",
    "P('Za prijem i postupanje po prijavama korupcije direktor rješenjem određuje ovlašteno lice (član 18. Zakona): **Semira Džakulić, sekretar škole**, a u slučaju odsutnosti ili sukoba interesa **Mersad Vatić, direktor**. Kontakt: 037/543-536; osstijena@hotmail.com. Ovlaštena lica imaju VII stepen stručne spreme (240 ECTS), u skladu sa članom 18. Zakona.')")
rep("P(`(1) Za osobu zaduženu za nadzor nad provođenjem plana integriteta imenuje se: ${B} (ime i prezime i funkcija).`)",
    "P('(1) Za osobu zaduženu za nadzor nad provođenjem plana integriteta imenuje se: Dževaira Džehverović, socijalni radnik.')")
rep("i Odluka o izmjenama i dopunama broj ${B} od ${B}).", "i Odluka o izmjenama i dopunama broj ${B} od 23.11.2026. godine).")
rep("P(`1. ${B} (ime i prezime, radno mjesto) određuje se za menadžera integriteta", "P(`1. Dževaira Džehverović, socijalni radnik, određuje se za menadžera integriteta")
rep("P(`1. ${B} (ime i prezime, stručna sprema, radno mjesto), koji/a ispunjava uslove iz člana 18. Zakona, određuje se",
    "P(`1. Semira Džakulić, sekretar škole, VII stepen stručne spreme (240 ECTS), koja ispunjava uslove iz člana 18. Zakona, određuje se")
rep("P(`2. U slučaju odsutnosti ili sukoba interesa ovlaštenog lica, poslove obavlja ${B} (ime i prezime, radno mjesto).`)",
    "P('2. U slučaju odsutnosti ili sukoba interesa ovlaštenog lica, poslove obavlja Mersad Vatić, direktor škole, VII stepen stručne spreme (240 ECTS).')")
open('plan_konacni.js', 'w').write(s)
print('OK')
