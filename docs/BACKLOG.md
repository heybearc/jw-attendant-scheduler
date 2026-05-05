# TheoShift Backlog & Known Issues

## IVS module tab — pagination (match Volunteers page)

**Status:** Backlog  
**Priority:** Medium  
**Created:** 2026-05-06

### Request
The IVS module event tab should use **pagination like the Volunteers page**: page controls plus **“show all”** or **page size 10–100** (or equivalent) so large lists stay usable.

### Acceptance criteria
- [ ] IVS list view supports paging consistent with `/events/[id]/volunteers` patterns
- [ ] Options include a reasonable default page size and user-selectable sizes (e.g. 10–100) and/or “show all” where appropriate

---

## Database Cleanup - Remove PIN Column

**Status:** Scheduled Cleanup  
**Priority:** Low  
**Created:** 2026-04-19  
**Scheduled For:** 2026-05-19 (30 days after magic link release)

### Background
PIN login was removed in v4.17.0 and replaced with magic link authentication. The `pin` column in the `volunteers` table still exists but is no longer used.

### Why We're Keeping It (For Now)
1. **Safety net** - Magic link just released, gives us rollback capability
2. **Migration period** - Allows time to verify magic link works for all volunteers
3. **No harm** - Data is not exposed, not a security risk
4. **Historical reference** - May be useful for troubleshooting

### When to Remove
**After 30-60 days** of successful magic link usage (around May 19-June 19, 2026):
- ✅ Confirm no volunteers are having login issues
- ✅ Verify magic link works for all edge cases
- ✅ No rollback needed

### Cleanup Tasks
1. Create Prisma migration to drop `pin` column from `volunteers` table
2. Remove any PIN-related database constraints
3. Clean up any PIN-related indexes
4. Update any remaining database documentation

### Migration Command (When Ready)
```prisma
// prisma/migrations/YYYYMMDDHHMMSS_remove_pin_column/migration.sql
ALTER TABLE "volunteers" DROP COLUMN IF EXISTS "pin";
```

### Acceptance Criteria
- [ ] 30+ days since magic link release
- [ ] No reported login issues from volunteers
- [ ] Magic link authentication confirmed working
- [ ] Migration created and tested
- [ ] Column dropped from database
- [ ] Database size reduced (minimal impact)

---

## PWA Service Worker Issue

**Status:** Mitigated — SW re-enabled in production with navigate bypass (2026-05-02)  
**Priority:** Medium  
**Created:** 2026-04-19

### Problem (historical)
Service worker interfered with magic link authentication on mobile. After login, redirect to `/volunteer/select-event` sometimes showed "ERR_FAILED" / "This site can't be reached".

### Root cause (working theory)
`fetch` handler used **cache-first for volunteer HTML**. Document navigations could be served a stale or wrong shell after the session cookie was set, or otherwise break the post-login navigation on mobile.

### Current approach
1. **`public/sw.js` v2.0.2+** — If `event.request.mode === 'navigate'`, the handler **returns without `respondWith`** so the browser performs a normal network navigation (no SW interception for full page loads).
2. **`pages/_app.tsx`** — Registers `/sw.js` in **production** only (development leaves SW off for easier debugging). The previous "unregister all workers on every load" workaround is removed.

**Tradeoff:** Cold offline **page** navigations are no longer served from the HTML precache; API `stale-while-revalidate` for volunteer JSON and static precache (icons, manifest) still run. PWA install / theme / icons remain; true offline “open any volunteer page with no network” is limited until a follow-up (e.g. offline page + explicit opt-in cache for read-only views).

### Validation needed
- [ ] Magic link on iOS Safari and Android Chrome with production build
- [ ] `/volunteer/select-event` and dashboard after login
- [ ] Optional: add to home screen still works

### Related Files
- `/pages/_app.tsx` — production `register('/sw.js')`
- `/public/sw.js` — fetch strategies; navigate bypass
- `/docs/MAGIC-LINK-AUTH.md` — magic link documentation
