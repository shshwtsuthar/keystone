import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentProfile } from '@/app/actions/auth'
import { createClient } from '@/utils/supabase/server'
import { KioskInterface } from './kiosk-interface'

export default async function KioskPage({
  params,
}: {
  params: Promise<{ locationId: string }>
}) {
  const { locationId } = await params
  const user = await getCurrentUser()
  const profile = await getCurrentProfile()

  if (!user || !profile) {
    redirect('/login')
  }

  const supabase = await createClient()

  // Verify location belongs to user's organization
  const { data: location } = await supabase
    .from('locations')
    .select('*')
    .eq('id', locationId)
    .eq('organization_id', profile.organization_id)
    .single()

  if (!location) {
    redirect('/dashboard/locations')
  }

  // Get employees for this organization
  const { data: employees } = await supabase
    .from('employees')
    .select('id, full_name')
    .eq('organization_id', profile.organization_id)
    .eq('is_active', true)
    .order('full_name')

  return (
    <KioskInterface
      locationId={locationId}
      locationName={location.name}
      organizationId={profile.organization_id}
      employees={employees || []}
    />
  )
}

