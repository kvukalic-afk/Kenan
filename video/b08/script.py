# Peptid Centar B08 · „Buka hrane“ (food noise) i GLP-1 peptid semaglutid
# Avatar: žena 35–50 koja je probala sve dijete i krivi sebe. Villain je vanjski: signal (buka hrane), ne njen karakter.
# Ideja iz istraživanja javnih rasprava korisnika (Reddit/TikTok pojam „food noise“) i objavljenih izjava pacijenata.
# Struktura po video/COACH_ZNANJE.md: hook (identitet/bol, prvih 5 riječi) → anchor → open loop → senzorna scena → problem → root cause (radio)
#   → mehanizam → dokaz + stvarni citati → realno očekivanje → mini-film (budući ja) → blagi CTA.
# Izvori:
#   citati pacijenata: de Vere Hunt i sar., JAMA Network Open 2026 (PMID 42247231), 30 intervjua, Stanford: učesnica 2 i učesnik 24
#   62% → 16% stalne misli o hrani: anketa 550 korisnika semaglutida, EASD 2025 (Kvist i sar.; ScienceDaily 15. 9. 2025)
#   −14,9% tjelesne težine, 1961 osoba, 68 sedmica: Wilding i sar., NEJM 2021, STEP 1 (PMID 33567185)
#   „food noise“ kao pojam s Reddita/TikToka uz GLP-1: Wylie i sar., Appetite (PMID 42772688)
#   prirodni GLP-1 traje oko 2 minute, semaglutid oko sedmicu: farmakologija (poluživot ~7 dana)
EL_PROMPT = "[warmly] Nisi slaba. I nemaš manjak volje. [pause] [warmly] Ako cijeli dan misliš na hranu, čak i kad si sita, ovo je za tebe. [pause] [sad] Deset je uveče. Kuća je tiha, a ti opet stojiš pred otvorenim frižiderom i pregovaraš sama sa sobom. [pause] [frustrated] Probala si sve. Keto. Post. Brojanje kalorija. Izdržiš par sedmica, a onda glas u glavi pobijedi, i ti kriviš sebe. [pause] [curious] Taj glas ima ime: buka hrane. I nije karakter, nego signal. [pause] [curious] Zamisli radio u glavi koji cijeli dan svira istu stanicu. Tvoje tijelo ima hormon koji ga stišava, ge-el-pe jedan, ali on traje samo par minuta. [pause] [excited] Semaglutid je peptid koji oponaša taj isti hormon, samo što traje cijelu sedmicu. [pause] [excited] U anketi petsto pedeset ljudi koji ga koriste, stalne misli o hrani imalo je šezdeset dva posto prije, a samo šesnaest posto poslije. [pause] [warmly] Jedna žena iz studije sa Stanforda rekla je: cijeli moj svijet se vrtio oko hrane. A neko drugi: dobar je osjećaj kad hrana više ne naređuje meni. [pause] [warmly] Nije čarobni štapić. I dalje ti biraš šta jedeš. Ali prvi put, biraš u tišini. [pause] [warmly] Zamisli isto to veče. Prođeš pored frižidera, i ne primijetiš ga. Popiješ čaj, i odeš spavati. [pause] [warmly] Ako znaš nekoga ko se godinama bori sam sa sobom, pošalji joj ovo. Nije do nje. I prati Peptid Centar."
VIDIQ_TEXT = EL_PROMPT
SCRIPT = [
    dict(tts="Nisi slaba. I nemaš manjak volje.", sub="Nisi slaba. I nemaš manjak volje.", acc=["Nisi", "slaba."],
         beats=[(0, "cake", 0.5, "hook1")]),
    dict(tts="Ako cijeli dan misliš na hranu, čak i kad si sita, ovo je za tebe.", sub="Ako cijeli dan misliš na hranu, čak i kad si sita, ovo je za tebe.", acc=["hranu,", "tebe."],
         beats=[(0, "cookie", 0.0, "anchor")]),
    dict(tts="Deset je uveče. Kuća je tiha, a ti opet stojiš pred otvorenim frižiderom i pregovaraš sama sa sobom.", sub="Deset je uveče. Kuća je tiha, a ti opet stojiš pred otvorenim frižiderom i pregovaraš sama sa sobom.", acc=["Deset", "frižiderom"],
         beats=[(0, "evening2", 0.5, "night"), (0.5, "evening1", 3.0, "negotiate")]),
    dict(tts="Probala si sve. Keto. Post. Brojanje kalorija. Izdržiš par sedmica, a onda glas u glavi pobijedi, i ti kriviš sebe.", sub="Probala si sve. Keto. Post. Brojanje kalorija. Izdržiš par sedmica, a onda glas u glavi pobijedi, i ti kriviš sebe.", acc=["sve.", "sebe."],
         beats=[(0, "scale1", 0.5, "tried"), (0.55, "meas2", 1.0, "blame")]),
    dict(tts="Taj glas ima ime: buka hrane. I nije karakter, nego signal.", sub="Taj glas ima ime: BUKA HRANE. I nije karakter, nego signal.", acc=["BUKA", "HRANE.", "signal."],
         beats=[(0, "tired", 1.0, "name"), (0.55, "dna", 0.0, "signal")]),
    dict(tts="Zamisli radio u glavi koji cijeli dan svira istu stanicu. Tvoje tijelo ima hormon koji ga stišava, GLP jedan, ali on traje samo par minuta.", sub="Zamisli radio u glavi koji cijeli dan svira istu stanicu. Tvoje tijelo ima hormon koji ga stišava, GLP-1, ali on traje samo par minuta.", acc=["radio", "GLP-1,", "minuta."],
         beats=[(0, "dna", 3.0, "radio"), (0.5, "dna", 7.0, "glp")]),
    dict(tts="Semaglutid je peptid koji oponaša taj isti hormon, samo što traje cijelu sedmicu.", sub="Semaglutid je peptid koji oponaša taj isti hormon, samo što traje cijelu sedmicu.", acc=["Semaglutid", "sedmicu."],
         beats=[(0, "lab1", 1.0, "sema")]),
    dict(tts="U anketi petsto pedeset ljudi koji ga koriste, stalne misli o hrani imalo je šezdeset dva posto prije, a samo šesnaest posto poslije.", sub="U anketi 550 ljudi koji ga koriste, stalne misli o hrani imalo je 62% prije, a samo 16% poslije.", acc=["62%", "16%"],
         beats=[(0, "crowd1", 0.5, "survey")]),
    dict(tts="Jedna žena iz studije sa Stanforda rekla je: cijeli moj svijet se vrtio oko hrane. A neko drugi: dobar je osjećaj kad hrana više ne naređuje meni.", sub="Jedna žena iz studije sa Stanforda rekla je: „Cijeli moj svijet se vrtio oko hrane.“ A neko drugi: „Dobar je osjećaj kad hrana više ne naređuje meni.“", acc=["Stanforda", "hrane.“", "meni.“"],
         beats=[(0, "fridge", 0.5, "quote1"), (0.52, "coffee", 1.0, "quote2")]),
    dict(tts="Nije čarobni štapić. I dalje ti biraš šta jedeš. Ali prvi put, biraš u tišini.", sub="Nije čarobni štapić. I dalje ti biraš šta jedeš. Ali prvi put, biraš u TIŠINI.", acc=["štapić.", "TIŠINI."],
         beats=[(0, "cozy", 0.5, "notmagic"), (0.6, "cozy", 4.0, "silence")]),
    dict(tts="Zamisli isto to veče. Prođeš pored frižidera, i ne primijetiš ga. Popiješ čaj, i odeš spavati.", sub="Zamisli isto to veče. Prođeš pored frižidera, i ne primijetiš ga. Popiješ čaj, i odeš spavati.", acc=["Zamisli", "spavati."],
         beats=[(0, "evening1", 8.0, "future"), (0.55, "tea", 2.0, "teaend")]),
    dict(tts="Ako znaš nekoga ko se godinama bori sam sa sobom, pošalji joj ovo. Nije do nje. I prati Peptid Centar.", sub="Ako znaš nekoga ko se godinama bori sam sa sobom, pošalji joj ovo. Nije do nje. I prati Peptid Centar.", acc=["pošalji", "prati"],
         beats=[(0, "phone1", 0.5, "save"), (0.6, "coffee", 5.0, "follow")]),
]
