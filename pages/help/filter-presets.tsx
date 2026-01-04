import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import HelpLayout from '../../components/HelpLayout'
import Link from 'next/link'

interface FilterPresetsProps {
  userRole: string
}

export default function FilterPresetsPage({ userRole }: FilterPresetsProps) {
  return (
    <HelpLayout title="Filter Presets">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">⭐ Saved Filter Presets</h1>
          <p className="text-gray-600">
            Save and reuse your favorite filter combinations
          </p>
        </div>

        {/* Overview */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-3">What are Filter Presets?</h2>
          <p className="text-blue-800">
            Filter presets let you save commonly used filter combinations so you don't have to set them up every time. 
            For example, if you frequently need to see "Active Elders" or "Pioneers in Main Congregation", you can 
            save those filters and apply them with one click.
          </p>
        </div>

        <div className="space-y-8">
          {/* How to Save */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">💾 Saving a Filter Preset</h2>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Set Your Filters</h4>
                    <p className="text-gray-600">On the Attendants page, set up the filters you want to save (search, congregation, status, roles, etc.)</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Click "Save Current Filters"</h4>
                    <p className="text-gray-600">Look for the "💾 Save Current Filters" button near the top of the filters section</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Name Your Preset</h4>
                    <p className="text-gray-600">Give your preset a descriptive name like "Active Elders" or "Baptism Assistants"</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Save</h4>
                    <p className="text-gray-600">Click "Save Preset" and it's ready to use!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How to Use */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🎯 Using Saved Presets</h2>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Show Presets</h4>
                    <p className="text-gray-600">Click "⭐ Show Filter Presets" to see all your saved presets</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Choose a Preset</h4>
                    <p className="text-gray-600">Click "Apply Filters" on any preset card</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Filters Applied!</h4>
                    <p className="text-gray-600">All the saved filters are instantly applied to your attendant list</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Examples */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">💡 Useful Preset Examples</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Active Elders</h3>
                <p className="text-sm text-gray-600 mb-2">Filters:</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Status: Active</li>
                  <li>• Role: Elder</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Pioneers</h3>
                <p className="text-sm text-gray-600 mb-2">Filters:</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Status: Active</li>
                  <li>• Role: Pioneer</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Main Congregation</h3>
                <p className="text-sm text-gray-600 mb-2">Filters:</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Congregation: Main</li>
                  <li>• Status: Active</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Needs Assignment</h3>
                <p className="text-sm text-gray-600 mb-2">Filters:</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Status: Active</li>
                  <li>• Overseer: None</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Managing Presets */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🗑️ Managing Your Presets</h2>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Deleting Presets</h3>
              <p className="text-gray-600 mb-3">
                To delete a preset you no longer need:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Click "⭐ Show Filter Presets"</li>
                <li>Find the preset you want to delete</li>
                <li>Click the "×" button in the top-right corner of the preset card</li>
                <li>Confirm deletion</li>
              </ol>
            </div>
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">❓ Common Questions</h2>
            
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Are my presets shared with other users?</h3>
                <p className="text-gray-600">
                  No, your filter presets are saved to your browser and are only visible to you. Each user creates 
                  and manages their own presets.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Are presets saved per event?</h3>
                <p className="text-gray-600">
                  Yes, each event has its own set of filter presets. This allows you to create presets specific to 
                  each event's needs.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">What happens if I clear my browser data?</h3>
                <p className="text-gray-600">
                  Filter presets are stored in your browser's local storage. If you clear your browser data, your 
                  presets will be deleted and you'll need to recreate them.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">How many presets can I save?</h3>
                <p className="text-gray-600">
                  There's no hard limit, but we recommend keeping your most frequently used presets for best organization.
                </p>
              </div>
            </div>
          </div>

          {/* Related Help */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">📚 Related Help Topics</h3>
            <div className="space-y-2">
              <Link href="/help/attendant-management" className="block text-blue-600 hover:text-blue-800 hover:underline">
                → Attendant Management - Managing volunteers
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
