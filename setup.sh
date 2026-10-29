#!/usr/bin/env bash
# Prepares a fresh machine to run the BrainSnck engine. Safe to run again: it skips what is already there.
# Stored in the repo: engine code, GSAP, fonts, icon index.  Downloaded here: Python packages, the voice model.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
ENG="$ROOT/engine"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "[1/3] python packages"
python3 -c "import piper, playwright, numpy, scipy" 2>/dev/null \
  || pip install -q --break-system-packages piper-tts playwright numpy scipy

echo "[2/3] headless chromium"
if ! python3 - <<'EOF' 2>/dev/null
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    p.chromium.launch().close()
EOF
then
  if ls /opt/pw-browsers/chromium-*/chrome-linux64/chrome >/dev/null 2>&1; then
    echo "  using the preinstalled chromium under /opt/pw-browsers"
  else
    python3 -m playwright install chromium
  fi
fi

echo "[3/3] voice model (en-us ryan, high)"
mkdir -p "$ENG/voices"
if [ ! -s "$ENG/voices/en-us-ryan-high.onnx" ]; then
  mkdir "$TMP/voice"
  curl -sSfL -o "$TMP/voice/v.tar.gz" \
    https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-en-us-ryan-high.tar.gz
  tar -xzf "$TMP/voice/v.tar.gz" -C "$TMP/voice"
  cp "$TMP/voice/en-us-ryan-high.onnx" "$TMP/voice/en-us-ryan-high.onnx.json" "$ENG/voices/"
fi

for f in gsap.min.js emoji_index.txt fonts/anton.woff2 fonts/mont700.woff2 fonts/mont800.woff2 fonts/mont900.woff2 \
         voices/en-us-ryan-high.onnx voices/en-us-ryan-high.onnx.json; do
  [ -s "$ENG/$f" ] || { echo "missing: engine/$f"; exit 1; }
done
echo "setup ok"
