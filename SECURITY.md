# Security Policy

## 🔒 Repository Security Guidelines

This document outlines security practices for the TheoShift repository to protect sensitive infrastructure information while enabling external collaboration.

---

## 📁 File Classification

### Public Files (Safe for External Contributors)

These files are safe to commit and share publicly:

- ✅ Source code (`pages/`, `components/`, `lib/`, etc.)
- ✅ Public documentation (`README.md`, `CONTRIBUTING.md`)
- ✅ Test files (`tests/`, `__tests__/`)
- ✅ Configuration templates (`.env.example`, `.env.test.example`)
- ✅ Package manifests (`package.json`, `package-lock.json`)
- ✅ Build configurations (`next.config.js`, `tailwind.config.js`)
- ✅ Sanitized deployment guides (`docs/deployment/DEPLOYMENT_GUIDE.md`)

### Private Files (Internal Use Only)

These files contain sensitive information and are gitignored:

- ❌ Infrastructure configurations with IPs/credentials
- ❌ Deployment scripts with server details
- ❌ Admin credential display scripts
- ❌ Internal runbooks with infrastructure specifics
- ❌ Environment files with real credentials (`.env`, `.env.production`)
- ❌ MCP server configurations with internal details

---

## 🛡️ Protected Information

### Never Commit:

1. **Infrastructure Details**
   - Internal IP addresses (10.x.x.x, 192.168.x.x)
   - Container IDs and numbers
   - Server hostnames and SSH aliases
   - Port mappings and network configurations

2. **Credentials & Secrets**
   - Database passwords
   - API keys and tokens
   - SSH private keys
   - Email passwords
   - NextAuth secrets
   - Google Maps API keys (use environment variables)

3. **Access Information**
   - SSH commands with real IPs
   - Admin usernames and passwords
   - Database connection strings with credentials
   - VPN configurations

4. **Deployment Specifics**
   - Exact server paths (`/opt/theoshift`)
   - PM2 process names with environment indicators
   - HAProxy backend configurations
   - Load balancer routing rules

---

## 📋 .gitignore Patterns

The following patterns are configured in `.gitignore` to protect sensitive files:

```gitignore
# Infrastructure and deployment internals
docs/deployment/*INFRASTRUCTURE*.md
docs/deployment/*INTERNAL*.md
docs/deployment/THEOSHIFT_INFRASTRUCTURE_MIGRATION.md
scripts/show-admin-creds.sh
scripts/*-internal.sh
scripts/post-deploy-health-check.sh
mcp-blue-green/config.json
mcp-blue-green/*-internal.*

# Environment files
.env
.env.production
.env.local
.env.*

# PM2 config (server-specific)
ecosystem.config.js
```

---

## 🔐 Best Practices

### For Contributors

1. **Never commit credentials**
   - Use `.env` files (already gitignored)
   - Reference `.env.example` for required variables
   - Use placeholder values in documentation

2. **Sanitize documentation**
   - Use generic examples (e.g., `your-server.com` instead of real domains)
   - Replace IPs with placeholders (e.g., `<server-ip>`)
   - Avoid specific infrastructure details

3. **Review before committing**
   - Check `git diff` for sensitive information
   - Use `git status` to verify tracked files
   - Run `git log -p` to review commit history

### For Maintainers

1. **Keep internal docs local**
   - Store infrastructure docs in gitignored directories
   - Use naming conventions (`*-internal.md`, `*INFRASTRUCTURE*.md`)
   - Maintain separate private repository for sensitive documentation

2. **Use environment variables**
   - All secrets in `.env` files
   - Never hardcode credentials in source code
   - Use `process.env.VARIABLE_NAME` in code

3. **Separate public and private**
   - Create sanitized versions of deployment guides
   - Reference private docs in maintainer-only locations
   - Use `.windsurf/workflows/` for internal procedures

---

## 🚨 If Sensitive Information is Committed

### Immediate Actions

1. **Do NOT just delete the file**
   - Git history retains deleted files
   - Simple deletion is insufficient

2. **Remove from Git history**
   ```bash
   # Remove file from all commits
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch path/to/sensitive/file" \
     --prune-empty --tag-name-filter cat -- --all
   
   # Force push (coordinate with team first!)
   git push origin --force --all
   ```

3. **Rotate compromised credentials**
   - Change any exposed passwords immediately
   - Regenerate API keys
   - Update SSH keys if exposed

4. **Notify team**
   - Alert all maintainers
   - Document the incident
   - Review security practices

---

## 🔍 Security Audit Checklist

Before making repository public or adding external contributors:

- [ ] Review all markdown files for IPs and credentials
- [ ] Check scripts for hardcoded server details
- [ ] Verify `.gitignore` covers all sensitive patterns
- [ ] Confirm `.env` files are not tracked
- [ ] Review git history for accidentally committed secrets
- [ ] Create sanitized versions of deployment documentation
- [ ] Document internal documentation locations for maintainers
- [ ] Test repository clone as external contributor
- [ ] Verify submodules are private (`.cloudy-work/`)

---

## 📚 Related Documentation

- **Contributing Guide:** `CONTRIBUTING.md` - External contributor guidelines
- **Deployment Guide:** `docs/deployment/DEPLOYMENT_GUIDE.md` - Public deployment overview
- **Internal Docs:** `.windsurf/workflows/` - Maintainer-only procedures (local)

---

## 📞 Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT open a public issue**
2. Contact the project maintainer directly
3. Provide detailed information about the vulnerability
4. Allow time for the issue to be addressed before disclosure

---

## 🔄 Regular Security Reviews

Maintainers should:
- Review `.gitignore` quarterly
- Audit repository for sensitive information
- Rotate credentials regularly
- Update security documentation as needed
- Train new maintainers on security practices

---

**Last Updated:** February 9, 2026  
**Version:** 1.0.0
