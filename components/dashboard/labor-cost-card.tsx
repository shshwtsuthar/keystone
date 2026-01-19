'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/analytics-utils'

interface LaborCostCardProps {
  totalLaborCost: number
}

export const LaborCostCard = ({ totalLaborCost }: LaborCostCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Labour Cost</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{formatCurrency(totalLaborCost)}</div>
        <p className="text-xs text-muted-foreground mt-1">
          Total labour cost this month
        </p>
      </CardContent>
    </Card>
  )
}

