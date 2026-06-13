#!/usr/bin/env bash
# NOAH pre-stage smoke test — deterministic, no LLM/network needed.
# Run right before the demo. All checks must pass.
set -u
cd "$(dirname "$0")/.." || exit 1

PASS=0; FAIL=0
CLI="node dist/cli.js"

echo "🌿 NOAH smoke test"
echo "──────────────────"

# Ensure build is fresh
npm run build >/dev/null 2>&1 || { echo "✗ build failed"; exit 1; }
echo "✓ build OK"

check() { # desc | command | expected-substring
  local desc="$1" cmd="$2" want="$3"
  local out; out="$($cmd 2>&1)"
  if echo "$out" | grep -q "$want"; then
    echo "✓ $desc"; PASS=$((PASS+1))
  else
    echo "✗ $desc (expected: '$want')"; echo "  got: $out" | head -2; FAIL=$((FAIL+1))
  fi
}

check "deny: rm -rf /"        "$CLI --check rm -rf / --no-preserve-root" "BLOCKED"
check "deny: fork bomb"       "$CLI --check :(){ :|:& };:"               "BLOCKED"
check "deny: mkfs"            "$CLI --check mkfs.ext4 /dev/sda"          "BLOCKED"
check "confirm: apt install"  "$CLI --check sudo apt install nginx"      "CONFIRM"
check "confirm: rm file"      "$CLI --check rm notes.txt"               "CONFIRM"
check "allow: ls"             "$CLI --check ls -la"                     "ALLOW"
check "allow: cat"            "$CLI --check cat README.md"              "ALLOW"
check "help renders"          "$CLI --help"                            "Native Operating"

echo "──────────────────"
echo "$PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] && echo "✅ READY FOR DEMO" || { echo "❌ FIX BEFORE STAGE"; exit 1; }
