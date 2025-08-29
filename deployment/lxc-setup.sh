#!/bin/bash
# LXC Container Setup Script for JW Attendant Scheduler
# Follows infrastructure spec patterns for postgres-01 and jw-scheduler containers

set -e

echo "🚀 JW Attendant Scheduler LXC Setup"
echo "Following infrastructure spec: postgres-01 (10.92.3.21) + jw-scheduler (10.92.3.22)"

# Configuration
POSTGRES_CONTAINER_ID=131
POSTGRES_HOSTNAME="postgres-01"
POSTGRES_IP="10.92.3.21"

APP_CONTAINER_ID=132
APP_HOSTNAME="jw-scheduler"
APP_IP="10.92.3.22"

PROXMOX_HOST="10.92.0.5"
ROOT_PASSWORD="Cloudy_92!"

# Function to create LXC container
create_lxc_container() {
    local container_id=$1
    local hostname=$2
    local ip=$3
    local memory=$4
    local storage=$5
    local template=$6
    
    echo "📦 Creating LXC container: $hostname ($container_id)"
    
    # Create container (adjust template path as needed)
    pct create $container_id $template \
        --hostname $hostname \
        --memory $memory \
        --cores 2 \
        --rootfs hdd-pool:$storage \
        --net0 name=eth0,bridge=vmbr0923,ip=$ip/24,gw=10.92.3.1 \
        --nameserver 10.92.0.10 \
        --password $ROOT_PASSWORD \
        --unprivileged 1 \
        --onboot 1
    
    echo "✅ Container $hostname created successfully"
}

# Function to setup PostgreSQL container
setup_postgres_container() {
    echo "🐘 Setting up PostgreSQL container..."
    
    # Start container
    pct start $POSTGRES_CONTAINER_ID
    sleep 10
    
    # Install PostgreSQL
    pct exec $POSTGRES_CONTAINER_ID -- bash -c "
        apt update && apt upgrade -y
        apt install -y postgresql postgresql-contrib
        systemctl enable postgresql
        systemctl start postgresql
        
        # Configure PostgreSQL
        sudo -u postgres psql -c \"CREATE DATABASE jw_scheduler;\"
        sudo -u postgres psql -c \"CREATE USER jw_scheduler WITH PASSWORD 'Cloudy_92!';\"
        sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE jw_scheduler TO jw_scheduler;\"
        
        # Configure remote connections
        echo \"host all all 10.92.3.0/24 md5\" >> /etc/postgresql/*/main/pg_hba.conf
        sed -i \"s/#listen_addresses = 'localhost'/listen_addresses = '*'/\" /etc/postgresql/*/main/postgresql.conf
        
        systemctl restart postgresql
    "
    
    echo "✅ PostgreSQL container setup complete"
}

# Function to setup application container
setup_app_container() {
    echo "🐍 Setting up Django application container..."
    
    # Start container
    pct start $APP_CONTAINER_ID
    sleep 10
    
    # Install Python and dependencies
    pct exec $APP_CONTAINER_ID -- bash -c "
        apt update && apt upgrade -y
        apt install -y python3 python3-pip python3-venv git postgresql-client nginx
        
        # Create application directory
        mkdir -p /opt/jw-scheduler
        cd /opt/jw-scheduler
        
        # Create virtual environment
        python3 -m venv venv
        source venv/bin/activate
        
        # Install Gunicorn
        pip install gunicorn psycopg2-binary
        
        # Create systemd service
        cat > /etc/systemd/system/jw-scheduler.service << 'EOF'
[Unit]
Description=JW Attendant Scheduler Django App
After=network.target postgresql.service

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/opt/jw-scheduler
Environment=PATH=/opt/jw-scheduler/venv/bin
ExecStart=/opt/jw-scheduler/venv/bin/gunicorn --bind 0.0.0.0:8000 --workers 3 jw_scheduler.wsgi:application
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

        systemctl daemon-reload
        systemctl enable jw-scheduler
        
        # Set permissions
        chown -R www-data:www-data /opt/jw-scheduler
    "
    
    echo "✅ Application container setup complete"
}

# Function to configure NFS mounts (following your pattern)
setup_nfs_mounts() {
    echo "📁 Setting up NFS mounts..."
    
    for container_id in $POSTGRES_CONTAINER_ID $APP_CONTAINER_ID; do
        pct exec $container_id -- bash -c "
            apt install -y nfs-common
            mkdir -p /mnt/data
            echo '10.92.5.200:/mnt/tank/nfs-data /mnt/data nfs defaults 0 0' >> /etc/fstab
            mount -a
        "
    done
    
    echo "✅ NFS mounts configured"
}

# Main execution
main() {
    echo "Starting LXC container deployment..."
    
    # Note: These commands need to be run on Proxmox host
    echo "⚠️  Run these commands on Proxmox host (10.92.0.5):"
    echo ""
    
    echo "# 1. Create PostgreSQL container"
    echo "pct create $POSTGRES_CONTAINER_ID /var/lib/vz/template/cache/ubuntu-22.04-standard_22.04-1_amd64.tar.zst \\"
    echo "  --hostname $POSTGRES_HOSTNAME \\"
    echo "  --memory 4096 \\"
    echo "  --cores 2 \\"
    echo      --rootfs hdd-pool:subvol-$POSTGRES_CONTAINER_ID-disk-0,size=20G \\"
    echo "  --net0 name=eth0,bridge=vmbr0923,ip=$POSTGRES_IP/24,gw=10.92.3.1 \\"
    echo "  --nameserver 10.92.0.10 \\"
    echo "  --password $ROOT_PASSWORD \\"
    echo "  --unprivileged 1 \\"
    echo "  --onboot 1"
    echo ""
    
    echo "# 2. Create Application container"
    echo "pct create $APP_CONTAINER_ID /var/lib/vz/template/cache/ubuntu-25.04-standard_25.04-1.1_amd64.tar.zst \\"
    echo "  --hostname $APP_HOSTNAME \\"
    echo "  --memory 2048 \\"
    echo "  --cores 2 \\"
    echo      --rootfs hdd-pool:8 \\"
    echo "  --net0 name=eth0,bridge=vmbr0923,ip=$APP_IP/24,gw=10.92.3.1 \\"
    echo "  --nameserver 10.92.0.10 \\"
    echo "  --password $ROOT_PASSWORD \\"
    echo "  --unprivileged 1 \\"
    echo "  --onboot 1"
    echo ""
    
    echo "# 3. Start containers and run setup"
    echo "pct start $POSTGRES_CONTAINER_ID"
    echo "pct start $APP_CONTAINER_ID"
    echo ""
    
    echo "📋 Next steps after container creation:"
    echo "1. Run PostgreSQL setup script on postgres-01"
    echo "2. Deploy Django application to jw-scheduler"
    echo "3. Configure NPM proxy: attendant.cloudigan.net → 10.92.3.20:8000"
    echo "4. Run database migration script"
}

main "$@"
