#!/usr/bin/env bash
# Provision NOAH on a fresh Ubuntu VM (Azure B1s, 22.04).
# Run ON the VM after `ssh azureuser@<ip>`:
#   curl -fsSL <raw-url>/scripts/deploy-vm.sh | bash
# or copy this file over and: bash deploy-vm.sh
set -euo pipefail

echo "🌿 NOAH — Ubuntu VM provisioning"

# 1) Node 22 (NodeSource)
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -dv -f2 | cut -d. -f1)" -lt 22 ]; then
  echo "→ installing Node 22…"
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
echo "✓ node $(node -v)"

# 2) Clone + build NOAH
if [ ! -d "$HOME/NOAH" ]; then
  echo "→ cloning NOAH…"
  git clone https://github.com/srimanh/NOAH.git "$HOME/NOAH"
fi
cd "$HOME/NOAH"
git pull --ff-only || true
npm install
npm run build
sudo npm link   # makes `noah` global

echo
echo "✓ NOAH installed. Verify gate (no auth needed):"
echo "    noah --check 'rm -rf /'"
echo
echo "Next — authenticate the LLM (pick one):"
echo "  A) copy local auth:  scp ~/.pi/agent/auth.json azureuser@<ip>:~/.pi/agent/auth.json"
echo "  B) login on VM:      npx @earendil-works/pi   then /login → Claude Pro/Max"
echo
echo "Then run:  noah --yes 'what distro is this? read-only'"
