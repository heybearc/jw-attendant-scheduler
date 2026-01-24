# Batch 7: jw_attendant Infrastructure Migration Plan
**Date:** 2026-01-24  
**Purpose:** Migrate jw_attendant infrastructure references to theoshift naming

---

## Executive Summary

**Scope:** This is an **infrastructure migration**, not a code cleanup. It requires changes to:
- HAProxy backend names
- PostgreSQL database names
- Database user names
- MCP server configurations
- Environment files

**Risk Level:** **CRITICAL** - Requires downtime and careful coordination

**Estimated Time:** 2-4 hours (including testing and rollback preparation)

---

## Phase 1: Discovery & Documentation

### Step 7.1: Document All jw_attendant References

**Current Infrastructure References:**

#### 1. HAProxy Backend Names
**Location:** HAProxy container (Container 136, prox)
**File:** `/etc/haproxy/haproxy.cfg`
**Current Backend Name:** `jw_attendant`
**Used For:** Traffic routing to blue/green TheoShift containers

**References:**
- `.cloudy-work/shared/mcp-servers/homelab-blue-green-mcp/server.js:37`
  ```javascript
  haproxyBackend: 'jw_attendant',
  ```
- `mcp-blue-green/server.js:122`
  ```javascript
  if is_${appConfig.haproxyBackend === 'jw_attendant' ? 'jw_attendant' : 'ldc'}$
  ```

#### 2. Database Names
**Location:** PostgreSQL container (Container 131, 10.92.3.21)
**Current Names:**
- Database: `jw_attendant_scheduler`
- User: `jw_attendant_user`

**References:**
- `.env.postgresql:8-9`
  ```
  DB_NAME=jw_attendant_scheduler
  DB_USER=jw_attendant_user
  ```
- `pages/api/admin/backup-info.ts:40`
  ```javascript
  WHERE datname LIKE 'jw_attendant%'
  ```

#### 3. Static File Paths
**Location:** `.env.postgresql:23`
```
STATIC_ROOT=/opt/jw-attendant-staging/staticfiles/
```

#### 4. SSH Config References
**Location:** `scripts/corrected-mcp-health.js:14`
```javascript
this.sshConfig = '-F /Users/cory/Documents/Cloudy-Work/ssh_config_jw_attendant';
```

---

## Phase 2: Migration Strategy

### Step 7.2: HAProxy Backend Migration

**Current State:**
```
backend jw_attendant_blue
backend jw_attendant_green
acl is_theoshift hdr(host) -i theoshift.example.com
use_backend jw_attendant if is_theoshift
```

**Target State:**
```
backend theoshift_blue
backend theoshift_green
acl is_theoshift hdr(host) -i theoshift.example.com
use_backend theoshift if is_theoshift
```

**Migration Steps:**
1. SSH to HAProxy container: `ssh prox`
2. Backup current config: `pct exec 136 -- cp /etc/haproxy/haproxy.cfg /etc/haproxy/haproxy.cfg.backup.$(date +%Y%m%d)`
3. Update backend names:
   ```bash
   pct exec 136 -- sed -i 's/jw_attendant_blue/theoshift_blue/g' /etc/haproxy/haproxy.cfg
   pct exec 136 -- sed -i 's/jw_attendant_green/theoshift_green/g' /etc/haproxy/haproxy.cfg
   pct exec 136 -- sed -i 's/use_backend jw_attendant/use_backend theoshift/g' /etc/haproxy/haproxy.cfg
   ```
4. Validate config: `pct exec 136 -- haproxy -c -f /etc/haproxy/haproxy.cfg`
5. Reload HAProxy: `pct exec 136 -- systemctl reload haproxy`

**Rollback:**
```bash
pct exec 136 -- cp /etc/haproxy/haproxy.cfg.backup.$(date +%Y%m%d) /etc/haproxy/haproxy.cfg
pct exec 136 -- systemctl reload haproxy
```

---

### Step 7.3: Database Migration

**Current State:**
- Database: `jw_attendant_scheduler`
- User: `jw_attendant_user`
- Owner: `jw_attendant_user`

**Target State:**
- Database: `theoshift_scheduler`
- User: `theoshift_user`
- Owner: `theoshift_user`

**Migration Steps:**

#### Option A: Rename Existing Database (Recommended - No Data Loss)
```bash
# SSH to database container
ssh root@10.92.3.21

# Connect as postgres superuser
sudo -u postgres psql

# Terminate all connections to the database
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'jw_attendant_scheduler' AND pid <> pg_backend_pid();

# Rename database
ALTER DATABASE jw_attendant_scheduler RENAME TO theoshift_scheduler;

# Rename user
ALTER USER jw_attendant_user RENAME TO theoshift_user;

# Verify
\l theoshift_scheduler
\du theoshift_user

# Exit
\q
```

#### Option B: Create New Database and Migrate (Safer - Preserves Original)
```bash
# SSH to database container
ssh root@10.92.3.21

# Create backup first
sudo -u postgres pg_dump jw_attendant_scheduler > /tmp/theoshift_backup_$(date +%Y%m%d_%H%M%S).sql

# Connect as postgres superuser
sudo -u postgres psql

# Create new user
CREATE USER theoshift_user WITH PASSWORD 'your_secure_password_here';

# Create new database
CREATE DATABASE theoshift_scheduler OWNER theoshift_user;

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE theoshift_scheduler TO theoshift_user;

# Exit
\q

# Restore data to new database
sudo -u postgres psql theoshift_scheduler < /tmp/theoshift_backup_*.sql

# Update ownership
sudo -u postgres psql theoshift_scheduler -c "REASSIGN OWNED BY jw_attendant_user TO theoshift_user;"
```

**Rollback:**
- Option A: Rename back to original names
- Option B: Keep original database, update .env to point back

---

### Step 7.4: Update MCP Server Configurations

**Files to Update:**

#### 1. `.cloudy-work/shared/mcp-servers/homelab-blue-green-mcp/server.js`
```javascript
// OLD
haproxyBackend: 'jw_attendant',

// NEW
haproxyBackend: 'theoshift',
```

#### 2. `mcp-blue-green/server.js`
```javascript
// OLD
if is_${appConfig.haproxyBackend === 'jw_attendant' ? 'jw_attendant' : 'ldc'}$

// NEW
if is_${appConfig.haproxyBackend === 'theoshift' ? 'theoshift' : 'ldc'}$
```

---

### Step 7.5: Update Environment Files

**Files to Update:**

#### 1. `.env.postgresql`
```bash
# OLD
DB_NAME=jw_attendant_scheduler
DB_USER=jw_attendant_user
STATIC_ROOT=/opt/jw-attendant-staging/staticfiles/

# NEW
DB_NAME=theoshift_scheduler
DB_USER=theoshift_user
STATIC_ROOT=/opt/theoshift/staticfiles/
```

#### 2. Container .env files (if they exist)
- `/opt/theoshift/.env` on blue-theoshift (Container 134)
- `/opt/theoshift/.env` on green-theoshift (Container 132)

**Check and update DATABASE_URL if present:**
```bash
# OLD
DATABASE_URL=postgresql://jw_attendant_user:password@10.92.3.21:5432/jw_attendant_scheduler

# NEW
DATABASE_URL=postgresql://theoshift_user:password@10.92.3.21:5432/theoshift_scheduler
```

---

### Step 7.6: Update Backup Scripts

**Files to Update:**

#### 1. `pages/api/admin/backup-info.ts`
```typescript
// OLD
WHERE datname LIKE 'jw_attendant%'

// NEW
WHERE datname LIKE 'theoshift%'
```

#### 2. Database backup scripts (if they exist on Container 131)
```bash
ssh root@10.92.3.21
find /usr/local/bin -name "*jw*" -o -name "*attendant*"
```

Update any backup scripts found to use new database name.

---

### Step 7.7: Update SSH Config References

**Files to Update:**

#### 1. `scripts/corrected-mcp-health.js`
```javascript
// OLD
this.sshConfig = '-F /Users/cory/Documents/Cloudy-Work/ssh_config_jw_attendant';

// NEW
this.sshConfig = '-F /Users/cory/Documents/Cloudy-Work/ssh_config_theoshift';
```

**Note:** May need to create or rename the SSH config file.

---

## Phase 3: Execution Plan

### Pre-Migration Checklist

- [ ] **Backup HAProxy config**
- [ ] **Backup PostgreSQL database**
- [ ] **Document current LIVE/STANDBY status**
- [ ] **Notify users of maintenance window** (if applicable)
- [ ] **Verify rollback procedures**
- [ ] **Test database connection strings**

### Execution Order (Minimize Downtime)

**Estimated Downtime:** 15-30 minutes

#### Step 1: Prepare (No Downtime)
1. Create database backup
2. Create HAProxy config backup
3. Update all code files (MCP servers, .env files, backup scripts)
4. Commit changes to git
5. Deploy code changes to both containers

#### Step 2: Database Migration (5-10 minutes downtime)
1. Put application in maintenance mode (optional)
2. Stop PM2 on both containers:
   ```bash
   ssh blue-theoshift 'pm2 stop theoshift-blue'
   ssh green-theoshift 'pm2 stop theoshift-green'
   ```
3. Execute database rename (Option A) or migration (Option B)
4. Update .env files on containers with new database credentials
5. Test database connection from one container
6. Start PM2 on both containers:
   ```bash
   ssh blue-theoshift 'pm2 start theoshift-blue'
   ssh green-theoshift 'pm2 start theoshift-green'
   ```
7. Verify application health

#### Step 3: HAProxy Migration (5-10 minutes downtime)
1. Update HAProxy config with new backend names
2. Validate HAProxy config
3. Reload HAProxy (seamless reload, minimal downtime)
4. Verify traffic routing

#### Step 4: Verification (No Downtime)
1. Check HAProxy stats
2. Test application access
3. Verify database queries working
4. Run smoke tests
5. Monitor logs for errors

---

## Phase 4: Testing & Verification

### Step 7.8: Test on STANDBY First

**Before executing infrastructure changes:**

1. **Update code files locally**
2. **Commit and push to GitHub**
3. **Deploy to STANDBY (green-theoshift)**
4. **Verify application starts with updated config**
5. **Test database connectivity**

**Test Commands:**
```bash
# Test database connection
ssh green-theoshift 'cd /opt/theoshift && node -e "
const { PrismaClient } = require(\"@prisma/client\");
const prisma = new PrismaClient();
prisma.\$connect().then(() => {
  console.log(\"✅ Database connected\");
  return prisma.users.count();
}).then(count => {
  console.log(\"✅ User count:\", count);
  process.exit(0);
}).catch(err => {
  console.error(\"❌ Database error:\", err.message);
  process.exit(1);
});
"'

# Test application health
curl -s http://10.92.3.22:3001/api/health | jq
```

---

### Step 7.9: Execute Infrastructure Changes

**⚠️ CRITICAL: Requires User Approval**

This step modifies production infrastructure and requires explicit approval.

**Commands to Execute:**

```bash
# 1. Stop applications
ssh blue-theoshift 'pm2 stop theoshift-blue'
ssh green-theoshift 'pm2 stop theoshift-green'

# 2. Backup database
ssh root@10.92.3.21 'sudo -u postgres pg_dump jw_attendant_scheduler > /tmp/theoshift_backup_$(date +%Y%m%d_%H%M%S).sql'

# 3. Rename database and user
ssh root@10.92.3.21 'sudo -u postgres psql -c "
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '\''jw_attendant_scheduler'\'' AND pid <> pg_backend_pid();
ALTER DATABASE jw_attendant_scheduler RENAME TO theoshift_scheduler;
ALTER USER jw_attendant_user RENAME TO theoshift_user;
"'

# 4. Update HAProxy
ssh prox 'pct exec 136 -- bash -c "
cp /etc/haproxy/haproxy.cfg /etc/haproxy/haproxy.cfg.backup.\$(date +%Y%m%d);
sed -i '\''s/jw_attendant_blue/theoshift_blue/g'\'' /etc/haproxy/haproxy.cfg;
sed -i '\''s/jw_attendant_green/theoshift_green/g'\'' /etc/haproxy/haproxy.cfg;
sed -i '\''s/use_backend jw_attendant/use_backend theoshift/g'\'' /etc/haproxy/haproxy.cfg;
haproxy -c -f /etc/haproxy/haproxy.cfg && systemctl reload haproxy;
"'

# 5. Start applications
ssh blue-theoshift 'pm2 start theoshift-blue'
ssh green-theoshift 'pm2 start theoshift-green'
```

---

### Step 7.10: Post-Migration Verification

**Verification Checklist:**

- [ ] **Database accessible with new name**
  ```bash
  ssh root@10.92.3.21 'sudo -u postgres psql -l | grep theoshift'
  ```

- [ ] **HAProxy routing correctly**
  ```bash
  ssh prox 'pct exec 136 -- grep "use_backend theoshift" /etc/haproxy/haproxy.cfg'
  ```

- [ ] **Applications healthy**
  ```bash
  curl -s http://10.92.3.24:3001/api/health | jq
  curl -s http://10.92.3.22:3001/api/health | jq
  ```

- [ ] **Database queries working**
  ```bash
  ssh blue-theoshift 'cd /opt/theoshift && npx prisma db pull'
  ```

- [ ] **MCP tools functional**
  ```bash
  ./.cloudy-work/_cloudy-ops/scripts/verify-live-standby.sh theoshift
  ```

- [ ] **Backup scripts updated**
  ```bash
  ssh root@10.92.3.21 'ls -la /usr/local/bin/*backup* | grep -i theoshift'
  ```

---

## Phase 5: Rollback Procedures

### If Database Migration Fails

**Option A Rollback (Rename):**
```bash
ssh root@10.92.3.21 'sudo -u postgres psql -c "
ALTER DATABASE theoshift_scheduler RENAME TO jw_attendant_scheduler;
ALTER USER theoshift_user RENAME TO jw_attendant_user;
"'
```

**Option B Rollback (New Database):**
```bash
# Update .env files to point back to jw_attendant_scheduler
# Drop new database if needed
ssh root@10.92.3.21 'sudo -u postgres psql -c "DROP DATABASE theoshift_scheduler;"'
```

### If HAProxy Migration Fails

```bash
ssh prox 'pct exec 136 -- bash -c "
cp /etc/haproxy/haproxy.cfg.backup.$(date +%Y%m%d) /etc/haproxy/haproxy.cfg;
systemctl reload haproxy;
"'
```

### If Application Fails to Start

```bash
# Revert code changes
git revert HEAD
git push origin main

# Redeploy to containers
ssh blue-theoshift 'cd /opt/theoshift && git pull origin main && pm2 restart theoshift-blue'
ssh green-theoshift 'cd /opt/theoshift && git pull origin main && pm2 restart theoshift-green'
```

---

## Phase 6: Post-Migration Cleanup

### Optional: Remove Old Database (After Verification)

**Wait 7-30 days before removing old database to ensure migration successful.**

```bash
# If Option B was used (new database created)
ssh root@10.92.3.21 'sudo -u postgres psql -c "DROP DATABASE jw_attendant_scheduler;"'
ssh root@10.92.3.21 'sudo -u postgres psql -c "DROP USER jw_attendant_user;"'
```

### Update Documentation

- [ ] Update `.cloudy-work/_cloudy-ops/context/APP-MAP.md`
- [ ] Update `DECISIONS.md` with migration decision
- [ ] Update `TASK-STATE.md` with completion
- [ ] Update any runbooks or operational docs

---

## Risk Assessment

### High Risk Items
1. **Database rename** - Could break application if not done correctly
2. **HAProxy backend rename** - Could cause traffic routing failures
3. **Downtime** - 15-30 minutes required for safe migration

### Mitigation Strategies
1. **Comprehensive backups** before any changes
2. **Test on STANDBY first** before touching LIVE
3. **Rollback procedures** documented and tested
4. **Incremental changes** - database first, then HAProxy
5. **Verification at each step** before proceeding

---

## Success Criteria

- [ ] Database renamed to `theoshift_scheduler`
- [ ] Database user renamed to `theoshift_user`
- [ ] HAProxy backends renamed to `theoshift_blue` and `theoshift_green`
- [ ] All MCP server configs updated
- [ ] All .env files updated
- [ ] Both applications healthy and operational
- [ ] Traffic routing correctly through HAProxy
- [ ] No errors in application logs
- [ ] Backup scripts updated and functional
- [ ] All tests passing

---

## Estimated Timeline

**Preparation:** 1 hour
- Document references
- Create backups
- Update code files
- Test on STANDBY

**Execution:** 30-45 minutes
- Database migration: 10 minutes
- HAProxy migration: 10 minutes
- Application restart: 5 minutes
- Verification: 15-20 minutes

**Total:** 1.5-2 hours (excluding post-migration monitoring)

---

**Status:** Ready for execution pending user approval  
**Next Step:** Review this plan and approve infrastructure changes
