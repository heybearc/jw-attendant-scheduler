# DevOps/Infrastructure Agent - JW Attendant Scheduler

## Agent Responsibilities
Deployment automation, infrastructure management, monitoring, and production environment optimization.

**Infrastructure Integration**: Always reference `/auto-load-infra-spec` workflow for homelab context and use SSH shortcuts with proper key authentication.

## Current Focus Areas

### 1. Staging Environment Validation
**Priority:** High
**Location:** `deployment/` and Proxmox infrastructure
**Requirements:**
- Ensure staging mirrors production exactly
- Validate PostgreSQL database connectivity
- Test deployment pipeline automation
- Monitor service health and performance

### 2. Production Environment Optimization
**Priority:** High
**Location:** LXC containers and deployment scripts
**Requirements:**
- Optimize Gunicorn configuration
- Implement proper logging and monitoring
- Set up automated backups
- Configure SSL/TLS and security headers

### 3. CI/CD Pipeline Development
**Priority:** Medium
**Location:** `.github/workflows/` and deployment scripts
**Requirements:**
- Automated testing on pull requests
- Staging deployment automation
- Production deployment with rollback capability
- Database migration automation

## Current Tasks

### Phase 1: Environment Validation
- [ ] Verify staging environment functionality
- [ ] Test database connectivity and performance
- [ ] Validate deployment script automation
- [ ] Monitor service health metrics
- [ ] Document infrastructure specifications
- [ ] Create environment comparison report

### Phase 2: Production Optimization
- [ ] Optimize Gunicorn worker configuration
- [ ] Implement comprehensive logging
- [ ] Set up automated database backups
- [ ] Configure monitoring and alerting
- [ ] Implement security hardening
- [ ] Create disaster recovery procedures

### Phase 3: Automation Pipeline
- [ ] Set up GitHub Actions workflows
- [ ] Create automated testing pipeline
- [ ] Implement blue-green deployments
- [ ] Add database migration automation
- [ ] Create rollback procedures
- [ ] Document deployment processes

## Technical Specifications

### SSH Access Configuration
```bash
# SSH shortcuts for infrastructure access
ssh jw-staging     # LXC 134 (10.92.3.24) - Staging environment
ssh jw-production  # LXC 132 (10.92.3.22) - Production environment
ssh postgres-db    # LXC 131 (10.92.3.21) - PostgreSQL database
```

### Infrastructure Stack
```yaml
# Production Environment
- Host: LXC 132 (10.92.3.22:8000)
- Database: PostgreSQL on LXC 131 (10.92.3.21)
- Web Server: Gunicorn + Nginx proxy
- Network: vmbr0923 bridge

# Staging Environment  
- Host: LXC 134 (10.92.3.24:8001)
- Database: PostgreSQL on LXC 131 (10.92.3.21)
- Web Server: Gunicorn
- External URL: https://jw-staging.cloudigan.net/
```

### Deployment Pipeline
```bash
#!/bin/bash
# deployment/deploy.sh
deploy_to_environment() {
    local env=$1
    # 1. Run tests
    # 2. Backup database
    # 3. Deploy code
    # 4. Run migrations
    # 5. Restart services
    # 6. Health check
}
```

## Integration Points
- **Backend Agent**: Database migrations and service deployment
- **Frontend Agent**: Static file optimization and CDN setup
- **Testing Agent**: Automated testing in CI/CD pipeline
- **Documentation Agent**: Deployment and maintenance guides

## Success Metrics
- Deployment success rate > 99%
- Zero-downtime deployments
- Service uptime > 99.9%
- Database backup success rate 100%
- Security scan pass rate 100%
