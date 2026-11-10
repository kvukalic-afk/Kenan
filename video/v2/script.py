# Peptid Centar B01 · GHK-Cu · V2 scenarij
# tts: tekst za glas (brojke riječima) | sub: titl | acc: istaknute riječi | beats: (grafika, udio rečenice)
# Izvori: E1 = Badenhorst i sar. 2016 (DOI 10.4172/2329-8847.1000166)
#         E2 = Pickart & Margolina 2018, Int J Mol Sci (PMC6073405)
SCRIPT = [
    dict(tts="S dvadeset godina imaš ga puno. Sa šezdeset, manje od pola.",
         sub="S 20 godina imaš ga puno. Sa 60, manje od pola.",
         acc=["puno.", "pola."], beats=[("decline", 0.0)], src="E2"),
    dict(tts="Prirodno ga ima u tvojoj krvi. Zove se ge-ha-ka bakar, ili bakreni peptid.",
         sub="Prirodno ga ima u tvojoj krvi. Zove se GHK-Cu, ili bakreni peptid.",
         acc=["krvi.", "GHK-Cu,"], beats=[("blood", 0.0), ("molecule", 0.42)], src="E2"),
    dict(tts="Otkriven je davne sedamdeset treće, kad je krv mladih natjerala staro tkivo jetre da pravi proteine kao mlađe.",
         sub="Otkriven je davne 1973, kad je krv mladih natjerala staro tkivo jetre da pravi proteine kao mlađe.",
         acc=["1973,", "mlađe."], beats=[("year", 0.0), ("lab", 0.3)], src="E2"),
    dict(tts="Doduše, u epruveti. Pa šta se desi kad ga staviš na kožu?",
         sub="Doduše, u epruveti. Pa šta se desi kad ga staviš na kožu?",
         acc=["epruveti.", "kožu?"], beats=[("level1", 0.0), ("faceq", 0.45)], src="E2"),
    dict(tts="Četrdeset žena, osam sedmica. Jedna strana lica dobila je serum s peptidom, druga isti serum bez njega.",
         sub="40 žena, 8 sedmica. Jedna strana lica dobila je serum s peptidom, druga isti serum bez njega.",
         acc=["40", "8", "peptidom,"], beats=[("chips", 0.0), ("split", 0.33)], src="E1"),
    dict(tts="Volumen bora pao je za skoro pedeset šest posto, u odnosu na serum bez peptida.",
         sub="Volumen bora pao je za skoro 56% u odnosu na serum bez peptida.",
         acc=["56%"], beats=[("wrinkle", 0.0)], src="E1"),
    dict(tts="E sad, studija je mala, a platio ju je proizvođač. Nivo tri od pet.",
         sub="E sad, studija je mala, a platio ju je proizvođač. Nivo 3 od 5.",
         acc=["mala,", "proizvođač.", "3"], beats=[("limits", 0.0), ("scale3", 0.55)], src="E1"),
    dict(tts="Nije čudo preko noći. Ali je lijep primjer kako nauka ide: od epruvete, do lica.",
         sub="Nije čudo preko noći. Ali je lijep primjer kako nauka ide: od epruvete do lica.",
         acc=["nauka", "lica."], beats=[("nomiracle", 0.0), ("journey", 0.3)], src="E1+E2"),
    dict(tts="Sačuvaj, i prati za sljedeći peptid.",
         sub="Sačuvaj, i prati za sljedeći peptid.",
         acc=["Sačuvaj,"], beats=[("cta", 0.0)], src="—"),
]
