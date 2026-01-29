---
title: No Authentication Testing During Debugging
tags: [debugging, authentication, testing]
---

# No Authentication Testing During Debugging

## Rule

**NEVER suggest manual authentication testing or URL navigation during debugging.**

When debugging authentication-related issues (404s, redirects, login flows):

❌ **DO NOT:**
- Suggest logging in manually to test
- Provide login URLs or credentials
- Ask user to navigate to pages in browser
- Suggest testing authentication flows manually
- Say "log in first and try again"

✅ **DO:**
- Investigate the code causing the issue
- Check authentication middleware logic
- Review redirect logic in the code
- Examine session/token handling
- Look at route protection implementation
- Check for authentication state bugs
- Analyze server-side authentication checks

## Why

Authentication testing requires:
- Manual browser interaction
- Entering credentials
- Navigating through flows
- Waiting for redirects

This interrupts debugging flow and doesn't help fix the actual code issue.

## Example

**Bad Response:**
```
The 404 error is because you're not logged in to STANDBY.

Solution:
1. Go to https://blue.theoshift.com/auth/signin
2. Log in with admin@theoshift.local / AdminPass123!
3. Then navigate to /events/select
```

**Good Response:**
```
The 404 error is caused by authentication redirect logic.

Investigating the code:
1. Checking middleware in /events/[id] route
2. Looking at authentication check implementation
3. Examining redirect logic that causes malformed URL
4. Found issue: [specific code problem]
5. Implementing fix: [code change]
```

## Debugging Authentication Issues

When user reports authentication-related errors:

1. **Read the route file** - Check middleware and auth logic
2. **Check authentication state** - How is auth verified?
3. **Examine redirect logic** - Where does it redirect and why?
4. **Look for edge cases** - What happens when not authenticated?
5. **Fix the code** - Implement proper handling
6. **Deploy automatically** - Let auto-deploy handle testing

## Context

User is debugging on STANDBY container. Authentication state is complex and manual testing is slow. Focus on fixing code, not testing authentication flows manually.
