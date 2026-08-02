# TheoShift Task State

**Last updated:** 2026-08-02  
**Branch:** `main`  
**Production:** **LIVE** **GREEN** `10.92.3.22` · **STANDBY** **BLUE** `10.92.3.24` — both **v4.31.0**.

---

## Current Task

**Positions redesign (parallel surface)** — NEXT

### What I'm doing right now

Building `/events/[id]/positions-next` day-board preview (multi-day grouping, capacity, per-shift overseer, quick assign). Classic Positions remains default.

### Recent completions

- ✅ **v4.31.0** — Availability filter; assign-time edits; safer Positions notifications; chat push copy; mobile polish
- ✅ **v4.30.1** — Request Volunteer for whole IVS event roster

### Next steps

1. Smoke `positions-next` on STANDBY.
2. Iterate redesign: remove assignee, edit shift times, undated-shift prompts, publish gate.

## Exact next command

Open `/events/<id>/positions-next` on STANDBY (or classic Positions → **Try new layout**).

---

## Known issues

**Current**

- **PIN column** — Still in DB; magic links are primary UI.
- **Positions redesign** — Preview only; not published as default.

**Infrastructure**

- **`/release` does not deploy** — Only HAProxy. Build on STANDBY before `/release`.
- **PM2 names:** BLUE → `theoshift-blue`, GREEN → `theoshift-green`.

---

## Session snapshot — recent `main` commits

- `7b4d7d32` — chore: mark production on v4.31.0 after ship
- `9704574d` — Release v4.31.0

---

## Feedback triage (this session)

- **Resolved:** 0 · **Promoted:** 0 · **Triaged:** 0
