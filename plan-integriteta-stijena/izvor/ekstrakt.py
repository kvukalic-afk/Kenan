"""Izvlači katalog radnih mjesta i tabele iz izvornog Plana (ver 2) u JSON.
Primjenjuje isključivo tehničke (pravopisne) ispravke, bez promjene sadržaja."""
import sys, json, docx
d = docx.Document(sys.argv[1])
FIX = [("ustranovi","ustanovi"),("skaldu","skladu"),("principimia","principima"),("teoriskih","teorijskih"),
 ("organozacija","organizacija"),("pstalog","ostalog"),("instalacijs","instalacija"),("ložac","ložač"),
 ("kvaliteteno","kvalitetno"),("štetuu","štetu u"),("dostavljanaj","dostavljanja"),("kancelartijama","kancelarijama"),
 ("inabavke","i nabavke"),("polovi na","poslovi na"),("srednjimm","srednjim"),("finansijke","finansijske"),
 ("(češće u","(učešće u"),("istitucijama","institucijama"),("primjenjenih","primijenjenih"),("vještina iz","vještine iz"),
 ("ostvarenju i unapređenju","ostvarivanju i unapređenju"),("blagovremeni izvršavanje","blagovremeno izvršavanje"),
 ("ovlašćenja","ovlaštenja"),("korespodencija","korespondencija"),("Pedagoškim zavodom, srednjimm","Pedagoškim zavodom, srednjim"),
 ("pedagoškopsihološka","pedagoško-psihološka"),("ranik","radnik"),("tehnočko odoblje","tehničko osoblje"),("odgojnoobrazovnih","odgojno-obrazovnih"),
 ("osnovnoj školi.Vlastitim","osnovnoj školi. Vlastitim"),("u okviru radnog vremena,a za","u okviru radnog vremena, a za"),
 ("član nastavnog osoblja","član nastavnog osoblja"),("stručni saradnik,član","stručni saradnik, član"),("psihologije,a primarno","psihologije, a primarno"),
 ("školske ,razvojne","školske, razvojne"),("praćenje,analiziranje","praćenje, analiziranje"),("porodicom,društvenom","porodicom, društvenom"),
 ("sredinom,istitucijama","sredinom, institucijama"),("sredinom,institucijama","sredinom, institucijama"),("soc.rad","socijalni rad"),("soc.radnika","socijalnog radnika"),
 ("kategorizaciju/ stručnim","kategorizaciju / stručnim"),("tijelom,vođenje","tijelom, vođenje"),("nalogu direktoru škole","nalogu direktora škole")]
def fx(s):
    for a,b in FIX: s = s.replace(a,b)
    return " ".join(s.split()) if "\n" not in s else "\n".join(" ".join(x.split()) for x in s.split("\n"))
def rows(t):
    out=[]
    for r in t.rows:
        cells=[]; prev=None
        for c in r.cells:
            if c._tc is prev: continue
            prev=c._tc; cells.append(fx(c.text.strip()))
        out.append(cells)
    return out
T = d.tables
data = {"katalog": rows(T[1])[1:], "ranjiva": rows(T[3])[2:], "kriticna": rows(T[4])[1:], "program": rows(T[0])}
json.dump(data, open(sys.argv[2],"w"), ensure_ascii=False, indent=1)
print({k:len(v) for k,v in data.items()})
