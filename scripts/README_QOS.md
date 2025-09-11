# QOS Daemon - Continuous Monitoring Agent

The QOS (Quality of Service) Daemon provides 24/7 monitoring of the JW Attendant Scheduler application with automatic error detection and intervention capabilities.

## Features

- **Continuous Monitoring**: Checks web endpoints, service status, and log files every 30 seconds
- **Automatic Intervention**: Restarts services, reloads nginx, and fixes common issues automatically
- **Error Detection**: Monitors for HTTP errors, service failures, and log file error patterns
- **SSH Integration**: Uses existing SSH configuration for remote server management
- **Comprehensive Logging**: Detailed logs for monitoring activity and interventions

## Files

- `qos_daemon_lite.py` - Main daemon (no external dependencies)
- `qos_control.py` - Control script for managing the daemon
- `qos_config.json` - Configuration file
- `qos_daemon.service` - Systemd service file
- `qos_staging_check.py` - Original one-time check script

## Quick Start

### Test the monitoring system:
```bash
cd /path/to/jw-attendant-scheduler
python3 scripts/qos_control.py . test
```

### Start daemon in background:
```bash
python3 scripts/qos_control.py . start
```

### Check daemon status:
```bash
python3 scripts/qos_control.py . status
```

### Stop daemon:
```bash
python3 scripts/qos_control.py . stop
```

## Configuration

Edit `scripts/qos_config.json` to customize:

- **Monitoring interval**: How often to check (default: 30 seconds)
- **Error threshold**: How many consecutive errors before intervention (default: 3)
- **Endpoints to monitor**: Which URLs to check
- **Intervention types**: Which automatic fixes to enable

## Monitoring Capabilities

### Web Endpoints
- `/health/` - Application health check
- `/dashboard/` - Main dashboard
- `/reports/` - Reports functionality
- `/users/` - User management

### System Checks
- Service status (systemctl)
- Log file error scanning
- SSH connectivity

### Automatic Interventions
- **Service restart**: When service is down or unresponsive
- **Nginx reload**: For permission or configuration issues
- **Error threshold management**: Prevents intervention loops

## Logs

All logs are stored in the `logs/` directory:

- `qos_daemon.log` - Main monitoring activity
- `qos_interventions.log` - Automatic intervention actions
- `qos_daemon_stdout.log` - Standard output (when run as daemon)
- `qos_daemon_stderr.log` - Error output (when run as daemon)

## Error Detection

The daemon detects and responds to:

- **HTTP 502 Bad Gateway** → Service restart
- **HTTP 403 Forbidden** → Nginx reload
- **Connection refused** → Service restart
- **High error count in logs** → Service restart
- **Service inactive** → Service restart

## Installation as System Service

To run as a system service:

```bash
# Install the service
python3 scripts/qos_control.py . install

# Start the service
sudo systemctl start qos_daemon

# Enable auto-start on boot
sudo systemctl enable qos_daemon
```

## SSH Configuration

The daemon uses the existing SSH configuration file:
`/Users/cory/Documents/Cloudy-Work/ssh_config_jw_attendant`

Ensure the SSH keys and host configurations are properly set up for:
- `jw-staging` (10.92.3.24)
- `jw-production` (10.92.3.22)

## Troubleshooting

### Daemon won't start
- Check SSH connectivity to staging server
- Verify configuration file syntax
- Check log files for error details

### No interventions happening
- Verify intervention types are enabled in config
- Check error threshold settings
- Review intervention history in logs

### SSH timeouts
- Verify SSH keys are properly configured
- Check network connectivity to target servers
- Ensure SSH services are running on target hosts

## Example Output

```
INFO: Checking staging environment...
INFO: staging: All checks passed
WARNING: staging: 2 errors detected (count: 1)
ERROR: staging: Error threshold reached, triggering intervention
INFO: Intervention restart_service successful on staging
```

The QOS daemon provides proactive monitoring and automatic problem resolution, ensuring maximum uptime for the JW Attendant Scheduler application.
