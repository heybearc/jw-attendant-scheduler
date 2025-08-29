#!/bin/bash

# Production Logging Setup for JW Attendant Scheduler
# This script configures comprehensive logging and monitoring

set -e

echo "=== Setting up Production Logging and Monitoring ==="
echo "[$(date)] Starting logging configuration..."

# Create log directories
echo "[$(date)] Creating log directories..."
mkdir -p /var/log/jw-attendant/{app,nginx,system,metrics}
chown -R jwscheduler:jwscheduler /var/log/jw-attendant

# Set proper permissions
chmod 755 /var/log/jw-attendant
chmod 755 /var/log/jw-attendant/*

# Configure logrotate for application logs
echo "[$(date)] Configuring log rotation..."
cat > /etc/logrotate.d/jw-attendant << 'EOF'
/var/log/jw-attendant/app/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 jwscheduler jwscheduler
    postrotate
        systemctl reload jw-attendant || true
    endscript
}

/var/log/jw-attendant/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}

/var/log/jw-attendant/system/*.log {
    weekly
    missingok
    rotate 8
    compress
    delaycompress
    notifempty
    create 644 root root
}
EOF

# Create systemd journal configuration for the application
echo "[$(date)] Configuring systemd journal..."
mkdir -p /etc/systemd/system/jw-attendant.service.d
cat > /etc/systemd/system/jw-attendant.service.d/logging.conf << 'EOF'
[Service]
StandardOutput=journal
StandardError=journal
SyslogIdentifier=jw-attendant
EOF

# Create monitoring script
echo "[$(date)] Creating system monitoring script..."
cat > /opt/jw-attendant/scripts/monitor-system.py << 'EOF'
#!/usr/bin/env python3
"""
System monitoring script for JW Attendant Scheduler
Logs system metrics and application health
"""

import json
import logging
import psutil
import time
from datetime import datetime
from pathlib import Path

# Configure logging
logging.basicConfig(
    filename='/var/log/jw-attendant/system/monitor.log',
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)

def collect_system_metrics():
    """Collect system performance metrics"""
    try:
        # CPU usage
        cpu_percent = psutil.cpu_percent(interval=1)
        
        # Memory usage
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        memory_available = memory.available // (1024**2)  # MB
        
        # Disk usage
        disk = psutil.disk_usage('/')
        disk_percent = disk.percent
        disk_free = disk.free // (1024**3)  # GB
        
        # Network I/O
        net_io = psutil.net_io_counters()
        
        # Process count
        process_count = len(psutil.pids())
        
        metrics = {
            'timestamp': datetime.now().isoformat(),
            'cpu_percent': cpu_percent,
            'memory_percent': memory_percent,
            'memory_available_mb': memory_available,
            'disk_percent': disk_percent,
            'disk_free_gb': disk_free,
            'network_bytes_sent': net_io.bytes_sent,
            'network_bytes_recv': net_io.bytes_recv,
            'process_count': process_count
        }
        
        return metrics
        
    except Exception as e:
        logging.error(f"Error collecting metrics: {e}")
        return None

def check_application_health():
    """Check JW Attendant Scheduler application health"""
    try:
        import requests
        
        # Check if application is responding
        response = requests.get('http://localhost:8000/health/', timeout=10)
        app_healthy = response.status_code == 200
        
        # Check database connectivity
        db_healthy = True  # Will be implemented in Django health check
        
        health = {
            'timestamp': datetime.now().isoformat(),
            'application_healthy': app_healthy,
            'database_healthy': db_healthy,
            'response_time_ms': response.elapsed.total_seconds() * 1000 if app_healthy else None
        }
        
        return health
        
    except Exception as e:
        logging.error(f"Error checking application health: {e}")
        return {
            'timestamp': datetime.now().isoformat(),
            'application_healthy': False,
            'database_healthy': False,
            'error': str(e)
        }

def main():
    """Main monitoring loop"""
    logging.info("Starting system monitoring")
    
    # Collect metrics
    metrics = collect_system_metrics()
    if metrics:
        # Log to metrics file
        metrics_file = Path('/var/log/jw-attendant/metrics/system.jsonl')
        with open(metrics_file, 'a') as f:
            f.write(json.dumps(metrics) + '\n')
    
    # Check application health
    health = check_application_health()
    health_file = Path('/var/log/jw-attendant/metrics/health.jsonl')
    with open(health_file, 'a') as f:
        f.write(json.dumps(health) + '\n')
    
    # Log alerts for critical conditions
    if metrics:
        if metrics['cpu_percent'] > 90:
            logging.warning(f"High CPU usage: {metrics['cpu_percent']}%")
        if metrics['memory_percent'] > 90:
            logging.warning(f"High memory usage: {metrics['memory_percent']}%")
        if metrics['disk_percent'] > 90:
            logging.warning(f"High disk usage: {metrics['disk_percent']}%")
    
    if not health['application_healthy']:
        logging.error("Application health check failed")

if __name__ == '__main__':
    main()
EOF

chmod +x /opt/jw-attendant/scripts/monitor-system.py

# Create cron job for monitoring
echo "[$(date)] Setting up monitoring cron job..."
cat > /etc/cron.d/jw-attendant-monitoring << 'EOF'
# JW Attendant Scheduler monitoring
*/5 * * * * jwscheduler /opt/jw-attendant/venv/bin/python /opt/jw-attendant/scripts/monitor-system.py
EOF

# Create log analysis script
echo "[$(date)] Creating log analysis script..."
cat > /opt/jw-attendant/scripts/analyze-logs.sh << 'EOF'
#!/bin/bash
# Log analysis script for JW Attendant Scheduler

LOG_DIR="/var/log/jw-attendant"
REPORT_FILE="/tmp/jw-attendant-log-report.txt"

echo "=== JW Attendant Scheduler Log Analysis Report ===" > $REPORT_FILE
echo "Generated: $(date)" >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Application errors in the last 24 hours
echo "=== Application Errors (Last 24 Hours) ===" >> $REPORT_FILE
find $LOG_DIR -name "*.log" -mtime -1 -exec grep -h "ERROR\|CRITICAL" {} \; | tail -20 >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Warning messages
echo "=== Warning Messages (Last 24 Hours) ===" >> $REPORT_FILE
find $LOG_DIR -name "*.log" -mtime -1 -exec grep -h "WARNING" {} \; | tail -10 >> $REPORT_FILE
echo "" >> $REPORT_FILE

# System metrics summary
echo "=== System Metrics Summary ===" >> $REPORT_FILE
if [ -f "$LOG_DIR/metrics/system.jsonl" ]; then
    echo "Latest system metrics:" >> $REPORT_FILE
    tail -1 $LOG_DIR/metrics/system.jsonl | python3 -m json.tool >> $REPORT_FILE 2>/dev/null || echo "No metrics available" >> $REPORT_FILE
fi
echo "" >> $REPORT_FILE

# Application health
echo "=== Application Health ===" >> $REPORT_FILE
if [ -f "$LOG_DIR/metrics/health.jsonl" ]; then
    echo "Latest health check:" >> $REPORT_FILE
    tail -1 $LOG_DIR/metrics/health.jsonl | python3 -m json.tool >> $REPORT_FILE 2>/dev/null || echo "No health data available" >> $REPORT_FILE
fi

echo "Report saved to: $REPORT_FILE"
cat $REPORT_FILE
EOF

chmod +x /opt/jw-attendant/scripts/analyze-logs.sh

# Install required Python packages for monitoring
echo "[$(date)] Installing monitoring dependencies..."
/opt/jw-attendant/venv/bin/pip install psutil requests

# Restart systemd to pick up new service configuration
systemctl daemon-reload

echo "[$(date)] ✓ Production logging and monitoring setup complete"
echo ""
echo "Log directories created:"
echo "  - Application logs: /var/log/jw-attendant/app/"
echo "  - System logs: /var/log/jw-attendant/system/"
echo "  - Metrics: /var/log/jw-attendant/metrics/"
echo ""
echo "Monitoring configured:"
echo "  - System metrics collected every 5 minutes"
echo "  - Log rotation configured"
echo "  - Analysis script: /opt/jw-attendant/scripts/analyze-logs.sh"
echo ""
echo "To view logs:"
echo "  journalctl -u jw-attendant -f"
echo "  tail -f /var/log/jw-attendant/app/*.log"
