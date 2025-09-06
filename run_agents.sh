#!/bin/bash
# Run script to execute all agents to fix issues in the staging environment

# Set variables
SSH_CONFIG="/Users/cory/Documents/Cloudy-Work/ssh_config_jw_attendant"
STAGING_SERVER="jw-staging"
LOCAL_TEMPLATES_DIR="/Users/cory/Documents/Cloudy-Work/applications/jw-attendant-scheduler-django/templates/scheduler"
BASE_URL="http://localhost:8001"

# Create directories if they don't exist
mkdir -p agents/logs

# Set up logging
LOG_FILE="agents/logs/run_agents_$(date +%Y%m%d_%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "Starting agent execution at $(date)"
echo "========================================"

# Make sure all agent scripts are executable
chmod +x agents/*.py

# Run Lead Architect Agent to coordinate all other agents
echo "Running Lead Architect Agent..."
python agents/lead_architect_agent.py \
  --ssh-config="$SSH_CONFIG" \
  --staging-server="$STAGING_SERVER" \
  --local-templates-dir="$LOCAL_TEMPLATES_DIR" \
  --base-url="$BASE_URL"

# Check if the Lead Architect Agent was successful
if [ $? -eq 0 ]; then
  echo "All agents completed successfully!"
  echo "The staging environment has been fixed and is ready for testing."
else
  echo "Some agents failed. Please check the logs for details."
  echo "You may need to run specific agents manually to fix remaining issues."
fi

echo "========================================"
echo "Agent execution completed at $(date)"
echo "Log file: $LOG_FILE"
