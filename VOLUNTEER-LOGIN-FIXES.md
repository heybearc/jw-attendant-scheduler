# Volunteer Login & Dashboard Fixes

**Date:** 2026-04-19  
**Status:** ✅ Fixes Implemented - Ready for Testing on LIVE

---

## Issues Reported

1. **Volunteers redirected to main login page** after attempting to log in
2. **Dashboard shows no data** until page is refreshed

---

## Root Causes Identified

### Issue 1: Login Redirect to Admin Page

**Problem:** NextAuth had a global `pages.signIn` configuration pointing to `/auth/signin` (admin login). When volunteers tried to access protected routes or their session expired, NextAuth automatically redirected them to the admin login page.

**Root Cause:**
```typescript
// pages/api/auth/[...nextauth].ts
pages: {
  signIn: '/auth/signin',  // ← Applied to ALL users (admin + volunteer)
}
```

### Issue 2: Dashboard Empty Data

**Problem:** Volunteer dashboard was using **client-side authentication only**. The page would load, then check auth on the client, creating a race condition where the dashboard tried to load data before the session was ready.

**Root Cause:**
- No `getServerSideProps` auth check
- Client-side `useSession()` hook running after page load
- Data fetching triggered before session was fully hydrated

### Issue 3: CSRF Token Validation

**Problem:** NextAuth's `signIn()` function requires a CSRF token, but it wasn't being explicitly fetched, causing the login to hang or fail silently.

---

## Fixes Implemented

### Fix 1: Removed Global NextAuth Sign-In Page
**File:** `pages/api/auth/[...nextauth].ts`

**Before:**
```typescript
pages: {
  signIn: '/auth/signin',  // Global for everyone
}
```

**After:**
```typescript
pages: {
  // Don't set signIn page - let server-side redirects handle it
  // This allows NextAuth CSRF to work while preventing automatic redirects
  error: '/auth/error',
}
```

**Result:** Each page now controls its own redirects via `getServerSideProps`.

---

### Fix 2: Added Server-Side Authentication to Dashboard
**File:** `pages/volunteer/dashboard.tsx`

**Added:**
```typescript
export async function getServerSideProps(context: any) {
  const { getServerSession } = await import('next-auth')
  const { authOptions } = await import('../api/auth/[...nextauth]')
  
  const session = await getServerSession(context.req, context.res, authOptions)
  
  // If no session or not a volunteer, redirect to volunteer login
  if (!session || session.user.role !== 'VOLUNTEER') {
    return {
      redirect: {
        destination: '/volunteer/login',
        permanent: false,
      },
    }
  }
  
  return {
    props: {
      initialEventId: context.query.eventId || null
    }
  }
}
```

**Also updated `useSession` hook:**
```typescript
const { data: session } = useSession({
  required: true,
  onUnauthenticated() {
    router.push('/volunteer/login')
  },
})
```

**Result:** 
- Auth check happens on server before page loads
- No client-side redirect race conditions
- Faster, more secure

---

### Fix 3: Manual Redirect Handling in Login
**File:** `pages/volunteer/login.tsx`

**Changed:**
```typescript
// Before: redirect: true (NextAuth handles redirect)
const result = await signIn('volunteer-pin', {
  ...credentials,
  redirect: true
})

// After: redirect: false (we handle redirect manually)
const result = await signIn('volunteer-pin', {
  ...credentials,
  redirect: false
})

if (result?.ok) {
  router.push(callbackUrl)  // Manual redirect
}
```

**Result:** Prevents NextAuth from trying to redirect to non-existent global sign-in page.

---

### Fix 4: Explicit CSRF Token Fetching
**File:** `pages/volunteer/login.tsx`

**Added:**
```typescript
import { getCsrfToken } from 'next-auth/react'

useEffect(() => {
  getCsrfToken().then(token => {
    console.log('🔐 CSRF token fetched:', token ? 'present' : 'missing')
    setCsrfToken(token || null)
  })
}, [])
```

**Result:** CSRF token is fetched on page load, ensuring it's available for login.

---

### Fix 5: Added Middleware for Volunteer Routes
**File:** `middleware.ts`

**Added:**
```typescript
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if this is a volunteer route
  const isVolunteerRoute = pathname.startsWith('/volunteer/') && 
                          !pathname.startsWith('/volunteer/login')
  
  if (isVolunteerRoute) {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    // If no token or not a volunteer, redirect to volunteer login
    if (!token || token.role !== 'VOLUNTEER') {
      const url = request.nextUrl.clone()
      url.pathname = '/volunteer/login'
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
  }
  
  return NextResponse.next()
}
```

**Result:** Edge-case protection for direct URL access.

---

### Fix 6: Comprehensive Logging
**Files:** `pages/volunteer/login.tsx`, `pages/api/auth/[...nextauth].ts`, `pages/volunteer/dashboard.tsx`

**Added logging at key points:**
- `🔵` Login operations
- `🔐` Authentication/CSRF operations
- `📊` Dashboard data loading
- `✅` Success messages
- `❌` Error messages

**Result:** Easy debugging and monitoring.

---

## Testing Limitation

**⚠️ Cannot test via node IP (http://10.92.3.24:3001)**

**Why:**
- `NEXTAUTH_URL=https://theoshift.com` forces Secure cookies (HTTPS only)
- Browser rejects secure cookies over HTTP connection
- This is correct behavior for production security

**Solution:**
- Must test via domain: `https://theoshift.com`
- After traffic switch to STANDBY, test volunteer login
- OR temporarily change NEXTAUTH_URL on STANDBY (not recommended)

---

## Testing Checklist (After Traffic Switch)

### Test 1: Direct Dashboard Access (Unauthenticated)
- [ ] Navigate to `https://theoshift.com/volunteer/dashboard`
- [ ] **Expected:** Redirect to `/volunteer/login`
- [ ] **NOT:** Redirect to `/auth/signin` ❌

### Test 2: Volunteer Login Flow
- [ ] Go to `https://theoshift.com/volunteer/login`
- [ ] Enter credentials (Cory/Allen/Twinsburg/0879)
- [ ] Click "Sign In"
- [ ] **Expected:** Redirect to `/volunteer/select-event` or `/volunteer/dashboard`
- [ ] **NOT:** Infinite spinner or redirect to `/auth/signin` ❌

### Test 3: Dashboard Data Loading
- [ ] After successful login, observe dashboard
- [ ] **Expected:** Data loads immediately (assignments, documents, etc.)
- [ ] **NOT:** Blank page requiring manual refresh ❌

### Test 4: Session Persistence
- [ ] Log in successfully
- [ ] Navigate away from dashboard
- [ ] Return to dashboard
- [ ] **Expected:** Still logged in, no re-authentication required

### Test 5: Multiple Events
- [ ] Log in as volunteer with multiple events
- [ ] **Expected:** `/volunteer/select-event` page shows
- [ ] Select an event
- [ ] **Expected:** Dashboard loads with correct event data

---

## Console Logs to Watch

**On successful login, you should see:**
```
🔐 CSRF token fetched: present
🔵 Login form submitted
🔵 Signing in with NextAuth...
🔵 Callback URL: /volunteer/select-event
🔵 SignIn result: { ok: true }
✅ SignIn successful, redirecting to: /volunteer/select-event
⏳ Waiting for session to load...
✅ Session ready, loading dashboard for volunteer: [id]
📊 Loading dashboard for volunteer: [id]
📊 Using eventId: [id]
📊 Fetching dashboard data from API...
📊 API response: { success: true, data: {...} }
✅ Dashboard data loaded successfully
```

**On error, you'll see:**
```
❌ SignIn error: [error message]
❌ Not authenticated, redirecting to login
❌ Session exists but no user ID - possible session corruption
```

---

## Architecture Summary

### Before (Broken)
```
User → /volunteer/dashboard
  ↓
Page loads (no server check)
  ↓
Client checks session (useSession)
  ↓
NextAuth detects no session
  ↓
NextAuth redirects to /auth/signin ❌ (admin login)
```

### After (Fixed)
```
User → /volunteer/dashboard
  ↓
Server checks session (getServerSideProps)
  ↓
No session? → Redirect to /volunteer/login ✅
  ↓
Has session? → Load page with data ✅
```

---

## Files Changed

1. `pages/api/auth/[...nextauth].ts` - Removed global signIn page, added logging
2. `pages/volunteer/dashboard.tsx` - Added getServerSideProps, improved session handling
3. `pages/volunteer/login.tsx` - Manual redirect, CSRF token fetching, timeout
4. `middleware.ts` - Added volunteer route protection
5. `PLAN.md` - Updated known issues
6. `tests/volunteer-login-debug.md` - Created debug plan

---

## Commits

1. `debug: add comprehensive logging for volunteer login issues`
2. `fix: add server-side auth to volunteer dashboard`
3. `fix: remove global NextAuth signIn page configuration`
4. `fix: handle volunteer login redirect manually`
5. `fix: fetch CSRF token explicitly for volunteer login`
6. `debug: add logging and timeout to volunteer login`

---

## Next Steps

1. ✅ All fixes deployed to STANDBY
2. ⏳ **Switch traffic to STANDBY** (use `/release` workflow)
3. ⏳ **Test volunteer login via https://theoshift.com**
4. ⏳ Verify both issues are resolved
5. ⏳ Monitor production for any new issues

---

**Status:** Ready for production testing after traffic switch
