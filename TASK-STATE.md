# TheoShift Task State

**Last updated:** 2026-06-08  
**Branch:** `main`  
**Production:** **LIVE** **BLUE** `10.92.3.24` · **STANDBY** **GREEN** `10.92.3.22` (HAProxy verified 2026-06-08; both nodes on **v4.22.0**).

---

## Current Task

**Mobile readiness (Positions / Volunteers)** — IN PROGRESS 🚧

### What I'm doing right now

Resume the **mobile audit** for `/events/[id]/positions` and `/events/[id]/volunteers` (card layouts under `md`, 44px targets, filters usable on phones). **v4.22.0** (toasts + inline dialogs) is **LIVE** — spot-check confirmations on mobile while auditing.

### Recent completions

- ✅ **v4.22.0 shipped** — Replaced browser `alert`/`confirm`/`prompt` with Chapter Hub-style **toasts** + **inline confirm/prompt** (`AppUiProvider`, ~45 files); **`/ship`** + **`/sync`**; qa-01 **4 passed / 1 skipped**; GitHub release [v4.22.0](https://github.com/heybearc/theoshift/releases/tag/v4.22.0) (`fe17b1d6`, `9c04d150`, `04287a63`).
- ✅ **Release-gate** — Chat pin test updated for inline confirm dialog (`04287a63`).
- ✅ **v4.21.9 — IVS** — Overseer/keyman IVS management + bulk actions (prior release).

### Next steps

1. Continue **mobile audit**: Positions + Volunteers — cards under `md`, no horizontal-scroll-only workflows, 44px actions.
2. Quick **prod smoke** on phone: delete/cancel flows use new dialogs (not browser popups).
3. Triage **`/admin/feedback`** when online (0 new as of end-day).
4. Run **`/test-release theoshift standby`** after large mobile UI changes.

## Exact next command

`/start-day` — then open Positions or Volunteers on a narrow viewport and continue the mobile audit.

---

## Known issues

**Current**

- **PIN column** — Still in DB; magic links are primary UI. Planned cleanup per backlog (legacy note).

**Recently addressed (don’t regress)**

- ~~Browser alert/confirm popups~~ — **v4.22.0** uses in-app toasts and dialogs app-wide.
- ~~Phantom count assignments~~ — **D-TS-043**; suggested rows are draft for volunteer surfaces.

**Infrastructure**

- **`/release` does not deploy** — Only HAProxy. Build on STANDBY before `/release`.
- **PM2 names:** BLUE → `theoshift-blue`, GREEN → `theoshift-green`.

---

## Session snapshot — recent `main` commits

- `fe17b1d6` — Release v4.22.0 — toasts and confirmation dialogs  
- `04287a63` — test: release-gate chat pin inline confirm  
- `9c04d150` — feat: replace alert/confirm with toasts and dialogs  

---

## Feedback triage (this session)

- **Resolved:** 0 · **Promoted:** 0 · **Triaged:** 0 new (`scripts/ssh-query-feedback.sh new`).

---

## Historical note

Long-form day-by-day completions lived in this file through 2026-05-05 and were **rotated out on 2026-05-06**. Older milestones: **`git log --oneline`**, GitHub **Releases**.
