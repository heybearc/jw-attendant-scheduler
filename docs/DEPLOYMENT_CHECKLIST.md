# Deployment Checklist - Phase 7 to Production

**Target Environment:** blue.theoshift.com (Production)  
**Source Environment:** green.theoshift.com (Standby)  
**Deployment Date:** TBD

---

## 📋 Pre-Deployment Checklist

### **1. Testing Verification**
- [ ] All user testing scenarios completed (9/9)
- [ ] Mobile testing on iOS Safari - PASSED
- [ ] Mobile testing on iOS Chrome - PASSED
- [ ] Mobile testing on Android Chrome - PASSED
- [ ] No critical bugs identified
- [ ] All known issues documented and acceptable

### **2. Code Review**
- [ ] All Phase 7 commits reviewed
- [ ] No console errors in browser
- [ ] No TypeScript errors
- [ ] All tests passing (if applicable)
- [ ] Code follows project standards

### **3. Documentation**
- [ ] Release notes created (`RELEASE_NOTES_PHASE_7.md`)
- [ ] User testing guide created (`USER_TESTING_GUIDE.md`)
- [ ] Performance analysis documented (`LIGHTHOUSE_PERFORMANCE_ANALYSIS.md`)
- [ ] Help pages updated (`/help/mobile-features`)
- [ ] Phase 7 progress documented

### **4. Performance Verification**
- [ ] Bundle sizes verified (< 120 kB First Load JS)
- [ ] Lazy loading working correctly
- [ ] No performance regressions
- [ ] Mobile page load times acceptable

### **5. Database & Environment**
- [ ] No database migrations required ✅
- [ ] Environment variables unchanged ✅
- [ ] No breaking changes ✅
- [ ] Backward compatible ✅

---

## 🚀 Deployment Steps

### **Step 1: Backup Current Production**
```bash
# SSH to production server
ssh root@10.92.3.22

# Create backup tag
cd /opt/theoshift
git tag backup-pre-phase7-$(date +%Y%m%d-%H%M%S)
git push origin --tags

# Backup database (if needed)
# pg_dump theoshift > /backups/theoshift-pre-phase7-$(date +%Y%m%d).sql
```

**Verification:**
- [ ] Git tag created
- [ ] Tag pushed to remote
- [ ] Database backup created (if applicable)

---

### **Step 2: Deploy to Production**

**Option A: Using Blue-Green Deployment (Recommended)**
```bash
# Use the homelab blue-green deployment MCP tool
# This will:
# 1. Deploy code to STANDBY (green)
# 2. Run health checks
# 3. Switch traffic from LIVE (blue) to STANDBY (green)
# 4. Keep old version running for quick rollback
```

**Option B: Direct Deployment**
```bash
# SSH to production server
ssh root@10.92.3.22

# Pull latest code
cd /opt/theoshift
git fetch origin
git checkout main
git pull origin main

# Install dependencies (if needed)
npm install

# Build application
npm run build

# Restart application (use correct name for the node)
# BLUE node (10.92.3.24): pm2 restart theoshift-blue
# GREEN node (10.92.3.22): pm2 restart theoshift-green
pm2 restart theoshift-blue  # or theoshift-green depending on node

# Verify deployment
pm2 status
pm2 logs theoshift-blue --lines 50  # or theoshift-green
```

**Verification:**
- [ ] Code pulled successfully
- [ ] Build completed without errors
- [ ] Application restarted
- [ ] PM2 shows status "online"
- [ ] No errors in logs

---

### **Step 3: Post-Deployment Verification**

**Immediate Checks (within 5 minutes):**
- [ ] Homepage loads: `https://blue.theoshift.com`
- [ ] Admin login works: `https://blue.theoshift.com/auth/signin`
- [ ] Volunteer login works: `https://blue.theoshift.com/volunteer/login`
- [ ] Mobile volunteer dashboard loads
- [ ] Documents tab visible on mobile
- [ ] Sign out button visible
- [ ] No JavaScript errors in console
- [ ] No 500 errors in server logs

**Mobile Testing (within 15 minutes):**
- [ ] Test volunteer login on iPhone Safari
- [ ] Test volunteer login on iPhone Chrome
- [ ] Verify all 4 tabs visible on mobile dashboard
- [ ] Test documents tab functionality
- [ ] Test sign out button
- [ ] Verify touch targets are responsive

**Performance Checks (within 30 minutes):**
- [ ] Page load times acceptable
- [ ] No performance degradation
- [ ] Bundle sizes as expected
- [ ] Lazy loading working

---

### **Step 4: Monitor for Issues**

**First Hour:**
- [ ] Monitor PM2 logs: `pm2 logs theoshift`
- [ ] Check for error spikes
- [ ] Monitor user activity
- [ ] Verify no support requests

**First 24 Hours:**
- [ ] Monitor application health
- [ ] Check database performance
- [ ] Review error logs
- [ ] Collect user feedback

---

## 🔄 Rollback Plan

### **If Critical Issues Arise:**

**Option A: Quick Rollback (Blue-Green)**
```bash
# Use MCP tool to switch traffic back to old version
# This is instant and safe
```

**Option B: Git Rollback**
```bash
# SSH to production
ssh root@10.92.3.22
cd /opt/theoshift

# Find the backup tag
git tag | grep backup-pre-phase7

# Checkout the backup tag
git checkout <backup-tag>

# Rebuild and restart (use correct name for the node)
# BLUE node (10.92.3.24): pm2 restart theoshift-blue
# GREEN node (10.92.3.22): pm2 restart theoshift-green
npm run build
pm2 restart theoshift-blue  # or theoshift-green depending on node
```

**Verification After Rollback:**
- [ ] Application running on previous version
- [ ] All features working as before
- [ ] No data loss
- [ ] Users notified of rollback (if needed)

---

## 📊 Success Criteria

### **Deployment Considered Successful If:**
- ✅ All pre-deployment checks passed
- ✅ Deployment completed without errors
- ✅ All post-deployment verifications passed
- ✅ No critical bugs in first 24 hours
- ✅ Mobile features working as expected
- ✅ Performance metrics met or exceeded
- ✅ User feedback positive

### **Deployment Considered Failed If:**
- ❌ Critical bugs affecting core functionality
- ❌ Performance degradation > 20%
- ❌ Mobile login not working
- ❌ Data loss or corruption
- ❌ Security vulnerabilities introduced

---

## 📞 Emergency Contacts

**If Issues Arise:**
1. Check logs: `pm2 logs theoshift`
2. Review error messages
3. Consult troubleshooting guide: `/help/troubleshooting`
4. Execute rollback plan if critical

---

## 📝 Post-Deployment Tasks

### **After Successful Deployment:**
- [ ] Update deployment log
- [ ] Notify users of new features (optional)
- [ ] Archive testing documentation
- [ ] Update project status
- [ ] Plan next phase (if applicable)

### **Documentation Updates:**
- [ ] Mark Phase 7 as "Deployed to Production"
- [ ] Update version numbers
- [ ] Archive release notes
- [ ] Update help documentation

---

## 🎯 Deployment Timeline

**Recommended Schedule:**
1. **Pre-Deployment:** 1-2 hours (testing verification, backups)
2. **Deployment:** 15-30 minutes (code pull, build, restart)
3. **Verification:** 30-60 minutes (testing, monitoring)
4. **Monitoring:** 24 hours (watch for issues)

**Total Time:** ~2-3 hours active work + 24 hours monitoring

---

## ✅ Final Sign-Off

**Deployment Approved By:**
- [ ] Developer: ___________________ Date: ___________
- [ ] Tester: ___________________ Date: ___________
- [ ] Project Owner: ___________________ Date: ___________

**Deployment Executed By:**
- [ ] Name: ___________________ Date: ___________ Time: ___________

**Deployment Status:**
- [ ] ✅ Success - All checks passed
- [ ] ⚠️ Partial - Minor issues, monitoring
- [ ] ❌ Failed - Rolled back

**Notes:**
___________________________________________
___________________________________________
___________________________________________

---

**Deployment Checklist Version:** 1.0  
**Last Updated:** February 1, 2026
