'use client'

import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'
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
  const columns: ColumnDef<PayRun>[] = [
    {
      accessorKey: 'pay_period_start',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Pay Period" />
      ),
      cell: ({ row }) => {
        const payRun = row.original
        return (
          <>
            {format(new Date(payRun.pay_period_start), 'MMM d')} -{' '}
            {format(new Date(payRun.pay_period_end), 'MMM d, yyyy')}
          </>
        )
      },
    },
    {
      accessorKey: 'payment_date',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Payment Date" />
      ),
      cell: ({ row }) => {
        return format(new Date(row.original.payment_date), 'MMM d, yyyy')
      },
    },
    {
      accessorKey: 'employeeCount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Employees" />
      ),
      cell: ({ row }) => {
        return row.original.employeeCount
      },
    },
    {
      accessorKey: 'totalAmount',
      header: ({ column }) => (
        <div className="text-right">
          <DataTableColumnHeader column={column} title="Total Amount" />
        </div>
      ),
      cell: ({ row }) => {
        return (
          <div className="text-right font-medium">
            ${row.original.totalAmount.toFixed(2)}
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <Badge variant={status === 'finalized' ? 'default' : 'secondary'}>
            {status === 'finalized' ? 'Finalized' : 'Draft'}
          </Badge>
        )
      },
    },
  ]

  if (payRuns.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No pay runs found. Create your first pay run to get started.
      </div>
    )
  }

  return (
    <DataTable
      columns={columns}
      data={payRuns}
      searchKey="payment_date"
      searchPlaceholder="Search pay runs..."
      enableSearch={false}
      enablePagination={true}
      enableColumnVisibility={true}
    />
  )
}
