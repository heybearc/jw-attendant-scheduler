#!/bin/bash
# rollback.sh - Emergency rollback script for JW Attendant Scheduler

set -e

REMOTE_HOST="jwa"
REMOTE_PATH="/opt/jw-attendant"
SERVICE_NAME="jw-attendant"

# Parse environment argument
ENVIRONMENT=${1:-production}

if [[ "$ENVIRONMENT" == "staging" ]]; then
    REMOTE_HOST="jw-staging"
    echo "🎭 Rolling back STAGING environment..."
else
    echo "🚨 Rolling back PRODUCTION environment..."
fi

echo "🔄 Target: $REMOTE_HOST:$REMOTE_PATH"
echo ""

# Find latest backup
echo "🔍 Finding latest backup..."
LATEST_BACKUP=$(ssh $REMOTE_HOST "ls -1t ${REMOTE_PATH}.backup.* 2>/dev/null | head -1" || echo "")

if [[ -z "$LATEST_BACKUP" ]]; then
    echo "❌ No backup found! Cannot rollback."
    exit 1
fi

echo "📦 Latest backup: $LATEST_BACKUP"
echo ""

# Confirm rollback
read -p "⚠️  Are you sure you want to rollback to $LATEST_BACKUP? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Rollback cancelled"
    exit 1
fi

# Stop service
echo "🛑 Stopping service..."
ssh $REMOTE_HOST "systemctl stop $SERVICE_NAME"

# Backup current (failed) version
echo "💾 Backing up current version..."
ssh $REMOTE_HOST "mv $REMOTE_PATH ${REMOTE_PATH}.failed.$(date +%Y%m%d_%H%M%S)"

# Restore from backup
echo "🔄 Restoring from backup..."
ssh $REMOTE_HOST "cp -r $LATEST_BACKUP $REMOTE_PATH"

# Start service
echo "🚀 Starting service..."
ssh $REMOTE_HOST "systemctl start $SERVICE_NAME"

# Verify rollback
echo "🔍 Verifying rollback..."
sleep 5
ssh $REMOTE_HOST "systemctl status $SERVICE_NAME --no-pager"
ssh $REMOTE_HOST "curl -f http://localhost:8000 > /dev/null && echo '✅ Service is responding after rollback'" || echo "❌ Service health check failed after rollback"

echo ""
echo "✅ Rollback to $ENVIRONMENT completed!"
echo "🌐 Application available at: http://10.92.3.22:8000"
