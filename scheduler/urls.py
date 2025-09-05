from django.urls import path
from . import views
from . import gmail_auth_views
from . import simple_gmail_auth
from .api_views import auto_assign_api
from django.contrib.auth import views as auth_views

app_name = 'scheduler'

urlpatterns = [
    # Home and dashboard
    path('', views.home, name='home'),
    path('dashboard/', views.dashboard, name='dashboard'),
    
    # Event-centric navigation
    path('events/select/', views.event_selection, name='event_selection'),
    path('events/<int:event_id>/select/', views.select_event, name='select_event'),
    path('events/<int:event_id>/set-current/', views.set_current_event, name='set_current_event'),
    path('events/<int:event_id>/copy/', views.copy_event, name='copy_event'),
    path('events/<int:event_id>/dashboard/', views.event_dashboard, name='event_dashboard'),
    
    # Authentication
    path('login/', auth_views.LoginView.as_view(template_name='scheduler/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    
    # Attendants
    path('attendants/', views.attendant_list, name='attendant_list'),
    path('attendants/add/', views.attendant_create, name='attendant_create'),
    path('attendants/<int:attendant_id>/', views.attendant_detail, name='attendant_detail'),
    path('attendants/<int:attendant_id>/edit/', views.attendant_edit, name='attendant_edit'),
    path('attendants/<int:attendant_id>/delete/', views.delete_attendant, name='delete_attendant'),
    path('attendants/<int:attendant_id>/toggle-status/', views.toggle_attendant_status, name='toggle_attendant_status'),
    
    # Events
    path('events/', views.event_list, name='event_list'),
    path('events/add/', views.event_create, name='event_create'),
    path('events/<int:event_id>/', views.event_detail, name='event_detail'),
    path('events/<int:event_id>/edit/', views.event_edit, name='event_edit'),
    path('export/event/<int:event_id>/', views.export_event_schedule, name='export_event_schedule'),
    
    # Gmail OAuth2 authentication URLs
    path('gmail/auth/start/', gmail_auth_views.gmail_auth_start, name='gmail_auth_start'),
    path('gmail/auth/callback/', gmail_auth_views.gmail_auth_callback, name='gmail_auth_callback'),
    path('gmail/test/', gmail_auth_views.gmail_test_connection, name='gmail_test_connection'),
    path('gmail/revoke/', gmail_auth_views.gmail_revoke_auth, name='gmail_revoke_auth'),
    
    # Gmail App Password URLs (simpler method)
    path('gmail/app-password/configure/', simple_gmail_auth.configure_gmail_app_password, name='configure_gmail_app_password'),
    path('gmail/app-password/test/', simple_gmail_auth.test_gmail_app_password, name='test_gmail_app_password'),
    path('gmail/app-password/remove/', simple_gmail_auth.remove_gmail_app_password, name='remove_gmail_app_password'),
    
    # Assignments
    path('assignments/', views.assignment_list, name='assignment_list'),
    path('assignments/add/', views.assignment_create, name='assignment_create'),
    path('assignments/<int:assignment_id>/edit/', views.assignment_edit, name='assignment_edit'),
    
    # Reports
    path('reports/', views.reports, name='reports'),
    path('oversight/', views.oversight_dashboard, name='oversight_dashboard'),
    
    # User Management
    path('users/', views.user_list, name='user_list'),
    path('users/create/', views.user_create, name='user_create'),
    path('attendant-dashboard/', views.attendant_dashboard, name='attendant_dashboard'),
    path('attendant-profile/', views.attendant_profile, name='attendant_profile'),
    
    # Lanyard tracking
    path('lanyards/', views.lanyard_tracking, name='lanyard_tracking'),
    path('lanyards/assign/', views.assign_lanyard, name='assign_lanyard'),
    path('lanyards/toggle/', views.toggle_lanyard_status, name='toggle_lanyard_status'),
    
    path('users/invite/', views.user_invite, name='user_invite'),
    path('users/<int:user_id>/edit/', views.user_edit, name='user_edit'),
    path('users/<int:user_id>/delete/', views.user_delete, name='user_delete'),
    path('users/<int:user_id>/link-attendant/', views.link_attendant, name='link_attendant'),
    path('users/<int:user_id>/unlink-attendant/', views.unlink_attendant, name='unlink_attendant'),
    path('activate/<str:token>/', views.user_activate, name='user_activate'),
    
    # Import/Export endpoints
    path('import/attendants/', views.import_attendants, name='import_attendants'),
    path('download/sample-csv/', views.download_sample_csv, name='download_sample_csv'),
    path('export/attendants/', views.export_attendants, name='export_attendants'),
    path('export/events/', views.export_events, name='export_events'),
    path('export/assignments/', views.export_assignments, name='export_assignments'),
    
    # API URLs for conflict detection and auto-assignment
    path('api/attendant/<int:attendant_id>/assignments/', views.attendant_assignments_api, name='attendant_assignments_api'),
    path('api/check-conflicts/', views.check_conflicts_api, name='check_conflicts_api'),
    path('api/auto-assign/', auto_assign_api, name='auto_assign_api'),
    
    # Health check endpoint for CI/CD
    path('health/', views.health_check, name='health_check'),
    
    # Bulk assignment operations
    path('bulk-assignment/delete/', views.bulk_assignment_delete, name='bulk_assignment_delete'),
    
    
    # Position management
    path('events/<int:event_id>/positions/', views.event_positions, name='event_positions'),
    path('events/<int:event_id>/positions/bulk-create/', views.bulk_create_positions, name='bulk_create_positions'),
    path('events/<int:event_id>/positions/add-single/', views.add_single_position, name='add_single_position'),
    path('events/<int:event_id>/positions/add-range/', views.add_position_range, name='add_position_range'),
    path('events/<int:event_id>/positions/bulk-apply-shifts/', views.bulk_apply_shifts, name='bulk_apply_shifts'),
    path('positions/<int:position_id>/add-shift/', views.add_position_shift, name='add_position_shift'),
    path('positions/<int:position_id>/update-name/', views.update_position_name, name='update_position_name'),
    path('positions/<int:position_id>/delete/', views.delete_position, name='delete_position'),
    path('shifts/<int:shift_id>/delete/', views.delete_shift, name='delete_shift'),
    path('assignments/bulk/update/', views.bulk_assignment_update, name='bulk_assignment_update'),
    
    # Bulk assignment operations
    path('assignments/bulk/create/', views.bulk_assignment_create, name='bulk_assignment_create'),
    
    # Position templates
    path('templates/positions/', views.position_templates, name='position_templates'),
    
    # Count Session Management API
    path('events/<int:event_id>/count-sessions/', views.create_count_session, name='create_count_session'),
    path('events/<int:event_id>/count-sessions/<int:session_id>/', views.update_count_session, name='update_count_session'),
    path('events/<int:event_id>/count-sessions/<int:session_id>/', views.delete_count_session, name='delete_count_session'),
]
