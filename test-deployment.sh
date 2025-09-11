#!/bin/bash
# test-deployment.sh - Test deployment pipeline without affecting production

set -e

LOCAL_PATH="/Users/cory/Documents/Cloudy-Work/applications/jw-attendant-scheduler"
REMOTE_HOST="jwa"
REMOTE_PATH="/opt/jw-attendant"

echo "🧪 Testing deployment pipeline..."
echo "📦 Source: $LOCAL_PATH"
echo "🎯 Target: $REMOTE_HOST:$REMOTE_PATH"
echo ""

# 1. Test SSH connectivity
echo "🔗 Testing SSH connectivity..."
if ssh $REMOTE_HOST "echo 'SSH connection successful'" 2>/dev/null; then
    echo "✅ SSH connection working"
else
    echo "❌ SSH connection failed - checking container status..."
    ssh prox "pct status 132" || echo "Container may be stopped"
    exit 1
fi

# 2. Test rsync dry-run
echo "📤 Testing code sync (dry-run)..."
rsync -avz --dry-run --exclude='*.pyc' --exclude='__pycache__' --exclude='.git' \
    --exclude='venv' --exclude='db.sqlite3' --exclude='.env' \
    --exclude='*.backup*' --exclude='deploy-*.sh' --exclude='test-*.sh' \
    $LOCAL_PATH/ $REMOTE_HOST:$REMOTE_PATH/ | head -10

# 3. Test service status
echo "🔍 Checking service status..."
ssh $REMOTE_HOST "systemctl status jw-attendant --no-pager -l" || echo "Service may need attention"

# 4. Test application health
echo "🏥 Testing application health..."
ssh $REMOTE_HOST "curl -f -s -I http://localhost:8000" && echo "✅ Application responding" || echo "❌ Application not responding"

echo ""
echo "✅ Deployment pipeline test completed!"
echo "💡 If all tests pass, you can run: ./deploy-jw-attendant.sh production"
