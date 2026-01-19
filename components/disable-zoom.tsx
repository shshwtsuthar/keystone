'use client'

import { useEffect } from 'react'

export const DisableZoom = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl/Cmd + Plus/Minus/0 (zoom in/out/reset)
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
        e.preventDefault()
        return false
      }
    }

    const handleWheel = (e: WheelEvent) => {
      // Prevent Ctrl/Cmd + Mouse Wheel (zoom)
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        return false
      }
    }

    const handleTouchStart = (e: TouchEvent) => {
      // Prevent pinch zoom on trackpads
      if (e.touches.length > 1) {
        e.preventDefault()
        return false
      }
    }

    const handleGestureStart = (e: Event) => {
      // Prevent gesture-based zoom
      e.preventDefault()
      return false
    }

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown, { passive: false })
    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('touchstart', handleTouchStart, { passive: false })
    window.addEventListener('gesturestart', handleGestureStart, { passive: false })

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('gesturestart', handleGestureStart)
    }
  }, [])

  return null
}

