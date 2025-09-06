# Count Times Feature Documentation

## Overview

The Count Times feature allows event administrators and overseers to track attendance counts throughout an event. This feature enables:

1. Creating multiple count sessions for an event (e.g., morning, afternoon)
2. Recording counts for each position
3. Adding notes for specific positions
4. Viewing count reports with trends and totals
5. Visualizing attendance data with charts

## Accessing Count Times

The Count Times feature is accessible from the event detail page:

1. Navigate to the Events page
2. Select an event
3. Click on the "Count Times" tab

## Creating Count Sessions

Count sessions represent specific times when attendance is counted during an event.

1. From the Count Times tab, click "Add Count Time"
2. Enter a session name (e.g., "Friday Morning", "Saturday Afternoon")
3. Select the date and time for the count
4. Click "Save"

## Entering Counts

To record attendance counts:

1. From the Count Times tab, click "Enter Counts"
2. Select the count session from the dropdown if multiple sessions exist
3. For each position, enter:
   - The count (number of attendees)
   - Optional notes about the position
4. Use keyboard navigation (up/down arrows) to move between positions
5. Click "Save Counts" when finished

### Auto-Save Feature

The count entry form includes an auto-save feature that saves your progress every 30 seconds. This helps prevent data loss if you're interrupted while entering counts.

## Viewing Count Reports

To view attendance reports:

1. From the Count Times tab, click "View Reports"
2. The reports page shows:
   - A chart visualizing attendance trends across sessions
   - A table with counts for each position and session
   - Total counts for each session
   - Average counts across sessions

## Role-Based Access

- **Administrators** and **Overseers** can create count sessions, enter counts, and view reports
- **Attendants** do not have access to the count times feature

## Best Practices

1. **Create sessions in advance**: Set up count sessions before the event starts
2. **Standardize session names**: Use consistent naming (e.g., "Day 1 - Morning")
3. **Assign responsibility**: Designate specific overseers to handle counts for each session
4. **Use notes field**: Record any unusual circumstances that might affect counts
5. **Review trends**: Use the reports to identify attendance patterns

## Troubleshooting

### Missing Count Sessions
If you don't see any count sessions, you need to create one first using the "Add Count Time" button.

### Count Not Saving
If counts aren't saving:
1. Check your internet connection
2. Ensure you have the appropriate permissions
3. Try refreshing the page and re-entering the data

### Data Discrepancies
If you notice discrepancies in the count data:
1. Check for duplicate count sessions
2. Verify that all positions have been counted
3. Look for notes that might explain unusual counts

## Integration with Event-Centric Architecture

The Count Times feature is fully integrated with the event-centric architecture:
- All count sessions are scoped to specific events
- Count data is stored per event
- Navigation maintains the event context throughout the count workflow

For additional help or to report issues with the Count Times feature, please contact the system administrator.
