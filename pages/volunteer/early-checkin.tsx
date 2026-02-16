import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import { useRouter } from 'next/router'
import { PrismaClient } from '@prisma/client'
import EarlyCheckinPanel from '../../components/EarlyCheckinPanel'

const prisma = new PrismaClient()

interface EarlyCheckinPageProps {
  event: any
  hasAccess: boolean
}

export default function VolunteerEarlyCheckinPage({ event, hasAccess }: EarlyCheckinPageProps) {
  const router = useRouter()

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You do not have access to the early check-in feature for this event.
          </p>
          <button
            onClick={() => router.push('/volunteer/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EarlyCheckinPanel 
        eventId={event.id}
        eventName={event.name}
        showHeader={true}
        onBack={() => router.push('/volunteer/dashboard')}
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

  const { eventId } = context.query

  if (!eventId || typeof eventId !== 'string') {
    return {
      redirect: {
        destination: '/volunteer/dashboard',
        permanent: false,
      },
    }
  }

  try {
    const event = await prisma.events.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
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

    // Check if user is an IVS volunteer for this event
    const ivsVolunteer = await prisma.event_volunteers.findFirst({
      where: {
        eventId: eventId,
        userId: session.user.id,
        ivsSubmittedBy: 'IVS',
        ivsApprovalStatus: 'Approved',
      },
    })

    const hasAccess = !!ivsVolunteer

    return {
      props: {
        event,
        hasAccess,
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
  } finally {
    await prisma.$disconnect()
  }
}
