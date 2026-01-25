# Phase 4C: Assignment Workflow Enhancements - REVISED PLAN

**Target Version:** v3.4.0  
**Estimated Duration:** 2-3 weeks  
**Status:** 🔄 APPROVED - Ready to implement  
**Last Updated:** January 25, 2026

---

## 🎯 Revised Scope

Based on user feedback, Phase 4C will focus on:

✅ **Feature 1: Assignment Notifications** - APPROVED (High Priority)  
✅ **Feature 2: Assignment Templates** - APPROVED (Medium Priority - complements clone event)  
✅ **Feature 4: Volunteer Confirmation System** - APPROVED (High Priority - ENHANCED)  
⏸️ **Feature 3: Assignment History & Analytics** - DEFERRED to Phase 6

---

## 📧 Feature 1: Assignment Notifications

### **Goal:**
Automatically notify volunteers via email when assigned to positions, reducing manual coordination.

### **Email Types:**

1. **Assignment Created**
   ```
   Subject: You've been assigned to [Event Name]
   
   Hi [Volunteer Name],
   
   You've been assigned to the following position:
   - Position: Main Entrance (Post #5)
   - Event: Weekend Convention 2026
   - Date: Saturday, February 15, 2026
   - Time: 9:00 AM - 12:00 PM
   - Location: Convention Hall
   
   Please confirm your availability by clicking below:
   [Confirm] [Decline] [View Details]
   
   Thank you for your service!
   ```

2. **Assignment Updated**
   ```
   Subject: Your assignment has been updated
   
   Hi [Volunteer Name],
   
   Your assignment has been changed:
   - Previous: Main Entrance (9:00 AM - 12:00 PM)
   - Updated: Upper Level (10:00 AM - 1:00 PM)
   
   Please confirm you can still serve at this new time.
   [Confirm] [Decline] [View Details]
   ```

3. **Assignment Cancelled**
   ```
   Subject: Assignment cancelled for [Event Name]
   
   Hi [Volunteer Name],
   
   Your assignment for Saturday, February 15 has been cancelled.
   We appreciate your willingness to serve!
   ```

4. **Upcoming Assignment Reminder**
   ```
   Subject: Reminder: You're serving tomorrow
   
   Hi [Volunteer Name],
   
   This is a reminder that you're assigned to:
   - Position: Main Entrance (Post #5)
   - Tomorrow: Saturday, February 15, 2026
   - Time: 9:00 AM - 12:00 PM
   
   See you there!
   ```

### **Admin Settings:**
- Toggle notifications on/off globally
- Configure reminder timing (24h, 48h, 1 week, custom)
- Email template customization
- Test email sending
- Notification log/history

### **Implementation:**

#### Files to Create:
1. `/src/lib/assignmentEmails.ts` - Email template generator
2. `/pages/api/assignments/notify.ts` - Notification API endpoint
3. `/pages/admin/notification-settings.tsx` - Admin configuration UI
4. `/pages/help/assignment-notifications.tsx` - Help documentation

#### Files to Modify:
1. `/lib/positionService.ts` - Add notification triggers
2. `/hooks/useAssignments.ts` - Integrate notifications
3. `/pages/api/event-assignments/[eventId].ts` - Trigger on create/update/delete

#### Database Changes:
```sql
-- Add notification preferences to events table
ALTER TABLE events ADD COLUMN notification_settings JSONB DEFAULT '{
  "enabled": true,
  "reminderTiming": "24h",
  "sendOnCreate": true,
  "sendOnUpdate": true,
  "sendOnCancel": true,
  "sendReminders": true
}'::jsonb;

-- Optional: Track sent notifications
CREATE TABLE assignment_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'sent',
  error_message TEXT
);
```

---

## 📋 Feature 2: Assignment Templates

### **Goal:**
Save position structures and time slot patterns for reuse across similar events.

### **Why Still Needed:**
Current clone event feature only copies event metadata (name, dates, location). It does NOT copy:
- Positions
- Assignments
- Time slots
- Position configurations

Assignment templates fill this gap by allowing you to save and reuse position structures.

### **Use Cases:**

1. **Weekend Convention Template**
   - 20 positions (Main Entrance, Upper Level, Stage, etc.)
   - 4 time slots (9-12, 12-3, 3-6, 6-9)
   - Standard rotation pattern
   - Save once, reuse for every convention

2. **Circuit Assembly Template**
   - 15 positions
   - 3 time slots
   - Different position names
   - Reuse quarterly

3. **Memorial Template**
   - 10 positions
   - 2 time slots
   - Annual reuse

### **Features:**

1. **Template Creation**
   - Save current event's position structure as template
   - Name and describe the template
   - Associate with department (Attendants, Parking, etc.)
   - Include position names, time slots, requirements

2. **Template Library**
   - Browse all saved templates
   - Filter by department
   - Preview template structure
   - Edit existing templates
   - Delete unused templates

3. **Template Application**
   - Select template when creating new event
   - Or apply to existing event
   - Preview positions before creating
   - Bulk create all positions from template
   - Positions created, ready for volunteer assignment

4. **Template Analytics**
   - Track usage count
   - Last used date
   - Success rate (positions filled)

### **Implementation:**

#### Files to Create:
1. `/types/assignmentTemplate.ts` - TypeScript types
2. `/pages/admin/assignment-templates.tsx` - Template management UI
3. `/components/TemplateSelector.tsx` - Template picker component
4. `/components/TemplatePreview.tsx` - Preview before applying
5. `/pages/api/assignment-templates/index.ts` - List, Create
6. `/pages/api/assignment-templates/[id].ts` - Get, Update, Delete
7. `/pages/api/assignment-templates/[id]/apply.ts` - Apply to event
8. `/pages/help/assignment-templates.tsx` - Help documentation

#### Files to Modify:
1. `/pages/events/[id]/positions.tsx` - Add "Apply Template" button
2. `/pages/events/create.tsx` - Add template selector (optional)

#### Database Schema:
```sql
CREATE TABLE assignment_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  department_template_id UUID REFERENCES department_templates(id),
  event_type VARCHAR(100),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Template structure
  positions JSONB NOT NULL,
  -- Example structure:
  -- [
  --   {
  --     "positionNumber": 1,
  --     "positionName": "Main Entrance",
  --     "shifts": [
  --       {"start": "09:00", "end": "12:00", "requiredCount": 2},
  --       {"start": "12:00", "end": "15:00", "requiredCount": 2}
  --     ],
  --     "requirements": {"role": "Elder", "minExperience": 1}
  --   }
  -- ]
  
  UNIQUE(name, created_by)
);

CREATE INDEX idx_assignment_templates_department ON assignment_templates(department_template_id);
CREATE INDEX idx_assignment_templates_creator ON assignment_templates(created_by);
```

---

## 🔄 Feature 4: Volunteer Confirmation System (ENHANCED)

### **Goal:**
Enable volunteers to confirm/decline assignments AND send bulk confirmation requests to all volunteers.

### **Two-Part System:**

#### **Part A: Individual Assignment Confirmation**
When a volunteer is assigned to a position, they can:
- **Confirm** - "Yes, I'll be there"
- **Decline** - "Sorry, I can't make it"
- **Tentative** - "Maybe, let me check"

#### **Part B: Bulk Volunteer Availability Request** ⭐ NEW
Before creating assignments, send a request to all volunteers:
- "Are you available to help with Weekend Convention on Feb 15-16?"
- Volunteers respond: Available / Not Available / Partial Availability
- Coordinators see who's available BEFORE making assignments
- Reduces assignment cancellations

### **Workflow:**

```
1. Event Created
   ↓
2. Coordinator: "Send Availability Request to All Volunteers"
   ↓
3. Email sent: "Can you help with [Event]?"
   ↓
4. Volunteers respond: Yes / No / Partial
   ↓
5. Coordinator sees availability dashboard
   ↓
6. Coordinator assigns only available volunteers
   ↓
7. Assigned volunteers confirm specific position/time
   ↓
8. Status tracking: Requested → Available → Assigned → Confirmed
```

### **Status Workflow:**

```
AVAILABILITY REQUEST SENT
  ↓
AVAILABLE / NOT AVAILABLE / PARTIAL
  ↓
ASSIGNED (to specific position)
  ↓
CONFIRMED / DECLINED / TENTATIVE
  ↓
COMPLETED / NO_SHOW
```

### **Features:**

1. **Bulk Availability Request**
   - Send to all volunteers in department
   - Send to specific volunteer groups
   - Customizable email template
   - Deadline for responses
   - Automatic reminders for non-responders

2. **Availability Dashboard**
   - Visual grid showing who's available
   - Filter by date, time, role
   - Export availability list
   - Quick assign from available pool

3. **Individual Assignment Confirmation**
   - Email with Confirm/Decline buttons
   - One-click response (no login required)
   - Secure token-based confirmation
   - Coordinator sees real-time status

4. **Status Tracking**
   - Visual status badges
   - Filter assignments by status
   - Notification when volunteer responds
   - Automatic follow-up for pending confirmations

5. **Volunteer Dashboard**
   - See all availability requests
   - See all assignments
   - Confirm/decline in one place
   - Calendar view of commitments

### **Email Templates:**

#### Availability Request Email:
```
Subject: Can you help with Weekend Convention 2026?

Hi [Volunteer Name],

We're planning for Weekend Convention 2026 and would like to know if you're available to serve.

Event Details:
- Event: Weekend Convention 2026
- Dates: February 15-16, 2026
- Location: Convention Hall
- Department: Attendants

Please let us know your availability:
[I'm Available] [Not Available] [Partial Availability]

Please respond by February 1, 2026.

Thank you!
```

#### Assignment Confirmation Email:
```
Subject: Please confirm your assignment

Hi [Volunteer Name],

You've been assigned to serve at Weekend Convention 2026.

Your Assignment:
- Position: Main Entrance (Post #5)
- Date: Saturday, February 15, 2026
- Time: 9:00 AM - 12:00 PM

Please confirm your assignment:
[Confirm] [Decline] [Request Change]

Thank you for your service!
```

### **Implementation:**

#### Files to Create:
1. `/pages/api/events/[id]/availability-request.ts` - Send bulk request
2. `/pages/api/assignments/[id]/confirm.ts` - Confirm/decline endpoint
3. `/pages/api/assignments/confirm-token/[token].ts` - Token-based confirmation
4. `/components/AvailabilityDashboard.tsx` - Show volunteer availability
5. `/components/AssignmentStatusBadge.tsx` - Visual status indicators
6. `/pages/events/[id]/availability.tsx` - Availability management page
7. `/pages/attendant/availability.tsx` - Volunteer availability view
8. `/pages/help/volunteer-confirmation.tsx` - Help documentation

#### Files to Modify:
1. `/pages/events/[id]/positions.tsx` - Add status indicators
2. `/pages/attendant/dashboard.tsx` - Add availability requests section
3. `/lib/positionService.ts` - Add confirmation methods

#### Database Schema:
```sql
-- Track volunteer availability for events
CREATE TABLE volunteer_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('AVAILABLE', 'NOT_AVAILABLE', 'PARTIAL')),
  notes TEXT,
  available_dates JSONB, -- For partial availability
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(event_id, user_id)
);

-- Add confirmation fields to event_assignments
ALTER TABLE event_assignments ADD COLUMN confirmation_status VARCHAR(20) DEFAULT 'PENDING' 
  CHECK (confirmation_status IN ('PENDING', 'CONFIRMED', 'DECLINED', 'TENTATIVE', 'COMPLETED', 'NO_SHOW'));
ALTER TABLE event_assignments ADD COLUMN confirmation_token VARCHAR(255) UNIQUE;
ALTER TABLE event_assignments ADD COLUMN confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE event_assignments ADD COLUMN confirmation_notes TEXT;

CREATE INDEX idx_volunteer_availability_event ON volunteer_availability(event_id);
CREATE INDEX idx_volunteer_availability_user ON volunteer_availability(user_id);
CREATE INDEX idx_event_assignments_status ON event_assignments(confirmation_status);
```

---

## 📊 Success Metrics

### **Feature 1: Notifications**
- 95%+ email delivery rate
- 80%+ volunteer email open rate
- 50% reduction in "I didn't know I was assigned" issues

### **Feature 2: Templates**
- 40%+ of events use templates
- 70% reduction in position setup time for repeat events
- 5+ templates created per department

### **Feature 4: Confirmation System**
- 80%+ volunteer response rate to availability requests
- 90%+ confirmation rate for assignments
- 60% reduction in last-minute cancellations
- 50% reduction in assignment coordination time

---

## 🚀 Implementation Timeline

### **Week 1: Notifications + Database**
- Day 1-2: Database schema updates and migrations
- Day 3-4: Email template system (`assignmentEmails.ts`)
- Day 5: Notification API endpoints
- Day 6-7: Admin settings UI and testing

### **Week 2: Confirmation System**
- Day 1-2: Availability request system
- Day 3-4: Assignment confirmation endpoints
- Day 5: Availability dashboard
- Day 6-7: Volunteer dashboard updates and testing

### **Week 3: Templates + Polish**
- Day 1-2: Template database and API
- Day 3-4: Template management UI
- Day 5: Template application workflow
- Day 6-7: Help documentation, final testing, deployment

---

## 🧪 Testing Checklist

### **Notifications:**
- [ ] Email sent when assignment created
- [ ] Email sent when assignment updated
- [ ] Email sent when assignment cancelled
- [ ] Reminder email sent at configured time
- [ ] Admin can toggle notifications on/off
- [ ] Admin can configure reminder timing
- [ ] Email templates render correctly
- [ ] Emails contain correct assignment details

### **Templates:**
- [ ] Can create template from existing event
- [ ] Can edit template
- [ ] Can delete template
- [ ] Can preview template before applying
- [ ] Can apply template to new event
- [ ] Positions created correctly from template
- [ ] Template usage count increments
- [ ] Templates filtered by department

### **Confirmation System:**
- [ ] Can send availability request to all volunteers
- [ ] Can send to specific volunteer groups
- [ ] Volunteers receive availability request email
- [ ] Volunteers can respond (Available/Not/Partial)
- [ ] Availability dashboard shows responses
- [ ] Can assign from available volunteers
- [ ] Assignment confirmation email sent
- [ ] Volunteers can confirm/decline via email link
- [ ] Status updates in real-time
- [ ] Coordinator sees confirmation status
- [ ] Volunteer dashboard shows all requests/assignments

---

## 📁 File Summary

### **New Files (21):**
1. `/src/lib/assignmentEmails.ts`
2. `/pages/api/assignments/notify.ts`
3. `/pages/api/events/[id]/availability-request.ts`
4. `/pages/api/assignments/[id]/confirm.ts`
5. `/pages/api/assignments/confirm-token/[token].ts`
6. `/pages/admin/notification-settings.tsx`
7. `/types/assignmentTemplate.ts`
8. `/pages/admin/assignment-templates.tsx`
9. `/components/TemplateSelector.tsx`
10. `/components/TemplatePreview.tsx`
11. `/pages/api/assignment-templates/index.ts`
12. `/pages/api/assignment-templates/[id].ts`
13. `/pages/api/assignment-templates/[id]/apply.ts`
14. `/components/AvailabilityDashboard.tsx`
15. `/components/AssignmentStatusBadge.tsx`
16. `/pages/events/[id]/availability.tsx`
17. `/pages/attendant/availability.tsx`
18. `/pages/help/assignment-notifications.tsx`
19. `/pages/help/assignment-templates.tsx`
20. `/pages/help/volunteer-confirmation.tsx`
21. Database migration file

### **Modified Files (6):**
1. `/lib/positionService.ts`
2. `/hooks/useAssignments.ts`
3. `/pages/api/event-assignments/[eventId].ts`
4. `/pages/events/[id]/positions.tsx`
5. `/pages/events/create.tsx`
6. `/pages/attendant/dashboard.tsx`

---

## 🎯 Phase 4C Summary

**What's Included:**
✅ Assignment notifications (4 email types)  
✅ Assignment templates (save/reuse position structures)  
✅ Bulk availability requests (ask before assigning)  
✅ Individual assignment confirmation (confirm/decline)  
✅ Status tracking and dashboards  

**What's Deferred:**
⏸️ Assignment history & analytics (moved to Phase 6)

**Estimated Effort:** 2-3 weeks  
**Value:** High - addresses manual coordination pain points

---

**Ready to begin implementation?**
