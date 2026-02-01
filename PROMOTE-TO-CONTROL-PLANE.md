# Promote to Control Plane

**Date:** 2026-02-01  
**Source Repo:** TheoShift  
**Promotion Type:** Bug Fix + Runbook Update

---

## 🐛 Critical Bug Fix: MCP Traffic Switch Not Working

### Summary
MCP `switch_traffic` tool reports success but doesn't actually update HAProxy configuration. This creates a dangerous mismatch where the state file shows traffic switched but HAProxy continues routing to the old backend.

### Root Cause
Configuration mismatch in `/shared/mcp-servers/homelab-blue-green-mcp/server.js`:
- MCP expects: `jw_attendant_blue/green` and `is_jw_attendant`
- HAProxy has: `theoshift_blue/green` and `is_theoshift`
- sed pattern doesn't match → config unchanged → state file updates incorrectly

### Impact
- **Severity:** HIGH - Traffic switching is broken for TheoShift
- **Workaround:** Manual sed commands (documented in runbook)
- **Affects:** All TheoShift deployments using MCP traffic switching

---

## 🔧 Required Changes

### File: `/shared/mcp-servers/homelab-blue-green-mcp/server.js`

#### Change 1: Line 37 (haproxyBackend)
```javascript
// BEFORE:
haproxyBackend: 'jw_attendant',

// AFTER:
haproxyBackend: 'theoshift',
```

#### Change 2: Lines 480-482 (isCondition)
```javascript
// BEFORE:
const isCondition = app === 'theoshift' ? 'is_jw_attendant' 
  : app === 'quantshift' ? 'is_quantshift'
  : 'is_ldc';

// AFTER:
const isCondition = app === 'theoshift' ? 'is_theoshift' 
  : app === 'quantshift' ? 'is_quantshift'
  : 'is_ldc_tools';
```

**Note:** Also fixed LDC Tools condition from `is_ldc` to `is_ldc_tools` to match HAProxy config.

---

## 🧪 Testing Steps

### Before Fix Verification
```bash
# Check current HAProxy routing
ssh root@10.92.3.26 "grep 'use_backend theoshift' /etc/haproxy/haproxy.cfg | grep 'if is_theoshift$'"
# Output: use_backend theoshift_green if is_theoshift

# Attempt MCP switch
mcp0_switch_traffic(app: "theoshift", requireApproval: false)
# MCP reports: "✅ TRAFFIC SWITCH COMPLETE!"

# Verify HAProxy config
ssh root@10.92.3.26 "grep 'use_backend theoshift' /etc/haproxy/haproxy.cfg | grep 'if is_theoshift$'"
# Output: use_backend theoshift_green if is_theoshift  # ❌ UNCHANGED
```

### After Fix Verification
```bash
# Check current HAProxy routing
ssh root@10.92.3.26 "grep 'use_backend theoshift' /etc/haproxy/haproxy.cfg | grep 'if is_theoshift$'"
# Output: use_backend theoshift_green if is_theoshift

# Attempt MCP switch
mcp0_switch_traffic(app: "theoshift", requireApproval: false)
# MCP reports: "✅ TRAFFIC SWITCH COMPLETE!"

# Verify HAProxy config
ssh root@10.92.3.26 "grep 'use_backend theoshift' /etc/haproxy/haproxy.cfg | grep 'if is_theoshift$'"
# Output: use_backend theoshift_blue if is_theoshift  # ✅ CHANGED

# Verify production URL
curl -s https://theoshift.com/api/version
# Should show BLUE server buildTime
```

---

## 📋 Runbook Update Required

### File: `/_cloudy-ops/runbooks/mcp-traffic-switch-bug.md`

**Update Status Section:**
```markdown
**Status:** ✅ FIXED (2026-02-01)
**Fix Applied:** MCP server configuration corrected to match HAProxy backend names
**Testing:** Verified traffic switching works correctly after fix
```

**Add Resolution Section:**
```markdown
## Resolution (2026-02-01)

**Root Cause:** Configuration mismatch between MCP server and HAProxy config
- MCP used legacy names: `jw_attendant` and `is_jw_attendant`
- HAProxy uses current names: `theoshift` and `is_theoshift`

**Fix Applied:**
- Updated `haproxyBackend` from `jw_attendant` to `theoshift`
- Updated `isCondition` from `is_jw_attendant` to `is_theoshift`
- Updated LDC Tools condition from `is_ldc` to `is_ldc_tools`

**Verification:**
- Tested traffic switching with MCP tool
- Confirmed HAProxy config updates correctly
- Confirmed production traffic switches as expected

**Manual workaround no longer needed for normal operations.**
```

---

## 📝 Decision to Add

### TheoShift: D-TS-022
```markdown
### D-TS-022: MCP Traffic Switch Bug Fixed
**Date:** 2026-02-01  
**Context:** MCP switch_traffic tool was using legacy backend names (jw_attendant) that didn't match actual HAProxy config (theoshift)  
**Decision:** Updated MCP server configuration to use correct backend and ACL names  
**Consequences:**
- Traffic switching now works correctly via MCP
- Manual workaround no longer needed
- State file and HAProxy config stay in sync
- Safer deployments with automated traffic switching
```

---

## 🔄 Distribution Steps

1. **Apply fix in Cloudy-Work control plane**
   - Edit `/shared/mcp-servers/homelab-blue-green-mcp/server.js`
   - Make both changes (lines 37 and 480-482)
   - Commit: `fix: correct TheoShift HAProxy backend and ACL names`

2. **Test the fix**
   - Run `mcp0_switch_traffic(app: "theoshift")`
   - Verify HAProxy config actually changes
   - Verify production URL reflects the switch

3. **Update runbook**
   - Mark bug as FIXED in `mcp-traffic-switch-bug.md`
   - Add resolution section with details

4. **Update all app repo submodules**
   - TheoShift: `git submodule update --remote .cloudy-work`
   - LDC Tools: `git submodule update --remote .cloudy-work`
   - QuantShift: `git submodule update --remote .cloudy-work`

5. **Add decision to TheoShift**
   - Add D-TS-022 to DECISIONS.md

---

## ✅ Success Criteria

- [ ] MCP server code updated in Cloudy-Work
- [ ] Traffic switching tested and working
- [ ] HAProxy config changes verified
- [ ] Runbook updated with resolution
- [ ] All app repo submodules updated
- [ ] Decision D-TS-022 added to TheoShift

---

**Priority:** HIGH - Fixes critical deployment infrastructure bug  
**Testing Required:** YES - Must verify traffic switching works  
**Breaking Change:** NO - Fix only, no API changes
