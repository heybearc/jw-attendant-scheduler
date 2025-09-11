#!/bin/bash
# Deploy JW Attendant Scheduler application to container
# Run this from your local machine to deploy to container 132

set -e

CONTAINER_IP="10.92.3.22"
APP_DIR="/opt/jw-attendant"
LOCAL_APP_DIR="/Users/cory/Documents/Cloudy-Work/applications/jw-attendant-scheduler"

echo "🚀 Deploying JW Attendant Scheduler to container 132 (10.92.3.22)"

# Test container connectivity
echo "📡 Testing container connectivity..."
if ! ping -c 1 $CONTAINER_IP > /dev/null 2>&1; then
    echo "❌ Cannot reach container at $CONTAINER_IP"
    exit 1
fi

echo "✅ Container is reachable"

# Copy application files to container
echo "📦 Copying application files..."
rsync -av --exclude='.git' --exclude='__pycache__' --exclude='*.pyc' \
    --exclude='db.sqlite3' --exclude='venv' --exclude='.env' \
    $LOCAL_APP_DIR/ root@$CONTAINER_IP:$APP_DIR/

# Create environment file
echo "⚙️ Creating environment configuration..."
ssh root@$CONTAINER_IP "cat > $APP_DIR/.env << 'EOF'
# JW Attendant Scheduler - Production Environment
DB_NAME=jw_scheduler
DB_USER=jw_scheduler
DB_PASSWORD=Cloudy_92!
DB_HOST=10.92.3.21
DB_PORT=5432

SECRET_KEY=$(openssl rand -base64 32)
DEBUG=False
ALLOWED_HOSTS=10.92.3.22,attendant.cloudigan.net,localhost

EMAIL_ENCRYPTION_KEY=$(openssl rand -base64 32)
PAGINATE_BY=25

STATIC_ROOT=$APP_DIR/static/
MEDIA_ROOT=$APP_DIR/media/
LOG_LEVEL=INFO
LOG_FILE=/var/log/jw-attendant/app.log
EOF"

# Set permissions
echo "🔐 Setting permissions..."
ssh root@$CONTAINER_IP "chown -R jwscheduler:jwscheduler $APP_DIR"

# Install requirements
echo "📋 Installing Python requirements..."
ssh root@$CONTAINER_IP "cd $APP_DIR && source venv/bin/activate && pip install -r requirements.txt"

# Test database connection
echo "🔍 Testing PostgreSQL connection..."
ssh root@$CONTAINER_IP "cd $APP_DIR && source venv/bin/activate && python -c 'import os; os.environ.setdefault(\"DJANGO_SETTINGS_MODULE\", \"jw_scheduler.settings\"); import django; django.setup(); from django.db import connection; cursor = connection.cursor(); cursor.execute(\"SELECT version();\"); print(\"✅ PostgreSQL connection successful:\", cursor.fetchone()[0])'"

# Run migrations
echo "🗃️ Running database migrations..."
ssh root@$CONTAINER_IP "cd $APP_DIR && source venv/bin/activate && python manage.py migrate"

# Collect static files
echo "📁 Collecting static files..."
ssh root@$CONTAINER_IP "cd $APP_DIR && source venv/bin/activate && python manage.py collectstatic --noinput"

# Create superuser (optional)
echo "👤 Creating superuser (optional)..."
ssh root@$CONTAINER_IP "cd $APP_DIR && source venv/bin/activate && echo \"from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@example.com', 'Cloudy_92!')\" | python manage.py shell"

# Start the service
echo "🚀 Starting JW Attendant service..."
ssh root@$CONTAINER_IP "systemctl start jw-attendant"
ssh root@$CONTAINER_IP "systemctl status jw-attendant --no-pager"

echo "🎉 Deployment complete!"
echo "📋 Service Information:"
echo "  🌐 Internal URL: http://10.92.3.22:8000"
echo "  🔗 External URL: https://attendant.cloudigan.net (after NPM setup)"
echo "  👤 Admin: admin / Cloudy_92!"
echo ""
echo "📋 Next steps:"
echo "1. Configure NPM proxy: attendant.cloudigan.net → 10.92.3.22:8000"
echo "2. Test the application"
echo "3. Run database migration from SQLite if needed"
