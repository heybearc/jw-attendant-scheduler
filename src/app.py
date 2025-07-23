"""
JW Attendant Scheduler - Main Flask Application

Flask web application for managing attendant schedules for JW events.
"""

from flask import Flask, render_template, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///attendant_scheduler.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@app.route('/')
def index():
    """Home page"""
    return render_template('index.html')

@app.route('/volunteers')
def volunteers():
    """Volunteer management page"""
    return render_template('volunteers.html')

@app.route('/assignments')
def assignments():
    """Assignment tracking page"""
    return render_template('assignments.html')

@app.route('/reports')
def reports():
    """Reporting dashboard"""
    return render_template('reports.html')

@app.route('/schedules')
def schedules():
    """Schedule generation and distribution"""
    return render_template('schedules.html')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
