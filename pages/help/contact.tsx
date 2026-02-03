import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import HelpLayout from '../../components/HelpLayout'
import Link from 'next/link'

interface ContactHelpProps {
  userRole: string
  userName: string
  userEmail: string
}

export default function ContactHelp({ userRole, userName, userEmail }: ContactHelpProps) {
  return (
    <HelpLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">📧 Contact Support</h1>
        
        <div className="prose max-w-none">
          <p className="text-lg text-gray-700 mb-6">
            Need help with TheoShift? We're here to assist you.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mb-3">👋 Hello, {userName}!</h2>
            <p className="text-blue-800">
              Your account email: <strong>{userEmail}</strong>
            </p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Before Contacting Support</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <p className="text-gray-700 mb-3">
              Many questions can be answered quickly by checking our help resources:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/help/getting-started" className="text-blue-600 hover:text-blue-800 transition-colors">
                📚 Getting Started Guide
              </Link>
              <Link href="/help/troubleshooting" className="text-blue-600 hover:text-blue-800 transition-colors">
                🔧 Troubleshooting
              </Link>
              <Link href="/help" className="text-blue-600 hover:text-blue-800 transition-colors">
                📖 Help Center
              </Link>
              <Link href="/help/feedback" className="text-blue-600 hover:text-blue-800 transition-colors">
                💡 Submit Feedback
              </Link>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Your Local Administrator</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <p className="text-gray-700 mb-3">
              For the fastest response, contact your local TheoShift administrator:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>They have direct access to your organization's setup</li>
              <li>They can help with user accounts, permissions, and event-specific questions</li>
              <li>They can escalate technical issues if needed</li>
            </ul>
            <p className="text-gray-700 mt-4">
              If you don't know who your administrator is, check with your event coordinator or organizational leadership.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Submit Feedback or Bug Reports</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <p className="text-gray-700 mb-4">
              Use our feedback system to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Report bugs or technical issues</li>
              <li>Suggest new features or improvements</li>
              <li>Request enhancements to existing features</li>
            </ul>
            <Link 
              href="/help/feedback"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              💡 Submit Feedback
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Common Support Topics</h2>
          <div className="space-y-4 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Account & Login Issues</h3>
              <p className="text-gray-700 mb-2">
                Can't log in? Forgot your password? Need to update your email?
              </p>
              <Link href="/help/troubleshooting" className="text-blue-600 hover:underline">
                → View Troubleshooting Guide
              </Link>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Assignment Questions</h3>
              <p className="text-gray-700 mb-2">
                Questions about your assignments, schedules, or confirmations?
              </p>
              <Link href="/help/managing-assignments" className="text-blue-600 hover:underline">
                → Learn About Assignments
              </Link>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Event Management</h3>
              <p className="text-gray-700 mb-2">
                Need help creating events, managing volunteers, or using advanced features?
              </p>
              <Link href="/help/event-management" className="text-blue-600 hover:underline">
                → Event Management Guide
              </Link>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Mobile App</h3>
              <p className="text-gray-700 mb-2">
                Questions about using TheoShift on your phone or tablet?
              </p>
              <Link href="/help/mobile-features" className="text-blue-600 hover:underline">
                → Mobile Features Guide
              </Link>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">When Contacting Support</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <p className="text-gray-700 mb-3">
              To help us assist you quickly, please include:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>A clear description of the issue or question</li>
              <li>Steps to reproduce the problem (if applicable)</li>
              <li>Screenshots or error messages (if any)</li>
              <li>Your browser and device type</li>
              <li>The page or feature where the issue occurs</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">⏱️ Response Times</h3>
            <p className="text-yellow-800">
              Response times vary depending on the nature of your request and the availability of support staff. 
              For urgent issues affecting event operations, contact your local administrator directly.
            </p>
          </div>
        </div>
      </div>
    </HelpLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    }
  }

  return {
    props: {
      userRole: session.user?.role || 'VOLUNTEER',
      userName: session.user?.name || 'User',
      userEmail: session.user?.email || '',
    },
  }
}
