# Discoveries to Promote to Control Plane

## New Discoveries to Promote

### 🔒 Repository Security Pattern (2026-02-09)

**Discovery:** TheoShift repository contained sensitive infrastructure information (IPs, container IDs, SSH details, credentials) that would be exposed if opened to external contributors.

**Pattern Implemented:**

#### .gitignore Protection Strategy
```gitignore
# Infrastructure and deployment internals (sensitive information)
docs/deployment/*INFRASTRUCTURE*.md
docs/deployment/*INTERNAL*.md
scripts/*-internal.sh
scripts/show-admin-creds.sh
mcp-blue-green/config.json
mcp-blue-green/*-internal.*
```

#### File Classification System
- **Public files:** Source code, sanitized docs, templates
- **Private files:** Infrastructure configs, deployment scripts with IPs, credential scripts

#### Documentation Approach
- Created `SECURITY.md` - Security policy and guidelines
- Created sanitized `docs/deployment/DEPLOYMENT_GUIDE.md` for external contributors
- Removed tracked sensitive files (kept locally via .gitignore)
- Internal docs remain in `.windsurf/workflows/` and `.cloudy-work/` submodule

#### Protected Information Categories
1. Infrastructure details (IPs, container IDs, server names)
2. Credentials & secrets (passwords, API keys, SSH keys)
3. Access information (SSH commands, admin usernames)
4. Deployment specifics (server paths, PM2 configs, HAProxy rules)

**Benefits:**
- ✅ Enables safe external collaboration
- ✅ Protects internal infrastructure
- ✅ Maintains internal workflow without disruption
- ✅ Clear guidelines for contributors and maintainers
- ✅ Audit checklist for security reviews

**Recommendation:** Apply this pattern to all homelab application repositories (ldc-tools, quantshift, bni-chapter-toolkit) before opening to external contributors.

**Files to Promote:**
- `SECURITY.md` - Security policy template
- `.gitignore` patterns for sensitive files
- `docs/deployment/DEPLOYMENT_GUIDE.md` - Sanitized deployment guide template

**Status:** Ready for promotion  
**Priority:** High - Required before any repository goes public  
**Action Required:** Create governance policy and templates in control plane

---

## Promoted Items

(None yet)
