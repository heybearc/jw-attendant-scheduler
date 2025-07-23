# Development Guide

## Setup

1. Clone the repository
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```
5. Initialize the database:
   ```bash
   python src/app.py
   ```

## Project Structure

- `src/` - Main application code
  - `app.py` - Flask application entry point
  - `models.py` - Database models
  - `templates/` - HTML templates
  - `static/` - CSS, JS, and other static files
- `docs/` - Documentation
- `tests/` - Test files
- `config/` - Configuration files
- `data/` - Sample data and templates
- `scripts/` - Utility scripts

## Development Workflow

1. Create feature branches for new development
2. Write tests for new functionality
3. Run tests before committing
4. Follow PEP 8 style guidelines

## Testing

Run tests with:
```bash
pytest tests/
```

## Code Formatting

Format code with:
```bash
black src/
```

Check code style with:
```bash
flake8 src/
```
