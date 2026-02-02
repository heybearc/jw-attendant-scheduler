# TheoShift Development Priorities

**Last Updated:** February 2, 2026  
**Current Version:** v3.8.2 (production)  
**Status:** Active planning

---

## 🎯 IMMEDIATE PRIORITIES (This Week)

### 1. Complete Permissions Refactor Release
**Status:** Code deployed to STANDBY, needs testing and release  
**Priority:** HIGH  
**Effort:** 2-4 hours

**Tasks:**
- [ ] Test permissions page on STANDBY (http://blue.theoshift.com)
- [ ] Verify 3-role system works (ADMIN, COORDINATOR, VIEWER)
- [ ] Test granting/editing/removing permissions
- [ ] Run `/bump` to create v3.9.0
- [ ] Run `/test-release` on STANDBY
- [ ] Run `/release` to switch traffic
- [ ] Run database migration on LIVE (GREEN)
- [ ] Run `/sync` to update STANDBY

**What Changed:**
- Simplified from 5 roles to 3 roles
- OWNER → ADMIN
- MANAGER/OVERSEER/KEYMAN → COORDINATOR
- VIEWER → VIEWER (unchanged)
- Removed ~100 lines of scope-checking logic

**Files:**
- `PERMISSIONS-REFACTOR-STATUS.md` - Full deployment guide
- `scripts/migrate-event-permissions-v2.sql` - Database migration

---

## 📋 SHORT-TERM PRIORITIES (Next 2-4 Weeks)

### 2. Help Documentation Audit & Update
**Status:** Backlog  
**Priority:** MEDIUM  
**Effort:** 8-12 hours  
**Source:** BACKLOG.md

**Issues:**
- Some help pages return 404 errors
- Documentation doesn't reflect Phase 4C, 5B, 7 features
- Need to verify all help page links work
- Content may reference old terminology

**Scope:**
1. Fix 404 errors on help pages
2. Update content for recent features:
   - Assignment notifications, templates, confirmations (Phase 4C)
   - Event oversight dashboard (Phase 5B)
   - Mobile optimization, PWA features (Phase 7)
   - Terminology updates (attendant → volunteer)
3. Verify accuracy and update screenshots
4. Add help pages for mobile features

**Help Pages to Audit (17 pages):**
- `/help` - Help center index
- `/help/getting-started`
- `/help/event-management`
- `/help/volunteer-management`
- `/help/managing-assignments`
- `/help/assignment-notifications` (NEW)
- `/help/count-times`
- `/help/department-templates`
- `/help/position-templates`
- `/help/filter-presets`
- `/help/session-management`
- `/help/event-oversight` (NEW)
- `/help/mobile-features` (NEW - needs creation)
- `/help/troubleshooting`
- `/help/feedback`
- `/help/my-feedback`

---

### 3. Email Content Refinement
**Status:** Backlog  
**Priority:** MEDIUM  
**Effort:** 4-6 hours  
**Source:** BACKLOG.md

**Description:**
Assignment notification emails are functional but need content refinement for clarity, tone, and user experience.

**Improvements Needed:**
- Review and refine email copy for clarity
- Ensure messaging aligns with organizational voice
- Add missing information volunteers might need
- Improve formatting and visual hierarchy
- Review subject lines for clarity

**Files:**
- `src/lib/assignmentEmails.ts` - Email templates
- `pages/api/events/[id]/assignments/send-notifications.ts`

**Notes:**
- Email functionality works correctly
- This is content/UX improvement, not technical fix
- Should be reviewed with stakeholders

---

### 4. Mobile Bottom Navigation Expansion
**Status:** Backlog  
**Priority:** MEDIUM  
**Effort:** 4-6 hours  
**Source:** BACKLOG.md

**Description:**
Bottom navigation was added to EventLayout, AdminLayout, and HelpLayout but may not appear consistently on all pages.

**Tasks:**
- Audit all page layouts (check pages without layouts)
- Verify bottom nav appears on admin pages
- Verify bottom nav appears on help pages
- Test on actual mobile devices
- Consider adding to volunteer-facing pages
- Ensure proper z-index and positioning

**Files:**
- `/components/BottomNav.tsx`
- `/components/AdminLayout.tsx`
- `/components/HelpLayout.tsx`
- `/components/EventLayout.tsx`

---

### 5. Admin Pages Mobile Optimization
**Status:** Backlog  
**Priority:** MEDIUM  
**Effort:** 12-16 hours  
**Source:** BACKLOG.md

**Description:**
Admin portal pages need comprehensive mobile optimization. Tables, forms, and complex UI need to be responsive and touch-friendly.

**Tasks:**
- Optimize admin tables for mobile (users, departments, sessions)
- Make admin forms touch-friendly
- Improve navigation on mobile admin pages
- Add mobile-specific layouts where needed
- Test all admin workflows on mobile devices
- Consider simplified mobile admin views

**Files:**
- `/pages/admin/*.tsx`
- `/components/AdminLayout.tsx`

**Notes:**
- Admin pages currently desktop-focused
- Mobile admin use case is secondary but important
- May require significant refactoring

---

## 🔮 MEDIUM-TERM PRIORITIES (Next 1-3 Months)

### 6. Phase 8: Advanced Volunteer Features
**Status:** Planned (ROADMAP.md)  
**Priority:** MEDIUM  
**Effort:** 4-5 weeks  
**Target Version:** v3.10.0+

**Features:**

1. **Photo Management**
   - Upload and display volunteer photos
   - Photo-based selection interface
   - Integration with user profile photos

2. **Skills & Certifications**
   - Track volunteer skills and certifications
   - Skill-based assignment recommendations
   - Certification expiration tracking
   - Training completion tracking

3. **Enhanced Bulk Operations**
   - Bulk photo uploads
   - Bulk certification updates
   - Bulk skill assignments
   - Advanced bulk export options

4. **Communication Tools**
   - In-app messaging
   - Group messaging by department
   - Announcement system
   - SMS integration (optional)

**Notes:**
- Requires detailed specification phase
- User research needed for priority features
- May be split into sub-phases

---

## 🐛 TECHNICAL DEBT

### TD-001: Database Column Renaming (Attendant → Volunteer)
**Status:** Pending  
**Priority:** LOW  
**Effort:** 4-6 hours  
**Source:** TECH-DEBT.md

**Description:**
Database still uses "attendant" terminology while code uses "volunteer". Currently bridged via Prisma `@map` directives.

**Why This is Debt:**
- Database schema doesn't match code terminology
- Every schema change requires remembering the mapping
- Minor overhead from mapping layer
- Documentation confusion

**Cleanup Steps:**
1. Create database migration to rename tables/columns
2. Update Prisma schema (remove @map directives)
3. Generate new Prisma client
4. Test migration on STANDBY
5. Deploy to production

**Prerequisites:**
- All current features stable
- No active development on volunteer features
- Database backup created
- Migration tested on staging

**Notes:**
- Optional but recommended for maintainability
- No user-facing changes (purely internal)
- Can be done during any maintenance window

---

## 📊 DEFERRED ITEMS

### Phase 6: Reporting & Analytics
**Status:** Deferred indefinitely  
**Rationale:** Current reporting capabilities sufficient

**Features Deferred:**
- Assignment history & analytics
- Event reports (attendance trends, fill rates)
- Volunteer reports (individual history, patterns)
- Department reports (usage, effectiveness)
- Enhanced export & scheduling

**May be reconsidered if user demand increases.**

---

### Phase 4C Features (Deferred)
**Status:** Deferred indefinitely  
**Rationale:** Not needed - existing workflows sufficient

**Features Deferred:**
- Assignment update notifications (handled manually)
- Automatic reminder scheduling (manual send sufficient)
- Coordinator availability dashboard (handled via Volunteers page)
- Dedicated availability management page (existing workflow works)
- Template integration into positions workflow (clone event handles this)

---

## 🎯 STRATEGIC PRIORITIES (2026)

### Focus Areas
1. **Assignment Automation** - Reduce manual coordination ✅ (Phase 4C complete)
2. **Oversight Management** - Complete oversight system ✅ (Phase 5B complete)
3. **Mobile Access** - Enable on-the-go management ✅ (Phase 7 complete)
4. **Data Insights** - Provide actionable analytics ⏸️ (Deferred)

### Key Principles
- **Simplicity First** - Keep UI clean and intuitive
- **Data Integrity** - Never compromise on accuracy
- **Performance** - Fast, responsive, reliable
- **Backward Compatible** - Protect existing workflows
- **Control Plane Governance** - Leverage Cloudy-Work infrastructure

---

## 📅 RELEASE SCHEDULE

| Version | Focus | Status | Target Date |
|---------|-------|--------|-------------|
| v3.8.2 | Bug fixes (user invitation) | ✅ Released | Feb 1, 2026 |
| v3.9.0 | Permissions refactor | 🚧 In testing | Feb 3-4, 2026 |
| v3.10.0 | Help docs + mobile polish | 📅 Planned | Feb 10-17, 2026 |
| v3.11.0+ | Phase 8 features | 📅 Future | Mar 2026+ |

---

## 🔄 PRIORITY REVIEW PROCESS

### Review Cadence
- **Weekly:** Update priorities based on progress
- **Monthly:** Review backlog and user feedback
- **Quarterly:** Major roadmap updates

### Feedback Sources
- In-app feedback system
- User surveys and interviews
- Support tickets and issues
- Usage analytics
- Direct stakeholder input

### Change Process
1. Gather feedback and requirements
2. Evaluate technical feasibility
3. Prioritize against strategic goals
4. Update PRIORITIES.md with rationale
5. Communicate changes to stakeholders

---

## 📝 NOTES

### Current State
- **Production Version:** v3.8.2
- **STANDBY Version:** v3.8.2 (with permissions refactor)
- **Phase 7 Complete:** Mobile optimization deployed
- **Phase 8 Status:** Specification phase

### Known Issues
- None critical
- 3 tests skipped (features not yet implemented)
- Command execution failures resolved (Windsurf restart)

### Recent Accomplishments
- ✅ Phase 7 complete (mobile optimization, PWA, performance)
- ✅ MCP traffic switching bug fixed
- ✅ Legacy domain migration complete
- ✅ Permissions refactor code complete

---

**This is the single source of truth for TheoShift development priorities.**

**Next Review:** February 9, 2026  
**Maintained By:** Development Team  
**Version:** 1.0
