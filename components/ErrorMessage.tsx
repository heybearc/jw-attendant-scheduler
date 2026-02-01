import { ReactNode } from 'react'

interface ErrorMessageProps {
  title?: string
  message: string
  onRetry?: () => void
  onDismiss?: () => void
  type?: 'error' | 'warning' | 'info'
}

export const ErrorMessage = ({ 
  title, 
  message, 
  onRetry, 
  onDismiss,
  type = 'error' 
}: ErrorMessageProps) => {
  const colors = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: '❌'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: '⚠️'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'ℹ️'
    }
  }
  
  const style = colors[type]
  
  return (
    <div className={`${style.bg} border ${style.border} rounded-lg p-4 mb-4`}>
      <div className="flex items-start">
        <span className="text-2xl mr-3">{style.icon}</span>
        <div className="flex-1">
          {title && (
            <h3 className={`font-semibold ${style.text} mb-1`}>{title}</h3>
          )}
          <p className={`text-sm ${style.text}`}>{message}</p>
          
          {(onRetry || onDismiss) && (
            <div className="flex space-x-3 mt-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 underline touch-manipulation min-h-[44px] px-3"
                >
                  Try Again
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-sm font-medium text-gray-600 hover:text-gray-800 underline touch-manipulation min-h-[44px] px-3"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const EmptyState = ({ 
  icon, 
  title, 
  message, 
  action 
}: { 
  icon: string
  title: string
  message: string
  action?: { label: string; onClick: () => void }
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors touch-manipulation min-h-[44px]"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

export const OfflineIndicator = () => {
  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 px-4 z-50 shadow-lg">
      <div className="flex items-center justify-center">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
        </svg>
        <span className="font-medium">You're offline. Some features may be limited.</span>
      </div>
    </div>
  )
}

export const SuccessMessage = ({ message, onDismiss }: { message: string; onDismiss?: () => void }) => {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <span className="text-2xl mr-3">✅</span>
        <div className="flex-1">
          <p className="text-sm text-green-800">{message}</p>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-sm font-medium text-green-600 hover:text-green-800 underline mt-2 touch-manipulation min-h-[44px] px-3"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
