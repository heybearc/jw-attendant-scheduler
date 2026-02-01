import { ButtonHTMLAttributes, ReactNode } from 'react'

interface TouchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

// Touch-optimized button with proper feedback and sizing
export const TouchButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  ...props 
}: TouchButtonProps) => {
  const baseClasses = 'font-medium rounded-lg transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation'
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm',
    secondary: 'bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-900',
    danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm',
    success: 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white shadow-sm'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-3 text-base min-h-[44px]', // 44px minimum for touch
    lg: 'px-6 py-4 text-lg min-h-[52px]'
  }
  
  const widthClass = fullWidth ? 'w-full' : ''
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

interface TouchLinkProps {
  href: string
  children: ReactNode
  className?: string
  external?: boolean
}

// Touch-optimized link with proper tap target size
export const TouchLink = ({ href, children, className = '', external = false }: TouchLinkProps) => {
  const baseClasses = 'inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-lg transition-colors active:bg-gray-100 touch-manipulation'
  
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseClasses} ${className}`}
      >
        {children}
      </a>
    )
  }
  
  return (
    <a href={href} className={`${baseClasses} ${className}`}>
      {children}
    </a>
  )
}

// Swipeable card container with visual feedback
export const SwipeableCard = ({ 
  children, 
  onSwipeLeft, 
  onSwipeRight,
  className = '' 
}: { 
  children: ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  className?: string
}) => {
  return (
    <div 
      className={`bg-white rounded-lg shadow-sm transition-transform active:scale-[0.98] touch-manipulation ${className}`}
    >
      {children}
    </div>
  )
}

// Loading button with spinner
export const LoadingButton = ({ 
  loading, 
  children, 
  ...props 
}: TouchButtonProps & { loading?: boolean }) => {
  return (
    <TouchButton {...props} disabled={loading || props.disabled}>
      {loading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : children}
    </TouchButton>
  )
}
