'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Clock, Users, AlertTriangle } from 'lucide-react'
import { formatHours, formatPercent } from '@/lib/analytics-utils'
import type { AdditionalMetrics as AdditionalMetricsData } from '@/app/actions/analytics'

interface AdditionalMetricsProps {
  metrics: AdditionalMetricsData
}

const peakHoursConfig = {
  count: {
    label: 'Employees',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig

export const AdditionalMetrics = ({ metrics }: AdditionalMetricsProps) => {
  const peakHoursData = metrics.peakHours.map((ph) => ({
    hour: `${ph.hour}:00`,
    count: ph.count,
  }))

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Hours/Employee</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatHours(metrics.averageHoursPerEmployee)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Average hours per active employee
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatPercent(metrics.employeeUtilizationRate, 1)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Active employees / Total employees
          </p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Peak Hours</CardTitle>
          <CardDescription>Employee activity by hour of day</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={peakHoursConfig}>
            <BarChart data={peakHoursData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => [`${value} employees`, 'Count']}
                  />
                }
              />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {metrics.overtimeEmployees.length > 0 && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Overtime Employees ({metrics.overtimeEmployees.length})
            </CardTitle>
            <CardDescription>
              Employees with more than 40 hours this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.overtimeEmployees.map((employee) => (
                <div
                  key={employee.employee_id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span className="font-medium">{employee.full_name}</span>
                  <span className="text-sm font-mono text-muted-foreground">
                    {formatHours(employee.hours)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

