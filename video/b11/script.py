# Peptid Centar B11 · „Porodična grupa tvog tijela“ · šaljivo-edukativni (edukativna linija: bez HELVERA proizvoda u kadru, samo potpis)
# Psihologija pažnje (video/COACH_ZNANJE.md): pattern interrupt (chat UI), open loop („član kojeg niko ne sluša“), identitet/prepoznavanje (balkanska nana),
#   humor + kontrast, payoff („poruka je obrisana“), novi mehanizam, CTA za dijeljenje u porodičnu grupu (social currency).
# Činjenice (udžbenička endokrinologija): grelin 28 aminokiselina, iz želuca, raste prije obroka (hormon gladi);
#   inzulin 51 ak, nakon obroka spušta šećer u krvi i sprema ga; oksitocin 9 ak, oslobađa se pri dodiru/zagrljaju;
#   GLP-1 30 ak, iz L-ćelija crijeva nakon jela, signal sitosti; razgrađuje ga enzim DPP-4, poluživot oko 2 minute;
#   semaglutid: analog GLP-1, poluživot oko 7 dana (Lau i sar., J Med Chem 2015).
EL_PROMPT = "[playful] Tvoje tijelo ima porodičnu grupu na telefonu. I u njoj, jednog člana kojeg niko ne sluša. [pause] [curious] Grelin se javi prije svakog obroka: Ima li šta za jesti? [pause] [excited] Inzulin, čim pojedeš: Šećer stigao, sve u ostavu! [pause] [warmly] Oksitocin šalje srca kad nekog zagrliš. [pause] [calm] A onda se iz crijeva javi ge-el-pe jedan: Dosta je. Sit si. [pause] [laughs] I tačno tad, nana: Jedi, jedi, kosti su ti! [pause] [playful] A znaš šta je najgore? Tijelo ge-el-pe jedan obriše za samo dvije minute. Poruka je obrisana. [pause] [excited] Zato su naučnici napravili peptid čija poruka traje cijelu sedmicu: semaglutid. [pause] [warmly] Grelin, inzulin, oksitocin, ge-el-pe jedan: svi su peptidi. Kratki lanci aminokiselina koji šalju poruke. [pause] [playful] Pošalji ovo u svoju porodičnu grupu. Da vidimo ko će prvi odgovoriti: jedi, jedi."
SCRIPT = [
    dict(tts="Tvoje tijelo ima porodičnu grupu na telefonu. I u njoj, jednog člana kojeg niko ne sluša.", sub="Tvoje tijelo ima porodičnu grupu na telefonu. I u njoj, jednog člana kojeg NIKO ne sluša.", acc=["grupu", "NIKO"], scene="hook"),
    dict(tts="Grelin se javi prije svakog obroka: Ima li šta za jesti?", sub="Grelin se javi prije svakog obroka: „Ima li šta za jesti?“", acc=["Grelin"], scene="grelin"),
    dict(tts="Inzulin, čim pojedeš: Šećer stigao, sve u ostavu!", sub="Inzulin, čim pojedeš: „Šećer stigao, sve u ostavu!“", acc=["Inzulin,"], scene="inzulin"),
    dict(tts="Oksitocin šalje srca kad nekog zagrliš.", sub="Oksitocin šalje srca kad nekog zagrliš.", acc=["Oksitocin"], scene="oksi"),
    dict(tts="A onda se iz crijeva javi GLP jedan: Dosta je. Sit si.", sub="A onda se iz crijeva javi GLP-1: „Dosta je. Sit si.“", acc=["GLP-1:"], scene="glp"),
    dict(tts="I tačno tad, nana: Jedi, jedi, kosti su ti!", sub="I tačno tad, nana: „Jedi, jedi, kosti su ti!“", acc=["nana:"], scene="nana"),
    dict(tts="A znaš šta je najgore? Tijelo GLP jedan obriše za samo dvije minute. Poruka je obrisana.", sub="A znaš šta je najgore? Tijelo GLP-1 obriše za samo 2 minute. Poruka je obrisana.", acc=["2", "minute."], scene="deleted"),
    dict(tts="Zato su naučnici napravili peptid čija poruka traje cijelu sedmicu: semaglutid.", sub="Zato su naučnici napravili peptid čija poruka traje cijelu sedmicu: semaglutid.", acc=["sedmicu:"], scene="sema"),
    dict(tts="Grelin, inzulin, oksitocin, GLP jedan: svi su peptidi. Kratki lanci aminokiselina koji šalju poruke.", sub="Grelin, inzulin, oksitocin, GLP-1: svi su peptidi. Kratki lanci aminokiselina koji šalju poruke.", acc=["peptidi."], scene="all"),
    dict(tts="Pošalji ovo u svoju porodičnu grupu. Da vidimo ko će prvi odgovoriti: jedi, jedi.", sub="Pošalji ovo u svoju porodičnu grupu. Da vidimo ko će prvi odgovoriti: „jedi, jedi“.", acc=["Pošalji"], scene="cta"),
]
