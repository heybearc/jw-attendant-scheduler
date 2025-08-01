"""
JW Attendant Scheduler - Django Models

Django models equivalent to Flask SQLAlchemy models for managing attendants, events, and assignments.
Converted from Flask SQLAlchemy to Django ORM while maintaining data compatibility.
"""

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinLengthValidator
from datetime import datetime


class UserRole(models.TextChoices):
    """User role enumeration"""
    ADMIN = 'admin', 'Admin'
    OVERSEER = 'overseer', 'Overseer'
    ASSISTANT_OVERSEER = 'assistant_overseer', 'Assistant Overseer'
    KEYMAN = 'keyman', 'Keyman'
    ATTENDANT = 'attendant', 'Attendant'


class JWStatus(models.TextChoices):
    """JW organizational status enumeration"""
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
    
    class Meta:
        db_table = 'auth_user'  # Use Django's default user table


class Attendant(models.Model):
    """Attendant information model (formerly Volunteer in Flask version)"""
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='attendant_profile',
        blank=True,
        null=True
    )
    
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    congregation = models.CharField(max_length=100)
    address = models.TextField(blank=True)
    
    # JW organizational status
    jw_status = models.CharField(
        max_length=25,
        choices=JWStatus.choices,
        default=JWStatus.PUBLISHER
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
    
    preferred_positions = models.TextField(
        blank=True,
        help_text="Comma-separated list of preferred positions"
    )
    
    availability_notes = models.TextField(blank=True)
    emergency_contact = models.CharField(max_length=100, blank=True)
    emergency_phone = models.CharField(max_length=20, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def get_full_name(self):
        """Get the full name of the attendant"""
        return f"{self.first_name} {self.last_name}"
    
    def __str__(self):
        return self.get_full_name()
    
    class Meta:
        db_table = 'volunteer'  # Keep original table name for compatibility
        ordering = ['last_name', 'first_name']


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
    
    class Meta:
        ordering = ['-start_date']


class Assignment(models.Model):
    """Assignment tracking model"""
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
    
    def __str__(self):
        return f"{self.attendant.get_full_name()} - {self.position} ({self.event.name})"
    
    class Meta:
        unique_together = ['attendant', 'event', 'shift_start']
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
