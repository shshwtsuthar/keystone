'use client'

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'
import { Button } from '@/components/ui/button'
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
import { LocationForm } from './location-form'
import { deleteLocation } from '@/app/actions/locations'
import { Pencil, Trash2, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'

interface Location {
  id: string
  name: string
  address: string | null
  timezone: string
  created_at: string
}

interface LocationTableProps {
  locations: Location[]
}

export function LocationTable({ locations }: LocationTableProps) {
  const router = useRouter()
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)

  const handleDelete = async (id: string) => {
    const result = await deleteLocation(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Location deleted successfully')
      router.refresh()
    }
  }

  const columns: ColumnDef<Location>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      accessorKey: 'address',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Address" />
      ),
      cell: ({ row }) => {
        return row.original.address || '-'
      },
    },
    {
      accessorKey: 'timezone',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Timezone" />
      ),
      cell: ({ row }) => {
        return row.original.timezone
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const location = row.original

        return (
          <div className="flex items-center justify-end gap-2">
            <Link href={`/kiosk/${location.id}`}>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Launch Kiosk
              </Button>
            </Link>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingLocation(location)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Location</DialogTitle>
                  <DialogDescription>
                    Update location details
                  </DialogDescription>
                </DialogHeader>
                <LocationForm
                  location={editingLocation || undefined}
                  onSuccess={() => {
                    setEditingLocation(null)
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
                    This will permanently delete this location. This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(location.id)}
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

  if (locations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No locations yet. Create your first location to get started.
      </div>
    )
  }

  return (
    <DataTable
      columns={columns}
      data={locations}
      searchKey="name"
      searchPlaceholder="Search locations..."
      enableSearch={true}
      enablePagination={true}
      enableColumnVisibility={true}
    />
  )
}
