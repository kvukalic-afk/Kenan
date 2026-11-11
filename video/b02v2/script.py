# Peptid Centar B02 V2 (UGC + stvarni snimci) · scenarij
# Izvor: TRIUMPH-1, N Engl J Med 2026, DOI 10.1056/NEJMoa2604169 (PMID 42814954) · ABC News TikTok 1,7 M pregleda (vidIQ, 10. 11. 2026)
EL_PROMPT = "[excited] Čekaj, ŠTA?! Minus 25 posto težine?! [pause] [curious] Zamisli: imaš 100 kila... i spadneš na 75. [pause] [excited] E, to je PROSJEK u najjačoj grupi nove studije! [pause] [warmly] Peptid se zove retatrutid. I ne gađa jedan hormon gladi — nego TRI odjednom. [pause] [excited] Preko 2300 ljudi. 80 sedmica. Objavljeno u jednom od najjačih medicinskih časopisa na svijetu! [pause] [warmly] I nije samo vaga. Ljude s bolnim koljenima manje je boljelo. A oni s apnejom, lakše su disali u snu. [pause] [excited] Zato o ovome bruji cijeli internet! [pause] [warmly] Sačuvaj ovo, pošalji nekom ko se muči s kilama... i prati Peptid Centar!"
SCRIPT = [
    dict(tts="Čekaj, šta?! Minus dvadeset pet posto težine?!", sub="Čekaj, ŠTA?! −25% težine?!", acc=["ŠTA?!", "−25%"],
         beats=[(0, "scale1", 5.0, "slam25")]),
    dict(tts="Zamisli: imaš sto kila, i spadneš na sedamdeset pet.", sub="Zamisli: imaš 100 kila, i spadneš na 75.", acc=["100", "75."],
         beats=[(0, "meas1", 0.5, "kg100"), (0.45, "meas1", 6.0, "morph")]),
    dict(tts="E, to je prosjek u najjačoj grupi nove studije!", sub="E, to je PROSJEK u najjačoj grupi nove studije!", acc=["PROSJEK"],
         beats=[(0, "exer2", 0.5, "prosjek")]),
    dict(tts="Peptid se zove retatrutid. I ne gađa jedan hormon gladi, nego tri odjednom.", sub="Peptid se zove retatrutid. I ne gađa jedan hormon gladi, nego TRI odjednom.", acc=["retatrutid.", "TRI"],
         beats=[(0, "syr2", 0.3, "name"), (0.42, "lab2", 0.5, "three")]),
    dict(tts="Preko dvije hiljade i trista ljudi. Osamdeset sedmica. Objavljeno u jednom od najjačih medicinskih časopisa na svijetu!", sub="Preko 2300 ljudi. 80 sedmica. Objavljeno u jednom od najjačih medicinskih časopisa na svijetu!", acc=["2300", "80", "najjačih"],
         beats=[(0, "crowd2", 0.5, "people"), (0.42, "lab1", 0.5, "nejm")]),
    dict(tts="I nije samo vaga. Ljude s bolnim koljenima manje je boljelo. A oni s apnejom, lakše su disali u snu.", sub="I nije samo vaga. Ljude s bolnim koljenima manje je boljelo. A oni s apnejom lakše su disali u snu.", acc=["vaga.", "koljenima", "snu."],
         beats=[(0, "scale2", 0.5, "notonly"), (0.2, "knee2", 0.5, "knee"), (0.62, "sleep1", 0.5, "sleep")]),
    dict(tts="Zato o ovome bruji cijeli internet!", sub="Zato o ovome bruji cijeli internet!", acc=["internet!"],
         beats=[(0, "phone1", 0.5, "viral")]),
    dict(tts="Sačuvaj ovo, pošalji nekom ko se muči s kilama, i prati Peptid Centar!", sub="Sačuvaj ovo, pošalji nekom ko se muči s kilama, i prati Peptid Centar!", acc=["Sačuvaj", "pošalji", "prati"],
         beats=[(0, "exer1", 0.5, "save"), (0.6, "run1", 0.5, "follow")]),
]
