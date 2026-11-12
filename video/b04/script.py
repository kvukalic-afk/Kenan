# Peptid Centar B04 · HCG za muškarce (UGC + stvarni snimci) · scenarij
# Izvori: Coviello i sar. JCEM 2005 (PMID 15713727) · Hsieh i sar. J Urol 2013 (PMID 23260550) · Cureus 2022 (PMID 35800844) · WADA Prohibited List 2026 (S2)
EL_PROMPT = "[excited] Hormon iz TRUDNOĆE... koji muškarcu pali testosteron?! [pause] [curious] Zove se ha ce ge. U muškom tijelu glumi signal iz mozga, koji testisima kaže: PRAVI testosteron! [pause] [warmly] Znači, ne dobijaš tuđi hormon. Tvoje tijelo pravi SVOJ. [pause] [curious] A zašto je to bitno? Kad muškarac uzima testosteron izvana, vlastita tvornica se ugasi. U jednoj studiji, testosteron u testisima pao je za 94 posto! [pause] [excited] A uz ha ce ge? Tvornica je nastavila raditi. I plodnost je ostala sačuvana. [pause] [warmly] A u studiji gdje su muškarci dobijali samo ha ce ge, 8 od 10 prijavilo je bolji libido. [pause] [excited] Toliko je moćan, da je muškarcima u sportu ZABRANJEN! [pause] [warmly] Sačuvaj ovo, pošalji drugu iz teretane... i prati Peptid Centar!"
SCRIPT = [
    dict(tts="Hormon iz trudnoće, koji muškarcu pali testosteron?!", sub="Hormon iz TRUDNOĆE, koji muškarcu pali testosteron?!", acc=["TRUDNOĆE,", "testosteron?!"],
         beats=[(0, "preg", 2.0, "pregslam"), (0.5, "gym2", 1.0, "testo")]),
    dict(tts="Zove se ha ce ge. U muškom tijelu glumi signal iz mozga, koji testisima kaže: pravi testosteron!", sub="Zove se HCG. U muškom tijelu glumi signal iz mozga, koji testisima kaže: PRAVI testosteron!", acc=["HCG.", "PRAVI"],
         beats=[(0, "syr2", 0.3, "hcgname"), (0.3, "mirror", 2.0, "signal")]),
    dict(tts="Znači, ne dobijaš tuđi hormon. Tvoje tijelo pravi svoj.", sub="Znači, ne dobijaš tuđi hormon. Tvoje tijelo pravi SVOJ.", acc=["SVOJ."],
         beats=[(0, "gym1", 3.0, "own")]),
    dict(tts="A zašto je to bitno? Kad muškarac uzima testosteron izvana, vlastita tvornica se ugasi. U jednoj studiji, testosteron u testisima pao je za devedeset četiri posto!", sub="A zašto je to bitno? Kad muškarac uzima testosteron izvana, vlastita tvornica se ugasi. U jednoj studiji, testosteron u testisima pao je za 94%!", acc=["ugasi.", "94%!"],
         beats=[(0, "worried2", 2.0, "why"), (0.2, "factory", 0.3, "factoryoff"), (0.6, "worried", 2.0, "m94")]),
    dict(tts="A uz ha ce ge? Tvornica je nastavila raditi. I plodnost je ostala sačuvana.", sub="A uz HCG? Tvornica je nastavila raditi. I plodnost je ostala sačuvana.", acc=["HCG?", "raditi.", "sačuvana."],
         beats=[(0, "factory2", 0.3, "factoryon"), (0.55, "father2", 1.0, "fert")]),
    dict(tts="A u studiji gdje su muškarci dobijali samo ha ce ge, osam od deset prijavilo je bolji libido.", sub="A u studiji gdje su muškarci dobijali samo HCG, 8 od 10 prijavilo je bolji libido.", acc=["8", "10", "libido."],
         beats=[(0, "couple", 1.0, "libido")]),
    dict(tts="Toliko je moćan, da je muškarcima u sportu zabranjen!", sub="Toliko je moćan, da je muškarcima u sportu ZABRANJEN!", acc=["moćan,", "ZABRANJEN!"],
         beats=[(0, "sprint2", 0.5, "banned")]),
    dict(tts="Sačuvaj ovo, pošalji drugu iz teretane, i prati Peptid Centar!", sub="Sačuvaj ovo, pošalji drugu iz teretane, i prati Peptid Centar!", acc=["Sačuvaj", "pošalji", "prati"],
         beats=[(0, "highfive", 0.0, "save"), (0.6, "gym3", 1.0, "follow")]),
]
