#!/bin/bash

# JW Attendant Scheduler - Staging to Production Deployment Script
# This script deploys the staging environment to production with rollback capability

set -e  # Exit on any error

# Configuration
STAGING_HOST="10.92.3.22"
PRODUCTION_HOST="10.92.3.23"
APP_PATH="/opt/jw-attendant-production"
STAGING_PATH="/opt/jw-attendant-staging"
BACKUP_PATH="/opt/backups"
SERVICE_NAME="jw-attendant-production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Function to create backup
create_backup() {
    local backup_name="jw-attendant-$(date +%Y%m%d_%H%M%S)"
    log "Creating backup: $backup_name"
    
    ssh root@$PRODUCTION_HOST "
        mkdir -p $BACKUP_PATH
        if [ -d $APP_PATH ]; then
            cp -r $APP_PATH $BACKUP_PATH/$backup_name
            echo $backup_name > $BACKUP_PATH/latest_backup.txt
            log 'Backup created successfully'
        else
            warn 'No existing production deployment found'
        fi
    "
}

# Function to sync staging to production
sync_staging_to_production() {
    log "Syncing staging to production..."
    
    # Ensure production directory exists
    ssh root@$PRODUCTION_HOST "mkdir -p $APP_PATH"
    
    # Sync files from staging to production
    ssh root@$STAGING_HOST "
        cd $STAGING_PATH
        rsync -avz \
            --exclude='venv/' \
            --exclude='__pycache__/' \
            --exclude='*.pyc' \
            --exclude='.git/' \
            --exclude='db.sqlite3' \
            --exclude='logs/' \
            --exclude='.env' \
            . root@$PRODUCTION_HOST:$APP_PATH/
    "
    
    log "File sync completed"
}

# Function to run database migrations
run_migrations() {
    log "Running database migrations on production..."
    
    ssh root@$PRODUCTION_HOST "
        cd $APP_PATH
        source venv/bin/activate
        python3 manage.py migrate --noinput
    "
    
    log "Database migrations completed"
}

# Function to collect static files
collect_static() {
    log "Collecting static files..."
    
    ssh root@$PRODUCTION_HOST "
        cd $APP_PATH
        source venv/bin/activate
        python3 manage.py collectstatic --noinput
    "
    
    log "Static files collected"
}

# Function to restart production service
restart_service() {
    log "Restarting production service..."
    
    ssh root@$PRODUCTION_HOST "systemctl restart $SERVICE_NAME"
    
    log "Service restarted"
}

# Function to perform health check
health_check() {
    log "Performing health check..."
    
    # Wait for service to start
    sleep 10
    
    # Check if service is running
    if ssh root@$PRODUCTION_HOST "systemctl is-active --quiet $SERVICE_NAME"; then
        log "Service is running"
        
        # Check HTTP endpoint
        if curl -f -s http://$PRODUCTION_HOST:8000/ > /dev/null; then
            log "✅ Health check passed - Production deployment successful"
            return 0
        else
            error "HTTP health check failed"
            return 1
        fi
    else
        error "Service is not running"
        return 1
    fi
}

# Function to rollback deployment
rollback() {
    error "Deployment failed, initiating rollback..."
    
    local latest_backup=$(ssh root@$PRODUCTION_HOST "cat $BACKUP_PATH/latest_backup.txt 2>/dev/null || echo ''")
    
    if [ -n "$latest_backup" ] && ssh root@$PRODUCTION_HOST "[ -d $BACKUP_PATH/$latest_backup ]"; then
        log "Rolling back to: $latest_backup"
        
        ssh root@$PRODUCTION_HOST "
            rm -rf $APP_PATH
            cp -r $BACKUP_PATH/$latest_backup $APP_PATH
            systemctl restart $SERVICE_NAME
        "
        
        log "Rollback completed"
    else
        error "No backup found for rollback"
    fi
}

# Function to show deployment status
show_status() {
    log "=== Deployment Status ==="
    echo "Staging Environment: http://$STAGING_HOST:8001"
    echo "Production Environment: http://$PRODUCTION_HOST:8000"
    echo ""
    
    # Check staging status
    if curl -f -s http://$STAGING_HOST:8001/ > /dev/null; then
        echo "✅ Staging: Online"
    else
        echo "❌ Staging: Offline"
    fi
    
    # Check production status
    if curl -f -s http://$PRODUCTION_HOST:8000/ > /dev/null; then
        echo "✅ Production: Online"
    else
        echo "❌ Production: Offline"
    fi
}

# Main deployment function
deploy() {
    log "🚀 Starting deployment from staging to production"
    
    # Pre-deployment checks
    log "Performing pre-deployment checks..."
    
    # Check staging is accessible
    if ! ssh root@$STAGING_HOST "echo 'Staging accessible'"; then
        error "Cannot access staging server"
        exit 1
    fi
    
    # Check production is accessible
    if ! ssh root@$PRODUCTION_HOST "echo 'Production accessible'"; then
        error "Cannot access production server"
        exit 1
    fi
    
    # Check staging service is running
    if ! ssh root@$STAGING_HOST "systemctl is-active --quiet jw-attendant-staging"; then
        error "Staging service is not running"
        exit 1
    fi
    
    log "Pre-deployment checks passed"
    
    # Create backup
    create_backup
    
    # Deploy
    if sync_staging_to_production && \
       run_migrations && \
       collect_static && \
       restart_service && \
       health_check; then
        
        log "🎉 Deployment completed successfully!"
        show_status
        
    else
        error "Deployment failed"
        rollback
        exit 1
    fi
}

# Script usage
usage() {
    echo "Usage: $0 [deploy|status|rollback]"
    echo ""
    echo "Commands:"
    echo "  deploy   - Deploy staging to production"
    echo "  status   - Show current deployment status"
    echo "  rollback - Rollback to previous deployment"
    echo ""
}

# Main script logic
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "status")
        show_status
        ;;
    "rollback")
        rollback
        ;;
    *)
        usage
        exit 1
        ;;
esac
