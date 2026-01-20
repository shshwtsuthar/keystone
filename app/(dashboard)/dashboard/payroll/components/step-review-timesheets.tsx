'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'
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

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Review Timesheets</CardTitle>
        <CardDescription>
          Click "Review" to fetch all clock-in/clock-out timesheets for each employee within the selected date range, calculate total hours worked, and compute gross earnings (hours × pay rate).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {employees.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No active employees found.
          </div>
        ) : (
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
                        <Button
                          disabled
                          size="sm"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Reviewed
                        </Button>
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
                </Card>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>

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
  </>
  )
}

