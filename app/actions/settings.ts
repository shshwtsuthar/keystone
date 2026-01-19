'use server'

import { createClient } from '@/utils/supabase/server'
import { getCurrentProfile } from './auth'
import { revalidatePath } from 'next/cache'

export const updateProfile = async (fullName: string) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export const updateOrganization = async (name: string) => {
  const supabase = await createClient()
  const profile = await getCurrentProfile()

  if (!profile) {
    return { error: 'Not authenticated' }
  }

  if (profile.role !== 'owner') {
    return { error: 'Only organization owners can update organization settings' }
  }

  const { error } = await supabase
    .from('organizations')
    .update({ name })
    .eq('id', profile.organization_id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export const updatePassword = async (
  currentPassword: string,
  newPassword: string
) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return { error: 'Not authenticated' }
  }

  // Verify current password by attempting to sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })

  if (signInError) {
    return { error: 'Current password is incorrect' }
  }

  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (updateError) {
    return { error: updateError.message }
  }

  return { success: true }
}

export const updatePreferences = async (preferences: {
  timezone?: string
  emailNotifications?: boolean
}) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Store preferences in user metadata
  const { error } = await supabase.auth.updateUser({
    data: {
      ...user.user_metadata,
      preferences: {
        ...(user.user_metadata?.preferences || {}),
        ...preferences,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

