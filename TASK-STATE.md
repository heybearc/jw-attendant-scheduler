# TheoShift Task State

**Last updated:** 2026-07-26  
**Branch:** `main`  
**Production:** **LIVE** **GREEN** `10.92.3.22` · **STANDBY** **BLUE** `10.92.3.24` — both **v4.28.0**.

---

## Current Task

**Mobile readiness (Positions / Volunteers)** — IN PROGRESS 🚧

### What I'm doing right now

Resume the **mobile audit** for `/events/[id]/positions` and `/events/[id]/volunteers` when next coding. IVS / phone work through **v4.28.0** is shipped.

### Recent completions

- ✅ **v4.28.0** — App-wide phone `(XXX) XXX-XXXX`; DB normalize (168 volunteers, etc.)
- ✅ **v4.27.0** — Remove IVS department from contacts; approval date clear when not Approved; phone format on contacts
- ✅ **v4.26.x** — IVS import template (STATUS/EARLY ENTRY); volunteer early check-in day counts; Volunteers checkbox feedback

### Next steps

1. Continue **mobile audit**: Positions + Volunteers — cards under `md`, 44px actions.
2. Triage **`/admin/feedback`** when online.
3. Run **`/test-release theoshift standby`** after large mobile UI changes.

## Exact next command

Open Positions or Volunteers on a narrow viewport and continue the mobile audit.

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
