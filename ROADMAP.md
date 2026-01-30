# TheoShift Product Roadmap

**Last Updated:** January 30, 2026  
**Current Version:** v3.5.1  
**Status:** Active Development

---

## 🎯 Vision

Transform TheoShift from a single-purpose attendant management system into a comprehensive volunteer coordination platform supporting **all departments** at theocratic events with intelligent automation, robust oversight management, and data-driven insights.

---

## ✅ COMPLETED WORK (v3.0.0 - v3.3.1)

### **Phase 0: Infrastructure Migration** ✅ (Dec 2025)
- Rebranded from "JW Attendant Scheduler" to "TheoShift"
- Migrated to new domain: `theoshift.com`
- Blue-green deployment architecture
- Database migration to `theoshift_scheduler`

### **Phase 1: Event Creation Enhancements** ✅ (Dec 2025)
- Fixed event creation validation
- Department template dropdown
- Parent event dropdown for hierarchies
- Improved error handling

### **Phase 2: Hierarchical Events** ✅ (Dec 2025)
- Child events view on parent dashboard
- Event relationships display
- Simplified single-department-per-event architecture

### **Phase 3A: Enhanced Department Template System** ✅ (Jan 2026)
- Module configuration system (Count Times, Lanyards, Positions)
- Custom fields designer with 8 field types
- Terminology overrides per department
- Position templates library
- Template builder UI (`/admin/departments`)

### **Phase 3B: Dynamic Event Experience** ✅ (Jan 2026)
- Dynamic event dashboard based on template modules
- Template-driven event creation
- Smart navigation with module visibility
- TemplateProvider context system

### **Phase 3C: Volunteer Management Enhancements** ✅ (Jan 2026)
- Advanced search & filtering (name, email, phone, roles)
- Saved filter presets
- Bulk operations (status updates, role assignments, delete)

### **Phase 4A: Enhanced Position Management** ✅ (Jan 2026)
- Visual position grid view with time slots
- Conflict detection and highlighting
- Alternative attendant suggestions
- Grid/List view toggle

### **Phase 4B: Code Refactoring** ✅ (Jan 2026)
- 6 custom hooks extracted (828 lines)
- 6 reusable components created (845 lines)
- 29.7% code reduction (1,160 lines removed)
- 26 automated tests added

### **Repository Cleanup** ✅ (Jan 2026, v3.3.1)
- 88 files cleaned up (removed or archived)
- 27 remote branches deleted
- Standardized admin credentials
- Updated infrastructure references
- Comprehensive documentation

### **Phase 4C: Assignment Workflow Enhancements** ✅ (Jan 2026, v3.5.0)
**Completed Features:**

1. **Assignment Notifications** 📧
   - Email notifications for new assignments
   - Assignment cancellation notifications
   - Manual "Send Notifications" button on positions page
   - Notification settings in admin panel
   - Email template system
   - Direct email sending via nodemailer

2. **Assignment Templates** 📋
   - Save position structures and time slot patterns
   - Template library per department (CRUD operations)
   - Template creation from scratch
   - Template editing and deletion
   - Apply template to events via API
   - Admin UI for template management

3. **Volunteer Confirmation System** 🔄
   - Bulk availability requests via email
   - Token-based confirmation (one-click responses)
   - Volunteer availability response page
   - Assignment status badges
   - Email confirmation integration
   - Managed via existing Volunteers page and volunteer dashboard

4. **Event Permissions Cloning** 🔐
   - Clone event permissions when cloning events
   - Maintains access control consistency

**Features Deferred Indefinitely:**
- ⏸️ Assignment update notifications (not needed - handled manually)
- ⏸️ Automatic reminder scheduling system (not needed - manual send sufficient)
- ⏸️ Coordinator availability dashboard (not needed - handled via Volunteers page)
- ⏸️ Dedicated availability management page (not needed - existing workflow sufficient)
- ⏸️ Template integration into positions workflow (not needed - clone event handles this)
- ⏸️ Assignment history & analytics (deferred to Phase 6)

**Technical Implementation:**
- Database schema: 100% complete (4 tables, confirmation fields)
- Assignment templates: 100% complete (full CRUD, apply API)
- Volunteer availability: 100% complete (bulk requests, email responses)
- Assignment notifications: 90% complete (create/cancel working, update/reminders deferred)
- Event permissions cloning: 100% complete

### **Terminology Refactor** ✅ (Jan 2026, v3.5.0)
- 6-phase attendant→volunteer refactor
- Server-side redirects for old routes
- New /volunteers API endpoints
- Updated frontend and API variables
- Type definitions updated
- Help documentation updated
- Backward compatible via @map directives

### **Testing Infrastructure** ✅ (Jan 2026, v3.5.1)
- Fixed all Playwright test failures (23/23 passing)
- Centralized test configuration
- Archived diagnostic tests
- Created comprehensive testing policy
- 100% pass rate on production tests

---

## 🚀 ACTIVE DEVELOPMENT

**No active development phases.** Ready for Phase 5 or new feature work

---

## 📅 PLANNED PHASES

### **Phase 5: Oversight Management Module** 📋 **HIGH PRIORITY**
**Target Version:** v3.5.0  
**Estimated Duration:** 8-10 weeks  
**Status:** Specification complete

#### **Goals:**
Dedicated module for managing oversight relationships between Overseers, Overseer Assistants, Keymen, and supervised attendants.

#### **Features:**

1. **Oversight Assignment Management**
   - Individual and bulk oversight assignments
   - Event-specific vs global oversight
   - Delegation chain tracking
   - Assignment history and audit trail

2. **Oversight Team Management**
   - Team creation with leads, assistants, and keymen
   - Responsibility area definition
   - Team hierarchies
   - Load balancing tools

3. **Oversight Dashboard**
   - Visual relationship mapping
   - Coverage gap identification
   - Workload distribution analytics
   - Team performance metrics

4. **Integration Features**
   - Position assignment blocking for oversight roles
   - Attendant filtering by oversight status
   - Event planning integration
   - Compliance reporting

#### **Database Schema:**
- `oversight_assignments` table (event-specific and global)
- `oversight_teams` table
- Complex many-to-many relationships
- Performance indexes

#### **Success Metrics:**
- 100% of attendants have appropriate oversight
- No overseer manages more than 15 attendants
- 99%+ accuracy in oversight relationships
- 90%+ event adoption rate
- 60% reduction in manual coordination

---

### **Phase 6: Reporting & Analytics** 📊 **PLANNED**
**Target Version:** v3.6.0  
**Estimated Duration:** 4-5 weeks  
**Status:** Requirements gathering

#### **Features:**

1. **Assignment History & Analytics** (Deferred from Phase 4C)
   - Track all assignment changes (create/update/cancel)
   - User attribution (who made changes)
   - Field-level change tracking
   - Assignment completion tracking
   - Historical performance metrics

2. **Event Reports**
   - Attendance tracking and trends
   - Position fill rates over time
   - Volunteer participation rates
   - Department utilization statistics
   - Count Times analytics (expand existing)

3. **Volunteer Reports**
   - Individual volunteer history
   - Serving role distribution
   - Availability patterns
   - Performance metrics
   - Assignment frequency analysis

4. **Department Reports**
   - Department usage across events
   - Template effectiveness metrics
   - Volunteer distribution by department
   - Capacity planning insights
   - Module utilization statistics

5. **Export & Scheduling**
   - Enhanced PDF reports with charts
   - Enhanced Excel exports with raw data
   - CSV for external analysis
   - Scheduled report generation
   - Custom report builder

#### **Success Metrics:**
- 80% of coordinators use reports monthly
- 30% improvement in capacity planning
- Data-driven decision making adoption
- 100% of assignment changes logged

---

### **Phase 7: Mobile Optimization** 📱 **PLANNED**
**Target Version:** v3.7.0  
**Estimated Duration:** 5-6 weeks  
**Status:** Research phase

#### **Features:**

1. **Mobile UI Enhancements**
   - Touch-friendly controls
   - Mobile-optimized navigation
   - Responsive tables and grids
   - Gesture support (swipe, pinch)

2. **Progressive Web App (PWA)**
   - Install to home screen
   - Push notifications
   - Offline data access
   - Background sync

3. **Mobile-Specific Features**
   - Quick check-in interface
   - Mobile volunteer lookup
   - QR code scanning for check-in
   - Location-based features

4. **Performance Optimization**
   - Optimized for mobile networks
   - Reduced data usage
   - Fast load times (<3 seconds)
   - Cached resources

#### **Success Metrics:**
- 50% of users access via mobile
- 4.5+ rating on mobile usability
- <3 second load time on mobile networks

---

### **Phase 8: Advanced Attendant Features** 👥 **PLANNED**
**Target Version:** v3.8.0  
**Estimated Duration:** 4-5 weeks  
**Status:** Specification in progress

#### **Features:**

1. **Photo Management**
   - Upload and display attendant photos
   - Photo-based selection interface
   - Integration with user profile photos

2. **Skills & Certifications**
   - Track attendant skills and certifications
   - Skill-based assignment recommendations
   - Certification expiration tracking
   - Training completion tracking

3. **Enhanced Bulk Operations** (Expand Phase 3C)
   - Bulk photo uploads
   - Bulk certification updates
   - Bulk skill assignments
   - Advanced bulk export options

4. **Communication Tools**
   - In-app messaging
   - Group messaging by department
   - Announcement system
   - SMS integration (optional)

---

## 🔮 FUTURE CONSIDERATIONS (2027+)

### **Phase 9: Integration & Automation**
- Calendar integration (Google Calendar, Outlook)
- External scheduling system integration
- AI-powered assignment suggestions
- Congregation management system integration
- Automated conflict resolution

### **Phase 10: Advanced Platform Features**
- Multi-language support (Spanish, Portuguese, etc.)
- Custom branding per organization
- White-label deployment options
- Advanced audit logging and compliance
- Data retention policies
- GDPR compliance tools

### **Phase 11: Enterprise Features**
- Multi-tenant architecture
- Organization hierarchy support
- Circuit-level coordination
- Regional reporting and analytics
- Advanced security features
- SSO/SAML integration

---

## 🐛 KNOWN ISSUES & TECHNICAL DEBT

### **Critical Issues**
None currently identified.

### **High Priority Bugs**
None currently identified.

### **Medium Priority Issues**

1. **Test Failures** (3 pre-existing, non-blocking)
   - Position management test (expects event selection)
   - Refactoring validation test (expects event selection)
   - User management test (CSS selector syntax error)

### **Technical Debt**

1. **Email Notifications** (9 TODO comments in code)
   - Password reset email (`/api/admin/users/[id].ts`)
   - User invitation email (`/api/admin/users/index.ts`)
   - Password reset button (`/admin/users/[id]/edit.tsx`)
   - Document publish notifications (`/api/events/[id]/documents/[documentId]/publish.ts`)
   - Feedback submission notifications (`/api/feedback/submit.ts`)

2. **Bulk Operations API** (2 TODO comments)
   - Proper bulk update API (`eventAttendantService.ts`)
   - Proper bulk delete API (`useEventAttendants.ts`)

3. **Code Quality**
   - Phone number formatting uses placeholder "XXX" pattern (acceptable)
   - Some console.log statements should be replaced with proper logging

### **Low Priority Enhancements**
- Enhanced error messages
- Additional validation rules
- Performance optimizations for large datasets
- Improved caching strategies

---

## 📊 SUCCESS METRICS

### **User Adoption**
- **Target:** 95% of events using multi-department features by end of 2026
- **Current:** Phase 4B complete, templates fully functional

### **Time Savings**
- **Target:** 60% reduction in manual coordination time
- **Current:** Filter presets and templates providing measurable improvements

### **Data Accuracy**
- **Target:** 99.5%+ accuracy in volunteer tracking
- **Current:** Conflict detection preventing double-booking errors

### **User Satisfaction**
- **Target:** 4.5+ rating on feature usability
- **Current:** Comprehensive help documentation supporting user success

### **System Performance**
- **Target:** Support 1000+ volunteers per event
- **Current:** Architecture supports large-scale events

---

## 🎯 STRATEGIC PRIORITIES

### **2026 Focus Areas**
1. **Assignment Automation** - Reduce manual coordination (Phase 4C, 5)
2. **Oversight Management** - Complete oversight system (Phase 5)
3. **Data Insights** - Provide actionable analytics (Phase 6)
4. **Mobile Access** - Enable on-the-go management (Phase 7)

### **Key Principles**
- **Simplicity First** - Keep UI clean and intuitive
- **Data Integrity** - Never compromise on accuracy
- **Performance** - Fast, responsive, reliable
- **Backward Compatible** - Protect existing workflows
- **Control Plane Governance** - Leverage Cloudy-Work infrastructure

---

## 📅 RELEASE SCHEDULE

| Quarter | Version | Focus | Status |
|---------|---------|-------|--------|
| Q4 2025 | v3.0.x | Infrastructure & Foundation | ✅ Complete |
| Q1 2026 | v3.1.x | Templates & Dynamic UI | ✅ Complete |
| Q1 2026 | v3.2.x | Position Grid & Refactoring | ✅ Complete |
| Q1 2026 | v3.3.x | Repository Cleanup | ✅ Complete |
| Q1 2026 | v3.4.0 | Assignment Workflows (Phase 4C) | 🔄 Next |
| Q2 2026 | v3.5.0 | Oversight Management (Phase 5) | 📅 Planned |
| Q2 2026 | v3.6.0 | Reporting & Analytics (Phase 6) | 📅 Planned |
| Q3 2026 | v3.7.0 | Mobile Optimization (Phase 7) | 📅 Planned |
| Q3 2026 | v3.8.0 | Advanced Attendant Features (Phase 8) | 📅 Planned |

---

## 🔄 ROADMAP GOVERNANCE

### **Review Cadence**
- **Monthly:** Progress review and priority adjustments
- **Quarterly:** Major roadmap updates and user feedback integration
- **Annual:** Strategic direction and long-term planning

### **Feedback Sources**
- In-app feedback system
- User surveys and interviews
- Support tickets and issues
- Usage analytics
- Direct stakeholder input

### **Change Process**
1. Gather feedback and requirements
2. Evaluate technical feasibility
3. Prioritize against strategic goals
4. Update roadmap with rationale
5. Communicate changes to stakeholders

---

## 📞 CONTACT & FEEDBACK

For roadmap questions, feature requests, or feedback:
- Use the "Send Feedback" button in the app
- Contact your system administrator
- Review release notes for detailed changes

---

## 🎉 MAJOR ACCOMPLISHMENTS

### **Infrastructure** ✅
- Blue-green deployment with HAProxy
- Control plane governance (Cloudy-Work)
- Automated testing framework (Playwright)
- Comprehensive help documentation (13 pages)

### **Department System** ✅
- Full module configuration
- Custom fields designer
- Terminology overrides
- Position templates
- Dynamic UI rendering

### **Position Management** ✅
- Grid view with conflict detection
- Bulk operations
- Export functionality (PDF/Excel)
- 29.7% code reduction through refactoring

### **Volunteer Management** ✅
- Advanced search and filtering
- Saved filter presets
- Bulk operations
- Role-based access control

---

**This is the authoritative roadmap for TheoShift. All other roadmap documents have been archived.**

**Next Review:** February 25, 2026  
**Maintained By:** Development Team  
**Version:** 2.0 (Unified)
