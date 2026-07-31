# TheoShift Task State

**Last updated:** 2026-07-31  
**Branch:** `main`  
**Production:** **LIVE** **BLUE** `10.92.3.24` · **STANDBY** **GREEN** `10.92.3.22` — both **v4.29.14**.

---

## Current Task

**Mobile readiness (Positions / Volunteers)** — NEXT

### What I'm doing right now

Shipped **v4.29.14** (early check-in scroll on tablet/mobile). Resume Positions + Volunteers mobile audit next.

### Recent completions

- ✅ **v4.29.14** — Early check-in list reachable when scrolling on tablet/mobile
- ✅ **v4.29.13** — Document publish targets Volunteers roster only (not IVS-only)
- ✅ **v4.29.12** — My Profile + secure self-service account deletion (FB-038)
- ✅ **v4.29.11** — Cross-oversight fallback for auto-assign + full roster manual assign
- ✅ **v4.29.10** — Auto-assign beyond 2 shifts so Sunday (etc.) can fill
- ✅ **v4.29.9** — Multi-day shift `shiftDate` + day-aware conflicts; help FAQ
- ✅ **v4.29.8** — Shift-level overseer/keyman assign; bulk set/update volunteers needed
- ✅ **v4.29.7** — Mobile Early Check-In hardening + staff Check-In route; 5/5 browser matrix on STANDBY
- ✅ **v4.29.6** — Roster members can use Early Check-In (no position assignment required)
- ✅ **v4.29.5** — Mobile Check-In nav `eventId` + access alignment
- ✅ **v4.29.4** — Safe bulk email: roster-only, confirm count, throttle, abort
- ✅ **v4.29.3** — Promote IVS-only people onto Volunteers roster

### Next steps

1. Continue **mobile audit**: Positions + Volunteers (narrow viewport).
2. Triage new feedback.

## Exact next command

Open Positions on a narrow viewport and continue the mobile audit; note any horizontal-scroll or &lt;44px tap issues.

---

## Known issues

**Current**

- **Chat push banner** — Expected when Web Push is unavailable (e.g. iPhone Safari not installed to Home Screen). Chat still works via polling; copy always mentions iPhone even on unsupported desktop browsers.
- **PIN column** — Still in DB; magic links are primary UI. Planned cleanup per backlog (legacy note).
- **Positions Send Notifications** — Still lacks confirm/throttle/abort (other bulk emails fixed in v4.29.4).

**Recently addressed (don’t regress)**

- ~~Early check-in clipped / not scrollable on tablet~~ — **v4.29.14**.
- ~~Document publish included IVS-only~~ — **v4.29.13** roster-only publish modal + API.
- ~~Mobile Early Check-In greyed / Access Denied for roster~~ — **v4.29.5–v4.29.7**.
- ~~Browser alert/confirm popups~~ — **v4.22.0** uses in-app toasts and dialogs app-wide.
- ~~Phantom count assignments~~ — **D-TS-043**; suggested rows are draft for volunteer surfaces.

**Infrastructure**

- **`/release` does not deploy** — Only HAProxy. Build on STANDBY before `/release`.
- **PM2 names:** BLUE → `theoshift-blue`, GREEN → `theoshift-green`.

---

## Session snapshot — recent `main` commits

- `b9746682` — Release v4.29.14 — Early check-in scroll on tablet/mobile
- `b953430f` — fix: early check-in list reachable on tablet and mobile
- `724f3021` — Release v4.29.13 — Document publish roster-only

---

## Feedback triage (this session)

- **Resolved:** 0 · **Promoted:** 0 · **Triaged:** 0 new

---

## Historical note

Long-form day-by-day completions lived in this file through 2026-05-05 and were **rotated out on 2026-05-06**. Older milestones: **`git log --oneline`**, GitHub **Releases**.
