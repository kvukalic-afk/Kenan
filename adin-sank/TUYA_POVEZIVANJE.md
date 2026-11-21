# Povezivanje s Tuyom: vrata, svjetla i ulazi članova

Ovo radi **samo vlasnik**. Sve je u aplikaciji pod **Vlasnik › (PIN) → Vrata**. Radnik ne vidi ni dugme.

Šta dobiješ:

| Funkcija | Gdje radi | Kako |
|---|---|---|
| Članovi ulaze čipom / šifrom | **Brava sama** (Tuya / Smart Life aplikacija) | čip/šifru dodaješ u Tuya aplikaciji |
| **Evidencija ko je ušao i kad**, uz provjeru članarine | ova aplikacija → tab ULAZI | povlači se s brave svakih 5 min |
| Upozorenje "ušao bez važeće članarine" / "nepoznat korisnik" | ova aplikacija | poređenje sa CLANOVI |
| Daljinsko otključavanje i paljenje/gašenje svjetla | ova aplikacija (uz PIN) | Tuya Cloud API |
| **Svjetla se pale kad član otključa, gase 1 h poslije** | **Tuya / Smart Life automatizacija** | korak 5 ispod |

> **Zašto svjetla ne idu preko ove aplikacije?** Google skripta može provjeravati bravu najčešće svakih nekoliko minuta. Član bi ušao u mrak. Tuya automatizacija reaguje odmah, a radi i kad Google ili internet na telefonu zakaže.

---

## 1. Napravi Tuya Cloud projekat (jednom, ~15 min, besplatno)

1. Otvori <https://iot.tuya.com> i napravi račun (može isti e-mail kao Smart Life).
2. **Cloud → Development → Create Cloud Project**
   - Project name: `Adin`
   - Industry: **Smart Home**
   - Development Method: **Smart Home**
   - Data Center: **Central Europe Data Center** (za BiH). Mora biti isti kao u tvojoj Smart Life aplikaciji.
3. Na sljedećem koraku (API services) ostavi ponuđene i **dodaj**:
   - **IoT Core**
   - **Authorization Token Management**
   - **Smart Lock Open Service** (za otključavanje i dnevnik ulazaka)
4. U projektu, tab **Overview**: kopiraj **Access ID/Client ID** i **Access Secret/Client Secret**.

## 2. Poveži svoju Smart Life / Tuya aplikaciju s projektom

1. U projektu: **Devices → Link App Account → Add App Account**. Pojavi se QR kod.
2. Na telefonu, u **Smart Life** (ili Tuya Smart) aplikaciji: **Ja / Me → ikona skeniranja gore desno** → skeniraj QR.
3. Brava i prekidač za svjetla sada se vide u **Devices → All Devices**. Kopiraj **Device ID** brave i prekidača.

## 3. Upiši u aplikaciju

**Vlasnik → Vrata → Postavke veze s Tuyom:**
- Access ID, Access Secret
- Data centar: **Central Europe**
- Device ID brave
- Device ID prekidača za svjetla (ako ga imaš)
- Kod prekidača: ostavi `switch_1`. Za višekanalni prekidač može biti `switch_2` itd. (vidi na iot.tuya.com → uređaj → Debug Device).

Klikni **Sačuvaj i provjeri vezu**. Mora pisati "Veza s Tuyom radi". Secret se čuva samo na Google serveru i nikad se više ne prikazuje na telefonu.

Pri prvom korištenju Google traži novu dozvolu (*Connect to an external service*): odobri je kao u README, tačka 7. Ako ne pita sam, u Apps Scriptu pokreni bilo koju funkciju iz `Tuya.gs` (npr. `sinhronizujUlaze`) i odobri.

Zatim uključi **"Automatsko povlačenje ulaza"**. Ulazi se od tada sami upisuju u tab **ULAZI** svakih 5 minuta.

## 4. Članovi s čipom / šifrom

1. Čip ili šifru dodaješ kao i do sada, u **Smart Life → brava → Korisnici / Members**. Daj korisniku **isto ime kao u aplikaciji** (npr. "Amel Hodžić"). Tada ga aplikacija sama prepozna.
2. Ako se ime razlikuje: **Vlasnik → Članovi → član → "Čip / šifra u bravi"**. Upiši ono što se pojavi u ULAZI kod "Nepoznat korisnik" (broj čipa ili ID korisnika).
3. U ULAZI crveno vidiš:
   - **Ušao bez važeće članarine**: član je ušao, a članarina mu je istekla. Zato kod isteka obriši ili blokiraj čip u Smart Life (ili mu naplati).
   - **Nepoznat korisnik brave**: čip/šifra nije povezan ni s jednim članom.

## 5. Svjetla: upali kad član otključa, ugasi 1 h poslije

U **Smart Life → Scena / Scene → + → Automatizacija**:

**AKO (If):** "Kad se stanje uređaja promijeni" → **brava** → *Otključavanje čipom / šifrom / otiskom* (izaberi sve načine koje koristite; za svaki način može trebati poseban uslov, "Ispunjen bilo koji uslov").

**ONDA (Then):** prekidač za svjetla → **Uključi**.

**Gašenje nakon 1 h: najbolja opcija zavisi od prekidača:**

- ✅ **Ako prekidač ima "Odbrojavanje / Countdown"** (većina Tuya prekidača ga ima): u istoj automatizaciji dodaj i akciju **Countdown = 1 h** (3600 s).
  - Svaki novi ulazak **ponovo postavi** odbrojavanje na 1 h. Svjetla se gase **1 h nakon zadnjeg** ulaska, nikad usred nečijeg treninga.
- ⚠️ **Ako nema countdown**, nego samo "Odgodi / Delay 1 h → Isključi": svjetla se gase 1 h nakon **prvog** ulaska. Ako drugi član uđe 40 min poslije, ostaće u mraku nakon 20 min. Za 24/7 teretanu to nije dobro.
  - Tada je bolje dodati **senzor pokreta** (PIR) i automatizaciju "nema pokreta 60 min → isključi".

Testiraj: otključaj čipom → svjetla se moraju upaliti za 1–3 sekunde.

## 6. Sigurnost: da to može samo vlasnik

- U ovoj aplikaciji vrata, svjetla, ulazi, proizvodi i postavke traže **PIN**, a provjeru PIN-a radi Google server, ne telefon. Nakon 5 pogrešnih pokušaja pristup se zaključa 10 minuta. PIN promijeni u **Vlasnik → Postavke**.
- **Najvažnije:** radnik **ne smije** biti član tvog "Doma" u Smart Life. Iz te aplikacije bi mogao otključati vrata i mijenjati automatizacije. Ako radnik treba ući, daj mu **običan čip/šifru** kao i članovima.
- Access Secret nikom ne šalji. Ako procuri: iot.tuya.com → projekat → **Reset Secret**, pa upiši novi u aplikaciju.

## 7. Česti problemi

| Poruka | Rješenje |
|---|---|
| "Tuya ne prihvata Access ID / Secret ili region" | pogrešan ključ ili data centar (mora biti isti kao Smart Life račun) |
| "nema dozvole za ovaj uređaj" | korak 2 nije urađen ili fali API servis iz koraka 1.3 |
| Otključavanje ne radi, a status radi | brava ne podržava daljinsko otključavanje preko oblaka (zavisi od modela; neke traže gateway) |
| Ulazi su prazni | provjeri da je *Smart Lock Open Service* uključen; neke brave bilježe ulaze samo uz Wi-Fi/gateway |
| Sve je stalo nakon nekoliko mjeseci | besplatni Tuya cloud paket treba povremeno produžiti: iot.tuya.com → Cloud → Cloud Services → IoT Core → *Extend* (Tuya šalje mail prije isteka) |

> Napomena: dio Tuya funkcija zavisi od modela brave. Daljinsko otključavanje i dnevnik ulazaka testirani su protiv simuliranog Tuya servera po zvaničnoj specifikaciji, a ne na tvojoj bravi. Prvi put probaj dok si pored vrata.
