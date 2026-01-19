'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

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

