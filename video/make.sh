#!/usr/bin/env bash
# Usage: ./make.sh [voice_file] [music_file]
# No voice_file -> temporary espeak-ng Bosnian guide voice (draft only).
set -euo pipefail
cd "$(dirname "$0")"
OUT=out; mkdir -p "$OUT" build
NAME=PC_B01_KOZA_GHKCU_TT_H1_V1
if [ $# -ge 1 ] && [ -f "$1" ]; then
  ffmpeg -y -hide_banner -loglevel error -i "$1" -ac 1 -ar 48000 build/voice_raw.wav
else
  i=0; : > build/list.txt
  while IFS= read -r line; do
    i=$((i+1)); espeak-ng -v bs -s 150 -p 40 -w build/s$i.wav "$line"
    ffmpeg -y -hide_banner -loglevel error -i build/s$i.wav -ar 48000 -ac 1 build/s${i}_48.wav
    echo "file 's${i}_48.wav'" >> build/list.txt
    echo "file 'gap.wav'" >> build/list.txt
  done < tts_text.txt
  ffmpeg -y -hide_banner -loglevel error -f lavfi -i anullsrc=r=48000:cl=mono -t 0.45 build/gap.wav
  ffmpeg -y -hide_banner -loglevel error -f concat -safe 0 -i build/list.txt build/voice_raw.wav
  NAME=${NAME}_DRAFT_privremeni_glas
fi
# voice chain: high-pass 80 Hz, gentle compression, de-ess, loudness -14 LUFS / -1 dBTP
ffmpeg -y -hide_banner -loglevel error -i build/voice_raw.wav -af "highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,deesser,loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -ac 2 build/voice.wav
# second pass: measure and apply exact gain to -14 LUFS, true peak <= -1 dBTP
I=$(ffmpeg -hide_banner -nostats -i build/voice.wav -af ebur128 -f null - 2>&1 | grep -A3 Summary | grep -oP "I:\s+\K-?[0-9.]+")
G=$(python3 -c "print(round(-14-($I),2))")
ffmpeg -y -hide_banner -loglevel error -i build/voice.wav -af "volume=${G}dB,alimiter=limit=0.89:level=false" build/voice_g.wav && mv build/voice_g.wav build/voice.wav
python3 timing.py build/voice_raw.wav 10 build/timing.json
python3 render.py build/timing.json build/voice.wav build
DUR=$(python3 -c "import json;print(json.load(open('build/render_meta.json'))['total'])")
# no-music master
ffmpeg -y -hide_banner -loglevel error -i build/video_only.mp4 -i build/voice.wav -map 0:v -map 1:a \
  -af "apad" -t "$DUR" -c:v libx264 -profile:v high -preset slow -crf 19 -pix_fmt yuv420p -r 30 \
  -c:a aac -b:a 192k -ar 48000 -ac 2 -map_metadata -1 -movflags +faststart "$OUT/${NAME}_bez_muzike.mp4"
if [ $# -ge 2 ] && [ -f "$2" ]; then
  ffmpeg -y -hide_banner -loglevel error -i build/video_only.mp4 -i build/voice.wav -stream_loop -1 -i "$2" \
    -filter_complex "[2:a]volume=-18dB,afade=t=out:st=$(python3 -c "print($DUR-1.5)"):d=1.5[m];[m][1:a]sidechaincompress=threshold=0.05:ratio=6[md];[1:a]apad[v];[v][md]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5[a]" \
    -map 0:v -map "[a]" -t "$DUR" -c:v libx264 -profile:v high -preset slow -crf 19 -pix_fmt yuv420p -r 30 \
    -c:a aac -b:a 192k -ar 48000 -map_metadata -1 -movflags +faststart "$OUT/${NAME}.mp4"
fi
cp build/titlovi.srt "$OUT/${NAME}.srt"
# contact sheet every 0.5 s
ffmpeg -y -hide_banner -loglevel error -i "$OUT/${NAME}_bez_muzike.mp4" -vf "fps=2,scale=216:384,tile=10x10" -frames:v 1 "$OUT/${NAME}_mreza_slicica.png"
echo "OK: $OUT/${NAME}_bez_muzike.mp4"
