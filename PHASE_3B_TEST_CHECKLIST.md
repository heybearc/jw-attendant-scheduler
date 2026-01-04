# Phase 3B: Dynamic Event Experience - Test Checklist

**Version:** 3.0.3 (Phase 3B)  
**Test Environment:** STANDBY (10.92.3.22)  
**Access URL:** http://10.92.3.22:3001  
**Date:** December 24, 2024

---

## Pre-Test Setup

### 1. Access STANDBY Environment
- [ ] Navigate to http://10.92.3.22:3001
- [ ] Log in with admin credentials
- [ ] Verify you're on the correct environment

### 2. Create Test Department Templates
Navigate to **Admin → Department Templates** and create:

**Template A: "Test - Full Features"**
- [ ] Name: "Test - Full Features"
- [ ] Module Config:
  - `countTimes: true`
  - `lanyards: true`
  - `positions: true`
- [ ] Save template

**Template B: "Test - Parking (Limited)"**
- [ ] Name: "Test - Parking (Limited)"
- [ ] Module Config:
  - `countTimes: false`
  - `lanyards: false`
  - `positions: true`
- [ ] Save template

**Template C: "Test - Baptism (Partial)"**
- [ ] Name: "Test - Baptism (Partial)"
- [ ] Module Config:
  - `countTimes: false`
  - `lanyards: true`
  - `positions: true`
- [ ] Save template

### 3. Create Test Events
Navigate to **Events → Create Event** and create:

**Event A: "Test Event - Full Features"**
- [ ] Name: "Test Event - Full Features"
- [ ] Assign department template: "Test - Full Features"
- [ ] Set dates and save
- [ ] Note Event ID: ___________

**Event B: "Test Event - Parking"**
- [ ] Name: "Test Event - Parking"
- [ ] Assign department template: "Test - Parking (Limited)"
- [ ] Set dates and save
- [ ] Note Event ID: ___________

**Event C: "Test Event - Baptism"**
- [ ] Name: "Test Event - Baptism"
- [ ] Assign department template: "Test - Baptism (Partial)"
- [ ] Set dates and save
- [ ] Note Event ID: ___________

**Event D: "Test Event - No Template"**
- [ ] Name: "Test Event - No Template"
- [ ] Do NOT assign any department template
- [ ] Set dates and save
- [ ] Note Event ID: ___________

---

## Test Suite 1: Module Visibility

### Test 1.1: Full Features Event (All Modules Enabled)
- [ ] Navigate to Event A detail page
- [ ] **VERIFY:** Count Times link is visible in Quick Actions
- [ ] **VERIFY:** Lanyards link is visible in Quick Actions
- [ ] **VERIFY:** Positions link is visible in Quick Actions
- [ ] **VERIFY:** All other standard links are visible (Attendants, Documents, Announcements)
- [ ] Click Count Times link → **VERIFY:** Page loads successfully
- [ ] Go back, click Lanyards link → **VERIFY:** Page loads successfully
- [ ] Go back, click Positions link → **VERIFY:** Page loads successfully

**Result:** ☐ PASS ☐ FAIL  
**Notes:** _______________________________________________

### Test 1.2: Parking Event (Count Times & Lanyards Disabled)
- [ ] Navigate to Event B detail page
- [ ] **VERIFY:** Count Times link is NOT visible
- [ ] **VERIFY:** Lanyards link is NOT visible
- [ ] **VERIFY:** Positions link IS visible
- [ ] **VERIFY:** Other standard links are visible (Attendants, Documents, Announcements)
- [ ] **VERIFY:** No visual gaps or layout issues from hidden modules

**Result:** ☐ PASS ☐ FAIL  
**Notes:** _______________________________________________

### Test 1.3: Baptism Event (Count Times Disabled, Lanyards Enabled)
- [ ] Navigate to Event C detail page
- [ ] **VERIFY:** Count Times link is NOT visible
- [ ] **VERIFY:** Lanyards link IS visible
- [ ] **VERIFY:** Positions link IS visible
- [ ] Click Lanyards link → **VERIFY:** Page loads successfully
- [ ] Go back, click Positions link → **VERIFY:** Page loads successfully

**Result:** ☐ PASS ☐ FAIL  
**Notes:** _______________________________________________

### Test 1.4: No Template Event (Backward Compatibility)
- [ ] Navigate to Event D detail page
- [ ] **VERIFY:** Count Times link IS visible (default behavior)
- [ ] **VERIFY:** Lanyards link IS visible (default behavior)
- [ ] **VERIFY:** Positions link IS visible
- [ ] Click all links → **VERIFY:** All pages load successfully

**Result:** ☐ PASS ☐ FAIL  
**Notes:** _______________________________________________

---

## Test Suite 2: Module Access Guards (Direct URL Access)

### Test 2.1: Count Times Access Guard - Disabled Module
- [ ] Get Event B ID (Parking event with countTimes disabled)
- [ ] Manually navigate to: `/events/{EventB_ID}/count-times`
- [ ] **VERIFY:** You are redirected back to event detail page
- [ ] **VERIFY:** No error messages displayed
- [ ] **VERIFY:** Redirect happens smoothly

**Result:** ☐ PASS ☐ FAIL  
**Notes:** _______________________________________________

### Test 2.2: Count Times Access Guard - Enabled Module
- [ ] Get Event A ID (Full Features event with countTimes enabled)
- [ ] Manually navigate to: `/events/{EventA_ID}/count-times`
- [ ] **VERIFY:** Page loads successfully
- [ ] **VERIFY:** No redirect occurs

**Result:** ☐ PASS ☐ FAIL  
**Notes:** _______________________________________________

### Test 2.3: Lanyards Access Guard - Disabled Module
- [ ] Get Event B ID (Parking event with lanyards disabled)
- [ ] Manually navigate to: `/events/{EventB_ID}/lanyards`
- [ ] **VERIFY:** You are redirected back to event detail page
- [ ] **VERIFY:** No error messages displayed

**Result:** ☐ PASS ☐ FAIL  
**Notes:** _______________________________________________

### Test 2.4: Lanyards Access Guard - Enabled Module
- [ ] Get Event C ID (Baptism event with lanyards enabled)
- [ ] Manually navigate to: `/events/{EventC_ID}/lanyards`
- [ ] **VERIFY:** Page loads successfully
- [ ] **VERIFY:** No redirect occurs

**Result:** ☐ PASS ☐ FAIL  
**Notes:** _______________________________________________

### Test 2.5: Access Guard - No Template (Backward Compatibility)
- [ ] Get Event D ID (No template event)
- [ ] Manually navigate to: `/events/{EventD_ID}/count-times`
- [ ] **VERIFY:** Page loads successfully (default allows access)
- [ ] Navigate to: `/events/{EventD_ID}/lanyards`
- [ ] **VERIFY:** Page loads successfully (default allows access)

**Result:** ☐ PASS ☐ FAIL  
**Notes:** _______________________________________________

---

## Test Suite 3: UI/UX Quality

### Test 3.1: Visual Consistency
- [ ] Navigate through all test events
- [ ] **VERIFY:** No visual gaps where hidden modules would be
- [ ] **VERIFY:** Button spacing is consistent
- [ ] **VERIFY:** Quick Actions sidebar looks professional
- [ ] **VERIFY:** Icons and emojis display correctly

**Result:** ☐ PASS ☐ FAIL  
**Notes:** _______________________________________________

### Test 3.2: Responsive Design
- [ ] Resize browser window to mobile size (375px width)
- [ ] **VERIFY:** Quick Actions sidebar adapts properly
- [ ] **VERIFY:** All visible buttons are clickable
- [ ] Resize to tablet size (768px width)
- [ ] **VERIFY:** Layout remains functional
- [ ] Return to desktop size
- [ ] **VERIFY:** Layout returns to normal

**Result:** ☐ PASS ☐ FAIL  
**Notes:** _______________________________________________

### Test 3.3: Navigation Flow
- [ ] From Event A, click Count Times
- [ ] Use breadcrumb to return to event detail
- [ ] Click Lanyards
- [ ] Use browser back button
- [ ] **VERIFY:** Navigation works smoothly both ways
- [ ] Click Positions
- [ ] **VERIFY:** All navigation paths work correctly

**Result:** ☐ PASS ☐ FAIL  
**Notes:** _______________________________________________

---

## Test Suite 4: Error Handling

### Test 4.1: Invalid Event ID
- [ ] Navigate to: `/events/invalid-id-12345`
- [ ] **VERIFY:** Appropriate error page or redirect
- [ ] **VERIFY:** No JavaScript console errors

**Result:** ☐ PASS ☐ FAIL  
**Notes:** _______________________________________________

### Test 4.2: Browser Console Check
- [ ] Open browser developer tools (F12)
- [ ] Navigate through all test events
- [ ] Check Console tab
- [ ] **VERIFY:** No JavaScript errors
- [ ] **VERIFY:** No TypeScript errors
- [ ] **VERIFY:** No 404 errors for resources

**Result:** ☐ PASS ☐ FAIL  
**Notes:** _______________________________________________

---

## Test Suite 5: Existing Functionality (Regression Testing)

### Test 5.1: Event Creation
- [ ] Create a new event without template
- [ ] **VERIFY:** Event creation works normally
- [ ] Create a new event with template
- [ ] **VERIFY:** Template assignment works
- [ ] **VERIFY:** Event saves successfully

**Result:** ☐ PASS ☐ FAIL  
**Notes:** _______________________________________________

### Test 5.2: Event Editing
- [ ] Edit Event A
- [ ] Change event name
- [ ] **VERIFY:** Changes save successfully
- [ ] **VERIFY:** Event detail page reflects changes

**Result:** ☐ PASS ☐ FAIL  
**Notes:** _______________________________________________

### Test 5.3: Attendants Management
- [ ] Navigate to Event A → Attendants
- [ ] **VERIFY:** Attendants page loads
- [ ] **VERIFY:** All attendant features work
- [ ] Add/edit/delete attendant
- [ ] **VERIFY:** CRUD operations work normally

**Result:** ☐ PASS ☐ FAIL  
**Notes:** _______________________________________________

### Test 5.4: Positions Management
- [ ] Navigate to Event A → Positions
- [ ] **VERIFY:** Positions page loads
- [ ] **VERIFY:** All position features work
- [ ] Create/edit position
- [ ] **VERIFY:** Operations work normally

**Result:** ☐ PASS ☐ FAIL  
**Notes:** _______________________________________________

### Test 5.5: Documents & Announcements
- [ ] Navigate to Event A → Documents
- [ ] **VERIFY:** Documents page loads
- [ ] Navigate to Event A → Announcements
- [ ] **VERIFY:** Announcements page loads
- [ ] **VERIFY:** All features work normally

**Result:** ☐ PASS ☐ FAIL  
**Notes:** _______________________________________________

---

## Test Suite 6: Performance

### Test 6.1: Page Load Times
- [ ] Clear browser cache
- [ ] Navigate to Event A detail page
- [ ] Note load time: _______ seconds
- [ ] **VERIFY:** Page loads in under 3 seconds
- [ ] Navigate to Event B detail page
- [ ] Note load time: _______ seconds
- [ ] **VERIFY:** Consistent performance across events

**Result:** ☐ PASS ☐ FAIL  
**Notes:** _______________________________________________

### Test 6.2: Memory Usage
- [ ] Open browser Task Manager (Shift+Esc in Chrome)
- [ ] Navigate through 5-10 events
- [ ] Check memory usage
- [ ] **VERIFY:** No significant memory leaks
- [ ] **VERIFY:** Memory usage stays reasonable

**Result:** ☐ PASS ☐ FAIL  
**Notes:** _______________________________________________

---

## Test Suite 7: Database Integrity

### Test 7.1: Template Assignment Persistence
- [ ] Assign template to an event
- [ ] Save and navigate away
- [ ] Return to event detail page
- [ ] **VERIFY:** Template assignment persists
- [ ] **VERIFY:** Module visibility matches template config

**Result:** ☐ PASS ☐ FAIL  
**Notes:** _______________________________________________

### Test 7.2: Template Updates
- [ ] Edit Template A - disable Count Times
- [ ] Save template
- [ ] Navigate to Event A (which uses Template A)
- [ ] **VERIFY:** Count Times link is now hidden
- [ ] Re-enable Count Times in Template A
- [ ] **VERIFY:** Count Times link reappears

**Result:** ☐ PASS ☐ FAIL  
**Notes:** _______________________________________________

---

## Final Verification

### Critical Features Checklist
- [ ] ✅ Dynamic navigation works correctly
- [ ] ✅ Module access guards prevent unauthorized access
- [ ] ✅ Backward compatibility maintained
- [ ] ✅ No visual regressions
- [ ] ✅ No JavaScript errors
- [ ] ✅ Performance is acceptable
- [ ] ✅ All existing features still work

### Issues Found
List any issues discovered during testing:

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Overall Test Result
- [ ] ✅ **PASS** - Ready for production release
- [ ] ⚠️ **PASS WITH NOTES** - Minor issues, acceptable for release
- [ ] ❌ **FAIL** - Critical issues found, needs fixes

---

## Sign-Off

**Tester Name:** _______________________  
**Date Completed:** _______________________  
**Total Time:** _______ minutes  
**Recommendation:** ☐ Approve for Release ☐ Needs Fixes

---

## Next Steps After Testing

If tests pass:
1. Bump version to 3.0.4
2. Create release notes
3. Run `/release` workflow
4. Switch traffic to STANDBY
5. Run `/sync` workflow
6. Monitor production

If tests fail:
1. Document issues in GitHub
2. Fix critical bugs
3. Re-deploy to STANDBY
4. Re-run test checklist
