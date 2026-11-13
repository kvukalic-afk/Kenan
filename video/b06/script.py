# Peptid Centar B06 · „5 znakova sumnjivog pakovanja“ + prikaz HELVERA pakovanja (3D prikazi iz prijedloga brenda)
# Pet znakova i rješenja: slajd „Šta kod početnika budi sumnju, a šta povjerenje“ iz prijedloga brenda HELVERA (30. 10. 2026).
# Pakovanje je KONCEPT (ilustrativni 3D prikaz), proizvod još nije na tržištu: video to jasno kaže.
EL_PROMPT = "[excited] Pet znakova da je pakovanje peptida SUMNJIVO! [pause] [curious] Jedan: sitan tekst, pa ne možeš pročitati ni naziv ni dozu. [pause] Dva: prodavač bez imena i adrese. [pause] Tri: holografija, neon i natpis \"samo za istraživanje\". [pause] Četiri: bočica bez kutije i uputstva. [pause] Pet: nikakav način da provjeriš seriju. [pause] [warmly] A pravo pakovanje? Krupan naziv i doza, ime firme, serija i rok, uputstvo i kod za provjeru. [pause] [warmly] Ovako izgleda pakovanje na kojem radimo. HELVERA. Uskoro. [pause] [excited] Sačuvaj ovo prije sljedeće kupovine, i prati Peptid Centar!"
VIDIQ_TEXT = EL_PROMPT
HELVERA_LINE = "edukativni projekat brenda"
BG = "img:packbg.png"
SCRIPT = [
    dict(tts="Pet znakova da je pakovanje peptida sumnjivo!", sub="5 znakova da je pakovanje peptida SUMNJIVO!", acc=["5", "SUMNJIVO!"],
         beats=[(0, BG, 0, "hook5")]),
    dict(tts="Jedan: sitan tekst, pa ne možeš pročitati ni naziv ni dozu.", sub="1: sitan tekst, pa ne možeš pročitati ni naziv ni dozu.", acc=["1:", "naziv", "dozu."],
         beats=[(0, BG, 0, "sign1")]),
    dict(tts="Dva: prodavač bez imena i adrese.", sub="2: prodavač bez imena i adrese.", acc=["2:", "bez"],
         beats=[(0, BG, 0, "sign2")]),
    dict(tts="Tri: holografija, neon i natpis samo za istraživanje.", sub="3: holografija, neon i natpis „samo za istraživanje“.", acc=["3:", "holografija,", "neon"],
         beats=[(0, BG, 0, "sign3")]),
    dict(tts="Četiri: bočica bez kutije i uputstva.", sub="4: bočica bez kutije i uputstva.", acc=["4:", "bez"],
         beats=[(0, BG, 0, "sign4")]),
    dict(tts="Pet: nikakav način da provjeriš seriju.", sub="5: nikakav način da provjeriš seriju.", acc=["5:", "seriju."],
         beats=[(0, BG, 0, "sign5")]),
    dict(tts="A pravo pakovanje? Krupan naziv i doza, ime firme, serija i rok, uputstvo i kod za provjeru.", sub="A pravo pakovanje? Krupan naziv i doza, ime firme, serija i rok, uputstvo i kod za provjeru.", acc=["pakovanje?", "provjeru."],
         beats=[(0, BG, 0, "right")]),
    dict(tts="Ovako izgleda pakovanje na kojem radimo. HELVERA. Uskoro.", sub="Ovako izgleda pakovanje na kojem radimo. HELVERA. Uskoro.", acc=["HELVERA.", "Uskoro."],
         beats=[(0, BG, 0, "reveal1"), (0.5, BG, 0, "reveal2")]),
    dict(tts="Sačuvaj ovo prije sljedeće kupovine, i prati Peptid Centar.", sub="Sačuvaj ovo prije sljedeće kupovine, i prati Peptid Centar.", acc=["Sačuvaj", "prati"],
         beats=[(0, "phone1", 0.5, "save"), (0.55, BG, 0, "follow")]),
]
