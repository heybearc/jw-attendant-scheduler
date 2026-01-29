import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import HelpLayout from '../../components/HelpLayout'
import Link from 'next/link'

interface PositionTemplatesProps {
  userRole: string
}

export default function PositionTemplatesPage({ userRole }: PositionTemplatesProps) {
  return (
    <HelpLayout title="Position Templates">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📋 Position Templates</h1>
          <p className="text-gray-600">
            Create multiple positions instantly using department templates
          </p>
        </div>

        {/* Overview */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-3">What are Position Templates?</h2>
          <p className="text-blue-800">
            Position templates let you create multiple positions with one click. Instead of manually creating 
            each position (Main Entrance, Upper Level, Stage Area, etc.), you can select them from a pre-configured 
            list and create them all at once.
          </p>
        </div>

        <div className="space-y-8">
          {/* How to Use */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🎯 How to Use Position Templates</h2>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Go to Positions Page</h4>
                    <p className="text-gray-600">Navigate to your event and click on the "Positions" tab</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Look for the Purple Button</h4>
                    <p className="text-gray-600">If your event has a department template configured, you'll see a purple "📋 Create from Template" button</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Select Positions</h4>
                    <p className="text-gray-600">A modal will show all available position templates. Check the boxes for the positions you want to create</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Create Positions</h4>
                    <p className="text-gray-600">Click "Create X Position(s)" and all selected positions will be created instantly!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* What You'll See */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">👀 What You'll See</h2>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
              <h3 className="text-lg font-semibold text-green-900 mb-3">Position Template Modal</h3>
              <p className="text-green-800 mb-3">When you click "Create from Template", you'll see:</p>
              <ul className="space-y-2 text-green-800">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>List of all available positions for your department</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Checkboxes to select which positions to create</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>"Select All" and "Deselect All" buttons for convenience</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Position details like capacity and description</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">After Creating</h3>
              <p className="text-blue-800 mb-3">Once created, you'll see:</p>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>All positions appear in your positions list</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Positions are automatically numbered in sequence</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Ready to assign volunteers immediately</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Examples */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">💡 Examples</h2>
            
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Volunteers Department</h3>
                <p className="text-gray-600 mb-2">Available position templates:</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Main Entrance (Capacity: 2)</li>
                  <li>• Upper Level (Capacity: 2)</li>
                  <li>• Lower Level (Capacity: 2)</li>
                  <li>• Stage Area (Capacity: 1)</li>
                  <li>• Contribution Boxes (Capacity: 2)</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Baptism Department</h3>
                <p className="text-gray-600 mb-2">Available position templates:</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Baptism Speaker (Capacity: 1)</li>
                  <li>• Pool Assistant (Capacity: 2)</li>
                  <li>• Changing Room Volunteer (Capacity: 2)</li>
                  <li>• Coordinator (Capacity: 1)</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Parking Department</h3>
                <p className="text-gray-600 mb-2">Available position templates:</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Lot A Volunteer (Capacity: 2)</li>
                  <li>• Lot B Volunteer (Capacity: 2)</li>
                  <li>• Traffic Director (Capacity: 1)</li>
                  <li>• Overflow Coordinator (Capacity: 1)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">❓ Common Questions</h2>
            
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Why don't I see the "Create from Template" button?</h3>
                <p className="text-gray-600">
                  The button only appears if your event has a department template configured with position templates. 
                  If you don't see it, your event may not have a template assigned, or the template doesn't include 
                  position templates.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Can I still create positions manually?</h3>
                <p className="text-gray-600">
                  Yes! Position templates are optional. You can always use the "+ Create Position" button to add 
                  positions one at a time, or use "🚀 Bulk Create" for custom positions.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Can I edit positions after creating from template?</h3>
                <p className="text-gray-600">
                  Absolutely! Positions created from templates are just like any other position. You can edit names, 
                  capacities, add shifts, and make any changes you need.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">What if I already have some positions created?</h3>
                <p className="text-gray-600">
                  No problem! Position templates will add new positions starting from the next available position number. 
                  Your existing positions won't be affected.
                </p>
              </div>
            </div>
          </div>

          {/* Related Help */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">📚 Related Help Topics</h3>
            <div className="space-y-2">
              <Link href="/help/department-templates" className="block text-blue-600 hover:text-blue-800 hover:underline">
                → Department Templates - Understanding templates
              </Link>
              <Link href="/help/managing-assignments" className="block text-blue-600 hover:text-blue-800 hover:underline">
                → Managing Assignments - Assigning volunteers to positions
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
