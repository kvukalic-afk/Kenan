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

Bez argumenta se koristi privremeni espeak-ng glas (samo za nacrt).
