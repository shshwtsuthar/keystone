'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Clock } from 'lucide-react'
import { type EmployeeEarnings } from '@/app/actions/payroll'
import { TimesheetReviewDialog } from './timesheet-review-dialog'

interface Employee {
  id: string
  full_name: string
  pay_rate: number | null
}

interface StepReviewTimesheetsProps {
  employees: Employee[]
  payPeriodStart: Date
  payPeriodEnd: Date
  reviewedEmployees: Map<string, EmployeeEarnings>
  onEmployeeReviewed: (employeeId: string, earnings: EmployeeEarnings) => void
}

export const StepReviewTimesheets = ({
  employees,
  payPeriodStart,
  payPeriodEnd,
  reviewedEmployees,
  onEmployeeReviewed,
}: StepReviewTimesheetsProps) => {
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  const handleReviewClick = (employee: Employee) => {
    setSelectedEmployee(employee)
    setReviewDialogOpen(true)
  }

  const handleSaveReview = (hours: number, total: number) => {
    if (!selectedEmployee) return

    const earnings: EmployeeEarnings = {
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.full_name,
      hours,
      rate: selectedEmployee.pay_rate || 0,
      description: 'Regular hours',
      total,
    }

    onEmployeeReviewed(selectedEmployee.id, earnings)
    setReviewDialogOpen(false)
    setSelectedEmployee(null)
  }

  if (employees.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No active employees found.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Review Timesheets</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Click "Review" to fetch all clock-in/clock-out timesheets for each employee within the selected date range, calculate total hours worked, and compute gross earnings (hours × pay rate).
        </p>
      </div>

      <div className="space-y-3">
        {employees.map((employee) => {
          const reviewed = reviewedEmployees.has(employee.id)
          const earnings = reviewedEmployees.get(employee.id)

          return (
            <Card key={employee.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{employee.full_name}</CardTitle>
                    <CardDescription>
                      {employee.pay_rate
                        ? `$${employee.pay_rate.toFixed(2)}/hr`
                        : 'No pay rate set'}
                    </CardDescription>
                  </div>
                  {reviewed ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm font-medium">Reviewed</span>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleReviewClick(employee)}
                      size="sm"
                    >
                      Review
                    </Button>
                  )}
                </div>
              </CardHeader>
              {reviewed && earnings && (
                <CardContent>
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span>
                      {employee.full_name} worked {earnings.hours} hours
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <div>Hours: {earnings.hours}</div>
                    <div>Rate: ${earnings.rate.toFixed(2)}/hr</div>
                    <div className="font-semibold text-foreground">
                      Total: ${earnings.total.toFixed(2)}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {selectedEmployee && (
        <TimesheetReviewDialog
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          employeeId={selectedEmployee.id}
          employeeName={selectedEmployee.full_name}
          payRate={selectedEmployee.pay_rate}
          payPeriodStart={payPeriodStart}
          payPeriodEnd={payPeriodEnd}
          onSave={handleSaveReview}
        />
      )}
    </div>
  )
}

