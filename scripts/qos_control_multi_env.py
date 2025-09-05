#!/usr/bin/env python3
"""
Multi-Environment QOS Control Script
Manages QOS monitoring across JW Scheduler, LDC Construction Tools, and PostgreSQL
"""

import sys
import os
import json
import signal
import subprocess
import time
from pathlib import Path
from datetime import datetime

class MultiEnvQOSControl:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.daemon_script = self.project_root / "scripts" / "qos_daemon_multi_env.py"
        self.config_file = self.project_root / "scripts" / "qos_config_comprehensive.json"
        self.pid_file = self.project_root / "logs" / "qos_multi_env.pid"
        self.log_dir = self.project_root / "logs"
        
        # Ensure directories exist
        self.log_dir.mkdir(exist_ok=True)
    
    def is_running(self) -> bool:
        """Check if daemon is running"""
        if not self.pid_file.exists():
            return False
        
        try:
            with open(self.pid_file, 'r') as f:
                pid = int(f.read().strip())
            
            # Check if process exists
            os.kill(pid, 0)
            return True
        except (OSError, ValueError):
            # Process doesn't exist, clean up stale pid file
            self.pid_file.unlink(missing_ok=True)
            return False
    
    def start_daemon(self, background: bool = True):
        """Start the multi-environment QOS daemon"""
        if self.is_running():
            print("Multi-Environment QOS daemon is already running")
            return
        
        print("Starting Multi-Environment QOS daemon...")
        
        if background:
            # Start in background
            with open(self.log_dir / "qos_multi_env_stdout.log", "w") as stdout_log:
                with open(self.log_dir / "qos_multi_env_stderr.log", "w") as stderr_log:
                    process = subprocess.Popen([
                        sys.executable, str(self.daemon_script),
                        str(self.project_root), str(self.config_file)
                    ], stdout=stdout_log, stderr=stderr_log)
            
            # Save PID
            with open(self.pid_file, 'w') as f:
                f.write(str(process.pid))
            
            print(f"Multi-Environment QOS daemon started with PID {process.pid}")
            print(f"Logs: {self.log_dir}/qos_multi_env.log")
        else:
            # Start in foreground
            subprocess.run([
                sys.executable, str(self.daemon_script),
                str(self.project_root), str(self.config_file)
            ])
    
    def stop_daemon(self):
        """Stop the daemon"""
        if not self.is_running():
            print("Multi-Environment QOS daemon is not running")
            return
        
        try:
            with open(self.pid_file, 'r') as f:
                pid = int(f.read().strip())
            
            print(f"Stopping Multi-Environment QOS daemon (PID {pid})...")
            os.kill(pid, signal.SIGTERM)
            
            # Wait for graceful shutdown
            for _ in range(10):
                try:
                    os.kill(pid, 0)
                    time.sleep(1)
                except OSError:
                    break
            else:
                # Force kill if still running
                print("Force killing daemon...")
                os.kill(pid, signal.SIGKILL)
            
            self.pid_file.unlink(missing_ok=True)
            print("Multi-Environment QOS daemon stopped")
            
        except Exception as e:
            print(f"Error stopping daemon: {e}")
    
    def restart_daemon(self):
        """Restart the daemon"""
        self.stop_daemon()
        time.sleep(2)
        self.start_daemon()
    
    def get_status(self):
        """Get daemon status and recent activity"""
        if not self.is_running():
            print("❌ Multi-Environment QOS daemon is not running")
            return
        
        with open(self.pid_file, 'r') as f:
            pid = int(f.read().strip())
        
        print(f"✅ Multi-Environment QOS daemon is running (PID {pid})")
        
        # Show recent log entries
        log_file = self.log_dir / "qos_multi_env.log"
        if log_file.exists():
            print("\n📋 Recent Activity:")
            print("-" * 50)
            
            try:
                result = subprocess.run([
                    'tail', '-n', '20', str(log_file)
                ], capture_output=True, text=True)
                
                if result.stdout:
                    print(result.stdout)
                else:
                    print("No recent activity")
            except Exception as e:
                print(f"Error reading log file: {e}")
        
        # Show intervention history
        intervention_log = self.log_dir / "qos_interventions.log"
        if intervention_log.exists():
            print("\n🔧 Recent Interventions:")
            print("-" * 50)
            
            try:
                result = subprocess.run([
                    'tail', '-n', '10', str(intervention_log)
                ], capture_output=True, text=True)
                
                if result.stdout:
                    print(result.stdout)
                else:
                    print("No recent interventions")
            except Exception as e:
                print(f"Error reading intervention log: {e}")
    
    def test_monitoring(self):
        """Run a single monitoring cycle for testing"""
        print("Running Multi-Environment QOS monitoring test...")
        print("=" * 60)
        
        sys.path.insert(0, str(self.project_root / "scripts"))
        
        try:
            from qos_daemon_multi_env import MultiEnvQOSDaemon
            
            daemon = MultiEnvQOSDaemon(str(self.project_root), str(self.config_file))
            daemon.run_monitoring_cycle()
            
            print("\n📊 Test Results Summary:")
            print("=" * 60)
            
            for env_name, results in daemon.last_check.items():
                env_config = daemon.config["environments"][env_name]
                priority = env_config.get("priority", "medium")
                
                print(f"\n🏢 {env_config.get('name', env_name)} ({priority.upper()} priority)")
                print("-" * 40)
                
                # Web endpoints
                web_results = results.get("web_endpoints", [])
                if web_results:
                    passing = len([r for r in web_results if r["success"]])
                    total = len(web_results)
                    status = "✅" if passing == total else "❌"
                    print(f"  {status} Web Endpoints: {passing}/{total} passing")
                    
                    for result in web_results:
                        status = "✅" if result["success"] else "❌"
                        endpoint = result["endpoint"]
                        if result["success"]:
                            rt = result["response_time"]
                            print(f"    {status} {endpoint} - {result['status_code']} ({rt:.2f}s)")
                        else:
                            print(f"    {status} {endpoint} - {result.get('error', 'Unknown error')}")
                
                # Service status
                service_status = results.get("service_status", {})
                if service_status:
                    status = "✅" if service_status.get("active", False) else "❌"
                    state = "Active" if service_status.get("active", False) else "Inactive"
                    print(f"  {status} Service Status: {state}")
                
                # Database health
                db_health = results.get("database_health", {})
                if db_health:
                    status = "✅" if db_health.get("available", False) else "❌"
                    state = "Available" if db_health.get("available", False) else "Unavailable"
                    print(f"  {status} Database Health: {state}")
                    
                    if db_health.get("active_connections") is not None:
                        connections = db_health["active_connections"]
                        usage = db_health.get("connection_usage_percent", 0)
                        print(f"    📊 Active Connections: {connections} ({usage:.1f}% usage)")
                
                # System resources
                sys_resources = results.get("system_resources", {})
                if sys_resources and "error" not in sys_resources:
                    cpu = sys_resources.get("cpu_usage", 0)
                    mem = sys_resources.get("memory_usage", 0)
                    disk = sys_resources.get("disk_usage", 0)
                    
                    cpu_status = "⚠️" if sys_resources.get("cpu_critical", False) else "✅"
                    mem_status = "⚠️" if sys_resources.get("memory_critical", False) else "✅"
                    disk_status = "⚠️" if sys_resources.get("disk_critical", False) else "✅"
                    
                    print(f"  {cpu_status} CPU Usage: {cpu:.1f}%")
                    print(f"  {mem_status} Memory Usage: {mem:.1f}%")
                    print(f"  {disk_status} Disk Usage: {disk:.1f}%")
                
                # Error count
                error_count = daemon.error_counts.get(env_name, 0)
                if error_count > 0:
                    print(f"  ⚠️ Error Count: {error_count}")
                else:
                    print(f"  ✅ Error Count: 0")
            
            print(f"\n⏱️ Monitoring cycle completed successfully")
            
        except ImportError as e:
            print(f"❌ Error importing daemon module: {e}")
        except Exception as e:
            print(f"❌ Error running test: {e}")
    
    def show_config(self):
        """Display current configuration"""
        if not self.config_file.exists():
            print("❌ Configuration file not found")
            return
        
        try:
            with open(self.config_file, 'r') as f:
                config = json.load(f)
            
            print("📋 Multi-Environment QOS Configuration")
            print("=" * 50)
            
            # Monitoring settings
            monitoring = config.get("monitoring", {})
            print(f"⏱️  Monitoring Interval: {monitoring.get('interval_seconds', 30)}s")
            print(f"🚨 Error Threshold: {monitoring.get('error_threshold', 3)}")
            print(f"🔄 Auto-restart: {'Enabled' if monitoring.get('auto_restart_enabled', True) else 'Disabled'}")
            
            # Environments
            environments = config.get("environments", {})
            print(f"\n🏢 Monitored Environments: {len(environments)}")
            
            for env_name, env_config in environments.items():
                priority = env_config.get("priority", "medium")
                name = env_config.get("name", env_name)
                url = env_config.get("base_url", "N/A")
                
                print(f"\n  📍 {name}")
                print(f"     Priority: {priority.upper()}")
                print(f"     URL: {url}")
                print(f"     SSH Host: {env_config.get('ssh_host', 'N/A')}")
                print(f"     Service: {env_config.get('service_name', 'N/A')}")
                
                if "database_checks" in env_config:
                    db_config = env_config["database_checks"]
                    databases = db_config.get("databases", [])
                    print(f"     Databases: {', '.join(databases)}")
            
            # Interventions
            interventions = config.get("interventions", {})
            enabled_interventions = [k for k, v in interventions.items() if v.get("enabled", False)]
            print(f"\n🔧 Enabled Interventions: {', '.join(enabled_interventions)}")
            
        except Exception as e:
            print(f"❌ Error reading configuration: {e}")
    
    def install_systemd_service(self):
        """Install systemd service for the multi-environment daemon"""
        service_content = f"""[Unit]
Description=Multi-Environment QOS Monitoring Daemon
After=network.target
Wants=network.target

[Service]
Type=forking
User=root
Group=root
WorkingDirectory={self.project_root}
Environment=PYTHONPATH={self.project_root}/scripts
ExecStart=/usr/bin/python3 {self.daemon_script} {self.project_root} {self.config_file}
PIDFile={self.pid_file}
Restart=always
RestartSec=10
StandardOutput=append:{self.log_dir}/qos_multi_env_stdout.log
StandardError=append:{self.log_dir}/qos_multi_env_stderr.log

# Security settings
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths={self.project_root}/logs

[Install]
WantedBy=multi-user.target
"""
        
        service_file = Path("/tmp/qos-multi-env-daemon.service")
        
        try:
            with open(service_file, 'w') as f:
                f.write(service_content)
            
            print("Installing systemd service...")
            subprocess.run(['sudo', 'cp', str(service_file), '/etc/systemd/system/'], check=True)
            subprocess.run(['sudo', 'systemctl', 'daemon-reload'], check=True)
            
            print("✅ Systemd service installed successfully")
            print("To enable and start:")
            print("  sudo systemctl enable qos-multi-env-daemon")
            print("  sudo systemctl start qos-multi-env-daemon")
            
        except subprocess.CalledProcessError as e:
            print(f"❌ Error installing service: {e}")
        except Exception as e:
            print(f"❌ Error: {e}")

def main():
    if len(sys.argv) < 3:
        print("Multi-Environment QOS Control")
        print("Usage: python qos_control_multi_env.py <project_root> <command>")
        print("\nCommands:")
        print("  start      - Start daemon in background")
        print("  stop       - Stop daemon")
        print("  restart    - Restart daemon")
        print("  status     - Show daemon status and recent activity")
        print("  test       - Run single monitoring cycle")
        print("  config     - Show current configuration")
        print("  install    - Install systemd service")
        print("  foreground - Start daemon in foreground (for debugging)")
        sys.exit(1)
    
    project_root = sys.argv[1]
    command = sys.argv[2]
    
    controller = MultiEnvQOSControl(project_root)
    
    if command == "start":
        controller.start_daemon()
    elif command == "stop":
        controller.stop_daemon()
    elif command == "restart":
        controller.restart_daemon()
    elif command == "status":
        controller.get_status()
    elif command == "test":
        controller.test_monitoring()
    elif command == "config":
        controller.show_config()
    elif command == "install":
        controller.install_systemd_service()
    elif command == "foreground":
        controller.start_daemon(background=False)
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)

if __name__ == '__main__':
    main()
