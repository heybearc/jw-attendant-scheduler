# TheoShift Session Boot

**Load this file at the start of each Windsurf session for full context.**

---

## 1. Load Shared Context (from Cloudy-Work)

Read these files from the `.cloudy-work/` submodule:

```
.cloudy-work/_cloudy-ops/context/CURRENT-STATE.md
.cloudy-work/_cloudy-ops/context/APP-MAP.md
.cloudy-work/_cloudy-ops/context/DECISIONS.md
.cloudy-work/_cloudy-ops/context/RUNBOOK-SHORT.md
```

**Why:** Shared operational truth, app inventory, architectural decisions, quick commands

---

## 2. Load TheoShift Local Context

Read these files from the TheoShift repo root:

```
TASK-STATE.md
DECISIONS.md
```

**Why:** Current work state, TheoShift-specific decisions

---

## 3. TheoShift App Info

**Canonical Path:** `/opt/theoshift`  
**Port:** 3001 (standard)

**⚠️ LIVE/STANDBY Status (Dynamic - Verify Before Deployment):**

Blue-green roles swap during releases. Always verify current status via HAProxy:

```bash
# Verify which environment is LIVE vs STANDBY
ssh prox "pct exec 136 -- grep 'use_backend.*if is_theoshift' /etc/haproxy/haproxy.cfg"

# Or use helper script from Cloudy-Work
.cloudy-work/_cloudy-ops/scripts/verify-live-standby.sh theoshift
```

**Environment Details:**
- **blue-theoshift:** Container 134, IP 10.92.3.24
- **green-theoshift:** Container 132, IP 10.92.3.22

**Current roles determined by HAProxy configuration, not static assignments.**

**Tech Stack:**
- Framework: Next.js 15
- Language: TypeScript
- Database: PostgreSQL (Container 131, 10.92.3.21)
- ORM: Prisma
- Testing: Playwright
- Process Manager: PM2

**Key Directories:**
- `/app` - Next.js app directory
- `/components` - React components
- `/lib` - Utilities and helpers
- `/prisma` - Database schema and migrations
- `/tests` - Playwright E2E tests

---

## 4. TheoShift Rules

**Container-First Development:**
- All development happens on containers (verify STANDBY first)
- SSH to container before any commands
- No local Mac builds or tests

**Testing:**
- Run tests on STANDBY before release
- Test user: admin@theoshift.local
- .env.test is container-local (chmod 600)

**Deployment:**
- /bump → deploy to STANDBY
- /test-release → run tests on STANDBY
- /release → switch traffic (STANDBY becomes LIVE)
- /sync → sync new STANDBY with LIVE code

---

## 5. Quick Commands

**Verify Current Roles:**
```bash
.cloudy-work/_cloudy-ops/scripts/verify-live-standby.sh theoshift
```

**SSH (verify role first):**
```bash
ssh blue-theoshift
ssh green-theoshift
```

**Testing:**
```bash
# Run on STANDBY (verify which one first)
ssh <standby-host> 'cd /opt/theoshift && npm run test:smoke:quick'
ssh <standby-host> 'cd /opt/theoshift && npm run test:e2e'
```

**Deployment:**
```bash
/bump theoshift
/test-release theoshift
/release theoshift
/sync theoshift
```

**Database:**
```bash
ssh <current-host> 'cd /opt/theoshift && npx prisma studio'
ssh <current-host> 'cd /opt/theoshift && npx prisma migrate dev'
```

---

## 6. Context Hygiene

**Daily:**
- Update TASK-STATE.md at end of day
- Verify LIVE/STANDBY status before deployments

**Weekly:**
- Review DECISIONS.md
- Prune old content from TASK-STATE.md

---

**Session Ready:** You now have full context for TheoShift work.
