#!/usr/bin/env bash
# Prepares a fresh machine to run the BrainSnck engine. Safe to run again: it skips what is already there.
# Stored in the repo: engine code, GSAP, fonts, icon index.  Downloaded here: Python packages, the voice model.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
ENG="$ROOT/engine"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "[1/3] python packages"
python3 -c "import kokoro_onnx, piper, playwright, numpy, scipy, soundfile" 2>/dev/null \
  || pip install -q --break-system-packages kokoro-onnx piper-tts playwright numpy scipy soundfile

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

echo "[3/3] voice model (Kokoro: female and male narrators, Apache 2.0)"
mkdir -p "$ENG/voices"
for f in kokoro-v1.0.onnx voices-v1.0.bin; do
  if [ ! -s "$ENG/voices/$f" ]; then
    curl -sSfL -o "$TMP/$f" "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/$f"
    mv "$TMP/$f" "$ENG/voices/$f"
  fi
done

for f in gsap.min.js emoji_index.txt fonts/anton.woff2 fonts/mont700.woff2 fonts/mont800.woff2 fonts/mont900.woff2 \
         voices/kokoro-v1.0.onnx voices/voices-v1.0.bin; do
  [ -s "$ENG/$f" ] || { echo "missing: engine/$f"; exit 1; }
done
echo "setup ok"
