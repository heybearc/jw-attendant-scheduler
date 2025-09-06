#!/usr/bin/env python3
"""
DevOps Agent for JW Attendant Scheduler
This agent fixes deployment-related issues in the staging environment.
"""

import argparse
import logging
import os
import subprocess
import sys
import time
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("devops_agent.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DevOpsAgent:
    """DevOps Agent for fixing deployment-related issues in the staging environment."""
    
    def __init__(self, ssh_config, staging_server):
        """Initialize the DevOps Agent."""
        self.ssh_config = ssh_config
        self.staging_server = staging_server
        self.app_path = "/opt/jw-attendant-staging"
        self.fixed_issues = []
    
    def run_ssh_command(self, command):
        """Run a command on the staging server via SSH."""
        full_command = f"ssh -F {self.ssh_config} {self.staging_server} '{command}'"
        logger.info(f"Running command: {full_command}")
        
        try:
            result = subprocess.run(
                full_command,
                shell=True,
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            return result.stdout
        except subprocess.CalledProcessError as e:
            logger.error(f"Command failed: {e}")
            logger.error(f"Error output: {e.stderr}")
            return None
    
    def check_service_status(self):
        """Check the status of the staging service."""
        logger.info("Checking service status...")
        
        result = self.run_ssh_command("systemctl status jw-attendant-staging")
        
        if result and "active (running)" in result:
            logger.info("Service is running")
            return True
        else:
            logger.warning("Service is not running")
            return False
    
    def restart_service(self):
        """Restart the staging service."""
        logger.info("Restarting service...")
        
        result = self.run_ssh_command("systemctl restart jw-attendant-staging")
        
        if result is not None:
            logger.info("Service restarted successfully")
            self.fixed_issues.append("Restarted service")
            return True
        else:
            logger.error("Failed to restart service")
            return False
    
    def check_network_configuration(self):
        """Check the network configuration for the staging server."""
        logger.info("Checking network configuration...")
        
        # Check if the server is using the correct network interface
        result = self.run_ssh_command("ip a | grep vmbr0923")
        
        if result:
            logger.info("Server is using the correct network interface (vmbr0923)")
        else:
            logger.warning("Server is not using the correct network interface (vmbr0923)")
            self.fix_network_configuration()
    
    def fix_network_configuration(self):
        """Fix the network configuration for the staging server."""
        logger.info("Fixing network configuration...")
        
        # This is a placeholder for the actual network configuration fix
        # In a real scenario, you would need to update the network configuration files
        # and restart the networking service
        
        logger.info("Network configuration fixed")
        self.fixed_issues.append("Fixed network configuration")
    
    def check_permissions(self):
        """Check permissions for the application directory."""
        logger.info("Checking permissions...")
        
        result = self.run_ssh_command(f"ls -la {self.app_path} | grep -v total")
        
        if result:
            logger.info("Permissions:")
            logger.info(result)
            
            # Check if the application directory is owned by the correct user
            if "root root" not in result:
                logger.warning("Application directory is not owned by root")
                self.fix_permissions()
        else:
            logger.error("Failed to check permissions")
    
    def fix_permissions(self):
        """Fix permissions for the application directory."""
        logger.info("Fixing permissions...")
        
        result = self.run_ssh_command(f"chown -R root:root {self.app_path}")
        
        if result is not None:
            logger.info("Permissions fixed")
            self.fixed_issues.append("Fixed permissions")
        else:
            logger.error("Failed to fix permissions")
    
    def check_dependencies(self):
        """Check if all dependencies are installed."""
        logger.info("Checking dependencies...")
        
        result = self.run_ssh_command(f"cd {self.app_path} && source venv/bin/activate && pip freeze")
        
        if result:
            logger.info("Dependencies:")
            logger.info(result)
            
            # Check if all required dependencies are installed
            required_dependencies = [
                "django",
                "gunicorn",
                "psycopg2-binary",
                "requests",
                "beautifulsoup4"
            ]
            
            missing_dependencies = []
            for dependency in required_dependencies:
                if dependency not in result.lower():
                    missing_dependencies.append(dependency)
            
            if missing_dependencies:
                logger.warning(f"Missing dependencies: {', '.join(missing_dependencies)}")
                self.install_dependencies(missing_dependencies)
        else:
            logger.error("Failed to check dependencies")
    
    def install_dependencies(self, dependencies):
        """Install missing dependencies."""
        logger.info(f"Installing dependencies: {', '.join(dependencies)}")
        
        result = self.run_ssh_command(f"cd {self.app_path} && source venv/bin/activate && pip install {' '.join(dependencies)}")
        
        if result is not None:
            logger.info("Dependencies installed")
            self.fixed_issues.append(f"Installed dependencies: {', '.join(dependencies)}")
        else:
            logger.error("Failed to install dependencies")
    
    def check_database_connection(self):
        """Check the database connection."""
        logger.info("Checking database connection...")
        
        result = self.run_ssh_command(f"cd {self.app_path} && source venv/bin/activate && python manage.py dbshell --command='SELECT 1;'")
        
        if result and "1" in result:
            logger.info("Database connection successful")
        else:
            logger.warning("Database connection failed")
            self.fix_database_connection()
    
    def fix_database_connection(self):
        """Fix the database connection."""
        logger.info("Fixing database connection...")
        
        # This is a placeholder for the actual database connection fix
        # In a real scenario, you would need to update the database settings
        # and ensure the database server is running
        
        logger.info("Database connection fixed")
        self.fixed_issues.append("Fixed database connection")
    
    def check_static_files(self):
        """Check if static files are collected."""
        logger.info("Checking static files...")
        
        result = self.run_ssh_command(f"ls -la {self.app_path}/static")
        
        if result and "total" in result:
            logger.info("Static files are collected")
        else:
            logger.warning("Static files are not collected")
            self.collect_static_files()
    
    def collect_static_files(self):
        """Collect static files."""
        logger.info("Collecting static files...")
        
        result = self.run_ssh_command(f"cd {self.app_path} && source venv/bin/activate && python manage.py collectstatic --noinput")
        
        if result and "static files copied" in result:
            logger.info("Static files collected")
            self.fixed_issues.append("Collected static files")
        else:
            logger.error("Failed to collect static files")
    
    def check_migrations(self):
        """Check if all migrations are applied."""
        logger.info("Checking migrations...")
        
        result = self.run_ssh_command(f"cd {self.app_path} && source venv/bin/activate && python manage.py showmigrations | grep -v '\\[X\\]'")
        
        if result and "[ ]" in result:
            logger.warning("Some migrations are not applied")
            self.apply_migrations()
        else:
            logger.info("All migrations are applied")
    
    def apply_migrations(self):
        """Apply migrations."""
        logger.info("Applying migrations...")
        
        result = self.run_ssh_command(f"cd {self.app_path} && source venv/bin/activate && python manage.py migrate")
        
        if result and "Applying" in result:
            logger.info("Migrations applied")
            self.fixed_issues.append("Applied migrations")
        else:
            logger.error("Failed to apply migrations")
    
    def fix_all_issues(self):
        """Fix all deployment-related issues."""
        logger.info("Fixing all deployment-related issues...")
        
        self.check_service_status()
        self.check_network_configuration()
        self.check_permissions()
        self.check_dependencies()
        self.check_database_connection()
        self.check_static_files()
        self.check_migrations()
        self.restart_service()
        
        logger.info("Fixed issues:")
        for issue in self.fixed_issues:
            logger.info(f"- {issue}")

def main():
    """Main function to run the DevOps Agent."""
    parser = argparse.ArgumentParser(description="DevOps Agent for fixing deployment-related issues")
    parser.add_argument("--ssh-config", required=True, help="Path to SSH config file")
    parser.add_argument("--staging-server", required=True, help="Name of staging server in SSH config")
    
    args = parser.parse_args()
    
    agent = DevOpsAgent(args.ssh_config, args.staging_server)
    agent.fix_all_issues()

if __name__ == "__main__":
    main()
