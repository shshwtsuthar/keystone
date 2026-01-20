'use server'

import { createClient } from '@/utils/supabase/server'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'

export const verifyEmployeePin = async (employeeId: string, pin: string) => {
  const supabase = await createClient()

  // Get current user's organization for security
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { success: false, error: 'Profile not found' }
  }

  // Fetch employee and verify they belong to the same organization
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('pin_hash, organization_id, is_active')
    .eq('id', employeeId)
    .eq('organization_id', profile.organization_id)
    .single()

  if (employeeError || !employee) {
    return { success: false, error: 'Employee not found' }
  }

  if (!employee.is_active) {
    return { success: false, error: 'Employee is inactive' }
  }

  // Verify PIN
  const match = await bcrypt.compare(pin, employee.pin_hash)
  if (!match) {
    return { success: false, error: 'Invalid PIN' }
  }

  return { success: true }
}

export const getEmployeeStatus = async (employeeId: string) => {
  const supabase = await createClient()

  // Get current user's organization
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated', isClockedIn: false }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { error: 'Profile not found', isClockedIn: false }
  }

  // Check for open timesheet
  const { data: lastTimesheet } = await supabase
    .from('timesheets')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('organization_id', profile.organization_id)
    .is('clock_out', null)
    .maybeSingle()

  return { isClockedIn: !!lastTimesheet, timesheet: lastTimesheet }
}

export const getEmployeesForKiosk = async (organizationId: string) => {
  const supabase = await createClient()

  const { data: employees, error } = await supabase
    .from('employees')
    .select('id, full_name')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('full_name')

  if (error) {
    return { error: error.message, employees: [] }
  }

  return { employees: employees || [] }
}

export const performClockAction = async (
  employeeId: string,
  locationId: string,
  action: 'in' | 'out'
) => {
  const supabase = await createClient()

  // Get current user's organization
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { success: false, error: 'Profile not found' }
  }

  // Verify employee belongs to organization
  const { data: employee } = await supabase
    .from('employees')
    .select('organization_id, is_active')
    .eq('id', employeeId)
    .eq('organization_id', profile.organization_id)
    .single()

  if (!employee || !employee.is_active) {
    return { success: false, error: 'Employee not found or inactive' }
  }

  // Verify location belongs to organization
  const { data: location } = await supabase
    .from('locations')
    .select('organization_id')
    .eq('id', locationId)
    .eq('organization_id', profile.organization_id)
    .single()

  if (!location) {
    return { success: false, error: 'Location not found' }
  }

  if (action === 'in') {
    // Check if already clocked in
    const { data: existingTimesheet } = await supabase
      .from('timesheets')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('organization_id', profile.organization_id)
      .is('clock_out', null)
      .maybeSingle()

    if (existingTimesheet) {
      return { success: false, error: 'Already clocked in' }
    }

    // Clock in
    const { error: insertError } = await supabase
      .from('timesheets')
      .insert({
        organization_id: profile.organization_id,
        employee_id: employeeId,
        location_id: locationId,
        clock_in: new Date().toISOString(),
        status: 'working',
      })

    if (insertError) {
      return { success: false, error: insertError.message }
    }
  } else if (action === 'out') {
    // Find open timesheet
    const { data: openTimesheet } = await supabase
      .from('timesheets')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('organization_id', profile.organization_id)
      .is('clock_out', null)
      .maybeSingle()

    if (!openTimesheet) {
      return { success: false, error: 'Not clocked in' }
    }

    // Clock out
    const { error: updateError } = await supabase
      .from('timesheets')
      .update({
        clock_out: new Date().toISOString(),
        status: 'completed',
      })
      .eq('id', openTimesheet.id)

    if (updateError) {
      return { success: false, error: updateError.message }
    }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export interface TopEmployeeHours {
  employee_id: string
  full_name: string
  total_seconds: number
}

export const getTopEmployeesByHours = async (limit: number = 5) => {
  const supabase = await createClient()

  // Get current user's organization
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated', employees: [] }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { error: 'Profile not found', employees: [] }
  }

  // Get all completed timesheets (where clock_out is not null)
  const { data: timesheets, error } = await supabase
    .from('timesheets')
    .select(`
      employee_id,
      clock_in,
      clock_out,
      employees (
        full_name
      )
    `)
    .eq('organization_id', profile.organization_id)
    .not('clock_out', 'is', null)
    .order('clock_in', { ascending: false })

  if (error) {
    return { error: error.message, employees: [] }
  }

  if (!timesheets || timesheets.length === 0) {
    return { employees: [] }
  }

  // Calculate total hours for each employee
  const employeeHoursMap = new Map<string, { full_name: string; total_seconds: number }>()

  for (const timesheet of timesheets) {
    const employeeId = timesheet.employee_id
    const clockIn = new Date(timesheet.clock_in)
    const clockOut = new Date(timesheet.clock_out!)
    const durationSeconds = Math.floor((clockOut.getTime() - clockIn.getTime()) / 1000)

    if (employeeHoursMap.has(employeeId)) {
      const existing = employeeHoursMap.get(employeeId)!
      existing.total_seconds += durationSeconds
    } else {
      employeeHoursMap.set(employeeId, {
        full_name: (timesheet.employees as { full_name?: string } | null)?.full_name || 'Unknown',
        total_seconds: durationSeconds,
      })
    }
  }

  // Convert to array, sort by total_seconds descending, and take top N
  const topEmployees: TopEmployeeHours[] = Array.from(employeeHoursMap.entries())
    .map(([employee_id, data]) => ({
      employee_id,
      full_name: data.full_name,
      total_seconds: data.total_seconds,
    }))
    .sort((a, b) => b.total_seconds - a.total_seconds)
    .slice(0, limit)

  return { employees: topEmployees }
}

export const verifyMasterPin = async (masterPin: string) => {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get profile with master pin hash
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('master_pin_hash')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { success: false, error: 'Profile not found' }
  }

  if (!profile.master_pin_hash) {
    return { success: false, error: 'Master PIN not set' }
  }

  // Verify master PIN
  const match = await bcrypt.compare(masterPin, profile.master_pin_hash)
  if (!match) {
    return { success: false, error: 'Invalid Master PIN' }
  }

  return { success: true }
}

