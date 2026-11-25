# Evidencija psihologa

Aplikacija za školskog psihologa (JU Osnovna škola Stijena). U nju se unose bilješke nakon razgovora s učenicima, zapisnici s radionica i kontakti sa saradnicima. Iz nje se dobijaju dokumenti za print i statistika za izvještaje.

- Radi na mobitelu i računaru i instalira se kao app s ikonicom (PWA).
- **Radi offline.** Podaci (i imena učenika) ostaju samo na uređaju (IndexedDB). Nema servera, računa ni praćenja.
- AI (ChatGPT ili Claude) je **opcionalan**: sroči bilješku, analizira prikupljene informacije, piše nacrt mišljenja i odgovara na pitanja o dokumentaciji. Prije slanja imena učenika i razrednika zamjenjuju se šiframa i ulogama.
- Učenici imaju ime i prezime, šifru (npr. `U014`) i razred. Razrednik se upisuje jednom po razredu.

---

## 1. Pokretanje na svom računaru (za razvoj)

Potreban je [Node.js](https://nodejs.org) verzija 20 ili novija.

```bash
npm install
```

```bash
npm run dev
```

Otvori adresu koju ispiše terminal (obično http://localhost:5173).

Ostale komande:

| Komanda | Šta radi |
|---|---|
| `npm test` | pokreće automatske testove (Vitest) |
| `npm run build` | pravi verziju za objavu u folderu `dist/` |
| `npm run preview` | lokalno pokreće verziju iz `dist/` (tu radi i offline/instalacija) |
| `npm run icons` | ponovo pravi PNG ikonice iz `public/icon.svg` (treba Playwright) |

---

## 2. Objava na internetu (besplatno)

App je samo skup statičnih fajlova. Server ne vidi tvoje podatke jer oni nikad ne napuštaju uređaj. Adresa služi samo da se app učita i instalira.

### Varijanta A: Netlify

Na besplatnom planu Netlify troši mjesečne kredite na svaku objavu. Kad ih nestane, sajt se pauzira. Za app koji se često ažurira bolji je GitHub Pages (varijanta B), koji ovaj app trenutno koristi: **https://kvukalic-afk.github.io/Kenan/**.

**Najbrže, bez GitHuba:**
1. Na računaru pokreni `npm install`, pa `npm run build`.
2. Otvori https://app.netlify.com/drop i prevuci folder **`dist`** na stranicu.
3. Netlify daje adresu, npr. `https://nesto-123.netlify.app`. U *Site settings → Change site name* možeš je promijeniti, npr. `evidencija-stijena.netlify.app`.
4. Za novu verziju appa ponovi korake 1 i 2 (u istom sajtu: *Deploys → povuci novi `dist`*).

**Automatski iz GitHuba:**
1. Na https://app.netlify.com izaberi *Add new site → Import an existing project → GitHub* i izaberi ovaj repozitorij.
2. Postavke se čitaju iz `netlify.toml` (build: `npm run build`, folder: `dist`). Klikni *Deploy*.
3. Svaki novi push na glavnu granu automatski objavljuje novu verziju.

### Varijanta B: GitHub Pages

Na besplatnom GitHub planu repozitorij mora biti **javan**. Kod je tada javan, ali tvoji podaci nisu, jer nikad nisu u repozitoriju.

1. Na GitHubu otvori repozitorij → **Settings → Pages**.
2. Pod *Build and deployment → Source* izaberi **GitHub Actions**.
3. Svaki push na granu `main` automatski pokreće workflow `.github/workflows/deploy.yml`: testovi, build i objava. Ručno se pokreće u tabu **Actions** → „Objavi na GitHub Pages“ → **Run workflow**.
4. Nakon 1–2 minute app je na adresi `https://<korisnik>.github.io/<ime-repozitorija>/`. Tačan link je u *Settings → Pages* i u tabu *Actions*.

> Adresa mora biti **https** da bi instalacija i offline rad radili. Netlify i GitHub Pages to daju automatski.

---

## 3. Instalacija appa (ikonica na početnom ekranu)

Prvo otvori adresu appa (iz koraka 2) jednom dok imaš internet.

### Android (Chrome)
1. Otvori adresu u **Chromeu**.
2. Dodirni meni **⋮** (gore desno) → **Instaliraj aplikaciju** ili **Dodaj na početni ekran**.
3. Potvrdi. Ikonica „Evidencija“ pojavljuje se na početnom ekranu, a app se otvara preko cijelog ekrana i radi bez interneta.

### iPhone / iPad (Safari)
1. Otvori adresu u **Safariju**. Na iPhoneu instalacija radi samo iz Safarija.
2. Dodirni dugme **Dijeli** (kvadrat sa strelicom prema gore).
3. Izaberi **Dodaj na početni ekran** → **Dodaj**.
4. App pokreći **preko ikonice**, ne iz Safarija. Podaci u instaliranom appu i u Safariju su odvojeni.

### Windows (Edge ili Chrome)
1. Otvori adresu u **Edgeu** ili **Chromeu**.
2. U adresnoj traci klikni ikonicu **Instaliraj** (monitor sa strelicom). Ili: meni **⋯** → **Aplikacije → Instaliraj ovu web-lokaciju kao aplikaciju** (Edge), odnosno **⋮ → Prenesi, sačuvaj i dijeli → Instaliraj stranicu kao aplikaciju** (Chrome).
3. App dobija ikonicu u Start meniju i na radnoj površini. Desnim klikom na ikonicu u traci zadataka možeš je i *Prikvačiti*.

### Ažuriranje appa
Kad objaviš novu verziju, app se sam ažurira pri sljedećem otvaranju s internetom. Ponekad treba zatvoriti i ponovo otvoriti app.

---

## 4. Rezervna kopija i prenos između uređaja

Podaci postoje **samo na uređaju** na kojem su uneseni. Ako se telefon izgubi ili se obrišu podaci preglednika, nestaju i podaci. Zato redovno pravi rezervnu kopiju. Na početnom ekranu se pojavi podsjetnik ako je zadnja kopija starija od 7 dana.

### Napravi kopiju
1. **Postavke** (zupčanik gore desno) → **Izvezi rezervnu kopiju**.
2. Izaberi lozinku (najmanje 6 znakova) i upiši je dva puta. **Zapiši lozinku.** Bez nje se kopija ne može otvoriti, ni od tebe ni od bilo koga drugog.
3. Preuzima se fajl `Evidencija_kopija_GGGG-MM-DD.json`. Spremi ga na USB, u svoj oblak (Google Drive, OneDrive…) ili pošalji sebi na e-mail. Sadržaj je šifrovan (AES-256-GCM, ključ iz lozinke preko PBKDF2).
4. Kopija ne sadrži PIN.

### Vrati kopiju / prenesi na drugi uređaj
1. Na drugom uređaju (ili nakon brisanja) otvori **Postavke → Uvezi rezervnu kopiju**.
2. Izaberi `.json` fajl i upiši lozinku → **Dalje**.
3. App prije uvoza pokazuje koliko će se zapisa **dodati, ažurirati i obrisati**. Potvrdi sa **Uvezi**.

Uvoz **spaja** podatke bez duplikata:
- zapis koji već postoji ažurira se samo ako je u kopiji noviji;
- isti učenik (ista šifra) unesen na dva uređaja ostaje jedan učenik;
- zapis obrisan na jednom uređaju briše se i na drugom pri uvozu (ako u međuvremenu nije mijenjan).

**Primjer rada na dva uređaja:** na telefonu tokom dana unosiš razgovore. Navečer napraviš kopiju i pošalješ je sebi. Na računaru je uvezeš i tamo štampaš izvještaje.

---

## 5. Učenici, imena i razrednici

- Svaki učenik ima **ime i prezime**, **šifru** (npr. `U014`) i **razred**. Šifra je stalna oznaka po kojoj se zapisi vežu za učenika, pa se ime može ispraviti bez gubitka zapisa.
- **Razrednik** se upisuje jednom po razredu (Učenici → **Razrednici**) i automatski se vidi kod svih učenika tog razreda, u kartonu i u dokumentima.
- Pri unosu razgovora, saradnje ili radionice u polje „Učenik“ možeš kucati **ime, prezime ili šifru**. App nudi učenike s liste i ispod polja pokazuje ime, razred i razrednika.
- Šifra smije imati samo slova, brojeve, `-` i `_` (do 20 znakova) i automatski se piše velikim slovima.
- **Imena u dokumentima:** Postavke → „Imena učenika u dokumentima za print i u Excelu“. Kad je isključeno, u printu i Excelu stoji samo šifra (npr. kad dokument ide izvan škole).

**Uvoz popisa:** Učenici → **Uvoz popisa**. Zalijepi kolone iz Excela ili izaberi CSV/XLSX. Prepoznaju se kolone **Šifra, Razred, Ime, Prezime** (ili jedna kolona **Ime i prezime**) i **Razrednik**, bilo kojim redom, ako imaju zaglavlje. Prije potvrde app pokazuje pregled: novi učenici, promjene razreda ili imena i greške.

Nova šifra upisana pri unosu razgovora automatski kreira učenika. App tada traži razred, a po želji i ime i prezime.

## 6. Ostale aktivnosti i izvještaji za dan / sedmicu

**Ostale aktivnosti** (dugme **+ → Ostala aktivnost** ili **+ Aktivnost** na početnoj) služe za zamjene nastavnika, časove odjeljenske zajednice umjesto razrednika, dežurstvo, sjednice i stručno usavršavanje. Upisuješ datum, razred, čas, koga mijenjaš (app nudi razrednika tog razreda), predmet i temu. Lista je na tabu **Radionice → Ostale aktivnosti**. U statistici i godišnjem izvještaju aktivnosti se broje posebno, ne kao radionice. Vrste aktivnosti mijenjaš u Postavke → Šifrarnik.

**Dnevni, sedmični i mjesečni izvještaj:** na Početnoj klikni **Dnevni izvještaj** ili **Sedmični izvještaj**, ili u Statistici **Dnevni / sedmični izvještaj**. Izaberi period (Danas, Jučer, Ova sedmica, Prošla sedmica, Ovaj mjesec ili od–do) i klikni **Preuzmi izvještaj za print**. Dokument sadrži sažetak, tabelu s brojevima i hronološki spisak svega urađenog.

**Tekst izvještaja uz pomoć AI-ja (npr. ChatGPT):**
1. Na ekranu izvještaja klikni **Kopiraj za AI**. Kopira se uputa i spisak aktivnosti, **samo sa šiframa učenika, bez imena učenika i nastavnika**. Bilješke se dodaju samo ako uključiš „U tekst za AI uključi i bilješke“. Tada se poznata imena učenika zamjenjuju šiframa, ali druge osobe (roditelji, nastavnici) se ne prepoznaju, pa tekst pregledaj prije slanja.
2. Klikni **Otvori ChatGPT**, zalijepi tekst i pošalji.
3. Odgovor zalijepi u polje **Tekst izvještaja**, pregledaj ga i ispravi. Taj tekst ide u print umjesto automatskog sažetka i pamti se za taj period.

Ništa se ne šalje automatski: tekst ide u ChatGPT samo kad ga ti zalijepiš.

### Unos iz teksta (uz ChatGPT ili Claude)

Umjesto kucanja po formama možeš AI-ju ispričati šta si radio/la, a on vrati sređen tekst koji app sam pretvori u unose.

1. **+ → Unos iz teksta (AI)** (ili dugme na Početnoj) → **Kopiraj uputu za AI**. Uputu zalijepi u ChatGPT ili Claude, jednom na početku razgovora. U njoj su format i tvoj šifrarnik.
2. Ispričaj šta je bilo, npr. *„3. čas zamjena u 7-1, matematika. Poslije razgovor s U056 zbog izostanaka, opet za 7 dana.“* **Učenike navodi šiframa, ne imenima**, jer tekst odlazi na AI servere.
3. Kopiraj odgovor, zalijepi ga u app i klikni **Pregledaj**. Za svaki unos vidiš šta će biti sačuvano, uz upozorenja (npr. „nema datuma – uzet je današnji“) i greške (npr. nepoznata šifra). Isključi unose koje ne želiš i klikni **Sačuvaj**.

Isti format možeš pisati i sam/a, bez AI-ja:

```
### RAZGOVOR
datum: 20.11.2026
ucenik: U056
razlog: Izostanci
biljeske: …
sljedeci kontakt: za 7 dana
status: U praćenju

### ZAMJENA
razred: 7-1
cas: 3
predmet: Matematika
```

Bloka može biti **BILJEŠKA** (ili **HODNIK** / **INFORMATIVNI**), **RAZGOVOR, RADIONICA, SARADNJA, AKTIVNOST, ZAMJENA** ili **ČAS ODJELJENSKE ZAJEDNICE**. Bilješka ima polja `vrsta`, `ucenik`, `osobe`, `tekst` (kako je rečeno) i `sroceno` (stručno). Datum može biti i „danas“ ili „jučer“, a sljedeći kontakt i „za 7 dana“.

### Plan rada, dnevnik rada i 40-satna sedmica

Područja rada i sedmična norma sati su po **Pedagoškim standardima i normativima za osnovno obrazovanje USK (Sl. glasnik USK 20/2024, čl. 13.)**: 11 područja, ukupno 40 sati.

- **Plan rada** (Statistika → **Plan rada**): godišnji program po 11 područja. Dugme **Popuni prijedlogom** ubacuje tipične sadržaje rada koje onda prilagodiš. Za svaku stavku biraš mjesece i saradnike. Klikom na mjesec dobiješ **mjesečni plan**, gdje kvačicom označavaš šta je realizovano i vidiš koliko je sati evidentirano po područjima.
- **Print:** *Godišnji program rada psihologa* (sa strukturom 40-satne sedmice), *Mjesečni plan rada psihologa* (s kolonom „Realizovano“) i *Dnevnik rada psihologa* za mjesec (datum, područje, opis, učenik, trajanje, uz evidenciju sati po područjima).
- **Sedmični izvještaj** sadrži i *Evidencioni list 40-satne radne sedmice* (norma i evidentirano po područjima).
- Svaki unos ima **trajanje u minutama** (razgovor 45, saradnja 30, aktivnost 45, ako se ne promijeni). Rad se u područja svrstava automatski: razgovor s učenikom ide u 5, s roditeljem u 8, s nastavnikom u 4, institucije u 7. Kod „Ostale aktivnosti“ područje možeš izabrati i sam/a. Pripremu za rad i vođenje dokumentacije evidentiraš kao ostalu aktivnost („Pripremanje za rad“, „Psihološka dokumentacija“).

Zvanični obrazac dnevnika rada za USK nije javno dostupan na internetu. Ako škola ili Pedagoški zavod imaju svoj obrazac, print se može prilagoditi po njemu.

### Bilješke s hodnika, informativni razgovori i AI analiza

- **Brza bilješka** (veliko dugme na Početnoj ili **+ → Brza bilješka**) služi za ono što se desi „u hodu“: hodnik, odmor, telefon, informativni razgovor o učeniku, nastavniku ili razredu. Zapiši ili izdiktiraj kako ti dođe.
- Uz bilješku po želji izabereš **vrstu** (Hodnik / u prolazu, Informativni razgovor, Opservacija, Telefon / poruka, Sastanak, Ostalo), **učenika** i **o kome / sa kim** je riječ. Za osobe koristi uloge („razrednik 7-1“, „nastavnik matematike“, „majka“), ne imena. Kad izabereš učenika, app prvo predloži njegovog razrednika.
- Lista bilješki ima **pretragu** (tekst, uloga, ime učenika) i filtere po periodu, vrsti i „samo neobrađene“. Bilješke su grupisane po danima.
- Uz svaku bilješku: **✨ Sroči stručno**, **→ Razgovor** (prenese tekst u formu razgovora), **📄 Službena bilješka** (popuni obrazac), **✓ Obrađeno**, uredi i obriši.
- **✨ Sroči stručno:** AI pretvara sirov tekst u uredan stručni tekst, kakav piše iskusan školski psiholog. Ništa ne izmišlja i ne dodaje dijagnoze. Prijedlog uvijek pregledaš i urediš prije nego ga prihvatiš. Isto dugme postoji uz tekstualna polja u formama.
- **🧠 AI analiza:** dugme „AI analiza (N)“ šalje sve bilješke koje trenutno vidiš (npr. filter „Školska godina“ + jedan učenik, ili sve „Informativni razgovor“) na analizu. AI vraća pregled, ključna zapažanja i obrasce koji se ponavljaju, moguće zaključke, preporuke i otvorena pitanja. **Prije slanja vidiš tačan tekst koji ide AI-ju** (već bez imena) i možeš ga urediti ili dodati svoje pitanje. Analiza se čuva u tabu **Analize**, može se urediti i odštampati.
- U **kartonu učenika** su tri AI alata. Sve što upišeš prolazi kroz uklanjanje imena, a rezultat se sprema u karton i štampa se s njim.
  - **🗣 Priprema za razgovor:** upišeš s kim je razgovor i šta znaš, a AI napravi tok razgovora, ključna pitanja, na šta paziti i šta zapisati poslije.
  - **🧩 Procjena teškoća:** upišeš opis teškoća i sastanka, a AI napravi opis po područjima, radne hipoteze (ZA i PROTIV), šta još prikupiti, kome uputiti i šta škola može odmah. **Dijagnozu ne postavlja.** Nju postavljaju nadležni stručnjaci, a procjenu za školu Stručno tijelo (čl. 23 Zakona USK).
- U kartonu je i dugme **„🧠 AI pregled svih zapisa“** radi isto nad svim razgovorima, bilješkama i saradnjom za tog učenika. Tu su i prečice za obrasce (Mišljenje, Saglasnost, Poziv roditelju, Plan podrške).

### Dokumentacija za inspekciju (Izvještaji → Dokumentacija)

Na Početnoj je kartica **„Dokumentacija za inspekciju“** s procentom spremnosti i sljedeća dva roka. Klik otvara dio s četiri taba:

1. **Spremnost:** upiši **datum početka rada** u školi i da li si **pripravnik**. Novozaposlenom app pomjera rokove (ono što je dospjelo prije dolaska dobije rok od dolaska) i dodaje grupu „Početak rada u školi“: rješenje o pripravničkom stažu i mentor (Zakon USK čl. 120), upoznavanje s Godišnjim programom škole, preuzimanje zatečene dokumentacije, plan pripravničkog staža. Stavke su grupisane (početak rada, planiranje, evidencija, rad s učenicima, izvještaji, lični dosije), uz svaku piše **pravni osnov** ili „dobra praksa“, a dugme **Štampaj pregled obavezne dokumentacije** daje tabelu za prvu stranu registratora. Ostatak je kontrolna lista onoga što psiholog treba imati: godišnji program rada, mjesečni planovi, dnevnik rada, evidencija razgovora, saglasnosti roditelja, evidencija nasilja, zapisnici stručnog tima, stručno usavršavanje, polugodišnji i godišnji izvještaj, čuvanje povjerljive dokumentacije, lični dosije, rezervna kopija. Svaka stavka ima rok. Što app može provjeriti sam (npr. da li postoji plan rada ili unos za mjesec), označi sam, a ostalo štikliraš ti. Mjesečne stavke se obnavljaju svaki mjesec, a polugodišnji i godišnji izvještaj se pojave tek pred rok.
2. **Obrasci:** službena bilješka, saglasnost roditelja, poziv roditelju, mišljenje psihologa (uz **AI nacrt** iz evidencije učenika), dopis/uputnica ustanovi, zapisnik stručnog tima, evidencija postupanja kod nasilja, plan individualne podrške i zapisnik o ispitivanju spremnosti djeteta za polazak u školu. Popuniš u appu, sačuvaš (arhiva ostaje u appu) i štampaš na A4 s oznakom POVJERLJIVO, poljima za potpis i M.P.
3. **Moji dokumenti:** ovdje ubaci zvanične PDF-ove (pravilnike, obrasce Ministarstva, Pedagoškog zavoda, Sindikata, kolektivni ugovor, rješenja) do 25 MB po fajlu. Čuvaju se u appu i ulaze u rezervnu kopiju. Ako označiš **„AI smije čitati“**, AI asistent ih čita kad odgovara.
4. **Propisi:** 11 područja rada i 40-satna sedmica iz Pedagoških standarda USK (čl. 13), s linkovima na izvor.

> **Važno:** na internetu je javno dostupan samo dokument *Pedagoški standardi i normativi za osnovni odgoj i obrazovanje USK* (pzusk.ba). Zvanične obrasce Ministarstva obrazovanja USK, Vlade USK i Sindikata nisam našao javno objavljene. Zato su obrasci u appu napravljeni po uobičajenoj praksi školskih psihologa. Ako škola ili Pedagoški zavod imaju svoje obrasce, ubaci ih u **Moji dokumenti**, pa se obrasci u appu mogu uskladiti s njima.

### Za uvid pedagogu (Izvještaji → Za uvid pedagogu)

Na jednom mjestu je sve što pedagog ili direktor obično traže na uvid, za izabrani mjesec, sa stanjem i dugmetom za print:
- godišnji program rada;
- mjesečni plan;
- dnevnik rada s evidencijom 40-satne sedmice;
- zbirna evidencija rada s učenicima;
- stručno usavršavanje;
- zapisnici;
- pregled obavezne dokumentacije.

Dokumenti za uvid imaju **šifre umjesto imena i nemaju sadržaj razgovora**. Pedagog vidi da je rad obavljen (kada, s kim, zbog čega i koliko), a bilješke, nalazi i testovi ostaju povjerljivi.

### AI asistent

**+ → AI asistent**, traka na Početnoj ili Izvještaji → AI asistent. To je razgovor s AI-jem koji:

- zna Pedagoške standarde USK (11 područja, 40-satna sedmica), tvoju kontrolnu listu i šta app sve može;
- **pri svakom pitanju dobije svjež pregled stanja:** spremnost, šta kasni, šta je sljedeće, koliko je unosa ovog mjeseca. Tako te sam podsjeća na rokove i obaveze;
- čita tvoje dokumente označene „AI smije čitati“ (PDF i tekst);
- ima brza pitanja: *Šta mi fali za inspekciju?*, *Plan za ovu sedmicu*, *Koje obrasce trebam imati?*, *Kako postupiti kod nasilja?*…

Asistent ne vidi tvoje bilješke o učenicima, samo zbirne brojeve i stanje dokumentacije.

### Podešavanje AI-ja: ChatGPT ili Claude

Postavke → **Umjetna inteligencija**:

- **Pružalac:** ChatGPT (OpenAI) ili Claude (Anthropic).
- **ChatGPT model:** **Sol** (najbolji kvalitet), **Terra** (brži, jeftiniji) ili **Luna** (najjeftiniji). Ako tvoj nalog nema pristup izabranom modelu, app sam pokuša sljedeći dostupni.
- **Ključ:** za ChatGPT napravi API ključ na **platform.openai.com → API keys**, za Claude na **console.anthropic.com → API Keys**. Dugme **Isprobaj** provjerava da li ključ radi.
  - **Pretplata ChatGPT Plus ne uključuje API.** API se plaća posebno, po potrošnji (doplati kredit na platform.openai.com → Billing). Sročavanje jedne bilješke obično košta manje od feninga, a veća analiza nekoliko feninga (zavisi od modela).
  - Ključevi se čuvaju **samo na tom uređaju**. Ne ulaze u rezervnu kopiju, pa na drugom uređaju ključ upišeš ponovo.
- **Diktiranje:** 🎙 **ChatGPT** (snimi glas, pa OpenAI pretvori govor u tekst, odlično za bosanski) ili **preglednik** (besplatno, Chrome). Za ChatGPT diktiranje treba OpenAI ključ. Dok snimaš, vidiš talas glasa i vrijeme. Ponovni klik na mikrofon završava snimanje i ubacuje tekst.
- **Bez ključa** sve AI funkcije imaju ručni način: „Kopiraj za AI“, zalijepiš u ChatGPT ili Claude, pa odgovor zalijepiš nazad.

**Privatnost kod AI-ja:**

- Prije svakog slanja imena i prezimena učenika (i u padežima) zamjenjuju se šiframa, a imena razrednika ulogom („razrednik 7-1“). Popis se uvijek čita svjež iz baze.
- Imena **drugih** osoba (roditelja, nastavnika koji nisu razrednici) app ne prepoznaje. Zato ih piši ulogom.
- Snimak glasa ide OpenAI-ju na pretvaranje u tekst. Ako u diktatu izgovoriš ime, ono stiže u tekst, a pri slanju AI-ju (sroči, analiza) zamijeni se šifrom kao i inače.
- AI tekst je uvijek **nacrt**. Pročitaj ga i ispravi prije čuvanja ili potpisivanja.

## 7. Ostalo što je dobro znati

- **PIN** (Postavke): 4–6 cifara. Traži se pri otvaranju appa, **kad se vratiš u app** (zadano odmah, a može i nakon 1 ili 5 minuta van appa) i nakon 5 minuta neaktivnosti. App se otključa čim upišeš zadnju cifru. Izbor fajla i štampa ne zaključavaju app. PIN se čuva samo kao hash i **važi samo na tom uređaju**: ne ide u rezervnu kopiju, pa ga na novom uređaju (ili novoj adresi appa) uključiš ponovo. Na Početnoj stoji podsjetnik dok PIN nije uključen. **Zaboravljen PIN:** na ekranu za PIN klikni „Zaboravljen PIN?“ → „Postavi novi PIN“. Nakon 10 minuta čekanja upišeš novi PIN i uđeš, a svi podaci ostaju. PIN zaključava ekran appa, a za punu zaštitu drži i telefon i računar zaključanim.
- **Diktiranje:** dugme mikrofona pored tekstualnih polja. Sa OpenAI ključem i izborom „ChatGPT“ snima se glas i pretvara u tekst preko OpenAI-ja (bosanski). Inače se koristi diktiranje preglednika (Chrome, jezik hr-HR). Oba traže internet. Gdje ne radi, koristi mikrofon na tastaturi telefona.
- **Nacrt:** dok kucaš, unos se čuva svake 2 sekunde. Ako se app zatvori usred unosa, pri sljedećem otvaranju pita „Nastavi nedovršeni unos?“.
- **Print:** svaki dokument se otvara kao A4 pregled s dugmetom **Štampaj / Sačuvaj kao PDF**. Zaglavlje i podnožje (POVJERLJIVO, datum, potpis) ponavljaju se na svakoj stranici. Broj stranice („Stranica 2 / 3“) ispisuju Chrome i Edge, a Safari na iPhoneu dodaje svoj. Ako u printu vidiš adresu stranice, u prozoru za štampu isključi *Zaglavlja i podnožja*.
- **Excel:** Statistika → **Izvezi sve u Excel** pravi `Evidencija_psiholog_GGGG-MM-DD.xlsx` s listovima Učenici, Razgovori, Radionice, Saradnja i Statistika.
- **Školska godina** traje od 1. septembra do 31. augusta. I polugodište je septembar–decembar, a II januar–juni.
- Ne koristi privatni/anonimni prozor preglednika, jer se tamo podaci brišu pri zatvaranju.

---

## 8. Tehnički pregled

React 18 + TypeScript + Vite, Dexie.js (IndexedDB), `vite-plugin-pwa` (service worker i manifest), SheetJS `xlsx` 0.20.3 uključen lokalno (`vendor/`), `@anthropic-ai/sdk` i `openai` (pozivaju se direktno iz preglednika, samo kad korisnik upiše svoj ključ). Nema eksternih fontova, CDN-ova ni analitike. Animacije se isključuju ako je u sistemu uključeno „smanji pokrete“.

```
src/
  App.tsx              rute, zaključavanje, pitanje za nacrt
  db/                  Dexie šema, snimanje/brisanje, šifrarnik, uvoz/izvoz kopije
  lib/                 datumi, šifre, statistika, Zakazano, kripto, kopija, Excel, uvoz popisa, diktiranje,
                       ai.ts / openai.ts (Claude, ChatGPT, anonimizacija), snimac.ts (snimanje glasa),
                       dokumentacija.ts (kontrolna lista, rokovi), obrasci.ts, analiza.ts, podrucja.ts
  components/          polja forme (chipovi, datum, šifra, tagovi, diktiranje), navigacija, grafikoni
  screens/             Početna, Učenici, Karton, Radionice, Izvještaji, Postavke, forme, detalji, zaključavanje,
                       Bilješke + Analize, Dokumentacija, Obrazac, AI asistent, Plan rada
  print/               dokumenti za print + print.css
tests/                 Vitest testovi
public/                ikonice (SVG + PNG 180/192/512, maskable)
```

Testovi pokrivaju statistiku po mjesecima i polugodištima, „Zakazano“, šifrovanje kopije i PIN-a, spajanje kopije bez duplikata, validaciju šifre, uvoz popisa, Excel izvoz, izvještaje po periodu, anonimizaciju prije slanja AI-ju (učenici u padežima, razrednici) i kontrolnu listu za inspekciju.
