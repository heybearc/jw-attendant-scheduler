#!/bin/bash

# SSH Key Distribution for JW Infrastructure
# Copies SSH keys to all infrastructure servers

set -e

echo "=== SSH Key Distribution ==="

# Check for existing SSH key
SSH_KEY=""
if [ -f "$HOME/.ssh/id_ed25519" ]; then
    SSH_KEY="$HOME/.ssh/id_ed25519"
    echo "Using Ed25519 key: $SSH_KEY"
elif [ -f "$HOME/.ssh/id_rsa" ]; then
    SSH_KEY="$HOME/.ssh/id_rsa"
    echo "Using RSA key: $SSH_KEY"
else
    echo "No SSH key found. Creating new Ed25519 key..."
    ssh-keygen -t ed25519 -f "$HOME/.ssh/id_ed25519" -N "" -C "jw-infrastructure-$(date +%Y%m%d)"
    SSH_KEY="$HOME/.ssh/id_ed25519"
fi

echo "Public key content:"
cat "${SSH_KEY}.pub"
echo ""

# Function to copy key to server
copy_key_to_server() {
    local server=$1
    local name=$2
    
    echo "Copying key to $name ($server)..."
    
    # Method 1: Try ssh-copy-id
    if ssh-copy-id -i "$SSH_KEY" "root@$server" 2>/dev/null; then
        echo "✓ Key copied to $name via ssh-copy-id"
        return 0
    fi
    
    # Method 2: Manual copy via password auth
    echo "ssh-copy-id failed, trying manual copy..."
    
    # Get the public key content
    PUB_KEY=$(cat "${SSH_KEY}.pub")
    
    # Try to append to authorized_keys manually
    if ssh "root@$server" "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '$PUB_KEY' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys" 2>/dev/null; then
        echo "✓ Key copied to $name manually"
        return 0
    fi
    
    echo "✗ Failed to copy key to $name"
    return 1
}

# Copy keys to all servers
copy_key_to_server "10.92.3.24" "jw-staging"
copy_key_to_server "10.92.3.22" "jw-production"
copy_key_to_server "10.92.3.21" "postgres-db"

echo ""
echo "=== Testing SSH Key Authentication ==="

# Test connections
for server in "jw-staging:10.92.3.24" "jw-production:10.92.3.22" "postgres-db:10.92.3.21"; do
    name=${server%:*}
    ip=${server#*:}
    
    echo -n "Testing $name: "
    if ssh -o PasswordAuthentication=no -o ConnectTimeout=5 -i "$SSH_KEY" "root@$ip" 'echo "OK"' 2>/dev/null; then
        echo "✓ Key authentication working"
    else
        echo "✗ Key authentication failed"
    fi
done

echo ""
echo "=== SSH Key Setup Complete ==="
echo "Use these commands to test:"
echo "ssh jw-staging 'hostname && uptime'"
echo "ssh jw-production 'hostname && uptime'"
echo "ssh postgres-db 'hostname && uptime'"
