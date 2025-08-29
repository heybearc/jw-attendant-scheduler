#!/bin/bash
# Setup SSH access to JW Attendant Scheduler containers

# Container details from infrastructure spec
JW_ATTENDANT_IP="10.92.3.22"
POSTGRESQL_IP="10.92.3.21"
PROXMOX_HOST="10.92.0.5"
SSH_KEY="$HOME/.ssh/jw_attendant_key"

echo "Setting up SSH access for JW Attendant Scheduler containers..."

# Copy SSH key to Proxmox host first
echo "Copying SSH key to Proxmox host..."
ssh-copy-id -i "${SSH_KEY}.pub" root@${PROXMOX_HOST}

# Copy SSH key to JW Attendant container (ID: 132)
echo "Setting up SSH access to JW Attendant container (${JW_ATTENDANT_IP})..."
ssh root@${PROXMOX_HOST} "pct exec 132 -- mkdir -p /root/.ssh"
ssh root@${PROXMOX_HOST} "pct push 132 ${SSH_KEY}.pub /tmp/authorized_keys"
ssh root@${PROXMOX_HOST} "pct exec 132 -- mv /tmp/authorized_keys /root/.ssh/authorized_keys"
ssh root@${PROXMOX_HOST} "pct exec 132 -- chmod 600 /root/.ssh/authorized_keys"
ssh root@${PROXMOX_HOST} "pct exec 132 -- chmod 700 /root/.ssh"

# Copy SSH key to PostgreSQL container (ID: 131)
echo "Setting up SSH access to PostgreSQL container (${POSTGRESQL_IP})..."
ssh root@${PROXMOX_HOST} "pct exec 131 -- mkdir -p /root/.ssh"
ssh root@${PROXMOX_HOST} "pct push 131 ${SSH_KEY}.pub /tmp/authorized_keys"
ssh root@${PROXMOX_HOST} "pct exec 131 -- mv /tmp/authorized_keys /root/.ssh/authorized_keys"
ssh root@${PROXMOX_HOST} "pct exec 131 -- chmod 600 /root/.ssh/authorized_keys"
ssh root@${PROXMOX_HOST} "pct exec 131 -- chmod 700 /root/.ssh"

# Test SSH connectivity
echo "Testing SSH connectivity..."
echo "Testing JW Attendant container..."
ssh -i ${SSH_KEY} -o ConnectTimeout=5 root@${JW_ATTENDANT_IP} 'echo "JW Attendant SSH: OK"'

echo "Testing PostgreSQL container..."
ssh -i ${SSH_KEY} -o ConnectTimeout=5 root@${POSTGRESQL_IP} 'echo "PostgreSQL SSH: OK"'

echo "SSH setup complete!"
