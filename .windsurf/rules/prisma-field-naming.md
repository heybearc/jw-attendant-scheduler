# Prisma Field Naming Convention

## Golden Rule
**ALWAYS use camelCase when writing Prisma queries in TypeScript code.**

Prisma automatically maps camelCase to snake_case in the database via `@map` directives.

## Quick Reference

### Models with @map directives (use camelCase)
```typescript
// position_oversight_assignments
positionId, eventId, overseerId, keymanId, assignedBy, createdAt, updatedAt

// position_assignments  
positionId, volunteerId, shiftId, assignedBy

// volunteer_availability
eventId, volunteerId, availableFrom, availableTo, isFlexible

// ivs_import_batches
eventId, requestRound, importedAt, importedBy, totalRecords
```

### Events model oversight fields (use lowercase - NO @map)
```typescript
// These match database exactly (all lowercase)
circuitoverseername, circuitoverseerphone, circuitoverseeremail
assemblyoverseername, assemblyoverseerphone, assemblyoverseeremail
volunteeroverseername, volunteeroverseerphone, volunteeroverseeremail
volunteeroverseerassistants
```

## Common Errors

❌ `position_id` → ✅ `positionId`  
❌ `event_id` → ✅ `eventId`  
❌ `overseer_id` → ✅ `overseerId`  
❌ `volunteer_id` → ✅ `volunteerId`  
❌ `assigned_by` → ✅ `assignedBy`  
❌ `created_at` → ✅ `createdAt`  
❌ `updated_at` → ✅ `updatedAt`  

❌ `volunteerOverseerName` → ✅ `volunteeroverseername` (events model only)

## When in Doubt
1. Check `/prisma/schema.prisma`
2. Look for `@map("column_name")` - if present, use the field name before @map
3. If no @map, the Prisma field name = database column name

## Full Documentation
See `/docs/PRISMA_FIELD_MAPPING.md` for complete reference.
