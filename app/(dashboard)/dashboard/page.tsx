import { createClient } from '@/utils/supabase/server'
import { getCurrentProfile } from '@/app/actions/auth'
import { getTopEmployeesByHours } from '@/app/actions/kiosk'
import {
  getHoursByPeriod,
  getLaborCostData,
  getLocationStatsForCurrentMonth,
  getPeriodComparison,
  getAdditionalMetrics,
} from '@/app/actions/analytics'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LaborCostCard } from '@/components/dashboard/labor-cost-card'
import { HoursChart } from '@/components/dashboard/hours-chart'
import { LocationStatsCard } from '@/components/dashboard/location-stats-card'
import { PeriodComparison } from '@/components/dashboard/period-comparison'
import { AdditionalMetrics } from '@/components/dashboard/additional-metrics'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { Clock, Users, Trophy } from 'lucide-react'

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

  // Get top 5 employees by hours worked
  const { employees: topEmployees } = await getTopEmployeesByHours(5)

  // Get locations
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name')
    .eq('organization_id', profile.organization_id)
    .order('name')

  // Fetch analytics data
  const [dailyHours, weeklyHours, monthlyHours] = await Promise.all([
    getHoursByPeriod('daily'),
    getHoursByPeriod('weekly'),
    getHoursByPeriod('monthly'),
  ])

  const currentMonthStart = startOfMonth(new Date())
  const currentMonthEnd = endOfMonth(new Date())

  // Calculate labor cost comparison
  const prevMonthStart = startOfMonth(new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() - 1))
  const prevMonthEnd = endOfMonth(prevMonthStart)
  const [currentLaborCost, previousLaborCost] = await Promise.all([
    getLaborCostData(currentMonthStart, currentMonthEnd),
    getLaborCostData(prevMonthStart, prevMonthEnd),
  ])

  const laborCostComparison = {
    current: currentLaborCost.totalLaborCost,
    previous: previousLaborCost.totalLaborCost,
    change: currentLaborCost.totalLaborCost - previousLaborCost.totalLaborCost,
    changePercent: previousLaborCost.totalLaborCost > 0
      ? ((currentLaborCost.totalLaborCost - previousLaborCost.totalLaborCost) / previousLaborCost.totalLaborCost) * 100
      : (currentLaborCost.totalLaborCost > 0 ? 100 : 0),
  }

  const [locationStats, hoursComparison, additionalMetrics] = await Promise.all([
    getLocationStatsForCurrentMonth(undefined),
    getPeriodComparison('monthly'),
    getAdditionalMetrics(),
  ])

  // Helper function to format seconds to hours:minutes:seconds
  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your time tracking system
        </p>
      </div>

      {/* Key Metrics - Top Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <LaborCostCard
          totalLaborCost={currentLaborCost.totalLaborCost}
          changePercent={laborCostComparison.changePercent}
          period="this month"
        />
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

      {/* Hours Chart */}
      <HoursChart
        dailyData={dailyHours}
        weeklyData={weeklyHours}
        monthlyData={monthlyHours}
      />

      {/* Period Comparison */}
      <PeriodComparison
        hoursComparison={hoursComparison}
        laborCostComparison={laborCostComparison}
        period="monthly"
      />

      {/* Location Stats */}
      {locations && locations.length > 0 && (
        <LocationStatsCard
          locations={locations}
          initialStats={locationStats}
          onLocationChange={getLocationStatsForCurrentMonth}
        />
      )}

      {/* Additional Metrics */}
      <AdditionalMetrics metrics={additionalMetrics} />

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top 5 Employees by Hours Worked
          </CardTitle>
          <CardDescription>
            Employees with the most total hours clocked in
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topEmployees && topEmployees.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Employee Name</TableHead>
                  <TableHead className="text-right">Total Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topEmployees.map((employee, index) => (
                  <TableRow key={employee.employee_id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{employee.full_name}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatTime(employee.total_seconds)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No timesheet data available yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
