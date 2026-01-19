import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet } from 'lucide-react'

type PayrollsGeneratedCardProps = {
  count: number
}

export const PayrollsGeneratedCard = ({ count }: PayrollsGeneratedCardProps) => {
  return (
    <Card role="status" aria-label="Payrolls generated">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Payrolls Generated</CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{count}</div>
        <p className="text-xs text-muted-foreground">Total pay runs this month</p>
      </CardContent>
    </Card>
  )
}

