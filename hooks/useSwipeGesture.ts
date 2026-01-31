import { useRef, useState, useEffect } from 'react'

interface SwipeGestureOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
}

export function useSwipeGesture(options: SwipeGestureOptions) {
  const { onSwipeLeft, onSwipeRight, threshold = 50 } = options
  const [isSwiping, setIsSwiping] = useState(false)
  const [swipeDistance, setSwipeDistance] = useState(0)
  const touchStartX = useRef<number>(0)
  const touchCurrentX = useRef<number>(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    setIsSwiping(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return
    touchCurrentX.current = e.touches[0].clientX
    const distance = touchCurrentX.current - touchStartX.current
    setSwipeDistance(distance)
  }

  const handleTouchEnd = () => {
    const distance = touchCurrentX.current - touchStartX.current

    if (Math.abs(distance) > threshold) {
      if (distance < 0 && onSwipeLeft) {
        onSwipeLeft()
      } else if (distance > 0 && onSwipeRight) {
        onSwipeRight()
      }
    }

    setIsSwiping(false)
    setSwipeDistance(0)
    touchStartX.current = 0
    touchCurrentX.current = 0
  }

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    isSwiping,
    swipeDistance,
  }
}
