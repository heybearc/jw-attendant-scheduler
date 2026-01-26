import { useEffect, useState } from 'react'

/**
 * SafeDate component - prevents React hydration errors from timezone differences
 * 
 * Server renders placeholder, client renders actual formatted date.
 * This ensures server and client HTML match during hydration.
 */

interface SafeDateProps {
  dateString: string | null | undefined
  format?: 'full' | 'date' | 'time' | 'datetime'
  fallback?: string
}

export function SafeDate({ dateString, format = 'date', fallback = 'No date' }: SafeDateProps) {
  const [mounted, setMounted] = useState(false)
  const [formatted, setFormatted] = useState('')

  useEffect(() => {
    setMounted(true)
    
    if (!dateString) {
      setFormatted(fallback)
      return
    }

    try {
      const date = new Date(dateString)
      
      switch (format) {
        case 'full': {
          // "Monday, January 15, 2026"
          const dateOnly = dateString.split('T')[0]
          const [year, month, day] = dateOnly.split('-')
          const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
          
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
          const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
          
          setFormatted(`${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`)
          break
        }
        
        case 'time': {
          // "2:30 PM"
          const [hours, minutes] = dateString.includes('T') 
            ? dateString.split('T')[1].split(':')
            : dateString.split(':')
          const hour = parseInt(hours)
          const min = minutes || '00'
          const ampm = hour >= 12 ? 'PM' : 'AM'
          const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
          setFormatted(`${displayHour}:${min.substring(0, 2)} ${ampm}`)
          break
        }
        
        case 'datetime': {
          // "01/15/2026, 2:30 PM"
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          const year = date.getFullYear()
          let hours = date.getHours()
          const minutes = String(date.getMinutes()).padStart(2, '0')
          const ampm = hours >= 12 ? 'PM' : 'AM'
          hours = hours % 12 || 12
          setFormatted(`${month}/${day}/${year}, ${hours}:${minutes} ${ampm}`)
          break
        }
        
        default: {
          // "01/15/2026"
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          const year = date.getFullYear()
          setFormatted(`${month}/${day}/${year}`)
        }
      }
    } catch (error) {
      console.error('Date formatting error:', error)
      setFormatted('Invalid date')
    }
  }, [dateString, format, fallback])

  // Don't render anything during SSR to prevent hydration mismatch
  if (!mounted) {
    return null
  }

  return <span suppressHydrationWarning>{formatted}</span>
}
