#!/bin/bash
# Setup script for JW Attendant Scheduler on Ubuntu 25.04 LXC container
# Run this inside the container (ID: 132, IP: 10.92.3.20)

set -e

echo "🚀 Setting up JW Attendant Scheduler on Ubuntu 25.04"

# Update system
apt update && apt upgrade -y

# Install Python and dependencies
apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    postgresql-client \
    git \
    curl \
    nginx \
    supervisor \
    build-essential \
    libpq-dev

# Create application directory
mkdir -p /opt/jw-scheduler
cd /opt/jw-scheduler

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python packages
pip install --upgrade pip
pip install \
    Django==4.2.5 \
    django-extensions==3.2.3 \
    cryptography==41.0.4 \
    psycopg2-binary==2.9.7 \
    gunicorn==21.2.0 \
    python-dateutil==2.8.2

# Create application user
useradd -r -s /bin/false -d /opt/jw-scheduler jwscheduler
chown -R jwscheduler:jwscheduler /opt/jw-scheduler

# Create systemd service
cat > /etc/systemd/system/jw-scheduler.service << 'EOF'
[Unit]
Description=JW Attendant Scheduler Django App
After=network.target postgresql.service

[Service]
Type=notify
User=jwscheduler
Group=jwscheduler
WorkingDirectory=/opt/jw-scheduler
Environment=PATH=/opt/jw-scheduler/venv/bin
Environment=DB_HOST=10.92.3.21
Environment=DB_NAME=jw_scheduler
Environment=DB_USER=jw_scheduler
Environment=DB_PASSWORD=Cloudy_92!
Environment=DEBUG=False
Environment=ALLOWED_HOSTS=10.92.3.20,attendant.cloudigan.net,localhost
ExecStart=/opt/jw-scheduler/venv/bin/gunicorn --bind 0.0.0.0:8000 --workers 3 --timeout 120 jw_scheduler.wsgi:application
ExecReload=/bin/kill -s HUP $MAINPID
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Create directories for static files and logs
mkdir -p /opt/jw-scheduler/static
mkdir -p /opt/jw-scheduler/media
mkdir -p /var/log/jw-scheduler

# Set permissions
chown -R jwscheduler:jwscheduler /opt/jw-scheduler
chown -R jwscheduler:jwscheduler /var/log/jw-scheduler

# Enable and start service (will fail until app is deployed)
systemctl daemon-reload
systemctl enable jw-scheduler

echo "✅ Container setup complete!"
echo "📋 Next steps:"
echo "1. Deploy Django application files to /opt/jw-scheduler/"
echo "2. Run database migrations"
echo "3. Collect static files"
echo "4. Start the service: systemctl start jw-scheduler"
echo "5. Configure NPM proxy: attendant.cloudigan.net → 10.92.3.20:8000"
