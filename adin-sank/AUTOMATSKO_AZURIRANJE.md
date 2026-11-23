# Automatsko ažuriranje aplikacije (podesi jednom, ~15 min)

Kad je ovo podešeno, svaka nova verzija koju Claude napravi na GitHubu:
1. prvo prođe sve testove (ako ijedan padne, **ništa se ne objavljuje**),
2. sama se pošalje u tvoj Apps Script,
3. objavi se na **isti link**, pa ti samo zatvoriš i otvoriš aplikaciju na telefonu.

Tabele u Sheetu se same nadograde pri prvom otvaranju nove verzije. Više ne moraš pokretati `setupSpreadsheet`.

Treba ti **računar** (Windows ili Mac) i oko 15 minuta.

---

## Korak 1 — Uključi Apps Script API (30 sekundi)
1. Otvori <https://script.google.com/home/usersettings>
2. **Google Apps Script API** → prebaci na **On (Uključeno)**.

## Korak 2 — Kopiraj Script ID
1. Otvori svoju tabelu **Adin Šank** → **Extensions → Apps Script**.
2. Lijevo ⚙️ **Project Settings** → dio **IDs** → **Script ID** → **Copy**.
3. Zalijepi ga negdje privremeno (npr. Notepad) i označi ga kao `SCRIPT ID`.

## Korak 3 — Kopiraj Deployment ID
1. U Apps Scriptu gore desno **Deploy → Manage deployments**.
2. Klikni na svoj **Web app** (onaj čiji link je na telefonima).
3. Kopiraj **Deployment ID** (dugačak niz koji počinje sa `AKfy…`) i zalijepi ga pod `DEPLOYMENT ID`.

## Korak 4 — Napravi Google ključ za objavljivanje

### 4a. Instaliraj Node.js (jednom)
1. Otvori <https://nodejs.org> → klikni veliko dugme **LTS** → preuzmi i instaliraj (**Next, Next, Install**, ništa ne mijenjaj).

### 4b. Prijava
**Windows:**
1. Klikni **Start**, ukucaj `cmd` i otvori **Command Prompt**.
2. Zalijepi ovu komandu (desni klik zalijepi) i pritisni **Enter**:
   ```
   npx @google/clasp@2.4.2 login
   ```
3. Ako pita `Ok to proceed? (y)`, ukucaj `y` i Enter.
4. Otvori se browser: izaberi **isti Google račun** na kojem je tabela → **Allow / Dozvoli**.
5. U prozoru piše `Authorization successful` / `Logged in`.
6. Sada zalijepi i ovo pa Enter:
   ```
   notepad %USERPROFILE%\.clasprc.json
   ```
7. Otvori se Notepad s jednim dugim redom teksta. **Ctrl+A** pa **Ctrl+C** (kopiraj sve).

**Mac:** isto, ali otvori aplikaciju **Terminal**. U koraku 6 koristi `open -e ~/.clasprc.json`, pa **Cmd+A, Cmd+C**.

> Ovo je ključ tvog Google naloga za Apps Script. **Ne šalji ga nikome, ni u chat.** Ide samo u GitHub kao tajna (korak 5).

## Korak 5 — Upiši 3 tajne u GitHub
1. Otvori <https://github.com/kvukalic-afk/Kenan/settings/secrets/actions>
2. Klikni **New repository secret** i napravi ove tri, tačno ovim imenima:

| Name | Secret (vrijednost) |
|---|---|
| `CLASPRC_JSON` | cijeli tekst iz Notepada (korak 4b) |
| `APPS_SCRIPT_ID` | Script ID (korak 2) |
| `APPS_SCRIPT_DEPLOYMENT_ID` | Deployment ID (korak 3) |

Poslije svake klikni **Add secret**. GitHub ih šifruje: niko ih više ne može pročitati, ni ti ni Claude.

## Korak 6 — Počisti i javi
1. Na računaru obriši lokalnu kopiju ključa (više ne treba):
   - Windows (Command Prompt): `del %USERPROFILE%\.clasprc.json`
   - Mac (Terminal): `rm ~/.clasprc.json`
2. Napiši Claudeu **"gotovo"**. On pokrene probnu objavu i provjeri da je prošla.

---

## Kako to radi poslije
- Claude napravi promjenu → GitHub (tab **Actions**) pokrene "Adin šank — automatska objava" → testovi → objava.
- Zelena kvačica ✓ znači da je objavljeno. Crveni ✗ znači da nešto nije prošlo; **stara verzija i dalje radi**, ništa se ne kvari.
- Na telefonu zatvori i ponovo otvori aplikaciju da dobiješ novu verziju.

## Ako zatreba
- **Isključiti automatsku objavu:** obriši tajnu `CLASPRC_JSON` u GitHubu.
- **Aplikacija nakon ažuriranja traži dozvolu ili javlja grešku:** nova verzija je trebala novu Google dozvolu. Otvori Apps Script, izaberi `setupSpreadsheet` → **▶ Run** → **Allow**. To se dešava rijetko.
- **Promijenio si Google lozinku / ključ istekne** (otprilike svakih 6 mjeseci ako se ne koristi): ponovi korak 4 i u GitHubu zamijeni tajnu `CLASPRC_JSON` (Update).
