import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../api/auth/[...nextauth]'
import { prisma } from '../../src/lib/prisma'
import { useState } from 'react'

interface Position {
  id: string
  name: string
  description: string | null
  area: string | null
  positionNumber: number
  sequence: number
}

interface Props {
  event: {
    id: string
    name: string
    startDate: string
    endDate: string
    totalPositions: number
  }
  positionsByArea: Record<string, Position[]>
}

export default function ExtractCircuitAssemblyPositions({ event, positionsByArea }: Props) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handlePopulateTemplate = async () => {
    if (!confirm('This will populate the Position Templates in the Attendants - Willoughby department template. Continue?')) {
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/populate-position-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentTemplateId: 'dept-attendants-willoughby',
          positions: positionsByArea
        })
      })

      const data = await response.json()

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Successfully populated ${data.template.positionCount} position templates in ${data.template.name} department!`
        })
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to populate position templates'
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An error occurred while populating position templates'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApplyToEvent = async () => {
    const eventName = prompt('Enter the event name to apply these positions to (e.g., "Attendants - Circuit Assembly"):')
    if (!eventName) return

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/apply-positions-to-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: eventName.trim(),
          positions: positionsByArea
        })
      })

      const data = await response.json()

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Successfully created ${data.positionsCreated} positions for event "${data.eventName}"!`
        })
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to apply positions to event'
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An error occurred while applying positions to event'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Extract Circuit Assembly Positions
          </h1>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Event Information</h2>
            <p><strong>Name:</strong> {event.name}</p>
            <p><strong>Start Date:</strong> {new Date(event.startDate).toLocaleDateString()}</p>
            <p><strong>End Date:</strong> {new Date(event.endDate).toLocaleDateString()}</p>
            <p><strong>Total Positions:</strong> {event.totalPositions}</p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Positions by Area ({Object.keys(positionsByArea).length} areas)
            </h2>
            
            {Object.entries(positionsByArea).sort(([a], [b]) => a.localeCompare(b)).map(([area, positions]) => (
              <div key={area} className="mb-6 border border-gray-200 rounded-lg p-4">
                <h3 className="text-md font-semibold text-gray-800 mb-3 bg-gray-100 px-3 py-2 rounded">
                  {area} ({positions.length} positions)
                </h3>
                <div className="space-y-2">
                  {positions.map((pos) => (
                    <div key={pos.id} className="pl-4 py-2 border-l-2 border-blue-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-gray-900">{pos.name}</span>
                          <span className="ml-2 text-sm text-gray-500">
                            #{pos.positionNumber}
                          </span>
                        </div>
                      </div>
                      {pos.description && (
                        <p className="text-sm text-gray-600 mt-1">{pos.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 flex-wrap">
            <button
              onClick={handlePopulateTemplate}
              disabled={loading}
              className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Working...' : 'Populate Willoughby Template'}
            </button>
            <button
              onClick={handleApplyToEvent}
              disabled={loading}
              className={`px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Working...' : 'Apply to Existing Event'}
            </button>
            <button
              onClick={() => {
                const dataStr = JSON.stringify({ event, positionsByArea }, null, 2)
                const dataBlob = new Blob([dataStr], { type: 'application/json' })
                const url = URL.createObjectURL(dataBlob)
                const link = document.createElement('a')
                link.href = url
                link.download = `circuit-assembly-positions.json`
                link.click()
              }}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Download JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false
      }
    }
  }

  try {
    // Find the completed circuit assembly event
    const event = await prisma.events.findFirst({
      where: {
        eventType: 'CIRCUIT_ASSEMBLY'
      },
      orderBy: {
        startDate: 'desc'
      }
    })

    if (!event) {
      return {
        notFound: true
      }
    }

    // Get all positions for this event
    const positions = await prisma.positions.findMany({
      where: {
        eventId: event.id,
        isActive: true
      },
      orderBy: [
        { area: 'asc' },
        { sequence: 'asc' }
      ]
    })

    // Group positions by area
    const positionsByArea: Record<string, Position[]> = {}
    positions.forEach(pos => {
      const area = pos.area || 'General'
      if (!positionsByArea[area]) {
        positionsByArea[area] = []
      }
      positionsByArea[area].push({
        id: pos.id,
        name: pos.name,
        description: pos.description,
        area: pos.area,
        positionNumber: pos.positionNumber,
        sequence: pos.sequence
      })
    })

    return {
      props: {
        event: {
          id: event.id,
          name: event.name,
          startDate: event.startDate.toISOString(),
          endDate: event.endDate.toISOString(),
          totalPositions: positions.length
        },
        positionsByArea
      }
    }
  } catch (error) {
    console.error('Error extracting positions:', error)
    return {
      notFound: true
    }
  }
}
