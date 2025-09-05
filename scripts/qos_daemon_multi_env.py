#!/usr/bin/env python3
"""
Multi-Environment QOS Daemon - Comprehensive Infrastructure Monitoring
Monitors JW Scheduler, LDC Construction Tools, and PostgreSQL across all environments
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
import socket
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any

class MultiEnvQOSDaemon:
    def __init__(self, project_root: str, config_file: Optional[str] = None):
        self.project_root = Path(project_root)
        self.config = self.load_config(config_file)
        self.running = False
        self.last_check = {}
        self.error_counts = {}
        self.intervention_history = []
        self.metrics = {}
        
        # Setup logging
        self.setup_logging()
        
        # Setup signal handlers
        signal.signal(signal.SIGTERM, self.signal_handler)
        signal.signal(signal.SIGINT, self.signal_handler)
        
    def load_config(self, config_file: Optional[str]) -> Dict:
        """Load comprehensive configuration"""
        config_path = config_file or str(self.project_root / "scripts" / "qos_config_comprehensive.json")
        
        if Path(config_path).exists():
            try:
                with open(config_path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading config: {e}")
        
        # Fallback minimal config
        return {
            "monitoring": {"interval_seconds": 30, "error_threshold": 3},
            "environments": {
                "jw_staging": {
                    "name": "JW Scheduler Staging",
                    "base_url": "http://10.92.3.24:8001",
                    "ssh_host": "jw-staging",
                    "service_name": "jw-attendant-staging",
                    "priority": "high"
                }
            }
        }
    
    def setup_logging(self):
        """Setup comprehensive logging system"""
        log_dir = self.project_root / "logs"
        log_dir.mkdir(exist_ok=True)
        
        # Create reports directory
        reports_dir = log_dir / "reports"
        reports_dir.mkdir(exist_ok=True)
        
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        
        # Main logger
        self.logger = logging.getLogger('MultiEnvQOS')
        self.logger.setLevel(logging.INFO)
        self.logger.handlers.clear()
        
        # File handler
        file_handler = logging.FileHandler(log_dir / "qos_multi_env.log")
        file_handler.setFormatter(formatter)
        self.logger.addHandler(file_handler)
        
        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))
        self.logger.addHandler(console_handler)
        
        # Intervention logger
        self.intervention_logger = logging.getLogger('QOSInterventions')
        self.intervention_logger.setLevel(logging.INFO)
        self.intervention_logger.handlers.clear()
        
        intervention_handler = logging.FileHandler(log_dir / "qos_interventions.log")
        intervention_handler.setFormatter(formatter)
        self.intervention_logger.addHandler(intervention_handler)
    
    def signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        self.logger.info(f"Received signal {signum}, shutting down...")
        self.running = False
    
    def check_web_endpoints(self, env_name: str, env_config: Dict) -> List[Dict]:
        """Check web endpoints for an environment"""
        if not env_config.get("base_url"):
            return []
        
        base_url = env_config["base_url"]
        endpoints = env_config.get("endpoints", ["/"])
        results = []
        
        for endpoint in endpoints:
            start_time = time.time()
            try:
                url = f"{base_url}{endpoint}"
                req = urllib.request.Request(url)
                req.add_header('User-Agent', 'QOS-MultiEnv/1.0')
                
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
                        result["error"] = f"HTTP {status_code}"
                    
                    results.append(result)
                    
            except Exception as e:
                results.append({
                    "endpoint": endpoint,
                    "status_code": 0,
                    "response_time": time.time() - start_time,
                    "success": False,
                    "error": str(e)
                })
        
        return results
    
    def check_database_health(self, env_name: str, env_config: Dict) -> Dict:
        """Check PostgreSQL database health"""
        if "database_checks" not in env_config:
            return {"available": False, "reason": "No database config"}
        
        db_config = env_config["database_checks"]
        ssh_host = env_config["ssh_host"]
        
        try:
            # Check PostgreSQL service status
            service_result = subprocess.run([
                'ssh', '-o', 'ConnectTimeout=5', '-o', 'ServerAliveInterval=5',
                '-o', 'ServerAliveCountMax=2', '-o', 'BatchMode=yes',
                '-F', self.config["ssh_config"]["config_file"],
                ssh_host, 'systemctl is-active postgresql'
            ], capture_output=True, text=True, timeout=15)
            
            service_active = service_result.stdout.strip() == 'active'
            
            # Check port connectivity
            port_check = subprocess.run([
                'ssh', '-o', 'ConnectTimeout=5', '-o', 'ServerAliveInterval=5',
                '-o', 'ServerAliveCountMax=2', '-o', 'BatchMode=yes',
                '-F', self.config["ssh_config"]["config_file"],
                ssh_host, f'nc -z localhost {db_config["port"]}'
            ], capture_output=True, text=True, timeout=15)
            
            port_open = port_check.returncode == 0
            
            # Check database connections
            connections_result = subprocess.run([
                'ssh', '-o', 'ConnectTimeout=5', '-o', 'ServerAliveInterval=5',
                '-o', 'ServerAliveCountMax=2', '-o', 'BatchMode=yes',
                '-F', self.config["ssh_config"]["config_file"],
                ssh_host, 'sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"'
            ], capture_output=True, text=True, timeout=15)
            
            active_connections = 0
            if connections_result.returncode == 0:
                try:
                    # Parse connection count from output
                    lines = connections_result.stdout.strip().split('\n')
                    for line in lines:
                        if line.strip().isdigit():
                            active_connections = int(line.strip())
                            break
                except:
                    pass
            
            return {
                "available": service_active and port_open,
                "service_active": service_active,
                "port_open": port_open,
                "active_connections": active_connections,
                "max_connections_threshold": db_config.get("max_connections_threshold", 100),
                "connection_usage_percent": (active_connections / db_config.get("max_connections_threshold", 100)) * 100
            }
            
        except Exception as e:
            return {
                "available": False,
                "error": str(e)
            }
    
    def check_service_status(self, env_name: str, env_config: Dict) -> Dict:
        """Check systemd service status"""
        ssh_host = env_config["ssh_host"]
        service_name = env_config["service_name"]
        
        try:
            # Check service status
            result = subprocess.run([
                'ssh', '-o', 'ConnectTimeout=5', '-o', 'ServerAliveInterval=5', 
                '-o', 'ServerAliveCountMax=2', '-o', 'BatchMode=yes',
                '-F', self.config["ssh_config"]["config_file"],
                ssh_host, f'systemctl is-active {service_name}'
            ], capture_output=True, text=True, timeout=15)
            
            is_active = result.stdout.strip() == 'active'
            
            # Get detailed status if needed
            if not is_active:
                status_result = subprocess.run([
                    'ssh', '-o', 'ConnectTimeout=5', '-o', 'ServerAliveInterval=5',
                    '-o', 'ServerAliveCountMax=2', '-o', 'BatchMode=yes',
                    '-F', self.config["ssh_config"]["config_file"],
                    ssh_host, f'systemctl status {service_name} --no-pager -l'
                ], capture_output=True, text=True, timeout=15)
                
                return {
                    "active": False,
                    "status_output": result.stdout.strip(),
                    "detailed_status": status_result.stdout,
                    "error": f"Service {service_name} not active"
                }
            
            return {
                "active": True,
                "status_output": result.stdout.strip(),
                "error": None
            }
            
        except Exception as e:
            return {"active": False, "error": str(e)}
    
    def check_system_resources(self, env_name: str, env_config: Dict) -> Dict:
        """Check system resource usage"""
        ssh_host = env_config["ssh_host"]
        
        try:
            # CPU usage
            cpu_result = subprocess.run([
                'ssh', '-o', 'ConnectTimeout=5', '-o', 'ServerAliveInterval=5',
                '-o', 'ServerAliveCountMax=2', '-o', 'BatchMode=yes',
                '-F', self.config["ssh_config"]["config_file"],
                ssh_host, "top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1"
            ], capture_output=True, text=True, timeout=15)
            
            # Memory usage
            mem_result = subprocess.run([
                'ssh', '-o', 'ConnectTimeout=5', '-o', 'ServerAliveInterval=5',
                '-o', 'ServerAliveCountMax=2', '-o', 'BatchMode=yes',
                '-F', self.config["ssh_config"]["config_file"],
                ssh_host, "free | grep Mem | awk '{printf \"%.1f\", $3/$2 * 100.0}'"
            ], capture_output=True, text=True, timeout=15)
            
            # Disk usage
            disk_result = subprocess.run([
                'ssh', '-o', 'ConnectTimeout=5', '-o', 'ServerAliveInterval=5',
                '-o', 'ServerAliveCountMax=2', '-o', 'BatchMode=yes',
                '-F', self.config["ssh_config"]["config_file"],
                ssh_host, "df / | tail -1 | awk '{print $5}' | cut -d'%' -f1"
            ], capture_output=True, text=True, timeout=15)
            
            cpu_usage = float(cpu_result.stdout.strip()) if cpu_result.stdout.strip() else 0
            mem_usage = float(mem_result.stdout.strip()) if mem_result.stdout.strip() else 0
            disk_usage = float(disk_result.stdout.strip()) if disk_result.stdout.strip() else 0
            
            thresholds = self.config.get("checks", {}).get("system_resources", {})
            
            return {
                "cpu_usage": cpu_usage,
                "memory_usage": mem_usage,
                "disk_usage": disk_usage,
                "cpu_critical": cpu_usage > thresholds.get("cpu_threshold", 90),
                "memory_critical": mem_usage > thresholds.get("memory_threshold", 85),
                "disk_critical": disk_usage > thresholds.get("disk_threshold", 90)
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    def check_log_files(self, env_name: str, env_config: Dict) -> List[Dict]:
        """Check log files for errors"""
        ssh_host = env_config["ssh_host"]
        log_files = env_config.get("log_files", [])
        results = []
        
        for log_file in log_files:
            try:
                # Check recent errors
                cmd = f"tail -n 50 {log_file} 2>/dev/null | grep -i 'error\\|exception\\|critical' | tail -n 10"
                
                result = subprocess.run([
                    'ssh', '-o', 'ConnectTimeout=5', '-o', 'ServerAliveInterval=5',
                    '-o', 'ServerAliveCountMax=2', '-o', 'BatchMode=yes',
                    '-F', self.config["ssh_config"]["config_file"],
                    ssh_host, cmd
                ], capture_output=True, text=True, timeout=15)
                
                error_lines = [line.strip() for line in result.stdout.strip().split('\n') if line.strip()]
                
                results.append({
                    "log_file": log_file,
                    "error_count": len(error_lines),
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
    
    def perform_intervention(self, env_name: str, env_config: Dict, issue_type: str, details: Dict) -> bool:
        """Perform automatic intervention"""
        intervention_config = self.config.get("interventions", {}).get(issue_type, {})
        
        if not intervention_config.get("enabled", False):
            return False
        
        # Check cooldown
        recent_interventions = [
            i for i in self.intervention_history
            if i["environment"] == env_name
            and i["issue_type"] == issue_type
            and (datetime.now() - i["timestamp"]) < timedelta(minutes=intervention_config.get("cooldown_minutes", 10))
        ]
        
        if recent_interventions:
            self.logger.info(f"Intervention {issue_type} on {env_name} in cooldown")
            return False
        
        ssh_host = env_config["ssh_host"]
        service_name = env_config["service_name"]
        success = False
        
        try:
            if issue_type == "restart_service":
                self.intervention_logger.info(f"Restarting {service_name} on {env_name}")
                
                # Stop service
                stop_result = subprocess.run([
                    'ssh', '-o', 'ConnectTimeout=5', '-o', 'ServerAliveInterval=5',
                    '-o', 'ServerAliveCountMax=2', '-o', 'BatchMode=yes',
                    '-F', self.config["ssh_config"]["config_file"],
                    ssh_host, f'systemctl stop {service_name}'
                ], capture_output=True, text=True, timeout=30)
                
                time.sleep(5)
                
                # Start service
                start_result = subprocess.run([
                    'ssh', '-o', 'ConnectTimeout=5', '-o', 'ServerAliveInterval=5',
                    '-o', 'ServerAliveCountMax=2', '-o', 'BatchMode=yes',
                    '-F', self.config["ssh_config"]["config_file"],
                    ssh_host, f'systemctl start {service_name}'
                ], capture_output=True, text=True, timeout=30)
                
                success = start_result.returncode == 0
                
            elif issue_type == "reload_nginx":
                self.intervention_logger.info(f"Reloading nginx on {env_name}")
                
                result = subprocess.run([
                    'ssh', '-o', 'ConnectTimeout=5', '-o', 'ServerAliveInterval=5',
                    '-o', 'ServerAliveCountMax=2', '-o', 'BatchMode=yes',
                    '-F', self.config["ssh_config"]["config_file"],
                    ssh_host, 'systemctl reload nginx'
                ], capture_output=True, text=True, timeout=30)
                
                success = result.returncode == 0
            
            elif issue_type == "database_maintenance":
                self.intervention_logger.info(f"Running database maintenance on {env_name}")
                
                # Run VACUUM on databases
                for db_name in env_config.get("database_checks", {}).get("databases", []):
                    vacuum_result = subprocess.run([
                        'ssh', '-o', 'ConnectTimeout=5', '-o', 'ServerAliveInterval=5',
                        '-o', 'ServerAliveCountMax=2', '-o', 'BatchMode=yes',
                        '-F', self.config["ssh_config"]["config_file"],
                        ssh_host, f'sudo -u postgres psql -d {db_name} -c "VACUUM;"'
                    ], capture_output=True, text=True, timeout=60)
                
                success = True  # Consider successful if no exceptions
            
            # Record intervention
            self.intervention_history.append({
                "timestamp": datetime.now(),
                "environment": env_name,
                "issue_type": issue_type,
                "details": details,
                "success": success
            })
            
            return success
            
        except Exception as e:
            self.intervention_logger.error(f"Intervention {issue_type} failed on {env_name}: {e}")
            return False
    
    def analyze_and_intervene(self, env_name: str, env_config: Dict, check_results: Dict):
        """Analyze results and trigger interventions"""
        issues = []
        
        # Web endpoint analysis
        web_results = check_results.get("web_endpoints", [])
        failed_endpoints = [r for r in web_results if not r["success"]]
        
        if failed_endpoints:
            service_status = check_results.get("service_status", {})
            if not service_status.get("active", False):
                issues.append(("restart_service", {"reason": "Service not active"}))
            
            for result in failed_endpoints:
                if result.get("status_code") == 502:
                    issues.append(("restart_service", {"reason": "Bad Gateway"}))
                elif result.get("status_code") == 403:
                    issues.append(("reload_nginx", {"reason": "Forbidden"}))
        
        # Database analysis
        db_results = check_results.get("database_health", {})
        if not db_results.get("available", True):
            if "database_checks" in env_config:
                issues.append(("restart_service", {"reason": "Database unavailable"}))
        
        # System resource analysis
        sys_results = check_results.get("system_resources", {})
        if sys_results.get("memory_critical", False):
            issues.append(("restart_service", {"reason": "High memory usage"}))
        
        # Log analysis
        log_results = check_results.get("log_files", [])
        high_error_logs = [l for l in log_results if l.get("error_count", 0) > 5]
        if high_error_logs:
            issues.append(("restart_service", {"reason": "High error count in logs"}))
        
        # Execute interventions
        for issue_type, details in issues:
            success = self.perform_intervention(env_name, env_config, issue_type, details)
            if success:
                self.logger.info(f"Intervention {issue_type} successful on {env_name}")
                time.sleep(10)  # Wait before next check
                return True
        
        return False
    
    def run_environment_checks(self, env_name: str, env_config: Dict) -> Dict:
        """Run all checks for a single environment"""
        self.logger.info(f"Checking {env_config.get('name', env_name)}...")
        
        check_results = {
            "timestamp": datetime.now(),
            "environment": env_name,
            "priority": env_config.get("priority", "medium")
        }
        
        # Web endpoint checks
        if env_config.get("base_url"):
            check_results["web_endpoints"] = self.check_web_endpoints(env_name, env_config)
        
        # Service status checks
        check_results["service_status"] = self.check_service_status(env_name, env_config)
        
        # Database health checks
        if "database_checks" in env_config:
            check_results["database_health"] = self.check_database_health(env_name, env_config)
        
        # System resource checks
        check_results["system_resources"] = self.check_system_resources(env_name, env_config)
        
        # Log file checks
        check_results["log_files"] = self.check_log_files(env_name, env_config)
        
        return check_results
    
    def run_monitoring_cycle(self):
        """Run complete monitoring cycle for all environments"""
        cycle_start = datetime.now()
        self.logger.info("Starting monitoring cycle for all environments")
        
        for env_name, env_config in self.config["environments"].items():
            try:
                # Run checks
                check_results = self.run_environment_checks(env_name, env_config)
                self.last_check[env_name] = check_results
                
                # Count errors
                total_errors = 0
                
                # Web endpoint errors
                for result in check_results.get("web_endpoints", []):
                    if not result["success"]:
                        total_errors += 1
                
                # Service errors
                if not check_results.get("service_status", {}).get("active", False):
                    total_errors += 1
                
                # Database errors
                if not check_results.get("database_health", {}).get("available", True):
                    total_errors += 1
                
                # Update error count
                if env_name not in self.error_counts:
                    self.error_counts[env_name] = 0
                
                if total_errors > 0:
                    self.error_counts[env_name] += 1
                    priority = env_config.get("priority", "medium")
                    self.logger.warning(f"{env_name} ({priority}): {total_errors} errors (count: {self.error_counts[env_name]})")
                else:
                    self.error_counts[env_name] = 0
                    self.logger.info(f"{env_name}: All checks passed")
                
                # Trigger interventions if threshold reached
                error_threshold = self.config["monitoring"]["error_threshold"]
                if self.error_counts[env_name] >= error_threshold:
                    self.logger.error(f"{env_name}: Error threshold reached, triggering intervention")
                    intervention_success = self.analyze_and_intervene(env_name, env_config, check_results)
                    
                    if intervention_success:
                        self.error_counts[env_name] = 0
                
            except Exception as e:
                self.logger.error(f"Error checking {env_name}: {e}")
        
        cycle_duration = (datetime.now() - cycle_start).total_seconds()
        self.logger.info(f"Monitoring cycle completed in {cycle_duration:.1f}s")
    
    def run(self):
        """Main daemon loop"""
        self.running = True
        self.logger.info("Multi-Environment QOS Daemon starting...")
        
        # Log configured environments
        for env_name, env_config in self.config["environments"].items():
            priority = env_config.get("priority", "medium")
            self.logger.info(f"Monitoring: {env_config.get('name', env_name)} ({priority} priority)")
        
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
                self.logger.info("Keyboard interrupt received")
                break
            except Exception as e:
                self.logger.error(f"Error in monitoring cycle: {e}")
                time.sleep(5)
        
        self.logger.info("Multi-Environment QOS Daemon stopped")

def main():
    if len(sys.argv) < 2:
        print("Usage: python qos_daemon_multi_env.py <project_root> [config_file]")
        sys.exit(1)
    
    project_root = sys.argv[1]
    config_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    daemon = MultiEnvQOSDaemon(project_root, config_file)
    
    try:
        daemon.run()
    except Exception as e:
        daemon.logger.error(f"Fatal error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
