# IVS Volunteer Approval Workflow - System Design Document

**Feature:** IVS Volunteer Approval & Early Check-In Module  
**Version:** 1.0  
**Date:** 2026-02-10  
**Status:** Design Phase

---

## Overview

Configurable volunteer module for IVS department to manage multi-round volunteer approval workflow across multiple departments. Supports importing department volunteer lists, tracking congregation approval status, and exporting updated lists back to departments.

---

## Business Requirements

### Workflow Summary

1. **Department Submission (Round 1)**
   - Departments submit volunteer lists: NAME, CONGREGATION
   - IVS imports lists into TheoShift
   - Each import is tagged with request round (Request 1, 2, 3...)

2. **Approval Tracking**
   - IVS tracks approval status: Pending, Requested, Approved, Not Approved
   - Approval date recorded
   - Department association maintained
   - Elder volunteers auto-approved (Forms of Service already tracked)

3. **Export to Departments**
   - Export by department with approval status and date
   - File format: NAME, CONGREGATION, APPROVAL STATUS, APPROVAL DATE
   - File naming: `[DEPARTMENT] Volunteer Approval-Request [N] UPDATED MM-DD-YYYY`

4. **Early Entry Selection (Future)**
   - Approved volunteers eligible for early entry selection
   - Integration with event check-in system

### Key Constraints

- **Event-Specific:** Volunteers are specific to IVS event (not global volunteers)
- **External Communication:** JWPUB emails handled outside TheoShift
- **Multiple Rounds:** Support Request 1, 2, 3... with batch tracking
- **Department Privacy:** Department names not shared with congregations
- **No Position Requirement:** Volunteers approved before position assignment

---

## Database Schema Design

### 1. Extend `event_volunteers` Table

Add optional IVS approval workflow fields to existing `event_volunteers` table:

```prisma
model event_volunteers {
  // ... existing fields ...
  
  // IVS Approval Workflow Fields (optional, null if not using IVS module)
  ivsApprovalStatus     String?      // "Pending", "Requested", "Approved", "Not Approved"
  ivsSubmittedBy        String?      // Department name that submitted this volunteer
  ivsRequestRound       Int?         // 1, 2, 3... for tracking multiple rounds
  ivsApprovalRequestedAt DateTime?   // When approval was requested from congregation
  ivsApprovalNotes      String?      // Notes from IVS overseer or congregation
  ivsApprovedAt         DateTime?    // When congregation approved
  ivsApprovedBy         String?      // Who approved (congregation, auto for elders)
  ivsDeniedReason       String?      // Reason if not approved
  ivsImportBatchId      String?      // Links to import batch for tracking
  
  // Early Check-In Fields (future phase)
  earlyCheckinEligible  Boolean?     @default(false)
  checkedInAt           DateTime?
  checkedInBy           String?
  checkinNotes          String?
  
  // Relations
  importBatch           ivs_import_batches? @relation(fields: [ivsImportBatchId], references: [id])
}
```

### 2. New Table: `ivs_import_batches`

Track each import batch for audit trail and round management:

```prisma
model ivs_import_batches {
  id                String              @id @default(uuid())
  eventId           String
  requestRound      Int                 // 1, 2, 3...
  importedBy        String              // User who imported
  importedAt        DateTime            @default(now())
  fileName          String              // Original file name
  departmentName    String?             // Department that submitted (if single dept)
  volunteerCount    Int                 // Number of volunteers in this batch
  notes             String?             // Import notes
  
  // Relations
  event             events              @relation(fields: [eventId], references: [id], onDelete: Cascade)
  volunteers        event_volunteers[]
  
  @@index([eventId])
  @@index([requestRound])
}
```

### 3. Module Configuration

Extend existing `moduleConfig` in events table to enable/disable IVS module:

```json
{
  "ivsApprovalWorkflow": {
    "enabled": true,
    "currentRound": 1,
    "approvalStatuses": ["Pending", "Requested", "Approved", "Not Approved"],
    "departments": ["Parking", "Security", "Cleaning", "First Aid", "..."],
    "autoApproveElders": true
  },
  "earlyCheckin": {
    "enabled": false
  }
}
```

---

## Spreadsheet Format Specification

### Import Format (from Departments)

**File Name:** `[DEPARTMENT] Volunteer Approval-Request [N].xlsx`

**Columns:**
| Column | Required | Description |
|--------|----------|-------------|
| NAME | Yes | Full name (First Last) |
| CONGREGATION | Yes | Congregation name |

**Example:**
```
NAME                | CONGREGATION
John Smith          | Twinsburg
Jane Doe            | Hudson
Robert Johnson      | Stow
```

### Export Format (to Departments)

**File Name:** `[DEPARTMENT] Volunteer Approval-Request [N] UPDATED MM-DD-YYYY.xlsx`

**Columns:**
| Column | Required | Description |
|--------|----------|-------------|
| NAME | Yes | Full name (First Last) |
| CONGREGATION | Yes | Congregation name |
| APPROVAL STATUS | Yes | Pending, Requested, Approved, Not Approved |
| APPROVAL DATE | No | Date approved (if approved) |

**Example:**
```
NAME                | CONGREGATION | APPROVAL STATUS | APPROVAL DATE
John Smith          | Twinsburg    | Approved        | 02/05/2026
Jane Doe            | Hudson       | Not Approved    | 
Robert Johnson      | Stow         | Requested       |
```

---

## Implementation Phases

### Phase 1: Database Schema (M effort - 1-2 days)
- [ ] Create migration for `ivs_import_batches` table
- [ ] Add IVS approval fields to `event_volunteers` table
- [ ] Add module configuration to events
- [ ] Test migrations on dev environment

### Phase 2: Import Functionality (L effort - 3-5 days)
- [ ] Create API endpoint: `POST /api/events/[id]/ivs/import`
- [ ] Excel/CSV parser for department lists
- [ ] Batch creation and tracking
- [ ] Volunteer record creation (event-specific)
- [ ] Auto-approval for elders (check Forms of Service)
- [ ] Duplicate detection and handling
- [ ] Import validation and error handling

### Phase 3: Approval Tracking UI (L effort - 3-5 days)
- [ ] New event tab: "IVS Approvals" (conditionally shown)
- [ ] Volunteer list with approval status columns
- [ ] Filters: Department, Status, Round, Congregation
- [ ] Bulk actions: Update Status, Add Notes
- [ ] Individual volunteer detail modal
- [ ] Approval status badge components
- [ ] Search and pagination

### Phase 4: Export Functionality (M effort - 1-2 days)
- [ ] Create API endpoint: `POST /api/events/[id]/ivs/export`
- [ ] Export by department filter
- [ ] Excel/CSV generation with proper format
- [ ] File naming convention implementation
- [ ] Download functionality

### Phase 5: Admin Configuration (S effort - 4-8 hours)
- [ ] Department template configuration UI
- [ ] Enable/disable IVS module toggle
- [ ] Department list management
- [ ] Approval status customization
- [ ] Round management

### Phase 6: Early Check-In (Future - M effort)
- [ ] Early check-in tab (conditionally shown)
- [ ] Check-in interface
- [ ] Real-time status tracking
- [ ] Export and email reports

---

## API Endpoints

### Import
```
POST /api/events/[eventId]/ivs/import
Body: { file: File, requestRound: number, departmentName?: string }
Response: { batchId: string, volunteerCount: number, errors: [] }
```

### Export
```
POST /api/events/[eventId]/ivs/export
Body: { departmentName?: string, requestRound?: number, format: 'xlsx' | 'csv' }
Response: File download
```

### Update Approval Status
```
PATCH /api/events/[eventId]/ivs/volunteers/[volunteerId]
Body: { approvalStatus: string, approvalNotes?: string, approvedBy?: string }
Response: { success: boolean }
```

### Bulk Update
```
POST /api/events/[eventId]/ivs/volunteers/bulk-update
Body: { volunteerIds: string[], approvalStatus: string, notes?: string }
Response: { updated: number, errors: [] }
```

---

## UI Components

### IVS Approvals Tab

**Location:** `/events/[id]/ivs-approvals`

**Layout:**
- Header with import/export buttons
- Filter bar (Department, Status, Round, Congregation)
- Volunteer table with columns:
  - Name
  - Congregation
  - Department
  - Request Round
  - Approval Status (badge)
  - Approval Date
  - Notes (truncated)
  - Actions (Edit, View)
- Bulk selection and actions toolbar
- Pagination

**Features:**
- Import button → File upload modal
- Export button → Department/round selection modal
- Inline status editing
- Bulk status updates
- Search by name or congregation
- Sort by any column

---

## Security & Permissions

**Who can access IVS module:**
- Event ADMIN role
- IVS department overseer (special permission)

**Actions:**
- Import: ADMIN only
- Export: ADMIN only
- Update status: ADMIN or IVS overseer
- View: ADMIN or IVS overseer

---

## Future Enhancements

1. **JWPUB Integration** (if API available)
   - Auto-send approval requests to congregations
   - Track email status

2. **Auto-matching**
   - Match imported volunteers with existing global volunteers
   - Suggest matches based on name/congregation

3. **Reporting**
   - Approval rate by congregation
   - Department volunteer counts
   - Round comparison reports

4. **Notifications**
   - Alert when all approvals received
   - Remind about pending approvals

---

## Testing Strategy

### Unit Tests
- Excel/CSV parsing
- Volunteer record creation
- Auto-approval logic for elders
- Export file generation

### Integration Tests
- Import → Track → Export workflow
- Multiple round handling
- Duplicate detection
- Batch tracking

### E2E Tests
- Full workflow from import to export
- UI interactions (filters, bulk actions)
- File upload and download

---

## Migration Strategy

1. **Dev Environment:** Test schema changes
2. **Staging (STANDBY):** Full workflow testing
3. **Production:** Deploy during maintenance window
4. **Rollback Plan:** Revert migration if issues

---

## Success Metrics

- Import time < 5 seconds for 100 volunteers
- Export time < 3 seconds for any department
- Zero data loss during import/export
- 100% test coverage for critical paths
- User satisfaction: Reduces manual work by 80%

---

## Open Questions

1. ✅ Approval status values → Answered: Pending, Requested, Approved, Not Approved
2. ✅ Elder handling → Answered: Auto-approved via Forms of Service
3. ✅ Import/export scope → Answered: Full workflow automation
4. ✅ Volunteer integration → Answered: Event-specific, not required in global system
5. ✅ Department assignment → Answered: General approval before position assignment
6. ✅ Round tracking → Answered: Flag/tag for Request 1, 2, 3...
7. ✅ Workflow approach → Answered: Option A (Full automation, JWPUB external)

---

## Next Steps

1. ✅ Review and approve this design document
2. Create database migration files
3. Implement Phase 1: Database Schema
4. Begin Phase 2: Import functionality
5. Iterate based on user feedback
