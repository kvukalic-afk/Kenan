# PC_B01 · GHK-Cu · Radne bilješke

**Status: NACRT (V1 DRAFT).** Video je tehnički gotov, ali po master promptu još nije za objavu. Razlozi su u odjeljku „Šta blokira objavu“.

## Šta blokira objavu
1. **Dokaz E1 nije otvoren u originalu.** PMC, Europe PMC, PubMed, ResearchGate i stranica izdavača (omicsonline) blokirani su mrežnim pravilima cloud okruženja. Brojke iz E1 imam samo iz sažetaka web pretrage, pa po pravilu 3 („izvor koji ne možeš otvoriti ne koristiš“) nose oznaku [PROVJERITI].
2. **Glas je privremen (espeak-ng).** Pravi glas (vidIQ / ElevenLabs „Eric“, 44,7 s) je generisan, ali preuzimanje s assets.vidiq.com blokira mreža.
3. **Faza 1 (Reddit) i faza 4 (TikTok obrazac) nisu urađene iz prve ruke.** Reddit i TikTok su blokirani za fetch.

## Faza 0 · Inventura
Nema ulaznog videa (nije bio ni u repou ni na Google Driveu). Po tvojoj odluci video je napravljen od nule, samo od brendirane grafike. Zato nema HELVERA elemenata, avatara ni ambalaže.

## Faza 1 · Šta ljudi najviše žele od ovog peptida?
Iz prve ruke NIJE urađeno (Reddit blokiran). Iz sekundarnih sažetaka web pretrage (ne računa se kao nezavisni izvor):
- Želja (hipoteza): manje izražene fine bore i bolja tekstura kože, posebno oko očiju. [PROVJERITI na ≥ 3 nezavisna razgovora]
- Sumnje (hipoteza): „radi li išta“, koliko dugo do rezultata (spominje se 3–6 mjeseci), „copper uglies“ (koža prvo izgleda gore), miješanje s vitaminom C, retinolom i kiselinama.
- Avatar: B (Njega i izgled), hipoteza nije potvrđena.

## Faza 2 · Dokazi
| ID | Tvrdnja | Oblik | Model | n | Dizajn | Ishod | Skala | Ograničenje | Izvor | Provjereno |
|---|---|---|---|---|---|---|---|---|---|---|
| E1 | Manji volumen bora uz GHK-Cu serum | GHK-Cu u lipidnom nano-nosaču, serum, 2× dnevno | Ljudi, žene 40–65 | 40 | Randomizirana, dvostruko slijepa, split-face | Volumen bora −55,8 % vs kontrolni serum; dubina −32,8 % (p = 0,012); −31,6 % vs Matrixyl 3000 | 3 | Mala, 8 sedmica; serum dao proizvođač (Snowberry NZ); časopis s upitnom reputacijom | Badenhorst i sar., J Aging Sci 2016 (DOI [PROVJERITI]) | **ne** [PROVJERITI] |
| E2 | Pregledni rad o GHK-Cu i genima | — | Pregled (Connectivity Map) | — | Pregled | Ne koristi se u videu | — | Korelacije, ne uzrok | Pickart & Margolina, Int J Mol Sci 2018 (PMC6073405) | ne |

Tvrdnje koje su kružile, a NE koriste se (nisu povezane s primarnim radom): „70 % više kolagena“, „studija na 80 žena 2023.“, „28 % kolagena za 3 mjeseca“.

## Faza 3 · Ugao
Obećanje: „Gledalac će saznati šta jedna mala kontrolisana studija kaže o bakrenom peptidu i finim borama, na nivou dokaza 3.“
Ocjene: učestalost 4 (hipoteza) · emocija 4 · odgovor iz dokaza 3 (prag prolazi samo ako se E1 potvrdi) · vizuelnost 5 · sigurnost platforme 5 (GHK-Cu nije među blokiranim pojmovima; prema izvještajima iz oktobra 2026, TikTok blokira BPC-157, retatrutid i semaglutid).

## Faza 4 · TikTok mehanizam
Referentne TikTokove nisam mogao otvoriti, pa metrika nema. Korišten je obrazac iz master prompta: pitanje-želja u prvom kadru → otvorena petlja („jedna brojka“) → nalaz s brojkom na ekranu → ograničenje + Skala dokaza → odgovor na ~80 % trajanja → CTA. [PROVJERITI na 3–5 stvarnih videa]

## Koji izvori podržavaju tvrdnje (vrijeme → tvrdnja → izvor)
| Vrijeme* | Tvrdnja | ID | Nivo |
|---|---|---|---|
| 8,9–17,3 s | 40 žena, 40–65 god., 8 sedmica, GHK-Cu serum | E1 | 3 |
| 18,2–21,9 s | Split-face: peptid vs običan serum | E1 | 3 |
| 22,7–27,7 s | Volumen bora −55,8 % (≈ 56 %) vs običan serum | E1 | 3 |
| 28,6–32,1 s | Mala studija, serum dao proizvođač | E1 | — |
| 38,0–43,8 s | Zanimljivi rezultati na ljudima, velike studije nedostaju | E1 | 3 |
*Vremena važe za privremeni glas; s pravim glasom se preračunavaju automatski.

## Odluke i pretpostavke
- Paleta A (grafit + bakar), Manrope ExtraBold (OFL, npm @expo-google-fonts/manrope) + Inter. Dijakritici provjereni probnim kadrom.
- Trajanje ~49 s s privremenim glasom (pravi glas: 44,7 s + 2 s kartica ≈ 47 s). To je malo iznad cilja 30–45 s. Ako treba, prvo se skraćuje rečenica 2.
- Disclaimer je na završnoj kartici i u opisu (trajna traka je uklonjena zbog čitljivosti).
- Muzika: nema licencirane podloge, pa je isporučena samo verzija bez muzike. `make.sh glas.mp3 muzika.mp3` pravi i verziju s muzikom (−18 dB, ducking).

## Kontrola kvaliteta (V1 DRAFT)
| Oblast | Rezultat |
|---|---|
| Stari brend | N/A (nema izvornog videa) ✅ |
| Izgovor | ❌ privremeni robotski glas |
| Sinhronizacija | Titlovi raspoređeni po rečenicama iz silencedetect ✅ |
| Čitljivost | Sigurne zone poštovane, dijakritici ispravni ✅ |
| Glasnoća | −14,1 LUFS, peak −2,6 dBFS ✅ |
| Slika | 0 crnih i 0 zamrznutih kadrova ✅ |
| Sadržaj | ❌ E1 = [PROVJERITI] |
| Brand-safe | Bez doza, nabavke i obećanja ✅ |
| Tehnika | 1080 × 1920, H.264 High, yuv420p, AAC 48 kHz, faststart, očišćeni metapodaci ✅ |

## Licence
- Font Manrope: SIL OFL 1.1 ✅ · Inter: SIL OFL ✅
- Grafika: vlastita (PIL) ✅
- Glas (pravi): vidIQ voiceover (ElevenLabs), Free plan, potrošeno 28/150 kredita. Komercijalna upotreba [PROVJERITI uslove vidIQ-a i ElevenLabsa]
- Glas (privremeni): espeak-ng (GPL; generisani zvuk je slobodan za upotrebu)

## Red za tabelu praćenja
B01 · Koža · B (Njega i izgled) · Grafika + naracija, mit vs brojka · „Šta bakreni peptid stvarno radi za fine bore?“ · Znatiželja + skepsa · Odgovara na želju publike konkretnom brojkom i pošteno ističe granice · Confidence 5/10 (dok se E1 ne potvrdi)

## Ideje za sljedeće videe
- „Copper uglies“: mit ili stvarnost?
- Bakreni peptid i kosa: šta se zna o vlasištu?
- Bakreni peptid + vitamin C: zašto se o tome raspravlja?
