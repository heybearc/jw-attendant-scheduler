#!/usr/bin/env python3
"""
HTTP Page Tester for JW Attendant Scheduler
This script tests all pages in the application using HTTP requests to identify errors.
"""

import argparse
import csv
import json
import logging
import os
import re
import sys
import time
from datetime import datetime
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("http_page_tester.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class HTTPPageTester:
    """Class to test all pages in the JW Attendant Scheduler application using HTTP requests."""
    
    def __init__(self, base_url, username, password, output_dir="./results"):
        """Initialize the HTTPPageTester with base URL and credentials."""
        self.base_url = base_url
        self.username = username
        self.password = password
        self.output_dir = output_dir
        self.session = requests.Session()
        self.visited_urls = set()
        self.page_errors = []
        self.form_errors = []
        self.missing_templates = []
        self.database_errors = []
        self.status_codes = {}
        
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
    
    def login(self):
        """Log in to the application."""
        logger.info(f"Logging in to {self.base_url}")
        
        try:
            # Get the login page to retrieve the CSRF token
            login_url = f"{self.base_url}/login/"
            response = self.session.get(login_url)
            
            if response.status_code != 200:
                logger.error(f"Failed to get login page: {response.status_code}")
                self.page_errors.append({
                    "url": login_url,
                    "error": f"Failed to get login page: {response.status_code}",
                    "type": "authentication"
                })
                return False
            
            # Parse the login page to get the CSRF token
            soup = BeautifulSoup(response.text, 'html.parser')
            csrf_input = soup.find('input', {'name': 'csrfmiddlewaretoken'})
            
            if not csrf_input:
                logger.error("CSRF token not found on login page")
                self.page_errors.append({
                    "url": login_url,
                    "error": "CSRF token not found on login page",
                    "type": "authentication"
                })
                return False
            
            csrf_token = csrf_input['value']
            
            # Submit the login form
            login_data = {
                'csrfmiddlewaretoken': csrf_token,
                'username': self.username,
                'password': self.password
            }
            
            response = self.session.post(
                login_url,
                data=login_data,
                headers={'Referer': login_url}
            )
            
            # Check if login was successful
            if response.url.endswith('/login/') or 'login' in response.url:
                logger.error("Login failed: Redirected back to login page")
                self.page_errors.append({
                    "url": login_url,
                    "error": "Login failed: Redirected back to login page",
                    "type": "authentication"
                })
                return False
            
            logger.info("Login successful")
            return True
        
        except Exception as e:
            logger.error(f"Login failed: {str(e)}")
            self.page_errors.append({
                "url": f"{self.base_url}/login/",
                "error": f"Login failed: {str(e)}",
                "type": "authentication"
            })
            return False
    
    def check_page_for_errors(self, url):
        """Check a page for various types of errors."""
        if url in self.visited_urls:
            return []
        
        logger.info(f"Testing page: {url}")
        self.visited_urls.add(url)
        
        try:
            response = self.session.get(url)
            self.status_codes[url] = response.status_code
            
            # Check for HTTP errors
            if response.status_code != 200:
                self.page_errors.append({
                    "url": url,
                    "error": f"HTTP error: {response.status_code}",
                    "type": "http"
                })
                logger.error(f"HTTP error on {url}: {response.status_code}")
                return []
            
            # Parse the page content
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Check for Django error pages
            if soup.title and "Django Error" in soup.title.text:
                error_message = soup.find("pre", class_="exception_value")
                error_message = error_message.text if error_message else "Unknown Django error"
                self.page_errors.append({
                    "url": url,
                    "error": error_message,
                    "type": "django"
                })
                logger.error(f"Django error on {url}: {error_message}")
            
            # Check for 404 errors
            if "Page not found" in response.text:
                self.page_errors.append({
                    "url": url,
                    "error": "Page not found (404)",
                    "type": "not_found"
                })
                logger.error(f"404 error on {url}")
            
            # Check for 500 errors
            if "Server Error (500)" in response.text:
                self.page_errors.append({
                    "url": url,
                    "error": "Server Error (500)",
                    "type": "server_error"
                })
                logger.error(f"500 error on {url}")
            
            # Check for template errors
            if "TemplateDoesNotExist" in response.text:
                template_name = re.search(r'TemplateDoesNotExist: ([^\s]+)', response.text)
                template_name = template_name.group(1) if template_name else "Unknown template"
                self.missing_templates.append({
                    "url": url,
                    "template": template_name,
                    "type": "missing_template"
                })
                logger.error(f"Missing template on {url}: {template_name}")
            
            # Check for database errors
            if "DatabaseError" in response.text or "OperationalError" in response.text:
                error_message = re.search(r'DatabaseError: ([^\n]+)', response.text)
                error_message = error_message.group(1) if error_message else "Unknown database error"
                self.database_errors.append({
                    "url": url,
                    "error": error_message,
                    "type": "database"
                })
                logger.error(f"Database error on {url}: {error_message}")
            
            # Check for form errors
            form_errors = soup.find_all(class_="errorlist")
            if form_errors:
                for error in form_errors:
                    self.form_errors.append({
                        "url": url,
                        "error": error.text,
                        "type": "form"
                    })
                    logger.warning(f"Form error on {url}: {error.text}")
            
            # Get all links on the page for further testing
            links = []
            for a in soup.find_all('a', href=True):
                href = a['href']
                if href.startswith('/') and not href.startswith('//'):
                    full_url = urljoin(self.base_url, href)
                    if full_url.startswith(self.base_url) and full_url not in self.visited_urls:
                        links.append(full_url)
            
            return links
        
        except Exception as e:
            logger.error(f"Error testing page {url}: {str(e)}")
            self.page_errors.append({
                "url": url,
                "error": str(e),
                "type": "general"
            })
            return []
    
    def test_all_pages(self):
        """Test all pages in the application."""
        if not self.login():
            logger.error("Login failed. Exiting.")
            return
        
        # Start with the dashboard
        urls_to_visit = [f"{self.base_url}/dashboard/"]
        
        # Add specific pages to test based on the views inventory
        specific_pages = [
            "/events/",
            "/events/add/",
            "/attendants/",
            "/attendants/add/",
            "/assignments/",
            "/assignments/add/",
            "/reports/",
            "/oversight/",
            "/users/",
            "/users/create/",
            "/lanyards/",
            "/templates/positions/"
        ]
        
        for page in specific_pages:
            urls_to_visit.append(f"{self.base_url}{page}")
        
        # Test event-specific pages with a sample event ID
        event_id = 1  # Assuming event ID 1 exists
        event_pages = [
            f"/events/{event_id}/",
            f"/events/{event_id}/edit/",
            f"/events/{event_id}/positions/",
            f"/events/{event_id}/counts/",
            f"/events/{event_id}/count-reports/"
        ]
        
        for page in event_pages:
            urls_to_visit.append(f"{self.base_url}{page}")
        
        # Process all URLs
        while urls_to_visit:
            url = urls_to_visit.pop(0)
            new_urls = self.check_page_for_errors(url)
            if new_urls:
                urls_to_visit.extend(new_urls)
    
    def save_results(self):
        """Save the test results to files."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save page errors
        with open(f"{self.output_dir}/page_errors_{timestamp}.csv", "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["URL", "Error", "Type"])
            for error in self.page_errors:
                writer.writerow([error["url"], error["error"], error["type"]])
        
        # Save form errors
        with open(f"{self.output_dir}/form_errors_{timestamp}.csv", "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["URL", "Error", "Type"])
            for error in self.form_errors:
                writer.writerow([error["url"], error["error"], error["type"]])
        
        # Save missing templates
        with open(f"{self.output_dir}/missing_templates_{timestamp}.csv", "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["URL", "Template", "Type"])
            for error in self.missing_templates:
                writer.writerow([error["url"], error["template"], error["type"]])
        
        # Save database errors
        with open(f"{self.output_dir}/database_errors_{timestamp}.csv", "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["URL", "Error", "Type"])
            for error in self.database_errors:
                writer.writerow([error["url"], error["error"], error["type"]])
        
        # Save status codes
        with open(f"{self.output_dir}/status_codes_{timestamp}.csv", "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["URL", "Status Code"])
            for url, status_code in self.status_codes.items():
                writer.writerow([url, status_code])
        
        # Save summary
        summary = {
            "timestamp": timestamp,
            "base_url": self.base_url,
            "pages_visited": len(self.visited_urls),
            "page_errors_count": len(self.page_errors),
            "form_errors_count": len(self.form_errors),
            "missing_templates_count": len(self.missing_templates),
            "database_errors_count": len(self.database_errors),
            "visited_urls": list(self.visited_urls)
        }
        
        with open(f"{self.output_dir}/summary_{timestamp}.json", "w") as f:
            json.dump(summary, f, indent=2)
        
        logger.info(f"Results saved to {self.output_dir}")
        logger.info(f"Pages visited: {len(self.visited_urls)}")
        logger.info(f"Page errors: {len(self.page_errors)}")
        logger.info(f"Form errors: {len(self.form_errors)}")
        logger.info(f"Missing templates: {len(self.missing_templates)}")
        logger.info(f"Database errors: {len(self.database_errors)}")

def main():
    """Main function to run the HTTP page tester."""
    parser = argparse.ArgumentParser(description="Test all pages in the JW Attendant Scheduler application")
    parser.add_argument("--base-url", required=True, help="Base URL of the application")
    parser.add_argument("--username", required=True, help="Username for login")
    parser.add_argument("--password", required=True, help="Password for login")
    parser.add_argument("--output-dir", default="./results", help="Output directory for results")
    
    args = parser.parse_args()
    
    tester = HTTPPageTester(args.base_url, args.username, args.password, args.output_dir)
    tester.test_all_pages()
    tester.save_results()

if __name__ == "__main__":
    main()
