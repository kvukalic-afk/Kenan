#!/usr/bin/env bash
# Peptid Centar V3 (UGC): stock kadrovi + titlovi + muzika; verzija bez glasa i s glasom.
# Usage: ./make.sh [glas.mp3]   (default: assets/glas_ivan_elevenlabs.mp3; tajming se uzima iz glasa)
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p build out
NAME=PC_B01_KOZA_GHKCU_TT_H1_V4
VOICE=${1:-assets/glas_ivan_elevenlabs.mp3}
cp "$VOICE" build/voice_el.mp3
python3 render.py
python3 sound.py
DUR=$(python3 -c "import json;print(json.load(open('build/render_meta.json'))['total'])")
ffmpeg -y -hide_banner -loglevel error -i build/voice_el.mp3 -af "highpass=f=80,acompressor=threshold=-20dB:ratio=2.5:attack=5:release=80,loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -ac 2 build/voice.wav
final() { # $1 filter, $2 out
  ffmpeg -y -hide_banner -loglevel error -i build/video_only.mp4 -i build/voice.wav -i build/music.wav -i build/sfx.wav \
    -filter_complex "$1" -map 0:v -map "[a]" -t "$DUR" -c:v copy -c:a pcm_s16le build/mix.mkv
  ffmpeg -y -hide_banner -nostats -i build/mix.mkv -af ebur128 -f null - 2>build/lufs.txt || true
  I=$(grep -A3 Summary build/lufs.txt | grep -oP "I:\s+\K-?[0-9.]+")
  G=$(python3 -c "print(round(-14-($I),2))")
  ffmpeg -y -hide_banner -loglevel error -i build/mix.mkv -af "volume=${G}dB,alimiter=limit=0.82:level=false" \
    -c:v libx264 -profile:v high -preset slow -crf 18 -pix_fmt yuv420p -r 30 \
    -c:a aac -b:a 192k -ar 48000 -ac 2 -map_metadata -1 -movflags +faststart "$2"
}
# bez glasa: muzika naprijed (bez stišavanja) + efekti
final "[2:a]volume=-4dB[m];[3:a]volume=-8dB[s];[m][s]amix=inputs=2:duration=first:normalize=0[a]" "out/${NAME}_bez_glasa.mp4"
# s glasom: muzika -17 dB ispod glasa + ducking + efekti
final "[1:a]apad[v];[v]asplit[v1][v2];[2:a]volume=-17dB[m];[m][v1]sidechaincompress=threshold=0.04:ratio=5:attack=20:release=350[md];[3:a]volume=-9dB[s];[v2][md][s]amix=inputs=3:duration=first:normalize=0[a]" "out/${NAME}.mp4"
cp build/titlovi.srt "out/${NAME}.srt"
ffmpeg -y -hide_banner -loglevel error -i "out/${NAME}.mp4" -vf "fps=2,scale=216:384,tile=10x9" -frames:v 1 "out/${NAME}_mreza_slicica.png"
echo "OK"
