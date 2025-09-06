"""
Count Tracking Services

Business logic and service layer for count tracking.
"""

from typing import Dict, Any, List, Optional
from datetime import date, datetime, timedelta
from ..shared.observability import log_event, monitor_performance
from ..shared.contracts import validate_contract
from .models import CountSessionModel, CountRecordModel

class CountTrackingService:
    """Service layer for count tracking operations."""
    
    @monitor_performance("count_session_create")
    @validate_contract("count_session_create")
    def create_count_session(self, event_id: int, position_id: int, **kwargs) -> Dict[str, Any]:
        """Create a new count session."""
        # Validate that event and position exist
        try:
            from scheduler.models import Event, Position
            
            event = Event.objects.get(id=event_id)
            position = Position.objects.get(id=position_id, event=event)
            
        except Exception as e:
            raise ValueError(f"Invalid event or position: {str(e)}")
        
        # Check for existing active session for this position
        existing_sessions = CountSessionModel.list_all(
            event_id=event_id,
            position_id=position_id,
            status='active'
        )
        
        if existing_sessions and not kwargs.get('force', False):
            raise ValueError(f"Active count session already exists for this position")
        
        # Create session
        session = CountSessionModel.create(
            event_id=event_id,
            position_id=position_id,
            **{k: v for k, v in kwargs.items() if k != 'force'}
        )
        
        return session.to_dict()
    
    @monitor_performance("count_session_get")
    def get_count_session(self, session_id: int) -> Dict[str, Any]:
        """Get count session by ID."""
        session = CountSessionModel.get_by_id(session_id)
        
        if not session:
            raise ValueError(f"Count session with ID {session_id} not found")
        
        result = session.to_dict()
        
        # Add count records and statistics
        result['count_records'] = session.get_count_records()
        result['total_count'] = session.get_total_count()
        result['records_count'] = len(result['count_records'])
        
        return result
    
    @monitor_performance("count_session_list")
    def list_count_sessions(self, **filters) -> List[Dict[str, Any]]:
        """List count sessions with optional filters."""
        sessions = CountSessionModel.list_all(**filters)
        
        result = []
        for session in sessions:
            session_data = session.to_dict()
            session_data['total_count'] = session.get_total_count()
            session_data['records_count'] = len(session.get_count_records())
            result.append(session_data)
        
        log_event("count_session.list_retrieved", {
            "count": len(result),
            "filters": filters
        })
        
        return result
    
    @monitor_performance("count_session_update")
    def update_count_session(self, session_id: int, **updates) -> Dict[str, Any]:
        """Update count session."""
        session = CountSessionModel.get_by_id(session_id)
        
        if not session:
            raise ValueError(f"Count session with ID {session_id} not found")
        
        # Handle datetime fields
        for field in ['start_time', 'end_time']:
            if field in updates and isinstance(updates[field], str):
                updates[field] = datetime.fromisoformat(updates[field])
        
        success = session.update(**updates)
        
        if not success:
            raise ValueError("Failed to update count session")
        
        return session.to_dict()
    
    @monitor_performance("count_session_delete")
    def delete_count_session(self, session_id: int) -> bool:
        """Delete count session."""
        session = CountSessionModel.get_by_id(session_id)
        
        if not session:
            raise ValueError(f"Count session with ID {session_id} not found")
        
        # Check if session has count records
        records = session.get_count_records()
        if records:
            raise ValueError(f"Cannot delete session with {len(records)} count records")
        
        return session.delete()
    
    @monitor_performance("count_record")
    @validate_contract("count_record")
    def record_count(self, session_id: int, count_type: str, count_value: int, **kwargs) -> Dict[str, Any]:
        """Record a count entry."""
        # Validate session exists and is active
        session = CountSessionModel.get_by_id(session_id)
        
        if not session:
            raise ValueError(f"Count session with ID {session_id} not found")
        
        if session.status != 'active':
            raise ValueError(f"Cannot record count for {session.status} session")
        
        # Validate count value
        if count_value < 0:
            raise ValueError("Count value cannot be negative")
        
        # Create count record
        record = CountRecordModel.create(
            session_id=session_id,
            count_type=count_type,
            count_value=count_value,
            **kwargs
        )
        
        return record.to_dict()
    
    @monitor_performance("count_record_update")
    def update_count_record(self, record_id: int, **updates) -> Dict[str, Any]:
        """Update count record."""
        record = CountRecordModel.get_by_id(record_id)
        
        if not record:
            raise ValueError(f"Count record with ID {record_id} not found")
        
        # Validate count value if being updated
        if 'count_value' in updates and updates['count_value'] < 0:
            raise ValueError("Count value cannot be negative")
        
        success = record.update(**updates)
        
        if not success:
            raise ValueError("Failed to update count record")
        
        return record.to_dict()
    
    @monitor_performance("count_record_delete")
    def delete_count_record(self, record_id: int) -> bool:
        """Delete count record."""
        record = CountRecordModel.get_by_id(record_id)
        
        if not record:
            raise ValueError(f"Count record with ID {record_id} not found")
        
        return record.delete()
    
    def start_count_session(self, session_id: int) -> Dict[str, Any]:
        """Start a count session (mark as active)."""
        session = CountSessionModel.get_by_id(session_id)
        
        if not session:
            raise ValueError(f"Count session with ID {session_id} not found")
        
        if session.status != 'pending':
            raise ValueError(f"Cannot start {session.status} session")
        
        success = session.start_session()
        
        if not success:
            raise ValueError("Failed to start count session")
        
        log_event("count_session.started", {
            "session_id": session_id,
            "event_id": session.event_id,
            "position_id": session.position_id
        })
        
        return session.to_dict()
    
    def end_count_session(self, session_id: int) -> Dict[str, Any]:
        """End a count session (mark as completed)."""
        session = CountSessionModel.get_by_id(session_id)
        
        if not session:
            raise ValueError(f"Count session with ID {session_id} not found")
        
        if session.status != 'active':
            raise ValueError(f"Cannot end {session.status} session")
        
        success = session.end_session()
        
        if not success:
            raise ValueError("Failed to end count session")
        
        # Get final statistics
        result = session.to_dict()
        result['final_count'] = session.get_total_count()
        result['total_records'] = len(session.get_count_records())
        
        log_event("count_session.ended", {
            "session_id": session_id,
            "final_count": result['final_count'],
            "total_records": result['total_records']
        })
        
        return result
    
    def get_active_sessions(self, event_id: int = None) -> List[Dict[str, Any]]:
        """Get currently active count sessions."""
        filters = {'status': 'active'}
        if event_id:
            filters['event_id'] = event_id
        
        return self.list_count_sessions(**filters)
    
    def get_session_summary(self, session_id: int) -> Dict[str, Any]:
        """Get summary statistics for a count session."""
        session = CountSessionModel.get_by_id(session_id)
        
        if not session:
            raise ValueError(f"Count session with ID {session_id} not found")
        
        records = session.get_count_records()
        
        # Calculate statistics
        total_count = sum(record['count_value'] for record in records)
        count_by_type = {}
        
        for record in records:
            count_type = record['count_type']
            if count_type not in count_by_type:
                count_by_type[count_type] = {'count': 0, 'records': 0}
            count_by_type[count_type]['count'] += record['count_value']
            count_by_type[count_type]['records'] += 1
        
        # Calculate duration if session is completed
        duration_minutes = None
        if session.start_time and session.end_time:
            duration = session.end_time - session.start_time
            duration_minutes = duration.total_seconds() / 60
        
        summary = {
            'session': session.to_dict(),
            'total_count': total_count,
            'total_records': len(records),
            'count_by_type': count_by_type,
            'duration_minutes': duration_minutes,
            'records': records
        }
        
        log_event("count_session.summary_retrieved", {
            "session_id": session_id,
            "total_count": total_count,
            "total_records": len(records)
        })
        
        return summary
    
    def get_event_count_summary(self, event_id: int) -> Dict[str, Any]:
        """Get count summary for an entire event."""
        sessions = CountSessionModel.list_all(event_id=event_id)
        
        if not sessions:
            return {
                'event_id': event_id,
                'total_sessions': 0,
                'total_count': 0,
                'sessions_by_status': {},
                'count_by_position': {},
                'sessions': []
            }
        
        # Aggregate statistics
        total_count = 0
        sessions_by_status = {}
        count_by_position = {}
        session_summaries = []
        
        for session in sessions:
            session_data = session.to_dict()
            session_count = session.get_total_count()
            
            total_count += session_count
            
            # Count by status
            status = session.status
            if status not in sessions_by_status:
                sessions_by_status[status] = 0
            sessions_by_status[status] += 1
            
            # Count by position
            position_name = session_data.get('position_name', f'Position {session.position_id}')
            if position_name not in count_by_position:
                count_by_position[position_name] = {'sessions': 0, 'total_count': 0}
            count_by_position[position_name]['sessions'] += 1
            count_by_position[position_name]['total_count'] += session_count
            
            # Add to summaries
            session_data['session_count'] = session_count
            session_summaries.append(session_data)
        
        summary = {
            'event_id': event_id,
            'total_sessions': len(sessions),
            'total_count': total_count,
            'sessions_by_status': sessions_by_status,
            'count_by_position': count_by_position,
            'sessions': session_summaries
        }
        
        log_event("event_count.summary_retrieved", {
            "event_id": event_id,
            "total_sessions": len(sessions),
            "total_count": total_count
        })
        
        return summary
    
    def get_count_trends(self, event_id: int, **filters) -> Dict[str, Any]:
        """Get count trends and analytics."""
        sessions = CountSessionModel.list_all(event_id=event_id, **filters)
        
        if not sessions:
            return {
                'event_id': event_id,
                'trends': [],
                'analytics': {
                    'average_count_per_session': 0,
                    'peak_count_session': None,
                    'total_duration_minutes': 0
                }
            }
        
        trends = []
        total_count = 0
        total_duration = 0
        peak_session = None
        peak_count = 0
        
        for session in sessions:
            session_count = session.get_total_count()
            total_count += session_count
            
            # Calculate duration
            duration = 0
            if session.start_time and session.end_time:
                duration = (session.end_time - session.start_time).total_seconds() / 60
                total_duration += duration
            
            # Track peak session
            if session_count > peak_count:
                peak_count = session_count
                peak_session = {
                    'session_id': session.id,
                    'count': session_count,
                    'position_name': session.to_dict().get('position_name', f'Position {session.position_id}')
                }
            
            trends.append({
                'session_id': session.id,
                'position_id': session.position_id,
                'position_name': session.to_dict().get('position_name', f'Position {session.position_id}'),
                'count': session_count,
                'duration_minutes': duration,
                'status': session.status,
                'start_time': session.start_time.isoformat() if session.start_time else None
            })
        
        # Sort trends by start time
        trends.sort(key=lambda x: x['start_time'] or '9999-12-31')
        
        analytics = {
            'average_count_per_session': total_count / len(sessions) if sessions else 0,
            'peak_count_session': peak_session,
            'total_duration_minutes': total_duration,
            'average_duration_minutes': total_duration / len(sessions) if sessions else 0
        }
        
        return {
            'event_id': event_id,
            'trends': trends,
            'analytics': analytics
        }
    
    def bulk_record_counts(self, session_id: int, count_records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Record multiple counts in bulk."""
        # Validate session
        session = CountSessionModel.get_by_id(session_id)
        
        if not session:
            raise ValueError(f"Count session with ID {session_id} not found")
        
        if session.status != 'active':
            raise ValueError(f"Cannot record counts for {session.status} session")
        
        created_records = []
        errors = []
        
        for i, record_data in enumerate(count_records):
            try:
                # Validate required fields
                if 'count_type' not in record_data or 'count_value' not in record_data:
                    raise ValueError("count_type and count_value are required")
                
                record = CountRecordModel.create(
                    session_id=session_id,
                    count_type=record_data['count_type'],
                    count_value=record_data['count_value'],
                    notes=record_data.get('notes', '')
                )
                
                created_records.append(record.to_dict())
                
            except Exception as e:
                errors.append(f"Record {i}: {str(e)}")
        
        log_event("count_records.bulk_created", {
            "session_id": session_id,
            "total_records": len(count_records),
            "created_count": len(created_records),
            "errors_count": len(errors)
        })
        
        return {
            'session_id': session_id,
            'total_submitted': len(count_records),
            'created_count': len(created_records),
            'errors_count': len(errors),
            'created_records': created_records,
            'errors': errors
        }
    
    def export_count_data(self, event_id: int, format: str = 'json') -> Dict[str, Any]:
        """Export count data for an event."""
        if format not in ['json', 'csv']:
            raise ValueError("Format must be 'json' or 'csv'")
        
        # Get event summary
        event_summary = self.get_event_count_summary(event_id)
        
        if format == 'json':
            return {
                'format': 'json',
                'event_id': event_id,
                'exported_at': datetime.now().isoformat(),
                'data': event_summary
            }
        
        # CSV format - flatten the data
        csv_data = []
        for session_data in event_summary['sessions']:
            session = CountSessionModel.get_by_id(session_data['id'])
            if session:
                records = session.get_count_records()
                for record in records:
                    csv_data.append({
                        'session_id': session_data['id'],
                        'position_name': session_data.get('position_name', ''),
                        'count_type': record['count_type'],
                        'count_value': record['count_value'],
                        'recorded_at': record['recorded_at'],
                        'notes': record['notes']
                    })
        
        return {
            'format': 'csv',
            'event_id': event_id,
            'exported_at': datetime.now().isoformat(),
            'headers': ['session_id', 'position_name', 'count_type', 'count_value', 'recorded_at', 'notes'],
            'data': csv_data
        }
