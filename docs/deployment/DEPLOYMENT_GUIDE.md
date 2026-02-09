# TheoShift Deployment Guide

**For External Contributors**

This guide provides an overview of the deployment process for TheoShift. For internal infrastructure details and credentials, maintainers should refer to private documentation.

---

## 🏗️ Architecture Overview

TheoShift uses a **blue-green deployment architecture** with the following components:

- **Blue Environment** - One of two production-ready environments
- **Green Environment** - One of two production-ready environments
- **PostgreSQL Database** - Shared database server
- **Load Balancer** - Routes traffic between environments
- **Testing Container** - Dedicated E2E testing environment

At any time, one environment is **LIVE** (serving production traffic) and the other is **STANDBY** (ready for deployment and testing).

---

## 🔄 Deployment Workflow

### 1. Development Phase

```bash
# Local development
npm run dev

# Run tests locally
npm run test:e2e

# Commit changes
git add .
git commit -m "feat: your feature description"
git push origin main
```

### 2. Deploy to STANDBY

The deployment system automatically:
- Pulls latest code from main branch
- Installs dependencies
- Runs database migrations (if needed)
- Builds the application
- Restarts the application server
- Performs health checks

### 3. Test STANDBY Environment

**Automated E2E Testing:**
- Tests run from dedicated testing container
- Tests target STANDBY environment
- Must achieve 98%+ pass rate
- Tests cover all critical user flows

**Test Categories:**
- Authentication and authorization
- Event management CRUD operations
- Volunteer management
- Position and assignment workflows
- Location Library features
- UI/UX verification
- Mobile responsiveness
- Performance benchmarks

### 4. Switch Traffic to STANDBY

Once tests pass:
- Load balancer switches traffic to STANDBY
- STANDBY becomes new LIVE
- Previous LIVE becomes new STANDBY
- Zero downtime during switch
- Automated health checks verify new LIVE

### 5. Sync New STANDBY

After successful traffic switch:
- New STANDBY is synced with LIVE code
- Both environments run identical code
- System ready for next deployment cycle

---

## 🧪 Testing Requirements

### Pre-Deployment Testing

All deployments must pass:
- ✅ Unit tests (Jest)
- ✅ E2E tests (Playwright) - 98%+ pass rate
- ✅ Linting (ESLint)
- ✅ Type checking (TypeScript)

### Post-Deployment Verification

After traffic switch:
- ✅ Health check endpoints respond
- ✅ Database connectivity verified
- ✅ Critical user flows tested
- ✅ No console errors in production

---

## 🗄️ Database Migrations

### Running Migrations

Migrations are managed by Prisma:

```bash
# Create a new migration
npx prisma migrate dev --name descriptive-name

# Apply migrations to production
npx prisma migrate deploy
```

### Migration Best Practices

- ✅ Always test migrations on STANDBY first
- ✅ Create backward-compatible migrations when possible
- ✅ Document breaking changes in release notes
- ✅ Plan for rollback scenarios
- ✅ Backup database before major schema changes

---

## 📊 Monitoring & Health Checks

### Application Health

The application exposes health check endpoints:
- `/api/health` - Basic health check
- `/api/health/db` - Database connectivity

### Monitoring

Production monitoring includes:
- Application uptime
- Response times
- Error rates
- Database performance
- Resource utilization (CPU, memory)

---

## 🔧 Environment Configuration

### Required Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/theoshift"

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret-key"

# Email (optional)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
EMAIL_FROM="TheoShift <your-email@gmail.com>"

# Google Maps (for Location Library)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

### Environment-Specific Configuration

Each environment (LIVE/STANDBY) has its own:
- `.env` file with environment-specific values
- PM2 ecosystem configuration
- Nginx/HAProxy routing rules

---

## 🚨 Rollback Procedures

### When to Rollback

Rollback if:
- Critical bugs discovered in production
- Performance degradation detected
- Data integrity issues
- Failed health checks

### Rollback Process

1. **Emergency Traffic Switch**
   - Switch load balancer back to previous LIVE
   - Immediate restoration of service

2. **Investigate Issues**
   - Review logs and error reports
   - Identify root cause
   - Plan fix or revert

3. **Fix and Redeploy**
   - Apply fixes to code
   - Test thoroughly on STANDBY
   - Deploy when ready

---

## 📝 Release Notes

All deployments must include:
- Version number (semantic versioning)
- Feature descriptions
- Bug fixes
- Breaking changes (if any)
- Migration instructions (if needed)

Release notes are stored in `release-notes/` directory.

---

## 🔐 Security Considerations

### Secrets Management

- ❌ Never commit secrets to git
- ✅ Use environment variables
- ✅ Rotate credentials regularly
- ✅ Use strong, unique passwords
- ✅ Enable 2FA where possible

### Access Control

- Deployment access limited to maintainers
- SSH keys required for server access
- Database credentials stored securely
- API keys managed through environment variables

---

## 👥 For Maintainers

### Internal Documentation

Maintainers have access to:
- Infrastructure configuration details
- Server IP addresses and credentials
- SSH access documentation
- MCP deployment automation
- Detailed runbooks and procedures

**Contact the project maintainer for access to internal documentation.**

---

## 📚 Additional Resources

- **Contributing Guide:** `CONTRIBUTING.md`
- **Testing Policy:** `TESTING-POLICY.md`
- **Architectural Decisions:** `DECISIONS.md`
- **Release Notes:** `release-notes/`
- **API Documentation:** `pages/api/`

---

## 🆘 Support

For deployment issues:
1. Check application logs
2. Review health check endpoints
3. Verify environment variables
4. Contact maintainers for infrastructure access

---

**Last Updated:** February 9, 2026  
**Version:** 4.2.0
