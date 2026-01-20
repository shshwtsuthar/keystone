'use server'

import { createClient } from '@/utils/supabase/server'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { startOfMonth, endOfMonth } from 'date-fns'

const generatePin = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export const createEmployee = async (
  fullName: string,
  payRate: number | null,
  defaultLocationId: string | null,
  classification: string | null,
  superFundName: string | null,
  memberNumber: string | null,
  saturdaySundayRate: number | null
) => {
  const supabase = await createClient()
  
  // Get current user's organization
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

  // Generate PIN and hash it
  const pin = generatePin()
  const pinHash = await bcrypt.hash(pin, 10)

  const { data: employee, error } = await supabase
    .from('employees')
    .insert({
      organization_id: profile.organization_id,
      full_name: fullName,
      pay_rate: payRate,
      default_location_id: defaultLocationId,
      pin_hash: pinHash,
      classification: classification,
      super_fund_name: superFundName,
      member_number: memberNumber,
      saturday_sunday_rate: saturdaySundayRate,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/employees')
  
  return { success: true, employee, pin }
}

export const updateEmployee = async (
  id: string,
  fullName: string,
  payRate: number | null,
  defaultLocationId: string | null,
  isActive: boolean,
  classification: string | null,
  superFundName: string | null,
  memberNumber: string | null,
  saturdaySundayRate: number | null
) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from('employees')
    .update({
      full_name: fullName,
      pay_rate: payRate,
      default_location_id: defaultLocationId,
      is_active: isActive,
      classification: classification,
      super_fund_name: superFundName,
      member_number: memberNumber,
      saturday_sunday_rate: saturdaySundayRate,
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/employees')
  return { success: true }
}

export const deleteEmployee = async (id: string) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/employees')
  return { success: true }
}

export const getEmployees = async () => {
  const supabase = await createClient()
  
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

  const { data: employees, error } = await supabase
    .from('employees')
    .select('*, locations(name)')
    .eq('organization_id', profile.organization_id)
    .order('full_name')

  if (error) {
    return { error: error.message, employees: [] }
  }

  return { employees: employees || [] }
}

export interface EmployeesMetrics {
  totalEmployees: number
  activeEmployees: number
  currentlyWorking: number
  averageHoursPerEmployee: number
}

export const getEmployeesMetrics = async (): Promise<EmployeesMetrics> => {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      totalEmployees: 0,
      activeEmployees: 0,
      currentlyWorking: 0,
      averageHoursPerEmployee: 0,
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return {
      totalEmployees: 0,
      activeEmployees: 0,
      currentlyWorking: 0,
      averageHoursPerEmployee: 0,
    }
  }

  const currentMonthStart = startOfMonth(new Date())
  const currentMonthEnd = endOfMonth(new Date())

  // Get total employees count
  const { count: totalEmployees } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', profile.organization_id)

  // Get active employees count
  const { count: activeEmployees } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', profile.organization_id)
    .eq('is_active', true)

  // Get currently working employees (clocked in)
  const { data: activeTimesheets } = await supabase
    .from('timesheets')
    .select('employee_id')
    .eq('organization_id', profile.organization_id)
    .is('clock_out', null)

  const currentlyWorking = activeTimesheets?.length || 0

  // Get timesheets for this month to calculate average hours per employee
  const { data: timesheets, error: timesheetsError } = await supabase
    .from('timesheets')
    .select('employee_id, clock_in, clock_out')
    .eq('organization_id', profile.organization_id)
    .not('clock_out', 'is', null)
    .gte('clock_in', currentMonthStart.toISOString())
    .lte('clock_in', currentMonthEnd.toISOString())

  if (timesheetsError || !timesheets || timesheets.length === 0) {
    return {
      totalEmployees: totalEmployees || 0,
      activeEmployees: activeEmployees || 0,
      currentlyWorking,
      averageHoursPerEmployee: 0,
    }
  }

  // Calculate total hours per employee
  const employeeHoursMap = new Map<string, number>()

  for (const timesheet of timesheets) {
    const clockIn = new Date(timesheet.clock_in)
    const clockOut = new Date(timesheet.clock_out!)
    const durationSeconds = Math.floor((clockOut.getTime() - clockIn.getTime()) / 1000)
    const durationHours = durationSeconds / 3600

    const employeeId = timesheet.employee_id
    if (employeeHoursMap.has(employeeId)) {
      employeeHoursMap.set(employeeId, employeeHoursMap.get(employeeId)! + durationHours)
    } else {
      employeeHoursMap.set(employeeId, durationHours)
    }
  }

  // Calculate average hours per employee
  const totalHours = Array.from(employeeHoursMap.values()).reduce((sum, hours) => sum + hours, 0)
  const employeesWithHours = employeeHoursMap.size
  const averageHoursPerEmployee = employeesWithHours > 0 ? totalHours / employeesWithHours : 0

  return {
    totalEmployees: totalEmployees || 0,
    activeEmployees: activeEmployees || 0,
    currentlyWorking,
    averageHoursPerEmployee,
  }
}

