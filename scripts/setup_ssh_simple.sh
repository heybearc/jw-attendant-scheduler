#!/bin/bash

# Simple SSH setup using existing keys or password fallback
# For JW Attendant Scheduler infrastructure access

echo "=== Simple SSH Infrastructure Setup ==="

# Test current SSH access
echo "Testing SSH access to infrastructure..."

# Function to test SSH connection
test_ssh() {
    local host=$1
    local name=$2
    echo -n "Testing $name ($host): "
    
    # Try with existing keys first
    if ssh -o ConnectTimeout=5 -o PasswordAuthentication=no -o BatchMode=yes root@$host 'echo "OK"' 2>/dev/null; then
        echo "✓ Key-based auth working"
        return 0
    fi
    
    # Try with password if keys fail
    echo "Key auth failed, password required"
    return 1
}

# Test each server
test_ssh "10.92.3.24" "jw-staging"
test_ssh "10.92.3.22" "jw-production" 
test_ssh "10.92.3.21" "postgres-db"

echo ""
echo "=== SSH Config Setup ==="

# Create SSH config shortcuts
SSH_CONFIG="$HOME/.ssh/config"
if [ ! -f "$SSH_CONFIG" ]; then
    touch "$SSH_CONFIG"
    chmod 600 "$SSH_CONFIG"
fi

# Remove existing JW config if present
if grep -q "# JW Attendant Scheduler Infrastructure" "$SSH_CONFIG"; then
    echo "Removing existing JW SSH config..."
    # Create temp file without JW section
    awk '/# JW Attendant Scheduler Infrastructure/{flag=1} !flag; /^$/{if(flag) flag=0}' "$SSH_CONFIG" > "${SSH_CONFIG}.tmp"
    mv "${SSH_CONFIG}.tmp" "$SSH_CONFIG"
fi

# Add new SSH shortcuts
echo "Adding SSH shortcuts..."
cat >> "$SSH_CONFIG" << 'EOF'

# JW Attendant Scheduler Infrastructure
Host jw-staging
    HostName 10.92.3.24
    User root
    Port 22
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
    LogLevel ERROR

Host jw-production
    HostName 10.92.3.22
    User root
    Port 22
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
    LogLevel ERROR

Host postgres-db
    HostName 10.92.3.21
    User root
    Port 22
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
    LogLevel ERROR
EOF

echo "SSH shortcuts configured in $SSH_CONFIG"
echo ""
echo "=== Test Commands ==="
echo "ssh jw-staging 'hostname && uptime'"
echo "ssh jw-production 'hostname && uptime'"
echo "ssh postgres-db 'hostname && uptime'"
echo ""
echo "Setup complete. Use shortcuts for infrastructure access."
