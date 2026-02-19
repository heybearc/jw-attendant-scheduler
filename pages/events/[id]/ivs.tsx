import { useState } from 'react'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../api/auth/[...nextauth]'
import { prisma } from '../../../src/lib/prisma'
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
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">IVS Module</h1>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 border-b border-gray-200">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('approvals')}
                className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
                  activeTab === 'approvals'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Approvals
              </button>
              <button
                onClick={() => setActiveTab('checkin')}
                className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
                  activeTab === 'checkin'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                ⏰ Early Check-In
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'approvals' ? (
            <IVSApprovalsContent event={event} canEdit={canEdit} />
          ) : (
            <IVSCheckinContent event={event} />
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

    const canEdit = event.createdBy === session.user.id

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
