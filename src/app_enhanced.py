"""
JW Attendant Scheduler - Enhanced Flask Application

Enhanced Flask web application with AI Pod functionality for managing attendant schedules for JW events.
Includes advanced features: conflict detection, schedule optimization, multi-format exports, and more.
"""

from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
import csv
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
from models import db, Volunteer, Event, Assignment, User, EventType
from scheduling_engine import SchedulingEngine
from export_engine import ExportEngine
from conflict_detector import ConflictDetector

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///attendant_scheduler.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'data/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Initialize extensions
db.init_app(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Initialize engines
scheduling_engine = SchedulingEngine()
export_engine = ExportEngine()
conflict_detector = ConflictDetector()

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Authentication Routes
@app.route('/login', methods=['GET', 'POST'])
def login():
    """User login"""
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password')
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    """User logout"""
    logout_user()
    return redirect(url_for('login'))

# Main Routes
@app.route('/')
def index():
    """Home page"""
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/dashboard')
@login_required
def dashboard():
    """Main dashboard"""
    # Get statistics
    total_volunteers = Volunteer.query.count()
    total_events = Event.query.count()
    total_assignments = Assignment.query.count()
    active_events = Event.query.filter(Event.end_date >= datetime.now().date()).count()
    
    # Get recent events
    recent_events = Event.query.order_by(Event.created_at.desc()).limit(5).all()
    
    # Get upcoming assignments
    upcoming_assignments = Assignment.query.join(Event).filter(
        Event.start_date >= datetime.now().date()
    ).order_by(Assignment.shift_start).limit(10).all()
    
    return render_template('dashboard.html', 
                         total_volunteers=total_volunteers,
                         total_events=total_events,
                         total_assignments=total_assignments,
                         active_events=active_events,
                         recent_events=recent_events,
                         upcoming_assignments=upcoming_assignments)

# Volunteer Management Routes
@app.route('/volunteers')
@login_required
def volunteers():
    """Volunteer management page"""
    page = request.args.get('page', 1, type=int)
    search = request.args.get('search', '')
    
    query = Volunteer.query
    if search:
        query = query.filter(
            (Volunteer.first_name.contains(search)) |
            (Volunteer.last_name.contains(search)) |
            (Volunteer.email.contains(search)) |
            (Volunteer.congregation.contains(search))
        )
    
    volunteers = query.paginate(page=page, per_page=20, error_out=False)
    return render_template('volunteers.html', volunteers=volunteers, search=search)

@app.route('/volunteers/add', methods=['GET', 'POST'])
@login_required
def add_volunteer():
    """Add new volunteer"""
    if request.method == 'POST':
        volunteer = Volunteer(
            first_name=request.form['first_name'],
            last_name=request.form['last_name'],
            email=request.form['email'],
            phone=request.form.get('phone'),
            congregation=request.form.get('congregation'),
            experience_level=request.form.get('experience_level', 'Beginner'),
            availability=request.form.get('availability')
        )
        
        try:
            db.session.add(volunteer)
            db.session.commit()
            flash('Volunteer added successfully!')
            return redirect(url_for('volunteers'))
        except Exception as e:
            db.session.rollback()
            flash(f'Error adding volunteer: {str(e)}')
    
    return render_template('add_volunteer.html')

@app.route('/volunteers/import', methods=['GET', 'POST'])
@login_required
def import_volunteers():
    """Import volunteers from CSV"""
    if request.method == 'POST':
        if 'file' not in request.files:
            flash('No file selected')
            return redirect(request.url)
        
        file = request.files['file']
        if file.filename == '':
            flash('No file selected')
            return redirect(request.url)
        
        if file and file.filename.endswith('.csv'):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            try:
                imported_count = 0
                with open(filepath, 'r', newline='', encoding='utf-8') as csvfile:
                    reader = csv.DictReader(csvfile)
                    for row in reader:
                        volunteer = Volunteer(
                            first_name=row.get('first_name', ''),
                            last_name=row.get('last_name', ''),
                            email=row.get('email', ''),
                            phone=row.get('phone', ''),
                            congregation=row.get('congregation', ''),
                            experience_level=row.get('experience_level', 'Beginner'),
                            availability=row.get('availability', '')
                        )
                        db.session.add(volunteer)
                        imported_count += 1
                
                db.session.commit()
                flash(f'Successfully imported {imported_count} volunteers!')
                os.remove(filepath)  # Clean up uploaded file
                
            except Exception as e:
                db.session.rollback()
                flash(f'Error importing volunteers: {str(e)}')
                if os.path.exists(filepath):
                    os.remove(filepath)
            
            return redirect(url_for('volunteers'))
        else:
            flash('Please upload a CSV file')
    
    return render_template('import_volunteers.html')

# Event Management Routes
@app.route('/events')
@login_required
def events():
    """Event management page"""
    events = Event.query.order_by(Event.start_date.desc()).all()
    return render_template('events.html', events=events)

@app.route('/events/add', methods=['GET', 'POST'])
@login_required
def add_event():
    """Add new event"""
    if request.method == 'POST':
        event = Event(
            name=request.form['name'],
            event_type=EventType(request.form['event_type']),
            start_date=datetime.strptime(request.form['start_date'], '%Y-%m-%d').date(),
            end_date=datetime.strptime(request.form['end_date'], '%Y-%m-%d').date(),
            location=request.form.get('location'),
            description=request.form.get('description')
        )
        
        try:
            db.session.add(event)
            db.session.commit()
            flash('Event added successfully!')
            return redirect(url_for('events'))
        except Exception as e:
            db.session.rollback()
            flash(f'Error adding event: {str(e)}')
    
    return render_template('add_event.html', event_types=EventType)

# Assignment Management Routes
@app.route('/assignments')
@login_required
def assignments():
    """Assignment tracking page"""
    event_id = request.args.get('event_id')
    if event_id:
        event = Event.query.get_or_404(event_id)
        assignments = Assignment.query.filter_by(event_id=event_id).all()
        return render_template('assignments.html', assignments=assignments, event=event)
    
    events = Event.query.all()
    return render_template('select_event.html', events=events, action='assignments')

@app.route('/assignments/create', methods=['POST'])
@login_required
def create_assignment():
    """Create new assignment"""
    try:
        assignment = Assignment(
            volunteer_id=request.form['volunteer_id'],
            event_id=request.form['event_id'],
            position=request.form['position'],
            shift_start=datetime.strptime(request.form['shift_start'], '%Y-%m-%dT%H:%M'),
            shift_end=datetime.strptime(request.form['shift_end'], '%Y-%m-%dT%H:%M'),
            notes=request.form.get('notes', '')
        )
        
        # Check for conflicts
        conflicts = conflict_detector.check_conflicts(assignment)
        if conflicts:
            return jsonify({'success': False, 'conflicts': conflicts})
        
        db.session.add(assignment)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Assignment created successfully!'})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

# Scheduling Engine Routes
@app.route('/schedule/optimize/<int:event_id>')
@login_required
def optimize_schedule(event_id):
    """Optimize schedule for an event"""
    event = Event.query.get_or_404(event_id)
    
    try:
        optimized_assignments = scheduling_engine.optimize_event_schedule(event)
        
        # Save optimized assignments
        for assignment_data in optimized_assignments:
            assignment = Assignment(**assignment_data)
            db.session.add(assignment)
        
        db.session.commit()
        flash(f'Schedule optimized successfully! Created {len(optimized_assignments)} assignments.')
        
    except Exception as e:
        db.session.rollback()
        flash(f'Error optimizing schedule: {str(e)}')
    
    return redirect(url_for('assignments', event_id=event_id))

# Reporting Routes
@app.route('/reports')
@login_required
def reports():
    """Reporting dashboard"""
    # Generate various reports
    volunteer_stats = db.session.query(
        Volunteer.experience_level,
        db.func.count(Volunteer.id).label('count')
    ).group_by(Volunteer.experience_level).all()
    
    event_stats = db.session.query(
        Event.event_type,
        db.func.count(Event.id).label('count')
    ).group_by(Event.event_type).all()
    
    assignment_stats = db.session.query(
        Assignment.position,
        db.func.count(Assignment.id).label('count')
    ).group_by(Assignment.position).all()
    
    return render_template('reports.html',
                         volunteer_stats=volunteer_stats,
                         event_stats=event_stats,
                         assignment_stats=assignment_stats)

# Export Routes
@app.route('/export/schedule/<int:event_id>/<format>')
@login_required
def export_schedule(event_id, format):
    """Export schedule in various formats"""
    event = Event.query.get_or_404(event_id)
    assignments = Assignment.query.filter_by(event_id=event_id).all()
    
    try:
        if format == 'pdf':
            file_path = export_engine.export_pdf_schedule(event, assignments)
        elif format == 'excel':
            file_path = export_engine.export_excel_schedule(event, assignments)
        elif format == 'csv':
            file_path = export_engine.export_csv_schedule(event, assignments)
        else:
            flash('Invalid export format')
            return redirect(url_for('assignments', event_id=event_id))
        
        return send_file(file_path, as_attachment=True)
    
    except Exception as e:
        flash(f'Error exporting schedule: {str(e)}')
        return redirect(url_for('assignments', event_id=event_id))

# API Routes
@app.route('/api/volunteers')
@login_required
def api_volunteers():
    """API endpoint for volunteers"""
    volunteers = Volunteer.query.all()
    return jsonify([{
        'id': v.id,
        'name': f"{v.first_name} {v.last_name}",
        'email': v.email,
        'congregation': v.congregation,
        'experience_level': v.experience_level
    } for v in volunteers])

@app.route('/api/conflicts/check', methods=['POST'])
@login_required
def api_check_conflicts():
    """API endpoint to check for assignment conflicts"""
    data = request.get_json()
    
    # Create temporary assignment object for conflict checking
    temp_assignment = Assignment(
        volunteer_id=data['volunteer_id'],
        event_id=data['event_id'],
        shift_start=datetime.fromisoformat(data['shift_start']),
        shift_end=datetime.fromisoformat(data['shift_end'])
    )
    
    conflicts = conflict_detector.check_conflicts(temp_assignment)
    return jsonify({'conflicts': conflicts})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        
        # Create default admin user if it doesn't exist
        if not User.query.filter_by(username='admin').first():
            admin_user = User(
                username='admin',
                email='admin@example.com',
                password_hash=generate_password_hash('admin123'),
                is_admin=True
            )
            db.session.add(admin_user)
            db.session.commit()
            print("Default admin user created: admin/admin123")
    
    app.run(debug=True)
