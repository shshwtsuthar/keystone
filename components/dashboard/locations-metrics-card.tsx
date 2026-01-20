'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Activity, Clock, TrendingUp } from 'lucide-react'
import { formatHours } from '@/lib/analytics-utils'
import type { LocationsMetrics } from '@/app/actions/locations'

interface LocationsMetricsCardProps {
  metrics: LocationsMetrics
}

export const LocationsMetricsCard = ({ metrics }: LocationsMetricsCardProps) => {
  if (!metrics) {
    return null
  }

  const safeMetrics = {
    totalLocations: metrics.totalLocations ?? 0,
    activeLocations: metrics.activeLocations ?? 0,
    totalHoursThisMonth: metrics.totalHoursThisMonth ?? 0,
    averageHoursPerLocation: metrics.averageHoursPerLocation ?? 0,
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{safeMetrics.totalLocations}</div>
          <p className="text-xs text-muted-foreground mt-1">
            All locations in your organization
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Locations</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{safeMetrics.activeLocations}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Locations with activity this month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Hours This Month</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatHours(safeMetrics.totalHoursThisMonth)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Hours worked across all locations
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Hours per Location</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatHours(safeMetrics.averageHoursPerLocation)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Average hours per active location
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

