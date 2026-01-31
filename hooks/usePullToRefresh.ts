import { useRef, useState, useEffect } from 'react'

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number
  resistance?: number
}

export function usePullToRefresh(options: PullToRefreshOptions) {
  const { onRefresh, threshold = 80, resistance = 2.5 } = options
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const touchStartY = useRef<number>(0)
  const scrollTop = useRef<number>(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement
    scrollTop.current = target.scrollTop || window.scrollY
    
    // Only allow pull-to-refresh when at the top of the page
    if (scrollTop.current === 0) {
      touchStartY.current = e.touches[0].clientY
      setIsPulling(true)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return
    
    const touchCurrentY = e.touches[0].clientY
    const distance = touchCurrentY - touchStartY.current

    // Only track downward pulls
    if (distance > 0) {
      // Apply resistance to make it feel natural
      const adjustedDistance = distance / resistance
      setPullDistance(Math.min(adjustedDistance, threshold * 1.5))
    }
  }

  const handleTouchEnd = async () => {
    if (!isPulling) return

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }

    setIsPulling(false)
    setPullDistance(0)
    touchStartY.current = 0
  }

  const progress = Math.min((pullDistance / threshold) * 100, 100)

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    isPulling,
    isRefreshing,
    pullDistance,
    progress,
  }
}
