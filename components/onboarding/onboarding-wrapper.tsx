'use client'

import { useState, useEffect } from 'react'
import { OnboardingDialog } from './onboarding-dialog'

interface OnboardingWrapperProps {
  userRole: 'owner' | 'manager'
  initialNeedsOnboarding: boolean
}

export const OnboardingWrapper = ({
  userRole,
  initialNeedsOnboarding,
}: OnboardingWrapperProps) => {
  const [forceOpen, setForceOpen] = useState(false)

  useEffect(() => {
    // Check for debug trigger in localStorage
    const checkDebugTrigger = () => {
      const debugTrigger = localStorage.getItem('debug-onboarding')
      if (debugTrigger === 'true') {
        setForceOpen(true)
        localStorage.removeItem('debug-onboarding')
      }
    }

    // Check immediately on mount
    checkDebugTrigger()

    // Listen for custom event (for same-window triggers)
    const handleCustomEvent = () => {
      checkDebugTrigger()
    }
    
    // Listen for storage events (for cross-tab triggers)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'debug-onboarding') {
        checkDebugTrigger()
      }
    }

    window.addEventListener('debug-onboarding', handleCustomEvent)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('debug-onboarding', handleCustomEvent)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const shouldShow = initialNeedsOnboarding || forceOpen

  return (
    <OnboardingDialog
      open={shouldShow}
      userRole={userRole}
      onClose={() => setForceOpen(false)}
    />
  )
}

