#!/usr/bin/env python3
"""
Link and Button Checker for JW Attendant Scheduler
This script systematically tests all links and buttons in the application to identify errors.
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
        logging.FileHandler("link_checker.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class LinkChecker:
    """Class to check links and buttons in a web application."""
    
    def __init__(self, base_url, username, password, output_dir="./results"):
        """Initialize the LinkChecker with base URL and credentials."""
        self.base_url = base_url
        self.username = username
        self.password = password
        self.output_dir = output_dir
        self.visited_urls = set()
        self.broken_links = []
        self.js_errors = []
        self.console_errors = []
        self.form_errors = []
        
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
            return False
    
    def check_console_errors(self):
        """Check for JavaScript errors in the browser console."""
        logs = self.driver.get_log("browser")
        for log in logs:
            if log["level"] == "SEVERE":
                error = {
                    "url": self.driver.current_url,
                    "message": log["message"],
                    "timestamp": log["timestamp"]
                }
                self.console_errors.append(error)
                logger.warning(f"Console error on {self.driver.current_url}: {log['message']}")
    
    def check_page_for_links(self, url):
        """Check a page for links and add them to the queue."""
        if url in self.visited_urls:
            return []
        
        logger.info(f"Checking page: {url}")
        self.visited_urls.add(url)
        
        try:
            self.driver.get(url)
            self.check_console_errors()
            
            # Wait for the page to load
            time.sleep(2)
            
            # Get all links on the page
            links = self.driver.find_elements(By.TAG_NAME, "a")
            buttons = self.driver.find_elements(By.TAG_NAME, "button")
            forms = self.driver.find_elements(By.TAG_NAME, "form")
            
            # Check links
            new_urls = []
            for link in links:
                try:
                    href = link.get_attribute("href")
                    if href and href.startswith(self.base_url) and href not in self.visited_urls:
                        new_urls.append(href)
                except Exception as e:
                    logger.error(f"Error processing link: {str(e)}")
            
            # Check buttons
            for button in buttons:
                try:
                    # Skip buttons with type="submit" as they're part of forms
                    if button.get_attribute("type") != "submit":
                        button_id = button.get_attribute("id") or "unknown"
                        logger.info(f"Clicking button: {button_id}")
                        
                        # Save current URL to go back after clicking
                        current_url = self.driver.current_url
                        
                        # Click the button
                        button.click()
                        
                        # Wait for any page load or AJAX request
                        time.sleep(2)
                        
                        # Check for console errors
                        self.check_console_errors()
                        
                        # If the URL changed, add the new URL to the queue
                        if self.driver.current_url != current_url and self.driver.current_url not in self.visited_urls:
                            new_urls.append(self.driver.current_url)
                        
                        # Go back to the original page
                        self.driver.get(current_url)
                        time.sleep(1)
                except Exception as e:
                    logger.error(f"Error clicking button: {str(e)}")
            
            # Check forms
            for form in forms:
                try:
                    form_id = form.get_attribute("id") or "unknown"
                    logger.info(f"Testing form: {form_id}")
                    
                    # Find all input fields in the form
                    inputs = form.find_elements(By.TAG_NAME, "input")
                    
                    # Fill in the form fields with test data
                    for input_field in inputs:
                        input_type = input_field.get_attribute("type")
                        input_name = input_field.get_attribute("name")
                        
                        if input_type == "text" or input_type == "email":
                            input_field.clear()
                            input_field.send_keys("test@example.com")
                        elif input_type == "password":
                            input_field.clear()
                            input_field.send_keys("password123")
                        elif input_type == "checkbox":
                            if not input_field.is_selected():
                                input_field.click()
                    
                    # Find the submit button
                    submit_button = form.find_element(By.XPATH, ".//button[@type='submit']")
                    
                    # Save current URL to go back after submitting
                    current_url = self.driver.current_url
                    
                    # Submit the form
                    submit_button.click()
                    
                    # Wait for any page load or AJAX request
                    time.sleep(2)
                    
                    # Check for console errors
                    self.check_console_errors()
                    
                    # Check for form errors
                    error_elements = self.driver.find_elements(By.CLASS_NAME, "error")
                    if error_elements:
                        for error in error_elements:
                            self.form_errors.append({
                                "url": current_url,
                                "form_id": form_id,
                                "error_message": error.text
                            })
                            logger.warning(f"Form error on {current_url}: {error.text}")
                    
                    # If the URL changed, add the new URL to the queue
                    if self.driver.current_url != current_url and self.driver.current_url not in self.visited_urls:
                        new_urls.append(self.driver.current_url)
                    
                    # Go back to the original page
                    self.driver.get(current_url)
                    time.sleep(1)
                except Exception as e:
                    logger.error(f"Error testing form: {str(e)}")
            
            return new_urls
        
        except Exception as e:
            logger.error(f"Error checking page {url}: {str(e)}")
            self.broken_links.append({
                "url": url,
                "error": str(e),
                "referrer": "direct"
            })
            return []
    
    def crawl(self):
        """Crawl the application and check all links and buttons."""
        if not self.login():
            logger.error("Login failed. Exiting.")
            return
        
        # Start with the dashboard
        urls_to_visit = [f"{self.base_url}/dashboard/"]
        
        while urls_to_visit:
            url = urls_to_visit.pop(0)
            new_urls = self.check_page_for_links(url)
            urls_to_visit.extend(new_urls)
    
    def save_results(self):
        """Save the results to files."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save broken links
        with open(f"{self.output_dir}/broken_links_{timestamp}.csv", "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["URL", "Error", "Referrer"])
            for link in self.broken_links:
                writer.writerow([link["url"], link["error"], link["referrer"]])
        
        # Save console errors
        with open(f"{self.output_dir}/console_errors_{timestamp}.csv", "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["URL", "Message", "Timestamp"])
            for error in self.console_errors:
                writer.writerow([error["url"], error["message"], error["timestamp"]])
        
        # Save form errors
        with open(f"{self.output_dir}/form_errors_{timestamp}.csv", "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["URL", "Form ID", "Error Message"])
            for error in self.form_errors:
                writer.writerow([error["url"], error["form_id"], error["error_message"]])
        
        # Save summary
        summary = {
            "timestamp": timestamp,
            "base_url": self.base_url,
            "pages_visited": len(self.visited_urls),
            "broken_links_count": len(self.broken_links),
            "console_errors_count": len(self.console_errors),
            "form_errors_count": len(self.form_errors),
            "visited_urls": list(self.visited_urls)
        }
        
        with open(f"{self.output_dir}/summary_{timestamp}.json", "w") as f:
            json.dump(summary, f, indent=2)
        
        logger.info(f"Results saved to {self.output_dir}")
        logger.info(f"Pages visited: {len(self.visited_urls)}")
        logger.info(f"Broken links: {len(self.broken_links)}")
        logger.info(f"Console errors: {len(self.console_errors)}")
        logger.info(f"Form errors: {len(self.form_errors)}")
    
    def close(self):
        """Close the WebDriver."""
        self.driver.quit()

def main():
    """Main function to run the link checker."""
    parser = argparse.ArgumentParser(description="Check links and buttons in a web application")
    parser.add_argument("--base-url", required=True, help="Base URL of the application")
    parser.add_argument("--username", required=True, help="Username for login")
    parser.add_argument("--password", required=True, help="Password for login")
    parser.add_argument("--output-dir", default="./results", help="Output directory for results")
    
    args = parser.parse_args()
    
    checker = LinkChecker(args.base_url, args.username, args.password, args.output_dir)
    
    try:
        checker.crawl()
        checker.save_results()
    finally:
        checker.close()

if __name__ == "__main__":
    main()
