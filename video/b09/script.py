# Peptid Centar B09 · FAZA II · „Signal, ne sila“ (peptidi nisu steroidi)
# Smjer: video/FAZA2_BRIEF.md (edukativni luksuz, HELVERA bočica organski u kadru, bez prodajnog jezika).
# Činjenice (udžbenička biohemija/endokrinologija):
#   steroidni hormoni su lipofilni, prolaze membranu i vežu se za receptore unutar ćelije/jezgra te mijenjaju ekspresiju gena;
#   peptidni hormoni se vežu za receptore na površini ćelije i pokreću signal; razgrađuju se na aminokiseline;
#   inzulin (51 aminokiselina), oksitocin (9), GLP-1 (30) su peptidi koje tijelo samo pravi.
EL_PROMPT = "[calm] Peptidi nisu steroidi. [pause] [calm] I to nije sitnica, nego potpuno drugi način na koji se priča s tijelom. [pause] [serious] Steroid je sila. Ulazi u samu ćeliju, sve do jezgra, i mijenja šta ona radi. [pause] [warmly] Peptid je signal. Kratak lanac aminokiselina koji pokuca na površinu ćelije, preda poruku, i razgradi se. [pause] [calm] Čekić. I ključ. [pause] [warmly] Tvoje tijelo ovim jezikom govori svaki dan: inzulin, oksitocin, ge-el-pe jedan. Sve su to peptidi. [pause] [calm] Zato kod peptida nije pitanje koliko jako, nego koliko tačno. Čista molekula. Tačna poruka. [pause] [warmly] Sačuvaj ovo za sljedeći put kad ih neko pomiješa."
SCRIPT = [
    dict(tts="Peptidi nisu steroidi.", sub="Peptidi nisu steroidi.", scene="title"),
    dict(tts="I to nije sitnica, nego potpuno drugi način na koji se priča s tijelom.", sub="I to nije sitnica, nego potpuno drugi način na koji se priča s tijelom.", scene="lang"),
    dict(tts="Steroid je sila. Ulazi u samu ćeliju, sve do jezgra, i mijenja šta ona radi.", sub="Steroid je sila. Ulazi u samu ćeliju, sve do jezgra, i mijenja šta ona radi.", scene="steroid"),
    dict(tts="Peptid je signal. Kratak lanac aminokiselina koji pokuca na površinu ćelije, preda poruku, i razgradi se.", sub="Peptid je signal. Kratak lanac aminokiselina koji pokuca na površinu ćelije, preda poruku, i razgradi se.", scene="peptide"),
    dict(tts="Čekić. I ključ.", sub="Čekić. I ključ.", scene="tools"),
    dict(tts="Tvoje tijelo ovim jezikom govori svaki dan: inzulin, oksitocin, GLP jedan. Sve su to peptidi.", sub="Tvoje tijelo ovim jezikom govori svaki dan: inzulin, oksitocin, GLP-1. Sve su to peptidi.", scene="body"),
    dict(tts="Zato kod peptida nije pitanje koliko jako, nego koliko tačno. Čista molekula. Tačna poruka.", sub="Zato kod peptida nije pitanje koliko jako, nego koliko tačno. Čista molekula. Tačna poruka.", scene="product"),
    dict(tts="Sačuvaj ovo za sljedeći put kad ih neko pomiješa.", sub="Sačuvaj ovo za sljedeći put kad ih neko pomiješa.", scene="save"),
]
