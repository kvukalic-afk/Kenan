#!/usr/bin/env bash
# B02 pipeline. Usage:
#   ./make.sh goran            -> edge-tts glas Goran (rezervno) + verzija bez glasa
#   ./make.sh el voice.mp3     -> ElevenLabs glas (tajming iz pauza) + verzija bez glasa
set -euo pipefail
cd "$(dirname "$0")"; mkdir -p build out
MODE=${1:-goran}; NAME=PC_B07_BPC157_TETIVA_UGC_TT_H1
export SSL_CERT_FILE=${SSL_CERT_FILE:-/root/.ccr/ca-bundle.crt}
if [ "$MODE" = el ]; then
  ffmpeg -y -hide_banner -loglevel error -i "$2" -ar 48000 -ac 1 build/el_in.wav
  python3 el_align.py build/el_in.wav; TAG=V1
else
  python3 tts.py ${RATE:-+15%}; TAG=V1_glas_goran
fi
ffmpeg -y -hide_banner -loglevel error -i build/voice_raw.wav -af "highpass=f=80,acompressor=threshold=-20dB:ratio=2.5:attack=5:release=80,loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -ac 2 build/voice.wav
python3 render.py
python3 sound.py
DUR=$(python3 -c "import json;print(json.load(open('build/render_meta.json'))['total'])")
final() {
  ffmpeg -y -hide_banner -loglevel error -i build/video_only.mp4 -i build/voice.wav -i build/music.wav -i build/sfx.wav \
    -filter_complex "$1" -map 0:v -map "[a]" -t "$DUR" -c:v copy -c:a pcm_s16le build/mix.mkv
  ffmpeg -y -hide_banner -nostats -i build/mix.mkv -af ebur128 -f null - 2>build/lufs.txt || true
  I=$(grep -A3 Summary build/lufs.txt | grep -oP "I:\s+\K-?[0-9.]+"); G=$(python3 -c "print(round(-14-($I),2))")
  ffmpeg -y -hide_banner -loglevel error -i build/mix.mkv -af "volume=${G}dB,alimiter=limit=0.82:level=false" \
    -c:v libx264 -profile:v high -preset slow -crf 19 -pix_fmt yuv420p -r 30 -c:a aac -b:a 160k -ar 48000 -ac 2 -map_metadata -1 -movflags +faststart "$2"
}
MI=$(ffmpeg -hide_banner -nostats -i build/music.wav -af ebur128 -f null - 2>&1 | grep -A3 Summary | grep -oP "I:\s+\K-?[0-9.]+")
MG=$(python3 -c "print(round(-23.5-($MI),2))")   # music bed ~9 dB under the voice, gentle ducking
final "[1:a]apad[v];[v]asplit[v1][v2];[2:a]volume=${MG}dB[m];[m][v1]sidechaincompress=threshold=0.1:ratio=2:attack=15:release=250[md];[3:a]volume=-7dB[s];[v2][md][s]amix=inputs=3:duration=first:normalize=0[a]" "out/${NAME}_${TAG}.mp4"
final "[2:a]volume=-4dB[m];[3:a]volume=-8dB[s];[m][s]amix=inputs=2:duration=first:normalize=0[a]" "out/${NAME}_${TAG}_bez_glasa.mp4"
cp build/titlovi.srt "out/${NAME}_${TAG}.srt"
ffmpeg -y -hide_banner -loglevel error -i "out/${NAME}_${TAG}.mp4" -vf "fps=2,scale=216:384,tile=10x10" -frames:v 1 "out/${NAME}_${TAG}_mreza.png"
ls -la out
