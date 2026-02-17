# Event Edit Page - Tabbed Interface Implementation

**Date:** 2026-02-17  
**Status:** In Progress  
**Related:** EVENT-SETTINGS-REDESIGN.md

## Root Cause of Syntax Errors

### Issue 1: Conditional Rendering Pattern
Using `{activeTab === 'basic' && (` creates React fragments that break form structure:
```tsx
<form>
  {activeTab === 'basic' && (  // Creates fragment
    <div>...</div>
  )}
</form>
```

**Problem:** Form expects direct div children, but gets conditional fragments.

### Issue 2: Missing Fields in getServerSideProps
The Event interface includes `settings` and `locationId`, but they weren't being passed from server:
```tsx
interface Event {
  settings?: { ... }  // Not in transformedEvent
  locationId?: string // Not in transformedEvent
}
```

### Issue 3: Complex Nesting
The edit page has 3 levels of nesting with conditional rendering, making it fragile.

## Correct Implementation Strategy

### Approach: Render All Tabs, Show One
Instead of conditional rendering that breaks structure, render all tabs and use CSS to hide/show:

```tsx
<form onSubmit={handleSubmit}>
  <div className={activeTab === 'basic' ? 'block' : 'hidden'}>
    {/* Basic Info */}
  </div>
  
  <div className={activeTab === 'modules' ? 'block' : 'hidden'}>
    {/* Modules & Features */}
  </div>
  
  <div className={activeTab === 'oversight' ? 'block' : 'hidden'}>
    {/* Oversight */}
  </div>
  
  {/* Submit buttons always visible */}
  <div className="flex justify-end">
    <button type="submit">Save</button>
  </div>
</form>
```

**Benefits:**
- Form structure remains intact
- All form fields exist in DOM (important for validation)
- Simple CSS toggle for visibility
- No fragment issues

### Alternative: Separate Form Per Tab
Each tab has its own form that submits the same data:

```tsx
{activeTab === 'basic' && (
  <form onSubmit={handleSubmit}>
    {/* Basic Info */}
    <button type="submit">Save</button>
  </form>
)}

{activeTab === 'modules' && (
  <form onSubmit={handleSubmit}>
    {/* Modules */}
    <button type="submit">Save</button>
  </form>
)}
```

**Trade-offs:**
- More code duplication
- Each tab needs submit button
- But cleaner separation

## Implementation Steps

### Step 1: Fix getServerSideProps
Add missing fields to transformedEvent:
```tsx
const transformedEvent = {
  // ... existing fields
  locationId: event.locationId || '',
  settings: event.settings as any,
}
```

### Step 2: Add Tab State (Already Done)
```tsx
const [activeTab, setActiveTab] = useState<'basic' | 'modules' | 'oversight'>('basic')
const [modules, setModules] = useState({ ... })
const [terminology, setTerminology] = useState({ ... })
```

### Step 3: Add Tab Navigation (Already Done)
Tab buttons that change activeTab state.

### Step 4: Implement CSS-Based Tab Switching
```tsx
<form onSubmit={handleSubmit} className="space-y-8">
  {/* Basic Information */}
  <div className={activeTab === 'basic' ? 'block' : 'hidden'}>
    <div className="bg-white shadow rounded-lg p-6">
      {/* Basic info fields */}
    </div>
  </div>

  {/* Modules & Features */}
  <div className={activeTab === 'modules' ? 'block' : 'hidden'}>
    <div className="bg-white shadow rounded-lg p-6">
      <EventModulesTab ... />
    </div>
  </div>

  {/* Oversight Settings */}
  <div className={activeTab === 'oversight' ? 'block' : 'hidden'}>
    <div className="bg-white shadow rounded-lg p-6">
      {/* Oversight fields */}
    </div>
  </div>

  {/* Submit Buttons - Always Visible */}
  <div className="flex justify-end space-x-3">
    <button type="submit">Update Event</button>
  </div>
</form>
```

### Step 5: Update handleSubmit (Already Done)
Include settings field in submission.

## Why This Approach Works

1. **No Fragment Issues**: Using CSS classes instead of conditional rendering
2. **Form Integrity**: All fields exist in DOM for proper form submission
3. **Validation Works**: Browser validation can access all fields
4. **Simple Logic**: Just toggle CSS classes based on activeTab
5. **Industry Standard**: This is how Material-UI, Ant Design, etc. implement tabs

## Testing Checklist

- [ ] Build succeeds without syntax errors
- [ ] All three tabs render correctly
- [ ] Tab switching works smoothly
- [ ] Form submission includes all data from all tabs
- [ ] Validation works across tabs
- [ ] Settings field saves correctly to database
- [ ] Backward compatibility maintained (events without settings work)

## Next Steps

1. Implement CSS-based tab switching
2. Test on STANDBY
3. Verify API handles settings field
4. Test with existing events (no settings)
5. Test with new events (with settings)
