import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../api/auth/[...nextauth]'
import { prisma } from '../../../src/lib/prisma'
import { canManageIvsVolunteers } from '../../../src/lib/eventAccess'
import EventPageLayout from '../../../components/EventPageLayout'
import { TemplateProvider } from '../../../contexts/TemplateContext'
import IVSApprovalsContent from '../../../components/ivs/IVSApprovalsContent'
import IVSCheckinContent from '../../../components/ivs/IVSCheckinContent'

interface IVSModulePageProps {
  event: any
  canEdit: boolean
}

export default function IVSModulePage({ event, canEdit }: IVSModulePageProps) {
  const [activeTab, setActiveTab] = useState<'approvals' | 'checkin'>('approvals')
  const [checkinEverOpened, setCheckinEverOpened] = useState(false)

  useEffect(() => {
    if (activeTab === 'checkin') setCheckinEverOpened(true)
  }, [activeTab])

  const moduleConfig = event?.settings?.modules
    ? {
        countTimes: event.settings.modules.countTimes ?? true,
        lanyards: event.settings.modules.lanyards ?? true,
        ivsModule: event.settings.modules.ivsModule ?? false,
        positions: event.settings.modules.positions ?? true,
        documents: event.settings.modules.documents ?? true,
        announcements: event.settings.modules.announcements ?? true,
      }
    : null
  const terminology = event?.settings?.terminology || null

  return (
    <TemplateProvider moduleConfig={moduleConfig} terminology={terminology}>
      <EventPageLayout
        event={event}
        currentPage="ivs"
        canEdit={canEdit}
      >
        <div className="p-4 sm:p-6 max-w-full min-w-0">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold">IVS Module</h1>
          </div>

          {/* Tab Navigation — full-width taps on small screens */}
          <div className="mb-4 sm:mb-6 border-b border-gray-200">
            <div className="grid grid-cols-2 sm:flex sm:gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('approvals')}
                className={`px-3 py-3 sm:px-4 sm:py-2 text-sm sm:text-base font-semibold transition-colors border-b-2 text-center sm:text-left min-h-[44px] sm:min-h-0 ${
                  activeTab === 'approvals'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Approvals
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('checkin')}
                className={`px-3 py-3 sm:px-4 sm:py-2 text-sm sm:text-base font-semibold transition-colors border-b-2 text-center sm:text-left min-h-[44px] sm:min-h-0 ${
                  activeTab === 'checkin'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                ⏰ Early Check-In
              </button>
            </div>
          </div>

          {/* Approvals always mounted; check-in mounts after first visit (avoids SSR hydration mismatch) */}
          <div className={activeTab === 'approvals' ? '' : 'hidden'}>
            <IVSApprovalsContent event={event} canEdit={canEdit} />
          </div>
          {checkinEverOpened && (
            <div className={activeTab === 'checkin' ? '' : 'hidden'}>
              <IVSCheckinContent event={event} />
            </div>
          )}
        </div>
      </EventPageLayout>
    </TemplateProvider>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)
  
  if (!session?.user?.id) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    }
  }

  const { id } = context.params as { id: string }

  try {
    const event = await prisma.events.findUnique({
      where: { id },
    })

    if (!event) {
      return { notFound: true }
    }

    const canEdit = await canManageIvsVolunteers(session.user.id, id)

    return {
      props: {
        event: JSON.parse(JSON.stringify(event)),
        canEdit,
      },
    }
  } catch (error) {
    console.error('Error fetching event:', error)
    return { notFound: true }
  }
}
