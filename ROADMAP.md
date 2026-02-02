# TheoShift Product Roadmap

**Last Updated:** February 2, 2026  
**Current Version:** v3.8.2 (production)  
**Status:** Active - Permissions refactor in testing, planning Phase 8

> **📋 For detailed priorities and short-term tasks, see [`PRIORITIES.md`](./PRIORITIES.md)**

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

### **Phase 5B: Event Oversight Dashboard** ✅ (Jan 2026, v3.6.0)
**Completed Features:**

1. **Event Oversight Dashboard**
   - View all overseers, assistant overseers, and keymen assignments
   - Coverage statistics with visual indicators
   - Coverage gap detection
   - PDF and Excel export functionality

2. **Professional Branding**
   - TheoShift logo and favicon design
   - Updated navigation headers
   - Consistent branding across application

3. **Email Notification System**
   - Password reset emails
   - User invitation emails
   - Document publish notifications
   - Feedback submission notifications
   - Database-driven email configuration

4. **Bulk Operations API**
   - Bulk update endpoint for volunteer status
   - Bulk delete endpoint with safety checks
   - Integrated into service layer

5. **Integration Features**
   - Oversight coverage card on event dashboard
   - Role filters on positions page
   - Navigation links to oversight dashboard
   - Comprehensive help documentation

**Technical Implementation:**
- No new database tables required (uses existing data)
- Export utilities using jsPDF and XLSX libraries
- Email templates with HTML and plain text versions
- Background email processing
- All features tested and verified (23/23 tests passing)

---

### **Phase 7: Mobile Optimization** ✅ (Jan 2026, v3.8.0)
**Completed Features:**

1. **Mobile Volunteer Dashboard**
   - 4 tabs: Assignments, Availability, Contacts, Documents
   - Documents tab for viewing published documents
   - Sign out button in header
   - Touch-optimized UI (44px minimum targets)

2. **Progressive Web App (PWA)**
   - Install to home screen capability
   - Offline support with service worker
   - App manifest for native-like experience
   - PWA usage guide for users

3. **Performance Optimization**
   - 54% bundle size reduction on event pages
   - Lazy loading for QR codes and mobile components
   - Loading skeletons and touch feedback
   - Chrome mobile login fixes
   - Volunteer redirect fixes

4. **Mobile Navigation**
   - Hamburger menu with slide-out drawer
   - Fixed bottom navigation bar
   - Auto-close menu on route change
   - Body scroll lock when menu open
   - Role-based navigation filtering
   - Context-aware deep linking

**Technical Implementation:**
- Mobile-first CSS utilities
- Safe area insets for iPhone notch
- Touch-friendly 44px tap targets
- Responsive layouts across all pages
- All features tested and verified

---

### **Permissions Refactor** 🚧 (Feb 2026, v3.9.0 - In Testing)
**Status:** Code deployed to STANDBY, database migrated, awaiting testing and release

**What Changed:**
- Simplified from 5 roles to 3 roles
- OWNER → ADMIN (full control)
- MANAGER/OVERSEER/KEYMAN → COORDINATOR (day-to-day management)
- VIEWER → VIEWER (read-only, unchanged)
- Removed ~100 lines of scope-checking logic
- Removed scope-based restrictions

**Database Migration:**
- 13 OWNER → ADMIN records migrated
- 8 MANAGER → COORDINATOR records migrated
- 0 OVERSEER/KEYMAN (none existed)

**Benefits:**
- Clearer role separation
- Matches actual usage patterns
- Easier to explain and understand
- Simpler codebase

---

## 🚀 ACTIVE DEVELOPMENT

### **Current Work:**
- Testing permissions refactor on STANDBY
- Planning Phase 8 features
- Help documentation audit

---

## 📅 PLANNED PHASES

### **Phase 5B: Event Oversight Dashboard** ✅ **COMPLETED** (Jan 2026, v3.6.0)
**Duration:** 3 weeks  
**Status:** Deployed to production

#### **Goals:**
Simple event-specific oversight dashboard showing which overseers, assistants, and keymen are assigned to positions for each event, helping with event planning and coverage verification.

#### **Key Change from Original Phase 5:**
**Original:** Complex global oversight management system with teams, hierarchies, and organization-wide tracking  
**Revised:** Simple event-focused dashboard using existing assignment data

#### **Features:**

1. **Event Oversight Dashboard**
   - View all overseers assigned to positions in an event
   - View all assistant overseers and keymen
   - Coverage statistics (% of positions with oversight)
   - Visual indicators for coverage gaps
   - Export to PDF/Excel

2. **Oversight Role Filtering**
   - Filter positions page by oversight roles
   - Quick view of oversight distribution
   - Helps with assignment planning

3. **Oversight Statistics Card**
   - Small card on event dashboard showing coverage %
   - Link to full oversight dashboard
   - Quick visibility of oversight status

4. **Integration Features**
   - Uses existing `event_assignments` and `users` tables
   - No new database tables required
   - Leverages existing role field (OVERSEER, ASSISTANT_OVERSEER, KEYMAN)

#### **Branding Task (Included):**
- Logo & favicon design (1-2 days)
- Professional TheoShift branding
- Update navigation header and help pages

#### **Database Schema:**
- **No new tables needed!** Uses existing data
- Query existing `event_assignments` filtered by user roles
- Simple and maintainable

#### **Success Metrics:**
- 80%+ of coordinators view oversight dashboard before events
- 90%+ of positions have oversight assigned
- 50% reduction in "who's the overseer?" questions
- 70%+ feature adoption rate

---

### **Phase 6: Reporting & Analytics** 📊 **DEFERRED INDEFINITELY**
**Target Version:** N/A  
**Status:** Deferred - Not needed at this time

#### **Rationale for Deferral:**
Current reporting capabilities are sufficient for user needs:
- Basic event statistics available on dashboards
- Export functionality (PDF/Excel) implemented in Phase 5B
- Count Times module provides attendance tracking
- Users have not requested advanced analytics

#### **Features Deferred:**

1. **Assignment History & Analytics**
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

**May be reconsidered if user demand increases.**

---

### **Phase 8: Advanced Volunteer Features** 👥 **PLANNED**
**Target Version:** v3.10.0+  
**Estimated Duration:** 4-5 weeks  
**Status:** Specification phase - awaiting prioritization

**Note:** See `PRIORITIES.md` for detailed priority breakdown and short-term tasks

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

1. ~~**Email Notifications**~~ ✅ **RESOLVED in v3.6.0**
   - ✅ Password reset email implemented
   - ✅ User invitation email implemented
   - ✅ Password reset button implemented
   - ✅ Document publish notifications implemented
   - ✅ Feedback submission notifications implemented

2. ~~**Bulk Operations API**~~ ✅ **RESOLVED in v3.6.0**
   - ✅ Proper bulk update API implemented
   - ✅ Proper bulk delete API implemented

3. **Code Quality** (Low Priority)
   - Phone number formatting uses placeholder "XXX" pattern (acceptable, working as intended)
   - Some console.log statements could be replaced with proper logging (non-critical)
   - TypeScript lint warnings in legacy code (non-blocking, isolated to specific files)

**No critical or high-priority technical debt remaining.**

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
| Q1 2026 | v3.4.0 | Assignment Workflows (Phase 4C) | ✅ Complete |
| Q1 2026 | v3.5.x | Session Management & Terminology | ✅ Complete |
| Q1 2026 | v3.6.0 | Oversight Dashboard & Branding (Phase 5B) | ✅ Complete |
| Q1 2026 | v3.7.0-v3.8.0 | Mobile Optimization (Phase 7) | ✅ Complete |
| Q1 2026 | v3.8.1-v3.8.2 | Bug Fixes & Polish | ✅ Complete |
| Q1 2026 | v3.9.0 | Permissions Refactor | 🚧 In Testing |
| Q1 2026 | v3.10.0 | Help Docs + Mobile Polish | 📅 Planned |
| Q2 2026+ | v3.11.0+ | Advanced Features (Phase 8) | 📅 Future |

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

**This is the authoritative strategic roadmap for TheoShift. All other roadmap documents have been archived.**

**For tactical priorities and backlog items, see:** `PRIORITIES.md`

**Next Review:** February 9, 2026  
**Maintained By:** Development Team  
**Version:** 2.1 (Updated Feb 2, 2026)
