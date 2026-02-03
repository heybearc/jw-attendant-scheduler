import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import HelpLayout from '../../components/HelpLayout'
import Link from 'next/link'

interface UserManagementHelpProps {
  userRole: string
}

export default function UserManagementHelp({ userRole }: UserManagementHelpProps) {
  return (
    <HelpLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">👥 User Management</h1>
        
        <div className="prose max-w-none">
          <p className="text-lg text-gray-700 mb-6">
            Learn how to invite users, manage roles, and handle user accounts in TheoShift.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mb-3">🔐 Admin Only Feature</h2>
            <p className="text-blue-800">
              User management is only available to administrators. If you need to invite users or manage roles, contact your system administrator.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Inviting New Users</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Step 1: Navigate to User Management</h3>
            <p className="text-gray-700 mb-3">
              From the admin menu, click <strong>Users</strong> to access the user management page.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-4">Step 2: Send Invitation</h3>
            <p className="text-gray-700 mb-3">
              Click the <strong>Invite User</strong> button and enter:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-3">
              <li>Email address</li>
              <li>First and last name</li>
              <li>User role (see roles below)</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-4">Step 3: User Receives Email</h3>
            <p className="text-gray-700">
              The user will receive an invitation email with a link to set their password and activate their account.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">User Roles</h2>
          <div className="space-y-4 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🔴 ADMIN</h3>
              <p className="text-gray-700">
                Full system access. Can manage users, configure email, create events, and access all features.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🟡 OVERSEER</h3>
              <p className="text-gray-700">
                Can create and manage events, assign volunteers, and manage event-specific settings. Cannot manage users or system configuration.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🟢 ASSISTANT_OVERSEER</h3>
              <p className="text-gray-700">
                Can assist with event management and volunteer assignments. Limited administrative capabilities.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🔵 KEYMAN</h3>
              <p className="text-gray-700">
                Can manage specific departments or areas within events. Focused on operational tasks.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">⚪ VOLUNTEER</h3>
              <p className="text-gray-700">
                Can view their own assignments and access the volunteer portal. No administrative access.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Managing Existing Users</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Changing User Roles</h3>
            <p className="text-gray-700 mb-3">
              From the Users page, click the <strong>Edit</strong> button next to a user to change their role or update their information.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-4">Deactivating Users</h3>
            <p className="text-gray-700 mb-3">
              To remove a user's access, deactivate their account. This preserves their data but prevents login.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-4">Resetting Passwords</h3>
            <p className="text-gray-700">
              Users can reset their own passwords via the login page. Admins can also send password reset emails from the user management page.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Session Management</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <p className="text-gray-700 mb-3">
              Admins can view and manage active user sessions from the <Link href="/help/session-management" className="text-blue-600 hover:underline">Session Management</Link> page.
            </p>
            <p className="text-gray-700">
              This allows you to see who is currently logged in and terminate sessions if needed.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-green-900 mb-2">💡 Best Practices</h3>
            <ul className="list-disc list-inside text-green-800 space-y-2">
              <li>Only grant ADMIN role to trusted individuals</li>
              <li>Use OVERSEER role for event coordinators</li>
              <li>Regularly review active users and deactivate unused accounts</li>
              <li>Ensure email configuration is working before inviting users</li>
            </ul>
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
