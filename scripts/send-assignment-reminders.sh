#!/bin/bash
# Phase 4C Feature #1: Assignment Reminder Cron Script
# Calls the reminder API endpoint with authentication
# Add to crontab: 0 * * * * /opt/theoshift/scripts/send-assignment-reminders.sh

# Load environment variables
source /opt/theoshift/.env.production.local 2>/dev/null || source /opt/theoshift/.env

# Check if CRON_API_KEY is set
if [ -z "$CRON_API_KEY" ]; then
  echo "❌ ERROR: CRON_API_KEY not set in environment"
  exit 1
fi

# Determine which server we're on
if [ -f /opt/theoshift/.server-role ]; then
  SERVER_ROLE=$(cat /opt/theoshift/.server-role)
else
  # Default to localhost
  SERVER_ROLE="localhost"
fi

# Set the API URL based on server role
if [ "$SERVER_ROLE" = "blue" ]; then
  API_URL="http://localhost:3001"
elif [ "$SERVER_ROLE" = "green" ]; then
  API_URL="http://localhost:3002"
else
  API_URL="http://localhost:3000"
fi

# Log file
LOG_FILE="/var/log/theoshift/reminders.log"
mkdir -p "$(dirname "$LOG_FILE")"

# Call the reminder API
echo "$(date '+%Y-%m-%d %H:%M:%S') - Sending assignment reminders..." >> "$LOG_FILE"

RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: $CRON_API_KEY" \
  "$API_URL/api/assignments/send-reminders")

# Log the response
echo "$RESPONSE" >> "$LOG_FILE"

# Check if successful
if echo "$RESPONSE" | grep -q '"success":true'; then
  SENT=$(echo "$RESPONSE" | grep -o '"sent":[0-9]*' | cut -d':' -f2)
  echo "$(date '+%Y-%m-%d %H:%M:%S') - ✅ Successfully sent $SENT reminder(s)" >> "$LOG_FILE"
  exit 0
else
  echo "$(date '+%Y-%m-%d %H:%M:%S') - ❌ Failed to send reminders" >> "$LOG_FILE"
  exit 1
fi
