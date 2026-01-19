'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { StepSelectPeriod } from './step-select-period'
import { StepReviewTimesheets } from './step-review-timesheets'
import { StepTaxSuper } from './step-tax-super'
import { StepFinalize } from './step-finalize'
import { getActiveEmployees, type EmployeeEarnings, type EmployeeDeductions } from '@/app/actions/payroll'
import { toast } from 'sonner'

const TOTAL_STEPS = 4

export const NewPayRunWizard = () => {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [employees, setEmployees] = useState<Array<{ id: string; full_name: string; pay_rate: number | null }>>([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)

  // Wizard data state
  const [payPeriodStart, setPayPeriodStart] = useState<Date | undefined>(undefined)
  const [payPeriodEnd, setPayPeriodEnd] = useState<Date | undefined>(undefined)
  const [paymentDate, setPaymentDate] = useState<Date>(new Date())
  const [reviewedEmployees, setReviewedEmployees] = useState<Map<string, EmployeeEarnings>>(new Map())
  const [deductions, setDeductions] = useState<Map<string, EmployeeDeductions>>(new Map())

  // Load employees when dialog opens
  useEffect(() => {
    if (open && employees.length === 0) {
      loadEmployees()
    }
  }, [open])

  const loadEmployees = async () => {
    setLoadingEmployees(true)
    try {
      const { employees: empList, error } = await getActiveEmployees()
      if (error) {
        toast.error(error)
      } else {
        setEmployees(empList || [])
      }
    } catch (error) {
      toast.error('Failed to load employees')
    } finally {
      setLoadingEmployees(false)
    }
  }

  const handlePeriodChange = (start: Date | undefined, end: Date | undefined) => {
    setPayPeriodStart(start)
    setPayPeriodEnd(end)
  }

  const handleEmployeeReviewed = (employeeId: string, earnings: EmployeeEarnings) => {
    setReviewedEmployees((prev) => {
      const newMap = new Map(prev)
      newMap.set(employeeId, earnings)
      return newMap
    })
  }

  const handleDeductionsChange = (employeeId: string, deduction: EmployeeDeductions) => {
    setDeductions((prev) => {
      const newMap = new Map(prev)
      newMap.set(employeeId, deduction)
      return newMap
    })
  }

  const handleNext = () => {
    // Validation
    if (currentStep === 1) {
      if (!payPeriodStart || !payPeriodEnd) {
        toast.error('Please select a pay period')
        return
      }
      if (payPeriodEnd < payPeriodStart) {
        toast.error('End date must be after start date')
        return
      }
    } else if (currentStep === 2) {
      if (reviewedEmployees.size === 0) {
        toast.error('Please review at least one employee')
        return
      }
    } else if (currentStep === 3) {
      // Check all reviewed employees have deductions
      const missingDeductions = Array.from(reviewedEmployees.keys()).filter(
        (id) => !deductions.has(id)
      )
      if (missingDeductions.length > 0) {
        toast.error('Please complete tax and superannuation for all employees')
        return
      }
    }

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    // Reset wizard state
    setCurrentStep(1)
    setPayPeriodStart(undefined)
    setPayPeriodEnd(undefined)
    setPaymentDate(new Date())
    setReviewedEmployees(new Map())
    setDeductions(new Map())
    setOpen(false)
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      // Reset on close
      setCurrentStep(1)
      setPayPeriodStart(undefined)
      setPayPeriodEnd(undefined)
      setPaymentDate(new Date())
      setReviewedEmployees(new Map())
      setDeductions(new Map())
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepSelectPeriod
            payPeriodStart={payPeriodStart}
            payPeriodEnd={payPeriodEnd}
            paymentDate={paymentDate}
            onPeriodChange={handlePeriodChange}
            onPaymentDateChange={setPaymentDate}
          />
        )
      case 2:
        if (!payPeriodStart || !payPeriodEnd) {
          return (
            <div className="text-center py-8 text-muted-foreground">
              Please complete step 1 first.
            </div>
          )
        }
        return (
          <StepReviewTimesheets
            employees={employees}
            payPeriodStart={payPeriodStart}
            payPeriodEnd={payPeriodEnd}
            reviewedEmployees={reviewedEmployees}
            onEmployeeReviewed={handleEmployeeReviewed}
          />
        )
      case 3:
        if (!payPeriodStart || !payPeriodEnd) {
          return (
            <div className="text-center py-8 text-muted-foreground">
              Please complete previous steps first.
            </div>
          )
        }
        return (
          <StepTaxSuper
            reviewedEmployees={reviewedEmployees}
            deductions={deductions}
            onDeductionsChange={handleDeductionsChange}
          />
        )
      case 4:
        if (!payPeriodStart || !payPeriodEnd) {
          return (
            <div className="text-center py-8 text-muted-foreground">
              Please complete previous steps first.
            </div>
          )
        }
        return (
          <StepFinalize
            payPeriodStart={payPeriodStart}
            payPeriodEnd={payPeriodEnd}
            paymentDate={paymentDate}
            reviewedEmployees={reviewedEmployees}
            deductions={deductions}
            onComplete={handleComplete}
          />
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Pay Run
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Pay Run</DialogTitle>
          <DialogDescription>
            Step {currentStep} of {TOTAL_STEPS}
          </DialogDescription>
        </DialogHeader>

        {/* Step Content */}
        <div className="min-h-[400px]">{renderStep()}</div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          {currentStep < TOTAL_STEPS ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

