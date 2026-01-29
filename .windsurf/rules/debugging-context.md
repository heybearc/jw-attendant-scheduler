---
title: TheoShift Debugging Context
tags: [debugging, context, authentication]
---

# TheoShift Debugging Context

## Environment

**STANDBY Container:** blue-theoshift (10.92.3.24)
**LIVE Container:** green-theoshift (10.92.3.22)
**Port:** 3001
**Framework:** Next.js 14 with NextAuth

## Authentication

**NextAuth is configured and working.**

When debugging authentication-related issues:
- Authentication state is managed by NextAuth
- Session cookies are HTTP-only
- STANDBY uses localhost:3001 for testing
- Login page: `/auth/signin`
- Protected routes use middleware or `getServerSession()`

**Do NOT suggest manual login testing.** Focus on code-level debugging.

## Common Issues

### 404 on Protected Routes
**Symptom:** User gets 404 when accessing protected route
**Cause:** Usually authentication redirect logic or route protection
**Debug:** Check middleware, route handlers, authentication checks

### Malformed URLs After Redirect
**Symptom:** URL shows `/events/[id]/[id]` or similar
**Cause:** Redirect logic using wrong path construction
**Debug:** Check redirect logic in authentication middleware or route handlers

### Session Not Persisting
**Symptom:** User keeps getting logged out
**Cause:** Session configuration or cookie issues
**Debug:** Check NextAuth configuration, session settings, cookie configuration

## Debugging Approach

1. **Read the relevant code** - Route handlers, middleware, auth config
2. **Identify the issue** - What's causing the error?
3. **Implement fix** - Change the code
4. **Deploy automatically** - Auto-deploy handles deployment
5. **User tests** - User will test after deployment

**Never ask user to manually test authentication flows during debugging.**

## Auto-Deploy

When `.debugging` file is present, changes are automatically deployed to STANDBY after commit. User will test after deployment completes.

## Testing

User has test credentials and will test after deployment. Focus on fixing code, not orchestrating manual testing.
