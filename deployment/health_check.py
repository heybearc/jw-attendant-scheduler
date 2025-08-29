#!/usr/bin/env python3
"""
Health Check and Monitoring System for JW Attendant Scheduler
Provides real-time health monitoring for both frontend and backend
"""

import requests
import json
import time
import sys
import subprocess
from datetime import datetime
from pathlib import Path

class HealthMonitor:
    def __init__(self, base_url="http://10.92.3.22:8000"):
        self.base_url = base_url
        self.log_file = Path("/tmp/jw_health_check.log")
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] {level}: {message}"
        print(log_entry)
        
        # Append to log file
        with open(self.log_file, "a") as f:
            f.write(log_entry + "\n")
    
    def check_frontend(self):
        """Check if frontend is responding"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            if response.status_code == 200:
                self.log("✅ Frontend: OK")
                return True
            else:
                self.log(f"❌ Frontend: HTTP {response.status_code}", "ERROR")
                return False
        except requests.exceptions.RequestException as e:
            self.log(f"❌ Frontend: Connection failed - {e}", "ERROR")
            return False
    
    def check_database(self):
        """Check database connectivity via Django management command"""
        try:
            result = subprocess.run([
                "ssh", "jwa", 
                "cd /opt/jw-attendant && source venv/bin/activate && python manage.py check --database default"
            ], capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                self.log("✅ Database: OK")
                return True
            else:
                self.log(f"❌ Database: Check failed - {result.stderr}", "ERROR")
                return False
        except subprocess.TimeoutExpired:
            self.log("❌ Database: Check timeout", "ERROR")
            return False
        except Exception as e:
            self.log(f"❌ Database: Check error - {e}", "ERROR")
            return False
    
    def check_api_endpoints(self):
        """Check critical API endpoints"""
        endpoints = [
            "/admin/",
            "/events/select/",
        ]
        
        all_good = True
        for endpoint in endpoints:
            try:
                response = requests.get(f"{self.base_url}{endpoint}", timeout=10, allow_redirects=True)
                if response.status_code in [200, 302]:  # 302 for redirects (login required)
                    self.log(f"✅ API {endpoint}: OK")
                else:
                    self.log(f"❌ API {endpoint}: HTTP {response.status_code}", "ERROR")
                    all_good = False
            except requests.exceptions.RequestException as e:
                self.log(f"❌ API {endpoint}: Failed - {e}", "ERROR")
                all_good = False
        
        return all_good
    
    def check_service_status(self):
        """Check systemd service status"""
        try:
            result = subprocess.run([
                "ssh", "jwa", "systemctl", "is-active", "jw-attendant"
            ], capture_output=True, text=True, timeout=10)
            
            if result.stdout.strip() == "active":
                self.log("✅ Service: Active")
                return True
            else:
                self.log(f"❌ Service: {result.stdout.strip()}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Service: Check failed - {e}", "ERROR")
            return False
    
    def get_error_logs(self):
        """Get recent error logs"""
        try:
            result = subprocess.run([
                "ssh", "jwa", 
                "journalctl -u jw-attendant -n 20 --no-pager -o cat"
            ], capture_output=True, text=True, timeout=15)
            
            if result.stdout:
                self.log("📋 Recent logs:")
                for line in result.stdout.strip().split('\n')[-5:]:  # Last 5 lines
                    if line.strip():
                        self.log(f"  {line}")
            
        except Exception as e:
            self.log(f"❌ Log retrieval failed - {e}", "ERROR")
    
    def run_full_check(self):
        """Run complete health check"""
        self.log("🔍 Starting health check...")
        
        checks = [
            ("Service Status", self.check_service_status),
            ("Database", self.check_database),
            ("Frontend", self.check_frontend),
            ("API Endpoints", self.check_api_endpoints),
        ]
        
        results = {}
        all_passed = True
        
        for check_name, check_func in checks:
            self.log(f"Checking {check_name}...")
            results[check_name] = check_func()
            if not results[check_name]:
                all_passed = False
        
        # Summary
        self.log("=" * 50)
        if all_passed:
            self.log("🎉 All health checks PASSED")
        else:
            self.log("⚠️  Some health checks FAILED")
            self.get_error_logs()
        
        self.log("=" * 50)
        return all_passed

def main():
    monitor = HealthMonitor()
    
    if len(sys.argv) > 1 and sys.argv[1] == "--watch":
        # Continuous monitoring mode
        print("Starting continuous health monitoring (Ctrl+C to stop)...")
        try:
            while True:
                monitor.run_full_check()
                time.sleep(60)  # Check every minute
        except KeyboardInterrupt:
            print("\nMonitoring stopped.")
    else:
        # Single check
        success = monitor.run_full_check()
        sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
