# Discoveries to Promote to Control Plane

## Workflow Improvements

### /release Workflow - Remove Redundant Approval (2026-02-02)

**Issue:** The `/release` workflow has redundant approval steps:
1. User runs `/release` (approval #1)
2. Shell script asks for confirmation (approval #2)
3. MCP `switch_traffic` asks for approval (approval #3)

**Problems:**
- Shell script (`switch-traffic.sh`) doesn't reliably switch traffic
- MCP server is more reliable but asks for approval again
- Three approval points for one operation is excessive

**Recommendation:**
1. Remove shell script call from `/release` workflow entirely
2. Use MCP `mcp0_switch_traffic` with `requireApproval=false`
3. Trust that running `/release` is the approval

**Rationale:**
- Running `/release` is explicit approval to switch traffic
- Tests already passed (prerequisite check)
- Version bump already committed
- One approval point is sufficient

**Proposed Change:**
```markdown
# In /release workflow, replace:
./_cloudy-ops/scripts/switch-traffic.sh [app-name]

# With:
mcp0_switch_traffic with requireApproval=false
```

**Benefits:**
- More reliable traffic switching
- Cleaner user experience
- No redundant confirmations
- Consistent with workflow intent

**Files to Update:**
- `.cloudy-work/_cloudy-ops/workflows/release.md`

---

## NEXTAUTH Configuration for Blue-Green Deployments (2026-02-05)

**Context:** When deploying Next.js apps with NextAuth.js in blue-green environments, authentication redirects can expose internal node URLs (blue.domain.com, green.domain.com) instead of the public domain (domain.com).

**Problem:**
- Users see internal infrastructure URLs during login/logout
- Session cookies tied to wrong domain
- Direct node testing breaks when NEXTAUTH_URL points to public domain
- Not following industry standards for containerized environments

**Solution - Dual-URL Pattern:**

```bash
# Both BLUE and GREEN .env files:
NEXTAUTH_URL=https://domain.com              # Public-facing domain (for redirects)
NEXTAUTH_URL_INTERNAL=http://localhost:3001  # Internal container URL (for API calls)
```

**How It Works:**
- `NEXTAUTH_URL` - Used for external redirects (what users see in browser)
- `NEXTAUTH_URL_INTERNAL` - Used for internal API calls (container-to-container)
- NextAuth automatically uses the correct URL based on context
- HAProxy/load balancer routes public domain to current LIVE node

**Benefits:**
✅ Public users always see public domain (domain.com)  
✅ Direct node testing still works (blue.domain.com, green.domain.com)  
✅ Blue-green traffic switching is seamless  
✅ Internal API calls use localhost (no external network hops)  
✅ Industry-standard pattern (Docker, Kubernetes, Vercel, AWS ECS)  
✅ Official NextAuth.js best practice for proxied environments

**Implementation Steps:**

1. **Update .env on both nodes:**
   ```bash
   ssh blue-node "cd /opt/app && echo 'NEXTAUTH_URL_INTERNAL=http://localhost:3001' >> .env"
   ssh green-node "cd /opt/app && echo 'NEXTAUTH_URL_INTERNAL=http://localhost:3001' >> .env"
   ```

2. **Verify NEXTAUTH_URL is set to public domain:**
   ```bash
   ssh blue-node "grep NEXTAUTH_URL /opt/app/.env"
   # Should show: NEXTAUTH_URL=https://domain.com
   ```

3. **Restart both nodes:**
   ```bash
   ssh blue-node "pm2 restart app-blue"
   ssh green-node "pm2 restart app-green"
   ```

**Testing:**
- Public access: Visit https://domain.com/auth/signin → Should stay on domain.com
- Direct node: Visit https://blue.domain.com/auth/signin → Should work for testing
- Verify session cookies are set for correct domain

**Applies To:**
- TheoShift ✅ (Implemented 2026-02-05)
- LDC Tools (Recommended)
- QuantShift (Recommended)
- Any Next.js app with NextAuth.js in blue-green deployment

**Reference:**
- NextAuth.js docs: https://next-auth.js.org/configuration/options#nextauth_url_internal
- Pattern used by: Vercel, AWS ECS, Kubernetes, Docker Swarm

**Files to Create in Control Plane:**
- `.cloudy-work/_cloudy-ops/runbooks/nextauth-blue-green-config.md`
- Add to `.cloudy-work/_cloudy-ops/context/DECISIONS.md` as D-013 or next available number
