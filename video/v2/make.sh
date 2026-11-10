#!/usr/bin/env bash
# Peptid Centar V2 pipeline: glas (Goran) -> render -> muzika/SFX -> miks -> izvoz
# Usage: ./make.sh            (generates voice with edge-tts)
#        ./make.sh skip-tts   (reuses build/voice_raw.wav + build/timing.json)
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p build out
NAME=PC_B01_KOZA_GHKCU_TT_H1_V2
export SSL_CERT_FILE=${SSL_CERT_FILE:-/root/.ccr/ca-bundle.crt}
[ "${1:-}" = "skip-tts" ] || python3 tts.py +14%
# voice chain: HPF 80 Hz, gentle compression, de-ess, then exact -14 LUFS (2 passes)
ffmpeg -y -hide_banner -loglevel error -i build/voice_raw.wav -af "highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,deesser,loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -ac 2 build/voice.wav
python3 render.py
python3 sound.py
DUR=$(python3 -c "import json;print(json.load(open('build/render_meta.json'))['total'])")
mix() { # $1 = with music (1/0), $2 = output
  if [ "$1" = 1 ]; then
    FC="[1:a]apad[v];[v]asplit[v1][v2];[2:a]volume=-17dB[m];[m][v1]sidechaincompress=threshold=0.04:ratio=5:attack=20:release=350[md];[3:a]volume=-9dB[s];[v2][md][s]amix=inputs=3:duration=first:normalize=0[a]"
  else
    FC="[1:a]apad[v];[3:a]volume=-9dB[s];[v][s]amix=inputs=2:duration=first:normalize=0[a]"
  fi
  ffmpeg -y -hide_banner -loglevel error -i build/video_only.mp4 -i build/voice.wav -i build/music.wav -i build/sfx.wav \
    -filter_complex "$FC" -map 0:v -map "[a]" -t "$DUR" -c:v copy -c:a pcm_s16le build/mix.wav.mkv
  ffmpeg -y -hide_banner -nostats -i build/mix.wav.mkv -af ebur128 -f null - 2>build/lufs.txt || true
  I=$(grep -A3 Summary build/lufs.txt | grep -oP "I:\s+\K-?[0-9.]+")
  G=$(python3 -c "print(round(-14-($I),2))")
  ffmpeg -y -hide_banner -loglevel error -i build/mix.wav.mkv -af "volume=${G}dB,alimiter=limit=0.89:level=false" \
    -c:v libx264 -profile:v high -preset slow -crf 18 -pix_fmt yuv420p -r 30 \
    -c:a aac -b:a 192k -ar 48000 -ac 2 -map_metadata -1 -movflags +faststart "$2"
}
mix 1 "out/${NAME}.mp4"
mix 0 "out/${NAME}_bez_muzike.mp4"
cp build/titlovi.srt "out/${NAME}.srt"
ffmpeg -y -hide_banner -loglevel error -i "out/${NAME}.mp4" -vf "fps=2,scale=216:384,tile=10x10" -frames:v 1 "out/${NAME}_mreza_slicica.png"
echo "OK: out/${NAME}.mp4"
