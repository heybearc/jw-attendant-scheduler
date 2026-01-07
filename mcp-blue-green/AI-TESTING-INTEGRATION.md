# AI-Testing Integration with Blue-Green MCP Server

**Status:** ✅ INTEGRATED  
**Date:** January 6, 2026  
**Apps:** TheoShift & LDC Construction Tools

---

## 🎯 Overview

The blue-green deployment MCP server now includes **automated Playwright testing** for both TheoShift and LDC Construction Tools. Tests run automatically after deployment and before traffic switching to prevent broken code from reaching production.

---

## 🔧 What Was Integrated

### **1. Test Runner Module** (`test-runner.js`)

A shared module that runs Playwright tests for both applications:

**Features:**
- ✅ Runs smoke tests (quick validation)
- ✅ Runs feature tests (comprehensive validation)
- ✅ Parses test results from Playwright output
- ✅ Returns structured test data
- ✅ Supports both TheoShift and LDC Tools

**Configuration:**
```javascript
const TEST_CONFIGS = {
  'theoshift': {
    projectPath: '/Users/cory/Documents/Cloudy-Work/applications/theoshift',
    testUser: 'admin@theoshift.local',
    testPassword: 'AdminPass123!',
    smokeTests: 'tests/smoke-test.spec.ts',
    featureTests: 'tests/**/*.spec.ts',
  },
  'ldc-tools': {
    projectPath: '/Users/cory/Documents/Cloudy-Work/applications/ldc-construction-tools/frontend',
    testUser: 'admin@ldctools.local',
    testPassword: 'AdminPass123!',
    smokeTests: 'tests/smoke-test.spec.ts',
    featureTests: 'tests/phase1-features.spec.ts',
  },
};
```

### **2. MCP Server Integration** (`server.js`)

**Automated Test Execution:**

#### **After STANDBY Deployment:**
```
1. Pull code
2. Install dependencies
3. Run migrations (optional)
4. Build application
5. Restart server
6. Health check
7. ✨ Run smoke tests ← NEW
```

**Result:**
- ✅ Tests pass → "STANDBY is ready for traffic switch"
- ⚠️ Tests fail → "STANDBY deployed but tests failed - review before switching"

#### **Before Traffic Switch:**
```
1. Check STANDBY health
2. ✨ Run smoke tests ← NEW
3. Request approval
4. Switch traffic
```

**Result:**
- ✅ Tests pass → Proceed with switch
- ❌ Tests fail → Block traffic switch with error message

---

## 🚀 How It Works

### **Workflow 1: Deploy to STANDBY**

```
User: Deploy to standby

MCP Server:
  1. Deploys code to STANDBY
  2. Runs health check
  3. Runs smoke tests automatically
  4. Reports: "✅ Tests passed: 4/4 in 18.5s"
  
Result: STANDBY ready for traffic switch
```

### **Workflow 2: Switch Traffic**

```
User: Switch traffic to standby

MCP Server:
  1. Checks STANDBY health
  2. Runs smoke tests
  3. If tests pass → Request approval
  4. If tests fail → Block switch with error
  
Result: Only switch if tests pass
```

### **Workflow 3: Emergency Rollback**

```
User: Switch traffic with emergency mode

MCP Server:
  1. Skips health checks
  2. Skips tests
  3. Immediately switches traffic
  
Result: Fast rollback when needed
```

---

## 📋 Test Types

### **Smoke Tests (Default)**
- **Duration:** 1-2 minutes
- **Purpose:** Quick validation of critical paths
- **Tests:**
  - Login flow works
  - Pages load without errors
  - No critical JavaScript errors
  - Basic functionality operational

### **Feature Tests (Optional)**
- **Duration:** 5-10 minutes
- **Purpose:** Comprehensive feature validation
- **Tests:**
  - All Phase 1 features
  - Complex workflows
  - Edge cases
  - Integration points

---

## 🔐 Safety Features

### **1. Test Blocking**
- ❌ Failed tests **block traffic switch**
- ⚠️ Warning displayed if tests fail after deployment
- 🚨 Emergency mode available to bypass (use with caution)

### **2. Test Results**
- ✅ Pass/fail status
- 📊 Test count (passed/failed/total)
- ⏱️ Duration
- 📝 Output (first 5000 chars)

### **3. Emergency Override**
```javascript
// Bypass tests in emergency
{
  "app": "ldc-tools",
  "requireApproval": false,
  "emergency": true
}
```

---

## 📊 Example Outputs

### **Successful Deployment with Tests**
```
✅ Deployment to GREEN (10.92.3.25) completed!

Creating backup...
✅ Backups created
Pulling latest code from GitHub...
✅ Code pulled from main branch
Installing dependencies...
✅ Dependencies installed
Building application...
✅ Build complete
Restarting server...
✅ Server restarted
Running health checks...
✅ Health check passed
Running automated smoke tests...
✅ Tests passed: 4/4 in 18.5s

✅ STANDBY is ready for traffic switch

Access: http://10.92.3.25:3001
```

### **Deployment with Failed Tests**
```
⚠️ Deployment to GREEN (10.92.3.25) completed!

Creating backup...
✅ Backups created
Pulling latest code from GitHub...
✅ Code pulled from main branch
Installing dependencies...
✅ Dependencies installed
Building application...
✅ Build complete
Restarting server...
✅ Server restarted
Running health checks...
✅ Health check passed
Running automated smoke tests...
❌ Tests failed: 2/4

⚠️ DEPLOYMENT WARNING: Tests failed on STANDBY
Review test results before switching traffic.

⚠️ STANDBY deployed but tests failed - review before switching

Access: http://10.92.3.25:3001
```

### **Traffic Switch Blocked by Tests**
```
❌ Cannot switch traffic: Tests failed on STANDBY!

2/4 tests passed
2 tests failed

Fix test failures before switching traffic.
Use emergency=true to bypass tests (not recommended).
```

---

## 🛠️ Configuration

### **Test Credentials**

Both apps have test users configured:

**TheoShift:**
- User: `admin@theoshift.local`
- Password: `AdminPass123!`
- Status: ⚠️ User needs to be created on servers

**LDC Tools:**
- User: `admin@ldctools.local`
- Password: `AdminPass123!`
- Status: ✅ User exists on both servers

### **Test Paths**

Tests are located in each app's repository:
- TheoShift: `/applications/theoshift/tests/`
- LDC Tools: `/applications/ldc-construction-tools/frontend/tests/`

---

## 📚 Updated Workflows

### **/bump Workflow**
```
1. Analyze changes
2. Update version
3. Create release notes
4. Deploy to STANDBY
5. ✨ Auto-run smoke tests
6. Report results
7. Wait for approval
```

### **/release Workflow**
```
1. Check deployment status
2. ✨ Verify tests passed on STANDBY
3. Switch traffic
4. Report new PROD/STANDBY
5. Wait for sync approval
```

### **/test-release Workflow**
```
1. Run smoke tests manually (for debugging)
2. Run feature tests (optional)
3. Report results
```

---

## 🔄 Shared Code Structure

The MCP server is shared between apps using symlinks:

```
/theoshift/mcp-blue-green/
  ├── server.js (master copy)
  ├── test-runner.js (master copy)
  ├── package.json
  └── node_modules/

/ldc-construction-tools/mcp-blue-green/
  ├── server.js → (symlink to theoshift)
  ├── test-runner.js → (symlink to theoshift)
  └── README.md
```

**Benefits:**
- ✅ Single source of truth
- ✅ Updates apply to both apps
- ✅ Consistent behavior
- ✅ Easier maintenance

---

## 🧪 Testing the Integration

### **Test on LDC Tools:**
```javascript
// Check status
{
  "app": "ldc-tools"
}

// Deploy to STANDBY (will run tests)
{
  "app": "ldc-tools",
  "pullGithub": true,
  "createBackup": true
}

// Switch traffic (will verify tests)
{
  "app": "ldc-tools",
  "requireApproval": false
}
```

### **Test on TheoShift:**
```javascript
// Check status
{
  "app": "theoshift"
}

// Deploy to STANDBY (will run tests)
{
  "app": "theoshift",
  "pullGithub": true,
  "createBackup": true
}

// Switch traffic (will verify tests)
{
  "app": "theoshift",
  "requireApproval": false
}
```

---

## ⚠️ Important Notes

### **Prerequisites:**
1. ✅ Test users must exist on both BLUE and GREEN servers
2. ✅ Test users must have ADMIN or SUPER_ADMIN role
3. ✅ Test users must have ACTIVE status
4. ✅ Playwright tests must be in the repository
5. ✅ npm scripts must be configured (`test:smoke:quick`)

### **Limitations:**
- Tests run from local machine (not on servers)
- Requires network access to both servers
- Test output limited to 5000 characters
- 2-minute timeout for test execution

### **Best Practices:**
1. Always fix failing tests before switching traffic
2. Use emergency mode only for critical rollbacks
3. Review test output when tests fail
4. Keep smoke tests fast (< 2 minutes)
5. Add feature tests for comprehensive validation

---

## 🎉 Benefits

### **Safety:**
- ✅ Prevents broken code from reaching production
- ✅ Automated validation before traffic switch
- ✅ Clear pass/fail indicators

### **Speed:**
- ✅ Tests run automatically (no manual intervention)
- ✅ Fast smoke tests (1-2 minutes)
- ✅ Immediate feedback on deployment quality

### **Reliability:**
- ✅ Consistent testing across both apps
- ✅ Structured test results
- ✅ Emergency override available

---

## 📞 Troubleshooting

### **Tests Fail After Deployment:**
1. Check test output in deployment results
2. SSH to STANDBY and investigate
3. Fix issues and redeploy
4. Tests will run again automatically

### **Tests Timeout:**
1. Check if server is responding
2. Verify test user credentials
3. Check network connectivity
4. Increase timeout in test-runner.js if needed

### **Emergency Rollback Needed:**
```javascript
// Bypass all checks and switch immediately
{
  "app": "ldc-tools",
  "requireApproval": false,
  "emergency": true
}
```

---

**Created:** January 6, 2026  
**Version:** 1.0.0  
**Status:** ✅ PRODUCTION READY
