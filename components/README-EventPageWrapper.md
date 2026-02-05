# Event Page Wrapper Components

## Overview

These modular components provide a maintainable way to add unified navigation to event pages without modifying existing page logic.

## Components

### 1. EventPageWrapper

A wrapper component that provides EventPageLayout + TemplateProvider in one.

**Usage:**
```tsx
import EventPageWrapper from '../../../components/EventPageWrapper'

export default function MyEventPage({ event, canEdit, canDelete, canManagePermissions, ...otherProps }) {
  return (
    <EventPageWrapper
      event={event}
      currentPage="volunteers"
      canEdit={canEdit}
      canDelete={canDelete}
      canManagePermissions={canManagePermissions}
    >
      {/* Your existing page content - no changes needed */}
      <div className="max-w-7xl mx-auto">
        <h1>My Content</h1>
        {/* ... */}
      </div>
    </EventPageWrapper>
  )
}
```

### 2. withEventPagePermissions HOC

A Higher-Order Function that automatically adds permission props to getServerSideProps.

**Usage:**
```tsx
import { withEventPagePermissions } from '../../../lib/withEventPageLayout'

export const getServerSideProps = withEventPagePermissions(async (context) => {
  // Your existing logic
  const event = await fetchEvent(context.params.id)
  
  return {
    props: {
      event,
      // ... your other props
      // canEdit, canDelete, canManagePermissions are added automatically
    }
  }
})
```

## Migration Guide

### Step 1: Update Imports
```tsx
// Add these imports
import EventPageWrapper from '../../../components/EventPageWrapper'
import { withEventPagePermissions } from '../../../lib/withEventPageLayout'
```

### Step 2: Wrap Your Return Statement
```tsx
// Before:
return (
  <EventLayout title="...">
    <div>Your content</div>
  </EventLayout>
)

// After:
return (
  <EventPageWrapper event={event} currentPage="volunteers" {...permissions}>
    <div>Your content</div>
  </EventPageWrapper>
)
```

### Step 3: Update getServerSideProps
```tsx
// Before:
export const getServerSideProps: GetServerSideProps = async (context) => {
  // ... your logic
  return { props: { event } }
}

// After:
export const getServerSideProps = withEventPagePermissions(async (context) => {
  // ... same logic
  return { props: { event } }
})
```

### Step 4: Remove Duplicate Navigation
Remove any "Back to Event" buttons or duplicate navigation elements.

## Benefits

1. **No page logic changes** - existing functionality stays intact
2. **Automatic permission handling** - HOC adds permissions automatically
3. **Consistent navigation** - all pages get the same tab structure
4. **Easy maintenance** - changes to layout only need to happen in one place
5. **Type-safe** - TypeScript ensures correct props

## Example: Converting Volunteers Page

```tsx
// pages/events/[id]/volunteers.tsx

import EventPageWrapper from '../../../components/EventPageWrapper'
import { withEventPagePermissions } from '../../../lib/withEventPageLayout'

interface Props {
  event: Event
  attendants: Attendant[]
  canManageContent: boolean
  canEdit: boolean
  canDelete: boolean
  canManagePermissions: boolean
}

export default function VolunteersPage({ 
  event, 
  attendants, 
  canManageContent,
  canEdit,
  canDelete,
  canManagePermissions 
}: Props) {
  // All your existing logic stays the same
  
  return (
    <EventPageWrapper
      event={event}
      currentPage="volunteers"
      canEdit={canEdit}
      canDelete={canDelete}
      canManagePermissions={canManagePermissions}
    >
      {/* All your existing JSX - no changes needed */}
      <div className="max-w-7xl mx-auto">
        {/* ... existing content ... */}
      </div>
    </EventPageWrapper>
  )
}

export const getServerSideProps = withEventPagePermissions(async (context) => {
  // All your existing getServerSideProps logic
  // Permissions are added automatically
  return {
    props: {
      event,
      attendants,
      canManageContent
    }
  }
})
```

## Testing

After conversion, verify:
1. ✅ Unified tab navigation appears at top
2. ✅ All tabs are visible (based on module config)
3. ✅ Current page tab is highlighted
4. ✅ No duplicate "Back to Event" buttons
5. ✅ All existing functionality works
6. ✅ Permissions control tab visibility correctly
