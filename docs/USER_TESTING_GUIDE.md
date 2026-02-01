# Mobile Testing Guide - Phase 7 Week 5

**Environment:** https://green.theoshift.com (Standby)  
**Date:** February 1, 2026  
**Tester:** Cory

---

## 🎯 Testing Objectives

Test all Phase 7 mobile features on real devices to ensure everything works correctly before promoting to production.

---

## 📱 Test Devices

### **Primary Testing**
- iPhone (Safari) - Primary iOS browser
- iPhone (Chrome) - Secondary iOS browser
- Android phone (Chrome) - Primary Android browser

### **Secondary Testing** (if available)
- iPad (Safari)
- Android tablet

---

## 🧪 Test Scenarios

### **Scenario 1: Volunteer Login Flow**

**Test on:** iPhone Safari, iPhone Chrome, Android Chrome

**Steps:**
1. Open browser and navigate to: `https://green.theoshift.com/volunteer/login`
2. Clear browser cache/cookies (or use incognito/private mode)
3. Enter your volunteer credentials:
   - First Name
   - Last Name
   - Congregation
   - PIN (last 4 digits of phone)
4. Click "Sign In"

**Expected Results:**
- ✅ Form fields are easy to tap (44px minimum)
- ✅ No autocomplete interference
- ✅ Redirects to event selection page (if multiple events) or dashboard (if one event)
- ✅ No page refresh/loop back to login
- ✅ Loading spinner shows during authentication

**Pass/Fail:** ___________

**Notes:** ___________________________________________

---

### **Scenario 2: Mobile Volunteer Dashboard**

**Test on:** iPhone Safari, iPhone Chrome

**Steps:**
1. After logging in, you should be on the volunteer dashboard
2. Check all 4 tabs are visible:
   - 📋 Assignments
   - 📅 Availability
   - 👥 Contacts
   - 📄 Documents (NEW!)
3. Tap each tab and verify content loads
4. Check header buttons:
   - Refresh button (circular arrow)
   - Sign out button (logout icon) (NEW!)

**Expected Results:**
- ✅ All 4 tabs visible and labeled correctly
- ✅ Tab switching is smooth and responsive
- ✅ Documents tab shows published documents (or empty state)
- ✅ Sign out button visible in top-right corner
- ✅ Refresh button works
- ✅ All touch targets are easy to tap

**Pass/Fail:** ___________

**Notes:** ___________________________________________

---

### **Scenario 3: Documents Tab**

**Test on:** iPhone Safari, iPhone Chrome

**Steps:**
1. Navigate to Documents tab on mobile dashboard
2. If documents are published, verify they display correctly
3. Tap "View Document" button on a document
4. Check document details:
   - Title and description
   - File name and size
   - Publication date
   - File type icon (PDF, image, video)

**Expected Results:**
- ✅ Documents display in a list
- ✅ File type icons are correct (📄 PDF, 🖼️ image, 🎥 video)
- ✅ "View Document" button is touch-friendly
- ✅ Tapping opens document in new tab/viewer
- ✅ Empty state shows if no documents ("No documents available")
- ✅ Document count badge shows on tab

**Pass/Fail:** ___________

**Notes:** ___________________________________________

---

### **Scenario 4: Sign Out Functionality**

**Test on:** iPhone Safari, iPhone Chrome

**Steps:**
1. From the mobile dashboard, tap the logout icon (top-right)
2. Verify you're redirected to login page
3. Try to navigate back to dashboard without logging in
4. Verify you're redirected to login (session ended)

**Expected Results:**
- ✅ Sign out button is visible and easy to tap
- ✅ Redirects to `/volunteer/login` after sign out
- ✅ Session is cleared (can't access dashboard without login)
- ✅ No errors during sign out

**Pass/Fail:** ___________

**Notes:** ___________________________________________

---

### **Scenario 5: Page Load Performance**

**Test on:** iPhone Safari (WiFi and Cellular)

**Steps:**
1. Clear browser cache
2. Navigate to `https://green.theoshift.com/volunteer/login`
3. Note the time it takes to load
4. Login and navigate to dashboard
5. Note the time it takes to load dashboard

**Expected Results:**
- ✅ Login page loads in < 2 seconds (WiFi)
- ✅ Dashboard loads in < 3 seconds (WiFi)
- ✅ Loading skeletons/spinners show during load
- ✅ No blank white screens
- ✅ Smooth transitions between pages

**Pass/Fail:** ___________

**Notes:** ___________________________________________

---

### **Scenario 6: Touch Interactions**

**Test on:** iPhone Safari, iPhone Chrome

**Steps:**
1. Test all buttons on mobile dashboard
2. Verify touch targets are easy to tap
3. Check for visual feedback when tapping:
   - Buttons should show active state
   - No accidental double-taps
   - Smooth animations

**Expected Results:**
- ✅ All buttons are at least 44px tall
- ✅ Buttons show visual feedback when tapped
- ✅ No accidental taps on nearby elements
- ✅ Smooth transitions and animations
- ✅ No lag or delay in touch response

**Pass/Fail:** ___________

**Notes:** ___________________________________________

---

### **Scenario 7: Responsive Layout**

**Test on:** iPhone (portrait and landscape), iPad

**Steps:**
1. View dashboard in portrait mode
2. Rotate to landscape mode
3. Verify layout adjusts properly
4. Test on iPad (if available)

**Expected Results:**
- ✅ Layout adapts to portrait mode
- ✅ Layout adapts to landscape mode
- ✅ No horizontal scrolling
- ✅ All content is readable
- ✅ Buttons remain accessible

**Pass/Fail:** ___________

**Notes:** ___________________________________________

---

### **Scenario 8: Network Conditions**

**Test on:** iPhone Safari (Cellular)

**Steps:**
1. Switch to cellular data (4G/5G)
2. Navigate to login page
3. Login and access dashboard
4. Switch to airplane mode
5. Try to navigate (should show offline indicator)

**Expected Results:**
- ✅ Works on cellular data
- ✅ Reasonable load times on cellular
- ✅ Offline indicator shows when no connection
- ✅ Cached pages load offline (if PWA installed)

**Pass/Fail:** ___________

**Notes:** ___________________________________________

---

### **Scenario 9: PWA Installation** (Optional)

**Test on:** iPhone Safari

**Steps:**
1. On Safari, tap the Share button
2. Scroll down and tap "Add to Home Screen"
3. Tap "Add"
4. Open the app from home screen
5. Verify it opens in standalone mode (no browser chrome)

**Expected Results:**
- ✅ PWA can be installed
- ✅ App icon appears on home screen
- ✅ Opens in standalone mode
- ✅ All features work in PWA mode

**Pass/Fail:** ___________

**Notes:** ___________________________________________

---

## 🐛 Bug Reporting Template

If you find any issues, document them here:

### **Bug #1**
- **Severity:** Critical / High / Medium / Low
- **Device:** iPhone Safari / iPhone Chrome / Android Chrome
- **Page:** Login / Dashboard / Documents / etc.
- **Steps to Reproduce:**
  1. 
  2. 
  3. 
- **Expected Behavior:** 
- **Actual Behavior:** 
- **Screenshots:** (if applicable)

---

## ✅ Testing Checklist Summary

### **Critical Features** (Must Pass)
- [ ] Volunteer login works on Safari
- [ ] Volunteer login works on Chrome
- [ ] Dashboard loads and displays correctly
- [ ] Documents tab is visible and functional
- [ ] Sign out button works
- [ ] All touch targets are accessible

### **Important Features** (Should Pass)
- [ ] Page load performance is acceptable
- [ ] Touch interactions are smooth
- [ ] Responsive layout works
- [ ] Network conditions handled gracefully

### **Nice to Have** (Optional)
- [ ] PWA installation works
- [ ] Offline mode functional

---

## 📊 Test Results Summary

**Total Scenarios:** 9  
**Passed:** ___  
**Failed:** ___  
**Blocked:** ___  

**Overall Status:** Pass / Fail / Needs Work

**Recommendation:** Ready for Production / Needs Fixes / Major Issues

---

## 📝 Notes & Observations

Use this space for any additional observations, suggestions, or feedback:

___________________________________________
___________________________________________
___________________________________________

---

**Tester Signature:** ___________  
**Date Completed:** ___________
