# Peptid Centar B07 · BPC-157: tetiva koja ne zarasta (avatar: tata 35–45, rekreativac, povreda tetive/koljena)
# Struktura po coachu (video/COACH_ZNANJE.md): Hook → Priča → Problem → Otkriće (root cause + analogija) → Rješenje (mehanizam + dokaz)
#   → Rezultat (budući ja, BEZ izmišljenog testimonijala) → blagi CTA. Emotivni luk: šok → očaj → znatiželja → nada → radost.
# Izvori:
#   tetive slabo prokrvljene; BPC-157 → VEGFR2, nove krvne žile, fibroblasti: Curr Rev Musculoskelet Med 2025 (PMID 40789979)
#   razvijen u Zagrebu, iz ljudskog želučanog soka: Sikirić i sar., Medicinski fakultet Sveučilišta u Zagrebu (npr. Pharmaceuticals 2026, PMID 41754849); Chang 2011
#   ćelije tetive se brže kreću i preživljavaju: Chang i sar., J Appl Physiol 2011 (PMID 21030672)
#   više receptora za hormon rasta u ćelijama tetive: Chang i sar., Molecules 2014 (PMID 25415472)
#   11 od 12 pacijenata, bol u koljenu značajno manja: Lee & Padgett, Altern Ther Health Med 2021 (PMID 34324435)
EL_PROMPT = "[sad] Najgore nije bol u koljenu. [pause] [sad] Najgore je kad te dijete pita: tata, zašto više ne igraš s nama? [pause] [warmly] Nekad si trčao. Mali fudbal svake srijede. A onda jedan pogrešan korak, i tetiva te izda. [pause] [frustrated] Led. Tablete. Trake. Mirovanje. Prođu mjeseci, a čim potrčiš, bol se vrati. [pause] [sad] I polako se pomiriš. Gledaš sa strane, dok drugi igraju s tvojim djetetom. [pause] [curious] A niko ti nije rekao zašto. Tetive imaju jako malo krvnih žila. [pause] [curious] Zamisli selo na kraju makadama: kamion s materijalom za popravku jedva stigne. [pause] [curious] Zato tetiva zarasta mjesecima. Led i tablete smire bol, ali krv ne dovedu. [pause] [excited] A onda otkriješ BPC-157. Peptid razvijen u Zagrebu, iz ljudskog želučanog soka. [pause] [curious] U laboratoriji radi tri stvari. [pause] [curious] Jedan: pravi nove krvne žile, asfaltira put do tetive. [pause] [curious] Dva: ćelije tetive brže stižu do povrede. [pause] [curious] Tri: bolje čuju hormon rasta, signal za popravku. [pause] [excited] U jednoj klinici, kod jedanaest od dvanaest ljudi, bol u koljenu se značajno smanjila. [pause] [warmly] Nije steroid, ni tableta protiv bolova. Pomaže tijelu da samo popravi tkivo. [pause] [warmly] Zamisli: subota ujutro, mali ti zabije gol i potrči ti u zagrljaj. [pause] [warmly] Bez straha od sljedećeg koraka. [pause] [warmly] Pošalji ovo nekome kome tetiva ne da mira. I prati Peptid Centar."
VIDIQ_TEXT = EL_PROMPT
SCRIPT = [
    # 1 HOOK
    dict(tts="Najgore nije bol u koljenu.", sub="Najgore nije bol u koljenu.", acc=["Najgore", "nije"],
         beats=[(0, "worried", 1.0, "hook1")]),
    dict(tts="Najgore je kad te dijete pita: tata, zašto više ne igraš s nama?", sub="Najgore je kad te dijete pita: „Tata, zašto više ne igraš s nama?“", acc=["dijete", "„Tata,"],
         beats=[(0, "frisbee", 3.0, "quote")]),
    # 2 PRIČA
    dict(tts="Nekad si trčao. Mali fudbal svake srijede. A onda jedan pogrešan korak, i tetiva te izda.", sub="Nekad si trčao. Mali fudbal svake srijede. A onda jedan pogrešan korak, i tetiva te izda.", acc=["trčao.", "tetiva"],
         beats=[(0, "run1", 1.0, "past"), (0.55, "legrub", 0.5, "snap")]),
    # 3 PROBLEM
    dict(tts="Led. Tablete. Trake. Mirovanje. Prođu mjeseci, a čim potrčiš, bol se vrati.", sub="Led. Tablete. Trake. Mirovanje. Prođu mjeseci, a čim potrčiš, bol se vrati.", acc=["Led.", "Tablete.", "Trake.", "Mirovanje.", "vrati."],
         beats=[(0, "tape", 1.0, "tried"), (0.6, "ankle", 2.0, "back")]),
    dict(tts="I polako se pomiriš. Gledaš sa strane, dok drugi igraju s tvojim djetetom.", sub="I polako se pomiriš. Gledaš sa strane, dok drugi igraju s tvojim djetetom.", acc=["pomiriš", "djetetom."],
         beats=[(0, "worried2", 1.0, "resign"), (0.45, "sword", 2.0, "bench")]),
    # 4 OTKRIĆE (root cause + analogija)
    dict(tts="A niko ti nije rekao zašto. Tetive imaju jako malo krvnih žila.", sub="A niko ti nije rekao ZAŠTO. Tetive imaju jako malo krvnih žila.", acc=["ZAŠTO.", "malo"],
         beats=[(0, "lab2", 1.0, "why"), (0.42, "dna", 0.0, "vessels")]),
    dict(tts="Zamisli selo na kraju makadama: kamion s materijalom za popravku jedva stigne.", sub="Zamisli selo na kraju makadama: kamion s materijalom za popravku jedva stigne.", acc=["makadama.", "jedva"],
         beats=[(0, "dna", 3.0, "road")]),
    dict(tts="Zato tetiva zarasta mjesecima. Led i tablete smire bol, ali krv ne dovedu.", sub="Zato tetiva zarasta MJESECIMA. Led i tablete smire bol, ali krv ne dovedu.", acc=["MJESECIMA.", "krv"],
         beats=[(0, "knee2", 1.0, "months"), (0.5, "knee1", 1.0, "icepill")]),
    # 5 RJEŠENJE (mehanizam + dokaz)
    dict(tts="A onda otkriješ BPC-157. Peptid razvijen u Zagrebu, iz ljudskog želučanog soka.", sub="A onda otkriješ BPC-157. Peptid razvijen u Zagrebu, iz ljudskog želučanog soka.", acc=["BPC-157.", "Zagrebu,"],
         beats=[(0, "lab1", 1.0, "reveal"), (0.45, "lab2", 3.0, "zagreb")]),
    dict(tts="U laboratoriji radi tri stvari.", sub="U laboratoriji radi TRI stvari.", acc=["TRI"],
         beats=[(0, "blood", 1.0, "three")]),
    dict(tts="Jedan: pravi nove krvne žile, asfaltira put do tetive.", sub="1: pravi nove krvne žile, asfaltira put do tetive.", acc=["1:", "asfaltira"],
         beats=[(0, "dna", 6.0, "m1")]),
    dict(tts="Dva: ćelije tetive brže stižu do povrede.", sub="2: ćelije tetive brže stižu do povrede.", acc=["2:", "brže"],
         beats=[(0, "dna", 9.0, "m2")]),
    dict(tts="Tri: bolje čuju hormon rasta, signal za popravku.", sub="3: bolje čuju hormon rasta, signal za popravku.", acc=["3:", "hormon", "rasta,"],
         beats=[(0, "dna", 12.0, "m3")]),
    dict(tts="U jednoj klinici, kod jedanaest od dvanaest ljudi, bol u koljenu se značajno smanjila.", sub="U jednoj klinici, kod 11 od 12 ljudi, bol u koljenu se značajno smanjila.", acc=["11", "12", "smanjila."],
         beats=[(0, "electro", 1.0, "proof")]),
    dict(tts="Nije steroid, ni tableta protiv bolova. Pomaže tijelu da samo popravi tkivo.", sub="Nije steroid, ni tableta protiv bolova. Pomaže tijelu da SAMO popravi tkivo.", acc=["steroid.", "SAMO"],
         beats=[(0, "bandage", 1.0, "notsteroid")]),
    # 6 REZULTAT (budući ja)
    dict(tts="Zamisli: subota ujutro, mali ti zabije gol i potrči ti u zagrljaj.", sub="Zamisli: subota ujutro, mali ti zabije gol i potrči ti u zagrljaj.", acc=["Zamisli:", "zagrljaj."],
         beats=[(0, "frisbee", 9.0, "future"), (0.55, "daddau", 0.5, "hug")]),
    dict(tts="Bez straha od sljedećeg koraka.", sub="Bez straha od sljedećeg koraka.", acc=["Bez", "straha"],
         beats=[(0, "dadpark", 1.0, "nofear")]),
    # 7 CTA (blago)
    dict(tts="Pošalji ovo nekome kome tetiva ne da mira. I prati Peptid Centar.", sub="Pošalji ovo nekome kome tetiva ne da mira. I prati Peptid Centar.", acc=["pošalji", "prati"],
         beats=[(0, "phone1", 0.5, "save"), (0.62, "father2", 1.0, "follow")]),
]
