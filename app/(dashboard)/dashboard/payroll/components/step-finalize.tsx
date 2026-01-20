'use client'

import { useState, useImperativeHandle, forwardRef } from 'react'
import { format } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  createPayRun,
  getPayslipData,
  type EmployeeEarnings,
  type EmployeeDeductions,
} from '@/app/actions/payroll'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface StepFinalizeProps {
  payPeriodStart: Date
  payPeriodEnd: Date
  paymentDate: Date
  reviewedEmployees: Map<string, EmployeeEarnings>
  deductions: Map<string, EmployeeDeductions>
  onComplete: () => void
}

export interface StepFinalizeRef {
  handleGeneratePayslips: () => Promise<void>
  isSubmitting: boolean
}

export const StepFinalize = forwardRef<StepFinalizeRef, StepFinalizeProps>(({
  payPeriodStart,
  payPeriodEnd,
  paymentDate,
  reviewedEmployees,
  deductions,
  onComplete,
}, ref) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  useImperativeHandle(ref, () => ({
    handleGeneratePayslips,
    isSubmitting,
  }))

  const handleGeneratePayslips = async () => {
    setIsSubmitting(true)

    try {
      const earnings = Array.from(reviewedEmployees.values())
      const deductionsArray = Array.from(deductions.values())

      const payRunData = {
        payPeriodStart: payPeriodStart.toISOString(),
        payPeriodEnd: payPeriodEnd.toISOString(),
        paymentDate: paymentDate.toISOString(),
        earnings,
        deductions: deductionsArray,
      }

      const result = await createPayRun(payRunData)

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (!result.payRunId) {
        toast.error('Pay run created but no ID returned')
        return
      }

      toast.success('Pay run created successfully! Generating payslips...')

      // Generate PDFs for all employees
      const employeeIds = Array.from(reviewedEmployees.keys())
      let successCount = 0
      let errorCount = 0

      for (const employeeId of employeeIds) {
        try {
          // Fetch payslip data
          const payslipResult = await getPayslipData(result.payRunId, employeeId)

          if (payslipResult.error || !payslipResult.data) {
            console.error(`Failed to get payslip data for employee ${employeeId}:`, payslipResult.error)
            errorCount++
            continue
          }

          // Generate PDF via API
          const response = await fetch('/api/generate-payslip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: payslipResult.data }),
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          // Download PDF
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `payslip-${payslipResult.data.employeeName.replace(/\s+/g, '-')}.pdf`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)

          successCount++
        } catch (error) {
          console.error(`Failed to generate PDF for employee ${employeeId}:`, error)
          errorCount++
        }
      }

      if (successCount > 0) {
        toast.success(
          `Pay run created! ${successCount} payslip${successCount > 1 ? 's' : ''} generated${errorCount > 0 ? ` (${errorCount} failed)` : ''}`
        )
      } else {
        toast.error('Pay run created but failed to generate payslips')
      }

      onComplete()
      router.refresh()
    } catch (error) {
      toast.error('Failed to create pay run')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalGross = Array.from(reviewedEmployees.values()).reduce(
    (sum, e) => sum + e.total,
    0
  )
  const totalTax = Array.from(deductions.values()).reduce(
    (sum, d) => sum + d.taxWithheld,
    0
  )
  const totalSuper = Array.from(deductions.values()).reduce(
    (sum, d) => sum + d.superannuation,
    0
  )
  const totalNet = Array.from(deductions.values()).reduce(
    (sum, d) => sum + d.netPay,
    0
  )

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Finalize Pay Run</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Review the summary and generate payslips
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pay Run Summary</CardTitle>
          <CardDescription>
            Period: {format(payPeriodStart, 'MMM d')} - {format(payPeriodEnd, 'MMM d, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment Date:</span>
              <span className="font-medium">{format(paymentDate, 'MMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Employees:</span>
              <span className="font-medium">{reviewedEmployees.size}</span>
            </div>
          </div>

          <div className="pt-4 border-t space-y-2">
            {Array.from(reviewedEmployees.values()).map((earning) => {
              const deduction = deductions.get(earning.employeeId)
              if (!deduction) return null

              return (
                <Card key={earning.employeeId} className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="font-semibold">{earning.employeeName}</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Gross Pay:</span>
                          <span className="ml-2 font-medium">${earning.total.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tax Withheld:</span>
                          <span className="ml-2 font-medium">
                            ${deduction.taxWithheld.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Superannuation:</span>
                          <span className="ml-2 font-medium">
                            ${deduction.superannuation.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Net Pay:</span>
                          <span className="ml-2 font-semibold">
                            ${deduction.netPay.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between text-base">
              <span className="font-semibold">Total Gross Pay:</span>
              <span className="font-semibold">${totalGross.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Total Tax Withheld:</span>
              <span>${totalTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Total Superannuation:</span>
              <span>${totalSuper.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold pt-2 border-t">
              <span>Total Net Pay:</span>
              <span>${totalNet.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

