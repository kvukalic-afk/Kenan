#!/usr/bin/env bash
# Pexels kadrovi za B07 BPC-157 (Pexels licenca: besplatno, i za komercijalnu upotrebu).
cd "$(dirname "$0")"
while read -r id url; do [ -f "$id.mp4" ] || curl -s -m 120 -o "$id.mp4" "$url"; done <<'X'
frisbee https://videos.pexels.com/video-files/7102427/7102427-hd_1080_1920_30fps.mp4
sword https://videos.pexels.com/video-files/7102469/7102469-hd_1080_1920_30fps.mp4
legrub https://videos.pexels.com/video-files/7299360/7299360-hd_720_1280_30fps.mp4
ankle https://videos.pexels.com/video-files/7986040/7986040-hd_1080_1920_30fps.mp4
bandage https://videos.pexels.com/video-files/7986039/7986039-hd_720_1280_60fps.mp4
tank https://videos.pexels.com/video-files/9561763/9561763-hd_1080_1920_24fps.mp4
tape https://videos.pexels.com/video-files/6095385/6095385-hd_720_1280_30fps.mp4
electro https://videos.pexels.com/video-files/30352918/13010415_360_640_50fps.mp4
dadpark https://videos.pexels.com/video-files/29053196/12558642_360_640_50fps.mp4
daddau https://videos.pexels.com/video-files/29053186/12558712_360_640_50fps.mp4
X
