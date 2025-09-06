#!/usr/bin/env python3
"""
Lead Architect Agent for JW Attendant Scheduler
This agent coordinates all other agents to fix issues in the staging environment.
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
        logging.FileHandler("lead_architect_agent.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class LeadArchitectAgent:
    """Lead Architect Agent for coordinating all other agents."""
    
    def __init__(self, ssh_config, staging_server, local_templates_dir, base_url):
        """Initialize the Lead Architect Agent."""
        self.ssh_config = ssh_config
        self.staging_server = staging_server
        self.local_templates_dir = local_templates_dir
        self.base_url = base_url
        self.agents_dir = os.path.dirname(os.path.abspath(__file__))
        self.results = []
    
    def run_command(self, command):
        """Run a command locally."""
        logger.info(f"Running command: {command}")
        
        try:
            result = subprocess.run(
                command,
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
    
    def run_backend_agent(self):
        """Run the Backend Agent to fix view issues."""
        logger.info("Running Backend Agent...")
        
        command = f"python {self.agents_dir}/backend_agent.py --ssh-config={self.ssh_config} --staging-server={self.staging_server}"
        result = self.run_command(command)
        
        if result is not None:
            logger.info("Backend Agent completed successfully")
            self.results.append({
                "agent": "Backend Agent",
                "status": "SUCCESS",
                "details": "Fixed view issues"
            })
            return True
        else:
            logger.error("Backend Agent failed")
            self.results.append({
                "agent": "Backend Agent",
                "status": "FAILURE",
                "details": "Failed to fix view issues"
            })
            return False
    
    def run_frontend_agent(self):
        """Run the Frontend Agent to fix template issues."""
        logger.info("Running Frontend Agent...")
        
        command = f"python {self.agents_dir}/frontend_agent.py --ssh-config={self.ssh_config} --staging-server={self.staging_server} --local-templates-dir={self.local_templates_dir}"
        result = self.run_command(command)
        
        if result is not None:
            logger.info("Frontend Agent completed successfully")
            self.results.append({
                "agent": "Frontend Agent",
                "status": "SUCCESS",
                "details": "Fixed template issues"
            })
            return True
        else:
            logger.error("Frontend Agent failed")
            self.results.append({
                "agent": "Frontend Agent",
                "status": "FAILURE",
                "details": "Failed to fix template issues"
            })
            return False
    
    def run_devops_agent(self):
        """Run the DevOps Agent to fix deployment issues."""
        logger.info("Running DevOps Agent...")
        
        command = f"python {self.agents_dir}/devops_agent.py --ssh-config={self.ssh_config} --staging-server={self.staging_server}"
        result = self.run_command(command)
        
        if result is not None:
            logger.info("DevOps Agent completed successfully")
            self.results.append({
                "agent": "DevOps Agent",
                "status": "SUCCESS",
                "details": "Fixed deployment issues"
            })
            return True
        else:
            logger.error("DevOps Agent failed")
            self.results.append({
                "agent": "DevOps Agent",
                "status": "FAILURE",
                "details": "Failed to fix deployment issues"
            })
            return False
    
    def run_testing_agent(self):
        """Run the Testing Agent to verify fixes."""
        logger.info("Running Testing Agent...")
        
        command = f"python {self.agents_dir}/testing_agent.py --ssh-config={self.ssh_config} --staging-server={self.staging_server} --base-url={self.base_url}"
        result = self.run_command(command)
        
        if result is not None:
            logger.info("Testing Agent completed successfully")
            self.results.append({
                "agent": "Testing Agent",
                "status": "SUCCESS",
                "details": "Verified fixes"
            })
            return True
        else:
            logger.error("Testing Agent failed")
            self.results.append({
                "agent": "Testing Agent",
                "status": "FAILURE",
                "details": "Failed to verify fixes"
            })
            return False
    
    def coordinate_agents(self):
        """Coordinate all agents to fix issues in the staging environment."""
        logger.info("Coordinating agents...")
        
        # Run Backend Agent to fix view issues
        backend_success = self.run_backend_agent()
        
        # Run Frontend Agent to fix template issues
        frontend_success = self.run_frontend_agent()
        
        # Run DevOps Agent to fix deployment issues
        devops_success = self.run_devops_agent()
        
        # Run Testing Agent to verify fixes
        testing_success = self.run_testing_agent()
        
        # Print results
        logger.info("Agent results:")
        for result in self.results:
            logger.info(f"{result['agent']}: {result['status']} - {result['details']}")
        
        # Return overall success
        return backend_success and frontend_success and devops_success and testing_success

def main():
    """Main function to run the Lead Architect Agent."""
    parser = argparse.ArgumentParser(description="Lead Architect Agent for coordinating all other agents")
    parser.add_argument("--ssh-config", required=True, help="Path to SSH config file")
    parser.add_argument("--staging-server", required=True, help="Name of staging server in SSH config")
    parser.add_argument("--local-templates-dir", required=True, help="Path to local templates directory")
    parser.add_argument("--base-url", required=True, help="Base URL of the application")
    
    args = parser.parse_args()
    
    agent = LeadArchitectAgent(args.ssh_config, args.staging_server, args.local_templates_dir, args.base_url)
    success = agent.coordinate_agents()
    
    if success:
        logger.info("All agents completed successfully")
        sys.exit(0)
    else:
        logger.error("Some agents failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
