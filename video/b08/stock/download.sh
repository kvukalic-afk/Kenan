#!/usr/bin/env bash
# Pexels kadrovi za B08 „buka hrane“ (Pexels licenca).
cd "$(dirname "$0")"
while read -r id url; do [ -f "$id.mp4" ] || curl -s -m 120 -o "$id.mp4" "$url"; done <<'X'
fridge https://videos.pexels.com/video-files/5418706/5418706-hd_720_1280_25fps.mp4
evening1 https://videos.pexels.com/video-files/4058810/4058810-hd_720_1366_50fps.mp4
evening2 https://videos.pexels.com/video-files/4058824/4058824-hd_720_1366_50fps.mp4
tea https://videos.pexels.com/video-files/5976241/5976241-hd_720_1366_30fps.mp4
coffee https://videos.pexels.com/video-files/7576290/7576290-hd_1080_1920_30fps.mp4
cozy https://videos.pexels.com/video-files/6638430/6638430-hd_720_1366_25fps.mp4
donut https://videos.pexels.com/video-files/6525361/6525361-hd_720_1280_30fps.mp4
cookie https://videos.pexels.com/video-files/5469356/5469356-hd_720_1280_30fps.mp4
cake https://videos.pexels.com/video-files/6654089/6654089-hd_720_1280_25fps.mp4
X
