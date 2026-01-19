import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentProfile } from '@/app/actions/auth'
import { SettingsLayout } from './components/settings-layout'

export default async function SettingsPage() {
  const user = await getCurrentUser()
  const profile = await getCurrentProfile()

  if (!user || !profile) {
    redirect('/login')
  }

  const preferences = user.user_metadata?.preferences || {}

  const organizationData =
    profile.role === 'owner' && profile.organizations
      ? {
          name:
            (profile.organizations as { name: string })?.name || '',
          companyLogoUrl:
            (profile.organizations as {
              company_logo_url?: string | null
            })?.company_logo_url || null,
          employerBusinessName:
            (profile.organizations as {
              employer_business_name?: string | null
            })?.employer_business_name || null,
          abn:
            (profile.organizations as { abn?: string | null })?.abn ||
            null,
        }
      : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <SettingsLayout
        userRole={profile.role}
        profileData={{
          fullName: profile.full_name,
          email: user.email || '',
        }}
        organizationData={organizationData}
        preferences={{
          timezone: preferences.timezone || 'America/New_York',
          emailNotifications: preferences.emailNotifications !== false,
        }}
      />
    </div>
  )
}

