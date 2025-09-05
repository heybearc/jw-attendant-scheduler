# Quality Assurance Agent - JW Attendant Scheduler

## Agent Responsibilities
Command validation, syntax checking, auto-correction, and error prevention for multi-agent operations.

## Current Focus Areas

### 1. Command Syntax Validation
**Priority:** High
**Location:** All agent command execution
**Requirements:**
- Pre-validate shell commands for syntax errors
- Auto-correct common shell escaping issues
- Prevent command execution failures
- Provide safe fallback commands

### 2. Multi-Agent Error Detection
**Priority:** High
**Location:** Cross-agent communication
**Requirements:**
- Monitor agent command outputs for errors
- Detect and correct f-string syntax issues
- Validate SQL query syntax
- Check file path validity

### 3. Automated Error Recovery
**Priority:** Medium
**Location:** System-wide error handling
**Requirements:**
- Auto-retry failed commands with corrections
- Suggest alternative approaches
- Log error patterns for prevention
- Maintain error recovery database

## Current Tasks

### Phase 1: Command Validation System
- [x] Create QA Agent specification
- [ ] Implement command syntax validator
- [ ] Create shell escaping auto-corrector
- [ ] Add f-string syntax checker
- [ ] Test validation system

### Phase 2: Error Detection Framework
- [ ] Monitor agent command execution
- [ ] Detect common error patterns
- [ ] Implement auto-correction rules
- [ ] Create error recovery procedures
- [ ] Add logging and metrics

### Phase 3: Proactive Prevention
- [ ] Build command safety database
- [ ] Create syntax validation API
- [ ] Implement pre-execution checks
- [ ] Add agent command linting
- [ ] Create error prevention guidelines

## Technical Specifications

### Command Validation Rules
```python
# Shell Command Validation
def validate_shell_command(cmd: str) -> tuple[bool, str]:
    """Validate and auto-correct shell commands"""
    
    # Check for unescaped quotes in f-strings
    if "f\"" in cmd and "\\'" in cmd:
        cmd = fix_fstring_escaping(cmd)
    
    # Validate parentheses matching
    if not check_parentheses_balance(cmd):
        return False, "Unmatched parentheses"
    
    # Check for dangerous patterns
    dangerous = ['rm -rf', 'dd if=', '> /dev/']
    if any(pattern in cmd for pattern in dangerous):
        return False, "Potentially dangerous command"
    
    return True, cmd

def fix_fstring_escaping(cmd: str) -> str:
    """Auto-correct f-string escaping issues"""
    # Replace \' with \" in f-strings
    # Handle nested quotes properly
    # Escape shell metacharacters
    return corrected_cmd
```

### Error Pattern Database
```yaml
common_errors:
  - pattern: "f-string: invalid syntax"
    solution: "escape_quotes"
    auto_fix: true
  
  - pattern: "zsh: parse error near"
    solution: "validate_shell_syntax"
    auto_fix: true
    
  - pattern: "relation .* does not exist"
    solution: "run_migrations"
    auto_fix: false
```

## Integration Points
- **All Agents**: Command validation before execution
- **DevOps Agent**: Infrastructure command safety
- **Backend Agent**: SQL query validation
- **Testing Agent**: Test command syntax checking
- **Lead Architect**: Error pattern coordination

## Success Metrics
- Command failure rate < 5%
- Auto-correction success rate > 90%
- Zero syntax errors in production
- Reduced debugging time by 50%
- Proactive error prevention rate > 80%
