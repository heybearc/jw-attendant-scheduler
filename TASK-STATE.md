# TheoShift Task State

**Last updated:** 2026-05-08  
**Branch:** `main`  
**Production:** LIVE = **GREEN** `10.92.3.22` (CT 132) · STANDBY = **BLUE** `10.92.3.24` (CT 134) · App **v4.21.2**

---

## Current Task

**Mobile readiness audit + optimization** — IN PROGRESS 🚧

### What I'm doing right now

Focused on making the app reliably mobile-friendly across Safari/Chrome/Edge/Firefox, starting with the event shell and IVS module. Released v4.21.2, then improved the event shell + overview pages and deployed those changes to STANDBY for verification.

### Recent completions (2026-05-08)

- ✅ **IVS Module mobile UX** — Approvals uses cards on small screens; Early Check-In uses full-width actions + stacked rows; keeps the full table on larger screens (`v4.21.2`)
- ✅ **Event shell mobile-first** — safer viewport (`viewport-fit=cover`), iOS momentum scrolling helper, tighter header/breadcrumbs, stacked toolbar + 44px tab targets, event overview wrapping fixes
- ✅ **Release pipeline** — qa-01 `/test-release` (4 passed, 1 skipped) → bump to `v4.21.2` → GitHub release → deploy STANDBY → traffic switch → sync (both nodes built from the same `main`)

### Next steps

1. Mobile audit next: `/events/[id]/positions` and `/events/[id]/volunteers` (tables/filters/bulk actions) — convert the worst offenders to card layouts under `md`, ensure 44px controls, and avoid horizontal scroll where possible.
2. Run `/test-release theoshift standby` after any large UI changes (qa-01 smoke + release-gate).
3. Smoke test on **Safari iOS** + **Chrome Android** (event overview, tabs scroll, IVS module, positions/volunteers core actions).
4. Review **`/admin/feedback`**; promote anything urgent into planning docs.

## Exact next command

`/start-day`

---

## Known issues

**Current**

- **PIN column** — Still in DB; magic links are primary UI. Planned cleanup per `BACKLOG.md` (legacy note May 19, 2026).

**Recently addressed (don’t regress)**

- ~~PWA “disabled everywhere”~~ — **Superseded:** `public/sw.js` **v2.0.3** re-enables safe caching for volunteer offline routes while **bypassing** staff `/api/events/*` and `/_next/*` so bogus **503** offline responses don’t break Volunteers/Documents loads. Full navigations still bypass SW (magic links).

**Infrastructure**

- **`/release` does not deploy** — Only HAProxy. LIVE must already have been built on former STANDBY via **`deploy_to_standby`** after `/bump` (see MC workflows, D-TS-040).
- **PM2 names:** BLUE → `theoshift-blue`, GREEN → `theoshift-green` (see Known Issues — Infrastructure Notes in prior revisions or HAProxy config).

---

## Session snapshot — recent `main` commits

- `c82541fb` — Mobile-first event shell, overview, and events list (STANDBY deploy for verification)
- `070a756e` — Release v4.21.2 (mobile IVS layouts + notes/help + submodule update)
- `116a3641` — IVS: mobile-friendly approvals and early check-in layouts
- `3d471fce` — Release v4.21.1 (positions filters)
- `f6088d79` — Release v4.21.0 (Documents, volunteer saves, PWA reliability)

---

## Historical note

Long-form day-by-day completions lived in this file through 2026-05-05 and were **rotated out on 2026-05-06** to reduce duplication and drift. Older milestones: **`git log --oneline`**, GitHub **Releases**, and dated commits.
