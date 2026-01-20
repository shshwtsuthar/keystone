'use server'

import { createClient } from '@/utils/supabase/server'
import { getCurrentProfile } from './auth'
import { updateMasterPin, updateOrganization, updatePreferences } from './settings'
import { revalidatePath } from 'next/cache'

export const checkOnboardingNeeded = async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { needsOnboarding: false, error: 'Not authenticated' }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_onboarded')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return { needsOnboarding: false, error: 'Profile not found' }
  }

  // Onboarding is needed if is_onboarded is false
  return { needsOnboarding: !profile.is_onboarded }
}

export const saveOnboardingMasterPin = async (masterPin: string) => {
  const result = await updateMasterPin(masterPin)
  if (result.error) {
    return { error: result.error }
  }
  revalidatePath('/dashboard')
  return { success: true }
}

export const saveOnboardingCompanyDetails = async (formData: FormData) => {
  const profile = await getCurrentProfile()
  
  if (!profile || profile.role !== 'owner') {
    // If not owner, skip company details
    return { success: true }
  }

  const result = await updateOrganization(formData)
  if (result.error) {
    return { error: result.error }
  }
  revalidatePath('/dashboard')
  return { success: true }
}

export const saveOnboardingTimezone = async (timezone: string) => {
  const result = await updatePreferences({ timezone })
  if (result.error) {
    return { error: result.error }
  }
  revalidatePath('/dashboard')
  return { success: true }
}

export const saveOnboardingTheme = async (theme: string) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Store theme in user metadata preferences
  const { error } = await supabase.auth.updateUser({
    data: {
      ...user.user_metadata,
      preferences: {
        ...(user.user_metadata?.preferences || {}),
        theme,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export const completeOnboarding = async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Mark onboarding as complete
  const { error } = await supabase
    .from('profiles')
    .update({ is_onboarded: true })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

