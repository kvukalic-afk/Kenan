#!/usr/bin/env bash
# Preuzima Pexels kadrove koje koristi V3 (Pexels licenca: besplatno, i za komercijalnu upotrebu).
cd "$(dirname "$0")"
while read -r id url; do [ -f "$id.mp4" ] || curl -s -o "$id.mp4" "$url"; done <<'L'
a10222557 https://videos.pexels.com/video-files/10222557/10222557-hd_1080_2048_25fps.mp4
b7299411 https://videos.pexels.com/video-files/7299411/7299411-hd_720_1280_30fps.mp4
c8381578 https://videos.pexels.com/video-files/8381578/8381578-hd_1080_1920_25fps.mp4
d8131891 https://videos.pexels.com/video-files/8131891/8131891-hd_720_1366_25fps.mp4
e8789007 https://videos.pexels.com/video-files/8789007/8789007-hd_720_1280_25fps.mp4
e8496473 https://videos.pexels.com/video-files/8496473/8496473-hd_1080_1920_25fps.mp4
e8055995 https://videos.pexels.com/video-files/8055995/8055995-hd_1080_1920_30fps.mp4
g6871961 https://videos.pexels.com/video-files/6871961/6871961-hd_1080_1920_24fps.mp4
L
