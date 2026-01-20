'use server'

import { createClient } from '@/utils/supabase/server'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths, format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns'

export interface HoursByPeriodData {
  date: string
  hours: number
  count: number
}

export interface LaborCostData {
  totalLaborCost: number
  totalHours: number
  employeeCount: number
}

export interface LocationStats {
  totalHours: number
  employeeCount: number
  laborCost: number
  averageHoursPerEmployee: number
}

export interface PeriodComparison {
  current: number
  previous: number
  change: number
  changePercent: number
}

export interface AdditionalMetrics {
  averageHoursPerEmployee: number
  employeeUtilizationRate: number
  peakHours: Array<{ hour: number; count: number }>
  overtimeEmployees: Array<{ employee_id: string; full_name: string; hours: number }>
}

const getOrganizationId = async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    throw new Error('Profile not found')
  }

  return profile.organization_id
}

export const getHoursByPeriod = async (
  period: 'daily' | 'weekly' | 'monthly',
  startDate?: Date,
  endDate?: Date,
  locationId?: string
): Promise<HoursByPeriodData[]> => {
  const organizationId = await getOrganizationId()
  const supabase = await createClient()

  // Set default date ranges based on period
  let start: Date
  let end: Date = new Date()

  if (period === 'daily') {
    start = startDate || subDays(end, 6) // Last 7 days
    end = endDate || new Date()
  } else if (period === 'weekly') {
    start = startDate || startOfWeek(subWeeks(end, 3)) // Last 4 weeks
    end = endDate || endOfWeek(new Date())
  } else {
    start = startDate || startOfMonth(subMonths(end, 5)) // Last 6 months
    end = endDate || endOfMonth(new Date())
  }

  // Build query
  let query = supabase
    .from('timesheets')
    .select(`
      clock_in,
      clock_out,
      location_id
    `)
    .eq('organization_id', organizationId)
    .not('clock_out', 'is', null)
    .gte('clock_in', start.toISOString())
    .lte('clock_in', end.toISOString())

  if (locationId) {
    query = query.eq('location_id', locationId)
  }

  const { data: timesheets, error } = await query

  if (error) {
    console.error('Error fetching timesheets:', error)
    return []
  }

  if (!timesheets || timesheets.length === 0) {
    return []
  }

  // Group by period
  const grouped = new Map<string, { hours: number; count: number }>()

  for (const timesheet of timesheets) {
    const clockIn = new Date(timesheet.clock_in)
    const clockOut = new Date(timesheet.clock_out!)
    const durationSeconds = Math.floor((clockOut.getTime() - clockIn.getTime()) / 1000)
    const durationHours = durationSeconds / 3600

    let key: string
    if (period === 'daily') {
      key = format(clockIn, 'yyyy-MM-dd')
    } else if (period === 'weekly') {
      key = format(startOfWeek(clockIn), 'yyyy-MM-dd')
    } else {
      key = format(startOfMonth(clockIn), 'yyyy-MM')
    }

    if (grouped.has(key)) {
      const existing = grouped.get(key)!
      existing.hours += durationHours
      existing.count += 1
    } else {
      grouped.set(key, { hours: durationHours, count: 1 })
    }
  }

  // Create array with all periods filled in
  let periods: string[] = []
  if (period === 'daily') {
    periods = eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'))
  } else if (period === 'weekly') {
    periods = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }).map(d => format(d, 'yyyy-MM-dd'))
  } else {
    periods = eachMonthOfInterval({ start, end }).map(d => format(d, 'yyyy-MM'))
  }

  return periods.map(date => {
    const data = grouped.get(date)
    return {
      date,
      hours: data ? data.hours : 0,
      count: data ? data.count : 0,
    }
  })
}

export const getLaborCostData = async (
  startDate?: Date,
  endDate?: Date,
  locationId?: string
): Promise<LaborCostData> => {
  const organizationId = await getOrganizationId()
  const supabase = await createClient()

  const start = startDate || startOfMonth(new Date())
  const end = endDate || endOfMonth(new Date())

  let query = supabase
    .from('timesheets')
    .select(`
      clock_in,
      clock_out,
      employee_id,
      location_id,
      employees (
        pay_rate
      )
    `)
    .eq('organization_id', organizationId)
    .not('clock_out', 'is', null)
    .gte('clock_in', start.toISOString())
    .lte('clock_in', end.toISOString())

  if (locationId) {
    query = query.eq('location_id', locationId)
  }

  const { data: timesheets, error } = await query

  if (error) {
    console.error('Error fetching timesheets for labor cost:', error)
    return { totalLaborCost: 0, totalHours: 0, employeeCount: 0 }
  }

  if (!timesheets || timesheets.length === 0) {
    return { totalLaborCost: 0, totalHours: 0, employeeCount: 0 }
  }

  let totalLaborCost = 0
  let totalHours = 0
  const employeeSet = new Set<string>()

  for (const timesheet of timesheets) {
    const clockIn = new Date(timesheet.clock_in)
    const clockOut = new Date(timesheet.clock_out!)
    const durationSeconds = Math.floor((clockOut.getTime() - clockIn.getTime()) / 1000)
    const durationHours = durationSeconds / 3600

    totalHours += durationHours
    employeeSet.add(timesheet.employee_id)

    const payRate = (timesheet.employees as { pay_rate?: number | null } | null)?.pay_rate
    if (payRate && typeof payRate === 'number') {
      totalLaborCost += durationHours * payRate
    }
  }

  return {
    totalLaborCost,
    totalHours,
    employeeCount: employeeSet.size,
  }
}

export const getLocationStatsForCurrentMonth = async (
  locationId?: string
): Promise<LocationStats> => {
  const start = startOfMonth(new Date())
  const end = endOfMonth(new Date())
  return getLocationStats(locationId, start, end)
}

export const getLocationStats = async (
  locationId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<LocationStats> => {
  const organizationId = await getOrganizationId()
  const supabase = await createClient()

  const start = startDate || startOfMonth(new Date())
  const end = endDate || endOfMonth(new Date())

  let query = supabase
    .from('timesheets')
    .select(`
      clock_in,
      clock_out,
      employee_id,
      employees (
        pay_rate
      )
    `)
    .eq('organization_id', organizationId)
    .not('clock_out', 'is', null)
    .gte('clock_in', start.toISOString())
    .lte('clock_in', end.toISOString())

  if (locationId) {
    query = query.eq('location_id', locationId)
  }

  const { data: timesheets, error } = await query

  if (error) {
    console.error('Error fetching location stats:', error)
    return { totalHours: 0, employeeCount: 0, laborCost: 0, averageHoursPerEmployee: 0 }
  }

  if (!timesheets || timesheets.length === 0) {
    return { totalHours: 0, employeeCount: 0, laborCost: 0, averageHoursPerEmployee: 0 }
  }

  let totalHours = 0
  let laborCost = 0
  const employeeSet = new Set<string>()

  for (const timesheet of timesheets) {
    const clockIn = new Date(timesheet.clock_in)
    const clockOut = new Date(timesheet.clock_out!)
    const durationSeconds = Math.floor((clockOut.getTime() - clockIn.getTime()) / 1000)
    const durationHours = durationSeconds / 3600

    totalHours += durationHours
    employeeSet.add(timesheet.employee_id)

    const payRate = (timesheet.employees as { pay_rate?: number | null } | null)?.pay_rate
    if (payRate && typeof payRate === 'number') {
      laborCost += durationHours * payRate
    }
  }

  const employeeCount = employeeSet.size
  const averageHoursPerEmployee = employeeCount > 0 ? totalHours / employeeCount : 0

  return {
    totalHours,
    employeeCount,
    laborCost,
    averageHoursPerEmployee,
  }
}

export const getPeriodComparison = async (
  period: 'daily' | 'weekly' | 'monthly',
  locationId?: string
): Promise<PeriodComparison> => {
  const organizationId = await getOrganizationId()
  const supabase = await createClient()

  let currentStart: Date
  let currentEnd: Date = new Date()
  let previousStart: Date
  let previousEnd: Date

  if (period === 'daily') {
    currentStart = startOfDay(currentEnd)
    currentEnd = endOfDay(currentEnd)
    previousEnd = subDays(currentStart, 1)
    previousStart = startOfDay(previousEnd)
  } else if (period === 'weekly') {
    currentStart = startOfWeek(currentEnd)
    currentEnd = endOfWeek(currentEnd)
    previousEnd = subWeeks(currentStart, 1)
    previousStart = startOfWeek(previousEnd)
  } else {
    currentStart = startOfMonth(currentEnd)
    currentEnd = endOfMonth(currentEnd)
    previousEnd = subMonths(currentStart, 1)
    previousStart = startOfMonth(previousEnd)
  }

  // Get current period hours
  let currentQuery = supabase
    .from('timesheets')
    .select('clock_in, clock_out')
    .eq('organization_id', organizationId)
    .not('clock_out', 'is', null)
    .gte('clock_in', currentStart.toISOString())
    .lte('clock_in', currentEnd.toISOString())

  if (locationId) {
    currentQuery = currentQuery.eq('location_id', locationId)
  }

  const { data: currentTimesheets } = await currentQuery

  // Get previous period hours
  let previousQuery = supabase
    .from('timesheets')
    .select('clock_in, clock_out')
    .eq('organization_id', organizationId)
    .not('clock_out', 'is', null)
    .gte('clock_in', previousStart.toISOString())
    .lte('clock_in', previousEnd.toISOString())

  if (locationId) {
    previousQuery = previousQuery.eq('location_id', locationId)
  }

  const { data: previousTimesheets } = await previousQuery

  interface Timesheet {
    clock_in: string
    clock_out: string | null
  }

  const calculateTotalHours = (timesheets: Timesheet[]): number => {
    if (!timesheets) return 0
    return timesheets.reduce((total, ts) => {
      const clockIn = new Date(ts.clock_in)
      const clockOut = new Date(ts.clock_out!)
      const durationSeconds = Math.floor((clockOut.getTime() - clockIn.getTime()) / 1000)
      return total + durationSeconds / 3600
    }, 0)
  }

  const current = calculateTotalHours(currentTimesheets || [])
  const previous = calculateTotalHours(previousTimesheets || [])
  const change = current - previous
  const changePercent = previous > 0 ? (change / previous) * 100 : (current > 0 ? 100 : 0)

  return {
    current,
    previous,
    change,
    changePercent,
  }
}

export const getAdditionalMetrics = async (
  startDate?: Date,
  endDate?: Date
): Promise<AdditionalMetrics> => {
  const organizationId = await getOrganizationId()
  const supabase = await createClient()

  const start = startDate || startOfWeek(new Date())
  const end = endDate || endOfWeek(new Date())

  // Get all completed timesheets
  const { data: timesheets } = await supabase
    .from('timesheets')
    .select(`
      clock_in,
      clock_out,
      employee_id,
      employees (
        full_name
      )
    `)
    .eq('organization_id', organizationId)
    .not('clock_out', 'is', null)
    .gte('clock_in', start.toISOString())
    .lte('clock_in', end.toISOString())

  // Get total active employees
  const { count: totalEmployees } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('is_active', true)

  if (!timesheets || timesheets.length === 0) {
    return {
      averageHoursPerEmployee: 0,
      employeeUtilizationRate: 0,
      peakHours: Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 })),
      overtimeEmployees: [],
    }
  }

  // Calculate metrics
  const employeeHoursMap = new Map<string, { hours: number; full_name: string }>()
  const hourlyCount = new Map<number, number>()

  for (const timesheet of timesheets) {
    const clockIn = new Date(timesheet.clock_in)
    const clockOut = new Date(timesheet.clock_out!)
    const durationSeconds = Math.floor((clockOut.getTime() - clockIn.getTime()) / 1000)
    const durationHours = durationSeconds / 3600

    // Track employee hours
    const employeeId = timesheet.employee_id
    if (employeeHoursMap.has(employeeId)) {
      employeeHoursMap.get(employeeId)!.hours += durationHours
    } else {
      employeeHoursMap.set(employeeId, {
        hours: durationHours,
        full_name: (timesheet.employees as { full_name?: string } | null)?.full_name || 'Unknown',
      })
    }

    // Track peak hours (count employees working during each hour)
    const startHour = clockIn.getHours()
    const endHour = clockOut.getHours()
    for (let hour = startHour; hour <= endHour; hour++) {
      hourlyCount.set(hour, (hourlyCount.get(hour) || 0) + 1)
    }
  }

  // Calculate average hours per employee
  const totalHours = Array.from(employeeHoursMap.values()).reduce((sum, emp) => sum + emp.hours, 0)
  const activeEmployeeCount = employeeHoursMap.size
  const averageHoursPerEmployee = activeEmployeeCount > 0 ? totalHours / activeEmployeeCount : 0

  // Calculate utilization rate
  const employeeUtilizationRate = totalEmployees && totalEmployees > 0
    ? (activeEmployeeCount / totalEmployees) * 100
    : 0

  // Get peak hours (all 24 hours)
  const peakHours = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: hourlyCount.get(i) || 0,
  }))

  // Get overtime employees (>40 hours/week)
  const overtimeEmployees = Array.from(employeeHoursMap.entries())
    .filter(([, data]) => data.hours > 40)
    .map(([employee_id, data]) => ({
      employee_id,
      full_name: data.full_name,
      hours: data.hours,
    }))
    .sort((a, b) => b.hours - a.hours)

  return {
    averageHoursPerEmployee,
    employeeUtilizationRate,
    peakHours,
    overtimeEmployees,
  }
}

