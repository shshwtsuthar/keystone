'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { startOfMonth, endOfMonth } from 'date-fns'

export const createLocation = async (
  name: string,
  address: string | null,
  timezone: string
) => {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { error: 'Profile not found' }
  }

  const { data: location, error } = await supabase
    .from('locations')
    .insert({
      organization_id: profile.organization_id,
      name,
      address,
      timezone,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/locations')
  return { success: true, location }
}

export const updateLocation = async (
  id: string,
  name: string,
  address: string | null,
  timezone: string
) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from('locations')
    .update({
      name,
      address,
      timezone,
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/locations')
  return { success: true }
}

export const deleteLocation = async (id: string) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/locations')
  return { success: true }
}

export const getLocations = async () => {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated', locations: [] }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { error: 'Profile not found', locations: [] }
  }

  const { data: locations, error } = await supabase
    .from('locations')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .order('name')

  if (error) {
    return { error: error.message, locations: [] }
  }

  return { locations: locations || [] }
}

export interface LocationsMetrics {
  totalLocations: number
  activeLocations: number
  totalHoursThisMonth: number
  averageHoursPerLocation: number
}

export const getLocationsMetrics = async (): Promise<LocationsMetrics> => {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      totalLocations: 0,
      activeLocations: 0,
      totalHoursThisMonth: 0,
      averageHoursPerLocation: 0,
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return {
      totalLocations: 0,
      activeLocations: 0,
      totalHoursThisMonth: 0,
      averageHoursPerLocation: 0,
    }
  }

  const currentMonthStart = startOfMonth(new Date())
  const currentMonthEnd = endOfMonth(new Date())

  // Get total locations count
  const { count: totalLocations } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', profile.organization_id)

  // Get timesheets for this month to calculate active locations and hours
  const { data: timesheets, error: timesheetsError } = await supabase
    .from('timesheets')
    .select('location_id, clock_in, clock_out')
    .eq('organization_id', profile.organization_id)
    .not('clock_out', 'is', null)
    .gte('clock_in', currentMonthStart.toISOString())
    .lte('clock_in', currentMonthEnd.toISOString())

  if (timesheetsError || !timesheets) {
    return {
      totalLocations: totalLocations || 0,
      activeLocations: 0,
      totalHoursThisMonth: 0,
      averageHoursPerLocation: 0,
    }
  }

  // Calculate total hours and active locations
  const locationHoursMap = new Map<string, number>()
  let totalHours = 0

  for (const timesheet of timesheets) {
    const clockIn = new Date(timesheet.clock_in)
    const clockOut = new Date(timesheet.clock_out!)
    const durationSeconds = Math.floor((clockOut.getTime() - clockIn.getTime()) / 1000)
    const durationHours = durationSeconds / 3600

    totalHours += durationHours

    const locationId = timesheet.location_id
    if (locationHoursMap.has(locationId)) {
      locationHoursMap.set(locationId, locationHoursMap.get(locationId)! + durationHours)
    } else {
      locationHoursMap.set(locationId, durationHours)
    }
  }

  const activeLocations = locationHoursMap.size
  const averageHoursPerLocation = activeLocations > 0 ? totalHours / activeLocations : 0

  return {
    totalLocations: totalLocations || 0,
    activeLocations,
    totalHoursThisMonth: totalHours,
    averageHoursPerLocation,
  }
}

