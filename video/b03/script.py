# Peptid Centar B03 · NAD+ · scenarij
# Izvori: Massudi i sar. PLoS One 2012 (PMID 22848760) · Martens i sar. Nat Commun 2018 (PMID 29599478) · Redox Biology 2026 (PMID 42628241)
SCRIPT = [
    dict(tts="Svi pričaju o NAD plus injekcijama. Evo šta je NAD plus zapravo.", sub="Svi pričaju o NAD+ injekcijama. Evo šta je NAD+ zapravo.", acc=["NAD+"], beats=[("hook", 0)]),
    dict(tts="I ne, nije peptid. To je koenzim koji ima svaka ćelija tvog tijela.", sub="I ne, nije peptid. To je koenzim koji ima svaka ćelija tvog tijela.", acc=["koenzim", "svaka"], beats=[("notpeptide", 0)]),
    dict(tts="Bez njega mitohondrije ne prave energiju, a ćelija ne može popravljati svoj DNK.", sub="Bez njega mitohondrije ne prave energiju, a ćelija ne može popravljati svoj DNK.", acc=["energiju,", "DNK."], beats=[("cell", 0), ("dna", 0.55)]),
    dict(tts="U studiji na ljudskoj koži, što su ljudi bili stariji, NAD plus u tkivu je bilo manje.", sub="U studiji na ljudskoj koži: što su ljudi bili stariji, NAD+ u tkivu je bilo manje.", acc=["stariji,", "manje."], beats=[("skin", 0)]),
    dict(tts="Dobra vijest? Tijelo ga pravi iz vitamina be tri.", sub="Dobra vijest? Tijelo ga pravi iz vitamina B3.", acc=["vijest?", "B3."], beats=[("b3", 0)]),
    dict(tts="U studiji iz 2026, visoke doze vitamina be tri podigle su NAD plus u krvi četiri do šest puta.", sub="U studiji iz 2026, visoke doze vitamina B3 podigle su NAD+ u krvi 4 do 6 puta.", acc=["4", "6", "puta."], beats=[("x46", 0)]),
    dict(tts="A kod starijih ljudi, oblik be tri zvani nikotinamid ribozid podigao je NAD plus u kontrolisanoj studiji, i bio je dobro podnošen.", sub="A kod starijih ljudi, oblik B3 zvani nikotinamid ribozid podigao je NAD+ u kontrolisanoj studiji, i bio je dobro podnošen.", acc=["podigao", "podnošen."], beats=[("nr", 0)]),
    dict(tts="Energija i popravka ćelija. Zato je NAD plus zvijezda priče o dugovječnosti.", sub="Energija i popravka ćelija. Zato je NAD+ zvijezda priče o dugovječnosti.", acc=["zvijezda", "dugovječnosti."], beats=[("summary", 0)]),
    dict(tts="Sačuvaj ovo, i prati Peptid Centar.", sub="Sačuvaj ovo, i prati Peptid Centar.", acc=["Sačuvaj"], beats=[("cta", 0)]),
]
