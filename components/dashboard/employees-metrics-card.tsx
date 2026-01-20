'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserCheck, Clock, BarChart } from 'lucide-react'
import { formatHours } from '@/lib/analytics-utils'
import type { EmployeesMetrics } from '@/app/actions/employees'

interface EmployeesMetricsCardProps {
  metrics: EmployeesMetrics
}

export const EmployeesMetricsCard = ({ metrics }: EmployeesMetricsCardProps) => {
  if (!metrics) {
    return null
  }

  const safeMetrics = {
    totalEmployees: metrics.totalEmployees ?? 0,
    activeEmployees: metrics.activeEmployees ?? 0,
    currentlyWorking: metrics.currentlyWorking ?? 0,
    averageHoursPerEmployee: metrics.averageHoursPerEmployee ?? 0,
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{safeMetrics.totalEmployees}</div>
          <p className="text-xs text-muted-foreground mt-1">
            All employees in your organization
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{safeMetrics.activeEmployees}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Employees currently active
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Currently Working</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{safeMetrics.currentlyWorking}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Employees clocked in right now
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Hours per Employee</CardTitle>
          <BarChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatHours(safeMetrics.averageHoursPerEmployee)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Average hours per employee this month
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

