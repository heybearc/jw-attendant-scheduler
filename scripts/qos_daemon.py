#!/usr/bin/env python3
"""
QOS Daemon - Continuous Monitoring Agent for JW Attendant Scheduler
Provides 24/7 monitoring with automatic error detection and intervention
"""

import os
import sys
import time
import signal
import logging
import threading
import subprocess
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

class QOSDaemon:
    def __init__(self, project_root: str, config_file: Optional[str] = None):
        self.project_root = Path(project_root)
        self.config = self.load_config(config_file)
        self.running = False
        self.last_check = {}
        self.error_counts = {}
        self.intervention_history = []
        
        # Setup logging
        self.setup_logging()
        
        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGTERM, self.signal_handler)
        signal.signal(signal.SIGINT, self.signal_handler)
        
    def load_config(self, config_file: Optional[str]) -> Dict:
        """Load configuration from file or use defaults"""
        default_config = {
            "monitoring": {
                "interval_seconds": 30,
                "health_check_interval": 60,
                "error_threshold": 3,
                "auto_restart_enabled": True,
                "notification_enabled": True
            },
            "endpoints": {
                "staging": {
                    "base_url": "http://10.92.3.24:8001",
                    "ssh_host": "jw-staging",
                    "service_name": "jw-attendant-staging"
                },
                "production": {
                    "base_url": "http://10.92.3.22:8000", 
                    "ssh_host": "jw-production",
                    "service_name": "jw-attendant"
                }
            },
            "checks": {
                "web_endpoints": ["/health/", "/dashboard/", "/reports/", "/users/"],
                "critical_processes": ["gunicorn", "nginx"],
                "log_files": [
                    "/var/log/jw-attendant-staging/error.log",
                    "/var/log/nginx/error.log"
                ]
            },
            "interventions": {
                "restart_service": True,
                "clear_cache": True,
                "fix_permissions": True,
                "reload_nginx": True
            }
        }
        
        if config_file and Path(config_file).exists():
            try:
                with open(config_file, 'r') as f:
                    user_config = json.load(f)
                # Merge user config with defaults
                default_config.update(user_config)
            except Exception as e:
                self.logger.warning(f"Failed to load config file {config_file}: {e}")
        
        return default_config
    
    def setup_logging(self):
        """Setup comprehensive logging"""
        log_dir = self.project_root / "logs"
        log_dir.mkdir(exist_ok=True)
        
        # Create formatters
        detailed_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        
        # Setup main logger
        self.logger = logging.getLogger('QOSDaemon')
        self.logger.setLevel(logging.INFO)
        
        # File handler for all logs
        file_handler = logging.FileHandler(log_dir / "qos_daemon.log")
        file_handler.setFormatter(detailed_formatter)
        self.logger.addHandler(file_handler)
        
        # Separate file for interventions
        intervention_handler = logging.FileHandler(log_dir / "qos_interventions.log")
        intervention_handler.setFormatter(detailed_formatter)
        
        self.intervention_logger = logging.getLogger('QOSInterventions')
        self.intervention_logger.setLevel(logging.INFO)
        self.intervention_logger.addHandler(intervention_handler)
        
        # Console handler for immediate feedback
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))
        self.logger.addHandler(console_handler)
    
    def signal_handler(self, signum, frame):
        """Handle shutdown signals gracefully"""
        self.logger.info(f"Received signal {signum}, shutting down gracefully...")
        self.running = False
    
    def check_web_endpoints(self, environment: str) -> List[Dict]:
        """Check web endpoints for availability and response time"""
        env_config = self.config["endpoints"][environment]
        base_url = env_config["base_url"]
        endpoints = self.config["checks"]["web_endpoints"]
        
        results = []
        
        try:
            # Create session with retry strategy
            session = requests.Session()
            retry_strategy = Retry(
                total=2,
                backoff_factor=0.5,
                status_forcelist=[429, 500, 502, 503, 504],
            )
            adapter = HTTPAdapter(max_retries=retry_strategy)
            session.mount("http://", adapter)
            session.mount("https://", adapter)
            
            for endpoint in endpoints:
                start_time = time.time()
                try:
                    url = f"{base_url}{endpoint}"
                    response = session.get(url, timeout=10)
                    response_time = time.time() - start_time
                    
                    result = {
                        "endpoint": endpoint,
                        "status_code": response.status_code,
                        "response_time": response_time,
                        "success": response.status_code == 200,
                        "error": None
                    }
                    
                    # Check for specific error patterns
                    if response.status_code != 200:
                        if response.status_code == 502:
                            result["error"] = "Bad Gateway - Service may be down"
                        elif response.status_code == 403:
                            result["error"] = "Forbidden - Permission issue"
                        elif response.status_code == 500:
                            result["error"] = "Internal Server Error"
                    
                    results.append(result)
                    
                except requests.exceptions.Timeout:
                    results.append({
                        "endpoint": endpoint,
                        "status_code": 0,
                        "response_time": 10.0,
                        "success": False,
                        "error": "Request timeout"
                    })
                except requests.exceptions.ConnectionError:
                    results.append({
                        "endpoint": endpoint,
                        "status_code": 0,
                        "response_time": 0,
                        "success": False,
                        "error": "Connection refused - Service may be down"
                    })
                except Exception as e:
                    results.append({
                        "endpoint": endpoint,
                        "status_code": 0,
                        "response_time": 0,
                        "success": False,
                        "error": str(e)
                    })
        
        except Exception as e:
            self.logger.error(f"Failed to check web endpoints for {environment}: {e}")
        
        return results
    
    def check_system_resources(self, environment: str) -> Dict:
        """Check system resources via SSH"""
        env_config = self.config["endpoints"][environment]
        ssh_host = env_config["ssh_host"]
        
        try:
            # Check CPU, memory, disk usage
            commands = {
                "cpu_usage": "top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1",
                "memory_usage": "free | grep Mem | awk '{printf \"%.1f\", $3/$2 * 100.0}'",
                "disk_usage": "df -h / | awk 'NR==2{printf \"%s\", $5}' | sed 's/%//'",
                "load_average": "uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//'"
            }
            
            results = {}
            for metric, cmd in commands.items():
                try:
                    result = subprocess.run([
                        'ssh', '-F', '/Users/cory/Documents/Cloudy-Work/ssh_config_jw_attendant',
                        ssh_host, cmd
                    ], capture_output=True, text=True, timeout=10)
                    
                    if result.returncode == 0:
                        value = result.stdout.strip()
                        results[metric] = float(value) if value.replace('.', '').isdigit() else value
                    else:
                        results[metric] = None
                        
                except Exception as e:
                    results[metric] = None
                    self.logger.warning(f"Failed to get {metric} for {environment}: {e}")
            
            return results
            
        except Exception as e:
            self.logger.error(f"Failed to check system resources for {environment}: {e}")
            return {}
    
    def check_service_status(self, environment: str) -> Dict:
        """Check systemd service status"""
        env_config = self.config["endpoints"][environment]
        ssh_host = env_config["ssh_host"]
        service_name = env_config["service_name"]
        
        try:
            result = subprocess.run([
                'ssh', '-F', '/Users/cory/Documents/Cloudy-Work/ssh_config_jw_attendant',
                ssh_host, f'systemctl is-active {service_name}'
            ], capture_output=True, text=True, timeout=10)
            
            is_active = result.stdout.strip() == 'active'
            
            # Get detailed status
            status_result = subprocess.run([
                'ssh', '-F', '/Users/cory/Documents/Cloudy-Work/ssh_config_jw_attendant',
                ssh_host, f'systemctl status {service_name} --no-pager -l'
            ], capture_output=True, text=True, timeout=10)
            
            return {
                "active": is_active,
                "status_output": status_result.stdout,
                "error": None if is_active else "Service not active"
            }
            
        except Exception as e:
            self.logger.error(f"Failed to check service status for {environment}: {e}")
            return {"active": False, "error": str(e)}
    
    def check_log_files(self, environment: str) -> List[Dict]:
        """Check log files for recent errors"""
        env_config = self.config["endpoints"][environment]
        ssh_host = env_config["ssh_host"]
        log_files = self.config["checks"]["log_files"]
        
        results = []
        
        for log_file in log_files:
            try:
                # Get last 50 lines and check for errors in last 5 minutes
                cmd = f"tail -n 50 {log_file} 2>/dev/null | grep -i 'error\\|exception\\|critical' | tail -n 10"
                
                result = subprocess.run([
                    'ssh', '-F', '/Users/cory/Documents/Cloudy-Work/ssh_config_jw_attendant',
                    ssh_host, cmd
                ], capture_output=True, text=True, timeout=10)
                
                error_lines = result.stdout.strip().split('\n') if result.stdout.strip() else []
                
                results.append({
                    "log_file": log_file,
                    "error_count": len([line for line in error_lines if line.strip()]),
                    "recent_errors": error_lines[-5:] if error_lines else [],
                    "accessible": result.returncode == 0
                })
                
            except Exception as e:
                results.append({
                    "log_file": log_file,
                    "error_count": 0,
                    "recent_errors": [],
                    "accessible": False,
                    "error": str(e)
                })
        
        return results
    
    def perform_intervention(self, environment: str, issue_type: str, details: Dict) -> bool:
        """Perform automatic intervention based on detected issue"""
        if not self.config["interventions"].get(issue_type, False):
            self.logger.info(f"Intervention {issue_type} disabled in config")
            return False
        
        env_config = self.config["endpoints"][environment]
        ssh_host = env_config["ssh_host"]
        service_name = env_config["service_name"]
        
        intervention_time = datetime.now()
        success = False
        
        try:
            if issue_type == "restart_service":
                self.intervention_logger.info(f"Restarting service {service_name} on {environment}")
                
                # Stop service
                subprocess.run([
                    'ssh', '-F', '/Users/cory/Documents/Cloudy-Work/ssh_config_jw_attendant',
                    ssh_host, f'systemctl stop {service_name}'
                ], timeout=30)
                
                time.sleep(5)
                
                # Start service
                result = subprocess.run([
                    'ssh', '-F', '/Users/cory/Documents/Cloudy-Work/ssh_config_jw_attendant',
                    ssh_host, f'systemctl start {service_name}'
                ], capture_output=True, text=True, timeout=30)
                
                success = result.returncode == 0
                
            elif issue_type == "clear_cache":
                self.intervention_logger.info(f"Clearing cache on {environment}")
                
                cache_commands = [
                    f"cd /opt/jw-attendant-staging && python3 manage.py collectstatic --noinput",
                    f"systemctl reload {service_name}"
                ]
                
                for cmd in cache_commands:
                    result = subprocess.run([
                        'ssh', '-F', '/Users/cory/Documents/Cloudy-Work/ssh_config_jw_attendant',
                        ssh_host, cmd
                    ], capture_output=True, text=True, timeout=30)
                    
                    if result.returncode != 0:
                        break
                else:
                    success = True
                    
            elif issue_type == "fix_permissions":
                self.intervention_logger.info(f"Fixing permissions on {environment}")
                
                permission_commands = [
                    "chown -R www-data:www-data /opt/jw-attendant-staging",
                    "chmod -R 755 /opt/jw-attendant-staging"
                ]
                
                for cmd in permission_commands:
                    result = subprocess.run([
                        'ssh', '-F', '/Users/cory/Documents/Cloudy-Work/ssh_config_jw_attendant',
                        ssh_host, cmd
                    ], timeout=30)
                    
                    if result.returncode != 0:
                        break
                else:
                    success = True
            
            elif issue_type == "reload_nginx":
                self.intervention_logger.info(f"Reloading nginx on {environment}")
                
                result = subprocess.run([
                    'ssh', '-F', '/Users/cory/Documents/Cloudy-Work/ssh_config_jw_attendant',
                    ssh_host, 'systemctl reload nginx'
                ], capture_output=True, text=True, timeout=30)
                
                success = result.returncode == 0
            
            # Record intervention
            self.intervention_history.append({
                "timestamp": intervention_time,
                "environment": environment,
                "issue_type": issue_type,
                "details": details,
                "success": success
            })
            
            if success:
                self.intervention_logger.info(f"Intervention {issue_type} successful on {environment}")
            else:
                self.intervention_logger.error(f"Intervention {issue_type} failed on {environment}")
            
            return success
            
        except Exception as e:
            self.intervention_logger.error(f"Intervention {issue_type} error on {environment}: {e}")
            return False
    
    def analyze_and_intervene(self, environment: str, check_results: Dict):
        """Analyze check results and perform interventions if needed"""
        issues_detected = []
        
        # Analyze web endpoint results
        web_results = check_results.get("web_endpoints", [])
        failed_endpoints = [r for r in web_results if not r["success"]]
        
        if failed_endpoints:
            # Check if service is down
            service_status = check_results.get("service_status", {})
            if not service_status.get("active", False):
                issues_detected.append(("restart_service", {"reason": "Service not active"}))
            
            # Check for specific error patterns
            for result in failed_endpoints:
                if result.get("status_code") == 502:
                    issues_detected.append(("restart_service", {"reason": "Bad Gateway"}))
                elif result.get("status_code") == 403:
                    issues_detected.append(("fix_permissions", {"reason": "Permission denied"}))
        
        # Analyze system resources
        resources = check_results.get("system_resources", {})
        if resources.get("memory_usage", 0) > 90:
            issues_detected.append(("restart_service", {"reason": "High memory usage"}))
        
        if resources.get("disk_usage", 0) > 95:
            issues_detected.append(("clear_cache", {"reason": "Disk space critical"}))
        
        # Analyze log files
        log_results = check_results.get("log_files", [])
        for log_result in log_results:
            if log_result.get("error_count", 0) > 5:
                issues_detected.append(("restart_service", {"reason": "High error count in logs"}))
        
        # Perform interventions
        for issue_type, details in issues_detected:
            # Check if we've already tried this intervention recently
            recent_interventions = [
                i for i in self.intervention_history 
                if i["environment"] == environment 
                and i["issue_type"] == issue_type
                and (datetime.now() - i["timestamp"]) < timedelta(minutes=10)
            ]
            
            if len(recent_interventions) < 2:  # Don't retry more than twice in 10 minutes
                self.logger.warning(f"Detected issue in {environment}: {issue_type} - {details}")
                success = self.perform_intervention(environment, issue_type, details)
                
                if success:
                    # Wait a bit and recheck
                    time.sleep(10)
                    return True
            else:
                self.logger.error(f"Too many recent interventions for {issue_type} on {environment}")
        
        return False
    
    def run_monitoring_cycle(self):
        """Run a complete monitoring cycle"""
        cycle_start = datetime.now()
        
        for environment in ["staging"]:  # Focus on staging for now
            self.logger.info(f"Checking {environment} environment...")
            
            check_results = {
                "timestamp": cycle_start,
                "environment": environment
            }
            
            # Run all checks
            check_results["web_endpoints"] = self.check_web_endpoints(environment)
            check_results["system_resources"] = self.check_system_resources(environment)
            check_results["service_status"] = self.check_service_status(environment)
            check_results["log_files"] = self.check_log_files(environment)
            
            # Store results
            self.last_check[environment] = check_results
            
            # Count errors
            total_errors = 0
            for endpoint_result in check_results["web_endpoints"]:
                if not endpoint_result["success"]:
                    total_errors += 1
            
            if not check_results["service_status"].get("active", False):
                total_errors += 1
            
            # Update error count
            if environment not in self.error_counts:
                self.error_counts[environment] = 0
            
            if total_errors > 0:
                self.error_counts[environment] += 1
                self.logger.warning(f"{environment}: {total_errors} errors detected (count: {self.error_counts[environment]})")
            else:
                self.error_counts[environment] = 0
                self.logger.info(f"{environment}: All checks passed")
            
            # Trigger intervention if error threshold reached
            if self.error_counts[environment] >= self.config["monitoring"]["error_threshold"]:
                self.logger.error(f"{environment}: Error threshold reached, triggering intervention")
                intervention_success = self.analyze_and_intervene(environment, check_results)
                
                if intervention_success:
                    self.error_counts[environment] = 0  # Reset counter after successful intervention
    
    def run(self):
        """Main daemon loop"""
        self.running = True
        self.logger.info("QOS Daemon starting continuous monitoring...")
        
        while self.running:
            try:
                self.run_monitoring_cycle()
                
                # Sleep for configured interval
                interval = self.config["monitoring"]["interval_seconds"]
                for _ in range(interval):
                    if not self.running:
                        break
                    time.sleep(1)
                    
            except KeyboardInterrupt:
                self.logger.info("Received keyboard interrupt, shutting down...")
                break
            except Exception as e:
                self.logger.error(f"Error in monitoring cycle: {e}")
                time.sleep(5)  # Brief pause before retrying
        
        self.logger.info("QOS Daemon stopped")
    
    def status(self) -> Dict:
        """Get current daemon status"""
        return {
            "running": self.running,
            "last_check": self.last_check,
            "error_counts": self.error_counts,
            "recent_interventions": self.intervention_history[-10:],
            "config": self.config
        }

def main():
    if len(sys.argv) < 2:
        print("Usage: python qos_daemon.py <project_root> [config_file]")
        sys.exit(1)
    
    project_root = sys.argv[1]
    config_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    daemon = QOSDaemon(project_root, config_file)
    
    try:
        daemon.run()
    except Exception as e:
        daemon.logger.error(f"Fatal error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
