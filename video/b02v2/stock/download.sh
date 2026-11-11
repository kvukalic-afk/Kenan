#!/usr/bin/env bash
# Pexels kadrovi za B02 V2 (Pexels licenca: besplatno, i za komercijalnu upotrebu).
cd "$(dirname "$0")"
while read -r id url; do [ -f "$id.mp4" ] || curl -s -o "$id.mp4" "$url"; done <<'L'
scale1 https://videos.pexels.com/video-files/6547792/6547792-hd_1080_1920_24fps.mp4
scale2 https://videos.pexels.com/video-files/7802051/7802051-hd_698_1366_25fps.mp4
meas1 https://videos.pexels.com/video-files/5726648/5726648-hd_1080_2048_25fps.mp4
exer1 https://videos.pexels.com/video-files/8457027/8457027-hd_1080_1920_25fps.mp4
exer2 https://videos.pexels.com/video-files/6547794/6547794-hd_1080_1920_24fps.mp4
syr2 https://videos.pexels.com/video-files/8490706/8490706-hd_720_1280_25fps.mp4
lab1 https://videos.pexels.com/video-files/8327151/8327151-hd_1080_1920_30fps.mp4
lab2 https://videos.pexels.com/video-files/8326121/8326121-hd_1080_1920_30fps.mp4
crowd2 https://videos.pexels.com/video-files/36673526/15546945_360_640_50fps.mp4
knee2 https://videos.pexels.com/video-files/7299333/7299333-hd_720_1280_30fps.mp4
sleep1 https://videos.pexels.com/video-files/7924487/7924487-hd_720_1280_24fps.mp4
phone1 https://videos.pexels.com/video-files/10374885/10374885-hd_720_1280_24fps.mp4
run1 https://videos.pexels.com/video-files/7876926/7876926-hd_720_1366_25fps.mp4
L
