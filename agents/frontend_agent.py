#!/usr/bin/env python3
"""
Frontend Agent for JW Attendant Scheduler
This agent fixes template-related issues in the staging environment.
"""

import argparse
import logging
import os
import subprocess
import sys
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("frontend_agent.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class FrontendAgent:
    """Frontend Agent for fixing template-related issues in the staging environment."""
    
    def __init__(self, ssh_config, staging_server, local_templates_dir):
        """Initialize the Frontend Agent."""
        self.ssh_config = ssh_config
        self.staging_server = staging_server
        self.local_templates_dir = local_templates_dir
        self.app_path = "/opt/jw-attendant-staging"
        self.templates_path = f"{self.app_path}/templates/scheduler"
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
    
    def run_scp_command(self, local_path, remote_path):
        """Copy a file to the staging server via SCP."""
        full_command = f"scp -F {self.ssh_config} {local_path} {self.staging_server}:{remote_path}"
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
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"Command failed: {e}")
            logger.error(f"Error output: {e.stderr}")
            return False
    
    def check_templates_structure(self):
        """Check the structure of the templates directory."""
        logger.info("Checking templates structure...")
        
        # Check if templates directory exists
        result = self.run_ssh_command(f"[ -d {self.templates_path} ] && echo 'exists' || echo 'not exists'")
        
        if result and "exists" in result:
            logger.info("Templates directory exists")
        else:
            logger.warning("Templates directory does not exist")
            self.create_templates_structure()
    
    def create_templates_structure(self):
        """Create the templates directory structure."""
        logger.info("Creating templates directory structure...")
        
        self.run_ssh_command(f"mkdir -p {self.templates_path}")
        self.fixed_issues.append("Created templates directory structure")
    
    def deploy_templates(self):
        """Deploy templates to the staging server."""
        logger.info("Deploying templates...")
        
        # Check if local templates directory exists
        if not os.path.exists(self.local_templates_dir):
            logger.error(f"Local templates directory does not exist: {self.local_templates_dir}")
            return
        
        # Get list of template files
        template_files = [f for f in os.listdir(self.local_templates_dir) if f.endswith('.html')]
        
        for template_file in template_files:
            local_path = os.path.join(self.local_templates_dir, template_file)
            remote_path = f"{self.templates_path}/{template_file}"
            
            logger.info(f"Deploying template: {template_file}")
            if self.run_scp_command(local_path, remote_path):
                self.fixed_issues.append(f"Deployed template: {template_file}")
    
    def fix_all_issues(self):
        """Fix all template-related issues."""
        logger.info("Fixing all template-related issues...")
        
        self.check_templates_structure()
        self.deploy_templates()
        
        logger.info("Fixed issues:")
        for issue in self.fixed_issues:
            logger.info(f"- {issue}")

def main():
    """Main function to run the Frontend Agent."""
    parser = argparse.ArgumentParser(description="Frontend Agent for fixing template-related issues")
    parser.add_argument("--ssh-config", required=True, help="Path to SSH config file")
    parser.add_argument("--staging-server", required=True, help="Name of staging server in SSH config")
    parser.add_argument("--local-templates-dir", required=True, help="Path to local templates directory")
    
    args = parser.parse_args()
    
    agent = FrontendAgent(args.ssh_config, args.staging_server, args.local_templates_dir)
    agent.fix_all_issues()

if __name__ == "__main__":
    main()
