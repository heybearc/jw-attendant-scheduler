// Reusable loading skeleton components for better perceived performance

export const CardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
  </div>
)

export const TableRowSkeleton = () => (
  <div className="flex items-center space-x-4 p-4 border-b border-gray-200 animate-pulse">
    <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </div>
    <div className="h-8 w-20 bg-gray-200 rounded"></div>
  </div>
)

export const ListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
)

export const DashboardSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    {/* Header */}
    <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
    
    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm p-6">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        </div>
      ))}
    </div>
    
    {/* Content Cards */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

export const FormSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm p-6 space-y-4 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
    <div className="h-10 bg-gray-200 rounded w-full"></div>
    
    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
    <div className="h-10 bg-gray-200 rounded w-full"></div>
    
    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
    <div className="h-24 bg-gray-200 rounded w-full"></div>
    
    <div className="flex justify-end space-x-3 mt-6">
      <div className="h-10 w-24 bg-gray-200 rounded"></div>
      <div className="h-10 w-24 bg-gray-200 rounded"></div>
    </div>
  </div>
)

export const PositionGridSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 animate-pulse">
    {Array.from({ length: 24 }).map((_, i) => (
      <div key={i} className="aspect-square bg-gray-200 rounded-lg"></div>
    ))}
  </div>
)
