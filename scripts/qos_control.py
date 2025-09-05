#!/usr/bin/env python3
"""
QOS Control Script - Manage the QOS Daemon
Provides start, stop, status, and test commands for the monitoring daemon
"""

import os
import sys
import json
import signal
import subprocess
import time
from pathlib import Path
from datetime import datetime

class QOSControl:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.daemon_script = self.project_root / "scripts" / "qos_daemon_lite.py"
        self.config_file = self.project_root / "scripts" / "qos_config.json"
        self.pid_file = self.project_root / "logs" / "qos_daemon.pid"
        self.log_dir = self.project_root / "logs"
        
        # Ensure log directory exists
        self.log_dir.mkdir(exist_ok=True)
    
    def start_daemon(self, background: bool = True):
        """Start the QOS daemon"""
        if self.is_running():
            print("QOS Daemon is already running")
            return False
        
        print("Starting QOS Daemon...")
        
        if background:
            # Start as background process
            with open(self.log_dir / "qos_daemon_stdout.log", "w") as stdout_file:
                with open(self.log_dir / "qos_daemon_stderr.log", "w") as stderr_file:
                    process = subprocess.Popen([
                        sys.executable, str(self.daemon_script),
                        str(self.project_root), str(self.config_file)
                    ], stdout=stdout_file, stderr=stderr_file)
                    
                    # Write PID file
                    with open(self.pid_file, "w") as f:
                        f.write(str(process.pid))
                    
                    print(f"QOS Daemon started with PID {process.pid}")
                    return True
        else:
            # Start in foreground for testing
            subprocess.run([
                sys.executable, str(self.daemon_script),
                str(self.project_root), str(self.config_file)
            ])
            return True
    
    def stop_daemon(self):
        """Stop the QOS daemon"""
        if not self.is_running():
            print("QOS Daemon is not running")
            return False
        
        try:
            with open(self.pid_file, "r") as f:
                pid = int(f.read().strip())
            
            print(f"Stopping QOS Daemon (PID {pid})...")
            os.kill(pid, signal.SIGTERM)
            
            # Wait for process to stop
            for _ in range(10):
                try:
                    os.kill(pid, 0)  # Check if process exists
                    time.sleep(1)
                except OSError:
                    break
            else:
                # Force kill if still running
                print("Force killing daemon...")
                os.kill(pid, signal.SIGKILL)
            
            # Remove PID file
            if self.pid_file.exists():
                self.pid_file.unlink()
            
            print("QOS Daemon stopped")
            return True
            
        except Exception as e:
            print(f"Error stopping daemon: {e}")
            return False
    
    def restart_daemon(self):
        """Restart the QOS daemon"""
        print("Restarting QOS Daemon...")
        self.stop_daemon()
        time.sleep(2)
        return self.start_daemon()
    
    def is_running(self) -> bool:
        """Check if daemon is running"""
        if not self.pid_file.exists():
            return False
        
        try:
            with open(self.pid_file, "r") as f:
                pid = int(f.read().strip())
            
            # Check if process exists
            os.kill(pid, 0)
            return True
        except (OSError, ValueError):
            # Process doesn't exist, clean up PID file
            if self.pid_file.exists():
                self.pid_file.unlink()
            return False
    
    def get_status(self):
        """Get daemon status and recent activity"""
        print("QOS Daemon Status")
        print("=" * 50)
        
        if self.is_running():
            with open(self.pid_file, "r") as f:
                pid = f.read().strip()
            print(f"Status: RUNNING (PID {pid})")
        else:
            print("Status: STOPPED")
        
        # Show recent log entries
        log_file = self.log_dir / "qos_daemon.log"
        if log_file.exists():
            print("\nRecent Log Entries:")
            print("-" * 30)
            try:
                with open(log_file, "r") as f:
                    lines = f.readlines()
                    for line in lines[-10:]:  # Last 10 lines
                        print(line.rstrip())
            except Exception as e:
                print(f"Error reading log file: {e}")
        
        # Show recent interventions
        intervention_log = self.log_dir / "qos_interventions.log"
        if intervention_log.exists():
            print("\nRecent Interventions:")
            print("-" * 30)
            try:
                with open(intervention_log, "r") as f:
                    lines = f.readlines()
                    if lines:
                        for line in lines[-5:]:  # Last 5 interventions
                            print(line.rstrip())
                    else:
                        print("No interventions recorded")
            except Exception as e:
                print(f"Error reading intervention log: {e}")
    
    def test_monitoring(self):
        """Run a single monitoring cycle for testing"""
        print("Running QOS monitoring test...")
        print("=" * 50)
        
        # Import and run a single cycle
        sys.path.insert(0, str(self.project_root / "scripts"))
        
        try:
            from qos_daemon_lite import QOSDaemonLite
            
            daemon = QOSDaemonLite(str(self.project_root), str(self.config_file))
            daemon.run_monitoring_cycle()
            
            print("\nTest Results:")
            print("-" * 20)
            
            for env, results in daemon.last_check.items():
                print(f"\nEnvironment: {env}")
                
                # Web endpoints
                web_results = results.get("web_endpoints", [])
                print(f"Web Endpoints: {len([r for r in web_results if r['success']])}/{len(web_results)} passing")
                
                for result in web_results:
                    status = "✅" if result["success"] else "❌"
                    print(f"  {status} {result['endpoint']} - {result.get('status_code', 'N/A')}")
                
                # Service status
                service = results.get("service_status", {})
                service_status = "✅ Active" if service.get("active") else "❌ Inactive"
                print(f"Service Status: {service_status}")
                
                # System resources
                resources = results.get("system_resources", {})
                if resources:
                    print("System Resources:")
                    for metric, value in resources.items():
                        if value is not None:
                            print(f"  {metric}: {value}")
                
                # Error count
                error_count = daemon.error_counts.get(env, 0)
                print(f"Error Count: {error_count}")
            
            return True
            
        except Exception as e:
            print(f"Test failed: {e}")
            return False
    
    def show_config(self):
        """Show current configuration"""
        print("QOS Daemon Configuration")
        print("=" * 50)
        
        if self.config_file.exists():
            try:
                with open(self.config_file, "r") as f:
                    config = json.load(f)
                print(json.dumps(config, indent=2))
            except Exception as e:
                print(f"Error reading config: {e}")
        else:
            print("Config file not found")
    
    def install_service(self):
        """Install systemd service (requires root)"""
        service_file = self.project_root / "scripts" / "qos_daemon.service"
        
        if not service_file.exists():
            print("Service file not found")
            return False
        
        try:
            # Copy service file to systemd directory
            subprocess.run([
                "sudo", "cp", str(service_file), "/etc/systemd/system/"
            ], check=True)
            
            # Reload systemd
            subprocess.run(["sudo", "systemctl", "daemon-reload"], check=True)
            
            # Enable service
            subprocess.run(["sudo", "systemctl", "enable", "qos_daemon"], check=True)
            
            print("QOS Daemon service installed successfully")
            print("Use 'sudo systemctl start qos_daemon' to start")
            return True
            
        except subprocess.CalledProcessError as e:
            print(f"Failed to install service: {e}")
            return False

def main():
    if len(sys.argv) < 3:
        print("Usage: python qos_control.py <project_root> <command>")
        print("Commands:")
        print("  start     - Start daemon in background")
        print("  stop      - Stop daemon")
        print("  restart   - Restart daemon")
        print("  status    - Show daemon status")
        print("  test      - Run single monitoring cycle")
        print("  config    - Show configuration")
        print("  install   - Install systemd service")
        print("  foreground - Start daemon in foreground (for testing)")
        sys.exit(1)
    
    project_root = sys.argv[1]
    command = sys.argv[2]
    
    control = QOSControl(project_root)
    
    if command == "start":
        control.start_daemon()
    elif command == "stop":
        control.stop_daemon()
    elif command == "restart":
        control.restart_daemon()
    elif command == "status":
        control.get_status()
    elif command == "test":
        control.test_monitoring()
    elif command == "config":
        control.show_config()
    elif command == "install":
        control.install_service()
    elif command == "foreground":
        control.start_daemon(background=False)
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)

if __name__ == '__main__':
    main()
