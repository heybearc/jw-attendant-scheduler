# TheoShift Task State

**Last updated:** 2026-05-14  
**Branch:** `main`  
**Production:** **Verify** with homelab `get_deployment_status` (app: theoshift) — HAProxy is runtime truth (see D-008 / D-TS-040). After last doc snapshot: **LIVE** **BLUE** `10.92.3.24` · **STANDBY** **GREEN** `10.92.3.22` (HAProxy flips on `/release`).

---

## Current Task

**Mobile readiness (Positions / Volunteers) + production smoke (counts / IVS)** — IN PROGRESS 🚧

### What I'm doing right now

Continue the **mobile audit** for `/events/[id]/positions` and `/events/[id]/volunteers` (card layouts under `md`, 44px targets, filters usable on phones). When convenient on **production**, smoke **volunteer dashboard** + **Enter Count** with `viewAsVolunteerId` (Network: `/api/volunteer/dashboard?volunteerId=<uuid>`) and spot-check **IVS** after **v4.21.9** (overseer/keyman IVS access, bulk actions).

### Recent completions

- ✅ **v4.21.9 — IVS** — Overseers and keymen can manage IVS volunteers (import/export/add); Approvals bulk status including congregation/department; manual add single volunteer (`509dbe92`, `31c709e1`, `872996b1`, `c7e8b224`).
- ✅ **Volunteer count assignments + view-as** — Confirmed assignees only for volunteer surfaces; group exclusions; simulation roles aligned (`4935b31f`, `bef4f7dd`, `8e937f66`, `d9fd40b3`); decision **D-TS-043** in `DECISIONS.md`.
- ✅ **Notify chat UX** — Cancel on launch prompt must not send emails (`44d9efdb`).

### Next steps

1. Continue **mobile audit**: Positions + Volunteers — cards under `md`, no horizontal-scroll-only workflows, 44px actions.
2. **Production smoke** (when on domain/LIVE): volunteer dashboard + Enter Count with simulation; IVS bulk / access paths for overseer or keyman.
3. Run **`/test-release theoshift standby`** after large UI changes (qa-01 smoke + release-gate).
4. Triage **`/admin/feedback`** for anything urgent (not run this end-day).

## Exact next command

`/start-day` — then open Positions or Volunteers on a narrow viewport and continue the mobile audit; optionally prod-smoke volunteer simulation + IVS per above.

---

## Known issues

**Current**

- **PIN column** — Still in DB; magic links are primary UI. Planned cleanup per backlog (legacy note).

**Recently addressed (don’t regress)**

- ~~Phantom count assignments~~ — **Suggested** assignee rows no longer surface as real duties on volunteer dashboard / Enter Count lists for volunteers; POST permission aligns.

**Infrastructure**

- **`/release` does not deploy** — Only HAProxy. LIVE must already have been built via **`deploy_to_standby`** after changes land on `main`.
- **PM2 names:** BLUE → `theoshift-blue`, GREEN → `theoshift-green`.

---

## Session snapshot — recent `main` commits

- `c7e8b224` — Release v4.21.9 — IVS access and bulk actions  
- `31c709e1` — IVS bulk actions: full status set, congregation and department  
- `509dbe92` — Allow overseers and keymen to manage IVS volunteers (import/export/add)  
- `872996b1` — IVS Approvals: add single volunteer (manual entry)  
- `4935b31f` — Volunteer dashboard: group exclusions + `canSimulateVolunteerRole`  

---

## Feedback triage (this session)

- **Resolved / promoted / triaged:** not executed this end-day (no DB/SSH triage from here). Use `/admin/feedback` when online.

---

## Historical note

Long-form day-by-day completions lived in this file through 2026-05-05 and were **rotated out on 2026-05-06**. Older milestones: **`git log --oneline`**, GitHub **Releases**.
