from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, Attendant, Event, Assignment, Department, 
    StationRange, OverseerAssignment, AttendantOverseerAssignment,
    EmailConfiguration
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom User admin with JW Scheduler specific fields"""
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined')
    list_filter = ('role', 'is_active', 'is_staff', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('username',)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('JW Scheduler Fields', {
            'fields': ('role', 'invitation_token', 'invitation_sent_at', 
                      'invitation_accepted_at', 'invited_by')
        }),
    )


@admin.register(Attendant)
class AttendantAdmin(admin.ModelAdmin):
    """Attendant admin interface"""
    list_display = ('get_full_name', 'email', 'congregation', 'get_serving_as_display', 'phone')
    list_filter = ('congregation',)
    search_fields = ('first_name', 'last_name', 'email', 'congregation')
    ordering = ('last_name', 'first_name')
    
    fieldsets = (
        ('Personal Information', {
            'fields': ('user', 'first_name', 'last_name', 'email', 'phone', 'address')
        }),
        ('JW Organization', {
            'fields': ('congregation', 'serving_as')
        }),
        ('Preferences', {
            'fields': ('preferred_positions', 'availability_notes')
        }),
        ('Emergency Contact', {
            'fields': ('emergency_contact', 'emergency_phone')
        }),
    )


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    """Event admin interface"""
    list_display = ('name', 'event_type', 'start_date', 'end_date', 'status', 'location')
    list_filter = ('event_type', 'status', 'start_date')
    search_fields = ('name', 'location', 'description')
    ordering = ('-start_date',)
    date_hierarchy = 'start_date'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'event_type', 'status', 'description')
        }),
        ('Schedule', {
            'fields': ('start_date', 'end_date', 'location')
        }),
        ('Logistics', {
            'fields': ('total_stations', 'expected_attendants')
        }),
    )


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    """Assignment admin interface"""
    list_display = ('attendant', 'event', 'position', 'shift_start', 'shift_end')
    list_filter = ('event', 'position', 'shift_start')
    search_fields = ('attendant__first_name', 'attendant__last_name', 'position', 'event__name')
    ordering = ('-shift_start',)
    date_hierarchy = 'shift_start'
    
    fieldsets = (
        ('Assignment Details', {
            'fields': ('attendant', 'event', 'position')
        }),
        ('Schedule', {
            'fields': ('shift_start', 'shift_end')
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
    )


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    """Department admin interface"""
    list_display = ('name', 'description', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('name',)


@admin.register(StationRange)
class StationRangeAdmin(admin.ModelAdmin):
    """Station Range admin interface"""
    list_display = ('name', 'start_station', 'end_station', 'description')
    ordering = ('start_station',)
    
    fieldsets = (
        ('Range Information', {
            'fields': ('name', 'start_station', 'end_station')
        }),
        ('Description', {
            'fields': ('description',)
        }),
    )


@admin.register(OverseerAssignment)
class OverseerAssignmentAdmin(admin.ModelAdmin):
    """Overseer Assignment admin interface"""
    list_display = ('overseer', 'event', 'department', 'station_range', 'created_at')
    list_filter = ('event', 'department', 'created_at')
    search_fields = ('overseer__username', 'event__name', 'department__name')
    ordering = ('-created_at',)


@admin.register(AttendantOverseerAssignment)
class AttendantOverseerAssignmentAdmin(admin.ModelAdmin):
    """Attendant-Overseer Assignment admin interface"""
    list_display = ('attendant', 'get_overseer', 'get_event', 'created_at')
    list_filter = ('overseer_assignment__event', 'created_at')
    search_fields = ('attendant__first_name', 'attendant__last_name', 
                    'overseer_assignment__overseer__username')
    ordering = ('-created_at',)
    
    def get_overseer(self, obj):
        return obj.overseer_assignment.overseer.username
    get_overseer.short_description = 'Overseer'
    
    def get_event(self, obj):
        return obj.overseer_assignment.event.name
    get_event.short_description = 'Event'


@admin.register(EmailConfiguration)
class EmailConfigurationAdmin(admin.ModelAdmin):
    """Email Configuration admin interface"""
    list_display = ('site_name', 'gmail_enabled', 'gmail_authenticated', 'send_invitation_emails', 'updated_at')
    
    fieldsets = (
        ('Gmail Settings', {
            'fields': ('gmail_enabled', 'gmail_email', 'gmail_authenticated'),
            'description': 'Configure Gmail for sending emails using App Password (simpler) or OAuth2'
        }),
        ('Email Templates', {
            'fields': ('site_name', 'from_name'),
            'description': 'Customize how emails appear to recipients'
        }),
        ('Notification Settings', {
            'fields': ('send_invitation_emails', 'send_assignment_notifications', 'send_event_reminders'),
            'description': 'Control which types of emails are automatically sent'
        }),
        ('Testing', {
            'fields': ('test_email_address',),
            'description': 'Email address for testing email functionality'
        }),
    )
    
    readonly_fields = ('gmail_credentials_uploaded', 'gmail_authenticated')
    
    def has_add_permission(self, request):
        # Only allow one configuration to exist
        return not EmailConfiguration.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        # Don't allow deletion of the configuration
        return False
    
    def change_view(self, request, object_id, form_url='', extra_context=None):
        """Add Gmail authentication buttons to the change view"""
        extra_context = extra_context or {}
        
        # Check current configuration status
        try:
            config = EmailConfiguration.objects.get(pk=object_id)
            has_app_password = bool(config.gmail_email and config.encrypted_gmail_app_password)
            has_oauth_token = config.gmail_authenticated
        except EmailConfiguration.DoesNotExist:
            has_app_password = False
            has_oauth_token = False
        
        # Add Gmail authentication URLs and status
        extra_context.update({
            'gmail_auth_start_url': '/gmail/auth/start/',
            'gmail_test_url': '/gmail/test/',
            'gmail_revoke_url': '/gmail/revoke/',
            'has_app_password': has_app_password,
            'has_oauth_token': has_oauth_token,
        })
        
        return super().change_view(request, object_id, form_url, extra_context)
