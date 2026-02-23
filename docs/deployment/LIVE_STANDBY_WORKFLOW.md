# LIVE/STANDBY Deployment Workflow

## ✅ Infrastructure Fixed

**What Changed:**
- MCP server now uses **LIVE/STANDBY** terminology (not PROD/STAGING)
- HAProxy state tracking properly configured
- Dynamic backend detection from HAProxy routing
- Environment indicators added to containers

---

## 🎯 Understanding LIVE vs STANDBY

**LIVE** = The server currently receiving user traffic
**STANDBY** = The backup server ready for testing/deployment

**Important:** BLUE and GREEN are just server names. Either can be LIVE or STANDBY at any time.

---

## 📊 Current Configuration

**Servers:**
- **BLUE** = Container 134 (10.92.3.24) — hostname: theoshift-blue
- **GREEN** = Container 132 (10.92.3.22) — hostname: theoshift-green

**Current Status (as of 2026-02-23):**
- **LIVE:** BLUE (10.92.3.24) — HAProxy routes theoshift → theoshift_blue
- **STANDBY:** GREEN (10.92.3.22) — Ready for deployment

**⚠️ NOTE:** LIVE/STANDBY roles swap on every release. Always verify via HAProxy — this doc shows a snapshot only.

**State Tracking:**
- File: `/var/lib/haproxy/theoshift-deployment-state.json`
- Contains: `{prod:blue, live:blue, standby:green, lastSwitch, switchCount}`
- MCP reads this to know which is which

---

## 🔄 Deployment Workflow

### Step 1: Check Status
```bash
# MCP will show which server is LIVE and which is STANDBY
mcp3_get_deployment_status(app: "theoshift")
```

**Output shows:**
- LIVE server (currently serving users)
- STANDBY server (ready for deployment)
- Health status of both
- HAProxy backend routing

### Step 2: Deploy to STANDBY
```bash
# MCP automatically deploys to whichever server is STANDBY
mcp3_deploy_to_standby(
  app: "theoshift",
  pullGithub: true,
  createBackup: true,
  runMigrations: false
)
```

**What happens:**
1. MCP checks HAProxy to see which server is STANDBY
2. Deploys ONLY to STANDBY server
3. Pulls code, builds, restarts
4. Runs health checks
5. LIVE server is completely untouched

### Step 3: Test on STANDBY
- Access STANDBY server directly (IP shown in deployment output)
- Test all functionality
- Verify changes work correctly
- LIVE users unaffected during testing

### Step 4: Switch Traffic (Release)
```bash
# When ready, switch traffic to STANDBY (making it LIVE)
mcp3_switch_traffic(
  app: "theoshift",
  requireApproval: true,
  emergency: false
)
```

**What happens:**
1. MCP checks STANDBY health
2. Shows approval prompt with current/new LIVE servers
3. Updates HAProxy routing to new LIVE server
4. Updates state file
5. Old LIVE becomes new STANDBY

### Step 5: Sync (Optional)
After traffic switch, you can update the new STANDBY to match LIVE:
```bash
# Deploy to new STANDBY to keep both servers in sync
mcp3_deploy_to_standby(app: "theoshift")
```

---

## 🔒 Safety Features

### 1. **Dynamic Detection**
- MCP reads HAProxy config to determine which server is LIVE
- Never assumes based on server name
- Always deploys to correct STANDBY server

### 2. **State Tracking**
- HAProxy maintains state file
- Tracks which server is LIVE/STANDBY
- Records switch history and count

### 3. **Health Checks**
- Pre-deployment health verification
- Post-deployment health verification
- Prevents switching to unhealthy servers

### 4. **Approval Required**
- Traffic switches require explicit approval
- Shows exactly what will change
- Emergency mode available for rollbacks

### 5. **Environment Indicators**
- Bash prompt shows BLUE/GREEN in color
- `.env.display` files on each container
- Future: UI banner showing environment

---

## 🚨 What We Fixed

**Before:**
- ❌ Assumed BLUE = STANDBY, GREEN = LIVE
- ❌ State file name mismatch
- ❌ No dynamic detection
- ❌ Used PROD/STAGING terminology
- ❌ Could accidentally deploy to LIVE

**After:**
- ✅ Dynamically detects LIVE/STANDBY from HAProxy
- ✅ Correct state file (`jw-deployment-state.json`)
- ✅ Consistent LIVE/STANDBY terminology
- ✅ Environment indicators on containers
- ✅ Always deploys to correct STANDBY server

---

## 📝 Example Workflow

**Scenario: Deploy new feature**

1. **Check status:**
   ```
   mcp3_get_deployment_status → Shows BLUE is LIVE, GREEN is STANDBY
   ```

2. **Deploy to STANDBY (GREEN):**
   ```
   mcp3_deploy_to_standby → Deploys to GREEN automatically
   ```

3. **Test on GREEN:**
   ```
   Access http://10.92.3.24:3001 → Test feature
   ```

4. **Release (switch traffic):**
   ```
   mcp3_switch_traffic → GREEN becomes LIVE, BLUE becomes STANDBY
   ```

5. **Sync STANDBY (BLUE):**
   ```
   mcp3_deploy_to_standby → Updates BLUE to match GREEN
   ```

**Next deployment:**
- Status check shows GREEN is LIVE, BLUE is STANDBY
- Deploy to STANDBY (BLUE) automatically
- Test on BLUE
- Switch traffic → BLUE becomes LIVE
- Cycle continues

---

## 🎯 Key Takeaways

1. **Always check status first** - Know which is LIVE/STANDBY
2. **MCP handles routing** - You don't need to specify server names
3. **Test on STANDBY** - LIVE users never affected during testing
4. **Approve traffic switches** - Explicit confirmation required
5. **Either server can be LIVE** - BLUE/GREEN are equal partners

---

## 🔧 Troubleshooting

**"How do I know which server is LIVE?"**
- Run `mcp3_get_deployment_status`
- Check HAProxy state file: `ssh haproxy "cat /var/lib/haproxy/jw-deployment-state.json"`
- SSH to container and check bash prompt color

**"I deployed to the wrong server!"**
- If you used MCP, it deployed to STANDBY (correct)
- If you manually SSH'd, check which server you're on
- LIVE server should never be manually deployed to

**"Can I manually switch which is LIVE?"**
- Yes, use `mcp3_switch_traffic`
- Or manually update HAProxy config and state file
- Always update both HAProxy config AND state file

**"What if state file is wrong?"**
- MCP reads HAProxy config as source of truth
- State file is secondary
- If mismatch, HAProxy config wins

---

## 📚 Related Files

- `/var/lib/haproxy/jw-deployment-state.json` - State tracking
- `/etc/haproxy/haproxy.cfg` - HAProxy routing config
- `/opt/theoshift/.env.display` - Environment indicators
- `~/.bashrc` - Bash prompt colors (BLUE/GREEN)
- `mcp-blue-green/server.js` - MCP server logic

---

**Last Updated:** December 21, 2025
**Status:** ✅ Production Ready
