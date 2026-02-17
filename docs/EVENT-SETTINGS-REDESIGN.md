# Event Settings Redesign - Architectural Simplification

**Date:** 2026-02-17  
**Status:** In Progress  
**Decision:** D-TS-031

## Overview

Remove template abstraction layers and move to event-centric configuration. This simplifies the system by eliminating department templates, assignment templates, and position templates in favor of direct event configuration with enhanced cloning capabilities.

## Problem Statement

Current system has excessive abstraction:
- Department Templates (admin page)
- Assignment Templates (admin page, unclear purpose)
- Position Templates (inside department templates)
- Custom Fields (rarely used, adds complexity)
- Extraction tools (one-off admin tools)

This creates:
- Confusion about where to configure things
- Tech debt maintaining multiple template systems
- Difficult sharing of event structures
- Complexity for event admins

## Solution

**Event-Centric Configuration with Enhanced Cloning**

### New Event Settings Structure

```
Event Settings (Tabbed Interface)
├── Basic Info
│   ├── Name, Description, Type
│   ├── Dates & Times
│   ├── Location (LocationSelector)
│   ├── Capacity & Volunteers Needed
│   ├── Status
│   └── Parent Event (if using hierarchy)
│
├── Modules & Features ⭐ NEW
│   ├── Module Toggles
│   │   ☑ Count Times
│   │   ☑ Lanyards  
│   │   ☑ IVS Module
│   │   ☑ Positions
│   │   ☑ Documents
│   │   ☑ Announcements
│   └── Terminology Overrides
│       ├── Volunteer → [custom term]
│       ├── Position → [custom term]
│       ├── Shift → [custom term]
│       └── Assignment → [custom term]
│
└── Oversight Settings (existing)
    ├── Department Overseer
    ├── Overseer Assistants
    └── Keyman
```

### Enhanced Event Cloning

```
Clone Event Modal:
☑ Basic Info (name, dates, location)
☑ Module Configuration
☑ Terminology Overrides
☑ Positions
☐ Volunteers (unchecked by default - for sharing)
☐ Assignments
☑ Departments (if applicable)
☑ Oversight Settings
```

## Data Model

### Using Existing `events.settings` JSON Field

```typescript
interface EventSettings {
  // Module toggles
  modules?: {
    countTimes: boolean
    lanyards: boolean
    ivsModule: boolean
    positions: boolean
    documents: boolean
    announcements: boolean
  }
  
  // Terminology overrides
  terminology?: {
    volunteer: string  // default: "Volunteer"
    position: string   // default: "Position"
    shift: string      // default: "Shift"
    assignment: string // default: "Assignment"
  }
  
  // Legacy fields (keep for backward compatibility)
  customFields?: Record<string, any>
  moduleOverrides?: Record<string, boolean>
}
```

**No schema migration needed** - uses existing `settings` JSON field.

## Migration Strategy

### Phase 1: Event Settings Redesign (Week 1)
1. Create new tabbed event settings UI
2. Add Modules & Features tab
3. Add terminology overrides UI
4. Keep existing functionality working
5. Deploy to STANDBY for testing

### Phase 2: Migration Script (Week 1)
1. Analyze events using `departmentTemplateId`
2. Create script to copy template config to `event.settings`
3. Test migration on STANDBY
4. Execute migration on all events
5. Verify no functionality lost

### Phase 3: Enhanced Cloning (Week 2)
1. Add granular clone options modal
2. Implement selective cloning
3. Default to excluding volunteers
4. Test cloning workflow

### Phase 4: Cleanup (Week 2)
1. Remove `/admin/departments` page
2. Remove `/admin/assignment-templates` page
3. Remove position extraction tools:
   - `/admin/extract-circuit-assembly-positions`
   - `/api/admin/populate-position-templates`
   - `/api/admin/apply-positions-to-event`
4. Remove `DepartmentTemplateModal` component
5. Remove template-related queries
6. Update navigation/routing

### Phase 5: Documentation (Week 2)
1. Update help documentation
2. Create user guide for new settings
3. Document cloning workflow
4. Update DECISIONS.md

## Files to Remove

**Pages:**
- `/pages/admin/departments.tsx`
- `/pages/admin/assignment-templates.tsx`
- `/pages/admin/assignment-templates/[id]/edit.tsx`
- `/pages/admin/assignment-templates/create.tsx`
- `/pages/admin/extract-circuit-assembly-positions.tsx`

**APIs:**
- `/pages/api/admin/department-templates.ts`
- `/pages/api/admin/department-templates/[id].ts`
- `/pages/api/admin/assignment-templates/index.ts`
- `/pages/api/admin/assignment-templates/[id].ts`
- `/pages/api/admin/assignment-templates/[id]/apply.ts`
- `/pages/api/admin/populate-position-templates.ts`
- `/pages/api/admin/apply-positions-to-event.ts`
- `/pages/api/admin/extract-positions.ts`

**Components:**
- `/components/DepartmentTemplateModal.tsx`
- `/components/CustomFieldsRenderer.tsx` (if not used elsewhere)
- `/components/TemplateForm.tsx` (if exists)

**Types:**
- `/types/departmentTemplate.ts` (migrate needed types to event types)

## Database Considerations

**Keep tables for backward compatibility:**
- `department_templates` - Keep but mark as deprecated
- `assignment_templates` - Keep but mark as deprecated
- `event_departments` - May still be used

**No breaking changes:**
- Events can still reference `departmentTemplateId` (nullable)
- Migration script copies config to `settings` field
- Old data preserved

## Benefits

1. **Simplified Mental Model**
   - Everything configured at event level
   - No template abstraction to understand
   - Clear ownership of settings

2. **Reduced Tech Debt**
   - Remove 10+ files
   - Remove 3+ database query patterns
   - Simpler codebase to maintain

3. **Better Sharing**
   - Clone events with granular control
   - Share event structure without volunteers
   - Easier collaboration between event admins

4. **Improved UX**
   - Single location for all event settings
   - Tabbed interface for organization
   - No jumping between admin pages

## Risks & Mitigation

**Risk:** Breaking existing events  
**Mitigation:** Migration script preserves all data, backward compatibility maintained

**Risk:** Users confused by change  
**Mitigation:** Clear documentation, help tooltips, gradual rollout

**Risk:** Lost template reusability  
**Mitigation:** Enhanced cloning provides same benefit without abstraction

## Success Criteria

- ✅ All events migrated without data loss
- ✅ Event settings UI is intuitive and complete
- ✅ Cloning works with granular options
- ✅ Template admin pages removed
- ✅ No regression in functionality
- ✅ Documentation updated
- ✅ User feedback positive

## Timeline

**Week 1:** Event Settings Redesign + Migration  
**Week 2:** Enhanced Cloning + Cleanup + Documentation  
**Total:** 2 weeks

## Related Decisions

- D-TS-031: Event-centric configuration architecture
- Supersedes: Any previous template-related decisions

---

**Next Steps:**
1. Create Modules & Features tab component
2. Build migration script
3. Test on STANDBY
4. Execute migration
5. Remove template pages
