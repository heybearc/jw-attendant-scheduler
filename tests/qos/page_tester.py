#!/usr/bin/env python3
"""
Page Tester for JW Attendant Scheduler
This script systematically tests all pages in the application to identify errors.
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
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("page_tester.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class PageTester:
    """Class to test all pages in the JW Attendant Scheduler application."""
    
    def __init__(self, base_url, username, password, output_dir="./results"):
        """Initialize the PageTester with base URL and credentials."""
        self.base_url = base_url
        self.username = username
        self.password = password
        self.output_dir = output_dir
        self.visited_urls = set()
        self.page_errors = []
        self.js_errors = []
        self.console_errors = []
        self.form_errors = []
        self.missing_templates = []
        self.database_errors = []
        
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Initialize Selenium WebDriver
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--window-size=1920,1080")
        
        # Enable browser console logs
        chrome_options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})
        
        self.driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install()),
            options=chrome_options
        )
        
        # Set implicit wait time
        self.driver.implicitly_wait(10)
    
    def login(self):
        """Log in to the application."""
        logger.info(f"Logging in to {self.base_url}")
        
        try:
            self.driver.get(f"{self.base_url}/login/")
            
            # Wait for the login form to load
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.ID, "id_username"))
            )
            
            # Fill in the login form
            self.driver.find_element(By.ID, "id_username").send_keys(self.username)
            self.driver.find_element(By.ID, "id_password").send_keys(self.password)
            self.driver.find_element(By.XPATH, "//button[@type='submit']").click()
            
            # Wait for the dashboard to load
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "navbar"))
            )
            
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
    
    def check_console_errors(self, url):
        """Check for JavaScript errors in the browser console."""
        logs = self.driver.get_log("browser")
        for log in logs:
            if log["level"] == "SEVERE":
                error = {
                    "url": url,
                    "message": log["message"],
                    "timestamp": log["timestamp"],
                    "type": "console"
                }
                self.console_errors.append(error)
                logger.warning(f"Console error on {url}: {log['message']}")
    
    def check_page_for_errors(self, url):
        """Check a page for various types of errors."""
        if url in self.visited_urls:
            return
        
        logger.info(f"Testing page: {url}")
        self.visited_urls.add(url)
        
        try:
            self.driver.get(url)
            
            # Wait for the page to load
            time.sleep(2)
            
            # Check for console errors
            self.check_console_errors(url)
            
            # Check for visible error messages on the page
            page_source = self.driver.page_source
            soup = BeautifulSoup(page_source, 'html.parser')
            
            # Check for Django error pages
            if "Django Error" in soup.title.text if soup.title else "":
                error_message = soup.find("pre", class_="exception_value").text if soup.find("pre", class_="exception_value") else "Unknown Django error"
                self.page_errors.append({
                    "url": url,
                    "error": error_message,
                    "type": "django"
                })
                logger.error(f"Django error on {url}: {error_message}")
            
            # Check for 404 errors
            if "Page not found" in page_source:
                self.page_errors.append({
                    "url": url,
                    "error": "Page not found (404)",
                    "type": "not_found"
                })
                logger.error(f"404 error on {url}")
            
            # Check for 500 errors
            if "Server Error (500)" in page_source:
                self.page_errors.append({
                    "url": url,
                    "error": "Server Error (500)",
                    "type": "server_error"
                })
                logger.error(f"500 error on {url}")
            
            # Check for template errors
            if "TemplateDoesNotExist" in page_source:
                template_name = re.search(r'TemplateDoesNotExist: ([^\s]+)', page_source)
                template_name = template_name.group(1) if template_name else "Unknown template"
                self.missing_templates.append({
                    "url": url,
                    "template": template_name,
                    "type": "missing_template"
                })
                logger.error(f"Missing template on {url}: {template_name}")
            
            # Check for database errors
            if "DatabaseError" in page_source or "OperationalError" in page_source:
                error_message = re.search(r'DatabaseError: ([^\n]+)', page_source)
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
        
        # Save console errors
        with open(f"{self.output_dir}/console_errors_{timestamp}.csv", "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["URL", "Message", "Timestamp"])
            for error in self.console_errors:
                writer.writerow([error["url"], error["message"], error["timestamp"]])
        
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
        
        # Save summary
        summary = {
            "timestamp": timestamp,
            "base_url": self.base_url,
            "pages_visited": len(self.visited_urls),
            "page_errors_count": len(self.page_errors),
            "console_errors_count": len(self.console_errors),
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
        logger.info(f"Console errors: {len(self.console_errors)}")
        logger.info(f"Form errors: {len(self.form_errors)}")
        logger.info(f"Missing templates: {len(self.missing_templates)}")
        logger.info(f"Database errors: {len(self.database_errors)}")
    
    def close(self):
        """Close the WebDriver."""
        self.driver.quit()

def main():
    """Main function to run the page tester."""
    parser = argparse.ArgumentParser(description="Test all pages in the JW Attendant Scheduler application")
    parser.add_argument("--base-url", required=True, help="Base URL of the application")
    parser.add_argument("--username", required=True, help="Username for login")
    parser.add_argument("--password", required=True, help="Password for login")
    parser.add_argument("--output-dir", default="./results", help="Output directory for results")
    
    args = parser.parse_args()
    
    tester = PageTester(args.base_url, args.username, args.password, args.output_dir)
    
    try:
        tester.test_all_pages()
        tester.save_results()
    finally:
        tester.close()

if __name__ == "__main__":
    main()
