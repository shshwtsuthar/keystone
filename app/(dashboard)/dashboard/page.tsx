import { createClient } from '@/utils/supabase/server'
import { getCurrentProfile } from '@/app/actions/auth'
import {
  getHoursByPeriod,
  getLaborCostData,
  getAdditionalMetrics,
} from '@/app/actions/analytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LaborCostCard } from '@/components/dashboard/labor-cost-card'
import { HoursChart } from '@/components/dashboard/hours-chart'
import { PayrollsGeneratedCard } from '@/components/dashboard/payrolls-generated-card'
import { PeakHoursChart } from '@/components/dashboard/peak-hours-chart'
import { startOfMonth, endOfMonth } from 'date-fns'
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
  const [currentLaborCost, previousLaborCost, additionalMetrics] = await Promise.all([
    getLaborCostData(currentMonthStart, currentMonthEnd),
    getLaborCostData(prevMonthStart, prevMonthEnd),
    getAdditionalMetrics(),
  ])

  // Get payrolls generated this month
  const { count: payRunsThisMonthCount } = await supabase
    .from('pay_runs')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', profile.organization_id)
    .gte('created_at', currentMonthStart.toISOString())
    .lte('created_at', currentMonthEnd.toISOString())

  const laborCostComparison = {
    current: currentLaborCost.totalLaborCost,
    previous: previousLaborCost.totalLaborCost,
    change: currentLaborCost.totalLaborCost - previousLaborCost.totalLaborCost,
    changePercent: previousLaborCost.totalLaborCost > 0
      ? ((currentLaborCost.totalLaborCost - previousLaborCost.totalLaborCost) / previousLaborCost.totalLaborCost) * 100
      : (currentLaborCost.totalLaborCost > 0 ? 100 : 0),
  }

  return (
    <div className="flex flex-col h-full gap-6">
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
        <PayrollsGeneratedCard count={payRunsThisMonthCount || 0} />
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

      {/* Charts Section - Side by Side */}
      <div className="grid gap-4 md:grid-cols-2 flex-1 min-h-0">
        <HoursChart
          dailyData={dailyHours}
          weeklyData={weeklyHours}
          monthlyData={monthlyHours}
        />
        <PeakHoursChart peakHours={additionalMetrics.peakHours} />
      </div>
    </div>
  )
}
