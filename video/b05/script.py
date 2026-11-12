# Peptid Centar B05 · 3 peptida, 3 izmjerena rezultata (UGC + stvarni snimci) + potpis HELVERA
# Izvori: Badenhorst 2016 (DOI 10.4172/2329-8847.1000166) · TRIUMPH-1 NEJM 2026 (PMID 42814954) · Coviello 2005 (PMID 15713727) · Cureus 2022 (PMID 35800844)
EL_PROMPT = "[excited] Tri peptida. Tri IZMJERENA rezultata. Bez priča — samo brojke! [pause] [warmly] Prvi: bakreni peptid, u serumu za kožu. 40 žena, 8 sedmica: volumen bora manji za 56 posto. [pause] [excited] Drugi: retatrutid. Preko 2300 ljudi... i u najjačoj grupi, minus 25 posto tjelesne težine! [pause] [warmly] Treći: ha ce ge. Uz terapiju testosteronom, čuva vlastitu proizvodnju. A u drugoj studiji, 8 od 10 muškaraca prijavilo je bolji libido. [pause] [curious] Koža. Kilogrami. Testosteron. Tri različita peptida — i sve izmjereno na ljudima. [pause] [excited] Koji tebe najviše zanima? Napiši u komentar! [pause] [warmly] Sačuvaj ovo, i prati Peptid Centar."
HELVERA_LINE = "edukativni projekat brenda"
SCRIPT = [
    dict(tts="Tri peptida. Tri izmjerena rezultata. Bez priča, samo brojke!", sub="Tri peptida. Tri IZMJERENA rezultata. Bez priča, samo brojke!", acc=["IZMJERENA", "brojke!"],
         beats=[(0, "gym2", 1.0, "hook3"), (0.6, "crowd2", 0.5, "numbers")]),
    dict(tts="Prvi: bakreni peptid, u serumu za kožu. Četrdeset žena, osam sedmica: volumen bora manji za pedeset šest posto.", sub="Prvi: bakreni peptid, u serumu za kožu. 40 žena, 8 sedmica: volumen bora manji za 56%.", acc=["Prvi:", "56%."],
         beats=[(0, "serum", 0.5, "p1name"), (0.45, "skin", 0.5, "p1num")]),
    dict(tts="Drugi: retatrutid. Preko dvije hiljade i trista ljudi, i u najjačoj grupi, minus dvadeset pet posto tjelesne težine!", sub="Drugi: retatrutid. Preko 2300 ljudi, i u najjačoj grupi, −25% tjelesne težine!", acc=["Drugi:", "−25%"],
         beats=[(0, "meas1", 0.5, "p2name"), (0.42, "scale1", 5.0, "p2num")]),
    dict(tts="Treći: ha ce ge. Uz terapiju testosteronom, čuva vlastitu proizvodnju. A u drugoj studiji, osam od deset muškaraca prijavilo je bolji libido.", sub="Treći: HCG. Uz terapiju testosteronom, čuva vlastitu proizvodnju. A u drugoj studiji, 8 od 10 muškaraca prijavilo je bolji libido.", acc=["Treći:", "8", "10", "libido."],
         beats=[(0, "gym1", 3.0, "p3name"), (0.2, "mirror", 2.0, "p3a"), (0.55, "couple", 1.0, "p3num")]),
    dict(tts="Koža. Kilogrami. Testosteron. Tri različita peptida, i sve izmjereno na ljudima.", sub="Koža. Kilogrami. Testosteron. Tri različita peptida, i sve izmjereno na ljudima.", acc=["Koža.", "Kilogrami.", "Testosteron.", "ljudima."],
         beats=[(0, "run1", 0.5, "recap")]),
    dict(tts="Koji tebe najviše zanima? Napiši u komentar!", sub="Koji tebe najviše zanima? Napiši u komentar!", acc=["zanima?", "komentar!"],
         beats=[(0, "phone1", 0.5, "ask")]),
    dict(tts="Sačuvaj ovo, i prati Peptid Centar.", sub="Sačuvaj ovo, i prati Peptid Centar.", acc=["Sačuvaj", "prati"],
         beats=[(0, "highfive", 0.0, "save"), (0.5, "gym3", 1.0, "follow")]),
]
