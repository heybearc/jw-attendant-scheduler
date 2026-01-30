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
