import { createClient } from '@/utils/supabase/server'
import { getCurrentProfile } from '@/app/actions/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { Clock, Users } from 'lucide-react'

export default async function DashboardPage() {
  const profile = await getCurrentProfile()
  const supabase = await createClient()

  if (!profile) {
    return null
  }

  // Get currently working employees
  const { data: activeTimesheets } = await supabase
    .from('timesheets')
    .select(`
      *,
      employees (
        id,
        full_name
      ),
      locations (
        id,
        name
      )
    `)
    .eq('organization_id', profile.organization_id)
    .is('clock_out', null)
    .order('clock_in', { ascending: false })

  // Get total employees count
  const { count: totalEmployees } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', profile.organization_id)
    .eq('is_active', true)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your time tracking system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Currently Working
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeTimesheets?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Employees clocked in right now
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Employees
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active employees in your organization
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Currently Working</CardTitle>
          <CardDescription>
            Employees who are currently clocked in
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeTimesheets && activeTimesheets.length > 0 ? (
            <div className="space-y-4">
              {activeTimesheets.map((timesheet: any) => (
                <div
                  key={timesheet.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">
                      {timesheet.employees?.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {timesheet.locations?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      Clocked in at{' '}
                      {format(new Date(timesheet.clock_in), 'h:mm a')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(timesheet.clock_in), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No employees are currently working
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
