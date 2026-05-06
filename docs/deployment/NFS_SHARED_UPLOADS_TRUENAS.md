# Shared NFS uploads for TheoShift (TrueNAS + Proxmox LXC)

**Audience:** Homelab admins  
**Related:** App uses `THEOSHIFT_UPLOADS_ROOT` (see `src/lib/uploadsPaths.ts`) and **D-TS-042** in `DECISIONS.md`.

## Why

Blue/green TheoShift containers each had **local disk** under `public/uploads`. After HAProxy switches LIVE, the other node often **did not contain uploaded files**. A **single NFS-backed directory** mounted into **both** CTs is the durable fix; peer HTTP fallback is a bridge only.

## Architecture

1. **TrueNAS** exports one NFS share (dataset with plenty of space).
2. Each **Proxmox host** that runs a TheoShift CT **mounts that NFS** on the hypervisor (not inside the CT first).
3. Each CT gets a **bind mount** (`mpN`) from the host path into a fixed path inside the CT (e.g. `/mnt/theoshift-uploads`).
4. TheoShift `.env.*` on **both** nodes sets:

   ```bash
   THEOSHIFT_UPLOADS_ROOT=/mnt/theoshift-uploads
   ```

   Use the **same path inside both CTs** so operational docs and restores stay simple.

## TrueNAS (SCALE or CORE)

1. Create a dataset for TheoShift uploads (example: `tank/apps/theoshift/uploads`).
2. **Sharing → NFS** — add share for that dataset path.
3. **Authorized networks:** restrict to your app VLAN (e.g. `10.92.3.0/24`), not the public Internet.
4. **Permissions / advanced:**
   - For a **trusted lab VLAN**, many teams use **`no_root_squash`** (or equivalent) so root inside the CT can write like today’s single-node behavior. **This is sensitive:** keep the share firewalled to admin VLAN + Proxmox nodes only.
   - Alternative: use **`all_squash`** with fixed **`anonuid`/`anongid`** and `chown` the mount content to match the UID/GID of the user running Node/PM2 inside the CT (more work, tighter NFS semantics).

Record: **TrueNAS IP**, **export path** (e.g. `/mnt/tank/apps/theoshift/uploads`).

## Proxmox host (repeat on each node that hosts a TheoShift CT)

Run on the **hypervisor shell** (root):

```bash
mkdir -p /mnt/truenas/theoshift-uploads
```

`/etc/fstab` (example — adjust server and export path):

```fstab
10.92.x.x:/mnt/tank/apps/theoshift/uploads /mnt/truenas/theoshift-uploads nfs defaults,_netdev,nofail 0 0
```

```bash
mount -a
mount | grep theoshift-uploads
```

Fix **DNS/hostname vs IP** to whatever is stable on your LAN.

## Bind mount into **unprivileged** LXC

Unprivileged CTs should **not** mount NFS directly inside the guest; mount on the **host**, then **bind** into the CT.

Example for CT **134** (blue-theoshift) and **132** (green-theoshift) — **verify CT IDs** with `pct list` on your cluster:

```bash
pct set 134 -mp0 /mnt/truenas/theoshift-uploads,mp=/mnt/theoshift-uploads
pct set 132 -mp0 /mnt/truenas/theoshift-uploads,mp=/mnt/theoshift-uploads
```

If `mp0` is already used, use `mp1`, etc., and keep the **same inner path** on both CTs.

Restart CTs after changing mounts:

```bash
pct shutdown 134 && pct start 134
```

Inside each CT:

```bash
ls -la /mnt/theoshift-uploads
# optional: mkdir documents feedback if you rely on subdirs only — app creates documents/ on upload
```

Ownership: ensure the user running **`pm2`** / Node can write here (`chown` inside CT as needed).

## Application env (both CTs)

In `/opt/theoshift/.env.green` / `.env.blue` (or your actual split):

```bash
THEOSHIFT_UPLOADS_ROOT=/mnt/theoshift-uploads
```

Rebuild/restart is **not** required for env-only changes if PM2 reload picks up env — your usual **deploy** flow applies.

Optional peer list (until NFS is proven):

```bash
THEOSHIFT_UPLOAD_PEER_URLS=http://10.92.3.24:3001,http://10.92.3.22:3001
```

## One-time migration of existing files

Before cutting over:

```bash
# On the node that currently HAS the files (example — adjust paths)
rsync -av /opt/theoshift/public/uploads/ /mnt/truenas/theoshift-uploads/
```

Then enable NFS mount + `THEOSHIFT_UPLOADS_ROOT` so both CTs read the same tree.

## Verification

1. Upload a document on LIVE; confirm file appears under the NFS dataset from TrueNAS.
2. Hit the **other** node’s URL (STANDBY) — same document should open without relying on peer fetch.
3. `GET /api/version` or health check on both nodes.

## Security notes

- Treat NFS like **datacenter backend**: **no exposure** outside the VLAN that already reaches Proxmox/TrueNAS.
- Prefer **numeric IPs or internal DNS** in `fstab` to avoid boot races if DNS is down.
- Snapshot/backup the TrueNAS dataset with your normal policy.
