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
