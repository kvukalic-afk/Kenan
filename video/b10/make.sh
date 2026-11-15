#!/usr/bin/env bash
# B10 (Faza II). Usage: ./make.sh voice.mp3   (ElevenLabs take; tajming iz pauza)
set -euo pipefail
cd "$(dirname "$0")"; mkdir -p build out; NAME=PC_B10_MOLEKULA_IZ_ZAGREBA_F2
ffmpeg -y -hide_banner -loglevel error -i "$1" -af "atempo=${TEMPO:-1.04}" -ar 48000 -ac 1 build/el_in.wav
python3 el_align.py build/el_in.wav
ffmpeg -y -hide_banner -loglevel error -i build/voice_raw.wav -af "highpass=f=80,acompressor=threshold=-20dB:ratio=2.5:attack=5:release=80,loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -ac 2 build/voice.wav
python3 render.py
DUR=$(python3 -c "import json;print(json.load(open('build/render_meta.json'))['total'])")
ffmpeg -y -hide_banner -loglevel error -i build/video_only.mp4 -i build/voice.wav -i build/music.wav \
  -filter_complex "[1:a]apad[v];[v]asplit[v1][v2];[2:a]volume=-9dB[m];[m][v1]sidechaincompress=threshold=0.08:ratio=2.5:attack=20:release=400[md];[v2][md]amix=inputs=2:duration=first:normalize=0[a]" \
  -map 0:v -map "[a]" -t "$DUR" -c:v copy -c:a pcm_s16le build/mix.mkv
I=$(ffmpeg -hide_banner -nostats -i build/mix.mkv -af ebur128 -f null - 2>&1 | grep -A3 Summary | grep -oP "I:\s+\K-?[0-9.]+"); G=$(python3 -c "print(round(-14-($I),2))")
ffmpeg -y -hide_banner -loglevel error -i build/mix.mkv -af "volume=${G}dB,alimiter=limit=0.84:level=false" -c:v libx264 -profile:v high -preset slow -crf 19 -pix_fmt yuv420p -r 30 -c:a aac -b:a 160k -ar 48000 -ac 2 -map_metadata -1 -movflags +faststart "out/${NAME}.mp4"
cp build/titlovi.srt "out/${NAME}.srt"; ls -la out
