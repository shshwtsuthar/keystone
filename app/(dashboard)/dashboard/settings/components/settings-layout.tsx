'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { User, Building2, Bell, Shield } from 'lucide-react'
import { ProfileSettings } from './profile-settings'
import { OrganizationSettings } from './organization-settings'
import { PreferencesSettings } from './preferences-settings'
import { SecuritySettings } from './security-settings'

type SettingsTab = 'profile' | 'organization' | 'preferences' | 'security'

interface SettingsLayoutProps {
  userRole: 'owner' | 'manager'
  profileData: {
    fullName: string | null
    email: string
  }
  organizationData: {
    name: string
    companyLogoUrl: string | null
    employerBusinessName: string | null
    abn: string | null
  } | null
  preferences: {
    timezone: string
    emailNotifications: boolean
  }
}

export const SettingsLayout = ({
  userRole,
  profileData,
  organizationData,
  preferences,
}: SettingsLayoutProps) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  const tabs: Array<{
    id: SettingsTab
    label: string
    icon: React.ComponentType<{ className?: string }>
    visible: boolean
  }> = [
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      visible: true,
    },
    {
      id: 'organization',
      label: 'Organization',
      icon: Building2,
      visible: userRole === 'owner',
    },
    {
      id: 'preferences',
      label: 'Preferences',
      icon: Bell,
      visible: true,
    },
    {
      id: 'security',
      label: 'Security',
      icon: Shield,
      visible: true,
    },
  ]

  const visibleTabs = tabs.filter((tab) => tab.visible)

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and account details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileSettings
                initialName={profileData.fullName || ''}
                email={profileData.email}
              />
            </CardContent>
          </Card>
        )

      case 'organization':
        if (!organizationData) return null
        return (
          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
              <CardDescription>
                Manage your organization information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrganizationSettings
                initialName={organizationData.name}
                initialCompanyLogoUrl={organizationData.companyLogoUrl}
                initialEmployerBusinessName={organizationData.employerBusinessName}
                initialAbn={organizationData.abn}
              />
            </CardContent>
          </Card>
        )

      case 'preferences':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Customize your application preferences and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PreferencesSettings
                initialTimezone={preferences.timezone}
                initialEmailNotifications={preferences.emailNotifications}
              />
            </CardContent>
          </Card>
        )

      case 'security':
        return (
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
        )

      default:
        return null
    }
  }

  return (
    <div className="flex gap-6">
      {/* Left Panel - Navigation */}
      <div className="w-64 shrink-0">
        <nav className="space-y-1">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <Button
                key={tab.id}
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-2',
                  isActive && 'bg-secondary font-medium'
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </Button>
            )
          })}
        </nav>
      </div>

      {/* Right Panel - Content */}
      <div className="flex-1 min-w-0">
        <div className="space-y-4">{renderContent()}</div>
      </div>
    </div>
  )
}

