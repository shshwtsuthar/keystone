'use client'

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { EmployeeForm } from './employee-form'
import { deleteEmployee } from '@/app/actions/employees'
import { Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Location {
  id: string
  name: string
}

interface Employee {
  id: string
  full_name: string
  pay_rate: number | null
  default_location_id: string | null
  is_active: boolean
  locations?: {
    name: string
  } | null
}

interface EmployeeTableProps {
  employees: Employee[]
  locations: Location[]
}

export function EmployeeTable({ employees, locations }: EmployeeTableProps) {
  const router = useRouter()
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)

  const handleDelete = async (id: string) => {
    const result = await deleteEmployee(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Employee deleted successfully')
      router.refresh()
    }
  }

  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: 'full_name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.original.full_name}</div>
      ),
    },
    {
      accessorKey: 'pay_rate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Pay Rate" />
      ),
      cell: ({ row }) => {
        const payRate = row.original.pay_rate
        return payRate ? `$${payRate.toFixed(2)}/hr` : '-'
      },
    },
    {
      accessorKey: 'locations.name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Default Location" />
      ),
      cell: ({ row }) => {
        return row.original.locations?.name || '-'
      },
    },
    {
      accessorKey: 'is_active',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const isActive = row.original.is_active
        return (
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const employee = row.original

        return (
          <div className="flex items-center justify-end gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingEmployee(employee)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Employee</DialogTitle>
                  <DialogDescription>
                    Update employee details
                  </DialogDescription>
                </DialogHeader>
                <EmployeeForm
                  employee={editingEmployee || undefined}
                  locations={locations}
                  onSuccess={() => {
                    setEditingEmployee(null)
                    router.refresh()
                  }}
                />
              </DialogContent>
            </Dialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this employee. This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(employee.id)}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )
      },
      enableSorting: false,
      enableHiding: false,
    },
  ]

  if (employees.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No employees yet. Create your first employee to get started.
      </div>
    )
  }

  return (
    <DataTable
      columns={columns}
      data={employees}
      searchKey="full_name"
      searchPlaceholder="Search employees..."
      enableSearch={true}
      enablePagination={true}
      enableColumnVisibility={true}
    />
  )
}
