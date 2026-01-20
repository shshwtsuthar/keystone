'use server'

import { createClient } from '@/utils/supabase/server'
import { getCurrentProfile } from './auth'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

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

export const updateOrganization = async (formData: FormData) => {
  const supabase = await createClient()
  const profile = await getCurrentProfile()

  if (!profile) {
    return { error: 'Not authenticated' }
  }

  if (profile.role !== 'owner') {
    return { error: 'Only organization owners can update organization settings' }
  }

  const name = formData.get('name') as string
  const employerBusinessName = formData.get('employerBusinessName') as string | null
  const abn = formData.get('abn') as string | null
  const superannuationDefaultRate = formData.get('superannuationDefaultRate') as string | null
  const companyLogo = formData.get('companyLogo') as File | null
  const removeLogo = formData.get('removeLogo') === 'true'

  // Normalize ABN (remove spaces, keep only digits)
  const normalizedAbn = abn ? abn.replace(/\s+/g, '') : null

  // Validate ABN if provided (should be 11 digits)
  if (normalizedAbn && !/^\d{11}$/.test(normalizedAbn)) {
    return { error: 'ABN must be 11 digits' }
  }

  // Get current organization data (fetch once, reuse throughout)
  const { data: currentOrg } = await supabase
    .from('organizations')
    .select('name, company_logo_url')
    .eq('id', profile.organization_id)
    .single()

  // If the passed name is "My Organization" (hardcoded default), preserve the existing name
  // This prevents the onboarding dialog from overwriting the signup organization name
  const finalName = name === 'My Organization' && currentOrg?.name
    ? currentOrg.name
    : name

  let logoUrl: string | null = null

  // Handle logo upload
  if (companyLogo && companyLogo.size > 0) {
    // Validate file type
    if (!companyLogo.type.startsWith('image/')) {
      return { error: 'Logo must be an image file' }
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (companyLogo.size > maxSize) {
      return { error: 'Logo file size must be less than 5MB' }
    }

    // Delete old logo if it exists
    if (currentOrg?.company_logo_url) {
      const oldLogoPath = currentOrg.company_logo_url.split('/').pop()
      if (oldLogoPath) {
        await supabase.storage
          .from('company-logos')
          .remove([oldLogoPath])
      }
    }

    // Generate unique filename
    const fileExt = companyLogo.name.split('.').pop()
    const fileName = `${profile.organization_id}-${Date.now()}.${fileExt}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('company-logos')
      .upload(fileName, companyLogo, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      return { error: `Failed to upload logo: ${uploadError.message}` }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('company-logos')
      .getPublicUrl(fileName)

    logoUrl = urlData.publicUrl
  } else if (removeLogo) {
    // Remove logo if requested
    if (currentOrg?.company_logo_url) {
      const oldLogoPath = currentOrg.company_logo_url.split('/').pop()
      if (oldLogoPath) {
        await supabase.storage
          .from('company-logos')
          .remove([oldLogoPath])
      }
    }
    logoUrl = null
  } else {
    // Keep existing logo if not updating
    logoUrl = currentOrg?.company_logo_url || null
  }

  // Parse superannuation default rate
  const parsedSuperannuationRate = superannuationDefaultRate && superannuationDefaultRate.trim() !== ''
    ? parseFloat(superannuationDefaultRate)
    : null

  // Validate superannuation rate if provided
  if (parsedSuperannuationRate !== null && (isNaN(parsedSuperannuationRate) || parsedSuperannuationRate < 0 || parsedSuperannuationRate > 100)) {
    return { error: 'Superannuation rate must be between 0 and 100' }
  }

  // Prepare update object
  const updateData: {
    name: string
    employer_business_name?: string | null
    abn?: string | null
    superannuation_default_rate?: number | null
    company_logo_url?: string | null
  } = {
    name: finalName,
  }

  if (employerBusinessName !== undefined) {
    updateData.employer_business_name = employerBusinessName || null
  }

  if (normalizedAbn !== undefined) {
    updateData.abn = normalizedAbn || null
  }

  if (superannuationDefaultRate !== undefined) {
    updateData.superannuation_default_rate = parsedSuperannuationRate
  }

  if (companyLogo || removeLogo) {
    updateData.company_logo_url = logoUrl
  }

  // Update organization
  const { error } = await supabase
    .from('organizations')
    .update(updateData)
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

export const verifyPassword = async (password: string) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return { error: 'Not authenticated' }
  }

  // Verify password by attempting to sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: password,
  })

  if (signInError) {
    return { error: 'Password is incorrect' }
  }

  return { success: true }
}

export const updateMasterPin = async (masterPin: string) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Validate PIN (4 digits)
  if (!/^\d{4}$/.test(masterPin)) {
    return { error: 'Master PIN must be exactly 4 digits' }
  }

  // Hash the master PIN
  const pinHash = await bcrypt.hash(masterPin, 10)

  // Update profile with master PIN hash
  const { error } = await supabase
    .from('profiles')
    .update({ master_pin_hash: pinHash })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

