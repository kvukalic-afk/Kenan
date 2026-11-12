#!/usr/bin/env bash
# Pexels kadrovi za B04 HCG (Pexels licenca: besplatno, i za komercijalnu upotrebu).
cd "$(dirname "$0")"
while read -r id url; do [ -f "$id.mp4" ] || curl -s -m 120 -o "$id.mp4" "$url"; done <<'L'
preg https://videos.pexels.com/video-files/6967705/6967705-hd_720_1280_25fps.mp4
gym1 https://videos.pexels.com/video-files/12890962/12890962-hd_1080_1920_60fps.mp4
gym2 https://videos.pexels.com/video-files/6455077/6455077-hd_1080_1920_24fps.mp4
gym3 https://videos.pexels.com/video-files/6547797/6547797-hd_720_1280_24fps.mp4
mirror https://videos.pexels.com/video-files/7326824/7326824-hd_1080_1920_24fps.mp4
factory https://videos.pexels.com/video-files/37548964/15910586_360_640_30fps.mp4
factory2 https://videos.pexels.com/video-files/30409127/13032210_360_640_25fps.mp4
worried https://videos.pexels.com/video-files/12436974/12436974-hd_720_1280_26fps.mp4
worried2 https://videos.pexels.com/video-files/8458597/8458597-hd_720_1366_25fps.mp4
father https://videos.pexels.com/video-files/8426207/8426207-hd_720_1280_24fps.mp4
father2 https://videos.pexels.com/video-files/6622839/6622839-hd_720_1280_24fps.mp4
couple https://videos.pexels.com/video-files/6524289/6524289-hd_1080_1920_24fps.mp4
couple2 https://videos.pexels.com/video-files/7423678/7423678-hd_1080_1920_30fps.mp4
sprint https://videos.pexels.com/video-files/31229040/13338956_360_640_30fps.mp4
sprint2 https://videos.pexels.com/video-files/36662878/15543084_360_640_30fps.mp4
highfive https://videos.pexels.com/video-files/6265087/6265087-hd_1080_1920_30fps.mp4
syr2 https://videos.pexels.com/video-files/8490706/8490706-hd_720_1280_25fps.mp4
L
