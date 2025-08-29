#!/bin/bash
# deploy-jw-attendant.sh - JW Attendant Scheduler Deployment Script

set -e

LOCAL_PATH="/Users/cory/Documents/Cloudy-Work/applications/jw-attendant-scheduler-django"
REMOTE_HOST="jwa"
REMOTE_PATH="/opt/jw-attendant"
SERVICE_NAME="jw-attendant"

# Parse environment argument
ENVIRONMENT=${1:-production}

if [[ "$ENVIRONMENT" == "staging" ]]; then
    REMOTE_HOST="jw-staging"
    REMOTE_PATH="/opt/jw-attendant-staging"
    SERVICE_NAME="jw-attendant-staging"
    echo "🎭 Deploying to STAGING environment..."
else
    echo "🚀 Deploying to PRODUCTION environment..."
fi

echo "📦 Source: $LOCAL_PATH"
echo "🎯 Target: $REMOTE_HOST:$REMOTE_PATH"
echo "🔧 Service: $SERVICE_NAME"
echo ""

# 1. Backup current production
echo "💾 Creating backup..."
ssh $REMOTE_HOST "cp -r $REMOTE_PATH ${REMOTE_PATH}.backup.$(date +%Y%m%d_%H%M%S)" || echo "⚠️  Backup failed (first deployment?)"

# 2. Sync code (excluding sensitive files)
echo "📤 Syncing code..."
rsync -avz --exclude='*.pyc' --exclude='__pycache__' --exclude='.git' \
    --exclude='venv' --exclude='db.sqlite3' --exclude='.env' \
    --exclude='*.backup*' --exclude='deploy-*.sh' \
    $LOCAL_PATH/ $REMOTE_HOST:$REMOTE_PATH/

# 3. Install/update dependencies
echo "📦 Installing dependencies..."
ssh $REMOTE_HOST "cd $REMOTE_PATH && source venv/bin/activate && pip install -r requirements.txt"

# 4. Run migrations
echo "🗄️  Running database migrations..."
ssh $REMOTE_HOST "cd $REMOTE_PATH && source venv/bin/activate && python manage.py migrate"

# 5. Collect static files
echo "🎨 Collecting static files..."
ssh $REMOTE_HOST "cd $REMOTE_PATH && source venv/bin/activate && python manage.py collectstatic --noinput"

# 6. Restart service
echo "🔄 Restarting service..."
ssh $REMOTE_HOST "systemctl restart $SERVICE_NAME"

# 7. Verify deployment
echo "🔍 Verifying deployment..."
sleep 5
ssh $REMOTE_HOST "systemctl status $SERVICE_NAME --no-pager"
if [[ "$ENVIRONMENT" == "staging" ]]; then
    ssh $REMOTE_HOST "curl -f http://localhost:8001 > /dev/null && echo '✅ Service is responding'" || echo "❌ Service health check failed"
    echo ""
    echo "✅ Deployment to $ENVIRONMENT completed successfully!"
    echo "🌐 Application available at: http://10.92.3.24:8001"
else
    ssh $REMOTE_HOST "curl -f http://localhost:8000 > /dev/null && echo '✅ Service is responding'" || echo "❌ Service health check failed"
    echo ""
    echo "✅ Deployment to $ENVIRONMENT completed successfully!"
    echo "🌐 Application available at: http://10.92.3.22:8000"
fi
