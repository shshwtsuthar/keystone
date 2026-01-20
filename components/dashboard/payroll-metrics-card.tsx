'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, Calendar, DollarSign, UserCheck } from 'lucide-react'
import { formatCurrency } from '@/lib/analytics-utils'
import type { PayrollMetrics } from '@/app/actions/payroll'

interface PayrollMetricsCardProps {
  metrics: PayrollMetrics
}

export const PayrollMetricsCard = ({ metrics }: PayrollMetricsCardProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Pay Runs</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.totalPayRuns}</div>
          <p className="text-xs text-muted-foreground mt-1">
            All pay runs created
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pay Runs This Month</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.payRunsThisMonth}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Pay runs created this month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Amount Paid</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatCurrency(metrics.totalAmountPaid)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Total gross pay across all pay runs
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Employees Paid This Month</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.employeesPaidThisMonth}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Unique employees paid this month
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

