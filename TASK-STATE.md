# TheoShift Task State

**Last updated:** 2026-07-26  
**Branch:** `main`  
**Production:** **LIVE** **GREEN** `10.92.3.22` · **STANDBY** **BLUE** `10.92.3.24` — both **v4.29.1**.

---

## Current Task

**Mobile readiness (Positions / Volunteers)** — NEXT

### What I'm doing right now

v4.29.1 shipped (bulk create number collision fix). Resume mobile audit when next coding.

### Recent completions

- ✅ **v4.29.1** — Fix bulk create colliding with existing position numbers
- ✅ **v4.29.0** — Shift capacity, in-place edit, AM–PM sort
- ✅ **v4.28.0** — App-wide phone formatting

### Next steps

1. Continue **mobile audit**: Positions + Volunteers.
2. Triage **`/admin/feedback`** when online.

## Exact next command

Open Positions/Volunteers on a narrow viewport and continue the mobile audit.

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
