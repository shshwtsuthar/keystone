'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export const signIn = async (email: string, password: string) => {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export const signUp = async (email: string, password: string, fullName: string, organizationName: string) => {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        organization_name: organizationName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  // When email confirmation is disabled, user is auto-confirmed and session is created
  // Check if user is confirmed and has a session
  if (data.user && data.session) {
    // User is auto-confirmed and signed in, redirect to dashboard
    redirect('/dashboard')
  }

  // If user exists but no session (email confirmation enabled), redirect to login
  if (data.user && !data.session) {
    redirect('/login?message=Account created successfully! Please check your email to confirm your account.')
  }

  // Fallback: redirect to login
  redirect('/login?message=Account created successfully! You can now sign in.')
}

export const signOut = async () => {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export const getCurrentUser = async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const getCurrentProfile = async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*, organizations(*)')
    .eq('id', user.id)
    .single()

  // If profile doesn't exist, try to create it (fallback if trigger didn't run)
  if (!profile && !error) {
    // Get user metadata
    const fullName = user.user_metadata?.full_name || ''
    const orgName = user.user_metadata?.organization_name || 'My Organization'
    
    // Create organization first
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: orgName })
      .select()
      .single()

    if (orgError || !org) {
      console.error('Failed to create organization:', orgError)
      return null
    }

    // Create profile
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        organization_id: org.id,
        full_name: fullName,
        role: 'owner',
      })
      .select('*, organizations(*)')
      .single()

    if (profileError) {
      console.error('Failed to create profile:', profileError)
      return null
    }

    return newProfile
  }

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return profile
}

