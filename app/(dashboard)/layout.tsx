import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentProfile } from '@/app/actions/auth'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { LayoutDashboard, Users, MapPin, DollarSign, Bug } from 'lucide-react'
import Link from 'next/link'
import { UserSwitcher } from '@/components/dashboard/user-switcher'
import { OnboardingWrapper } from '@/components/onboarding/onboarding-wrapper'
import { DebugOnboardingButton } from '@/components/onboarding/debug-onboarding-button'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  const profile = await getCurrentProfile()

  if (!user || !profile) {
    redirect('/login')
  }

  const organizationName = 
    (profile.organizations as { name?: string })?.name || 'Company Name'
  const companyLogoUrl = 
    (profile.organizations as { company_logo_url?: string | null })?.company_logo_url || null

  // Check if onboarding is needed (master_pin_hash is null)
  const needsOnboarding = !profile.master_pin_hash

  return (
    <SidebarProvider>
      <OnboardingWrapper
        userRole={profile.role}
        initialNeedsOnboarding={needsOnboarding}
      />
      <Sidebar>
        <SidebarHeader className="h-16 flex flex-row items-center justify-start relative border-b">
          <div className="flex items-center gap-2 px-2">
            {companyLogoUrl ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden bg-background">
                <img
                  src={companyLogoUrl}
                  alt={organizationName}
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <LayoutDashboard className="h-4 w-4" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{organizationName}</span>
              <span className="text-xs text-muted-foreground">Keystone</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard">
                      <LayoutDashboard />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard/locations">
                      <MapPin />
                      <span>Locations</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard/employees">
                      <Users />
                      <span>Employees</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard/payroll">
                      <DollarSign />
                      <span>Payroll</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarSeparator />
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <DebugOnboardingButton />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <UserSwitcher
            user={{
              name: profile.full_name || user.email || 'User',
              email: user.email,
            }}
          />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <div className="flex-1" />
          <div className="text-sm text-muted-foreground">
            {profile.full_name || profile.id}
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
