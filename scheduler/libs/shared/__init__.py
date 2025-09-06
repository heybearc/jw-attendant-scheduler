"""
Shared Utilities Package

Common utilities and frameworks used across all libraries.
"""

# Import from modules (not packages)
try:
    from .observability import log_event, monitor_performance, EventLogger
except ImportError:
    # Fallback implementations for testing
    def log_event(event_type, data=None):
        pass
    def monitor_performance(operation_name):
        def decorator(func):
            return func
        return decorator
    class EventLogger:
        @staticmethod
        def event_created(*args, **kwargs):
            pass
        @staticmethod
        def attendant_created(*args, **kwargs):
            pass
        @staticmethod
        def count_session_created(*args, **kwargs):
            pass

try:
    from .contracts import validate_contract, CommonContracts
except ImportError:
    # Fallback implementations for testing
    def validate_contract(contract_name):
        def decorator(func):
            return func
        return decorator
    class CommonContracts:
        COMMON_SCHEMAS = {}

try:
    from .cli_base import CLICommand, BaseCLI, JSONInputMixin, TextOutputMixin
except ImportError:
    # Fallback implementations for testing
    class CLICommand:
        def __init__(self, name, description):
            self.name = name
            self.description = description
    class BaseCLI:
        pass
    class JSONInputMixin:
        pass
    class TextOutputMixin:
        pass

__all__ = [
    "log_event", 
    "monitor_performance", 
    "EventLogger",
    "validate_contract", 
    "CommonContracts",
    "CLICommand", 
    "BaseCLI", 
    "JSONInputMixin", 
    "TextOutputMixin"
]
