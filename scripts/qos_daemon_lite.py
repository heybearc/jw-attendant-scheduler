#!/usr/bin/env python3
"""
QOS Daemon Lite - Continuous Monitoring Agent (No External Dependencies)
Provides 24/7 monitoring with automatic error detection and intervention
"""

import os
import sys
import time
import signal
import logging
import subprocess
import json
import urllib.request
import urllib.error
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional

class QOSDaemonLite:
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
                print(f"Warning: Failed to load config file {config_file}: {e}")
        
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
        self.logger = logging.getLogger('QOSDaemonLite')
        self.logger.setLevel(logging.INFO)
        
        # Clear existing handlers
        self.logger.handlers.clear()
        
        # File handler for all logs
        file_handler = logging.FileHandler(log_dir / "qos_daemon.log")
        file_handler.setFormatter(detailed_formatter)
        self.logger.addHandler(file_handler)
        
        # Separate file for interventions
        intervention_handler = logging.FileHandler(log_dir / "qos_interventions.log")
        intervention_handler.setFormatter(detailed_formatter)
        
        self.intervention_logger = logging.getLogger('QOSInterventions')
        self.intervention_logger.setLevel(logging.INFO)
        self.intervention_logger.handlers.clear()
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
        """Check web endpoints using urllib (no external dependencies)"""
        env_config = self.config["endpoints"][environment]
        base_url = env_config["base_url"]
        endpoints = self.config["checks"]["web_endpoints"]
        
        results = []
        
        for endpoint in endpoints:
            start_time = time.time()
            try:
                url = f"{base_url}{endpoint}"
                
                # Create request with timeout
                req = urllib.request.Request(url)
                req.add_header('User-Agent', 'QOS-Daemon/1.0')
                
                with urllib.request.urlopen(req, timeout=10) as response:
                    response_time = time.time() - start_time
                    status_code = response.getcode()
                    
                    result = {
                        "endpoint": endpoint,
                        "status_code": status_code,
                        "response_time": response_time,
                        "success": status_code == 200,
                        "error": None
                    }
                    
                    if status_code != 200:
                        if status_code == 502:
                            result["error"] = "Bad Gateway - Service may be down"
                        elif status_code == 403:
                            result["error"] = "Forbidden - Permission issue"
                        elif status_code == 500:
                            result["error"] = "Internal Server Error"
                    
                    results.append(result)
                    
            except urllib.error.HTTPError as e:
                results.append({
                    "endpoint": endpoint,
                    "status_code": e.code,
                    "response_time": time.time() - start_time,
                    "success": False,
                    "error": f"HTTP {e.code}: {e.reason}"
                })
            except urllib.error.URLError as e:
                results.append({
                    "endpoint": endpoint,
                    "status_code": 0,
                    "response_time": 0,
                    "success": False,
                    "error": f"Connection error: {e.reason}"
                })
            except Exception as e:
                results.append({
                    "endpoint": endpoint,
                    "status_code": 0,
                    "response_time": 0,
                    "success": False,
                    "error": str(e)
                })
        
        return results
    
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
            
            return {
                "active": is_active,
                "status_output": result.stdout.strip(),
                "error": None if is_active else f"Service {service_name} not active"
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
                # Get last 20 lines and check for errors
                cmd = f"tail -n 20 {log_file} 2>/dev/null | grep -i 'error\\|exception\\|critical' | tail -n 5"
                
                result = subprocess.run([
                    'ssh', '-F', '/Users/cory/Documents/Cloudy-Work/ssh_config_jw_attendant',
                    ssh_host, cmd
                ], capture_output=True, text=True, timeout=10)
                
                error_lines = result.stdout.strip().split('\n') if result.stdout.strip() else []
                
                results.append({
                    "log_file": log_file,
                    "error_count": len([line for line in error_lines if line.strip()]),
                    "recent_errors": error_lines,
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
                stop_result = subprocess.run([
                    'ssh', '-F', '/Users/cory/Documents/Cloudy-Work/ssh_config_jw_attendant',
                    ssh_host, f'systemctl stop {service_name}'
                ], capture_output=True, text=True, timeout=30)
                
                time.sleep(5)
                
                # Start service
                start_result = subprocess.run([
                    'ssh', '-F', '/Users/cory/Documents/Cloudy-Work/ssh_config_jw_attendant',
                    ssh_host, f'systemctl start {service_name}'
                ], capture_output=True, text=True, timeout=30)
                
                success = start_result.returncode == 0
                
                if success:
                    self.intervention_logger.info(f"Service {service_name} restarted successfully")
                else:
                    self.intervention_logger.error(f"Failed to restart {service_name}: {start_result.stderr}")
                
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
                    issues_detected.append(("reload_nginx", {"reason": "Permission denied"}))
        
        # Analyze log files
        log_results = check_results.get("log_files", [])
        for log_result in log_results:
            if log_result.get("error_count", 0) > 3:
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
        self.logger.info("QOS Daemon Lite starting continuous monitoring...")
        
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
        
        self.logger.info("QOS Daemon Lite stopped")

def main():
    if len(sys.argv) < 2:
        print("Usage: python qos_daemon_lite.py <project_root> [config_file]")
        sys.exit(1)
    
    project_root = sys.argv[1]
    config_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    daemon = QOSDaemonLite(project_root, config_file)
    
    try:
        daemon.run()
    except Exception as e:
        daemon.logger.error(f"Fatal error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
