# Grid View Integration - Complete Code

## Step 1: Already Complete ✅
- Import added: `import PositionGridView from '../../../components/PositionGridView'`
- State added: `const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')`
- Toggle button added in header

## Step 2: Replace Line 2083-2084

**Find this (around line 2083):**
```typescript
          {/* Positions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

**Replace with:**
```typescript
          {/* Positions Grid or List View */}
          {viewMode === 'grid' ? (
            <PositionGridView
              positions={getFilteredPositions().filter(p => showInactive ? true : p.isActive)}
              attendants={attendants}
              eventId={eventId}
              onAssign={async (positionId, shiftId, attendantId) => {
                try {
                  const response = await fetch(`/api/events/${eventId}/positions/${positionId}/shifts/${shiftId}/assign`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ attendantId, role: 'ATTENDANT' })
                  })
                  if (response.ok) {
                    router.reload()
                  } else {
                    throw new Error('Assignment failed')
                  }
                } catch (error) {
                  console.error('Assignment error:', error)
                  throw error
                }
              }}
              onUnassign={async (assignmentId) => {
                try {
                  const response = await fetch(`/api/events/${eventId}/assignments/${assignmentId}`, {
                    method: 'DELETE'
                  })
                  if (response.ok) {
                    router.reload()
                  } else {
                    throw new Error('Unassignment failed')
                  }
                } catch (error) {
                  console.error('Unassignment error:', error)
                  throw error
                }
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

## Step 3: Add Closing Parenthesis

**Find this (around line 2654):**
```typescript
            )}
          </div>
        </div>

        {/* Position Template Modal */}
```

**Replace with:**
```typescript
            )}
          </div>
          )}

        {/* Position Template Modal */}
```

## That's It!

The integration is complete. The grid view will now show when the toggle button is clicked.
