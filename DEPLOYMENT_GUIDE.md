# JW Attendant Scheduler - Deployment Guide

## Infrastructure Overview

### Proxmox Environment
- **Staging Environment**: `jw-staging` (10.92.3.22:8001)
- **Production Environment**: `jwa` (10.92.3.23:8000)
- **Database**: PostgreSQL on `jw-postgres` (10.92.3.21:5432)

## Development Workflow

### 1. Local Development → Staging
All local development changes are synced to staging environment:

```bash
# Sync local changes to staging
rsync -avz --exclude='.git' --exclude='venv' --exclude='__pycache__' --exclude='*.pyc' \
  /Users/cory/Documents/Cloudy-Work/applications/jw-attendant-scheduler/ \
  jw-staging:/opt/jw-attendant-staging/

# Restart staging service
ssh jw-staging 'systemctl restart jw-attendant-staging'
```

### 2. Staging → Production Deployment

#### Manual Deployment
```bash
# Run deployment script
./scripts/deploy_staging_to_production.sh deploy

# Check deployment status
./scripts/deploy_staging_to_production.sh status

# Rollback if needed
./scripts/deploy_staging_to_production.sh rollback
```

#### Automated CI/CD
- **GitHub Actions**: `.github/workflows/staging-to-production.yml`
- **Triggers**: Push to `main` branch or manual workflow dispatch
- **Process**: Backup → Sync → Migrate → Restart → Health Check → Rollback on failure

## Environment Details

### Staging Environment (jw-staging)
- **Host**: 10.92.3.22
- **Port**: 8001
- **Service**: `jw-attendant-staging.service`
- **Path**: `/opt/jw-attendant-staging/`
- **Database**: PostgreSQL (shared with production)
- **Health Check**: `http://10.92.3.22:8001/health/`

### Production Environment (jwa)
- **Host**: 10.92.3.23
- **Port**: 8000
- **Service**: `jw-attendant-production.service`
- **Path**: `/opt/jw-attendant-production/`
- **Database**: PostgreSQL (shared with staging)
- **Health Check**: `http://10.92.3.23:8000/health/`

### Database Environment (jw-postgres)
- **Host**: 10.92.3.21
- **Port**: 5432
- **Database**: `jw_attendant_scheduler`
- **Shared**: Both staging and production use same database

## Multi-Agent Development Framework

### Active Agents
The project uses a 7-agent cooperative development system:

1. **Lead Architect Agent** - Coordination & architecture
2. **Backend Agent** - API development (114 endpoints)
3. **Frontend Agent** - UI/UX (194 components)
4. **Testing Agent** - Quality assurance
5. **Security Agent** - Security requirements
6. **Performance Agent** - Performance optimization
7. **QA Agent** - Error prevention and validation

### Agent Configuration
- **Location**: `.windsurf/agents/`
- **Manifest**: `agent_manifest.json`
- **Spawning**: Use `/spawn-agents` workflow command

## Deployment Process

### Pre-Deployment Checklist
- [ ] All tests passing locally
- [ ] Code committed to feature branch
- [ ] Staging environment tested
- [ ] Database migrations reviewed
- [ ] Security scan completed

### Deployment Steps
1. **Backup Production**
   ```bash
   ssh root@10.92.3.23 'cd /opt && cp -r jw-attendant-production /opt/backups/jw-attendant-$(date +%Y%m%d_%H%M%S)'
   ```

2. **Sync Staging to Production**
   ```bash
   ssh root@10.92.3.22 'cd /opt/jw-attendant-staging && rsync -avz --exclude=venv --exclude=__pycache__ --exclude=.git . root@10.92.3.23:/opt/jw-attendant-production/'
   ```

3. **Run Migrations**
   ```bash
   ssh root@10.92.3.23 'cd /opt/jw-attendant-production && source venv/bin/activate && python3 manage.py migrate'
   ```

4. **Collect Static Files**
   ```bash
   ssh root@10.92.3.23 'cd /opt/jw-attendant-production && source venv/bin/activate && python3 manage.py collectstatic --noinput'
   ```

5. **Restart Service**
   ```bash
   ssh root@10.92.3.23 'systemctl restart jw-attendant-production'
   ```

6. **Health Check**
   ```bash
   curl -f http://10.92.3.23:8000/health/
   ```

### Rollback Procedure
If deployment fails, automatic rollback restores the latest backup:

```bash
# Find latest backup
BACKUP=$(ssh root@10.92.3.23 'ls -t /opt/backups/jw-attendant-* | head -1')

# Restore from backup
ssh root@10.92.3.23 "cd /opt && rm -rf jw-attendant-production && cp -r $BACKUP jw-attendant-production"

# Restart service
ssh root@10.92.3.23 'systemctl restart jw-attendant-production'
```

## Monitoring & Health Checks

### Health Endpoints
- **Staging**: `http://10.92.3.22:8001/health/`
- **Production**: `http://10.92.3.23:8000/health/`

### Service Status
```bash
# Check staging
ssh jw-staging 'systemctl status jw-attendant-staging'

# Check production
ssh jwa 'systemctl status jw-attendant-production'

# Check database
ssh jw-postgres 'systemctl status postgresql'
```

### Log Monitoring
```bash
# Staging logs
ssh jw-staging 'journalctl -u jw-attendant-staging -f'

# Production logs
ssh jwa 'journalctl -u jw-attendant-production -f'
```

## Security Considerations

### SSH Access
- Key-based authentication required
- SSH shortcuts configured: `jw-staging`, `jwa`, `jw-postgres`
- No password authentication

### Database Security
- PostgreSQL with restricted access
- SSL connections enforced
- Regular backup schedule

### Application Security
- CSRF protection enabled
- XSS protection implemented
- Secure session management
- Rate limiting on authentication

## Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check logs
journalctl -u jw-attendant-staging -n 50

# Check configuration
python3 manage.py check

# Test manually
cd /opt/jw-attendant-staging && source venv/bin/activate && python3 manage.py runserver 0.0.0.0:8002
```

#### Database Connection Issues
```bash
# Test database connection
ssh jw-postgres 'sudo -u postgres psql -c "\l"'

# Check network connectivity
ping 10.92.3.21
```

#### Performance Issues
```bash
# Check resource usage
htop

# Monitor database queries
ssh jw-postgres 'sudo -u postgres psql jw_attendant_scheduler -c "SELECT * FROM pg_stat_activity;"'
```

## Maintenance

### Regular Tasks
- **Daily**: Monitor logs and performance
- **Weekly**: Review security updates
- **Monthly**: Database maintenance and optimization
- **Quarterly**: Full security audit

### Backup Strategy
- **Automatic**: Daily database backups
- **Manual**: Pre-deployment application backups
- **Retention**: 30 days for database, 7 days for application

This deployment guide ensures consistent, reliable deployments from staging to production with proper rollback capabilities and monitoring.
