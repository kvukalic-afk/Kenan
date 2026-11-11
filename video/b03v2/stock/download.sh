#!/usr/bin/env bash
# Pexels kadrovi za B03 V2 (Pexels licenca: besplatno, i za komercijalnu upotrebu).
cd "$(dirname "$0")"
while read -r id url; do [ -f "$id.mp4" ] || curl -s -m 120 -o "$id.mp4" "$url"; done <<'L'
iv1 https://videos.pexels.com/video-files/6688055/6688055-hd_1080_1920_25fps.mp4
iv2 https://videos.pexels.com/video-files/6248839/6248839-hd_720_1280_30fps.mp4
tired https://videos.pexels.com/video-files/7033439/7033439-hd_1080_1920_24fps.mp4
dna https://videos.pexels.com/video-files/34862899/14774641_360_640_30fps.mp4
old1 https://videos.pexels.com/video-files/5524254/5524254-hd_720_1280_24fps.mp4
old2 https://videos.pexels.com/video-files/8558902/8558902-hd_1080_2048_25fps.mp4
pills https://videos.pexels.com/video-files/7863056/7863056-hd_1080_1920_30fps.mp4
blood https://videos.pexels.com/video-files/8381266/8381266-hd_1080_1920_25fps.mp4
seniors https://videos.pexels.com/video-files/8795415/8795415-hd_1080_2048_24fps.mp4
seniors2 https://videos.pexels.com/video-files/8795422/8795422-hd_1080_2048_24fps.mp4
run2 https://videos.pexels.com/video-files/8402094/8402094-hd_1080_1920_30fps.mp4
phone1 https://videos.pexels.com/video-files/10374885/10374885-hd_720_1280_24fps.mp4
L
