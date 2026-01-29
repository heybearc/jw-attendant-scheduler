---
title: Code-First Debugging Approach
tags: [debugging, workflow]
---

# Code-First Debugging Approach

## Core Principle

**Always debug at the code level, never suggest manual testing steps.**

## Debugging Workflow

When user reports an error:

1. **Understand the error** - What's the symptom?
2. **Read relevant code** - Route handlers, middleware, components
3. **Identify root cause** - What code is causing this?
4. **Implement fix** - Change the code
5. **Deploy** - Auto-deploy or "deploy this"
6. **Done** - User will test

## What NOT To Do

❌ **Never suggest:**
- "Try logging in first"
- "Navigate to this URL"
- "Click this button"
- "Enter these credentials"
- "Test this flow manually"
- "Check if X works in the browser"

These interrupt debugging flow and don't fix code.

## What TO Do

✅ **Always:**
- Read the code causing the issue
- Identify the bug in the code
- Implement a code fix
- Deploy the fix
- Let user test after deployment

## Example: 404 Error

**User says:** "I'm getting a 404 on /events/123"

**Bad Response:**
```
The page might not exist. Try:
1. Check if the event exists in the database
2. Navigate to /events/select first
3. Log in and try again
```

**Good Response:**
```
Let me check the route handler for /events/[id].

[Reads app/events/[id]/page.tsx]

Found the issue: The route is missing error handling for invalid IDs.

[Implements fix with proper error handling]

Deploying fix now. Test after deployment completes.
```

## Authentication Errors

When user reports authentication-related errors (401, 403, redirects):

1. **Read authentication middleware**
2. **Check route protection logic**
3. **Examine redirect implementation**
4. **Fix the code issue**
5. **Deploy**

**Never suggest manual login testing.**

## Why This Matters

User is in active debugging mode. Manual testing:
- Interrupts flow
- Wastes time
- Doesn't fix the code
- User will test after deployment anyway

Focus on fixing code, not orchestrating manual tests.
