# TheoShift Backlog & Known Issues

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
