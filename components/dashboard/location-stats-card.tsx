'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MapPin } from 'lucide-react'
import { formatCurrency, formatHours } from '@/lib/analytics-utils'
import type { LocationStats } from '@/app/actions/analytics'

interface Location {
  id: string
  name: string
}

interface LocationStatsCardProps {
  locations: Location[]
  initialLocationId?: string
  initialStats?: LocationStats
  onLocationChange: (locationId: string | undefined) => Promise<LocationStats>
}

export const LocationStatsCard = ({
  locations,
  initialLocationId,
  initialStats,
  onLocationChange,
}: LocationStatsCardProps) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(initialLocationId)
  const [stats, setStats] = useState<LocationStats | null>(initialStats || null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true)
      try {
        const data = await onLocationChange(selectedLocationId)
        setStats(data)
      } catch (error) {
        console.error('Error loading location stats:', error)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [selectedLocationId, onLocationChange])

  const handleLocationChange = (value: string) => {
    setSelectedLocationId(value === 'all' ? undefined : value)
  }

  const selectedLocationName = selectedLocationId
    ? locations.find(l => l.id === selectedLocationId)?.name || 'Unknown'
    : 'All Locations'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Location Statistics</CardTitle>
            <CardDescription>View statistics by location</CardDescription>
          </div>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select
          value={selectedLocationId || 'all'}
          onValueChange={handleLocationChange}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <p>Loading statistics...</p>
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="text-2xl font-bold">{formatHours(stats.totalHours)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Labor Cost</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.laborCost)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Employees</p>
              <p className="text-2xl font-bold">{stats.employeeCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Hours/Employee</p>
              <p className="text-2xl font-bold">{formatHours(stats.averageHoursPerEmployee)}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <p>No statistics available</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

