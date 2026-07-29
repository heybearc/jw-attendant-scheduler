# TheoShift Task State

**Last updated:** 2026-07-29  
**Branch:** `main`  
**Production:** **LIVE** **GREEN** `10.92.3.22` · **STANDBY** **BLUE** `10.92.3.24` — both **v4.29.11**.

---

## Current Task

**FB-038 My Profile + account self-delete** — IN PROGRESS

### What I'm doing right now

Implementing **My Profile** (edit details, password) and permanent self-delete that clears assignments; adding Profile nav on Event Selection and in-event header.

### Recent completions

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

1. Finish Profile + self-delete on STANDBY, then ship.
2. Continue **mobile audit**: Positions + Volunteers (narrow viewport).

## Exact next command

Test `/profile` on STANDBY after deploy; then `/ship /sync`.

### Recent completions

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
2. Triage **`/admin/feedback`** when online.

## Exact next command

Open Positions on a narrow viewport and continue the mobile audit; note any horizontal-scroll or &lt;44px tap issues.
- ✅ **v4.29.7** — Mobile Early Check-In hardening + staff Check-In route; 5/5 browser matrix on STANDBY
- ✅ **v4.29.6** — Roster members can use Early Check-In (no position assignment required)
- ✅ **v4.29.5** — Mobile Check-In nav `eventId` + access alignment
- ✅ **v4.29.4** — Safe bulk email: roster-only, confirm count, throttle, abort
- ✅ **v4.29.3** — Promote IVS-only people onto Volunteers roster

### Next steps

1. Continue **mobile audit**: Positions + Volunteers (narrow viewport).
2. Triage **`/admin/feedback`** when online.

## Exact next command

Open Positions on a narrow viewport and continue the mobile audit; note any horizontal-scroll or &lt;44px tap issues.

---

## Known issues

**Current**

- **Chat push banner** — Expected when Web Push is unavailable (e.g. iPhone Safari not installed to Home Screen). Chat still works via polling; copy always mentions iPhone even on unsupported desktop browsers.
- **PIN column** — Still in DB; magic links are primary UI. Planned cleanup per backlog (legacy note).
- **Positions Send Notifications** — Still lacks confirm/throttle/abort (other bulk emails fixed in v4.29.4).

**Recently addressed (don’t regress)**

- ~~Mobile Early Check-In greyed / Access Denied for roster~~ — **v4.29.5–v4.29.7**.
- ~~Browser alert/confirm popups~~ — **v4.22.0** uses in-app toasts and dialogs app-wide.
- ~~Phantom count assignments~~ — **D-TS-043**; suggested rows are draft for volunteer surfaces.

**Infrastructure**

- **`/release` does not deploy** — Only HAProxy. Build on STANDBY before `/release`.
- **PM2 names:** BLUE → `theoshift-blue`, GREEN → `theoshift-green`.

---

## Session snapshot — recent `main` commits

- `2d2b6e51` — Release v4.29.7 — Mobile Early Check-In hardening  
- `0a4b8522` — fix: allow staff Early Check-In route and harden mobile browsers  
- `90f7d7f6` — Release v4.29.6 — Roster Early Check-In  
- `cb793795` — Release v4.29.5 — Mobile Early Check-In fix  
- `305ff928` — Release v4.29.4 — Safe bulk email  

---

## Feedback triage (this session)

- **Resolved:** 0 · **Promoted:** 0 · **Triaged:** 0 new (`scripts/ssh-query-feedback.sh new` → 0 rows).

---

## Historical note

Long-form day-by-day completions lived in this file through 2026-05-05 and were **rotated out on 2026-05-06**. Older milestones: **`git log --oneline`**, GitHub **Releases**.
