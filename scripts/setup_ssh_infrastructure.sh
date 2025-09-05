#!/bin/bash

# SSH Infrastructure Setup for JW Attendant Scheduler Multi-Agent Development
# Uses existing SSH keys and creates shortcuts for infrastructure access

set -e

echo "=== SSH Infrastructure Setup ==="

# Check if SSH config exists
SSH_CONFIG="$HOME/.ssh/config"
if [ ! -f "$SSH_CONFIG" ]; then
    echo "Creating SSH config file..."
    touch "$SSH_CONFIG"
    chmod 600 "$SSH_CONFIG"
fi

# Find existing SSH keys or use default
SSH_KEY=""
if [ -f "$HOME/.ssh/id_ed25519" ]; then
    SSH_KEY="$HOME/.ssh/id_ed25519"
    echo "Using existing Ed25519 key: $SSH_KEY"
elif [ -f "$HOME/.ssh/id_rsa" ]; then
    SSH_KEY="$HOME/.ssh/id_rsa"
    echo "Using existing RSA key: $SSH_KEY"
else
    # Create new key if none exist
    SSH_KEY="$HOME/.ssh/id_ed25519"
    echo "Creating new SSH key..."
    ssh-keygen -t ed25519 -f "$SSH_KEY" -N "" -C "jw-infrastructure-$(date +%Y%m%d)"
    chmod 600 "$SSH_KEY"
    chmod 644 "$SSH_KEY.pub"
    echo "Created SSH key: $SSH_KEY"
fi

# Backup existing SSH config
if grep -q "# JW Attendant Scheduler Infrastructure" "$SSH_CONFIG"; then
    echo "JW SSH shortcuts already exist in config"
else
    echo "Adding JW SSH shortcuts to config..."
    
    # Add JW infrastructure shortcuts
    cat >> "$SSH_CONFIG" << 'EOF'

# JW Attendant Scheduler Infrastructure
Host jw-staging
    HostName 10.92.3.24
    User root
    Port 22
    IdentityFile ${SSH_KEY}
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
    LogLevel ERROR

Host jw-production
    HostName 10.92.3.22
    User root
    Port 22
    IdentityFile ${SSH_KEY}
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
    LogLevel ERROR

Host postgres-db
    HostName 10.92.3.21
    User root
    Port 22
    IdentityFile ${SSH_KEY}
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
    LogLevel ERROR

Host jw-*
    User root
    IdentityFile ${SSH_KEY}
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
    LogLevel ERROR
EOF

    echo "SSH shortcuts added to $SSH_CONFIG"
fi

echo ""
echo "=== SSH Key Distribution Required ==="
echo "To complete setup, copy the public key to each server:"
echo ""
echo "Public key location: $JW_KEY.pub"
echo "Public key content:"
cat "$JW_KEY.pub"
echo ""
echo "Distribution commands:"
echo "ssh-copy-id -i $JW_KEY root@10.92.3.24  # jw-staging"
echo "ssh-copy-id -i $JW_KEY root@10.92.3.22  # jw-production" 
echo "ssh-copy-id -i $JW_KEY root@10.92.3.21  # postgres-db"
echo ""
echo "Test connections:"
echo "ssh jw-staging 'hostname && uptime'"
echo "ssh jw-production 'hostname && uptime'"
echo "ssh postgres-db 'hostname && uptime'"
echo ""
echo "=== Setup Complete ==="
