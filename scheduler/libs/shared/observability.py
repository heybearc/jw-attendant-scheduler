"""
Observability framework for JW Attendant Scheduler.
Implements SDD Article V: log_event(event, attrs) required on key flows.
"""

import json
import logging
import time
from datetime import datetime
from typing import Dict, Any, Optional
from django.conf import settings

# Configure structured logging
def get_logger(name: str) -> logging.Logger:
    """Get a structured logger for the given name."""
    logger = logging.getLogger(f"jw_scheduler.{name}")
    
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(getattr(settings, 'LOG_LEVEL', logging.INFO))
    
    return logger

def log_event(event: str, attrs: Dict[str, Any], level: str = "info") -> None:
    """
    Log a structured event with attributes.
    
    Args:
        event: Event name (e.g., "attendant.assigned", "count.session_created")
        attrs: Event attributes as key-value pairs
        level: Log level (debug, info, warning, error, critical)
    """
    logger = get_logger("events")
    
    # Create structured log entry
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "event": event,
        "attributes": attrs,
        "source": "jw_scheduler"
    }
    
    # Add request context if available
    try:
        from django.core.context_processors import request
        if hasattr(request, 'user') and request.user.is_authenticated:
            log_entry["user_id"] = request.user.id
            log_entry["username"] = request.user.username
    except:
        pass
    
    # Log at appropriate level
    log_message = json.dumps(log_entry, separators=(',', ':'))
    
    if level == "debug":
        logger.debug(log_message)
    elif level == "info":
        logger.info(log_message)
    elif level == "warning":
        logger.warning(log_message)
    elif level == "error":
        logger.error(log_message)
    elif level == "critical":
        logger.critical(log_message)
    else:
        logger.info(log_message)

# Event logging helpers for common business events
class EventLogger:
    """Helper class for logging common business events."""
    
    @staticmethod
    def attendant_assigned(event_id: int, attendant_id: int, position_id: int, algorithm: str = "manual"):
        """Log attendant assignment event."""
        log_event("attendant.assigned", {
            "event_id": event_id,
            "attendant_id": attendant_id,
            "position_id": position_id,
            "algorithm": algorithm
        })
    
    @staticmethod
    def attendant_unassigned(event_id: int, attendant_id: int, position_id: int, reason: str = "manual"):
        """Log attendant unassignment event."""
        log_event("attendant.unassigned", {
            "event_id": event_id,
            "attendant_id": attendant_id,
            "position_id": position_id,
            "reason": reason
        })
    
    @staticmethod
    def event_created(event_id: int, event_name: str, created_by: int):
        """Log event creation."""
        log_event("event.created", {
            "event_id": event_id,
            "event_name": event_name,
            "created_by": created_by
        })
    
    @staticmethod
    def count_session_created(event_id: int, session_id: int, session_name: str, created_by: int):
        """Log count session creation."""
        log_event("count.session_created", {
            "event_id": event_id,
            "session_id": session_id,
            "session_name": session_name,
            "created_by": created_by
        })
    
    @staticmethod
    def count_entered(session_id: int, position_id: int, count: int, entered_by: int):
        """Log count entry."""
        log_event("count.entered", {
            "session_id": session_id,
            "position_id": position_id,
            "count": count,
            "entered_by": entered_by
        })
    
    @staticmethod
    def auto_assign_executed(event_id: int, algorithm: str, assignments_made: int, duration_ms: int):
        """Log auto-assignment execution."""
        log_event("auto_assign.executed", {
            "event_id": event_id,
            "algorithm": algorithm,
            "assignments_made": assignments_made,
            "duration_ms": duration_ms
        })
    
    @staticmethod
    def user_login(user_id: int, username: str, role: str):
        """Log user login."""
        log_event("user.login", {
            "user_id": user_id,
            "username": username,
            "role": role
        })
    
    @staticmethod
    def oversight_report_generated(event_id: int, report_type: str, generated_by: int):
        """Log oversight report generation."""
        log_event("oversight.report_generated", {
            "event_id": event_id,
            "report_type": report_type,
            "generated_by": generated_by
        })

# Performance monitoring decorator
def monitor_performance(event_name: str):
    """Decorator to monitor function performance."""
    def decorator(func):
        def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                duration_ms = int((time.time() - start_time) * 1000)
                log_event(f"performance.{event_name}", {
                    "function": func.__name__,
                    "duration_ms": duration_ms,
                    "status": "success"
                })
                return result
            except Exception as e:
                duration_ms = int((time.time() - start_time) * 1000)
                log_event(f"performance.{event_name}", {
                    "function": func.__name__,
                    "duration_ms": duration_ms,
                    "status": "error",
                    "error": str(e)
                }, level="error")
                raise
        return wrapper
    return decorator
