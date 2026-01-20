'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { verifyEmployeePin, getEmployeeStatus, performClockAction, verifyMasterPin } from '@/app/actions/kiosk'
import { useKioskLockdown } from '@/hooks/use-kiosk-lockdown'
import { toast } from 'sonner'
import { LogIn, LogOut, Coffee, CheckCircle2 } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

type KioskState = 'idle' | 'pin' | 'action' | 'success'

interface Employee {
  id: string
  full_name: string
}

interface KioskInterfaceProps {
  locationId: string
  locationName: string
  organizationId: string
  organizationName: string
  companyLogoUrl: string | null
  employees: Employee[]
}

export const KioskInterface = ({
  locationId,
  locationName,
  organizationName,
  companyLogoUrl,
  employees,
}: KioskInterfaceProps) => {
  const router = useRouter()
  const [state, setState] = useState<KioskState>('idle')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [pin, setPin] = useState('')
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [masterPin, setMasterPin] = useState('')
  const [isVerifyingMasterPin, setIsVerifyingMasterPin] = useState(false)
  const [allowExit, setAllowExit] = useState(false)
  
  // Track clicks for exit kiosk
  const clickCountRef = useRef(0)
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Apply kiosk lockdown - prevent all navigation except via master PIN
  useKioskLockdown(allowExit)

  // Reset to idle after success
  useEffect(() => {
    if (state === 'success') {
      const timer = setTimeout(() => {
        setState('idle')
        setSelectedEmployee(null)
        setPin('')
        setIsClockedIn(false)
        setSearchQuery('')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [state])

  // Filter employees based on search query (case-insensitive)
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) {
      return []
    }
    const query = searchQuery.toLowerCase().trim()
    return employees.filter((employee) =>
      employee.full_name.toLowerCase().includes(query)
    )
  }, [employees, searchQuery])

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee)
    setState('pin')
    setPin('')
    setSearchQuery('')
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

  const handleCancel = () => {
    setState('idle')
    setSelectedEmployee(null)
    setPin('')
    setIsClockedIn(false)
    setSearchQuery('')
  }

  const handleLogoClick = () => {
    // Clear existing timer
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
    }

    // Increment click count
    clickCountRef.current += 1

    // If 5 clicks reached, show exit dialog
    if (clickCountRef.current >= 5) {
      setShowExitDialog(true)
      clickCountRef.current = 0
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current)
      }
      return
    }

    // Reset click count after 2 seconds of no clicks
    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0
    }, 2000)
  }

  const handleMasterPinComplete = async (value: string) => {
    if (value.length !== 4) return

    setIsVerifyingMasterPin(true)
    try {
      const result = await verifyMasterPin(value)
      if (!result.success) {
        toast.error(result.error || 'Invalid Master PIN')
        setMasterPin('')
        setIsVerifyingMasterPin(false)
        return
      }

      // Set flag to allow exit before redirecting
      setAllowExit(true)
      toast.success('Exiting kiosk mode...')
      
      // Small delay to ensure state updates
      setTimeout(() => {
        router.push('/dashboard')
      }, 100)
    } catch {
      toast.error('An unexpected error occurred')
      setIsVerifyingMasterPin(false)
    }
  }

  const handleCloseExitDialog = () => {
    setShowExitDialog(false)
    setMasterPin('')
    clickCountRef.current = 0
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-zinc-50 to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-800 flex items-center justify-center p-4 sm:p-6 select-none cursor-default">
      <div className="w-full max-w-2xl space-y-8">
        {/* Location Header - Only shown in idle state */}
        {state === 'idle' && (
          <div className="text-center space-y-4">
            {companyLogoUrl ? (
              <div className="flex flex-col items-center space-y-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={companyLogoUrl}
                  alt={organizationName}
                  className="h-28 w-auto max-w-sm object-contain"
                  onClick={handleLogoClick}
                />
                <p className="text-sm text-muted-foreground">
                  Employee Time Clock
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <h1
                  className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight"
                  onClick={handleLogoClick}
                >
                  {organizationName || locationName}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Employee Time Clock
                </p>
              </div>
            )}
          </div>
        )}

        {/* PIN Entry Header - Only shown in pin state */}
        {state === 'pin' && (
          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Hello, {selectedEmployee?.full_name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your 4-digit PIN
            </p>
          </div>
        )}

        {/* Search State */}
        {state === 'idle' && (
          <div className="w-full">
            <Command 
              className="rounded-lg border shadow-lg bg-background"
              shouldFilter={false}
            >
              <CommandInput 
                placeholder="Type your name to search..." 
                value={searchQuery}
                onValueChange={setSearchQuery}
                autoFocus
                className="h-14 text-base"
              />
              {searchQuery.trim() && (
                <CommandList className="max-h-[300px]">
                  <CommandEmpty>
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No employee found matching &quot;{searchQuery}&quot;
                    </div>
                  </CommandEmpty>
                  {filteredEmployees.map((employee) => (
                    <CommandItem
                      key={employee.id}
                      value={employee.full_name}
                      onSelect={() => handleEmployeeSelect(employee)}
                      className="cursor-pointer py-3 text-base aria-selected:bg-accent aria-selected:text-accent-foreground"
                    >
                      {employee.full_name}
                    </CommandItem>
                  ))}
                </CommandList>
              )}
            </Command>
          </div>
        )}

        {/* PIN Entry State */}
        {state === 'pin' && (
          <div className="w-full space-y-8">
            <div className="flex justify-center">
              <InputOTP
                maxLength={4}
                value={pin}
                onChange={setPin}
                onComplete={handlePinComplete}
                disabled={isLoading}
                autoFocus
                containerClassName="gap-4"
              >
                <InputOTPGroup>
                  <InputOTPSlot 
                    index={0} 
                    className="!h-20 !w-20 !text-3xl !font-bold !border-2 first:!border-l last:!border-r"
                  />
                  <InputOTPSlot 
                    index={1} 
                    className="!h-20 !w-20 !text-3xl !font-bold !border-2 first:!border-l last:!border-r"
                  />
                  <InputOTPSlot 
                    index={2} 
                    className="!h-20 !w-20 !text-3xl !font-bold !border-2 first:!border-l last:!border-r"
                  />
                  <InputOTPSlot 
                    index={3} 
                    className="!h-20 !w-20 !text-3xl !font-bold !border-2 first:!border-l last:!border-r"
                  />
                </InputOTPGroup>
              </InputOTP>
            </div>
            {isLoading && (
              <div className="flex justify-center pt-2">
                <Spinner className="h-5 w-5" />
              </div>
            )}
            <div className="flex justify-center pt-6">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="w-auto px-8"
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Action Selection State */}
        {state === 'action' && (
          <div className="w-full space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-center mb-6">
              Select Action
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                size="lg"
                className="h-28 text-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                variant={isClockedIn ? 'outline' : 'default'}
                disabled={isClockedIn || isLoading}
                onClick={() => handleClockAction('in')}
              >
                <LogIn className="h-6 w-6 mr-2" />
                Clock In
              </Button>
              <Button
                size="lg"
                className="h-28 text-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
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
              onClick={handleCancel}
              className="w-full"
              disabled={isLoading}
            >
              Cancel
            </Button>
            {isLoading && (
              <div className="flex justify-center pt-2">
                <Spinner className="h-5 w-5" />
              </div>
            )}
          </div>
        )}

        {/* Success State */}
        {state === 'success' && (
          <div className="w-full text-center py-8 space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium text-foreground">
                Action completed successfully!
              </p>
              <p className="text-sm text-muted-foreground">
                Returning to search...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Exit Kiosk Dialog */}
      <Dialog open={showExitDialog} onOpenChange={handleCloseExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exit Kiosk</DialogTitle>
            <DialogDescription>
              Enter Master Key to exit Kiosk mode
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center justify-center space-y-4">
              <InputOTP
                maxLength={4}
                value={masterPin}
                onChange={setMasterPin}
                onComplete={handleMasterPinComplete}
                disabled={isVerifyingMasterPin}
                containerClassName="gap-4"
                autoFocus
              >
                <InputOTPGroup>
                  <InputOTPSlot 
                    index={0} 
                    className="!h-20 !w-20 !text-3xl !font-bold !border-2"
                  />
                  <InputOTPSlot 
                    index={1} 
                    className="!h-20 !w-20 !text-3xl !font-bold !border-2"
                  />
                  <InputOTPSlot 
                    index={2} 
                    className="!h-20 !w-20 !text-3xl !font-bold !border-2"
                  />
                  <InputOTPSlot 
                    index={3} 
                    className="!h-20 !w-20 !text-3xl !font-bold !border-2"
                  />
                </InputOTPGroup>
              </InputOTP>
            </div>
            {isVerifyingMasterPin && (
              <div className="flex justify-center">
                <Spinner className="h-5 w-5" />
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseExitDialog}
                disabled={isVerifyingMasterPin}
              >
                Cancel
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

