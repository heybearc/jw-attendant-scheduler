import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import HelpLayout from '../../components/HelpLayout'
import Link from 'next/link'

interface DepartmentTemplatesProps {
  userRole: string
}

export default function DepartmentTemplatesPage({ userRole }: DepartmentTemplatesProps) {
  return (
    <HelpLayout title="Department Templates">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🎯 Department Templates</h1>
          <p className="text-gray-600">
            Understanding and using department templates to customize your event experience
          </p>
        </div>

        {/* Overview */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-3">What are Department Templates?</h2>
          <p className="text-blue-800 mb-3">
            Department templates customize how events work based on which department is managing them. 
            Each template controls what features are available, what terminology is used, and what 
            information is needed.
          </p>
          <p className="text-blue-800">
            For example, an Volunteers event shows different features than a Baptism event or Parking event.
          </p>
        </div>

        <div className="space-y-8">
          {/* Available Templates */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📋 Available Templates</h2>
            
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">👥 Volunteers Department</h3>
                <p className="text-gray-600 mb-3">
                  For managing volunteers at assemblies and conventions
                </p>
                <div className="text-sm text-gray-700">
                  <p className="font-semibold mb-1">Features enabled:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Count Times tracking</li>
                    <li>Lanyard management</li>
                    <li>Position assignments</li>
                    <li>Badge numbers</li>
                  </ul>
                  <p className="font-semibold mt-3 mb-1">Terminology:</p>
                  <ul className="list-disc list-inside">
                    <li>"Volunteer" instead of "Volunteer"</li>
                    <li>"Post" instead of "Position"</li>
                  </ul>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">💧 Baptism Department</h3>
                <p className="text-gray-600 mb-3">
                  For coordinating baptism events and assistants
                </p>
                <div className="text-sm text-gray-700">
                  <p className="font-semibold mb-1">Features enabled:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Position assignments</li>
                    <li>Candidate tracking</li>
                    <li>Interview scheduling</li>
                  </ul>
                  <p className="font-semibold mt-3 mb-1">Features disabled:</p>
                  <ul className="list-disc list-inside">
                    <li>Count Times (not needed)</li>
                    <li>Lanyards (not needed)</li>
                  </ul>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">🚗 Parking Department</h3>
                <p className="text-gray-600 mb-3">
                  For managing parking lot volunteers and traffic flow
                </p>
                <div className="text-sm text-gray-700">
                  <p className="font-semibold mb-1">Features enabled:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Position assignments</li>
                    <li>Lot assignments</li>
                    <li>Vehicle tracking</li>
                  </ul>
                  <p className="font-semibold mt-3 mb-1">Terminology:</p>
                  <ul className="list-disc list-inside">
                    <li>"Parking Volunteer"</li>
                    <li>"Station" instead of "Position"</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* How to Use */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🎯 How to Use Department Templates</h2>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">When Creating an Event</h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Select Department Template First</h4>
                    <p className="text-gray-600">At the top of the event creation form, choose which department template to use</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">See Custom Fields Appear</h4>
                    <p className="text-gray-600">Based on your template choice, you'll see department-specific fields to fill in</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Complete the Form</h4>
                    <p className="text-gray-600">Fill in all required information and create your event</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Use Template Features</h4>
                    <p className="text-gray-600">Your event will now show only the features relevant to your department</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* What You'll See */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">👀 What You'll See</h2>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-3">Template-Specific Features</h3>
              <ul className="space-y-2 text-green-800">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Navigation tabs show only relevant features for your department</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Terminology changes to match your department (e.g., "Volunteer" vs "Volunteer")</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Custom fields appear for department-specific information</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Position templates available for quick setup</span>
                </li>
              </ul>
            </div>
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">❓ Common Questions</h2>
            
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Can I change the template after creating an event?</h3>
                <p className="text-gray-600">
                  Contact your system administrator if you need to change an event's department template.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">What if I don't select a template?</h3>
                <p className="text-gray-600">
                  You can create events without a template. All features will be available, and the system will use 
                  "Volunteer" as the default terminology. A notice will remind you to configure a template if needed.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Who creates department templates?</h3>
                <p className="text-gray-600">
                  System administrators configure department templates. If you need a new template or changes to 
                  existing ones, contact your administrator.
                </p>
              </div>
            </div>
          </div>

          {/* Related Help */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">📚 Related Help Topics</h3>
            <div className="space-y-2">
              <Link href="/help/position-templates" className="block text-blue-600 hover:text-blue-800 hover:underline">
                → Position Templates - Quick position setup
              </Link>
              <Link href="/help/custom-fields" className="block text-blue-600 hover:text-blue-800 hover:underline">
                → Custom Fields - Department-specific information
              </Link>
              <Link href="/help/event-management" className="block text-blue-600 hover:text-blue-800 hover:underline">
                → Event Management - Creating and managing events
              </Link>
            </div>
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
      userRole: session.user.role
    },
  }
}
