---
description: Automated testing workflow for pre-deployment validation with feature-specific tests
---

# /test-release - Automated Testing Workflow

**Two-tier testing strategy:** Quick smoke tests + comprehensive feature validation before production release.

**Current Development Stage:** Event-centric scheduling system with active feature development.

## Quick Usage

```bash
# Run smoke tests (1-2 minutes)
npm run test:smoke:quick
```

## Full Workflow

### Step 1: Setup (First Time Only)
```bash
# Copy environment template
cp .env.test.example .env.test

# Edit .env.test with your test credentials
# TEST_USER_EMAIL=admin@test.com
# TEST_USER_PASSWORD=admin123
```

### Step 2: Run Tests Before Deployment
```bash
# Quick smoke tests (recommended before every deployment)
npm run test:smoke:quick
```

**Expected:** All tests pass ✅ in 1-2 minutes

### Step 3: Deploy to STAGING
```bash
# Your deployment commands for TheoShift staging
git push origin feature-branch
# Deploy to staging server (10.92.3.24)
```

### Step 4: Test STAGING Environment
```bash
# Test against STAGING server
BASE_URL=http://10.92.3.24:3001 npm run test:smoke:quick
```

### Step 5: Deploy to PRODUCTION
```bash
# Deploy to production (10.92.3.22)
# Your production deployment commands
```

### Step 6: Verify Production
```bash
# Test production after deployment
BASE_URL=https://attendant.cloudigan.net npm run test:smoke:quick
```

## Available Test Commands

| Command | Time | Purpose |
|---------|------|---------|
| `npm run test:smoke:quick` | 1-2 min | Quick pre-deployment check |
| `npm run test:smoke` | 2-3 min | Smoke tests (parallel) |
| `npm run test:e2e` | 5-10 min | Full test suite |
| `npm run test:e2e:ui` | Interactive | Visual test debugger |
| `npm run test:report` | Instant | View HTML report |

## What Gets Tested

### Critical Paths (Smoke Tests)
- ✅ Login flow
- ✅ Dashboard/Events page loads
- ✅ Navigation works
- ✅ No JavaScript errors

## Quick Reference

```
┌─────────────────────────────────────────────────────┐
│  BEFORE EVERY DEPLOYMENT:                           │
│                                                      │
│  npm run test:smoke:quick                           │
│                                                      │
│  ✅ Pass? → Deploy!                                 │
│  ❌ Fail? → Fix first!                              │
└─────────────────────────────────────────────────────┘
```
