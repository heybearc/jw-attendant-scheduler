#!/usr/bin/env python3
"""
Testing Agent for JW Attendant Scheduler
This agent verifies that all fixes have been applied correctly.
"""

import argparse
import logging
import os
import subprocess
import sys
import time
import requests
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("testing_agent.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class TestingAgent:
    """Testing Agent for verifying fixes in the staging environment."""
    
    def __init__(self, ssh_config, staging_server, base_url):
        """Initialize the Testing Agent."""
        self.ssh_config = ssh_config
        self.staging_server = staging_server
        self.base_url = base_url
        self.app_path = "/opt/jw-attendant-staging"
        self.test_results = []
    
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
    
    def test_service_status(self):
        """Test if the service is running."""
        logger.info("Testing service status...")
        
        result = self.run_ssh_command("systemctl status jw-attendant-staging")
        
        if result and "active (running)" in result:
            logger.info("Service is running")
            self.test_results.append({
                "test": "Service Status",
                "result": "PASS",
                "details": "Service is running"
            })
            return True
        else:
            logger.error("Service is not running")
            self.test_results.append({
                "test": "Service Status",
                "result": "FAIL",
                "details": "Service is not running"
            })
            return False
    
    def test_http_endpoint(self, endpoint, expected_status=200, expected_content=None):
        """Test an HTTP endpoint."""
        url = f"{self.base_url}{endpoint}"
        logger.info(f"Testing endpoint: {url}")
        
        try:
            response = requests.get(url)
            
            if response.status_code == expected_status:
                logger.info(f"Endpoint {url} returned status {response.status_code}")
                
                if expected_content and expected_content in response.text:
                    logger.info(f"Endpoint {url} contains expected content")
                    self.test_results.append({
                        "test": f"HTTP Endpoint {endpoint}",
                        "result": "PASS",
                        "details": f"Status: {response.status_code}, Contains expected content"
                    })
                    return True
                elif expected_content:
                    logger.warning(f"Endpoint {url} does not contain expected content")
                    self.test_results.append({
                        "test": f"HTTP Endpoint {endpoint}",
                        "result": "FAIL",
                        "details": f"Status: {response.status_code}, Does not contain expected content"
                    })
                    return False
                else:
                    self.test_results.append({
                        "test": f"HTTP Endpoint {endpoint}",
                        "result": "PASS",
                        "details": f"Status: {response.status_code}"
                    })
                    return True
            else:
                logger.error(f"Endpoint {url} returned status {response.status_code}")
                self.test_results.append({
                    "test": f"HTTP Endpoint {endpoint}",
                    "result": "FAIL",
                    "details": f"Status: {response.status_code}"
                })
                return False
        except requests.exceptions.RequestException as e:
            logger.error(f"Error testing endpoint {url}: {str(e)}")
            self.test_results.append({
                "test": f"HTTP Endpoint {endpoint}",
                "result": "FAIL",
                "details": f"Error: {str(e)}"
            })
            return False
    
    def test_login_page(self):
        """Test the login page."""
        logger.info("Testing login page...")
        
        return self.test_http_endpoint("/login/", expected_content="Login")
    
    def test_home_page(self):
        """Test the home page."""
        logger.info("Testing home page...")
        
        return self.test_http_endpoint("/", expected_content="JW Attendant Scheduler")
    
    def test_dashboard_page(self):
        """Test the dashboard page."""
        logger.info("Testing dashboard page...")
        
        return self.test_http_endpoint("/dashboard/", expected_status=302)  # Redirects to login
    
    def test_event_list_page(self):
        """Test the event list page."""
        logger.info("Testing event list page...")
        
        return self.test_http_endpoint("/events/", expected_status=302)  # Redirects to login
    
    def test_count_times_pages(self):
        """Test the count times pages."""
        logger.info("Testing count times pages...")
        
        # Test count entry page
        count_entry_result = self.test_http_endpoint("/events/1/counts/", expected_status=302)  # Redirects to login
        
        # Test count reports page
        count_reports_result = self.test_http_endpoint("/events/1/count-reports/", expected_status=302)  # Redirects to login
        
        return count_entry_result and count_reports_result
    
    def test_views_module(self):
        """Test if the views module is properly structured."""
        logger.info("Testing views module structure...")
        
        # Check if views directory exists
        views_dir_result = self.run_ssh_command(f"[ -d {self.app_path}/scheduler/views ] && echo 'exists' || echo 'not exists'")
        
        if views_dir_result and "exists" in views_dir_result:
            logger.info("Views directory exists")
            
            # Check if __init__.py exists
            init_file_result = self.run_ssh_command(f"[ -f {self.app_path}/scheduler/views/__init__.py ] && echo 'exists' || echo 'not exists'")
            
            if init_file_result and "exists" in init_file_result:
                logger.info("__init__.py exists in views directory")
                
                # Check if count_views.py exists
                count_views_result = self.run_ssh_command(f"[ -f {self.app_path}/scheduler/views/count_views.py ] && echo 'exists' || echo 'not exists'")
                
                if count_views_result and "exists" in count_views_result:
                    logger.info("count_views.py exists in views directory")
                    self.test_results.append({
                        "test": "Views Module Structure",
                        "result": "PASS",
                        "details": "Views directory, __init__.py, and count_views.py exist"
                    })
                    return True
                else:
                    logger.warning("count_views.py does not exist in views directory")
                    self.test_results.append({
                        "test": "Views Module Structure",
                        "result": "FAIL",
                        "details": "count_views.py does not exist in views directory"
                    })
                    return False
            else:
                logger.warning("__init__.py does not exist in views directory")
                self.test_results.append({
                    "test": "Views Module Structure",
                    "result": "FAIL",
                    "details": "__init__.py does not exist in views directory"
                })
                return False
        else:
            logger.warning("Views directory does not exist")
            self.test_results.append({
                "test": "Views Module Structure",
                "result": "FAIL",
                "details": "Views directory does not exist"
            })
            return False
    
    def test_templates(self):
        """Test if the templates exist."""
        logger.info("Testing templates...")
        
        # Check if templates directory exists
        templates_dir_result = self.run_ssh_command(f"[ -d {self.app_path}/templates/scheduler ] && echo 'exists' || echo 'not exists'")
        
        if templates_dir_result and "exists" in templates_dir_result:
            logger.info("Templates directory exists")
            
            # Check if count_entry.html exists
            count_entry_result = self.run_ssh_command(f"[ -f {self.app_path}/templates/scheduler/count_entry.html ] && echo 'exists' || echo 'not exists'")
            
            # Check if count_reports.html exists
            count_reports_result = self.run_ssh_command(f"[ -f {self.app_path}/templates/scheduler/count_reports.html ] && echo 'exists' || echo 'not exists'")
            
            if count_entry_result and "exists" in count_entry_result and count_reports_result and "exists" in count_reports_result:
                logger.info("Count times templates exist")
                self.test_results.append({
                    "test": "Templates",
                    "result": "PASS",
                    "details": "Count times templates exist"
                })
                return True
            else:
                logger.warning("Count times templates do not exist")
                self.test_results.append({
                    "test": "Templates",
                    "result": "FAIL",
                    "details": "Count times templates do not exist"
                })
                return False
        else:
            logger.warning("Templates directory does not exist")
            self.test_results.append({
                "test": "Templates",
                "result": "FAIL",
                "details": "Templates directory does not exist"
            })
            return False
    
    def test_url_patterns(self):
        """Test if the URL patterns for count times are defined."""
        logger.info("Testing URL patterns...")
        
        result = self.run_ssh_command(f"grep -n 'count_entry' {self.app_path}/scheduler/urls.py")
        
        if result:
            logger.info("Count times URL patterns are defined")
            self.test_results.append({
                "test": "URL Patterns",
                "result": "PASS",
                "details": "Count times URL patterns are defined"
            })
            return True
        else:
            logger.warning("Count times URL patterns are not defined")
            self.test_results.append({
                "test": "URL Patterns",
                "result": "FAIL",
                "details": "Count times URL patterns are not defined"
            })
            return False
    
    def run_all_tests(self):
        """Run all tests."""
        logger.info("Running all tests...")
        
        # Test service status
        self.test_service_status()
        
        # Test HTTP endpoints
        self.test_login_page()
        self.test_home_page()
        self.test_dashboard_page()
        self.test_event_list_page()
        self.test_count_times_pages()
        
        # Test code structure
        self.test_views_module()
        self.test_templates()
        self.test_url_patterns()
        
        # Print test results
        logger.info("Test results:")
        passed_tests = 0
        failed_tests = 0
        
        for result in self.test_results:
            logger.info(f"{result['test']}: {result['result']} - {result['details']}")
            
            if result['result'] == "PASS":
                passed_tests += 1
            else:
                failed_tests += 1
        
        logger.info(f"Passed tests: {passed_tests}")
        logger.info(f"Failed tests: {failed_tests}")
        
        return passed_tests, failed_tests

def main():
    """Main function to run the Testing Agent."""
    parser = argparse.ArgumentParser(description="Testing Agent for verifying fixes")
    parser.add_argument("--ssh-config", required=True, help="Path to SSH config file")
    parser.add_argument("--staging-server", required=True, help="Name of staging server in SSH config")
    parser.add_argument("--base-url", required=True, help="Base URL of the application")
    
    args = parser.parse_args()
    
    agent = TestingAgent(args.ssh_config, args.staging_server, args.base_url)
    passed_tests, failed_tests = agent.run_all_tests()
    
    if failed_tests > 0:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()
