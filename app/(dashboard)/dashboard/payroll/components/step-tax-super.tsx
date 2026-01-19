'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getOrganizationSuperRate, type EmployeeDeductions, type EmployeeEarnings } from '@/app/actions/payroll'
import { toast } from 'sonner'

interface StepTaxSuperProps {
  reviewedEmployees: Map<string, EmployeeEarnings>
  deductions: Map<string, EmployeeDeductions>
  onDeductionsChange: (employeeId: string, deductions: EmployeeDeductions) => void
}

export const StepTaxSuper = ({
  reviewedEmployees,
  deductions,
  onDeductionsChange,
}: StepTaxSuperProps) => {
  const [defaultSuperRate, setDefaultSuperRate] = useState<number | null>(null)
  const [employeeSuperRates, setEmployeeSuperRates] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSuperRate = async () => {
      try {
        const { superRate: rate, error } = await getOrganizationSuperRate()
        if (error) {
          toast.error(error)
        } else {
          setDefaultSuperRate(rate)
          // Initialize employee super rates with default
          if (rate !== null) {
            const rates = new Map<string, number>()
            reviewedEmployees.forEach((earning) => {
              rates.set(earning.employeeId, rate)
            })
            setEmployeeSuperRates(rates)
          }
        }
      } catch (error) {
        toast.error('Failed to fetch superannuation rate')
      } finally {
        setLoading(false)
      }
    }

    fetchSuperRate()
  }, [])

  // Initialize deductions for reviewed employees when entering step 3
  useEffect(() => {
    if (defaultSuperRate !== null && reviewedEmployees.size > 0) {
      reviewedEmployees.forEach((earning) => {
        if (!deductions.has(earning.employeeId)) {
          const grossPay = earning.total
          const superRate = employeeSuperRates.get(earning.employeeId) || defaultSuperRate
          const calculatedSuper = (grossPay * superRate) / 100
          const newDeductions: EmployeeDeductions = {
            employeeId: earning.employeeId,
            grossPay,
            taxWithheld: 0,
            superannuation: calculatedSuper,
            netPay: grossPay,
          }
          onDeductionsChange(earning.employeeId, newDeductions)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultSuperRate, reviewedEmployees.size])

  const handleTaxChange = (employeeId: string, taxWithheld: number) => {
    const earnings = reviewedEmployees.get(employeeId)
    if (!earnings) return

    const grossPay = earnings.total
    const currentDeductions = deductions.get(employeeId)
    const superRate = employeeSuperRates.get(employeeId) || defaultSuperRate || 0
    const calculatedSuper = (grossPay * superRate) / 100

    const newDeductions: EmployeeDeductions = {
      employeeId,
      grossPay,
      taxWithheld,
      superannuation: calculatedSuper,
      netPay: grossPay - taxWithheld,
    }

    onDeductionsChange(employeeId, newDeductions)
  }

  const handleSuperRateChange = (employeeId: string, superRate: number) => {
    const earnings = reviewedEmployees.get(employeeId)
    if (!earnings) return

    // Update the super rate for this employee
    setEmployeeSuperRates((prev) => {
      const newMap = new Map(prev)
      newMap.set(employeeId, superRate)
      return newMap
    })

    const grossPay = earnings.total
    const currentDeductions = deductions.get(employeeId)
    const taxWithheld = currentDeductions?.taxWithheld || 0
    const calculatedSuper = (grossPay * superRate) / 100

    const newDeductions: EmployeeDeductions = {
      employeeId,
      grossPay,
      taxWithheld,
      superannuation: calculatedSuper,
      netPay: grossPay - taxWithheld,
    }

    onDeductionsChange(employeeId, newDeductions)
  }

  if (reviewedEmployees.size === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Please review timesheets in the previous step.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Tax & Superannuation</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Enter tax withheld and review superannuation for each employee
        </p>
      </div>

      <div className="space-y-4">
        {Array.from(reviewedEmployees.values()).map((earning) => {
          const deduction = deductions.get(earning.employeeId)
          const grossPay = earning.total
          const taxWithheld = deduction?.taxWithheld ?? 0
          const superRate = employeeSuperRates.get(earning.employeeId) || defaultSuperRate || 0
          const superannuation = deduction?.superannuation ?? (grossPay * superRate) / 100
          const netPay = grossPay - taxWithheld

          return (
            <Card key={earning.employeeId}>
              <CardHeader>
                <CardTitle className="text-base">{earning.employeeName}</CardTitle>
                <CardDescription>Gross Pay: ${grossPay.toFixed(2)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`tax-${earning.employeeId}`}>
                    PAYG Tax Withheld
                  </Label>
                  <Input
                    id={`tax-${earning.employeeId}`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={taxWithheld}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0
                      handleTaxChange(earning.employeeId, value)
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Please check ATO tax tables and enter tax amount.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`super-rate-${earning.employeeId}`}>
                    Superannuation Rate (%)
                  </Label>
                  <Input
                    id={`super-rate-${earning.employeeId}`}
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={superRate}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0
                      handleSuperRateChange(earning.employeeId, value)
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    {defaultSuperRate !== null
                      ? `Default: ${defaultSuperRate}% (editable for this payslip)`
                      : 'No default super rate set. Please enter manually.'}
                  </p>
                </div>

                <div className="pt-2 border-t space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Superannuation Amount:</span>
                    <span className="font-medium">${superannuation.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Net Pay:</span>
                    <span className="text-lg font-semibold">${netPay.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

