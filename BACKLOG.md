# TheoShift Backlog

## Email Content Refinement

### Assignment Notification Emails
**Priority:** Medium  
**Status:** Backlog  
**Date Added:** 2026-01-30

**Description:**
The assignment notification emails are functional but need content refinement and updates to improve clarity, tone, and user experience.

**Current State:**
- Basic notification emails are working (created, updated, cancelled, reminder)
- Email templates exist in `src/lib/assignmentEmails.ts`
- Emails are sent via nodemailer using database-stored SMTP configuration

**Improvements Needed:**
- Review and refine email copy for clarity and tone
- Ensure messaging aligns with organizational voice
- Add any missing information volunteers might need
- Improve formatting and visual hierarchy
- Consider adding more context or helpful links
- Review subject lines for clarity

**Related Files:**
- `src/lib/assignmentEmails.ts` - Email template generation
- `pages/api/events/[id]/assignments/send-notifications.ts` - Bulk notification sending
- `pages/api/assignments/notify.ts` - Individual notification endpoint

**Notes:**
- Email functionality is working correctly
- This is a content/UX improvement, not a technical fix
- Should be reviewed with stakeholders for preferred messaging style

---

## Help Documentation Audit & Update

**Priority:** Medium  
**Status:** Backlog  
**Date Added:** 2026-01-31

**Description:**
Comprehensive audit of all help documentation pages to fix 404 errors and update content to reflect recent feature additions and changes.

**Issues Identified:**
- Some help pages return 404 errors
- Documentation may not reflect recent features (Phase 4C, Phase 5B, Phase 7)
- Need to verify all help page links are working
- Content may reference old terminology or outdated workflows

**Scope:**
1. **Fix 404 Errors:**
   - Audit all help page routes
   - Fix broken links in help navigation
   - Verify all referenced pages exist

2. **Update Content for Recent Features:**
   - Phase 4C: Assignment notifications, templates, volunteer confirmation
   - Phase 5B: Event oversight dashboard
   - Phase 7: Mobile optimization, PWA features
   - Terminology updates (attendant → volunteer)

3. **Content Review:**
   - Verify accuracy of existing documentation
   - Update screenshots if needed
   - Check for outdated references
   - Ensure consistent branding (TheoShift)

**Help Pages to Audit:**
- `/help` - Help center index
- `/help/getting-started` - Getting started guide
- `/help/event-management` - Event management
- `/help/volunteer-management` - Volunteer management
- `/help/managing-assignments` - Assignment management
- `/help/assignment-notifications` - Assignment notifications (NEW)
- `/help/count-times` - Count times
- `/help/department-templates` - Department templates
- `/help/position-templates` - Position templates
- `/help/filter-presets` - Saved filters
- `/help/session-management` - Session management
- `/help/event-oversight` - Event oversight (NEW)
- `/help/troubleshooting` - Troubleshooting
- `/help/feedback` - Send feedback
- `/help/my-feedback` - My feedback

**Related Files:**
- `/pages/help/*.tsx` - All help page components
- `/components/HelpLayout.tsx` - Help page layout wrapper

**Notes:**
- This is a documentation maintenance task
- Should be done before next major release
- Consider adding help pages for new Phase 7 mobile features
