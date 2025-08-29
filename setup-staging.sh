#!/bin/bash
# setup-staging.sh - Create staging environment for JW Attendant Scheduler

set -e

STAGING_ID=134
STAGING_IP="10.92.3.24"
STAGING_HOST="jw-staging"
PRODUCTION_ID=132

echo "🏗️ Setting up staging environment for JW Attendant Scheduler..."
echo "📋 Staging ID: $STAGING_ID"
echo "🌐 Staging IP: $STAGING_IP"
echo "🏷️  Hostname: $STAGING_HOST"
echo ""

# Check if staging container already exists
echo "🔍 Checking if staging container exists..."
if ssh prox "pct status $STAGING_ID" 2>/dev/null; then
    echo "⚠️  Container $STAGING_ID already exists. Stopping and removing..."
    ssh prox "pct stop $STAGING_ID" || true
    ssh prox "pct destroy $STAGING_ID" || true
fi

# Clone production container to create staging
echo "📋 Cloning production container ($PRODUCTION_ID) to staging ($STAGING_ID)..."
ssh prox "pct clone $PRODUCTION_ID $STAGING_ID --hostname $STAGING_HOST"

# Configure network for staging
echo "🌐 Configuring network settings..."
ssh prox "pct set $STAGING_ID --net0 name=eth0,bridge=vmbr0,ip=$STAGING_IP/24,gw=10.92.3.1"

# Start staging container
echo "🚀 Starting staging container..."
ssh prox "pct start $STAGING_ID"

# Wait for container to be ready
echo "⏳ Waiting for container to be ready..."
sleep 10

# Update SSH config if not already present
echo "🔧 Updating SSH configuration..."
if ! grep -q "Host jw-staging" ~/.ssh/config; then
    cat >> ~/.ssh/config << EOF

# JW Attendant Staging Environment
Host jw-staging
    HostName $STAGING_IP
    Port 22
    User root
    IdentityFile ~/.ssh/jw_attendant_key
    ServerAliveInterval 120
    ServerAliveCountMax 3
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
EOF
    echo "✅ Added jw-staging to SSH config"
else
    echo "ℹ️  Updating existing SSH config entry"
    sed -i '' "s/HostName 10\.92\.3\.[0-9]*/HostName $STAGING_IP/" ~/.ssh/config
fi

# Test SSH connectivity
echo "🔗 Testing SSH connectivity..."
if ssh jw-staging "echo 'SSH connection successful'"; then
    echo "✅ SSH connection to staging environment successful"
else
    echo "❌ SSH connection failed"
    exit 1
fi

# Configure staging-specific settings
echo "⚙️  Configuring staging-specific settings..."
ssh jw-staging "cd /opt/jw-attendant && cp db.sqlite3 db.sqlite3.staging-backup"
ssh jw-staging "systemctl restart jw-attendant"

# Verify staging service
echo "🔍 Verifying staging service..."
sleep 5
ssh jw-staging "systemctl status jw-attendant --no-pager"
ssh jw-staging "curl -f http://localhost:8000 > /dev/null && echo '✅ Staging service is responding'" || echo "❌ Staging service health check failed"

echo ""
echo "✅ Staging environment setup completed successfully!"
echo "🌐 Staging URL: http://$STAGING_IP:8000"
echo "🔧 SSH Access: ssh jw-staging"
echo ""
echo "📝 Next steps:"
echo "   1. Test deployment: ./deploy-jw-attendant.sh staging"
echo "   2. Verify staging functionality"
echo "   3. Deploy to production: ./deploy-jw-attendant.sh production"
