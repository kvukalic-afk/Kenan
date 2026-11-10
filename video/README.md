# Peptid Centar · video B01 (GHK-Cu)

Video pravljen po „PEPTID CENTAR — Master prompt za video v2“, od nule (brendirana grafika, bez tuđih kadrova).

- `out/` — MP4, .srt, mreža sličica, opis za objavu, radne bilješke
- `render.py` — grafika i titlovi (paleta A, Manrope ExtraBold, sigurne zone za TikTok)
- `tts_text.txt` — tekst naracije za glas (brojke napisane riječima)
- `make.sh` — cijeli pipeline: obrada glasa → tajming → render → izvoz

## Zamjena glasa
Sve rečenice u jednom fajlu, s pauzom od ~0,5 s između rečenica (10 rečenica):

```bash
./make.sh glas.mp3              # verzija bez muzike
./make.sh glas.mp3 muzika.mp3   # + verzija s muzikom (−18 dB, ducking)
```

Bez argumenta se koristi privremeni espeak-ng glas (samo za nacrt). Finalni glas: `./make.sh assets/glas_eric_vidiq.mp3`.

## V2 (preporučeno) — `v2/`
Novi scenarij (priča od 1973. do 2016.), bosanski glas Goran (edge-tts), titlovi po riječima, 15 vizuelnih ritmova, originalna muzika i zvučni efekti.

```bash
cd v2 && ./make.sh            # glas + render + miks (treba pristup speech.platform.bing.com)
cd v2 && ./make.sh skip-tts   # ponovni render s postojećim glasom
```
Scenarij i izvori: `v2/script.py`; bilješke: `v2/out/PC_B01_GHKCU_V2_biljeske.md`.
