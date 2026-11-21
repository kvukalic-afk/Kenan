# Adin Šank — postavljanje korak po korak

Aplikacija ima samo dva fajla koja te zanimaju:

- **`Code.gs`** — "mozak" (radi na Googleovom serveru)
- **`Index.html`** — ekran koji radnik vidi na telefonu

Sve se čuva u jednom Google Sheetu. Ne treba ti server, hosting ni ikakav program.

---

## 1. Napravi Google Sheet

1. Otvori <https://sheets.google.com> (prijavi se svojim Google računom).
2. Klikni **Prazno / Blank** → nova tabela.
3. Gore lijevo preimenuj je npr. u **Adin Šank**.

## 2. Zalijepi kod

1. U tabeli: meni **Extensions (Proširenja) → Apps Script**. Otvori se novi tab.
2. Lijevo je fajl **Code.gs**. Obriši sve što je u njemu i zalijepi **cijeli** sadržaj fajla `Code.gs`. Klikni 💾 (Save).
3. Lijevo pored "Files" klikni **+** → **HTML**. Nazovi ga tačno **`Index`** (bez `.html`, Google ga sam doda).
4. Obriši sve u njemu i zalijepi **cijeli** sadržaj fajla `Index.html`. Klikni 💾.

## 3. Vremenska zona

1. U Apps Scriptu lijevo klikni ⚙️ **Project Settings**.
2. **Time zone** → izaberi **(GMT+01:00) Central European Time – Sarajevo** (`Europe/Sarajevo`).

## 4. Napravi tabele (jednom)

1. Vrati se na **Editor** (ikona `< >` lijevo).
2. Gore u padajućem meniju pored dugmeta ▶ Run izaberi funkciju **`setupSpreadsheet`**.
3. Klikni **▶ Run**.
4. Google traži dozvolu (vidi tačku 7 ispod): **Review permissions** → izaberi svoj račun → **Advanced / Napredno** → **Go to … (unsafe)** → **Allow**.
5. Na dnu se pojavi "Execution completed". U tabeli sada imaš tabove: PROIZVODI, SMJENE, DOGADJAJI, INVENTURA, CLANOVI, PREGLED.

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

Na samom vrhu `Code.gs` je blok `CONFIG`:

```js
ADMIN_PIN: '2580',               // PROMIJENI OVO
RADNICI: ['Kenan', 'Edvin'],
PLATA_UDIO: 0.30,
...
```

**Odmah promijeni PIN**, sačuvaj i napravi novu verziju (tačka 9). Ako mijenjaš procente (prevoz, plata), pokreni još i funkciju `obnoviPregled` da tab PREGLED dobije nove brojeve.

## 9. Kako kasnije ažurirati kod (URL ostaje isti!)

1. Zalijepi novi `Code.gs` i/ili `Index.html` i sačuvaj.
2. **Deploy → Manage deployments** → klikni ✏️ (olovka) kod postojećeg deploymenta.
3. **Version → New version** → **Deploy**.

⚠️ Nemoj klikati "New deployment" za ažuriranje — to pravi **novi URL** i telefoni bi i dalje otvarali staru verziju.

## 10. Proizvodi i cijene

Sve u tabu **PROIZVODI**, bez diranja koda:
- **nova cijena**: promijeni broj u koloni `cijena` (važi od sljedećeg klika; stare prodaje ostaju po staroj cijeni).
- **novi proizvod**: dodaj red (novi jedinstveni `product_id`, npr. `monster`), štikliraj `prati_zalihu` i `aktivan`.
- **ukloni proizvod**: odštikliraj `aktivan` (ne briši red — historija ga treba).
- `minimum` = ispod koliko komada te aplikacija upozori. `clanarina_mjeseci` = 1 samo za članarine.
- Promjena je vidljiva kad radnik ponovo otvori aplikaciju.

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

- U aplikaciji: dno prvog ekrana **Vlasnik ›** → PIN → Danas / Zalihe / Članovi / Smjene / Mjesec.
- U Sheetu: tab **PREGLED** (promet, profit, plata, top proizvodi, po radniku, članarine, historija). Ne upisuj ništa u PREGLED, to su formule.
- Zaboravljena otvorena smjena (>14 h) pojavi se crveno u "Danas". Najbolje da radnik sam završi (pri sljedećem otvaranju aplikacije odmah je vidi). Ako ne može, zatvori je "bez brojanja" uz napomenu: brojevi se ne izmišljaju, samo se zabilježi da nije prebrojano.

## Za developera (nije potrebno vlasniku)

- Izvor frontenda je `src/app.jsx`; `Index.html` se generiše: `npm install && npm run build`.
- Testovi: `npm test` (backend uz mock Sheeta, logika frontenda, i cijeli scenarij u Chromiumu ako je Playwright dostupan).
