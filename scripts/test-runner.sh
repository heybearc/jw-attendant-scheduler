#!/bin/bash
# Test runner for STANDBY container
# Temporarily overrides NEXTAUTH_URL to use localhost for testing

set -e

echo "🧪 Starting test run with container-local configuration..."

# Backup current .env
echo "📦 Backing up production .env..."
cp /opt/theoshift/.env /opt/theoshift/.env.backup

# Override NEXTAUTH_URL for container-local testing
echo "🔧 Configuring NEXTAUTH_URL for localhost testing..."
sed -i "s|NEXTAUTH_URL=https://theoshift.com|NEXTAUTH_URL=http://localhost:3001|" /opt/theoshift/.env

# Restart app to pick up new config
echo "🔄 Restarting app with test configuration..."
pm2 restart theoshift-blue > /dev/null 2>&1

# Wait for app to be ready
echo "⏳ Waiting for app to be ready..."
sleep 3

# Run tests
echo "🚀 Running Playwright tests..."
cd /opt/theoshift
npm run test:e2e

# Capture exit code
TEST_EXIT_CODE=$?

# Restore production config
echo "🔙 Restoring production configuration..."
mv /opt/theoshift/.env.backup /opt/theoshift/.env
pm2 restart theoshift-blue > /dev/null 2>&1

echo "✅ Test run complete. Production config restored."

# Exit with test result code
exit $TEST_EXIT_CODE
