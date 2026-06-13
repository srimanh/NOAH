# ☁️ NOAH on a Free Azure Ubuntu VM

Run NOAH on a real cloud Linux server — strong demo angle ("NOAH manages a cloud box").

## 1. Free account
- `azure.microsoft.com/free` → Start free (needs a card; not charged in free limits).
- Includes **B1s Linux VM free 750 hrs/mo for 12 months** + $200/30-day credit.

## 2. Create VM (portal)
Virtual machines → Create → Azure virtual machine:

| Field | Value |
|---|---|
| Resource group | `noah-rg` (new) |
| Name | `noah-vm` |
| Image | Ubuntu Server 22.04 LTS |
| Size | **Standard_B1s** (free eligible) |
| Auth | SSH public key |
| Username | `azureuser` |
| Public key | your `~/.ssh/id_ed25519.pub` |
| Inbound | allow SSH (22) |

## 3. Harden + connect
- Portal → VM → Networking → SSH rule → Source = **My IP**.
- `ssh azureuser@<PUBLIC_IP>`

## 4. Install NOAH
```bash
curl -fsSL https://raw.githubusercontent.com/srimanh/NOAH/main/scripts/deploy-vm.sh | bash
# verify (no auth needed):
noah --check "rm -rf /"
```

## 5. Authenticate the LLM (pick one)
- **A — copy local auth (fast):** from your laptop
  ```bash
  ssh azureuser@<ip> 'mkdir -p ~/.pi/agent'
  scp ~/.pi/agent/auth.json azureuser@<ip>:~/.pi/agent/auth.json
  ```
  ⚠️ `auth.json` is a **live credential**. Only on a VM you control; delete the VM after.
- **B — login on VM:** `npx @earendil-works/pi` → `/login` → Claude Pro/Max.

## 6. Demo on the cloud box
```bash
noah --yes "what distro and kernel is this? read-only"
noah --dry-run "set up an nginx web server"     # plan, no changes
noah "install htop"                              # confirm gate
noah --check ":(){ :|:& };:"                     # ⛔ blocked
noah --log
```

## Cost control
- **Stop (deallocate)** the VM when idle: portal → VM → Stop. Stopped = not billing compute.
- Free B1s covers 750 hrs/mo (~1 VM always-on). Delete `noah-rg` when done.

## Security checklist
- [ ] SSH key auth only (no password).
- [ ] Port 22 restricted to My IP.
- [ ] `auth.json` removed / VM deleted after the hackathon.
- [ ] Never commit `auth.json`.
