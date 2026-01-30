# Phase 5B: Event Oversight Dashboard - REVISED PLAN

**Target Version:** v3.6.0  
**Estimated Duration:** 3-4 weeks  
**Status:** 📋 APPROVED - Ready to implement  
**Last Updated:** January 30, 2026

---

## 🎯 Revised Scope

Based on user feedback, Phase 5 has been **significantly simplified** from the original complex global oversight management system to focus on **event-specific oversight only**.

### **Original Phase 5 (REJECTED):**
❌ Global oversight assignments  
❌ Oversight teams and hierarchies  
❌ Complex delegation chains  
❌ Organization-wide oversight tracking  

### **Revised Phase 5B (APPROVED):**
✅ **Event-specific oversight dashboard**  
✅ **Per-event oversight visibility**  
✅ **Simple oversight role tracking**  
✅ **Event planning integration**  

---

## 📊 Event Oversight Dashboard

### **Goal:**
Provide coordinators with a simple dashboard showing which overseers, assistants, and keymen are assigned to positions for a specific event, helping with event planning and coverage verification.

### **Key Principle:**
**Event-focused, not organization-focused.** The dashboard shows oversight for ONE event at a time, not global oversight relationships.

---

## 🎨 Features

### **1. Event Oversight Dashboard Page**

**Location:** `/events/[id]/oversight`

**What it shows:**
- List of all overseers assigned to positions in this event
- List of all assistant overseers assigned to positions
- List of all keymen assigned to positions
- Coverage statistics (how many positions have oversight)
- Visual indicators for coverage gaps

**Example:**
```
Event: Weekend Convention 2026
Oversight Coverage: 85% (17/20 positions)

Overseers (5):
- John Smith - Main Entrance (Post #1-3)
- David Jones - Upper Level (Post #4-6)
- Michael Brown - Stage Area (Post #7-9)
...

Assistant Overseers (3):
- Sarah Williams - Main Entrance (Post #2)
- Emily Davis - Upper Level (Post #5)
...

Keymen (4):
- Robert Miller - Main Entrance (Post #1)
- James Wilson - Upper Level (Post #4)
...

Coverage Gaps (3 positions):
⚠️ Post #15 - No oversight assigned
⚠️ Post #18 - No oversight assigned
⚠️ Post #20 - No oversight assigned
```

### **2. Oversight Role Filtering**

**On Positions Page:**
- Add filter dropdown: "Show Overseers Only", "Show Assistants Only", "Show Keymen Only"
- Quick view of oversight distribution
- Helps with assignment planning

### **3. Oversight Statistics Card**

**On Event Dashboard:**
- Small card showing oversight coverage %
- Link to full oversight dashboard
- Quick visibility of oversight status

**Example:**
```
┌─────────────────────────┐
│ 🔍 Oversight Coverage   │
│                         │
│ 85% (17/20 positions)   │
│                         │
│ [View Details →]        │
└─────────────────────────┘
```

### **4. Export Functionality**

**Oversight Report:**
- PDF export of oversight assignments
- Excel export with oversight roles
- Useful for event planning meetings

---

## 🔧 Implementation

### **Files to Create:**

1. `/pages/events/[id]/oversight.tsx` - Oversight dashboard page
2. `/components/OversightCoverageCard.tsx` - Statistics card component
3. `/components/OversightRoleFilter.tsx` - Filter component for positions page
4. `/pages/api/events/[id]/oversight.ts` - Oversight data API
5. `/pages/help/event-oversight.tsx` - Help documentation

### **Files to Modify:**

1. `/pages/events/[id]/index.tsx` - Add oversight coverage card
2. `/pages/events/[id]/positions.tsx` - Add oversight role filter
3. `/components/EventLayout.tsx` - Add "Oversight" navigation item

### **Database Changes:**

**No new tables needed!** Uses existing data:
- `event_assignments` table (already has position assignments)
- `users` table (already has `role` field with OVERSEER, ASSISTANT_OVERSEER, KEYMAN)
- `positions` table (already has position details)

**Query Logic:**
```sql
-- Get all oversight assignments for an event
SELECT 
  u.name,
  u.role,
  p.position_name,
  ea.shift_start,
  ea.shift_end
FROM event_assignments ea
JOIN users u ON ea.user_id = u.id
JOIN positions p ON ea.position_id = p.id
WHERE ea.event_id = '[event-id]'
  AND u.role IN ('OVERSEER', 'ASSISTANT_OVERSEER', 'KEYMAN')
ORDER BY u.role, p.position_number;
```

---

## 📱 User Interface

### **Navigation:**
```
Event Dashboard
├── Overview
├── Positions
├── Volunteers
├── Oversight ← NEW
├── Announcements
└── Documents
```

### **Oversight Dashboard Layout:**

```
┌─────────────────────────────────────────────────────┐
│ Event Oversight Dashboard                           │
│ Weekend Convention 2026                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Coverage Statistics:                                │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ ████████████████████████░░░░░░ 85%                 │
│                                                     │
│ 17 of 20 positions have oversight assigned         │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 🔵 Overseers (5)                                   │
│ ┌─────────────────────────────────────────────┐   │
│ │ John Smith                                   │   │
│ │ Main Entrance (Post #1-3)                   │   │
│ │ Saturday 9:00 AM - 12:00 PM                 │   │
│ └─────────────────────────────────────────────┘   │
│ ...                                                 │
│                                                     │
│ 🟢 Assistant Overseers (3)                         │
│ ┌─────────────────────────────────────────────┐   │
│ │ Sarah Williams                               │   │
│ │ Main Entrance (Post #2)                     │   │
│ │ Saturday 9:00 AM - 12:00 PM                 │   │
│ └─────────────────────────────────────────────┘   │
│ ...                                                 │
│                                                     │
│ 🟡 Keymen (4)                                      │
│ ┌─────────────────────────────────────────────┐   │
│ │ Robert Miller                                │   │
│ │ Main Entrance (Post #1)                     │   │
│ │ Saturday 9:00 AM - 12:00 PM                 │   │
│ └─────────────────────────────────────────────┘   │
│ ...                                                 │
│                                                     │
│ ⚠️ Coverage Gaps (3)                               │
│ • Post #15 - Parking Area                          │
│ • Post #18 - Upper Concourse                       │
│ • Post #20 - Emergency Exit                        │
│                                                     │
│ [Export PDF] [Export Excel]                        │
└─────────────────────────────────────────────────────┘
```

---

## ✅ Success Metrics

- **Visibility:** 80%+ of coordinators view oversight dashboard before events
- **Coverage:** 90%+ of positions have oversight assigned
- **Planning:** 50% reduction in "who's the overseer?" questions
- **Adoption:** Feature used for 70%+ of events

---

## 🚀 Implementation Timeline

### **Week 1: Core Dashboard**
- Day 1-2: Oversight API endpoint
- Day 3-4: Dashboard page UI
- Day 5: Coverage statistics and gaps detection
- Day 6-7: Testing and refinement

### **Week 2: Integration & Filters**
- Day 1-2: Oversight coverage card for event dashboard
- Day 3-4: Role filters on positions page
- Day 5: Navigation integration
- Day 6-7: Testing and polish

### **Week 3: Export & Documentation**
- Day 1-2: PDF export functionality
- Day 3-4: Excel export functionality
- Day 5: Help documentation
- Day 6-7: Final testing and deployment

---

## 🧪 Testing Checklist

- [ ] Oversight dashboard loads for event
- [ ] Shows correct count of overseers, assistants, keymen
- [ ] Coverage percentage calculates correctly
- [ ] Coverage gaps identified accurately
- [ ] Role filter works on positions page
- [ ] Coverage card displays on event dashboard
- [ ] PDF export generates correctly
- [ ] Excel export includes all data
- [ ] Navigation link appears for appropriate roles
- [ ] Help documentation is clear and helpful

---

## 📝 Notes

**Why this is better than original Phase 5:**
- ✅ Simpler to implement (3-4 weeks vs 8-10 weeks)
- ✅ Focused on immediate need (event planning)
- ✅ No new database tables required
- ✅ Uses existing assignment data
- ✅ Easier to understand and use
- ✅ Delivers value faster

**What we're NOT building:**
- ❌ Global oversight relationships
- ❌ Oversight teams and hierarchies
- ❌ Delegation chains
- ❌ Organization-wide tracking
- ❌ Complex oversight assignment workflows

**Future consideration:**
If global oversight management is needed later, it can be added as Phase 9 or 10, but current feedback suggests event-specific view is sufficient.

---

## 🎨 Branding Task (Included in Phase 5B)

### **Logo & Favicon Design**

**Goal:** Create professional TheoShift branding

**Deliverables:**
1. TheoShift logo (SVG, PNG)
2. Favicon (multiple sizes)
3. Update all branding references
4. Add logo to navigation header
5. Update help pages with logo

**Duration:** 1-2 days (can be done in parallel)

**Files to Create:**
- `/public/logo.svg`
- `/public/logo.png`
- `/public/favicon.ico`
- `/public/favicon-16x16.png`
- `/public/favicon-32x32.png`
- `/public/apple-touch-icon.png`

**Files to Modify:**
- `/pages/_app.tsx` - Add logo to header
- `/public/manifest.json` - Update icons
- `/pages/_document.tsx` - Update favicon links

---

**Ready to begin implementation?**
