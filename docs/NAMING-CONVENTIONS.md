# TheoShift Naming Conventions

## Database & Code Naming Standards

### Overview

TheoShift follows industry best practices for PostgreSQL databases while maintaining clean, idiomatic TypeScript/JavaScript code. This is achieved using Prisma's `@map` directives to bridge the two conventions.

---

## The Standard

### **Database Layer (PostgreSQL)**
- **Tables:** `snake_case`, plural (e.g., `users`, `event_positions`, `assignment_templates`)
- **Columns:** `snake_case` (e.g., `first_name`, `created_at`, `notification_settings`)
- **Indexes:** `idx_tablename_columnname` (e.g., `idx_users_email`)
- **Foreign Keys:** `fk_tablename_columnname` (e.g., `fk_assignments_user_id`)

### **Code Layer (TypeScript/Prisma)**
- **Models:** `PascalCase`, singular (e.g., `User`, `EventPosition`, `AssignmentTemplate`)
- **Fields:** `camelCase` (e.g., `firstName`, `createdAt`, `notificationSettings`)
- **Enums:** `PascalCase` for enum name, `UPPER_CASE` for values

### **API Layer**
- **Endpoints:** `kebab-case` (e.g., `/api/assignment-templates`, `/api/events/[id]/availability-request`)
- **Query params:** `camelCase` (e.g., `?eventType=CIRCUIT_ASSEMBLY&isActive=true`)
- **JSON keys:** `camelCase` (e.g., `{ firstName: "John", eventType: "CIRCUIT_ASSEMBLY" }`)

---

## Why This Approach?

### PostgreSQL + snake_case
PostgreSQL automatically lowercases unquoted identifiers. Using `snake_case` means:
- ✅ No double quotes needed in queries
- ✅ Works naturally with PostgreSQL's behavior
- ✅ Compatible with all PostgreSQL tools
- ✅ More readable in long queries

**Bad (requires quotes everywhere):**
```sql
SELECT "StudentName" FROM "StudentRecords" WHERE "IsActive" = true;
```

**Good (clean, no quotes):**
```sql
SELECT student_name FROM student_records WHERE is_active = true;
```

### TypeScript + camelCase
JavaScript/TypeScript convention is `camelCase` for variables and `PascalCase` for classes:
- ✅ Idiomatic JavaScript/TypeScript
- ✅ Consistent with ecosystem (React, Next.js, etc.)
- ✅ Better autocomplete in IDEs

---

## Prisma @map Directives

Use `@map` and `@@map` to bridge database and code conventions:

```prisma
model User {
  id        String   @id @default(dbgenerated("gen_random_uuid()::text"))
  firstName String   @map("first_name")
  lastName  String   @map("last_name")
  createdAt DateTime @default(now()) @map("created_at")
  
  @@map("users")
}

model EventPosition {
  id           String  @id
  positionName String  @map("position_name")
  eventId      String  @map("event_id")
  
  @@map("event_positions")
}
```

### When to Use @map

**Always map when:**
1. Database uses `snake_case` but code uses `camelCase`
2. Database table is plural but model is singular
3. Legacy database has different naming

**Example from TheoShift:**
```prisma
model Event {
  notificationSettings Json? @map("notification_settings")
  parentEventId        String? @map("parenteventid")
  departmentTemplateId String? @map("departmenttemplateid")
  
  @@map("events")
}
```

---

## Current State Analysis

### ✅ Correctly Mapped
Most of TheoShift's schema correctly uses `@map` directives for fields like:
- `parentEventId` → `parenteventid`
- `departmentTemplateId` → `departmenttemplateid`

### ⚠️ Inconsistencies Found
Some areas need attention:
1. **Missing @map directives** - Some new Phase 4C fields may be missing mappings
2. **Mixed conventions** - Some older tables don't follow the standard

---

## Rules for New Features

### When Adding New Database Tables/Columns

1. **Database:** Use `snake_case`
   ```sql
   CREATE TABLE assignment_templates (
     id TEXT PRIMARY KEY,
     template_name VARCHAR(255),
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. **Prisma Schema:** Use `PascalCase`/`camelCase` with `@map`
   ```prisma
   model AssignmentTemplate {
     id           String   @id
     templateName String   @map("template_name")
     createdAt    DateTime @default(now()) @map("created_at")
     
     @@map("assignment_templates")
   }
   ```

3. **TypeScript Code:** Use `camelCase`
   ```typescript
   const template = await prisma.assignmentTemplate.create({
     data: {
       templateName: "Default Template",
       createdAt: new Date()
     }
   });
   ```

### Blue-Green Deployment Considerations

When adding new columns for blue-green deployments:
1. Add column to database with `snake_case` name
2. Make column nullable or provide default value
3. Add `@map` directive in Prisma schema
4. Regenerate Prisma client: `npx prisma generate`
5. Test on STANDBY before switching traffic

---

## Migration Checklist

Before creating a new migration:

- [ ] All table names are `snake_case` and plural
- [ ] All column names are `snake_case`
- [ ] New columns are nullable or have defaults (for backwards compatibility)
- [ ] Prisma schema has corresponding `@map` directives
- [ ] Model names are `PascalCase` and singular
- [ ] Field names are `camelCase`
- [ ] Foreign key constraints follow naming convention
- [ ] Indexes follow naming convention

---

## Examples from TheoShift

### Good Example
```prisma
model AssignmentNotification {
  id              String   @id @default(dbgenerated("gen_random_uuid()::text"))
  assignmentId    String   @map("assignment_id")
  notificationType String  @map("notification_type")
  recipientEmail  String   @map("recipient_email")
  sentAt          DateTime @default(now()) @map("sent_at")
  
  @@map("assignment_notifications")
  @@index([assignmentId], map: "idx_assignment_notifications_assignment")
}
```

### Bad Example (Don't Do This)
```prisma
// ❌ No @map directives, mixed conventions
model assignmentNotifications {
  id String @id
  assignment_id String
  NotificationType String
  recipient_email String
}
```

---

## Tools & Commands

### Check Schema Consistency
```bash
# View current schema
npx prisma db pull

# Validate schema
npx prisma validate

# Generate client
npx prisma generate
```

### Find Missing @map Directives
```bash
# Compare Prisma schema field names with database columns
psql $DATABASE_URL -c "\d table_name"
```

---

## References

- [PostgreSQL Naming Conventions](https://www.postgresql.org/docs/current/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS)
- [Prisma Database Mapping](https://www.prisma.io/docs/orm/prisma-schema/data-model/database-mapping)
- [Why Snake Case for PostgreSQL](https://medium.com/mr-plan-publication/why-snake-case-is-the-best-naming-convention-for-postgresql-776063a57ff3)

---

## Decision Record

**Decision:** TheoShift uses `snake_case` for database layer and `camelCase`/`PascalCase` for code layer, bridged by Prisma `@map` directives.

**Rationale:**
- Follows PostgreSQL best practices
- Maintains idiomatic TypeScript/JavaScript code
- Prevents quoting issues in SQL queries
- Compatible with all tooling
- Industry standard approach

**Date:** 2026-01-25
**Status:** Active Standard
