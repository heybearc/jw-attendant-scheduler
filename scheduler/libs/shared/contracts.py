"""
Contract validation and API contract management.
Implements SDD Article IV: API/data contracts live under /contracts and drive tests.
"""

import json
import jsonschema
from typing import Dict, Any, Optional, List
from pathlib import Path
from django.conf import settings

class ContractValidator:
    """Validates data against JSON schemas and API contracts."""
    
    def __init__(self, contracts_dir: Optional[str] = None):
        """Initialize with contracts directory path."""
        self.contracts_dir = Path(contracts_dir or getattr(settings, 'CONTRACTS_DIR', 'contracts'))
    
    def load_schema(self, schema_name: str) -> Dict[str, Any]:
        """Load a JSON schema from the contracts directory."""
        schema_path = self.contracts_dir / f"{schema_name}.json"
        
        if not schema_path.exists():
            raise FileNotFoundError(f"Schema not found: {schema_path}")
        
        with open(schema_path, 'r') as f:
            return json.load(f)
    
    def validate_data(self, data: Dict[str, Any], schema_name: str) -> bool:
        """Validate data against a named schema."""
        schema = self.load_schema(schema_name)
        
        try:
            jsonschema.validate(data, schema)
            return True
        except jsonschema.ValidationError as e:
            raise ValueError(f"Data validation failed: {e.message}")
    
    def validate_api_request(self, data: Dict[str, Any], endpoint: str, method: str) -> bool:
        """Validate API request data against endpoint contract."""
        schema_name = f"{endpoint.replace('/', '_')}_{method.lower()}_request"
        return self.validate_data(data, schema_name)
    
    def validate_api_response(self, data: Dict[str, Any], endpoint: str, method: str) -> bool:
        """Validate API response data against endpoint contract."""
        schema_name = f"{endpoint.replace('/', '_')}_{method.lower()}_response"
        return self.validate_data(data, schema_name)

class APIContract:
    """Manages API contracts and provides validation helpers."""
    
    def __init__(self, contract_name: str):
        """Initialize with contract name."""
        self.contract_name = contract_name
        self.validator = ContractValidator()
    
    def validate_input(self, data: Dict[str, Any]) -> bool:
        """Validate input data against contract."""
        return self.validator.validate_data(data, f"{self.contract_name}_input")
    
    def validate_output(self, data: Dict[str, Any]) -> bool:
        """Validate output data against contract."""
        return self.validator.validate_data(data, f"{self.contract_name}_output")
    
    def get_example_input(self) -> Dict[str, Any]:
        """Get example input data from contract."""
        try:
            schema = self.validator.load_schema(f"{self.contract_name}_input")
            return schema.get('example', {})
        except FileNotFoundError:
            return {}
    
    def get_example_output(self) -> Dict[str, Any]:
        """Get example output data from contract."""
        try:
            schema = self.validator.load_schema(f"{self.contract_name}_output")
            return schema.get('example', {})
        except FileNotFoundError:
            return {}

# Contract decorators for automatic validation
def validate_contract(contract_name: str):
    """Decorator to validate function input/output against contracts."""
    def decorator(func):
        def wrapper(*args, **kwargs):
            contract = APIContract(contract_name)
            
            # Validate input if kwargs provided
            if kwargs:
                try:
                    contract.validate_input(kwargs)
                except ValueError as e:
                    raise ValueError(f"Input validation failed for {func.__name__}: {e}")
            
            # Execute function
            result = func(*args, **kwargs)
            
            # Validate output if it's a dict
            if isinstance(result, dict):
                try:
                    contract.validate_output(result)
                except ValueError as e:
                    raise ValueError(f"Output validation failed for {func.__name__}: {e}")
            
            return result
        return wrapper
    return decorator

# Common contract schemas
class CommonContracts:
    """Common contract schemas used across libraries."""
    
    COMMON_SCHEMAS = {
        'event_create': {
            'type': 'object',
            'properties': {
                'name': {'type': 'string', 'minLength': 1, 'maxLength': 200},
                'start_date': {'type': 'string', 'format': 'date'},
                'end_date': {'type': 'string', 'format': 'date'},
                'location': {'type': 'string', 'maxLength': 500},
                'status': {'type': 'string', 'enum': ['draft', 'active', 'completed', 'cancelled']}
            },
            'required': ['name', 'start_date', 'end_date']
        },
        
        'event_update': {
            'type': 'object',
            'properties': {
                'name': {'type': 'string', 'minLength': 1, 'maxLength': 200},
                'start_date': {'type': 'string', 'format': 'date'},
                'end_date': {'type': 'string', 'format': 'date'},
                'location': {'type': 'string', 'maxLength': 500},
                'status': {'type': 'string', 'enum': ['draft', 'active', 'completed', 'cancelled']}
            },
            'additionalProperties': False
        },
        
        'attendant_create': {
            'type': 'object',
            'properties': {
                'name': {'type': 'string', 'minLength': 1, 'maxLength': 100},
                'email': {'type': 'string', 'format': 'email'},
                'phone': {'type': 'string', 'maxLength': 20},
                'role': {'type': 'string', 'enum': ['attendant', 'overseer', 'coordinator']},
                'congregation': {'type': 'string', 'maxLength': 100},
                'active': {'type': 'boolean'}
            },
            'required': ['name', 'email']
        },
        
        'attendant_update': {
            'type': 'object',
            'properties': {
                'name': {'type': 'string', 'minLength': 1, 'maxLength': 100},
                'email': {'type': 'string', 'format': 'email'},
                'phone': {'type': 'string', 'maxLength': 20},
                'role': {'type': 'string', 'enum': ['attendant', 'overseer', 'coordinator']},
                'congregation': {'type': 'string', 'maxLength': 100},
                'active': {'type': 'boolean'}
            },
            'additionalProperties': False
        },
        
        'assignment_create': {
            'type': 'object',
            'properties': {
                'attendant_id': {'type': 'integer', 'minimum': 1},
                'position_id': {'type': 'integer', 'minimum': 1},
                'notes': {'type': 'string', 'maxLength': 500},
                'force': {'type': 'boolean'}
            },
            'required': ['attendant_id', 'position_id']
        },
        
        'count_session_create': {
            'type': 'object',
            'properties': {
                'event_id': {'type': 'integer', 'minimum': 1},
                'position_id': {'type': 'integer', 'minimum': 1},
                'notes': {'type': 'string', 'maxLength': 500},
                'force': {'type': 'boolean'}
            },
            'required': ['event_id', 'position_id']
        },
        
        'count_record': {
            'type': 'object',
            'properties': {
                'session_id': {'type': 'integer', 'minimum': 1},
                'count_type': {'type': 'string', 'minLength': 1, 'maxLength': 50},
                'count_value': {'type': 'integer', 'minimum': 0},
                'notes': {'type': 'string', 'maxLength': 500}
            },
            'required': ['session_id', 'count_type', 'count_value']
        },
        
        'bulk_count_records': {
            'type': 'object',
            'properties': {
                'records': {
                    'type': 'array',
                    'items': {
                        'type': 'object',
                        'properties': {
                            'count_type': {'type': 'string', 'minLength': 1, 'maxLength': 50},
                            'count_value': {'type': 'integer', 'minimum': 0},
                            'notes': {'type': 'string', 'maxLength': 500}
                        },
                        'required': ['count_type', 'count_value']
                    },
                    'minItems': 1,
                    'maxItems': 100
                }
            },
            'required': ['records']
        },
        
        'position_create': {
            'type': 'object',
            'properties': {
                'name': {'type': 'string', 'minLength': 1, 'maxLength': 100},
                'description': {'type': 'string', 'maxLength': 500},
                'requirements': {'type': 'string', 'maxLength': 500},
                'time_slot': {'type': 'string', 'maxLength': 50}
            },
            'required': ['name']
        }
    }
    
    @staticmethod
    def event_schema() -> Dict[str, Any]:
        """Event data contract schema."""
        return {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
                "name": {"type": "string", "minLength": 1},
                "start_date": {"type": "string", "format": "date"},
                "end_date": {"type": "string", "format": "date"},
                "location": {"type": "string"},
                "status": {"type": "string", "enum": ["draft", "active", "completed", "cancelled"]}
            },
            "required": ["name", "start_date", "end_date"],
            "additionalProperties": False
        }
    
    @staticmethod
    def attendant_schema() -> Dict[str, Any]:
        """Attendant data contract schema."""
        return {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
                "first_name": {"type": "string", "minLength": 1},
                "last_name": {"type": "string", "minLength": 1},
                "email": {"type": "string", "format": "email"},
                "phone": {"type": "string"},
                "status": {"type": "string", "enum": ["active", "inactive", "unavailable"]},
                "qualifications": {
                    "type": "array",
                    "items": {"type": "string"}
                }
            },
            "required": ["first_name", "last_name", "email"],
            "additionalProperties": False
        }
    
    @staticmethod
    def assignment_schema() -> Dict[str, Any]:
        """Assignment data contract schema."""
        return {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
                "event_id": {"type": "integer"},
                "attendant_id": {"type": "integer"},
                "position_id": {"type": "integer"},
                "shift_start": {"type": "string", "format": "time"},
                "shift_end": {"type": "string", "format": "time"},
                "status": {"type": "string", "enum": ["assigned", "confirmed", "completed", "cancelled"]}
            },
            "required": ["event_id", "attendant_id", "position_id"],
            "additionalProperties": False
        }
    
    @staticmethod
    def count_session_schema() -> Dict[str, Any]:
        """Count session data contract schema."""
        return {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
                "event_id": {"type": "integer"},
                "session_name": {"type": "string", "minLength": 1},
                "count_time": {"type": "string", "format": "date-time"},
                "is_complete": {"type": "boolean"},
                "notes": {"type": "string"}
            },
            "required": ["event_id", "session_name", "count_time"],
            "additionalProperties": False
        }
