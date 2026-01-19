'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

interface PayRun {
  id: string
  pay_period_start: string
  pay_period_end: string
  payment_date: string
  status: 'draft' | 'finalized'
  employeeCount: number
  totalAmount: number
}

interface PayRunsTableProps {
  payRuns: PayRun[]
}

export const PayRunsTable = ({ payRuns }: PayRunsTableProps) => {
  if (payRuns.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No pay runs found. Create your first pay run to get started.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pay Period</TableHead>
          <TableHead>Payment Date</TableHead>
          <TableHead>Employees</TableHead>
          <TableHead className="text-right">Total Amount</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payRuns.map((payRun) => (
          <TableRow key={payRun.id}>
            <TableCell>
              {format(new Date(payRun.pay_period_start), 'MMM d')} -{' '}
              {format(new Date(payRun.pay_period_end), 'MMM d, yyyy')}
            </TableCell>
            <TableCell>
              {format(new Date(payRun.payment_date), 'MMM d, yyyy')}
            </TableCell>
            <TableCell>{payRun.employeeCount}</TableCell>
            <TableCell className="text-right font-medium">
              ${payRun.totalAmount.toFixed(2)}
            </TableCell>
            <TableCell>
              <Badge variant={payRun.status === 'finalized' ? 'default' : 'secondary'}>
                {payRun.status === 'finalized' ? 'Finalized' : 'Draft'}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

