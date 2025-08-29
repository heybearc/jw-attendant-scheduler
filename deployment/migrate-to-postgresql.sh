#!/bin/bash

# PostgreSQL Migration Script for JW Attendant Scheduler
# This script migrates data from SQLite to PostgreSQL with data integrity testing

set -e  # Exit on any error

# Configuration
POSTGRES_HOST="10.92.3.21"
POSTGRES_PORT="5432"
POSTGRES_DB="jw_scheduler"
POSTGRES_USER="jwscheduler"
POSTGRES_PASSWORD="Cloudy_92!"
DJANGO_PROJECT_DIR="/opt/jw-attendant"
BACKUP_DIR="/opt/jw-attendant/backups"
SQLITE_DB_PATH="/opt/jw-attendant/db.sqlite3"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== JW Attendant Scheduler PostgreSQL Migration ===${NC}"
echo "Starting migration from SQLite to PostgreSQL..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Function to log with timestamp
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check if PostgreSQL is accessible
check_postgres_connection() {
    log "${YELLOW}Testing PostgreSQL connection...${NC}"
    if PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1;" > /dev/null 2>&1; then
        log "${GREEN}✓ PostgreSQL connection successful${NC}"
        return 0
    else
        log "${RED}✗ PostgreSQL connection failed${NC}"
        return 1
    fi
}

# Function to backup SQLite database
backup_sqlite() {
    log "${YELLOW}Creating SQLite backup...${NC}"
    BACKUP_FILE="$BACKUP_DIR/sqlite_backup_$(date +%Y%m%d_%H%M%S).sqlite3"
    cp "$SQLITE_DB_PATH" "$BACKUP_FILE"
    log "${GREEN}✓ SQLite backup created: $BACKUP_FILE${NC}"
}

# Function to export data from SQLite
export_sqlite_data() {
    log "${YELLOW}Exporting data from SQLite...${NC}"
    cd "$DJANGO_PROJECT_DIR"
    
    # Create data export directory
    EXPORT_DIR="$BACKUP_DIR/data_export_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$EXPORT_DIR"
    
    # Export data using Django's dumpdata
    python manage.py dumpdata --natural-foreign --natural-primary \
        --exclude=contenttypes --exclude=auth.permission \
        --exclude=sessions.session --exclude=admin.logentry \
        --output="$EXPORT_DIR/data_export.json"
    
    log "${GREEN}✓ Data exported to: $EXPORT_DIR/data_export.json${NC}"
    echo "$EXPORT_DIR/data_export.json"
}

# Function to update Django settings for PostgreSQL
update_django_settings() {
    log "${YELLOW}Updating Django settings for PostgreSQL...${NC}"
    
    # Update .env file
    ENV_FILE="$DJANGO_PROJECT_DIR/.env"
    
    # Backup current .env
    cp "$ENV_FILE" "$BACKUP_DIR/.env.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Update database configuration
    sed -i.bak "s/^DB_ENGINE=.*/DB_ENGINE=django.db.backends.postgresql/" "$ENV_FILE"
    sed -i.bak "s/^DB_NAME=.*/DB_NAME=$POSTGRES_DB/" "$ENV_FILE"
    sed -i.bak "s/^DB_USER=.*/DB_USER=$POSTGRES_USER/" "$ENV_FILE"
    sed -i.bak "s/^DB_PASSWORD=.*/DB_PASSWORD=$POSTGRES_PASSWORD/" "$ENV_FILE"
    sed -i.bak "s/^DB_HOST=.*/DB_HOST=$POSTGRES_HOST/" "$ENV_FILE"
    sed -i.bak "s/^DB_PORT=.*/DB_PORT=$POSTGRES_PORT/" "$ENV_FILE"
    
    log "${GREEN}✓ Django settings updated for PostgreSQL${NC}"
}

# Function to run Django migrations on PostgreSQL
run_migrations() {
    log "${YELLOW}Running Django migrations on PostgreSQL...${NC}"
    cd "$DJANGO_PROJECT_DIR"
    
    # Run migrations
    python manage.py migrate --run-syncdb
    
    log "${GREEN}✓ PostgreSQL migrations completed${NC}"
}

# Function to import data to PostgreSQL
import_data() {
    local export_file="$1"
    log "${YELLOW}Importing data to PostgreSQL...${NC}"
    cd "$DJANGO_PROJECT_DIR"
    
    # Load data
    python manage.py loaddata "$export_file"
    
    log "${GREEN}✓ Data imported to PostgreSQL${NC}"
}

# Function to verify data integrity
verify_data_integrity() {
    log "${YELLOW}Verifying data integrity...${NC}"
    cd "$DJANGO_PROJECT_DIR"
    
    # Run Django check
    python manage.py check
    
    # Count records in key tables
    python manage.py shell << 'EOF'
from scheduler.models import User, Attendant, Event, Assignment
print(f"Users: {User.objects.count()}")
print(f"Attendants: {Attendant.objects.count()}")
print(f"Events: {Event.objects.count()}")
print(f"Assignments: {Assignment.objects.count()}")
EOF
    
    log "${GREEN}✓ Data integrity verification completed${NC}"
}

# Function to create superuser if needed
create_superuser() {
    log "${YELLOW}Checking for superuser...${NC}"
    cd "$DJANGO_PROJECT_DIR"
    
    # Check if superuser exists
    if python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); print(User.objects.filter(is_superuser=True).exists())" | grep -q "True"; then
        log "${GREEN}✓ Superuser already exists${NC}"
    else
        log "${YELLOW}Creating superuser...${NC}"
        python manage.py shell << 'EOF'
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='superadmin').exists():
    User.objects.create_superuser('superadmin', 'admin@example.com', 'Cloudy_92!')
    print("Superuser created: superadmin")
else:
    print("Superuser already exists")
EOF
        log "${GREEN}✓ Superuser created${NC}"
    fi
}

# Function to restart Django service
restart_django_service() {
    log "${YELLOW}Restarting Django service...${NC}"
    systemctl restart jw-attendant
    sleep 5
    
    if systemctl is-active --quiet jw-attendant; then
        log "${GREEN}✓ Django service restarted successfully${NC}"
    else
        log "${RED}✗ Django service failed to restart${NC}"
        systemctl status jw-attendant
        return 1
    fi
}

# Function to test application functionality
test_application() {
    log "${YELLOW}Testing application functionality...${NC}"
    
    # Test if application responds
    if curl -f -s http://localhost:8000/admin/ > /dev/null; then
        log "${GREEN}✓ Application is responding${NC}"
    else
        log "${RED}✗ Application is not responding${NC}"
        return 1
    fi
}

# Main migration process
main() {
    log "${GREEN}Starting PostgreSQL migration process...${NC}"
    
    # Pre-migration checks
    if [[ ! -f "$SQLITE_DB_PATH" ]]; then
        log "${RED}✗ SQLite database not found: $SQLITE_DB_PATH${NC}"
        exit 1
    fi
    
    if ! check_postgres_connection; then
        log "${RED}✗ Cannot connect to PostgreSQL. Please check configuration.${NC}"
        exit 1
    fi
    
    # Migration steps
    backup_sqlite
    export_file=$(export_sqlite_data)
    update_django_settings
    run_migrations
    import_data "$export_file"
    verify_data_integrity
    create_superuser
    restart_django_service
    test_application
    
    log "${GREEN}=== Migration completed successfully! ===${NC}"
    log "PostgreSQL database is now active at $POSTGRES_HOST:$POSTGRES_PORT"
    log "Backups are stored in: $BACKUP_DIR"
    log "Application URL: http://10.92.3.22:8000"
}

# Run migration with error handling
if main; then
    log "${GREEN}PostgreSQL migration completed successfully!${NC}"
    exit 0
else
    log "${RED}PostgreSQL migration failed. Check logs above for details.${NC}"
    log "Backups are available in: $BACKUP_DIR"
    exit 1
fi
