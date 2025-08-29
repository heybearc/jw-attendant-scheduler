from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import Attendant, Event, Assignment, User


class AttendantForm(forms.ModelForm):
    """Form for creating and editing attendants"""
    
    # Custom field for multiple serving positions
    serving_as = forms.MultipleChoiceField(
        choices=[
            ('elder', 'Elder'),
            ('ministerial_servant', 'Ministerial Servant'),
            ('regular_pioneer', 'Regular Pioneer'),
            ('auxiliary_pioneer', 'Auxiliary Pioneer'),
            ('publisher', 'Publisher'),
            ('exemplary', 'Exemplary'),
            ('keyman', 'Keyman'),
            ('overseer', 'Overseer'),
            ('assistant_overseer', 'Assistant Overseer'),
            ('other_department', 'Other Department')
        ],
        widget=forms.CheckboxSelectMultiple(attrs={'class': 'form-check-input'}),
        required=False,
        label='Serving As',
        help_text='Select all positions that apply'
    )
    
    class Meta:
        model = Attendant
        fields = [
            'first_name', 'last_name', 'email', 'phone', 'congregation',
            'events', 'availability_notes', 'oversight'
        ]
        widgets = {
            'first_name': forms.TextInput(attrs={'class': 'form-control'}),
            'last_name': forms.TextInput(attrs={'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'class': 'form-control'}),
            'phone': forms.TextInput(attrs={'class': 'form-control'}),
            'congregation': forms.TextInput(attrs={'class': 'form-control'}),
            'events': forms.CheckboxSelectMultiple(attrs={'class': 'form-check-input'}),
            'availability_notes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'oversight': forms.Select(attrs={'class': 'form-control'}),
        }
    
    def __init__(self, *args, **kwargs):
        # Extract selected_event from kwargs if provided
        self.selected_event = kwargs.pop('selected_event', None)
        super().__init__(*args, **kwargs)
        
        # Pre-populate serving_as field if editing existing attendant
        if self.instance and self.instance.pk and self.instance.serving_as:
            self.fields['serving_as'].initial = self.instance.serving_as
        
        # Filter oversight choices to only show management roles
        from scheduler.models import Attendant
        # Get all attendants and filter in Python since SQLite doesn't support JSON overlap
        all_attendants = Attendant.objects.all().order_by('last_name', 'first_name')
        management_attendants = []
        
        for attendant in all_attendants:
            if attendant.serving_as and any(role in attendant.serving_as for role in ['overseer', 'assistant_overseer', 'keyman']):
                management_attendants.append(attendant.id)
        
        self.fields['oversight'].queryset = Attendant.objects.filter(
            id__in=management_attendants
        ).order_by('last_name', 'first_name')
        
        # If creating new attendant and selected_event is provided, pre-select it
        if not self.instance.pk and self.selected_event:
            self.fields['events'].initial = [self.selected_event.id]
    
    def save(self, commit=True):
        instance = super().save(commit=False)
        # Convert serving_as to list for JSON field
        instance.serving_as = self.cleaned_data.get('serving_as', [])
        if commit:
            instance.save()
        return instance


class UserCreateForm(forms.ModelForm):
    """Form for creating new users manually"""
    password1 = forms.CharField(
        label='Password',
        widget=forms.PasswordInput(attrs={'class': 'form-control'}),
        help_text='Enter a password for the new user'
    )
    password2 = forms.CharField(
        label='Confirm Password',
        widget=forms.PasswordInput(attrs={'class': 'form-control'}),
        help_text='Enter the same password as before, for verification'
    )

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name']
        widgets = {
            'username': forms.TextInput(attrs={'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'class': 'form-control'}),
            'first_name': forms.TextInput(attrs={'class': 'form-control'}),
            'last_name': forms.TextInput(attrs={'class': 'form-control'}),
        }

    def clean_password2(self):
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords don't match")
        return password2

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


class EventForm(forms.ModelForm):
    """Form for creating and editing events"""
    
    class Meta:
        model = Event
        fields = [
            'name', 'event_type', 'start_date', 'end_date', 'location',
            'description', 'status', 'total_stations', 'expected_attendants'
        ]
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Event Name'}),
            'event_type': forms.Select(attrs={'class': 'form-control'}),
            'start_date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'end_date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'location': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Event Location'}),
            'description': forms.Textarea(attrs={
                'class': 'form-control', 
                'rows': 4, 
                'placeholder': 'Event description and details'
            }),
            'status': forms.Select(attrs={'class': 'form-control'}),
            'total_stations': forms.NumberInput(attrs={'class': 'form-control', 'min': '0'}),
            'expected_attendants': forms.NumberInput(attrs={'class': 'form-control', 'min': '0'}),
        }

    def clean(self):
        cleaned_data = super().clean()
        start_date = cleaned_data.get('start_date')
        end_date = cleaned_data.get('end_date')

        if start_date and end_date and start_date > end_date:
            raise forms.ValidationError("End date must be after start date.")

        return cleaned_data


class AssignmentForm(forms.ModelForm):
    """Form for creating and editing assignments"""
    
    class Meta:
        model = Assignment
        fields = ['attendant', 'event', 'position', 'shift_start', 'shift_end', 'notes']
        widgets = {
            'attendant': forms.Select(attrs={'class': 'form-select'}),
            'event': forms.Select(attrs={'class': 'form-select'}),
            'position': forms.TextInput(attrs={'class': 'form-control'}),
            'shift_start': forms.DateTimeInput(attrs={'class': 'form-control', 'type': 'datetime-local'}),
            'shift_end': forms.DateTimeInput(attrs={'class': 'form-control', 'type': 'datetime-local'}),
            'notes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }
    
    def clean(self):
        """Custom validation with conflict detection"""
        cleaned_data = super().clean()
        attendant = cleaned_data.get('attendant')
        shift_start = cleaned_data.get('shift_start')
        shift_end = cleaned_data.get('shift_end')
        
        if not all([attendant, shift_start, shift_end]):
            return cleaned_data
        
        if shift_start >= shift_end:
            raise forms.ValidationError("Shift start time must be before shift end time.")
        
        # Check for conflicts
        from django.db.models import Q
        
        overlapping_assignments = Assignment.objects.filter(
            attendant=attendant
        ).exclude(id=self.instance.id if self.instance.id else None)
        
        conflicts = overlapping_assignments.filter(
            Q(shift_start__lt=shift_end) & Q(shift_end__gt=shift_start)
        )
        
        if conflicts.exists():
            conflict_list = []
            for conflict in conflicts:
                conflict_list.append(
                    f"{conflict.event.name} ({conflict.shift_start.strftime('%m/%d %H:%M')} - {conflict.shift_end.strftime('%H:%M')})"
                )
            
            # Add non-field error for conflicts
            raise forms.ValidationError(
                f"This assignment conflicts with existing assignments: {', '.join(conflict_list)}"
            )
        
        return cleaned_data
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Order attendants by name
        self.fields['attendant'].queryset = Attendant.objects.all().order_by('last_name', 'first_name')
        # Order events by start date
        self.fields['event'].queryset = Event.objects.all().order_by('-start_date')


class BulkAssignmentForm(forms.Form):
    """Form for creating multiple assignments at once"""
    event = forms.ModelChoiceField(
        queryset=Event.objects.all().order_by('-start_date'),
        widget=forms.Select(attrs={'class': 'form-select'}),
        help_text="Select the event for all assignments"
    )
    attendants = forms.ModelMultipleChoiceField(
        queryset=Attendant.objects.all().order_by('last_name', 'first_name'),
        widget=forms.CheckboxSelectMultiple(attrs={'class': 'form-check-input'}),
        help_text="Select multiple attendants to assign"
    )
    position = forms.CharField(
        max_length=100,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'e.g., Attendant, Parking, Security'}),
        help_text="Position/role for all selected attendants"
    )
    shift_start = forms.DateTimeField(
        widget=forms.DateTimeInput(attrs={'class': 'form-control', 'type': 'datetime-local'}),
        help_text="Start time for all assignments"
    )
    shift_end = forms.DateTimeField(
        widget=forms.DateTimeInput(attrs={'class': 'form-control', 'type': 'datetime-local'}),
        help_text="End time for all assignments"
    )
    notes = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'Optional notes for all assignments'}),
        help_text="Optional notes that will be added to all assignments"
    )
    check_conflicts = forms.BooleanField(
        required=False,
        initial=True,
        widget=forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        help_text="Check for scheduling conflicts before creating assignments"
    )
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Set default shift times based on event if provided
        if 'initial' in kwargs and 'event' in kwargs['initial']:
            event = kwargs['initial']['event']
            if hasattr(event, 'start_date') and hasattr(event, 'end_date'):
                self.fields['shift_start'].initial = event.start_date
                self.fields['shift_end'].initial = event.end_date
    
    def clean(self):
        cleaned_data = super().clean()
        shift_start = cleaned_data.get('shift_start')
        shift_end = cleaned_data.get('shift_end')
        attendants = cleaned_data.get('attendants')
        check_conflicts = cleaned_data.get('check_conflicts', True)
        
        if shift_start and shift_end and shift_start >= shift_end:
            raise forms.ValidationError("Shift start time must be before shift end time.")
        
        # Check for conflicts if requested
        if check_conflicts and attendants and shift_start and shift_end:
            from django.db.models import Q
            conflicts = []
            
            for attendant in attendants:
                overlapping = Assignment.objects.filter(
                    attendant=attendant,
                    shift_start__lt=shift_end,
                    shift_end__gt=shift_start
                )
                
                if overlapping.exists():
                    conflict_details = []
                    for conflict in overlapping:
                        conflict_details.append(
                            f"{conflict.event.name} ({conflict.shift_start.strftime('%m/%d %H:%M')} - {conflict.shift_end.strftime('%H:%M')})"
                        )
                    conflicts.append(f"{attendant.get_full_name()}: {', '.join(conflict_details)}")
            
            if conflicts:
                raise forms.ValidationError(
                    f"Scheduling conflicts detected:\n" + "\n".join(conflicts[:5]) + 
                    (f"\n... and {len(conflicts) - 5} more conflicts" if len(conflicts) > 5 else "")
                )
        
        return cleaned_data






class UserInvitationForm(forms.ModelForm):
    """Form for inviting new users (no password fields)"""
    
    email = forms.EmailField(required=True, widget=forms.EmailInput(attrs={'class': 'form-control'}))
    first_name = forms.CharField(required=True, widget=forms.TextInput(attrs={'class': 'form-control'}))
    last_name = forms.CharField(required=True, widget=forms.TextInput(attrs={'class': 'form-control'}))

    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name')
        widgets = {
            'username': forms.TextInput(attrs={'class': 'form-control'}),
        }

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        user.first_name = self.cleaned_data['first_name']
        user.last_name = self.cleaned_data['last_name']
        user.is_active = False  # User needs to activate via email
        if commit:
            user.save()
        return user


class AttendantSearchForm(forms.Form):
    """Form for searching and filtering attendants"""
    
    search = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Search by name, email, or congregation...'
        })
    )
    jw_status = forms.ChoiceField(
        required=False,
        choices=[('', 'All Serving As')],
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    experience = forms.ChoiceField(
        required=False,
        choices=[('', 'All Experience Levels')] + [
            ('beginner', 'Beginner'),
            ('intermediate', 'Intermediate'),
            ('experienced', 'Experienced'),
            ('expert', 'Expert')
        ],
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    congregation = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Filter by congregation...'
        })
    )


class EventSearchForm(forms.Form):
    """Form for searching and filtering events"""
    
    search = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Search by name or location...'
        })
    )
    status = forms.ChoiceField(
        required=False,
        choices=[('', 'All Status')],
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    event_type = forms.ChoiceField(
        required=False,
        choices=[('', 'All Event Types')],
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    date_from = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={'class': 'form-control', 'type': 'date'})
    )
    date_to = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={'class': 'form-control', 'type': 'date'})
    )


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
    
    def clean(self):
        cleaned_data = super().clean()
        start_date = cleaned_data.get('start_date')
        end_date = cleaned_data.get('end_date')
        
        if start_date and end_date:
            if start_date > end_date:
                raise forms.ValidationError("Start date must be before or equal to end date.")
        
        return cleaned_data
