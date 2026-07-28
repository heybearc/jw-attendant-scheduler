import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import { useRouter } from 'next/router'
import { prisma } from '@/lib/prisma'
import EarlyCheckinPanel from '../../components/EarlyCheckinPanel'
import PWABottomNav from '../../components/PWABottomNav'
import { verifyVolunteerIvsEarlyCheckinAccessForIds } from '@/lib/ivsVolunteerEarlyCheckinAccess'

interface EarlyCheckinPageProps {
  event: { id: string; name: string }
  hasAccess: boolean
  accessMessage?: string
}

export default function VolunteerEarlyCheckinPage({
  event,
  hasAccess,
  accessMessage,
}: EarlyCheckinPageProps) {
  const router = useRouter()
  const viewAs =
    typeof router.query.viewAsVolunteerId === 'string' ? router.query.viewAsVolunteerId : null

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            {accessMessage ||
              'You do not have access to the early check-in feature for this event.'}
          </p>
          <button
            onClick={() =>
              router.push(
                event?.id
                  ? `/volunteer/dashboard?eventId=${event.id}${
                      viewAs ? `&viewAsVolunteerId=${viewAs}` : ''
                    }`
                  : '/volunteer/dashboard',
              )
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <EarlyCheckinPanel
        eventId={event.id}
        eventName={event.name}
        showHeader={true}
        onBack={() =>
          router.push(
            `/volunteer/dashboard?eventId=${event.id}${
              viewAs ? `&viewAsVolunteerId=${viewAs}` : ''
            }`,
          )
        }
      />
      <PWABottomNav
        activeTab="checkin"
        eventId={event.id}
        viewAsVolunteerId={viewAs}
        showCheckIn
      />
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session?.user?.id) {
    return {
      redirect: {
        destination: '/volunteer/login',
        permanent: false,
      },
    }
  }

  let eventId = context.query.eventId
  if (Array.isArray(eventId)) eventId = eventId[0]

  // Fall back so mobile bottom-nav deep links still work if query is missing
  if (!eventId || typeof eventId !== 'string') {
    return {
      redirect: {
        destination: '/volunteer/select-event',
        permanent: false,
      },
    }
  }

  const viewAsRaw = context.query.viewAsVolunteerId
  const viewAsVolunteerId = typeof viewAsRaw === 'string' ? viewAsRaw : null

  try {
    const event = await prisma.events.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
      },
    })

    if (!event) {
      return {
        redirect: {
          destination: '/volunteer/dashboard',
          permanent: false,
        },
      }
    }

    const access = await verifyVolunteerIvsEarlyCheckinAccessForIds(
      session.user.id,
      session.user.role,
      eventId,
      { viewAsVolunteerId },
    )

    return {
      props: {
        event: { id: event.id, name: event.name },
        hasAccess: access.ok,
        ...(access.ok ? {} : { accessMessage: access.message }),
      },
    }
  } catch (error) {
    console.error('Error loading early check-in page:', error)
    return {
      redirect: {
        destination: '/volunteer/dashboard',
        permanent: false,
      },
    }
  }
}
