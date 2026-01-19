'use server'

import { createClient } from '@/utils/supabase/server'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'

const generatePin = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export const createEmployee = async (
  fullName: string,
  payRate: number | null,
  defaultLocationId: string | null
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
  isActive: boolean
) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from('employees')
    .update({
      full_name: fullName,
      pay_rate: payRate,
      default_location_id: defaultLocationId,
      is_active: isActive,
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

