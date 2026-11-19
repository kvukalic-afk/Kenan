# Evidencija psihologa

Aplikacija za školskog psihologa (JU Osnovna škola Stijena). U nju se unose bilješke nakon razgovora s učenicima, zapisnici s radionica i kontakti sa saradnicima. Iz nje se dobijaju dokumenti za print i statistika za izvještaje.

- Radi na mobitelu i računaru i instalira se kao app s ikonicom (PWA).
- **Radi offline.** Podaci ostaju samo na uređaju (IndexedDB). Nema servera, računa ni praćenja.
- Koristi **šifre učenika** (npr. `U014`), ne imena.

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

### Varijanta A: Netlify (preporuka, repozitorij može ostati privatan)

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
3. Spoji radnu granu u granu `main` (pull request → *Merge*). Workflow `.github/workflows/deploy.yml` sam pokreće testove, pravi build i objavljuje.
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

## 5. Učenici: šifre umjesto imena

- Šifra smije imati samo slova, brojeve, `-` i `_` (do 20 znakova) i automatski se piše velikim slovima (`u014` → `U014`).
- Ako ukucaš razmak ili nešto što liči na ime, app upozorava: **„Upiši šifru, ne ime“**.
- Spisak *šifra ↔ ime* čuvaš odvojeno, u svom Excelu, a ne u appu.

**Uvoz popisa:** Učenici → **Uvoz popisa**. Zalijepi dvije kolone iz Excela (šifra, razred) ili izaberi CSV/XLSX fajl. Prije potvrde app pokazuje pregled (novi, promjena razreda, greške).

Nova šifra upisana pri unosu razgovora automatski kreira učenika. App tada traži samo razred.

---

## 6. Ostalo što je dobro znati

- **PIN** (Postavke): 4–6 cifara. Traži se pri otvaranju i nakon 5 minuta neaktivnosti. Čuva se samo kao hash. **Zaboravljen PIN se ne može vratiti.** Tada ostaje samo „Obriši sve podatke“ i vraćanje iz rezervne kopije. PIN zaključava ekran appa, a za punu zaštitu drži i telefon i računar zaključanim.
- **Diktiranje:** dugme mikrofona pored tekstualnih polja (Chrome na Androidu i računaru, jezik hr-HR). Diktiranje u pregledniku obično traži internet. Gdje ne radi, koristi mikrofon na tastaturi telefona.
- **Nacrt:** dok kucaš, unos se čuva svake 2 sekunde. Ako se app zatvori usred unosa, pri sljedećem otvaranju pita „Nastavi nedovršeni unos?“.
- **Print:** svaki dokument se otvara kao A4 pregled s dugmetom **Štampaj / Sačuvaj kao PDF**. Zaglavlje i podnožje (POVJERLJIVO, datum, potpis) ponavljaju se na svakoj stranici. Broj stranice („Stranica 2 / 3“) ispisuju Chrome i Edge, a Safari na iPhoneu dodaje svoj. Ako u printu vidiš adresu stranice, u prozoru za štampu isključi *Zaglavlja i podnožja*.
- **Excel:** Statistika → **Izvezi sve u Excel** pravi `Evidencija_psiholog_GGGG-MM-DD.xlsx` s listovima Učenici, Razgovori, Radionice, Saradnja i Statistika.
- **Školska godina** traje od 1. septembra do 31. augusta. I polugodište je septembar–decembar, a II januar–juni.
- Ne koristi privatni/anonimni prozor preglednika, jer se tamo podaci brišu pri zatvaranju.

---

## 7. Tehnički pregled

React 18 + TypeScript + Vite, Dexie.js (IndexedDB), `vite-plugin-pwa` (service worker i manifest), SheetJS `xlsx` 0.20.3 uključen lokalno (`vendor/`). Nema eksternih fontova, CDN-ova ni analitike.

```
src/
  App.tsx              rute, zaključavanje, pitanje za nacrt
  db/                  Dexie šema, snimanje/brisanje, šifrarnik, uvoz/izvoz kopije
  lib/                 datumi, šifre, statistika, Zakazano, kripto, kopija, Excel, uvoz popisa, diktiranje
  components/          polja forme (chipovi, datum, šifra, tagovi, diktiranje), navigacija, grafikoni
  screens/             Početna, Učenici, Karton, Radionice, Statistika, Postavke, forme, detalji, zaključavanje
  print/               dokumenti za print + print.css
tests/                 Vitest testovi
public/                ikonice (SVG + PNG 180/192/512, maskable)
```

Testovi pokrivaju statistiku po mjesecima i polugodištima, „Zakazano“, šifrovanje kopije i PIN-a, spajanje kopije bez duplikata, validaciju šifre, uvoz popisa i Excel izvoz.
