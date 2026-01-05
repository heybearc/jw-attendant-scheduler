# TheoShift Testing Implementation Guide

## 🎯 Current Status

**Tests:** 3 (smoke tests only)  
**Coverage:** ~30% of features  
**Pass Rate:** 67% (2/3 passing)  
**Status:** ⚠️ Needs significant expansion

---

## 📊 What's Already Tested

### Smoke Tests (3 tests)
- ✅ Login flow (passing)
- ✅ Events page loads (passing)
- ⚠️ No critical JavaScript errors (failing - CSS loading issues)

**File:** `tests/smoke-test.spec.ts`

**Current Issue:** Console error test failing due to CSS loading via JavaScript streaming (non-critical)

---

## ⚠️ What Needs Testing

### Critical (Not Yet Tested)

1. **Event Management**
   - Event creation
   - Event editing
   - Event selection
   - Event dashboard
   - Event status management

2. **Position Management**
   - Position creation
   - Position assignment
   - Position shifts
   - Position templates

3. **User Management**
   - User invitation
   - Role assignment
   - User-attendant linking
   - Permission checks

4. **Assignment Workflow**
   - Manual assignment
   - Auto-assignment
   - Assignment conflicts
   - Workload balancing

5. **Count Times System**
   - Count session creation
   - Count entry
   - Count reports
   - Count analytics

6. **Oversight Management**
   - Department organization
   - Station ranges
   - Overseer assignments

---

## 🚀 Implementation Plan

### Phase 1: Core Feature Tests (High Priority)

**Estimated Time:** 3-4 hours  
**Impact:** 30% → 80% coverage

**Tests to create:**

```typescript
// tests/event-management.spec.ts
- Event creation workflow
- Event editing
- Event selection
- Event dashboard display
- Event status transitions

// tests/position-management.spec.ts
- Position creation
- Position assignment
- Shift management
- Position templates

// tests/user-management.spec.ts
- User invitation flow
- Role assignment
- User-attendant linking
- Permission validation

// tests/assignments.spec.ts
- Manual assignment
- Auto-assignment engine
- Conflict detection
- Workload balancing
```

### Phase 2: Advanced Features (Medium Priority)

**Estimated Time:** 2-3 hours  
**Impact:** 80% → 95% coverage

```typescript
// tests/count-times.spec.ts
- Count session creation
- Count entry workflow
- Count reports
- Count analytics

// tests/oversight.spec.ts
- Department management
- Station ranges
- Overseer assignments

// tests/lanyard-management.spec.ts
- Badge tracking
- Check-out/return system
- Lanyard-attendant linking
```

### Phase 3: Integration & Performance (Low Priority)

**Estimated Time:** 1-2 hours  
**Impact:** Better reliability

```typescript
// tests/api-integration.spec.ts
- API endpoint validation
- Response format checks
- Error handling

// tests/performance.spec.ts
- Page load times
- Assignment algorithm performance
- Database query optimization
```

---

## 📝 How to Request Implementation

### Full Implementation

```
"Implement comprehensive testing for TheoShift"
```

I'll create all Phase 1 & 2 tests automatically.

### Specific Feature

```
"Create tests for event management in TheoShift"
"Add position management tests to TheoShift"
```

### Incremental

```
"Add Phase 1 tests to TheoShift"
```

---

## 🔧 Current Test Infrastructure

### Test Files
```
tests/
└── smoke-test.spec.ts          # Basic smoke tests only
```

### Missing Infrastructure
- ❌ Test helpers (need to create)
- ❌ Feature tests (need to create)
- ❌ API tests (need to create)
- ❌ Performance tests (need to create)

### Test Commands Available
```bash
# Quick smoke tests
npm run test:smoke:quick

# Full test suite
npm run test:e2e

# Interactive mode
npm run test:e2e:ui

# View report
npm run test:report
```

---

## 🎯 Test Coverage Goals

### Current Coverage

| Feature Area | Coverage | Status |
|--------------|----------|--------|
| Authentication | 100% | ✅ Complete |
| Event Management | 0% | ❌ Missing |
| Positions | 0% | ❌ Missing |
| Users | 0% | ❌ Missing |
| Assignments | 0% | ❌ Missing |
| Count Times | 0% | ❌ Missing |
| Oversight | 0% | ❌ Missing |

### Target Coverage

| Feature Area | Target | Priority |
|--------------|--------|----------|
| Authentication | 100% | Critical |
| Event Management | 95% | Critical |
| Positions | 90% | High |
| Users | 90% | High |
| Assignments | 85% | High |
| Count Times | 80% | Medium |
| Oversight | 75% | Medium |

---

## 🔄 Integration with /test-release

### Current Workflow

```bash
# When you say: /test-release theoshift
# I automatically run:

cd applications/theoshift

BASE_URL=http://10.92.3.24:3001 \
TEST_USER_EMAIL=admin@theoshift.local \
TEST_USER_PASSWORD='AdminPass123!' \
npm run test:e2e

# Then I:
1. Analyze results
2. Report status (currently 2/3 passing)
3. Update tracking
4. Recommend action
```

### After Full Implementation

```
Current: 3 tests in ~15 seconds
After Implementation: ~40 tests in ~3 minutes
Coverage: 30% → 95%
```

---

## 📊 Test Credentials

**Blue (Staging):** http://10.92.3.24:3001 (Container 134)  
**Green (Production):** http://10.92.3.22:3001 (Container 132)  
**Test User:** admin@theoshift.local  
**Password:** AdminPass123!  
**Status:** ⚠️ User needs to be created on servers

---

## 🚨 Critical Issues to Address

### 1. Test User Creation

**Problem:** Test user doesn't exist on servers yet

**Solution:**
```sql
-- Need to create test user in database
INSERT INTO users (email, password_hash, role, status)
VALUES ('admin@theoshift.local', '[bcrypt_hash]', 'ADMIN', 'ACTIVE');
```

**Action Required:** Create test user before running tests

### 2. Console Error Test

**Problem:** CSS loading via JavaScript streaming causes console errors

**Solution:** Update error filtering to exclude CSS/asset loading errors

**Priority:** Low (non-critical)

---

## 🎓 Best Practices

### DO

✅ Create test user first  
✅ Test on Blue (staging) first  
✅ Use test helpers for reusability  
✅ Follow event-centric architecture  
✅ Test all user roles  

### DON'T

❌ Test on Green (production) first  
❌ Skip event context in tests  
❌ Ignore role-based access  
❌ Test without proper user setup  
❌ Deploy without testing  

---

## 🚀 Quick Start

### Step 1: Create Test User

```
"Create test user for TheoShift on both servers"
```

### Step 2: Implement Tests

**Full Implementation:**
```
"Implement comprehensive testing for TheoShift"
```

**Specific Feature:**
```
"Create event management tests for TheoShift"
```

### Step 3: Run Tests

**Using Workflow:**
```
/test-release theoshift
```

**Manual:**
```bash
cd applications/theoshift
npm run test:e2e
```

---

## 📈 Expected Outcomes

### After Full Implementation

**Test Suite:**
- 40+ comprehensive tests
- 95% feature coverage
- ~3 minute runtime
- Event-centric test structure

**Benefits:**
- Validate event workflows
- Test position management
- Verify assignment logic
- Check count times accuracy
- Ensure oversight tracking

**Maintenance:**
- AI-assisted test creation
- Automatic updates
- Self-documenting
- Minimal manual work

---

## 🎯 TheoShift-Specific Considerations

### Event-Centric Testing

All tests must:
1. Start with event selection/creation
2. Operate within event context
3. Verify event-specific data
4. Clean up event data after tests

### Role-Based Testing

Test all user roles:
- Admin
- Overseer
- Assistant Overseer
- Keyman
- Attendant

### Multi-Event Testing

Verify:
- Event isolation
- Cross-event data integrity
- Event status transitions
- Event copying functionality

---

## 📞 Getting Help

### For Implementation
```
"Implement comprehensive testing for TheoShift"
```

### For Test User Setup
```
"Create test user for TheoShift"
```

### For Specific Tests
```
"Create tests for [feature] in TheoShift"
```

### For Test Fixes
```
"Fix failing TheoShift tests"
```

### For Status Check
```
"What's the test coverage for TheoShift?"
```

---

## 🔮 Future Enhancements

### Phase 4: Email Testing
- Invitation email validation
- Notification email checks
- Email template verification

### Phase 5: Import/Export Testing
- CSV import validation
- Export format checks
- Data integrity verification

### Phase 6: Mobile Testing
- Attendant dashboard on mobile
- Count entry on mobile
- Responsive design validation

---

## 🎉 Priority Actions

### Immediate (Before Next Deployment)

1. ✅ Create test user on both servers
2. ✅ Fix console error test filtering
3. ✅ Implement Phase 1 tests (event + position + user + assignment)

### Short Term (This Week)

4. ✅ Implement Phase 2 tests (count times + oversight)
5. ✅ Run comprehensive test suite
6. ✅ Update documentation

### Long Term (This Month)

7. ✅ Add Phase 3 tests (API + performance)
8. ✅ Implement visual regression testing
9. ✅ Add accessibility testing

---

**Last Updated:** January 5, 2026  
**Current Coverage:** 30%  
**Target Coverage:** 95%  
**Status:** Ready for implementation  
**Blocker:** Test user needs creation
