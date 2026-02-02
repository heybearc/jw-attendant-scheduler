#!/bin/bash
set -e

echo "========================================="
echo "Event Permissions Refactor Deployment"
echo "========================================="
echo ""

# Step 1: Run database migration (shared DB, affects both servers)
echo "Step 1: Running database migration..."
PGPASSWORD='theoshift_password' psql -h 10.92.3.21 -U theoshift_user -d theoshift_scheduler <<EOF
BEGIN;

-- Update OWNER to ADMIN
UPDATE event_permissions SET role = 'ADMIN' WHERE role = 'OWNER';

-- Update MANAGER to COORDINATOR
UPDATE event_permissions SET role = 'COORDINATOR' WHERE role = 'MANAGER';

-- Update OVERSEER to COORDINATOR
UPDATE event_permissions SET role = 'COORDINATOR' WHERE role = 'OVERSEER';

-- Update KEYMAN to COORDINATOR
UPDATE event_permissions SET role = 'COORDINATOR' WHERE role = 'KEYMAN';

-- VIEWER stays as VIEWER (no update needed)

-- Verify the migration
SELECT role, COUNT(*) as count FROM event_permissions GROUP BY role ORDER BY role;

COMMIT;
EOF

echo ""
echo "✅ Database migration complete"
echo ""

# Step 2: Deploy to STANDBY (BLUE - 10.92.3.24)
echo "Step 2: Deploying to STANDBY (BLUE)..."
ssh root@10.92.3.24 <<'ENDSSH'
cd /opt/theoshift
git pull origin main
npx prisma generate
rm -rf .next
npm run build
pm2 restart theoshift-blue
ENDSSH

echo ""
echo "✅ STANDBY deployment complete"
echo ""

# Step 3: Deploy to LIVE (GREEN - 10.92.3.22)
echo "Step 3: Deploying to LIVE (GREEN)..."
ssh root@10.92.3.22 <<'ENDSSH'
cd /opt/theoshift
git pull origin main
npx prisma generate
rm -rf .next
npm run build
pm2 restart theoshift-green
ENDSSH

echo ""
echo "✅ LIVE deployment complete"
echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Test permissions on https://blue.theoshift.com"
echo "2. Test permissions on https://theoshift.com"
echo "3. Verify all users can access their events"
echo ""
