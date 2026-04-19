# Volunteer Login & Dashboard Debug Plan

**Date:** 2026-04-19  
**Environment:** STANDBY (BLUE - 10.92.3.24)  
**Issues:** Login redirect loop + Empty dashboard data

---

## Issue 1: Volunteer Login Redirect Loop

### Symptoms
- Volunteer enters credentials on `/volunteer/login`
- NextAuth authenticates successfully
- User is redirected to main login page instead of `/volunteer/select-event`
- Frustrating loop for users

### Possible Causes
1. **Stale session tokens** — Old JWT tokens causing auth state mismatch
2. **NextAuth callback URL** — Redirect logic not handling volunteer role correctly
3. **Session persistence** — Session not being saved properly after volunteer login
4. **NEXTAUTH_URL mismatch** — Environment variable pointing to wrong domain

### Test Steps on STANDBY
1. Clear all cookies and localStorage
2. Navigate to `http://10.92.3.24:3001/volunteer/login`
3. Enter test volunteer credentials:
   - First Name: Cory
   - Last Name: Allen
   - Congregation: Twinsburg
   - PIN: 0879
4. Submit form
5. Observe redirect behavior
6. Check browser console for errors
7. Check Network tab for API calls
8. Verify session cookie is set

### Expected Behavior
- After successful login → redirect to `/volunteer/select-event`
- If only one event → auto-redirect to `/volunteer/dashboard?eventId=XXX`
- Session cookie should be set with role=VOLUNTEER

### Debug Points
- `pages/volunteer/login.tsx` line 43-50: signIn call with callbackUrl
- `pages/api/auth/[...nextauth].ts` line 116-129: redirect callback
- `pages/volunteer/select-event.tsx` line 37-47: session check and redirect

---

## Issue 2: Volunteer Dashboard Empty Data

### Symptoms
- Dashboard loads but shows no assignments, documents, or data
- Page appears blank or with loading state
- Manual refresh (F5) sometimes fixes it
- Data eventually appears but requires refresh

### Possible Causes
1. **Race condition** — Dashboard component renders before session is ready
2. **API timing** — `/api/volunteer/dashboard` called before session.user.id is available
3. **useEffect dependency** — Missing dependencies causing stale closure
4. **localStorage race** — eventId not available when API is called
5. **SSR/CSR mismatch** — Server-side rendering issue with client-side data

### Test Steps on STANDBY
1. Successfully log in as volunteer
2. Observe dashboard load behavior
3. Check if data appears immediately or requires refresh
4. Open browser console and check for:
   - "No session user ID" error
   - API call to `/api/volunteer/dashboard`
   - Response data
5. Check Network tab for API timing
6. Verify localStorage has `selectedEventId`

### Expected Behavior
- Dashboard loads with all data immediately after login
- No manual refresh required
- Assignments, documents, and contacts visible

### Debug Points
- `pages/volunteer/dashboard.tsx` line 150-158: useEffect with session check
- `pages/volunteer/dashboard.tsx` line 201-232: loadDashboard function
- `pages/volunteer/dashboard.tsx` line 212: eventId from query or localStorage
- `pages/api/volunteer/dashboard.ts` line 11-15: Query param validation

---

## Root Cause Analysis

### Login Redirect Issue
**Hypothesis:** NextAuth redirect callback is not properly handling volunteer role

**Evidence to check:**
1. Does `session.user.role` === 'VOLUNTEER' after login?
2. Is callbackUrl being preserved through the auth flow?
3. Is there a middleware intercepting the redirect?

**Code to examine:**
```typescript
// pages/api/auth/[...nextauth].ts lines 116-129
async redirect({ url, baseUrl }) {
  // If callback URL is provided and valid, use it
  if (url.startsWith(baseUrl)) {
    return url
  }
  
  // If it's a default redirect, route to admin event selection
  if (url === baseUrl || url === `${baseUrl}/`) {
    return `${baseUrl}/events/select`  // ← BUG: This is admin route!
  }
  
  // Fallback to base URL
  return baseUrl
}
```

**Potential Fix:**
The redirect callback doesn't check user role. When volunteer logs in with callbackUrl `/volunteer/select-event`, if NextAuth doesn't preserve it, the fallback goes to `/events/select` (admin route).

**Solution:**
1. Check if callbackUrl is being lost
2. Add role-based redirect logic
3. Ensure volunteer sessions preserve callbackUrl

---

### Empty Dashboard Issue
**Hypothesis:** Race condition between session loading and API call

**Evidence to check:**
1. Is `session.user.id` undefined when loadDashboard is called?
2. Does the useEffect run before session is fully hydrated?
3. Is there a timing issue with localStorage.getItem?

**Code to examine:**
```typescript
// pages/volunteer/dashboard.tsx lines 150-158
useEffect(() => {
  if (status === 'loading') return  // ← Waits for session
  
  if (status === 'unauthenticated' || !session || session.user.role !== 'VOLUNTEER') {
    router.push('/volunteer/login')
    return
  }
  
  loadDashboard()  // ← Called immediately after session check
}, [status, session])  // ← Missing router dependency?
```

**Potential Fix:**
1. Add null check in loadDashboard before API call
2. Add loading state while session hydrates
3. Add router to useEffect dependencies
4. Add retry logic if API call fails due to missing session

---

## Testing Checklist

### Pre-test Setup
- [ ] Deploy latest code to STANDBY
- [ ] Clear browser cache and cookies
- [ ] Open browser DevTools (Console + Network tabs)
- [ ] Have test volunteer credentials ready

### Test 1: Fresh Login Flow
- [ ] Navigate to `/volunteer/login`
- [ ] Enter credentials and submit
- [ ] Observe redirect (should go to `/volunteer/select-event`)
- [ ] Check console for errors
- [ ] Check Network tab for auth API calls
- [ ] Verify session cookie is set

### Test 2: Dashboard Data Loading
- [ ] After successful login, observe dashboard
- [ ] Check if data loads immediately
- [ ] If blank, try manual refresh
- [ ] Check console for "No session user ID" error
- [ ] Check Network tab for `/api/volunteer/dashboard` call
- [ ] Verify API response has data

### Test 3: Session Persistence
- [ ] Log in successfully
- [ ] Navigate away from dashboard
- [ ] Return to dashboard
- [ ] Verify session persists
- [ ] Verify no re-authentication required

### Test 4: Multiple Events
- [ ] Log in as volunteer with multiple events
- [ ] Verify `/volunteer/select-event` page shows
- [ ] Select an event
- [ ] Verify dashboard loads with correct event data

---

## Logging Strategy

Add console.log statements to track flow:

```typescript
// pages/volunteer/login.tsx
console.log('🔵 Login form submitted', formData)
console.log('🔵 Signing in with NextAuth...')
console.log('✅ SignIn result:', result)

// pages/api/auth/[...nextauth].ts
console.log('🔐 Redirect callback:', { url, baseUrl })
console.log('🔐 Session callback:', { session, token })

// pages/volunteer/dashboard.tsx
console.log('📊 Dashboard useEffect:', { status, session })
console.log('📊 Loading dashboard for user:', session?.user?.id)
console.log('📊 EventId:', eventId)
console.log('📊 API Response:', result)
```

---

## Expected Fixes

### Fix 1: Role-based redirect in NextAuth
```typescript
async redirect({ url, baseUrl }) {
  // If callback URL is provided and valid, use it
  if (url.startsWith(baseUrl)) {
    return url
  }
  
  // Default redirects based on role (from token/session)
  // Note: We don't have access to session here, so rely on callbackUrl
  
  // Fallback to base URL
  return baseUrl
}
```

### Fix 2: Add session ready check in dashboard
```typescript
useEffect(() => {
  if (status === 'loading') {
    console.log('⏳ Waiting for session...')
    return
  }
  
  if (status === 'unauthenticated' || !session || session.user.role !== 'VOLUNTEER') {
    console.log('❌ Not authenticated or not a volunteer')
    router.push('/volunteer/login')
    return
  }
  
  if (!session.user.id) {
    console.error('❌ Session exists but no user ID')
    return
  }
  
  console.log('✅ Session ready, loading dashboard')
  loadDashboard()
}, [status, session, router])
```

---

## Next Steps

1. Test on STANDBY to reproduce issues
2. Add logging to track exact failure points
3. Implement fixes based on findings
4. Test fixes on STANDBY
5. Deploy to LIVE after validation
6. Monitor production for similar issues

---

**Status:** Ready for testing on STANDBY
