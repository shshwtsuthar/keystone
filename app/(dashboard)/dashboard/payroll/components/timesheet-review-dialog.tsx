'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ColumnDef } from '@tanstack/react-table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/data-table'
import { Spinner } from '@/components/ui/spinner'
import { getEmployeeTimesheets, updateTimesheet, type TimesheetWithId } from '@/app/actions/payroll'
import { calculateEmployeeHours } from '@/lib/payroll-utils'
import { toast } from 'sonner'

interface TimesheetReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeId: string
  employeeName: string
  payRate: number | null
  payPeriodStart: Date
  payPeriodEnd: Date
  onSave: (hours: number, total: number) => void
}

interface EditableTimesheet {
  id: string
  clockInDate: string
  clockInTime: string
  clockOutDate: string
  clockOutTime: string
}

export const TimesheetReviewDialog = ({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  payRate,
  payPeriodStart,
  payPeriodEnd,
  onSave,
}: TimesheetReviewDialogProps) => {
  const [timesheets, setTimesheets] = useState<EditableTimesheet[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      loadTimesheets()
    }
  }, [open, employeeId, payPeriodStart, payPeriodEnd])

  const loadTimesheets = async () => {
    setLoading(true)
    try {
      const { timesheets: data, error } = await getEmployeeTimesheets(
        employeeId,
        payPeriodStart.toISOString(),
        payPeriodEnd.toISOString()
      )

      if (error) {
        toast.error(error)
        return
      }

      // Convert timesheets to editable format
      const editable: EditableTimesheet[] = (data || []).map((ts) => {
        const clockIn = new Date(ts.clock_in)
        const clockOut = ts.clock_out ? new Date(ts.clock_out) : null

        return {
          id: ts.id,
          clockInDate: format(clockIn, 'yyyy-MM-dd'),
          clockInTime: format(clockIn, 'HH:mm'),
          clockOutDate: clockOut ? format(clockOut, 'yyyy-MM-dd') : format(clockIn, 'yyyy-MM-dd'),
          clockOutTime: clockOut ? format(clockOut, 'HH:mm') : '',
        }
      })

      setTimesheets(editable)
    } catch (error) {
      toast.error('Failed to load timesheets')
    } finally {
      setLoading(false)
    }
  }

  const handleTimesheetChange = (index: number, field: string, value: string) => {
    setTimesheets((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Update all timesheets
      const updatePromises = timesheets.map(async (ts) => {
        const clockIn = new Date(`${ts.clockInDate}T${ts.clockInTime}`)
        const clockOut = ts.clockOutTime ? new Date(`${ts.clockOutDate}T${ts.clockOutTime}`) : null

        const result = await updateTimesheet(
          ts.id,
          clockIn.toISOString(),
          clockOut?.toISOString() || null
        )

        if (result.error) {
          throw new Error(result.error)
        }
      })

      await Promise.all(updatePromises)

      // Calculate hours from updated timesheets
      const updatedTimesheets = timesheets.map((ts) => ({
        clock_in: new Date(`${ts.clockInDate}T${ts.clockInTime}`).toISOString(),
        clock_out: ts.clockOutTime ? new Date(`${ts.clockOutDate}T${ts.clockOutTime}`).toISOString() : null,
      }))

      const hours = calculateEmployeeHours(updatedTimesheets)
      const total = hours * (payRate || 0)

      onSave(hours, total)
      toast.success('Timesheets saved and reviewed')
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save timesheets')
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnDef<EditableTimesheet>[] = [
    {
      id: 'clockIn',
      header: 'Clock In',
      cell: ({ row }) => {
        const index = timesheets.findIndex((ts) => ts.id === row.original.id)
        return (
          <div className="flex gap-2">
            <Input
              type="date"
              value={row.original.clockInDate}
              onChange={(e) => handleTimesheetChange(index, 'clockInDate', e.target.value)}
              className="w-32"
            />
            <Input
              type="time"
              value={row.original.clockInTime}
              onChange={(e) => handleTimesheetChange(index, 'clockInTime', e.target.value)}
              className="w-24"
            />
          </div>
        )
      },
      enableSorting: false,
    },
    {
      id: 'clockOut',
      header: 'Clock Out',
      cell: ({ row }) => {
        const index = timesheets.findIndex((ts) => ts.id === row.original.id)
        return (
          <div className="flex gap-2">
            <Input
              type="date"
              value={row.original.clockOutDate}
              onChange={(e) => handleTimesheetChange(index, 'clockOutDate', e.target.value)}
              className="w-32"
            />
            <Input
              type="time"
              value={row.original.clockOutTime}
              onChange={(e) => handleTimesheetChange(index, 'clockOutTime', e.target.value)}
              className="w-24"
            />
          </div>
        )
      },
      enableSorting: false,
    },
    {
      id: 'hours',
      header: () => <div className="text-right">Hours</div>,
      cell: ({ row }) => {
        const clockIn = new Date(`${row.original.clockInDate}T${row.original.clockInTime}`)
        const clockOut = row.original.clockOutTime
          ? new Date(`${row.original.clockOutDate}T${row.original.clockOutTime}`)
          : null
        const hours = clockOut
          ? Math.round(((clockOut.getTime() - clockIn.getTime()) / 1000 / 3600) * 100) / 100
          : 0

        return <div className="text-right font-medium">{hours.toFixed(2)}</div>
      },
      enableSorting: false,
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Timesheets - {employeeName}</DialogTitle>
          <DialogDescription>
            Review and edit clock-in/clock-out times for this pay period
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-6 w-6" />
          </div>
        ) : timesheets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No timesheets found for this period.
          </div>
        ) : (
          <div className="space-y-4">
            <DataTable
              columns={columns}
              data={timesheets}
              enableSearch={false}
              enablePagination={false}
              enableColumnVisibility={false}
            />

            <div className="flex justify-between items-center pt-4 border-t">
              <div>
                <div className="text-sm text-muted-foreground">Total Hours:</div>
                <div className="text-lg font-semibold">
                  {calculateEmployeeHours(
                    timesheets.map((ts) => ({
                      clock_in: new Date(`${ts.clockInDate}T${ts.clockInTime}`).toISOString(),
                      clock_out: ts.clockOutTime
                        ? new Date(`${ts.clockOutDate}T${ts.clockOutTime}`).toISOString()
                        : null,
                    }))
                  ).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Gross Pay:</div>
                <div className="text-lg font-semibold">
                  $
                  {(
                    calculateEmployeeHours(
                      timesheets.map((ts) => ({
                        clock_in: new Date(`${ts.clockInDate}T${ts.clockInTime}`).toISOString(),
                        clock_out: ts.clockOutTime
                          ? new Date(`${ts.clockOutDate}T${ts.clockOutTime}`).toISOString()
                          : null,
                      }))
                    ) *
                    (payRate || 0)
                  ).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || timesheets.length === 0}>
            {saving ? (
              <>
                <Spinner className="h-4 w-4 mr-2" />
                Saving...
              </>
            ) : (
              'Save & Review'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
