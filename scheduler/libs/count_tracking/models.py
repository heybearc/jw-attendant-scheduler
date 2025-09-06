"""
Count Tracking Models

Data models for count tracking library.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, date, time
from django.db import models
from ..shared.observability import log_event, EventLogger

class CountSessionModel:
    """Count session model interface for the library."""
    
    def __init__(self, django_session=None):
        """Initialize with optional Django model instance."""
        self._django_session = django_session
    
    @classmethod
    def from_django(cls, django_session):
        """Create CountSessionModel from Django CountSession instance."""
        return cls(django_session)
    
    @classmethod
    def create(cls, event_id: int, position_id: int, **kwargs) -> 'CountSessionModel':
        """Create new count session."""
        from scheduler.models import CountSession
        
        django_session = CountSession.objects.create(
            event_id=event_id,
            position_id=position_id,
            status='pending',
            **kwargs
        )
        
        # Log session creation
        EventLogger.count_session_created(
            session_id=django_session.id,
            event_id=event_id,
            position_id=position_id,
            created_by=kwargs.get('created_by', 0)
        )
        
        return cls(django_session)
    
    @classmethod
    def get_by_id(cls, session_id: int) -> Optional['CountSessionModel']:
        """Get count session by ID."""
        from scheduler.models import CountSession
        
        try:
            django_session = CountSession.objects.get(id=session_id)
            return cls(django_session)
        except CountSession.DoesNotExist:
            return None
    
    @classmethod
    def list_all(cls, **filters) -> List['CountSessionModel']:
        """List all count sessions with optional filters."""
        from scheduler.models import CountSession
        
        queryset = CountSession.objects.select_related('event', 'position')
        
        # Apply filters
        if 'event_id' in filters:
            queryset = queryset.filter(event_id=filters['event_id'])
        if 'position_id' in filters:
            queryset = queryset.filter(position_id=filters['position_id'])
        if 'status' in filters:
            queryset = queryset.filter(status=filters['status'])
        if 'date_from' in filters:
            queryset = queryset.filter(created_at__gte=filters['date_from'])
        if 'date_to' in filters:
            queryset = queryset.filter(created_at__lte=filters['date_to'])
        
        return [cls(session) for session in queryset.order_by('-created_at')]
    
    @property
    def id(self) -> int:
        """Session ID."""
        return self._django_session.id if self._django_session else None
    
    @property
    def event_id(self) -> int:
        """Event ID."""
        return self._django_session.event_id if self._django_session else None
    
    @property
    def position_id(self) -> int:
        """Position ID."""
        return self._django_session.position_id if self._django_session else None
    
    @property
    def status(self) -> str:
        """Session status."""
        return getattr(self._django_session, 'status', 'pending') if self._django_session else "pending"
    
    @property
    def start_time(self) -> datetime:
        """Session start time."""
        return getattr(self._django_session, 'start_time', None) if self._django_session else None
    
    @property
    def end_time(self) -> datetime:
        """Session end time."""
        return getattr(self._django_session, 'end_time', None) if self._django_session else None
    
    @property
    def created_at(self) -> datetime:
        """Session creation time."""
        return getattr(self._django_session, 'created_at', None) if self._django_session else None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        if not self._django_session:
            return {}
        
        result = {
            'id': self.id,
            'event_id': self.event_id,
            'position_id': self.position_id,
            'status': self.status,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        # Add related object names if available
        if hasattr(self._django_session, 'event'):
            result['event_name'] = self._django_session.event.name
        if hasattr(self._django_session, 'position'):
            result['position_name'] = self._django_session.position.name
        
        return result
    
    def update(self, **kwargs) -> bool:
        """Update session fields."""
        if not self._django_session:
            return False
        
        updated_fields = []
        for field, value in kwargs.items():
            if hasattr(self._django_session, field):
                setattr(self._django_session, field, value)
                updated_fields.append(field)
        
        if updated_fields:
            self._django_session.save(update_fields=updated_fields)
            
            # Log update
            log_event("count_session.updated", {
                "session_id": self.id,
                "updated_fields": updated_fields
            })
            
            return True
        
        return False
    
    def delete(self) -> bool:
        """Delete session."""
        if not self._django_session:
            return False
        
        session_id = self.id
        
        self._django_session.delete()
        
        # Log deletion
        log_event("count_session.deleted", {
            "session_id": session_id
        })
        
        return True
    
    def get_count_records(self) -> List[Dict[str, Any]]:
        """Get all count records for this session."""
        if not self._django_session:
            return []
        
        try:
            from scheduler.models import CountRecord
            records = CountRecord.objects.filter(session=self._django_session).order_by('recorded_at')
            
            return [
                {
                    'id': record.id,
                    'count_type': record.count_type,
                    'count_value': record.count_value,
                    'recorded_at': record.recorded_at.isoformat() if hasattr(record, 'recorded_at') else None,
                    'notes': getattr(record, 'notes', '')
                }
                for record in records
            ]
        except:
            return []
    
    def get_total_count(self) -> int:
        """Get total count for this session."""
        records = self.get_count_records()
        return sum(record['count_value'] for record in records)
    
    def start_session(self) -> bool:
        """Start the count session."""
        if self.status != 'pending':
            return False
        
        return self.update(
            status='active',
            start_time=datetime.now()
        )
    
    def end_session(self) -> bool:
        """End the count session."""
        if self.status != 'active':
            return False
        
        return self.update(
            status='completed',
            end_time=datetime.now()
        )
    
    def __str__(self) -> str:
        """String representation."""
        return f"CountSession({self.id}, {self.status})"
    
    def __repr__(self) -> str:
        """Detailed representation."""
        return f"CountSessionModel(id={self.id}, event_id={self.event_id}, status='{self.status}')"

class CountRecordModel:
    """Count record model for individual count entries."""
    
    def __init__(self, django_record=None):
        """Initialize with optional Django model instance."""
        self._django_record = django_record
    
    @classmethod
    def from_django(cls, django_record):
        """Create CountRecordModel from Django CountRecord instance."""
        return cls(django_record)
    
    @classmethod
    def create(cls, session_id: int, count_type: str, count_value: int, **kwargs) -> 'CountRecordModel':
        """Create new count record."""
        from scheduler.models import CountRecord
        
        django_record = CountRecord.objects.create(
            session_id=session_id,
            count_type=count_type,
            count_value=count_value,
            recorded_at=datetime.now(),
            **kwargs
        )
        
        # Log record creation
        log_event("count_record.created", {
            "record_id": django_record.id,
            "session_id": session_id,
            "count_type": count_type,
            "count_value": count_value
        })
        
        return cls(django_record)
    
    @classmethod
    def get_by_id(cls, record_id: int) -> Optional['CountRecordModel']:
        """Get count record by ID."""
        from scheduler.models import CountRecord
        
        try:
            django_record = CountRecord.objects.get(id=record_id)
            return cls(django_record)
        except CountRecord.DoesNotExist:
            return None
    
    @classmethod
    def list_by_session(cls, session_id: int) -> List['CountRecordModel']:
        """List all count records for a session."""
        from scheduler.models import CountRecord
        
        records = CountRecord.objects.filter(session_id=session_id).order_by('recorded_at')
        return [cls(record) for record in records]
    
    @property
    def id(self) -> int:
        """Record ID."""
        return self._django_record.id if self._django_record else None
    
    @property
    def session_id(self) -> int:
        """Session ID."""
        return self._django_record.session_id if self._django_record else None
    
    @property
    def count_type(self) -> str:
        """Count type."""
        return getattr(self._django_record, 'count_type', '') if self._django_record else ""
    
    @property
    def count_value(self) -> int:
        """Count value."""
        return getattr(self._django_record, 'count_value', 0) if self._django_record else 0
    
    @property
    def recorded_at(self) -> datetime:
        """Record timestamp."""
        return getattr(self._django_record, 'recorded_at', None) if self._django_record else None
    
    @property
    def notes(self) -> str:
        """Record notes."""
        return getattr(self._django_record, 'notes', '') if self._django_record else ""
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        if not self._django_record:
            return {}
        
        return {
            'id': self.id,
            'session_id': self.session_id,
            'count_type': self.count_type,
            'count_value': self.count_value,
            'recorded_at': self.recorded_at.isoformat() if self.recorded_at else None,
            'notes': self.notes
        }
    
    def update(self, **kwargs) -> bool:
        """Update record fields."""
        if not self._django_record:
            return False
        
        updated_fields = []
        for field, value in kwargs.items():
            if hasattr(self._django_record, field):
                setattr(self._django_record, field, value)
                updated_fields.append(field)
        
        if updated_fields:
            self._django_record.save(update_fields=updated_fields)
            
            # Log update
            log_event("count_record.updated", {
                "record_id": self.id,
                "updated_fields": updated_fields
            })
            
            return True
        
        return False
    
    def delete(self) -> bool:
        """Delete record."""
        if not self._django_record:
            return False
        
        record_id = self.id
        session_id = self.session_id
        
        self._django_record.delete()
        
        # Log deletion
        log_event("count_record.deleted", {
            "record_id": record_id,
            "session_id": session_id
        })
        
        return True
    
    def __str__(self) -> str:
        """String representation."""
        return f"CountRecord({self.count_type}: {self.count_value})"
    
    def __repr__(self) -> str:
        """Detailed representation."""
        return f"CountRecordModel(id={self.id}, type='{self.count_type}', value={self.count_value})"
