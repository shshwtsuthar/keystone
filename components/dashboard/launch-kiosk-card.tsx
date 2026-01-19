'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'

export const LaunchKioskCard = () => {
  const handleClick = () => {
    // Placeholder for future functionality
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label="Launch Kiosk"
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Launch Kiosk</CardTitle>
        <Play className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-4">
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-full bg-primary/10 p-4">
              <Play className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Click to launch kiosk interface</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

