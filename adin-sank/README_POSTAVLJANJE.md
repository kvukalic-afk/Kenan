# Adin Šank — postavljanje korak po korak

Aplikacija ima tri fajla koja te zanimaju:

- **`Code.gs`** — "mozak" (radi na Googleovom serveru)
- **`Tuya.gs`** — vrata, svjetla i ulazi članova (samo za vlasnika; vidi `TUYA_POVEZIVANJE.md`)
- **`Index.html`** — ekran koji radnik i vlasnik vide na telefonu

Sve se čuva u jednom Google Sheetu. Ne treba ti server, hosting ni ikakav program.

---

## 1. Napravi Google Sheet

1. Otvori <https://sheets.google.com> (prijavi se svojim Google računom).
2. Klikni **Prazno / Blank** → nova tabela.
3. Gore lijevo preimenuj je npr. u **Adin Šank**.

## 2. Zalijepi kod

1. U tabeli: meni **Extensions (Proširenja) → Apps Script**. Otvori se novi tab.
2. Lijevo je fajl **Code.gs**. Obriši sve što je u njemu i zalijepi **cijeli** sadržaj fajla `Code.gs`. Klikni 💾 (Save).
3. Lijevo pored "Files" klikni **+** → **Script**, nazovi ga **`Tuya`** i zalijepi cijeli `Tuya.gs`. Sačuvaj.
4. Lijevo pored "Files" klikni **+** → **HTML**. Nazovi ga tačno **`Index`** (bez `.html`, Google ga sam doda).
5. Obriši sve u njemu i zalijepi **cijeli** sadržaj fajla `Index.html`. Klikni 💾.

## 3. Vremenska zona

1. U Apps Scriptu lijevo klikni ⚙️ **Project Settings**.
2. **Time zone** → izaberi **(GMT+01:00) Central European Time – Sarajevo** (`Europe/Sarajevo`).

## 4. Napravi tabele (jednom)

1. Vrati se na **Editor** (ikona `< >` lijevo).
2. Gore u padajućem meniju pored dugmeta ▶ Run izaberi funkciju **`setupSpreadsheet`**.
3. Klikni **▶ Run**.
4. Google traži dozvolu (vidi tačku 7 ispod): **Review permissions** → izaberi svoj račun → **Advanced / Napredno** → **Go to … (unsafe)** → **Allow**.
5. Na dnu se pojavi "Execution completed". U tabeli sada imaš tabove: PROIZVODI, SMJENE, DOGADJAJI, INVENTURA, CLANOVI, ULAZI, PREGLED.

> `setupSpreadsheet` možeš pokrenuti koliko god puta hoćeš — **nikad ne briše podatke**. Samo doda ono što fali.
> U tabeli se pojavi i meni **Adin Šank → Postavi / popravi tabele** za isto.

## 5. Objavi aplikaciju

1. Gore desno **Deploy → New deployment**.
2. Kod "Select type" klikni ⚙️ → **Web app**.
3. Upiši opis npr. `Adin šank v1`.
4. **Execute as: Me** (ti)
5. **Who has access: Anyone** (Bilo ko)
6. **Deploy** → kopiraj **Web app URL** (završava sa `/exec`).

## 6. Na telefonu

1. Pošalji link sebi i radniku (Viber/WhatsApp) i otvori ga u **Chromeu** (Android) ili **Safariju** (iPhone).
2. **Dodaj na početni ekran:**
   - iPhone (Safari): dugme Dijeli ⬆️ → **Add to Home Screen / Dodaj na početni zaslon**.
   - Android (Chrome): ⋮ → **Add to Home screen / Dodaj na početni ekran**.
3. Od sada se aplikacija otvara kao ikonica.

## 7. Šta znače upozorenja pri dozvoli

Google pokazuje "**Google hasn't verified this app**" jer je skripta tvoja lična, a ne objavljena u Googleovoj prodavnici. To je normalno i sigurno: kod radi samo u **tvojoj** tabeli. Dozvole koje traži:
- *See, edit … your spreadsheets* — da upisuje prodaju u ovaj Sheet.
- *Connect to an external service / display web content* — da prikaže ekran aplikacije.

Pošto je "Execute as: Me", radnik **ne treba** Google račun i **ne vidi** tvoju tabelu. Ko ima link, može otvoriti aplikaciju — zato link ne objavljuj javno. Vlasnički pregled je zaštićen PIN-om.

## 8. PIN i postavke

Početni PIN je **2580**. **Odmah ga promijeni** u aplikaciji: **Vlasnik › → Postavke → Promjena PIN-a**. Novi PIN se čuva na Google serveru, ne u kodu, pa ga ažuriranje koda ne poništava. Nakon 5 pogrešnih pokušaja pristup se zaključa na 10 minuta.

Ostale postavke su na samom vrhu `Code.gs`, u bloku `CONFIG` (radnici, procenti, razlozi). Ako mijenjaš procente (prevoz, plata), pokreni još i funkciju `obnoviPregled` da tab PREGLED dobije nove brojeve.

## 9. Kako kasnije ažurirati kod (URL ostaje isti!)

1. Zalijepi novi `Code.gs` i/ili `Index.html` i sačuvaj.
2. **Deploy → Manage deployments** → klikni ✏️ (olovka) kod postojećeg deploymenta.
3. **Version → New version** → **Deploy**.

⚠️ Nemoj klikati "New deployment" za ažuriranje — to pravi **novi URL** i telefoni bi i dalje otvarali staru verziju.

## 10. Proizvodi i cijene

Najlakše u aplikaciji: **Vlasnik › → Proizvodi** (+ Novi proizvod, klik na proizvod za cijenu, nabavnu, minimum ili isključivanje). Ili direktno u tabu **PROIZVODI**:
- **nova cijena**: promijeni broj u koloni `cijena` (važi od sljedećeg klika; stare prodaje ostaju po staroj cijeni).
- **novi proizvod**: dodaj red (novi jedinstveni `product_id`, npr. `monster`), štikliraj `prati_zalihu` i `aktivan`.
- **ukloni proizvod**: odštikliraj `aktivan` (ne briši red — historija ga treba).
- `minimum` = ispod koliko komada te aplikacija upozori. `clanarina_mjeseci` = 1 samo za članarine.
- Promjena je vidljiva kad radnik ponovo otvori aplikaciju.

## 10a. Karte, članarine i paketi s trenerom

- **Dnevna karta**: jedan tap na pločicu 🎫 na vrhu ekrana prodaje.
- **Mjesečna karta / trener** (pločica 🏋️): izaberi člana (ili + Novi član) → označi kartu i/ili ličnog trenera i izaberi trenera → **NAPLAĆENO**. Primjer: karta 40 + trener 60 = 100 KM u kasi. Karta i trener se produžavaju od datuma isteka ako još važe, inače od danas.
- **Cijene i nove ponude** (npr. godišnja karta, studentska, 3 mjeseca): **Vlasnik → Proizvodi → + Novi proizvod / ponuda** → izaberi vrstu (Roba / Dnevna karta / Mjesečna karta / Lični trener / Ostala usluga) i koliko mjeseci traje.
- **Novac za trenera**: kod proizvoda Lični trener polje "Ide treneru" je po defaultu jednako cijeni (60). Tako taj novac ne ulazi u profit kluba ni u 30% plate radnika. Ako ste vi treneri i hoćete da ulazi u profit, stavi 0.
- **Spisak radnika i trenera**: **Vlasnik → Postavke**.
- **Evidencija**: **Vlasnik → Karte** (dnevne i mjesečne danas/mjesec, nove i produžene, ko ima trenera i do kada).

## 10b. Raspored treninga (podsjetnik "Danas na treningu")

- Na prvom ekranu i tokom smjene radnik vidi **ko danas dolazi, u koliko sati, s kojim trenerom i šta trenira** (dugme "sutra →" pokazuje sutrašnji dan).
- Uređuje se u **Vlasnik → Raspored**: "+ Novi termin" ili klik na postojeći → osobe, vrijeme, trener, dani i za **svaki dan** šta se trenira.
- Podaci su u tabu **TRENINZI** u Sheetu (jedan red = jedan termin u jednom danu).

## 10c. Kasa, potrošnja osoblja i uzeto iz kase

- Na početku smjene radnik upiše **gotovinu u kasi**. Na kraju: **u kasi treba biti = početno + promet − uzeto iz kase**.
- **☕ Potrošnja osoblja**: ko je šta popio/uzeo (npr. Edin 1× Protein). Ne ide u kasu ni promet, ali se skida sa zalihe — pa robe ne "fali".
- **💶 Uzeto iz kase**: ko je uzeo koliko novca i zašto.
- Vlasnik → **Danas**: kartica "Potrošnja i uzeto" po osobi, danas i ovaj mjesec (vrijednost po nabavnoj cijeni).

## 11. Provjera da sve radi (5 minuta)

Uradi ovo jednom nakon postavljanja (poslije možeš obrisati redove testa iz SMJENE/DOGADJAJI/INVENTURA):

1. Otvori link → **Kenan** → Dalje.
2. Upiši: Red Bull **10**, Voda 0,5 L **15**, sve ostalo **0** → ZAPOČNI SMJENU.
3. Tapni **Red Bull** 2×, **Voda 0,5 L** 3×. Dole piše **11,00 KM**.
4. **+ DOPUNA ZALIHE** → Red Bull → upiši **5** → Dodaj.
5. **ZAVRŠI SMJENU** → Da → upiši Red Bull **12**, Voda 0,5 L **12**, ostalo 0 → DALJE — KASA → **11** → PROVJERI.
6. Vidiš "✓ poklapa se" za kasu i "⚠ 1 proizvod se ne poklapa" → izaberi **Ne znam** → ZAVRŠI SMJENU.
7. Izvještaj mora pokazati: promet **11,00 KM**, kasa razlika **0,00**, "11 proizvoda se poklapa", **Red Bull: očekivano 13, stvarno 12, razlika −1 kom · −4,00 KM**.
8. U Sheetu: SMJENE ima red sa `CLOSED`, DOGADJAJI ima 6 redova, INVENTURA ima Red Bull `-1` i `-4`.

## 12. Šta gdje gledaš (vlasnik)

- U aplikaciji: dno prvog ekrana **Vlasnik ›** → PIN → Danas / Karte / Vrata / Smjene / Članovi / Zalihe / Proizvodi / Mjesec / Postavke.
- Napomene radnika (dugme "✎ Napomena za vlasnika") vidiš u izvještaju smjene i u tabu Smjene.
- Vrata, svjetla i ulazi članova: vidi **`TUYA_POVEZIVANJE.md`**.
- U Sheetu: tab **PREGLED** (promet, profit, plata, top proizvodi, po radniku, članarine, historija). Ne upisuj ništa u PREGLED, to su formule.
- Zaboravljena otvorena smjena (>14 h) pojavi se crveno u "Danas". Najbolje da radnik sam završi (pri sljedećem otvaranju aplikacije odmah je vidi). Ako ne može, zatvori je "bez brojanja" uz napomenu: brojevi se ne izmišljaju, samo se zabilježi da nije prebrojano.

## Za developera (nije potrebno vlasniku)

- Izvor frontenda je `src/app.jsx`; `Index.html` se generiše: `npm install && npm run build`.
- Testovi: `npm test` (backend uz mock Sheeta, logika frontenda, i cijeli scenarij u Chromiumu ako je Playwright dostupan).
