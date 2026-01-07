# Phase 4C: Assignment Workflow Enhancements - Implementation Plan

**Target Version:** v3.3.0  
**Duration:** 2-3 weeks  
**Status:** 🔄 IN PROGRESS

---

## 🎯 Goals

1. **Assignment Notifications** - Email notifications for assignments
2. **Assignment Templates** - Save and reuse assignment patterns
3. **Assignment History** - Track assignment patterns and analytics
4. **Real-Time Updates** - Live assignment status updates

---

## 📋 Feature 1: Assignment Notifications

### **Email Templates to Create:**

1. **Assignment Created** - Notify volunteer of new assignment
2. **Assignment Updated** - Notify volunteer of changes
3. **Assignment Cancelled** - Notify volunteer of cancellation
4. **Assignment Reminder** - Upcoming assignment reminder (24h before)

### **Implementation Steps:**

#### Step 1: Create Email Template Functions
**File:** `/src/lib/assignmentEmails.ts`

Functions needed:
- `generateAssignmentCreatedEmail(data)`
- `generateAssignmentUpdatedEmail(data)`
- `generateAssignmentCancelledEmail(data)`
- `generateAssignmentReminderEmail(data)`
- `sendAssignmentNotification(type, data)`

#### Step 2: Create Notification API Endpoint
**File:** `/pages/api/assignments/notify.ts`

- POST endpoint to send assignment notifications
- Validate assignment data
- Check email configuration
- Send appropriate email template
- Log notification sent

#### Step 3: Integrate into Assignment Workflow
**Files to Modify:**
- `/pages/api/event-assignments/[eventId].ts` - Add notification on create
- `/lib/positionService.ts` - Add notification methods
- `/hooks/useAssignments.ts` - Trigger notifications on actions

#### Step 4: Add Notification Settings
**File:** `/pages/admin/notification-settings.tsx`

- Toggle assignment notifications on/off
- Configure reminder timing (24h, 48h, 1 week)
- Test notification sending
- Email template preview

---

## 📋 Feature 2: Assignment Templates

### **What Are Assignment Templates?**

Save common assignment patterns for quick reuse:
- "Weekend Convention - Attendant Rotation"
- "Circuit Assembly - Standard Setup"
- "Memorial - Full Coverage"

### **Implementation Steps:**

#### Step 1: Create Assignment Template Types
**File:** `/types/assignmentTemplate.ts`

```typescript
interface AssignmentTemplate {
  id: string
  name: string
  description: string
  eventType: string
  departmentTemplateId?: string
  assignments: TemplateAssignment[]
  createdBy: string
  createdAt: Date
  usageCount: number
}

interface TemplateAssignment {
  positionNumber: number
  positionName: string
  shiftStart: string
  shiftEnd: string
  requiredCount: number
  role?: string
}
```

#### Step 2: Create Template Management UI
**File:** `/pages/admin/assignment-templates.tsx`

- List all templates
- Create new template
- Edit existing template
- Delete template
- Preview template assignments
- Apply template to event

#### Step 3: Create Template API Endpoints
**Files:**
- `/pages/api/assignment-templates/index.ts` - List, Create
- `/pages/api/assignment-templates/[id].ts` - Get, Update, Delete
- `/pages/api/assignment-templates/[id]/apply.ts` - Apply to event

#### Step 4: Integrate into Position Management
**File:** `/pages/events/[id]/positions.tsx`

- Add "Apply Template" button
- Template selector modal
- Preview assignments before applying
- Bulk create assignments from template

---

## 📋 Feature 3: Assignment History

### **What to Track:**

- Assignment creation/modification/deletion
- Who made the change
- When the change was made
- What changed (before/after)
- Assignment completion status

### **Implementation Steps:**

#### Step 1: Create Assignment History Model
**File:** `prisma/schema.prisma`

```prisma
model assignment_history {
  id              String   @id @default(uuid())
  assignmentId    String
  eventId         String
  positionId      String
  attendantId     String
  action          String   // CREATED, UPDATED, CANCELLED, COMPLETED
  changedBy       String
  changedAt       DateTime @default(now())
  changes         Json?    // Before/after data
  notes           String?
  
  event           events   @relation(fields: [eventId], references: [id])
  
  @@index([assignmentId])
  @@index([eventId])
  @@index([attendantId])
}
```

#### Step 2: Create History Tracking Service
**File:** `/src/lib/assignmentHistory.ts`

Functions:
- `logAssignmentCreated(assignment)`
- `logAssignmentUpdated(assignment, changes)`
- `logAssignmentCancelled(assignment, reason)`
- `logAssignmentCompleted(assignment)`
- `getAssignmentHistory(assignmentId)`
- `getVolunteerHistory(attendantId)`

#### Step 3: Create History View UI
**File:** `/pages/events/[id]/assignment-history.tsx`

- Timeline view of all assignment changes
- Filter by volunteer, position, date range
- Export history to CSV
- Assignment analytics dashboard

#### Step 4: Add Analytics Dashboard
**File:** `/components/AssignmentAnalytics.tsx`

Metrics to show:
- Total assignments by volunteer
- Position fill rate over time
- Average assignment duration
- Most active volunteers
- Assignment cancellation rate

---

## 📋 Feature 4: Real-Time Updates (Optional)

### **Implementation Steps:**

#### Step 1: Add WebSocket Support (if needed)
- Consider using Next.js API routes with polling
- Or implement simple refresh mechanism
- Show "New assignment available" notifications

#### Step 2: Add Assignment Status Updates
**File:** `/pages/api/assignments/[id]/status.ts`

Status transitions:
- ASSIGNED → CONFIRMED (volunteer confirms)
- ASSIGNED → DECLINED (volunteer declines)
- CONFIRMED → COMPLETED (after event)
- CONFIRMED → NO_SHOW (didn't show up)

#### Step 3: Create Status Update UI
**File:** `/components/AssignmentStatusBadge.tsx`

- Visual status indicators
- Quick status change buttons
- Status history tooltip

---

## 📁 Files to Create

### **New Files:**
1. `/src/lib/assignmentEmails.ts` - Email templates
2. `/pages/api/assignments/notify.ts` - Notification endpoint
3. `/types/assignmentTemplate.ts` - Template types
4. `/pages/admin/assignment-templates.tsx` - Template management
5. `/pages/api/assignment-templates/index.ts` - Template CRUD
6. `/pages/api/assignment-templates/[id].ts` - Template operations
7. `/pages/api/assignment-templates/[id]/apply.ts` - Apply template
8. `/src/lib/assignmentHistory.ts` - History tracking
9. `/pages/events/[id]/assignment-history.tsx` - History view
10. `/components/AssignmentAnalytics.tsx` - Analytics dashboard
11. `/pages/admin/notification-settings.tsx` - Notification config
12. `/pages/help/assignment-notifications.tsx` - Help docs
13. `/pages/help/assignment-templates.tsx` - Help docs

### **Files to Modify:**
1. `/src/lib/email.ts` - Add assignment email functions
2. `/lib/positionService.ts` - Add notification triggers
3. `/hooks/useAssignments.ts` - Integrate notifications
4. `/pages/events/[id]/positions.tsx` - Add template button
5. `/pages/api/event-assignments/[eventId].ts` - Add history logging
6. `prisma/schema.prisma` - Add assignment_history model

---

## 🧪 Testing Checklist

### **Assignment Notifications:**
- [ ] Email sent when assignment created
- [ ] Email sent when assignment updated
- [ ] Email sent when assignment cancelled
- [ ] Reminder email sent 24h before event
- [ ] Email configuration fallback works
- [ ] Email templates render correctly
- [ ] Volunteer receives correct information

### **Assignment Templates:**
- [ ] Can create new template
- [ ] Can edit existing template
- [ ] Can delete template
- [ ] Can apply template to event
- [ ] Template creates correct assignments
- [ ] Template preview shows accurate data
- [ ] Template usage count increments

### **Assignment History:**
- [ ] History logged on create
- [ ] History logged on update
- [ ] History logged on cancel
- [ ] History view shows timeline
- [ ] Can filter history by volunteer
- [ ] Can export history to CSV
- [ ] Analytics show correct metrics

---

## 📊 Success Metrics

- **Notification Delivery:** 95%+ email delivery rate
- **Template Usage:** 50%+ of events use templates
- **Time Savings:** 60% reduction in assignment coordination time
- **History Tracking:** 100% of changes logged
- **User Satisfaction:** 4.5+ rating on assignment workflow

---

## 🚀 Deployment Plan

### **Phase 1: Notifications (Week 1)**
1. Create email templates
2. Build notification API
3. Integrate into workflow
4. Test on staging
5. Deploy to production

### **Phase 2: Templates (Week 2)**
1. Create template types
2. Build template UI
3. Create template API
4. Integrate into positions
5. Test and deploy

### **Phase 3: History & Analytics (Week 3)**
1. Add history model
2. Build tracking service
3. Create history view
4. Add analytics dashboard
5. Test and deploy

---

## 📞 Dependencies

- Email configuration must be set up (SMTP)
- Database migration for assignment_history
- User permissions for template management
- Help documentation for new features

---

**Status:** Ready to implement  
**Next Step:** Create assignment email templates
