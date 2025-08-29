"""
Event-related forms for JW Attendant Scheduler
"""

from django import forms
from django.utils import timezone
from datetime import datetime, timedelta

from ..models import Event, EventType, EventStatus


class EventForm(forms.ModelForm):
    """Form for creating and editing events"""
    
    class Meta:
        model = Event
        fields = [
            'name', 'event_type', 'start_date', 'end_date', 
            'location', 'description', 'status', 
            'total_stations', 'expected_attendants'
        ]
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'e.g., 2025 Circuit Assembly'
            }),
            'event_type': forms.Select(attrs={'class': 'form-select'}),
            'start_date': forms.DateInput(attrs={
                'class': 'form-control',
                'type': 'date'
            }),
            'end_date': forms.DateInput(attrs={
                'class': 'form-control',
                'type': 'date'
            }),
            'location': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Assembly Hall or Convention Center'
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Event details, special instructions, etc.'
            }),
            'status': forms.Select(attrs={'class': 'form-select'}),
            'total_stations': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': 0
            }),
            'expected_attendants': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': 0
            }),
        }
        help_texts = {
            'total_stations': 'Total number of attendant stations/positions',
            'expected_attendants': 'Expected number of attendants needed',
        }
    
    def clean(self):
        cleaned_data = super().clean()
        start_date = cleaned_data.get('start_date')
        end_date = cleaned_data.get('end_date')
        
        if start_date and end_date:
            if start_date > end_date:
                raise forms.ValidationError("Start date must be before or equal to end date.")
            
            # Warn if event is more than 2 years in the future
            if start_date > timezone.now().date() + timedelta(days=730):
                self.add_error('start_date', 
                    'Event is more than 2 years in the future. Please verify the date.')
        
        return cleaned_data


class EventFilterForm(forms.Form):
    """Form for filtering events in lists"""
    
    event_type = forms.ChoiceField(
        choices=[('', 'All Types')] + list(EventType.choices),
        required=False,
        widget=forms.Select(attrs={'class': 'form-select'})
    )
    
    status = forms.ChoiceField(
        choices=[('', 'All Statuses')] + list(EventStatus.choices),
        required=False,
        widget=forms.Select(attrs={'class': 'form-select'})
    )
    
    year = forms.ChoiceField(
        required=False,
        widget=forms.Select(attrs={'class': 'form-select'})
    )
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Generate year choices (current year ± 5 years)
        current_year = timezone.now().year
        year_choices = [('', 'All Years')]
        for year in range(current_year - 5, current_year + 6):
            year_choices.append((str(year), str(year)))
        
        self.fields['year'].choices = year_choices


class EventCopyForm(forms.Form):
    """Form for copying events with options"""
    
    copy_attendants = forms.BooleanField(
        required=False,
        initial=True,
        widget=forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        help_text='Copy all attendant assignments to the new event'
    )
    
    new_start_date = forms.DateField(
        widget=forms.DateInput(attrs={
            'class': 'form-control',
            'type': 'date'
        }),
        help_text='Start date for the copied event'
    )
    
    new_end_date = forms.DateField(
        widget=forms.DateInput(attrs={
            'class': 'form-control',
            'type': 'date'
        }),
        help_text='End date for the copied event'
    )
    
    new_name = forms.CharField(
        max_length=200,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Name for the copied event'
        })
    )
    
    def clean(self):
        cleaned_data = super().clean()
        start_date = cleaned_data.get('new_start_date')
        end_date = cleaned_data.get('new_end_date')
        
        if start_date and end_date:
            if start_date > end_date:
                raise forms.ValidationError("Start date must be before or equal to end date.")
        
        return cleaned_data
