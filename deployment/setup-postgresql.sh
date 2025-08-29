#!/bin/bash

# PostgreSQL Database Setup Script for JW Attendant Scheduler
# Run this on the PostgreSQL container (postgres-01, 10.92.3.21)

set -e  # Exit on any error

# Configuration
DB_NAME="jw_scheduler"
DB_USER="jwscheduler"
DB_PASSWORD="Cloudy_92!"
POSTGRES_VERSION="15"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== PostgreSQL Setup for JW Attendant Scheduler ===${NC}"

# Function to log with timestamp
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Update system packages
log "${YELLOW}Updating system packages...${NC}"
apt update && apt upgrade -y

# Install PostgreSQL
log "${YELLOW}Installing PostgreSQL ${POSTGRES_VERSION}...${NC}"
apt install -y postgresql-${POSTGRES_VERSION} postgresql-contrib-${POSTGRES_VERSION}

# Start and enable PostgreSQL service
log "${YELLOW}Starting PostgreSQL service...${NC}"
systemctl start postgresql
systemctl enable postgresql

# Configure PostgreSQL
log "${YELLOW}Configuring PostgreSQL...${NC}"

# Switch to postgres user and create database and user
sudo -u postgres psql << EOF
-- Create database
CREATE DATABASE ${DB_NAME};

-- Create user
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};

-- Grant additional privileges for Django
ALTER USER ${DB_USER} CREATEDB;

-- Connect to the database and grant schema privileges
\c ${DB_NAME}
GRANT ALL ON SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};

-- Exit
\q
EOF

# Configure PostgreSQL for network access
log "${YELLOW}Configuring PostgreSQL for network access...${NC}"

# Update postgresql.conf
POSTGRES_CONF="/etc/postgresql/${POSTGRES_VERSION}/main/postgresql.conf"
cp "$POSTGRES_CONF" "$POSTGRES_CONF.backup"

# Allow connections from application server
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" "$POSTGRES_CONF"

# Update pg_hba.conf for authentication
PG_HBA_CONF="/etc/postgresql/${POSTGRES_VERSION}/main/pg_hba.conf"
cp "$PG_HBA_CONF" "$PG_HBA_CONF.backup"

# Add rule for application server (10.92.3.22)
echo "host    ${DB_NAME}    ${DB_USER}    10.92.3.22/32    md5" >> "$PG_HBA_CONF"

# Add rule for local subnet access
echo "host    ${DB_NAME}    ${DB_USER}    10.92.3.0/24     md5" >> "$PG_HBA_CONF"

# Configure firewall
log "${YELLOW}Configuring firewall...${NC}"
ufw allow from 10.92.3.22 to any port 5432
ufw allow from 10.92.3.0/24 to any port 5432

# Restart PostgreSQL to apply configuration changes
log "${YELLOW}Restarting PostgreSQL service...${NC}"
systemctl restart postgresql

# Test database connection
log "${YELLOW}Testing database connection...${NC}"
if sudo -u postgres psql -d "$DB_NAME" -c "SELECT version();" > /dev/null 2>&1; then
    log "${GREEN}✓ Database connection successful${NC}"
else
    log "${RED}✗ Database connection failed${NC}"
    exit 1
fi

# Create backup directory and script
log "${YELLOW}Setting up backup system...${NC}"
mkdir -p /var/backups/postgresql
chown postgres:postgres /var/backups/postgresql

# Create backup script
cat > /usr/local/bin/backup-jw-scheduler.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
DB_NAME="jw_scheduler"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/jw_scheduler_backup_$DATE.sql"

# Create backup
sudo -u postgres pg_dump "$DB_NAME" > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "jw_scheduler_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
EOF

chmod +x /usr/local/bin/backup-jw-scheduler.sh

# Add daily backup cron job
echo "0 2 * * * root /usr/local/bin/backup-jw-scheduler.sh" >> /etc/crontab

# Display connection information
log "${GREEN}=== PostgreSQL Setup Complete ===${NC}"
echo ""
echo "Database Configuration:"
echo "  Host: 10.92.3.21"
echo "  Port: 5432"
echo "  Database: $DB_NAME"
echo "  Username: $DB_USER"
echo "  Password: $DB_PASSWORD"
echo ""
echo "Connection string for Django:"
echo "  DB_ENGINE=django.db.backends.postgresql"
echo "  DB_NAME=$DB_NAME"
echo "  DB_USER=$DB_USER"
echo "  DB_PASSWORD=$DB_PASSWORD"
echo "  DB_HOST=10.92.3.21"
echo "  DB_PORT=5432"
echo ""
echo "Test connection from application server:"
echo "  PGPASSWORD='$DB_PASSWORD' psql -h 10.92.3.21 -p 5432 -U $DB_USER -d $DB_NAME"
echo ""
echo "Backup script: /usr/local/bin/backup-jw-scheduler.sh"
echo "Daily backups scheduled at 2:00 AM"

log "${GREEN}PostgreSQL setup completed successfully!${NC}"
