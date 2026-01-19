'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { format } from 'date-fns'
import type { EmployeeTimesheet } from '@/lib/payroll-utils'
import type { PayslipData } from '@/types/payslip'

export interface EmployeeEarnings {
  employeeId: string
  employeeName: string
  hours: number
  rate: number
  description: string
  total: number
}

export interface EmployeeDeductions {
  employeeId: string
  grossPay: number
  taxWithheld: number
  superannuation: number
  netPay: number
}

export interface PayRunData {
  payPeriodStart: string
  payPeriodEnd: string
  paymentDate: string
  earnings: EmployeeEarnings[]
  deductions: EmployeeDeductions[]
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

export const getPayRuns = async () => {
  const supabase = await createClient()
  
  try {
    const organizationId = await getOrganizationId()

    const { data: payRuns, error } = await supabase
      .from('pay_runs')
      .select(`
        *,
        pay_run_earnings(count),
        pay_run_deductions(count)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      return { error: error.message, payRuns: [] }
    }

    // Transform the data to include employee count and total amount
    const transformedPayRuns = await Promise.all(
      (payRuns || []).map(async (payRun) => {
        // Get unique employee count from earnings
        const { data: earnings } = await supabase
          .from('pay_run_earnings')
          .select('employee_id, total')
          .eq('pay_run_id', payRun.id)

        const uniqueEmployees = new Set(earnings?.map(e => e.employee_id) || [])
        const totalAmount = earnings?.reduce((sum, e) => sum + Number(e.total || 0), 0) || 0

        return {
          ...payRun,
          employeeCount: uniqueEmployees.size,
          totalAmount,
        }
      })
    )

    return { payRuns: transformedPayRuns }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error', payRuns: [] }
  }
}

export interface TimesheetWithId extends EmployeeTimesheet {
  id: string
}

export const getEmployeeTimesheets = async (
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<{ error?: string; timesheets: TimesheetWithId[] }> => {
  const supabase = await createClient()
  
  try {
    const organizationId = await getOrganizationId()

    const { data: timesheets, error } = await supabase
      .from('timesheets')
      .select('id, clock_in, clock_out')
      .eq('organization_id', organizationId)
      .eq('employee_id', employeeId)
      .not('clock_out', 'is', null)
      .gte('clock_in', startDate)
      .lte('clock_in', endDate)
      .order('clock_in', { ascending: true })

    if (error) {
      return { error: error.message, timesheets: [] }
    }

    return { timesheets: (timesheets || []) as TimesheetWithId[] }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error', timesheets: [] }
  }
}

export const updateTimesheet = async (
  timesheetId: string,
  clockIn: string,
  clockOut: string | null
) => {
  const supabase = await createClient()
  
  try {
    const organizationId = await getOrganizationId()

    const { error } = await supabase
      .from('timesheets')
      .update({
        clock_in: clockIn,
        clock_out: clockOut,
        status: clockOut ? 'completed' : 'working',
      })
      .eq('id', timesheetId)
      .eq('organization_id', organizationId)

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}


export const getOrganizationSuperRate = async () => {
  const supabase = await createClient()
  
  try {
    const organizationId = await getOrganizationId()

    const { data: organization, error } = await supabase
      .from('organizations')
      .select('superannuation_default_rate')
      .eq('id', organizationId)
      .single()

    if (error) {
      return { error: error.message, superRate: null }
    }

    return { superRate: organization?.superannuation_default_rate || null }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error', superRate: null }
  }
}

export const getActiveEmployees = async () => {
  const supabase = await createClient()
  
  try {
    const organizationId = await getOrganizationId()

    const { data: employees, error } = await supabase
      .from('employees')
      .select('id, full_name, pay_rate')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('full_name')

    if (error) {
      return { error: error.message, employees: [] }
    }

    return { employees: employees || [] }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error', employees: [] }
  }
}

export const createPayRun = async (payRunData: PayRunData) => {
  const supabase = await createClient()
  
  try {
    const organizationId = await getOrganizationId()

    // Create pay run
    const { data: payRun, error: payRunError } = await supabase
      .from('pay_runs')
      .insert({
        organization_id: organizationId,
        pay_period_start: payRunData.payPeriodStart,
        pay_period_end: payRunData.payPeriodEnd,
        payment_date: payRunData.paymentDate,
        status: 'finalized',
      })
      .select()
      .single()

    if (payRunError || !payRun) {
      return { error: payRunError?.message || 'Failed to create pay run' }
    }

    // Create earnings
    const earningsData = payRunData.earnings.map(earning => ({
      pay_run_id: payRun.id,
      employee_id: earning.employeeId,
      hours: earning.hours,
      rate: earning.rate,
      description: earning.description || 'Regular hours',
      total: earning.total,
    }))

    const { error: earningsError } = await supabase
      .from('pay_run_earnings')
      .insert(earningsData)

    if (earningsError) {
      // Rollback pay run if earnings fail
      await supabase.from('pay_runs').delete().eq('id', payRun.id)
      return { error: earningsError.message }
    }

    // Create deductions
    const deductionsData = payRunData.deductions.map(deduction => ({
      pay_run_id: payRun.id,
      employee_id: deduction.employeeId,
      tax_withheld: deduction.taxWithheld,
      superannuation: deduction.superannuation,
      gross_pay: deduction.grossPay,
      net_pay: deduction.netPay,
    }))

    const { error: deductionsError } = await supabase
      .from('pay_run_deductions')
      .insert(deductionsData)

    if (deductionsError) {
      // Rollback pay run and earnings if deductions fail
      await supabase.from('pay_run_earnings').delete().eq('pay_run_id', payRun.id)
      await supabase.from('pay_runs').delete().eq('id', payRun.id)
      return { error: deductionsError.message }
    }

    revalidatePath('/dashboard/payroll')
    return { success: true, payRunId: payRun.id }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export const getPayslipData = async (
  payRunId: string,
  employeeId: string
): Promise<{ error?: string; data?: PayslipData }> => {
  const supabase = await createClient()

  try {
    const organizationId = await getOrganizationId()

    // Fetch organization details
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('name, employer_business_name, abn, company_logo_url')
      .eq('id', organizationId)
      .single()

    if (orgError) {
      return { error: orgError.message }
    }

    // Fetch employee details
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('full_name, classification, super_fund_name')
      .eq('id', employeeId)
      .eq('organization_id', organizationId)
      .single()

    if (empError) {
      return { error: empError.message }
    }

    // Fetch pay run details
    const { data: payRun, error: payRunError } = await supabase
      .from('pay_runs')
      .select('pay_period_start, pay_period_end, payment_date')
      .eq('id', payRunId)
      .eq('organization_id', organizationId)
      .single()

    if (payRunError) {
      return { error: payRunError.message }
    }

    // Fetch earnings for this employee in this pay run
    const { data: earnings, error: earningsError } = await supabase
      .from('pay_run_earnings')
      .select('description, rate, hours, total')
      .eq('pay_run_id', payRunId)
      .eq('employee_id', employeeId)

    if (earningsError) {
      return { error: earningsError.message }
    }

    // Fetch deductions for this employee in this pay run
    const { data: deduction, error: deductionError } = await supabase
      .from('pay_run_deductions')
      .select('tax_withheld, superannuation, gross_pay, net_pay')
      .eq('pay_run_id', payRunId)
      .eq('employee_id', employeeId)
      .single()

    if (deductionError) {
      return { error: deductionError.message }
    }

    // Format dates
    const payPeriodStart = format(new Date(payRun.pay_period_start), 'dd MMM yyyy')
    const payPeriodEnd = format(new Date(payRun.pay_period_end), 'dd MMM yyyy')
    const paymentDate = format(new Date(payRun.payment_date), 'dd MMM yyyy')

    // Format ABN (XX XXX XXX XXX)
    const formatABN = (abn: string | null): string => {
      if (!abn) return 'Not provided'
      const digits = abn.replace(/\s+/g, '')
      if (digits.length !== 11) return abn
      return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 11)}`
    }

    // Transform earnings to array format
    const earningsArray = (earnings || []).map((e) => ({
      description: e.description || 'Regular hours',
      rate: Number(e.rate) || 0,
      hours: Number(e.hours) || 0,
      total: Number(e.total) || 0,
    }))

    // Ensure at least one earnings entry exists (even if empty)
    const finalEarnings = earningsArray.length > 0 
      ? earningsArray 
      : [{ description: 'Regular hours', rate: 0, hours: 0, total: 0 }]

    // Calculate gross pay from earnings if not available in deduction
    const grossPay = finalEarnings.reduce((sum, e) => sum + e.total, 0) || Number(deduction.gross_pay) || 0

    // Build PayslipData with proper defaults for all fields
    const payslipData: PayslipData = {
      employerName: organization.employer_business_name || organization.name || 'Employer Name Not Set',
      employerABN: formatABN(organization.abn),
      companyLogoUrl: organization.company_logo_url || null,
      employeeName: employee.full_name || 'Employee Name Not Set',
      classification: employee.classification || 'N/A',
      payPeriodStart,
      payPeriodEnd,
      paymentDate,
      earnings: finalEarnings,
      taxWithheld: Number(deduction.tax_withheld) || 0,
      superannuation: {
        fundName: employee.super_fund_name || 'Not specified',
        amount: Number(deduction.superannuation) || 0,
      },
      grossPay: grossPay || 0,
      netPay: Number(deduction.net_pay) || 0,
    }

    return { data: payslipData }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

