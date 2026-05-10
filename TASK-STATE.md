# TheoShift Task State

**Last updated:** 2026-05-10  
**Branch:** `main`  
**Production:** **Verify** with homelab `get_deployment_status` (app: theoshift) — after last release **LIVE** was **BLUE** `10.92.3.24` · **STANDBY** **GREEN** `10.92.3.22` (HAProxy flips on `/release`).

---

## Current Task

**Mobile readiness (Positions / Volunteers) + spot-check volunteer count simulation** — IN PROGRESS 🚧

### What I'm doing right now

Primary roadmap: continue **mobile audit** for `/events/[id]/positions` and `/events/[id]/volunteers` (card layouts under `md`, 44px targets). Secondary: after prod picks up **`4935b31f`** and related commits, **smoke-test** volunteer dashboard **view-as** simulation (Afternoon Count / station tasks should match confirmed assignees + group rules only).

### Recent completions (2026-05-09 / 2026-05-10)

- ✅ **Volunteer count assignments — dashboard truth** — Station-level tasks use **confirmed** assignees only (`isSuggested: false`); **Apply suggestions** rows are **draft** until overseer saves real assignees (`bef4f7dd`).
- ✅ **Grouped vs station exclusion** — Stations in another volunteer’s **count group** don’t show duplicate station-level submit; exclusions rebuilt from **`count_session_group_positions`** (`4935b31f`, earlier `d9fd40b3`).
- ✅ **View-as simulation** — Enter Count respects simulation like assignees API; **KEYMAN** + **case-normalized** staff roles use simulated volunteer id (`canSimulateVolunteerRole`, `8e937f66`, `4935b31f`); EventLayout hides staff FAB during simulation; mobile dashboard links preserve `viewAsVolunteerId`.
- ✅ **Volunteer dashboard submit** — Removed fallback that posted counts against **`assignments[0]`** (wrong station risk).
- ✅ **Release / sync** — Multiple **`/release`** + **`/sync`** cycles with migrations when requested; both nodes rebuilt from `main`.

### Next steps

1. Smoke **volunteer dashboard** + **Enter Count** as a simulated volunteer on **production** after confirming HAProxy points at the node that built **`main`** with **`4935b31f`** (use `/api/version` if needed).
2. Continue **mobile audit**: Positions + Volunteers pages — cards under `md`, filters/actions usable on phones (matches PLAN backlog).
3. Run **`/test-release theoshift standby`** after large UI changes (qa-01 smoke + release-gate).
4. Review **`/admin/feedback`** for anything urgent.

## Exact next command

`/start-day` — then optionally verify prod: open volunteer dashboard with `viewAsVolunteerId`, confirm Network tab shows `/api/volunteer/dashboard?volunteerId=<volunteer uuid>`.

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

- `4935b31f` — Volunteer dashboard: reliable group exclusions + `canSimulateVolunteerRole`
- `bef4f7dd` — Suggested count assignees treated as draft for volunteer UI
- `8e937f66` — Enter Count view-as + simulation roles + FAB / mobile links
- `d9fd40b3` — Hide station submit when positions belong to another volunteer group
- `dd8986fd` — Dashboard count tasks from explicit session assignees only

---

## Historical note

Long-form day-by-day completions lived in this file through 2026-05-05 and were **rotated out on 2026-05-06**. Older milestones: **`git log --oneline`**, GitHub **Releases**.
