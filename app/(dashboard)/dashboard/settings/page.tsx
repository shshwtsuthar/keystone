import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentProfile } from '@/app/actions/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfileSettings } from './components/profile-settings'
import { OrganizationSettings } from './components/organization-settings'
import { PreferencesSettings } from './components/preferences-settings'
import { SecuritySettings } from './components/security-settings'
import { User, Building2, Bell, Shield } from 'lucide-react'

export default async function SettingsPage() {
  const user = await getCurrentUser()
  const profile = await getCurrentProfile()

  if (!user || !profile) {
    redirect('/login')
  }

  const preferences = user.user_metadata?.preferences || {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          {profile.role === 'owner' && (
            <TabsTrigger value="organization" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span>Organization</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="preferences" className="gap-2">
            <Bell className="h-4 w-4" />
            <span>Preferences</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and account details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileSettings
                initialName={profile.full_name || ''}
                email={user.email || ''}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {profile.role === 'owner' && (
          <TabsContent value="organization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Organization Settings</CardTitle>
                <CardDescription>
                  Manage your organization information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OrganizationSettings
                  initialName={
                    (profile.organizations as { name: string })?.name || ''
                  }
                  initialCompanyLogoUrl={
                    (profile.organizations as { company_logo_url?: string | null })?.company_logo_url || null
                  }
                  initialEmployerBusinessName={
                    (profile.organizations as { employer_business_name?: string | null })?.employer_business_name || null
                  }
                  initialAbn={
                    (profile.organizations as { abn?: string | null })?.abn || null
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Customize your application preferences and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PreferencesSettings
                initialTimezone={preferences.timezone || 'America/New_York'}
                initialEmailNotifications={
                  preferences.emailNotifications !== false
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Manage your password and security settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SecuritySettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

