# JW Attendant Scheduler - Deployment Guide

## Quick Start

### Production Deployment
```bash
./deploy-jw-attendant.sh production
```

### Staging Deployment
```bash
./deploy-jw-attendant.sh staging
```

### Emergency Rollback
```bash
./rollback.sh production
```

## Initial Setup

### 1. Set Up Staging Environment
```bash
./setup-staging.sh
```

### 2. Configure Git Hooks (Optional)
```bash
# Copy git hook to repository
cp git-deploy-hook.sh .git/hooks/post-commit
chmod +x .git/hooks/post-commit
```

## Infrastructure

### Production Environment
- **Server**: LXC 132 (10.92.3.22:8000)
- **SSH Alias**: `jwa`
- **Service**: `systemd jw-attendant.service`
- **Database**: SQLite at `/opt/jw-attendant/db.sqlite3`

### Staging Environment
- **Server**: LXC 133 (10.92.3.23:8000)
- **SSH Alias**: `jw-staging`
- **Service**: `systemd jw-attendant.service`
- **Database**: SQLite at `/opt/jw-attendant/db.sqlite3`

## Deployment Process

### Automated Steps
1. **Backup**: Creates timestamped backup of current deployment
2. **Sync**: Syncs code excluding sensitive files (venv, db, .env)
3. **Dependencies**: Updates Python packages from requirements.txt
4. **Migrations**: Runs Django database migrations
5. **Static Files**: Collects static files for production
6. **Service Restart**: Restarts the systemd service
7. **Health Check**: Verifies service is responding

### Manual Verification
After deployment, verify:
- Service status: `ssh jwa "systemctl status jw-attendant"`
- Application response: `ssh jwa "curl -I http://localhost:8000"`
- Logs: `ssh jwa "journalctl -u jw-attendant -f"`

## Troubleshooting

### Common Issues

#### Service Won't Start
```bash
ssh jwa "journalctl -u jw-attendant --no-pager"
ssh jwa "cd /opt/jw-attendant && source venv/bin/activate && python manage.py check"
```

#### Database Issues
```bash
ssh jwa "cd /opt/jw-attendant && source venv/bin/activate && python manage.py showmigrations"
ssh jwa "ls -la /opt/jw-attendant/db.sqlite3*"
```

#### Permission Issues
```bash
ssh jwa "chown -R jwscheduler:jwscheduler /opt/jw-attendant"
ssh jwa "chmod +x /opt/jw-attendant/manage.py"
```

### Emergency Procedures

#### Quick Rollback
```bash
./rollback.sh production
```

#### Manual Rollback
```bash
ssh jwa "systemctl stop jw-attendant"
ssh jwa "mv /opt/jw-attendant /opt/jw-attendant.failed"
ssh jwa "mv /opt/jw-attendant.backup.YYYYMMDD_HHMMSS /opt/jw-attendant"
ssh jwa "systemctl start jw-attendant"
```

#### Database Recovery
```bash
ssh jwa "cd /opt/jw-attendant && cp db.sqlite3.backup db.sqlite3"
ssh jwa "systemctl restart jw-attendant"
```

## Monitoring

### Service Health
```bash
# Service status
ssh jwa "systemctl status jw-attendant"

# Application health
ssh jwa "curl -f http://localhost:8000"

# Resource usage
ssh jwa "htop -p \$(pgrep -f gunicorn)"
```

### Logs
```bash
# Real-time logs
ssh jwa "journalctl -u jw-attendant -f"

# Recent logs
ssh jwa "journalctl -u jw-attendant --since '1 hour ago'"
```

## Development Workflow

### Recommended Process
1. **Local Development**: Make changes locally
2. **Local Testing**: `python manage.py runserver`
3. **Deploy to Staging**: `./deploy-jw-attendant.sh staging`
4. **Staging Testing**: Verify at http://10.92.3.23:8000
5. **Deploy to Production**: `./deploy-jw-attendant.sh production`

### Git Integration
- **Main branch**: Auto-deploys to staging (if git hook enabled)
- **Production branch**: Auto-deploys to production (if git hook enabled)
- **Feature branches**: Manual deployment only

## Security Notes

- SSH keys are used for authentication
- Database backups are created before each deployment
- Sensitive files (.env, db.sqlite3) are excluded from sync
- Service runs under dedicated user account
