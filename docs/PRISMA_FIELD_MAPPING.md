# Prisma Field Name Mapping Reference

## Overview

The TheoShift database uses **snake_case** column names (e.g., `position_id`, `event_id`), but Prisma expects **camelCase** field names in your code (e.g., `positionId`, `eventId`).

Prisma handles this mapping automatically using `@map` directives in the schema.

## ⚠️ CRITICAL RULE

**ALWAYS use camelCase field names when working with Prisma in your code.**

```typescript
// ✅ CORRECT - Use camelCase
await prisma.position_oversight_assignments.findFirst({
  where: {
    positionId: positionId,
    eventId: eventId
  }
})

// ❌ WRONG - Don't use snake_case
await prisma.position_oversight_assignments.findFirst({
  where: {
    position_id: positionId,  // This will cause an error!
    event_id: eventId         // This will cause an error!
  }
})
```

## Common Field Mappings

### Position Oversight Assignments
| Prisma (camelCase) | Database (snake_case) |
|-------------------|----------------------|
| `positionId` | `position_id` |
| `eventId` | `event_id` |
| `overseerId` | `overseer_id` |
| `keymanId` | `keyman_id` |
| `assignedBy` | `assigned_by` |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |

### Assignment Notifications
| Prisma (camelCase) | Database (snake_case) |
|-------------------|----------------------|
| `assignmentId` | `assignment_id` |
| `notificationType` | `notification_type` |
| `sentAt` | `sent_at` |
| `readAt` | `read_at` |
| `createdAt` | `created_at` |

### Volunteer Availability
| Prisma (camelCase) | Database (snake_case) |
|-------------------|----------------------|
| `eventId` | `event_id` |
| `volunteerId` | `volunteer_id` |
| `availableFrom` | `available_from` |
| `availableTo` | `available_to` |
| `isFlexible` | `is_flexible` |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |

### IVS Import Batches
| Prisma (camelCase) | Database (snake_case) |
|-------------------|----------------------|
| `eventId` | `event_id` |
| `requestRound` | `request_round` |
| `importedAt` | `imported_at` |
| `importedBy` | `imported_by` |
| `totalRecords` | `total_records` |
| `successfulRecords` | `successful_records` |
| `failedRecords` | `failed_records` |

## Events Model - Special Case

The `events` model has **lowercase** field names in the database for oversight fields:

| Prisma (camelCase) | Database (lowercase) |
|-------------------|---------------------|
| `circuitOverseerName` | `circuitoverseername` |
| `circuitOverseerPhone` | `circuitoverseerphone` |
| `circuitOverseerEmail` | `circuitoverseeremail` |
| `assemblyOverseerName` | `assemblyoverseername` |
| `assemblyOverseerPhone` | `assemblyoverseerphone` |
| `assemblyOverseerEmail` | `assemblyoverseeremail` |
| `volunteerOverseerName` | `volunteeroverseername` |
| `volunteerOverseerPhone` | `volunteeroverseerphone` |
| `volunteerOverseerEmail` | `volunteeroverseeremail` |
| `volunteerOverseerAssistants` | `volunteeroverseerassistants` |

**Note:** These fields don't have `@map` directives, so the Prisma field names match the database column names exactly (all lowercase).

## How to Check Field Names

1. **Always refer to `prisma/schema.prisma`** to see the correct field names
2. Look for `@map("column_name")` directives - if present, use the Prisma field name (before the @map)
3. If no `@map` directive, the Prisma field name matches the database column name exactly

## Common Mistakes to Avoid

### 1. Using snake_case in Prisma queries
```typescript
// ❌ WRONG
const result = await prisma.position_assignments.create({
  data: {
    position_id: positionId,  // Error!
    volunteer_id: volunteerId // Error!
  }
})

// ✅ CORRECT
const result = await prisma.position_assignments.create({
  data: {
    positionId: positionId,
    volunteerId: volunteerId
  }
})
```

### 2. Mixing camelCase and snake_case
```typescript
// ❌ WRONG - Inconsistent naming
const result = await prisma.events.update({
  where: { id: eventId },
  data: {
    volunteeroverseername: name,  // Correct (no @map)
    volunteerOverseerPhone: phone // Wrong (should be lowercase)
  }
})

// ✅ CORRECT - Consistent lowercase for events oversight fields
const result = await prisma.events.update({
  where: { id: eventId },
  data: {
    volunteeroverseername: name,
    volunteeroverseerphone: phone
  }
})
```

### 3. Using old table names
```typescript
// ❌ WRONG - Old table name
await prisma.event_attendants.create({ ... })

// ✅ CORRECT - Current table name
await prisma.event_volunteers.create({ ... })
```

## Quick Reference: Recent Fixes

### Issue: Clone endpoint using old field names
- **Problem:** Used `attendantId` instead of `volunteerId`
- **Fix:** Updated to use `volunteerId` for `position_assignments`

### Issue: Oversight API using snake_case
- **Problem:** Used `position_id`, `event_id` in queries
- **Fix:** Updated to use `positionId`, `eventId` (Prisma handles mapping)

### Issue: Events oversight fields not displaying
- **Problem:** Used camelCase (`volunteerOverseerName`) but database has lowercase
- **Fix:** Updated to use lowercase (`volunteeroverseername`)

## Best Practices

1. **Always check the Prisma schema first** before writing queries
2. **Use TypeScript** - it will catch field name errors at compile time
3. **Don't use `(prisma as any)`** - it bypasses type checking and hides errors
4. **Test on STANDBY first** - catch field name issues before production
5. **When in doubt, use camelCase** - most models follow this pattern

## When Adding New Fields

If you're adding new fields to the database:

1. Use snake_case in the database migration
2. Add `@map("snake_case_name")` directive in Prisma schema
3. Use camelCase in your TypeScript code
4. Run `npx prisma generate` to update the Prisma client

Example:
```prisma
model my_table {
  id          String   @id
  myNewField  String   @map("my_new_field")  // ← Add this mapping
  createdAt   DateTime @map("created_at")
}
```

## Resources

- Prisma Schema: `/prisma/schema.prisma`
- Prisma Docs: https://www.prisma.io/docs/concepts/components/prisma-schema/names-in-underlying-database
