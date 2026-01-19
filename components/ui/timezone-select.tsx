'use client'

import { useMemo } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Get all IANA timezones
const getAllTimezones = () => {
  try {
    return Intl.supportedValuesOf('timeZone').sort()
  } catch {
    // Fallback for older browsers
    return [
      'America/Anchorage',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/New_York',
      'America/Phoenix',
      'Asia/Dubai',
      'Asia/Shanghai',
      'Asia/Tokyo',
      'Australia/Melbourne',
      'Australia/Sydney',
      'Europe/Berlin',
      'Europe/London',
      'Europe/Paris',
      'Pacific/Honolulu',
      'UTC',
    ]
  }
}

// Format timezone label with abbreviation
const formatTimezoneLabel = (timezone: string) => {
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    })
    const parts = formatter.formatToParts(now)
    const abbreviation = parts.find((part) => part.type === 'timeZoneName')?.value || ''
    
    if (abbreviation) {
      return `${timezone} (${abbreviation})`
    }
    return timezone
  } catch {
    return timezone
  }
}

interface TimezoneSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
}

export const TimezoneSelect = ({
  value,
  onValueChange,
  placeholder = 'Select a timezone',
  className,
}: TimezoneSelectProps) => {
  const timezones = useMemo(() => getAllTimezones(), [])

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {timezones.map((tz) => (
          <SelectItem key={tz} value={tz}>
            {formatTimezoneLabel(tz)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

