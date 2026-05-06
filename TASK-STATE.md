# TheoShift Task State

**Last updated:** 2026-05-06  
**Branch:** `main`  
**Production:** LIVE = **GREEN** `10.92.3.22` (CT 132) · STANDBY = **BLUE** `10.92.3.24` (CT 134) · App **v4.21.0**

---

## Current Task

**Post–v4.21.0 stabilization** — MONITORING ✅

### What I'm doing right now

Same-day pipeline finished: shared uploads / runtime env fixes, volunteer save transaction, PWA service worker bypass for staff APIs, full `/test-release` → `/bump` (`v4.21.0`) → `/release` → `/sync`. Pick up next session with smoke checks or backlog items below.

### Recent completions (2026-05-06)

- ✅ **v4.21.0** — Documents on NFS + legacy `public/uploads`, runtime `THEOSHIFT_*` reads (no webpack inlining), “File missing” in UI when blob absent, **transactional** `PUT` for event volunteers, **PWA `sw.js` v2.0.3** (no synthetic 503 on `/api/events/*` or `/_next/*`)
- ✅ **Infra** — TrueNAS dataset `media-pool/theoshift-uploads`, Proxmox NFS + `pct` bind mounts, `.env` `THEOSHIFT_UPLOADS_ROOT` on both CTs; SSH config comments aligned with HAProxy blue/green
- ✅ **`/test-release`** on qa-01 — 4 passed, 1 skipped; logged in `TEST-FAILURES-LOG.md`
- ✅ **Release pipeline** — GitHub release `v4.21.0`; deploy STANDBY → **traffic switch** (new LIVE = GREEN) → **sync** STANDBY (BLUE now has same build)
- ✅ **DECISIONS** — D-TS-042 documents uploads + peer fallback (already in `DECISIONS.md`)

### Next steps

1. Smoke **theoshift.com**: event **Documents** (view + upload), **Volunteers** save + bulk paths, no console 503 noise after SW update (hard refresh once).
2. Optional: fix local Jest mock in `__tests__/lib/positionService.test.ts` (`fetch().json()` contract).
3. Review **`/admin/feedback`**; promote anything urgent into planning docs.
4. Optional UX: Escape-to-close for chat modals; keyboard focus.

## Exact next command

`/start-day`

---

## Known issues

**Current**

- **PIN column** — Still in DB; magic links are primary UI. Planned cleanup per `BACKLOG.md` (legacy note May 19, 2026).

**Recently addressed (don’t regress)**

- ~~PWA “disabled everywhere”~~ — **Superseded:** `public/sw.js` **v2.0.3** re-enables safe caching for volunteer offline routes while **bypassing** staff `/api/events/*` and `/_next/*` so bogus **503** offline responses don’t break Volunteers/Documents loads. Full navigations still bypass SW (magic links).

**Infrastructure**

- **`/release` does not deploy** — Only HAProxy. LIVE must already have been built on former STANDBY via **`deploy_to_standby`** after `/bump` (see MC workflows, D-TS-040).
- **PM2 names:** BLUE → `theoshift-blue`, GREEN → `theoshift-green` (see Known Issues — Infrastructure Notes in prior revisions or HAProxy config).

---

## Session snapshot — recent `main` commits

- `f6088d79` — Release v4.21.0 (package.json, README, release notes, test log)
- `0534f8b6` — Volunteer `PUT` transactional + safer client parse
- `2bd081b7` — PWA SW bypass staff/`_next`
- `44d70ae5` — Documents dual-path + upload disk check + UI
- `2d9ce267` — Runtime `THEOSHIFT_UPLOADS_ROOT` read for Next bundle

---

## Historical note

Long-form day-by-day completions lived in this file through 2026-05-05 and were **rotated out on 2026-05-06** to reduce duplication and drift. Older milestones: **`git log --oneline`**, GitHub **Releases**, and dated commits.
