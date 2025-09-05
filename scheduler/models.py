"""
JW Attendant Scheduler - Django Models

Django models equivalent to Flask SQLAlchemy models for managing attendants, events, and assignments.
"""

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinLengthValidator
from django.utils import timezone
from datetime import datetime, timedelta
import secrets

class UserRole(models.TextChoices):
    """User role enumeration"""
    ADMIN = 'admin', 'Admin'
    OVERSEER = 'overseer', 'Overseer'
    ASSISTANT_OVERSEER = 'assistant_overseer', 'Assistant Overseer'
    KEYMAN = 'keyman', 'Keyman'
    ATTENDANT = 'attendant', 'Attendant'


class JWStatus(models.TextChoices):
    """JW organizational status enumeration - Serving As"""
    ELDER = 'elder', 'Elder'
    MINISTERIAL_SERVANT = 'ministerial_servant', 'Ministerial Servant'
    REGULAR_PIONEER = 'regular_pioneer', 'Regular Pioneer'
    AUXILIARY_PIONEER = 'auxiliary_pioneer', 'Auxiliary Pioneer'
    PUBLISHER = 'publisher', 'Publisher'


class EventType(models.TextChoices):
    """Event type enumeration"""
    CIRCUIT_ASSEMBLY = 'circuit_assembly', 'Circuit Assembly'
    REGIONAL_CONVENTION = 'regional_convention', 'Regional Convention'
    SPECIAL_ASSEMBLY_DAY = 'special_assembly_day', 'Special Assembly Day'
    MEETING = 'meeting', 'Meeting'


class EventStatus(models.TextChoices):
    """Event status enumeration"""
    UPCOMING = 'upcoming', 'Upcoming'
    CURRENT = 'current', 'Current'
    COMPLETED = 'completed', 'Completed'
    CANCELLED = 'cancelled', 'Cancelled'
    ARCHIVED = 'archived', 'Archived'


class User(AbstractUser):
    """Extended user model with JW Attendant Scheduler specific fields"""
    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.ATTENDANT
    )
    is_admin = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    # Invitation system fields
    invitation_token = models.CharField(max_length=255, blank=True, null=True)
    invitation_sent_at = models.DateTimeField(blank=True, null=True)
    invitation_accepted_at = models.DateTimeField(blank=True, null=True)
    invited_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='invited_users'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    @staticmethod
    def generate_invitation_token():
        """Generate a secure invitation token"""
        return secrets.token_urlsafe(32)
    
    class Meta:
        db_table = 'auth_user'  # Use Django's default user table


class Attendant(models.Model):
    """Attendant model for JW convention attendants"""
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='attendant_profile')
    
    # Event associations - attendants can be associated with multiple events
    events = models.ManyToManyField(
        'Event',
        blank=True,
        related_name='attendants',
        help_text="Events this attendant is associated with"
    )
    
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField(blank=True, null=True, unique=True)
    phone = models.CharField(max_length=20)
    congregation = models.CharField(max_length=100)
    address = models.TextField(blank=True)
    
    # JW organizational status - now supports multiple selections
    serving_as = models.JSONField(
        default=list,
        blank=True,
        help_text="List of organizational positions (Elder, Ministerial Servant, Regular Pioneer, etc.)"
    )
    
    # Experience and availability
    experience_level = models.CharField(
        max_length=20,
        choices=[
            ('beginner', 'Beginner'),
            ('intermediate', 'Intermediate'),
            ('experienced', 'Experienced'),
            ('expert', 'Expert')
        ],
        default='beginner'
    )
    
    availability_notes = models.TextField(blank=True)
    
    # Event-specific fields
    is_active = models.BooleanField(default=True, help_text="Whether attendant is active for current event")
    oversight = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        limit_choices_to={'serving_as__overlap': ['overseer', 'assistant_overseer', 'keyman']},
        related_name='oversight_attendants',
        help_text="Assigned oversight (Overseer, Assistant Overseer, or Keyman)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def get_full_name(self):
        """Get the full name of the attendant"""
        return f"{self.first_name} {self.last_name}"
    
    def get_serving_as_display(self):
        """Get formatted display of serving positions"""
        if not self.serving_as:
            return "Publisher"
        
        # Map values to display names
        display_map = {
            'elder': 'Elder',
            'ministerial_servant': 'Ministerial Servant',
            'regular_pioneer': 'Regular Pioneer',
            'auxiliary_pioneer': 'Auxiliary Pioneer',
            'publisher': 'Publisher'
        }
        
        display_names = [display_map.get(pos, pos) for pos in self.serving_as if pos in display_map]
        return ', '.join(display_names) if display_names else "Publisher"
    
    def __str__(self):
        return self.get_full_name()
    
    class Meta:
        db_table = 'volunteer'  # Keep original table name for compatibility


class Event(models.Model):
    """Event model for assemblies, conventions, and meetings"""
    name = models.CharField(max_length=200)
    event_type = models.CharField(
        max_length=25,
        choices=EventType.choices,
        default=EventType.CIRCUIT_ASSEMBLY
    )
    
    start_date = models.DateField()
    end_date = models.DateField()
    location = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    
    # Event status
    status = models.CharField(
        max_length=15,
        choices=EventStatus.choices,
        default=EventStatus.UPCOMING
    )
    
    # Metadata fields
    archived_at = models.DateTimeField(null=True, blank=True, help_text="When this event was archived")
    cancelled_at = models.DateTimeField(null=True, blank=True, help_text="When this event was cancelled")
    completed_at = models.DateTimeField(null=True, blank=True, help_text="When this event was marked as completed")
    
    # Capacity and logistics
    total_stations = models.IntegerField(default=0)
    expected_attendants = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.start_date})"
    
    @classmethod
    def get_current_event(cls):
        """Get the current active event"""
        return cls.objects.filter(status=EventStatus.CURRENT).first()
    
    def set_as_current(self):
        """Set this event as current and others as upcoming/completed"""
        # Set all other events to appropriate status
        Event.objects.exclude(id=self.id).update(status=EventStatus.UPCOMING)
        self.status = EventStatus.CURRENT
        self.save()
    
    def mark_completed(self):
        """Mark this event as completed"""
        from django.utils import timezone
        self.status = EventStatus.COMPLETED
        self.completed_at = timezone.now()
        self.save()
    
    def mark_cancelled(self):
        """Mark this event as cancelled"""
        from django.utils import timezone
        self.status = EventStatus.CANCELLED
        self.cancelled_at = timezone.now()
        self.save()
    
    def archive(self):
        """Archive this event (removes from active lists)"""
        from django.utils import timezone
        self.status = EventStatus.ARCHIVED
        self.archived_at = timezone.now()
        self.save()
    
    def can_be_deleted(self):
        """Check if event can be safely deleted"""
        # Event can be deleted if it has no assignments or if it's archived/cancelled
        has_assignments = self.assignments.exists()
        return not has_assignments or self.status in [EventStatus.ARCHIVED, EventStatus.CANCELLED]
    
    def get_status_badge_class(self):
        """Get Bootstrap badge class for event status"""
        status_classes = {
            EventStatus.UPCOMING: 'badge-primary',
            EventStatus.CURRENT: 'badge-success',
            EventStatus.COMPLETED: 'badge-info',
            EventStatus.CANCELLED: 'badge-warning',
            EventStatus.ARCHIVED: 'badge-secondary'
        }
        return status_classes.get(self.status, 'badge-light')
    
    class Meta:
        ordering = ['-start_date']


class EventPosition(models.Model):
    """Numbered positions for events with optional names"""
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='positions'
    )
    position_number = models.PositiveIntegerField(
        help_text="Position number (1-53)"
    )
    position_name = models.CharField(
        max_length=100,
        blank=True,
        help_text="Optional name for position (e.g., 'Main Gate', 'Parking Lot A')"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['event', 'position_number']
        ordering = ['position_number']
    
    def __str__(self):
        if self.position_name:
            return f"Position {self.position_number}: {self.position_name}"
        return f"Position {self.position_number}"


class PositionShift(models.Model):
    """Shift windows for positions"""
    position = models.ForeignKey(
        EventPosition,
        on_delete=models.CASCADE,
        related_name='shifts'
    )
    shift_start = models.DateTimeField()
    shift_end = models.DateTimeField()
    is_all_day = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['shift_start']
    
    def clean(self):
        """Validate shift times"""
        from django.core.exceptions import ValidationError
        
        if self.shift_start and self.shift_end:
            if self.shift_start >= self.shift_end:
                raise ValidationError("Shift start time must be before shift end time.")
    
    def __str__(self):
        return f"{self.position} - {self.shift_start.strftime('%H:%M')} to {self.shift_end.strftime('%H:%M')}"


class CountSession(models.Model):
    """Count sessions for events (typically twice daily)"""
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='count_sessions'
    )
    session_name = models.CharField(
        max_length=50,
        help_text="e.g., 'Morning Count', 'Afternoon Count'"
    )
    count_time = models.DateTimeField(
        help_text="When the count should be taken"
    )
    is_completed = models.BooleanField(default=False)
    total_count = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Auto-calculated total from position counts"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['count_time']
        unique_together = ['event', 'session_name', 'count_time']
    
    def calculate_total(self):
        """Calculate total count from all position counts"""
        total = sum(pc.count for pc in self.position_counts.all() if pc.count is not None)
        self.total_count = total
        self.save()
        return total
    
    def __str__(self):
        return f"{self.event.name} - {self.session_name} ({self.count_time.strftime('%m/%d %H:%M')})"


class PositionCount(models.Model):
    """Individual position counts for count sessions"""
    count_session = models.ForeignKey(
        CountSession,
        on_delete=models.CASCADE,
        related_name='position_counts'
    )
    position = models.ForeignKey(
        EventPosition,
        on_delete=models.CASCADE,
        related_name='counts'
    )
    count = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Count for this position"
    )
    entered_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Oversight member who entered the count"
    )
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['count_session', 'position']
        ordering = ['position__position_number']
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Recalculate total when position count changes
        self.count_session.calculate_total()
    
    def __str__(self):
        count_str = str(self.count) if self.count is not None else "Not entered"
        return f"{self.position} - {count_str}"


class Assignment(models.Model):
    """Assignment tracking model - keeping existing structure for now"""
    attendant = models.ForeignKey(
        Attendant,
        on_delete=models.CASCADE,
        related_name='assignments'
    )
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='assignments'
    )
    
    position = models.CharField(
        max_length=100,
        help_text="Gate, Parking, Information, etc."
    )
    shift_start = models.DateTimeField()
    shift_end = models.DateTimeField()
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def clean(self):
        """Validate assignment for conflicts"""
        from django.core.exceptions import ValidationError
        from django.db.models import Q
        
        if not self.shift_start or not self.shift_end:
            return
        
        if self.shift_start >= self.shift_end:
            raise ValidationError("Shift start time must be before shift end time.")
        
        # Check for overlapping assignments for the same attendant
        overlapping_assignments = Assignment.objects.filter(
            attendant=self.attendant
        ).exclude(id=self.id if self.id else None)
        
        # Check for time overlap with other assignments
        conflicts = overlapping_assignments.filter(
            Q(shift_start__lt=self.shift_end) & 
            Q(shift_end__gt=self.shift_start)
        )
        
        if conflicts.exists():
            conflict_details = []
            for conflict in conflicts:
                conflict_details.append(
                    f"{conflict.event.name} - {conflict.position} ({conflict.shift_start.strftime('%m/%d %H:%M')} - {conflict.shift_end.strftime('%H:%M')})"
                )
            raise ValidationError(
                f"Assignment conflicts with existing assignments: {', '.join(conflict_details)}"
            )
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    def get_conflicting_assignments(self):
        """Get assignments that conflict with this one"""
        from django.db.models import Q
        
        if not self.shift_start or not self.shift_end:
            return Assignment.objects.none()
        
        overlapping_assignments = Assignment.objects.filter(
            attendant=self.attendant
        ).exclude(id=self.id if self.id else None)
        
        return overlapping_assignments.filter(
            Q(shift_start__lt=self.shift_end) & 
            Q(shift_end__gt=self.shift_start)
        )
    
    def __str__(self):
        return f"{self.attendant.get_full_name()} - {self.position} ({self.shift_start.strftime('%m/%d %H:%M')} - {self.shift_end.strftime('%H:%M')})"
    
    class Meta:
        ordering = ['shift_start']


class Department(models.Model):
    """Department/Area model for organizing oversight"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['name']


class StationRange(models.Model):
    """Station number ranges for oversight assignments"""
    name = models.CharField(
        max_length=100,
        help_text="e.g., 'Stations 1-12'"
    )
    start_station = models.IntegerField()
    end_station = models.IntegerField()
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['start_station']


class LanyardAssignment(models.Model):
    """Track lanyard assignments for events"""
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    badge_number = models.PositiveIntegerField()
    attendant = models.ForeignKey(Attendant, on_delete=models.SET_NULL, null=True, blank=True)
    checked_out = models.BooleanField(default=False)
    checked_out_at = models.DateTimeField(null=True, blank=True)
    returned = models.BooleanField(default=False)
    returned_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['event', 'badge_number']
        ordering = ['badge_number']
    
    def __str__(self):
        attendant_name = self.attendant.get_full_name() if self.attendant else "Unassigned"
        return f"Badge #{self.badge_number} - {attendant_name}"


class OverseerAssignment(models.Model):
    """Overseer assignment to departments and station ranges for events"""
    overseer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role__in': [UserRole.OVERSEER, UserRole.ASSISTANT_OVERSEER]},
        related_name='overseer_assignments'
    )
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='overseer_assignments'
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        blank=True,
        null=True
    )
    station_range = models.ForeignKey(
        StationRange,
        on_delete=models.CASCADE,
        blank=True,
        null=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.overseer.username} - {self.event.name}"
    
    class Meta:
        unique_together = ['overseer', 'event']


class AttendantOverseerAssignment(models.Model):
    """Assignment of attendants to overseers"""
    attendant = models.ForeignKey(
        Attendant,
        on_delete=models.CASCADE,
        related_name='overseer_assignments'
    )
    overseer_assignment = models.ForeignKey(
        OverseerAssignment,
        on_delete=models.CASCADE,
        related_name='attendant_assignments'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.attendant.get_full_name()} -> {self.overseer_assignment.overseer.username}"
    
    class Meta:
        unique_together = ['attendant', 'overseer_assignment']


class EmailConfiguration(models.Model):
    """Email configuration settings for Gmail integration"""
    
    # Gmail API Settings
    gmail_enabled = models.BooleanField(
        default=False,
        help_text="Enable Gmail API integration for sending emails"
    )
    gmail_credentials_uploaded = models.BooleanField(
        default=False,
        help_text="Whether Gmail credentials file has been uploaded"
    )
    gmail_authenticated = models.BooleanField(
        default=False,
        help_text="Whether Gmail API has been authenticated"
    )
    
    # Email Templates Settings
    site_name = models.CharField(
        max_length=100,
        default="JW Attendant Scheduler",
        help_text="Name displayed in email templates"
    )
    from_name = models.CharField(
        max_length=100,
        default="Event Coordination Team",
        help_text="Name displayed as email sender"
    )
    
    # Notification Settings
    send_invitation_emails = models.BooleanField(
        default=True,
        help_text="Send email invitations to new users"
    )
    send_assignment_notifications = models.BooleanField(
        default=False,
        help_text="Send email notifications for new assignments"
    )
    send_event_reminders = models.BooleanField(
        default=False,
        help_text="Send email reminders for upcoming events"
    )
    
    # Advanced Settings
    test_email_address = models.EmailField(
        blank=True,
        help_text="Email address for testing email functionality"
    )
    
    # Secure credential storage
    encrypted_gmail_token = models.TextField(
        blank=True,
        help_text="Encrypted Gmail OAuth2 token (stored securely)"
    )
    
    # App Password method (simpler alternative)
    gmail_email = models.EmailField(
        blank=True,
        help_text="Gmail address for sending emails"
    )
    encrypted_gmail_app_password = models.TextField(
        blank=True,
        help_text="Encrypted Gmail App Password (16-character password from Google)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Email Configuration"
        verbose_name_plural = "Email Configuration"
    
    def __str__(self):
        return f"Email Configuration - Gmail {'Enabled' if self.gmail_enabled else 'Disabled'}"
    
    def save(self, *args, **kwargs):
        # Ensure only one configuration exists
        if not self.pk and EmailConfiguration.objects.exists():
            raise ValueError("Only one email configuration can exist")
        super().save(*args, **kwargs)
    
    @classmethod
    def get_config(cls):
        """Get or create the email configuration"""
        config, created = cls.objects.get_or_create(
            pk=1,
            defaults={
                'site_name': 'JW Attendant Scheduler',
                'from_name': 'Event Coordination Team',
            }
        )
        return config
