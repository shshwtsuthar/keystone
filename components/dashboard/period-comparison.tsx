'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { formatHours, formatPercent, formatCurrency } from '@/lib/analytics-utils'
import { cn } from '@/lib/utils'
import type { PeriodComparison as PeriodComparisonData } from '@/app/actions/analytics'

interface PeriodComparisonProps {
  hoursComparison: PeriodComparisonData
  laborCostComparison?: PeriodComparisonData
  period: 'daily' | 'weekly' | 'monthly'
}

const getPeriodLabel = (period: 'daily' | 'weekly' | 'monthly'): string => {
  switch (period) {
    case 'daily':
      return 'Today vs Yesterday'
    case 'weekly':
      return 'This Week vs Last Week'
    case 'monthly':
      return 'This Month vs Last Month'
  }
}

export const PeriodComparison = ({
  hoursComparison,
  laborCostComparison,
  period,
}: PeriodComparisonProps) => {
  const periodLabel = getPeriodLabel(period)

  const ComparisonCard = ({
    title,
    current,
    previous,
    change,
    changePercent,
    formatValue,
  }: {
    title: string
    current: number
    previous: number
    change: number
    changePercent: number
    formatValue: (value: number) => string
  }) => {
    const isPositive = change >= 0

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <CardDescription>{periodLabel}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Current</p>
                <p className="text-2xl font-bold">{formatValue(current)}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Previous</p>
                <p className="text-2xl font-bold">{formatValue(previous)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 pt-2 border-t">
              {isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  isPositive
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {formatPercent(changePercent)} ({formatValue(Math.abs(change))})
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ComparisonCard
        title="Hours Worked"
        current={hoursComparison.current}
        previous={hoursComparison.previous}
        change={hoursComparison.change}
        changePercent={hoursComparison.changePercent}
        formatValue={formatHours}
      />
      {laborCostComparison && (
        <ComparisonCard
          title="Labor Cost"
          current={laborCostComparison.current}
          previous={laborCostComparison.previous}
          change={laborCostComparison.change}
          changePercent={laborCostComparison.changePercent}
          formatValue={formatCurrency}
        />
      )}
    </div>
  )
}

