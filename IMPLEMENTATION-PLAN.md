# TheoShift implementation plan

**Last updated:** 2026-05-06

This file is the lightweight substitute for a multi-page roadmap in-repo; detailed history remains in `TASK-STATE.md` snapshots, `DECISIONS.md`, and GitHub releases.

---

## Active work

_None — v4.21.0 shipped; monitor production._

---

## Recently completed (2026-05-06)

- Shared uploads architecture: **`THEOSHIFT_UPLOADS_ROOT`**, NFS on TrueNAS/Proxmox, dual-path read (`getUploadsRoot` + legacy `public/uploads`), peer fallback (`D-TS-042`).
- **Bug fixes:** Document 404 from inlined env; false volunteer “failed to save” after partial DB updates (transaction); PWA synthetic 503 on staff routes (SW v2.0.3).
- **Release:** v4.21.0, qa-01 gate, traffic switch (GREEN LIVE), sync BLUE STANDBY.

---

## Backlog / next

| Item | Priority | Notes |
|------|----------|--------|
| Smoke-test production after SW + uploads changes | High | Documents + volunteers flows |
| Jest `positionService.test.ts` fetch mock | Low | Local only |
| Chat modal Escape / a11y | Low | UX polish |
| Admin feedback triage | Medium | `/admin/feedback` |

---

## Known bugs / tech debt (rolling)

- **Terminology:** “Attendant” strings remain in UI/DB `@map` in places (`TECH-DEBT.md` / TD-001).
- **Tests:** 1 skipped in release gate (intentional); full suite `npm run test:e2e:full` when needed.

---

## User feedback

_Incorporate items from `/admin/feedback` when triaged._

---

## Effort estimates

_Not tracked numerically here — use issues or Linear if formal sizing is needed._
