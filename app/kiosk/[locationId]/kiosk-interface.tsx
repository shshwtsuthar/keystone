'use client'

import { useState, useEffect } from 'react'
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { verifyEmployeePin, getEmployeeStatus, performClockAction } from '@/app/actions/kiosk'
import { toast } from 'sonner'
import { LogIn, LogOut, Coffee, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

type KioskState = 'idle' | 'pin' | 'action' | 'success'

interface Employee {
  id: string
  full_name: string
}

interface KioskInterfaceProps {
  locationId: string
  locationName: string
  organizationId: string
  employees: Employee[]
}

export function KioskInterface({
  locationId,
  locationName,
  organizationId,
  employees,
}: KioskInterfaceProps) {
  const router = useRouter()
  const [state, setState] = useState<KioskState>('idle')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [pin, setPin] = useState('')
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Reset to idle after success
  useEffect(() => {
    if (state === 'success') {
      const timer = setTimeout(() => {
        setState('idle')
        setSelectedEmployee(null)
        setPin('')
        setIsClockedIn(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [state])

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee)
    setState('pin')
    setPin('')
  }

  const handlePinComplete = async (value: string) => {
    if (!selectedEmployee) return

    setIsLoading(true)
    const result = await verifyEmployeePin(selectedEmployee.id, value)

    if (!result.success) {
      toast.error(result.error || 'Invalid PIN')
      setPin('')
      setIsLoading(false)
      return
    }

    // Get employee status
    const statusResult = await getEmployeeStatus(selectedEmployee.id)
    if (statusResult.error) {
      toast.error(statusResult.error)
      setIsLoading(false)
      return
    }

    setIsClockedIn(statusResult.isClockedIn || false)
    setState('action')
    setIsLoading(false)
  }

  const handleClockAction = async (action: 'in' | 'out') => {
    if (!selectedEmployee) return

    setIsLoading(true)
    const result = await performClockAction(selectedEmployee.id, locationId, action)

    if (!result.success) {
      toast.error(result.error || 'Failed to perform action')
      setIsLoading(false)
      return
    }

    toast.success(
      action === 'in'
        ? 'Clocked in successfully! Have a great shift!'
        : 'Clocked out successfully! See you later!'
    )
    setState('success')
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/locations')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-center">{locationName}</h1>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">
              {state === 'idle' && 'Find Your Name'}
              {state === 'pin' && `Hello, ${selectedEmployee?.full_name}`}
              {state === 'action' && 'Clock In/Out'}
              {state === 'success' && 'Success!'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {state === 'idle' && (
              <div className="space-y-4">
                <Command className="rounded-lg border shadow-md">
                  <CommandInput placeholder="Search your name..." />
                  <CommandList>
                    <CommandEmpty>No employee found.</CommandEmpty>
                    {employees.map((employee) => (
                      <CommandItem
                        key={employee.id}
                        value={employee.full_name}
                        onSelect={() => handleEmployeeSelect(employee)}
                        className="cursor-pointer"
                      >
                        {employee.full_name}
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </div>
            )}

            {state === 'pin' && (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    Enter your 4-digit PIN
                  </p>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={4}
                      value={pin}
                      onChange={setPin}
                      onComplete={handlePinComplete}
                      disabled={isLoading}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setState('idle')
                    setSelectedEmployee(null)
                    setPin('')
                  }}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            )}

            {state === 'action' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    size="lg"
                    className="h-24 text-lg"
                    variant={isClockedIn ? 'outline' : 'default'}
                    disabled={isClockedIn || isLoading}
                    onClick={() => handleClockAction('in')}
                  >
                    <LogIn className="h-6 w-6 mr-2" />
                    Clock In
                  </Button>
                  <Button
                    size="lg"
                    className="h-24 text-lg"
                    variant={isClockedIn ? 'destructive' : 'outline'}
                    disabled={!isClockedIn || isLoading}
                    onClick={() => handleClockAction('out')}
                  >
                    <LogOut className="h-6 w-6 mr-2" />
                    Clock Out
                  </Button>
                </div>
                <Button
                  size="lg"
                  className="w-full h-16 text-base"
                  variant="outline"
                  disabled={true}
                >
                  <Coffee className="h-5 w-5 mr-2" />
                  Take Break (Coming Soon)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setState('idle')
                    setSelectedEmployee(null)
                    setPin('')
                    setIsClockedIn(false)
                  }}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            )}

            {state === 'success' && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✓</div>
                <p className="text-lg text-muted-foreground">
                  Action completed successfully!
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Returning to search...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

