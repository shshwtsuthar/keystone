'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export const useKioskLockdown = (allowExit: boolean = false) => {
  const router = useRouter()
  const pathname = usePathname()
  const isKioskRoute = pathname.startsWith('/kiosk/')
  const routerRef = useRef(router)
  const allowExitRef = useRef(allowExit)

  useEffect(() => {
    routerRef.current = router
    allowExitRef.current = allowExit
  }, [router, allowExit])

  useEffect(() => {
    if (!isKioskRoute || allowExitRef.current) return

    // Prevent browser back/forward buttons
    const handlePopState = (e: PopStateEvent) => {
      if (!allowExitRef.current) {
        window.history.pushState(null, '', pathname)
        e.preventDefault()
        e.stopPropagation()
      }
    }

    // Add initial history state
    window.history.pushState(null, '', pathname)
    window.addEventListener('popstate', handlePopState)

    // Prevent page close/refresh
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!allowExitRef.current) {
        e.preventDefault()
        e.returnValue = 'You cannot exit kiosk mode without entering the master PIN.'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    // Prevent navigation keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (allowExitRef.current) return
      
      // Block: Alt+Left, Alt+Right, F5, Ctrl+R, Cmd+R, Backspace (when not in input)
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      if (
        (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) ||
        e.key === 'F5' ||
        (e.ctrlKey && e.key === 'r') ||
        (e.metaKey && e.key === 'r') ||
        (e.key === 'Backspace' && !isInput && !e.ctrlKey && !e.metaKey)
      ) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)

    // Prevent context menu (right-click)
    const handleContextMenu = (e: MouseEvent) => {
      if (!allowExitRef.current) {
        e.preventDefault()
        return false
      }
    }

    document.addEventListener('contextmenu', handleContextMenu)

    // Intercept link clicks that try to navigate away
    const handleClick = (e: MouseEvent) => {
      if (allowExitRef.current) return
      
      const target = e.target as HTMLElement
      const link = target.closest('a')
      if (link && link.href && !link.href.includes('/kiosk/')) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }

    document.addEventListener('click', handleClick, true)

    // Prevent touch swipe gestures (for mobile/tablet)
    let touchStartX = 0
    let touchStartY = 0
    const handleTouchStart = (e: TouchEvent) => {
      if (allowExitRef.current) return
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (allowExitRef.current) return
      
      const touchEndX = e.touches[0].clientX
      const touchEndY = e.touches[0].clientY
      const deltaX = touchEndX - touchStartX
      const deltaY = touchEndY - touchStartY

      // Prevent horizontal swipes (back/forward navigation)
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
    }
  }, [pathname, isKioskRoute])

  // Intercept Next.js router navigation
  useEffect(() => {
    if (!isKioskRoute || allowExitRef.current) return

    const originalPush = router.push
    const originalReplace = router.replace
    const originalBack = router.back
    const originalForward = router.forward

    // Override router methods
    router.push = (...args: Parameters<typeof router.push>) => {
      if (!allowExitRef.current) {
        console.warn('Navigation blocked: Kiosk mode is active. Use master PIN to exit.')
        return Promise.resolve(false)
      }
      return originalPush.apply(router, args)
    }

    router.replace = (...args: Parameters<typeof router.replace>) => {
      if (!allowExitRef.current) {
        console.warn('Navigation blocked: Kiosk mode is active. Use master PIN to exit.')
        return Promise.resolve(false)
      }
      return originalReplace.apply(router, args)
    }

    router.back = () => {
      if (!allowExitRef.current) {
        console.warn('Navigation blocked: Kiosk mode is active. Use master PIN to exit.')
        return
      }
      return originalBack.apply(router)
    }

    router.forward = () => {
      if (!allowExitRef.current) {
        console.warn('Navigation blocked: Kiosk mode is active. Use master PIN to exit.')
        return
      }
      return originalForward.apply(router)
    }

    // Cleanup
    return () => {
      router.push = originalPush
      router.replace = originalReplace
      router.back = originalBack
      router.forward = originalForward
    }
  }, [router, isKioskRoute])
}

