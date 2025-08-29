# JW Attendant Scheduler - Django

A comprehensive Django-based attendant scheduling system for Jehovah's Witness events including regional conventions, circuit assemblies, and local congregation events.

## Overview

This Django application provides volunteer management, assignment tracking, and reporting capabilities for event oversight, with distributable schedule generation.

## Features

- **Volunteer Management**: Ingest and manage volunteer information
- **Assignment Tracking**: Track attendant assignments across different events
- **Reporting Dashboard**: Oversight reporting for event coordinators
- **Schedule Distribution**: Generate and distribute attendant schedules
- **Multi-Event Support**: Support for regional conventions, circuit assemblies, and local events

## Project Structure

```
jw-attendant-scheduler-django/
├── jw_scheduler/           # Django project settings
├── scheduler/              # Main Django app
├── docs/                   # Documentation
├── tests/                  # Test files
├── config/                 # Configuration files
├── data/                   # Sample data and templates
├── scripts/                # Utility scripts
├── manage.py               # Django management script
└── requirements.txt        # Python dependencies
```

## Getting Started

1. **Setup Virtual Environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run Migrations**:
   ```bash
   python manage.py migrate
   ```

4. **Create Superuser**:
   ```bash
   python manage.py createsuperuser
   ```

5. **Run Development Server**:
   ```bash
   python manage.py runserver
   ```

## Development Status

This Django project is actively under development with a 4-week roadmap for complete implementation.

## License

This project is for use within Jehovah's Witness congregations and events.
