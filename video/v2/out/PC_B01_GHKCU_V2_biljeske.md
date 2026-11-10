# PC_B01 · GHK-Cu · V2 · Radne bilješke

**Status: V2 spreman za objavu** (uz otvorene tačke na dnu). Preporuka: objaviti V2, a V1 čuvati kao rezervu za A/B test.

## Zašto V2 (šta je bilo slabo u V1)
| V1 | V2 |
|---|---|
| Hook: pitanje + mala molekula, bez razloga da palac stane | Prvi kadar: brojač 200 → 80 i naslov „Peptid koji s godinama pada ispod pola“, jasno bez zvuka |
| 10 statičnih slajdova, kadar stoji 4–8 s | 15 vizuelnih ritmova (novi svakih ~3 s) + animacija unutar svakog: brojači, molekula koja „diše“, ćelije koje se pale, talas bora koji se pegla |
| Ton „prije nego povjeruješ reklami“ | Ton čuđenja i poštovanja prema nauci: priča od 1973. do 2016., „od epruvete do lica“ |
| Engleski glas s naglaskom | Microsoft **Goran**, izvorni bosanski neuralni glas, +14 % tempo |
| Titlovi raspoređeni po rečenicama | Titlovi sinhronizovani **po riječima** (word boundaries), 1–3 riječi po prikazu |
| Bez muzike i zvuka | Originalna muzika (Fmaj7–Am7–Cmaj7–G6, 92 BPM) + whoosh na rezovima, tick na brojačima, ding na rezultatu, pop na čipovima |
| Samo jedna studija | Dva provjerena izvora + Skala dokaza prikazana dvaput (nivo 1 za epruvetu, nivo 3 za studiju na ljudima), da gledalac nauči skalu |

## Scenarij V2 (izgovoreno)
1. S dvadeset godina imaš ga puno. Sa šezdeset, manje od pola.
2. Prirodno ga ima u tvojoj krvi. Zove se GHK-Cu, ili bakreni peptid.
3. Otkriven je davne 1973, kad je krv mladih natjerala staro tkivo jetre da pravi proteine kao mlađe.
4. Doduše, u epruveti. Pa šta se desi kad ga staviš na kožu?
5. 40 žena, 8 sedmica. Jedna strana lica dobila je serum s peptidom, druga isti serum bez njega.
6. Volumen bora pao je za skoro 56% u odnosu na serum bez peptida.
7. E sad, studija je mala, a platio ju je proizvođač. Nivo 3 od 5.
8. Nije čudo preko noći. Ali je lijep primjer kako nauka ide: od epruvete do lica.
9. Sačuvaj, i prati za sljedeći peptid.

Mehanizam (faza 4, obrazac): brojka koja traži objašnjenje u 1. sekundi → identitet („u tvojoj krvi“) → priča o otkriću (radoznalost) → otvorena petlja „a na koži?“ → dokaz s brojem → pošteno ograničenje + skala → optimističan zaključak → CTA.

## Tvrdnje ↔ izvori
| # | Tvrdnja | Izvor | Šta tačno piše u izvoru | Nivo | Provjereno |
|---|---|---|---|---|---|
| 1 | ~200 ng/mL sa 20, ~80 ng/mL sa 60 god. („manje od pola“: 80/200 = 40 %) | E2 | „At age 20, the plasma level of GHK is about 200 ng/mL … by the age of 60, it declines to 80 ng/mL.“ | mjerenje kod ljudi (opservacija, nije tvrdnja o koristi) | da (PMC6073405, otvoreno) |
| 2 | Prirodno postoji u krvi | E2 | „naturally occurring tri-peptide present in human plasma“ | — | da |
| 3 | Otkriven 1973; plazma mladih → tkivo jetre starijih pravi proteine kao kod mlađih | E2 (+ Pickart, doktorska teza 1973, ref. 6) | „plasma from young individuals added to liver tissue obtained from older individuals, caused old liver tissue to produce proteins more characteristic of younger individuals“ | 1 (laboratorija) | da |
| 5–6 | 40 žena, 8 sedmica, split-face, −55,8 % volumena bora vs serum bez peptida | E1 | „n= 40, aged 40 to 65 … 8 weeks“; „randomised double-blind, split-face“; „55.8%; p<0.001 … compared to control serum“ | 3 | da (originalni PDF) |
| 7 | Platio proizvođač | E1 | „This study was funded by Snowberry New Zealand Ltd“ | — | da |
| 8 | „od epruvete (1973) do lica (2016)“ | E1 + E2 | godine otkrića i studije | — | da |

- **E1:** Badenhorst T, Svirskis D, Merrilees M, Bolke L, Wu Z. *Effects of GHK-Cu on MMP and TIMP Expression, Collagen and Elastin Production, and Facial Wrinkle Parameters.* J Aging Sci. 2016;4:166. DOI 10.4172/2329-8847.1000166
- **E2:** Pickart L, Margolina A. *Regenerative and Protective Actions of the GHK-Cu Peptide in the Light of the New Gene Data.* Int J Mol Sci. 2018;19(7):1987. PMC6073405. Napomena: Pickart je otkrio GHK, pa nije neutralan autor.

Nije rečeno (namjerno): da mazanje vraća nivo iz krvi, da pad u krvi uzrokuje bore, doze, proizvodi, nabavka.

## Kontrola kvaliteta V2
| Oblast | Rezultat |
|---|---|
| Glasnoća | −14,0 LUFS, peak −2,1 dBFS (obje verzije) ✅ |
| Muzika vs glas | podloga −17 dB ispod glasa + ducking ✅ |
| Slika | 0 crnih, 0 zamrznutih kadrova ✅ |
| Sigurne zone | tekst izvan gornjih 220, donjih 420 i desnih 140 px ✅ |
| Dijakritici | č ć š ž đ ispravni ✅ |
| Sinhronizacija | titl ide na početak izgovorene riječi (edge-tts word boundary) ✅ |
| Izgovor | ⚠️ preslušaj: „ge-ha-ka bakar“, „sedamdeset treće“ |
| Tehnika | 1080 × 1920, H.264 High, yuv420p, AAC 48 kHz, faststart, bez metapodataka, 47,0 s ✅ |
| Brand-safe | bez doza, nabavke, obećanja, before/after ✅ |

## Licence
- Glas: Microsoft Edge neural TTS (bs-BA-GoranNeural) preko edge-tts. **[PROVJERITI]** uslove Microsofta za komercijalnu upotrebu; alternativa je da isti tekst snimiš sam (`v2/script.py`, polje `tts`).
- Muzika i zvučni efekti: originalno sintetizovani u `v2/sound.py`, bez tuđih semplova ✅
- Fontovi: Manrope, Inter (SIL OFL) ✅ · Grafika: vlastita ✅

## Otvoreno
1. Faza 1 (Reddit): automatski pristup je odbijen (403), pa su želje publike hipoteze.
2. Faza 4: referentni TikTokovi nisu otvoreni; korišten je obrazac iz master prompta.
3. Licenca Goranovog glasa [PROVJERITI].

## Red za tabelu praćenja
B01 · Koža · B + C (Njega i izgled + Radoznalac) · Priča + brojka · „Peptid koji s godinama pada ispod pola“ · Čuđenje → povjerenje · Brojka u 1. sekundi + priča o otkriću + pošteno ograničenje · Confidence 8/10
