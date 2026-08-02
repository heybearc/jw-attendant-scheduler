# TheoShift Task State

**Last updated:** 2026-08-02  
**Branch:** `main`  
**Production:** **LIVE** **GREEN** `10.92.3.22` · **STANDBY** **BLUE** `10.92.3.24` — both **v4.31.0**.

---

## Current Task

**Idle after ship** — next: triage feedback or continue Positions redesign backlog when prioritized.

### What I'm doing right now

Shipped **v4.31.0** (availability filter, assign-time edits, safer Positions notifications, mobile polish, chat push copy).

### Recent completions

- ✅ **v4.31.0** — Volunteers availability filter; edit shift times in assign flow; Positions Send Notifications throttle/abort; chat push copy; mobile polish
- ✅ **v4.30.1** — Request Volunteer for whole IVS event roster
- ✅ **v4.30.0** — IVS dashboard intake (Pending requests + email/phone on Approvals/export)

### Next steps

1. Triage new feedback (`/admin/feedback` or `scripts/ssh-query-feedback.sh new`).
2. Positions redesign / native chat remain backlog (deferred).

## Exact next command

`scripts/ssh-query-feedback.sh new` — or pick next backlog item from PLAN.md.

---

## Known issues

**Current**

- **PIN column** — Still in DB; magic links are primary UI. Planned cleanup per backlog (legacy note).

**Recently addressed (don’t regress)**

- ~~Positions Send Notifications lacking confirm/throttle/abort~~ — **v4.31.0**.
- ~~Chat push banner always mentions iPhone~~ — **v4.31.0**.
- ~~Volunteers no availability filter~~ — **v4.31.0**.
- ~~Request Volunteer tab hidden for real IVS team~~ — **v4.30.1**.

**Infrastructure**

- **`/release` does not deploy** — Only HAProxy. Build on STANDBY before `/release`.
- **PM2 names:** BLUE → `theoshift-blue`, GREEN → `theoshift-green`.

---

## Session snapshot — recent `main` commits

- `9704574d` — Release v4.31.0
- `e9ad8c13` — feat: mobile polish and in-place shift time edits on assign
- `e426d000` — feat: filter Volunteers roster by availability status
- `bacfdf93` — fix: platform-aware chat push unsupported banner copy
- `a2face1f` — fix: throttle and abort Positions assignment notification sends

---

## Feedback triage (this session)

- **Resolved:** 0 · **Promoted:** 0 · **Triaged:** 0

---

## Historical note

Long-form day-by-day completions lived in this file through 2026-05-05 and were **rotated out on 2026-05-06**. Older milestones: **`git log --oneline`**, GitHub **Releases**.
