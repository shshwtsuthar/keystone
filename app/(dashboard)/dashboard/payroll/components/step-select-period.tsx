'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DateRange } from 'react-day-picker'

interface StepSelectPeriodProps {
  payPeriodStart: Date | undefined
  payPeriodEnd: Date | undefined
  paymentDate: Date
  onPeriodChange: (start: Date | undefined, end: Date | undefined) => void
  onPaymentDateChange: (date: Date) => void
}

export const StepSelectPeriod = ({
  payPeriodStart,
  payPeriodEnd,
  paymentDate,
  onPeriodChange,
  onPaymentDateChange,
}: StepSelectPeriodProps) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    payPeriodStart && payPeriodEnd
      ? { from: payPeriodStart, to: payPeriodEnd }
      : undefined
  )
  const [paymentDateOpen, setPaymentDateOpen] = useState(false)

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range)
    onPeriodChange(range?.from, range?.to)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Pay Period</CardTitle>
          <CardDescription>
            Choose the start and end dates for this pay period
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Pay Period</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dateRange && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'LLL dd, y')} -{' '}
                        {format(dateRange.to, 'LLL dd, y')}
                      </>
                    ) : (
                      format(dateRange.from, 'LLL dd, y')
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={handleDateRangeSelect}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Payment Date</Label>
            <Popover open={paymentDateOpen} onOpenChange={setPaymentDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !paymentDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {paymentDate ? (
                    format(paymentDate, 'LLL dd, y')
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={paymentDate}
                  onSelect={(date) => {
                    if (date) {
                      onPaymentDateChange(date)
                      setPaymentDateOpen(false)
                    }
                  }}
                  defaultMonth={paymentDate}
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              The date when employees will receive payment
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

