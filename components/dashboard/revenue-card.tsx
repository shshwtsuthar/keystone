'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency, formatPercent } from '@/lib/analytics-utils'
import { cn } from '@/lib/utils'

interface LaborCostCardProps {
  totalLaborCost: number
  changePercent?: number
  period?: string
}

export const LaborCostCard = ({ totalLaborCost, changePercent, period = 'this month' }: LaborCostCardProps) => {
  const isPositive = changePercent === undefined || changePercent >= 0
  const hasChange = changePercent !== undefined

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Labor Cost</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{formatCurrency(totalLaborCost)}</div>
        {hasChange && (
          <div className="flex items-center gap-1 text-xs mt-1">
            {isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
            )}
            <span
              className={cn(
                'font-medium',
                isPositive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              )}
            >
              {formatPercent(changePercent)}
            </span>
            <span className="text-muted-foreground">from {period}</span>
          </div>
        )}
        {!hasChange && (
          <p className="text-xs text-muted-foreground mt-1">
            Labor cost for {period}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

