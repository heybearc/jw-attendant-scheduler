# TheoShift Backlog & Known Issues

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

**Status:** Known Issue / Backlog  
**Priority:** Medium  
**Created:** 2026-04-19

### Problem
Service worker interferes with magic link authentication on mobile devices. When service worker is registered on mobile:
- Magic link callback completes successfully
- Session cookie is set correctly
- Redirect to `/volunteer/select-event` occurs
- BUT page shows "ERR_FAILED" / "This site can't be reached"

### Current Workaround
Service worker is completely disabled for all users. This means:
- ❌ No PWA features (offline access, install to home screen)
- ❌ No caching benefits
- ✅ Magic link works on desktop and mobile

### Root Cause
Unknown. Possibilities:
1. Service worker caching strategy interfering with authenticated pages
2. Service worker not properly handling session cookies
3. Redirect handling issue in service worker
4. Race condition between session creation and page load

### Investigation Needed
1. Add detailed logging to service worker fetch events
2. Test with service worker only excluding `/volunteer/*` routes
3. Check if issue is specific to Safari/iOS or all mobile browsers
4. Verify session cookie is accessible to service worker
5. Test if issue occurs when service worker is in "waiting" state vs "active"

### Desired Outcome
- Service worker enabled for mobile users
- Magic link authentication works
- PWA features available (offline access, install to home screen)
- Proper caching for better performance

### Technical Notes
- Service worker already excludes `/api/auth/*` and `/auth/*` routes
- Issue occurs AFTER authentication, on the dashboard page
- Desktop browsers work fine (service worker disabled)
- Mobile detection: `/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i`

### Related Files
- `/pages/_app.tsx` - Service worker registration logic
- `/public/sw.js` - Service worker implementation
- `/docs/MAGIC-LINK-AUTH.md` - Magic link documentation

### Testing Steps
1. Enable service worker for mobile in `_app.tsx`
2. Request magic link on mobile device
3. Click magic link
4. Observe if `/volunteer/select-event` loads or shows ERR_FAILED
5. Check browser console for service worker logs
6. Check Network tab for failed requests

### Acceptance Criteria
- [ ] Magic link works on mobile with service worker enabled
- [ ] `/volunteer/select-event` page loads successfully
- [ ] Service worker caches volunteer dashboard pages
- [ ] Offline functionality works for volunteers
- [ ] "Add to Home Screen" prompt appears on mobile
