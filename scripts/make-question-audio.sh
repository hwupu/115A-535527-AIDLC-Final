#!/usr/bin/env bash
# Makes the read-aloud audio for the fixed patient questions (#86) from apps/web/src/intake/questions.json.
# Only fixed, human-written question text is read aloud; never AI output.
# Needs macOS (`say` with a zh_TW voice) and ffmpeg. Re-run after changing any question text;
# the web test fails when manifest.json no longer matches the questions.
# Usage: scripts/make-question-audio.sh [voice]   (default: "Meijia (Premium)", falls back to Meijia)
set -euo pipefail
cd "$(dirname "$0")/.."
src=apps/web/src/intake/questions.json
out=apps/web/public/audio/questions
voice=${1:-"Meijia (Premium)"}
say -v '?' | grep -q "^${voice} " || voice=Meijia
command -v ffmpeg >/dev/null || { echo "ffmpeg is required" >&2; exit 1; }
mkdir -p "$out"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# id<TAB>text to speak, one line per question and follow-up.
node -e '
  const q = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).questions;
  for (const x of q) {
    console.log(`${x.id}\t${x.speak ?? x.text}\t${x.text}`);
    if (x.followUp) console.log(`${x.followUp.id}\t${x.followUp.speak ?? x.followUp.text}\t${x.followUp.text}`);
  }' "$src" >"$tmp/list.tsv"

rm -f "$out"/*.mp3
while IFS=$'\t' read -r id speak _; do
  say -v "$voice" -r 170 -o "$tmp/$id.aiff" "$speak"
  ffmpeg -loglevel error -y -i "$tmp/$id.aiff" -ac 1 -ar 24000 -b:a 48k "$out/$id.mp3"
  echo "$id  $speak"
done <"$tmp/list.tsv"

# manifest.json: the screen text each file was made from, so a stale file is caught by the tests.
node -e '
  const fs = require("fs");
  const rows = fs.readFileSync(process.argv[1], "utf8").trim().split("\n").map((l) => l.split("\t"));
  const files = Object.fromEntries(rows.map(([id, , text]) => [id, text]));
  fs.writeFileSync(process.argv[2], JSON.stringify({ voice: process.argv[3], files }, null, 2) + "\n");
' "$tmp/list.tsv" "$out/manifest.json" "$voice"
echo "Wrote $(ls "$out"/*.mp3 | wc -l | tr -d " ") files to $out (voice: $voice)"
