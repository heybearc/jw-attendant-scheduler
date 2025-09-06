"""
Base CLI framework for JW Attendant Scheduler libraries.
Implements SDD Article II: Libraries expose a CLI; text-in/text-out; JSON supported.
"""

import json
import sys
import argparse
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Union
from django.core.management.base import BaseCommand, CommandError
from .observability import log_event, get_logger
from .contracts import ContractValidator

class CLICommand(ABC):
    """Abstract base class for CLI commands."""
    
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.logger = get_logger(f"cli.{name}")
    
    @abstractmethod
    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        """Add command-specific arguments to the parser."""
        pass
    
    @abstractmethod
    def execute(self, **kwargs) -> Dict[str, Any]:
        """Execute the command and return results."""
        pass
    
    def validate_input(self, data: Dict[str, Any]) -> bool:
        """Validate input data if contract exists."""
        try:
            validator = ContractValidator()
            return validator.validate_data(data, f"{self.name}_input")
        except FileNotFoundError:
            # No contract exists, skip validation
            return True
    
    def format_output(self, data: Dict[str, Any], format_type: str = "json") -> str:
        """Format output data as JSON or text."""
        if format_type == "json":
            return json.dumps(data, indent=2, default=str)
        elif format_type == "text":
            return self._format_as_text(data)
        else:
            raise ValueError(f"Unsupported format: {format_type}")
    
    def _format_as_text(self, data: Dict[str, Any]) -> str:
        """Format data as human-readable text."""
        if isinstance(data, dict):
            lines = []
            for key, value in data.items():
                if isinstance(value, (dict, list)):
                    lines.append(f"{key}:")
                    lines.append(self._indent_text(self._format_as_text(value)))
                else:
                    lines.append(f"{key}: {value}")
            return "\n".join(lines)
        elif isinstance(data, list):
            return "\n".join(str(item) for item in data)
        else:
            return str(data)
    
    def _indent_text(self, text: str, indent: str = "  ") -> str:
        """Indent text lines."""
        return "\n".join(f"{indent}{line}" for line in text.split("\n"))

class BaseCLI(BaseCommand):
    """Base Django management command for library CLI interfaces."""
    
    help = "Base CLI for JW Attendant Scheduler libraries"
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.commands: Dict[str, CLICommand] = {}
        self.logger = get_logger("cli.base")
    
    def add_command(self, command: CLICommand) -> None:
        """Add a CLI command to this interface."""
        self.commands[command.name] = command
    
    def add_arguments(self, parser):
        """Add arguments for the CLI interface."""
        parser.add_argument(
            'command',
            help='Command to execute',
            choices=list(self.commands.keys())
        )
        parser.add_argument(
            '--format',
            choices=['json', 'text'],
            default='json',
            help='Output format (default: json)'
        )
        parser.add_argument(
            '--input-file',
            help='Read input from JSON file'
        )
        parser.add_argument(
            '--output-file',
            help='Write output to file'
        )
        parser.add_argument(
            '--data',
            help='Input data as JSON string'
        )
        
        # Add subparsers for each command
        subparsers = parser.add_subparsers(dest='command', help='Available commands')
        
        for command_name, command in self.commands.items():
            subparser = subparsers.add_parser(command_name, help=command.description)
            command.add_arguments(subparser)
    
    def handle(self, *args, **options):
        """Handle CLI command execution."""
        command_name = options.get('command')
        
        if not command_name or command_name not in self.commands:
            self.print_help('manage.py', self.prog_name)
            return
        
        command = self.commands[command_name]
        
        try:
            # Prepare input data
            input_data = self._prepare_input_data(options)
            
            # Log command execution
            log_event("cli.command_executed", {
                "command": command_name,
                "input_size": len(str(input_data))
            })
            
            # Execute command
            result = command.execute(**input_data)
            
            # Format and output result
            output_format = options.get('format', 'json')
            formatted_output = command.format_output(result, output_format)
            
            # Write to file or stdout
            output_file = options.get('output_file')
            if output_file:
                with open(output_file, 'w') as f:
                    f.write(formatted_output)
                self.stdout.write(f"Output written to {output_file}")
            else:
                self.stdout.write(formatted_output)
            
            # Log success
            log_event("cli.command_completed", {
                "command": command_name,
                "status": "success",
                "output_size": len(formatted_output)
            })
            
        except Exception as e:
            # Log error
            log_event("cli.command_failed", {
                "command": command_name,
                "error": str(e)
            }, level="error")
            
            raise CommandError(f"Command failed: {str(e)}")
    
    def _prepare_input_data(self, options: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare input data from various sources."""
        input_data = {}
        
        # Read from input file
        input_file = options.get('input_file')
        if input_file:
            with open(input_file, 'r') as f:
                file_data = json.load(f)
                input_data.update(file_data)
        
        # Read from data argument
        data_arg = options.get('data')
        if data_arg:
            try:
                json_data = json.loads(data_arg)
                input_data.update(json_data)
            except json.JSONDecodeError as e:
                raise CommandError(f"Invalid JSON in --data argument: {e}")
        
        # Add other command-line options
        for key, value in options.items():
            if key not in ['command', 'format', 'input_file', 'output_file', 'data'] and value is not None:
                input_data[key] = value
        
        return input_data

class JSONInputMixin:
    """Mixin for commands that accept JSON input."""
    
    def add_json_arguments(self, parser: argparse.ArgumentParser) -> None:
        """Add standard JSON input arguments."""
        parser.add_argument(
            '--json-input',
            help='Input data as JSON string'
        )
        parser.add_argument(
            '--json-file',
            help='Read input from JSON file'
        )
    
    def get_json_input(self, options: Dict[str, Any]) -> Dict[str, Any]:
        """Get JSON input from arguments."""
        json_data = {}
        
        # From file
        json_file = options.get('json_file')
        if json_file:
            with open(json_file, 'r') as f:
                json_data.update(json.load(f))
        
        # From argument
        json_input = options.get('json_input')
        if json_input:
            json_data.update(json.loads(json_input))
        
        return json_data

class TextOutputMixin:
    """Mixin for commands that provide text output formatting."""
    
    def format_table(self, data: List[Dict[str, Any]], headers: Optional[List[str]] = None) -> str:
        """Format data as a text table."""
        if not data:
            return "No data available"
        
        if not headers:
            headers = list(data[0].keys())
        
        # Calculate column widths
        widths = {}
        for header in headers:
            widths[header] = len(header)
            for row in data:
                value = str(row.get(header, ''))
                widths[header] = max(widths[header], len(value))
        
        # Format header
        header_line = " | ".join(h.ljust(widths[h]) for h in headers)
        separator = "-" * len(header_line)
        
        # Format rows
        rows = []
        for row in data:
            row_line = " | ".join(str(row.get(h, '')).ljust(widths[h]) for h in headers)
            rows.append(row_line)
        
        return "\n".join([header_line, separator] + rows)
    
    def format_list(self, items: List[Any], bullet: str = "•") -> str:
        """Format items as a bulleted list."""
        return "\n".join(f"{bullet} {item}" for item in items)
    
    def format_key_value(self, data: Dict[str, Any], separator: str = ": ") -> str:
        """Format dictionary as key-value pairs."""
        return "\n".join(f"{key}{separator}{value}" for key, value in data.items())
