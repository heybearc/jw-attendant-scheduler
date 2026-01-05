# Feature Test Checklist - TheoShift

**Current Phase:** Event-Centric Scheduling System

This checklist is automatically tested by `/test-release` workflow. Use this to verify what features are being validated before production deployment.

---

## 🎯 Current Features

### **1. Event Management**

| Feature | Test | Status |
|---------|------|--------|
| Event creation | Create new events with details | ⚠️ Manual |
| Event selection | Select/switch between events | ⚠️ Manual |
| Event dashboard | View event overview and statistics | ⚠️ Manual |
| Event status | Manage event lifecycle states | ⚠️ Manual |

### **2. Attendant Management**

| Feature | Test | Status |
|---------|------|--------|
| Attendant profiles | View and edit attendant information | ⚠️ Manual |
| Attendant assignments | Assign attendants to positions | ⚠️ Manual |
| Attendant dashboard | Attendant view of assignments | ⚠️ Manual |
| Attendant availability | Track availability and conflicts | ⚠️ Manual |

### **3. Position Management**

| Feature | Test | Status |
|---------|------|--------|
| Position creation | Create unlimited numbered positions | ⚠️ Manual |
| Position shifts | Time-based shift assignments | ⚠️ Manual |
| Position templates | Reusable position configurations | ⚠️ Manual |
| Bulk position operations | Mass create/edit/delete positions | ⚠️ Manual |

### **4. Authentication & Security**

| Feature | Test | Status |
|---------|------|--------|
| User login | Secure authentication flow | ✅ Automated |
| Role-based access | Admin, Overseer, Attendant roles | ⚠️ Manual |
| User invitations | Email-based invitation system | ⚠️ Manual |
| Session management | Secure session handling | ⚠️ Manual |

---

## 📊 Test Coverage Summary

- **Total Features:** 16
- **Automated Tests:** 1 (6%)
- **Manual Tests:** 15 (94%)

**Note:** TheoShift is in active development. More automated tests will be added as features stabilize.

---

## 🚀 How to Run Tests

### **Quick Validation (1-2 min)**
```bash
BASE_URL=http://10.92.3.24:3001 TEST_USER_EMAIL=admin@theoshift.local TEST_USER_PASSWORD='AdminPass123!' npm run test:smoke:quick
```

### **Full Feature Validation**
```bash
# Currently limited - expand as features are developed
BASE_URL=http://10.92.3.24:3001 TEST_USER_EMAIL=admin@theoshift.local TEST_USER_PASSWORD='AdminPass123!' npx playwright test
```

---

## ✅ Pre-Production Checklist

Before deploying to PRODUCTION, verify:

- [ ] All automated tests pass on STAGING
- [ ] Manual smoke test of key features
- [ ] Event creation and selection works
- [ ] Attendant assignments function correctly
- [ ] No console errors in browser
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Backup created
- [ ] Release notes reviewed

---

## 🔄 Development Roadmap

### **High Priority**
- Count Times system integration
- Auto-assignment engine
- Oversight management
- Email notification system

### **Medium Priority**
- Lanyard management
- Import/export system
- Advanced event features
- Reporting dashboard

### **Low Priority**
- Mobile app
- External integrations
- Advanced analytics

---

**Last Updated:** January 5, 2026  
**Test Framework:** Playwright  
**Staging:** http://10.92.3.24:3001 (Container 134)  
**Production:** http://10.92.3.22:3001 (Container 132)
