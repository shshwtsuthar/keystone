'use client'

import { Bug } from 'lucide-react'
import { SidebarMenuButton } from '@/components/ui/sidebar'

export const DebugOnboardingButton = () => {
  const handleClick = () => {
    // Trigger the onboarding dialog via localStorage
    localStorage.setItem('debug-onboarding', 'true')
    // Dispatch custom event for same-window listeners
    window.dispatchEvent(new Event('debug-onboarding'))
  }

  return (
    <SidebarMenuButton onClick={handleClick}>
      <Bug className="h-4 w-4" />
      <span>Debug: Launch Onboarding</span>
    </SidebarMenuButton>
  )
}

