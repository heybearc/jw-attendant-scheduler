#!/usr/bin/env python3
"""
Setup script for JW Attendant Scheduler

This script initializes the project environment and database.
"""

import os
import sys
import subprocess
from pathlib import Path

def create_virtual_environment():
    """Create a virtual environment if it doesn't exist"""
    if not os.path.exists('venv'):
        print("Creating virtual environment...")
        subprocess.run([sys.executable, '-m', 'venv', 'venv'])
        print("Virtual environment created.")
    else:
        print("Virtual environment already exists.")

def install_dependencies():
    """Install project dependencies"""
    print("Installing dependencies...")
    if os.name == 'nt':  # Windows
        pip_path = 'venv\\Scripts\\pip'
    else:  # Unix/Linux/macOS
        pip_path = 'venv/bin/pip'
    
    subprocess.run([pip_path, 'install', '-r', 'requirements.txt'])
    print("Dependencies installed.")

def setup_environment():
    """Set up environment configuration"""
    if not os.path.exists('.env'):
        print("Creating .env file from template...")
        subprocess.run(['cp', 'config/.env.example', '.env'])
        print("Please edit .env file with your configuration.")
    else:
        print(".env file already exists.")

def initialize_database():
    """Initialize the database"""
    print("Initializing database...")
    if os.name == 'nt':  # Windows
        python_path = 'venv\\Scripts\\python'
    else:  # Unix/Linux/macOS
        python_path = 'venv/bin/python'
    
    subprocess.run([python_path, 'src/app.py'])
    print("Database initialized.")

def main():
    """Main setup function"""
    print("Setting up JW Attendant Scheduler...")
    
    create_virtual_environment()
    install_dependencies()
    setup_environment()
    
    print("\nSetup complete!")
    print("Next steps:")
    print("1. Edit .env file with your configuration")
    print("2. Activate virtual environment:")
    if os.name == 'nt':
        print("   venv\\Scripts\\activate")
    else:
        print("   source venv/bin/activate")
    print("3. Run the application:")
    print("   python src/app.py")

if __name__ == '__main__':
    main()
