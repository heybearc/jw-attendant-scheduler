# TheoShift Task State

**Last updated:** 2026-07-26  
**Branch:** `main`  
**Production:** **LIVE** **GREEN** `10.92.3.22` · **STANDBY** **BLUE** `10.92.3.24` — both **v4.28.0**.

---

## Current Task

**Positions Option C (shift capacity)** — DONE ✅ (pending STANDBY verify)

### What I'm doing right now

Option C shipped locally: `volunteersNeeded` on shifts, fill progress, shift-OVERSEER pool preference, capacity-aware auto-assign. Full Positions redesign remains backlog.

### Recent completions

- ✅ **Option C** — Shift capacity + auto-assign (2026-07-26)
- ✅ **v4.28.0** — App-wide phone `(XXX) XXX-XXXX`; DB normalize
- ✅ **v4.27.0** — IVS contacts remove, phone format, approval date fix

### Next steps

1. Verify Option C on STANDBY (create shift with needed=4, assign, auto-assign).
2. Continue **mobile audit**: Positions + Volunteers.
3. Triage **`/admin/feedback`** when online.

## Exact next command

Smoke-test STANDBY Positions: set shift Need=4, assign multiple volunteers, confirm fill badge.

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

- `7a4bb4bf` — Release v4.28.0 — App-wide phone number formatting  
- `4239b626` — feat: apply phone formatting app-wide and normalize existing numbers  
- `4da8e5ea` — Release v4.27.0 — IVS contacts remove, phone format, approval date fix  

---

## Feedback triage (this session)

- **Resolved:** 0 · **Promoted:** 0 · **Triaged:** 0 new URGENT (`scripts/ssh-query-feedback.sh new` → 0 rows).

---

## Historical note

Long-form day-by-day completions lived in this file through 2026-05-05 and were **rotated out on 2026-05-06**. Older milestones: **`git log --oneline`**, GitHub **Releases**.
