# TheoShift Task State

**Last updated:** 2026-07-31  
**Branch:** `main`  
**Production:** **LIVE** **BLUE** `10.92.3.24` · **STANDBY** **GREEN** `10.92.3.22` — both **v4.30.1**.

---

## Current Task

**Mobile readiness (Positions / Volunteers)** — NEXT

### What I'm doing right now

Shipped IVS volunteer intake (**v4.30.0** / **v4.30.1**). Resume Positions + Volunteers mobile audit next.

### Recent completions

- ✅ **v4.30.1** — Request Volunteer for whole IVS event roster (same rule as Early Check-In)
- ✅ **v4.30.0** — IVS dashboard intake (Pending requests + email/phone on Approvals/export)
- ✅ **v4.29.14** — Early check-in list reachable when scrolling on tablet/mobile
- ✅ **v4.29.13** — Document publish targets Volunteers roster only (not IVS-only)
- ✅ **v4.29.12** — My Profile + secure self-service account deletion (FB-038)

### Next steps

1. Continue **mobile audit**: Positions + Volunteers (narrow viewport).
2. Triage new feedback (`/admin/feedback` or `scripts/ssh-query-feedback.sh new`).

## Exact next command

Open Positions on a narrow viewport and continue the mobile audit; note any horizontal-scroll or &lt;44px tap issues.

---

## Known issues

**Current**

- **Chat push banner** — Expected when Web Push is unavailable (e.g. iPhone Safari not installed to Home Screen). Chat still works via polling; copy always mentions iPhone even on unsupported desktop browsers.
- **PIN column** — Still in DB; magic links are primary UI. Planned cleanup per backlog (legacy note).
- **Positions Send Notifications** — Still lacks confirm/throttle/abort (other bulk emails fixed in v4.29.4).

**Recently addressed (don’t regress)**

- ~~Request Volunteer tab hidden for real IVS team~~ — **v4.30.1** (roster gate, not import-batch-only).
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

- `4750f4c6` — chore: mark production on v4.30.1 after ship
- `48d0e85f` — Release v4.30.1 — Request Volunteer for whole IVS event roster
- `1d8ed414` — Release v4.30.0 — IVS volunteer intake from dashboard
- `753e58fa` — feat: IVS volunteer intake from dashboard

---

## Feedback triage (this session)

- **Resolved:** 0 · **Promoted:** 0 · **Triaged:** 0 new (admin `new` query empty)

---

## Historical note

Long-form day-by-day completions lived in this file through 2026-05-05 and were **rotated out on 2026-05-06**. Older milestones: **`git log --oneline`**, GitHub **Releases**.
