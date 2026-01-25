# Debug Mode Documentation

## Overview

TheoShift includes a comprehensive debug logging system to help troubleshoot issues quickly without modifying code. Debug mode can be enabled via environment variables and provides detailed logging across different contexts.

---

## Quick Start

### Enable Debug Mode on STANDBY

```bash
# SSH to STANDBY container
ssh blue-theoshift

# Edit .env file
cd /opt/theoshift
nano .env

# Add these lines:
DEBUG_ENABLED=true
DEBUG_LEVEL=DEBUG
DEBUG_CONTEXTS=*
DEBUG_LOG_TO_FILE=true
DEBUG_LOG_PATH=/tmp/theoshift-debug.log

# Restart the application
pm2 restart theoshift-blue

# Tail the debug log
tail -f /tmp/theoshift-debug.log
```

---

## Environment Variables

### DEBUG_ENABLED
- **Type:** `boolean`
- **Default:** `false`
- **Description:** Master switch to enable/disable debug logging
- **Example:** `DEBUG_ENABLED=true`

### DEBUG_LEVEL
- **Type:** `ERROR | WARN | INFO | DEBUG | TRACE`
- **Default:** `INFO`
- **Description:** Minimum log level to output
- **Levels:**
  - `ERROR` (0): Only critical errors
  - `WARN` (1): Warnings and errors
  - `INFO` (2): General information, warnings, and errors
  - `DEBUG` (3): Detailed debugging information
  - `TRACE` (4): Very verbose tracing (includes all)
- **Example:** `DEBUG_LEVEL=DEBUG`

### DEBUG_CONTEXTS
- **Type:** `string` (comma-separated or `*`)
- **Default:** `*`
- **Description:** Which contexts to log
- **Available Contexts:**
  - `API` - API endpoint requests/responses
  - `DATABASE` - Database operations
  - `AUTH` - Authentication and authorization
  - `EMAIL` - Email sending operations
  - `EVENTS` - Event-related operations
  - `ASSIGNMENTS` - Assignment operations
  - `PRISMA` - Prisma ORM queries
  - `GENERAL` - General application logs
- **Examples:**
  - `DEBUG_CONTEXTS=*` (all contexts)
  - `DEBUG_CONTEXTS=API,DATABASE` (only API and database)
  - `DEBUG_CONTEXTS=PRISMA,EVENTS` (only Prisma and events)

### DEBUG_LOG_TO_FILE
- **Type:** `boolean`
- **Default:** `false`
- **Description:** Write logs to file in addition to console
- **Example:** `DEBUG_LOG_TO_FILE=true`

### DEBUG_LOG_PATH
- **Type:** `string`
- **Default:** `/tmp/theoshift-debug.log`
- **Description:** Path to debug log file
- **Example:** `DEBUG_LOG_PATH=/var/log/theoshift/debug.log`

### DEBUG_INCLUDE_TIMESTAMP
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Include timestamp in log messages
- **Example:** `DEBUG_INCLUDE_TIMESTAMP=true`

### DEBUG_INCLUDE_STACK
- **Type:** `boolean`
- **Default:** `false`
- **Description:** Include stack traces for ERROR level logs
- **Example:** `DEBUG_INCLUDE_STACK=true`

---

## Usage in Code

### Import the Debug Logger

```typescript
import { debug, DebugContext } from '@/lib/debug'
```

### Basic Logging

```typescript
// Error logging
debug.error(DebugContext.API, 'Failed to fetch user', { userId, error })

// Warning
debug.warn(DebugContext.DATABASE, 'Slow query detected', { duration: 5000 })

// Info
debug.info(DebugContext.EVENTS, 'Event created successfully', { eventId })

// Debug
debug.debug(DebugContext.PRISMA, 'Query executed', { query, params })

// Trace (very verbose)
debug.trace(DebugContext.GENERAL, 'Function entry', { args })
```

### Convenience Methods

```typescript
// Log Prisma queries
debug.prismaQuery('findUnique', 'events', { where: { id: eventId } })

// Log API requests
debug.apiRequest('POST', '/api/assignments', { userId, positionId })

// Log database operations
debug.dbOperation('Migration applied', { migration: '20260125_phase_4c' })
```

---

## Common Debugging Scenarios

### Debugging Event Selection 404 Errors

```bash
# Enable debug mode with focus on events and Prisma
DEBUG_ENABLED=true
DEBUG_LEVEL=DEBUG
DEBUG_CONTEXTS=EVENTS,PRISMA,DATABASE
DEBUG_LOG_TO_FILE=true
DEBUG_LOG_PATH=/tmp/event-debug.log

# Restart and test
pm2 restart theoshift-blue

# Try to select an event, then check logs
tail -100 /tmp/event-debug.log
```

### Debugging Prisma Schema Issues

```bash
# Enable Prisma-specific debugging
DEBUG_ENABLED=true
DEBUG_LEVEL=TRACE
DEBUG_CONTEXTS=PRISMA
DEBUG_INCLUDE_STACK=true

# This will show all Prisma queries with full details
```

### Debugging API Endpoint Issues

```bash
# Enable API debugging
DEBUG_ENABLED=true
DEBUG_LEVEL=DEBUG
DEBUG_CONTEXTS=API,AUTH
DEBUG_LOG_TO_FILE=true

# Shows all API requests, responses, and auth checks
```

### Debugging Email Sending

```bash
# Enable email debugging
DEBUG_ENABLED=true
DEBUG_LEVEL=DEBUG
DEBUG_CONTEXTS=EMAIL
DEBUG_LOG_TO_FILE=true
DEBUG_LOG_PATH=/tmp/email-debug.log
```

---

## Example Debug Output

### With Timestamps and Context

```
[2026-01-25T23:45:12.345Z] [DEBUG] [PRISMA] findUnique on events
{
  "where": {
    "id": "0ee35484-ba40-4d17-ba1b-f797a59ca77d"
  },
  "include": {
    "positions": true,
    "assignments": true
  }
}

[2026-01-25T23:45:12.567Z] [ERROR] [DATABASE] Query failed
{
  "error": "Unknown field 'childEvents' for include statement",
  "model": "events",
  "operation": "findUnique"
}
Stack trace:
Error: Unknown field 'childEvents'
    at prisma.events.findUnique (/opt/theoshift/pages/events/[id]/index.tsx:987)
    ...
```

---

## Best Practices

### 1. Use Appropriate Log Levels
- `ERROR`: Only for actual errors that need attention
- `WARN`: For potential issues or deprecated usage
- `INFO`: For important state changes or milestones
- `DEBUG`: For detailed debugging during development
- `TRACE`: For very verbose logging (use sparingly)

### 2. Include Relevant Context
```typescript
// Good - includes context
debug.error(DebugContext.API, 'Failed to create assignment', {
  userId,
  positionId,
  eventId,
  error: error.message
})

// Bad - no context
debug.error(DebugContext.API, 'Failed')
```

### 3. Use Specific Contexts
```typescript
// Good - specific context
debug.info(DebugContext.ASSIGNMENTS, 'Assignment created', { assignmentId })

// Less useful - generic context
debug.info(DebugContext.GENERAL, 'Something happened')
```

### 4. Clean Up Debug Logs
- Don't commit code with `DEBUG_ENABLED=true` in production `.env`
- Remove excessive debug statements after fixing issues
- Use debug logging strategically, not everywhere

### 5. Disable in Production
Debug mode should be disabled in production (LIVE) by default:
```bash
# Production .env
DEBUG_ENABLED=false
```

Only enable temporarily when troubleshooting production issues.

---

## Integration with Existing Code

### Example: Event Detail Page

```typescript
// pages/events/[id]/index.tsx
import { debug, DebugContext } from '@/lib/debug'

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.query
  
  debug.info(DebugContext.EVENTS, 'Fetching event details', { eventId: id })
  
  try {
    debug.prismaQuery('findUnique', 'events', { where: { id } })
    
    const event = await prisma.events.findUnique({
      where: { id: id as string },
      include: {
        positions: true,
        assignments: true
      }
    })
    
    if (!event) {
      debug.warn(DebugContext.EVENTS, 'Event not found', { eventId: id })
      return { notFound: true }
    }
    
    debug.info(DebugContext.EVENTS, 'Event fetched successfully', { 
      eventId: id,
      positionCount: event.positions.length 
    })
    
    return { props: { event } }
  } catch (error) {
    debug.error(DebugContext.EVENTS, 'Failed to fetch event', {
      eventId: id,
      error: error.message,
      stack: error.stack
    })
    return { notFound: true }
  }
}
```

---

## Troubleshooting Debug Mode

### Debug Logs Not Appearing

1. **Check if debug is enabled:**
   ```bash
   cat /opt/theoshift/.env | grep DEBUG
   ```

2. **Verify environment variables are loaded:**
   ```bash
   pm2 restart theoshift-blue --update-env
   ```

3. **Check file permissions:**
   ```bash
   ls -la /tmp/theoshift-debug.log
   ```

### Too Many Logs

1. **Reduce log level:**
   ```bash
   DEBUG_LEVEL=INFO  # Instead of DEBUG or TRACE
   ```

2. **Limit contexts:**
   ```bash
   DEBUG_CONTEXTS=EVENTS,PRISMA  # Instead of *
   ```

### Log File Growing Too Large

1. **Rotate logs:**
   ```bash
   # Clear old logs
   > /tmp/theoshift-debug.log
   
   # Or use logrotate
   sudo logrotate -f /etc/logrotate.d/theoshift
   ```

---

## Quick Reference

### Enable Full Debug Mode
```bash
DEBUG_ENABLED=true
DEBUG_LEVEL=DEBUG
DEBUG_CONTEXTS=*
DEBUG_LOG_TO_FILE=true
```

### Enable Minimal Debug Mode
```bash
DEBUG_ENABLED=true
DEBUG_LEVEL=INFO
DEBUG_CONTEXTS=API,EVENTS
```

### Disable Debug Mode
```bash
DEBUG_ENABLED=false
```

### View Logs
```bash
# Real-time
tail -f /tmp/theoshift-debug.log

# Last 100 lines
tail -100 /tmp/theoshift-debug.log

# Search for specific context
grep "\[PRISMA\]" /tmp/theoshift-debug.log

# Search for errors
grep "\[ERROR\]" /tmp/theoshift-debug.log
```

---

## Related Documentation

- [Naming Conventions](./NAMING-CONVENTIONS.md)
- [Blue-Green Deployment](../.cloudy-work/_cloudy-ops/docs/BLUE-GREEN-DEPLOYMENT.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
