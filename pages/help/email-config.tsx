import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import HelpLayout from '../../components/HelpLayout'

interface EmailConfigHelpProps {
  userRole: string
}

export default function EmailConfigHelp({ userRole }: EmailConfigHelpProps) {
  return (
    <HelpLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">📧 Email Configuration</h1>
        
        <div className="prose max-w-none">
          <p className="text-lg text-gray-700 mb-6">
            Configure email settings to enable user invitations and assignment notifications.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mb-3">🔐 Admin Only Feature</h2>
            <p className="text-blue-800">
              Email configuration is only available to administrators. Contact your system administrator if you need email settings adjusted.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">SMTP Configuration</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <p className="text-gray-700 mb-4">
              TheoShift uses SMTP (Simple Mail Transfer Protocol) to send emails. You'll need the following information from your email provider:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>SMTP Server:</strong> The mail server address (e.g., smtp.gmail.com)</li>
              <li><strong>SMTP Port:</strong> Usually 587 for TLS or 465 for SSL</li>
              <li><strong>Username:</strong> Your email address or SMTP username</li>
              <li><strong>Password:</strong> Your email password or app-specific password</li>
              <li><strong>From Email:</strong> The email address that will appear as the sender</li>
              <li><strong>From Name:</strong> The name that will appear as the sender</li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Common Email Providers</h2>
          <div className="space-y-4 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Gmail</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Server: smtp.gmail.com</li>
                <li>Port: 587</li>
                <li>Requires app-specific password (not your regular Gmail password)</li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Microsoft 365 / Outlook</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Server: smtp.office365.com</li>
                <li>Port: 587</li>
                <li>Use your Microsoft 365 credentials</li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Other Providers</h3>
              <p className="text-gray-700">
                Contact your email provider for SMTP settings. Most providers offer SMTP access for sending emails programmatically.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Email Templates</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <p className="text-gray-700 mb-3">
              TheoShift sends several types of emails:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>User Invitations:</strong> Sent when inviting new users to the system</li>
              <li><strong>Assignment Notifications:</strong> Sent when volunteers are assigned to positions</li>
              <li><strong>Assignment Confirmations:</strong> Sent when volunteers confirm or decline assignments</li>
              <li><strong>Feedback Notifications:</strong> Sent to admins when users submit feedback</li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Testing Email Configuration</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <p className="text-gray-700 mb-3">
              After configuring email settings:
            </p>
            <ol className="list-decimal list-inside text-gray-700 space-y-2">
              <li>Save the configuration</li>
              <li>Send a test invitation to yourself</li>
              <li>Verify the email is received and formatted correctly</li>
              <li>Check that links in the email work properly</li>
            </ol>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Troubleshooting</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Emails Not Sending</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Verify SMTP credentials are correct</li>
              <li>Check that your email provider allows SMTP access</li>
              <li>Ensure firewall isn't blocking SMTP ports</li>
              <li>For Gmail, use an app-specific password</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">Emails Going to Spam</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Configure SPF and DKIM records for your domain</li>
              <li>Use a professional email address (not free providers)</li>
              <li>Ensure "From" address matches SMTP credentials</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">⚠️ Security Note</h3>
            <p className="text-yellow-800">
              Email passwords are stored securely in the database. Never share your SMTP credentials with unauthorized users.
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

  if (session.user?.role !== 'ADMIN') {
    return {
      redirect: {
        destination: '/help',
        permanent: false,
      },
    }
  }

  return {
    props: {
      userRole: session.user?.role || 'VOLUNTEER',
    },
  }
}
