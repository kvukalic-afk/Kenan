#!/usr/bin/env bash
# Pexels kadrovi za B05 (Pexels licenca: besplatno, i za komercijalnu upotrebu).
cd "$(dirname "$0")"
while read -r id url; do [ -f "$id.mp4" ] || curl -s -m 120 -o "$id.mp4" "$url"; done <<'L'
gym2 https://videos.pexels.com/video-files/6455077/6455077-hd_1080_1920_24fps.mp4
crowd2 https://videos.pexels.com/video-files/36673526/15546945_360_640_50fps.mp4
serum https://videos.pexels.com/video-files/8131891/8131891-hd_720_1366_25fps.mp4
skin https://videos.pexels.com/video-files/10222557/10222557-hd_1080_2048_25fps.mp4
meas1 https://videos.pexels.com/video-files/5726648/5726648-hd_1080_2048_25fps.mp4
scale1 https://videos.pexels.com/video-files/6547792/6547792-hd_1080_1920_24fps.mp4
gym1 https://videos.pexels.com/video-files/12890962/12890962-hd_1080_1920_60fps.mp4
mirror https://videos.pexels.com/video-files/7326824/7326824-hd_1080_1920_24fps.mp4
couple https://videos.pexels.com/video-files/6524289/6524289-hd_1080_1920_24fps.mp4
run1 https://videos.pexels.com/video-files/7876926/7876926-hd_720_1366_25fps.mp4
phone1 https://videos.pexels.com/video-files/10374885/10374885-hd_720_1280_24fps.mp4
highfive https://videos.pexels.com/video-files/6265087/6265087-hd_1080_1920_30fps.mp4
gym3 https://videos.pexels.com/video-files/6547797/6547797-hd_720_1280_24fps.mp4
L
