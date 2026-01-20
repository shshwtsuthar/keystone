'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { updatePassword, verifyPassword, updateMasterPin } from '@/app/actions/settings'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type PasswordFormValues = z.infer<typeof passwordSchema>

export const SecuritySettings = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [showMasterPinDialog, setShowMasterPinDialog] = useState(false)
  const [passwordVerified, setPasswordVerified] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [masterPin, setMasterPin] = useState('')
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false)
  const [isUpdatingPin, setIsUpdatingPin] = useState(false)

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const handleSubmit = async (values: PasswordFormValues) => {
    setIsLoading(true)
    try {
      const result = await updatePassword(
        values.currentPassword,
        values.newPassword
      )
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Password updated successfully')
        form.reset()
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetMasterPin = () => {
    setShowMasterPinDialog(true)
    setPasswordVerified(false)
    setPasswordInput('')
    setMasterPin('')
  }

  const handleVerifyPassword = async () => {
    if (!passwordInput) {
      toast.error('Please enter your password')
      return
    }

    setIsVerifyingPassword(true)
    try {
      const result = await verifyPassword(passwordInput)
      if (result.error) {
        toast.error(result.error)
      } else {
        setPasswordVerified(true)
        toast.success('Password verified')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsVerifyingPassword(false)
    }
  }

  const handleSetMasterPin = async () => {
    if (masterPin.length !== 4) {
      toast.error('Master PIN must be exactly 4 digits')
      return
    }

    setIsUpdatingPin(true)
    try {
      const result = await updateMasterPin(masterPin)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Master PIN updated successfully')
        setShowMasterPinDialog(false)
        setPasswordVerified(false)
        setPasswordInput('')
        setMasterPin('')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsUpdatingPin(false)
    }
  }

  const handleCloseDialog = () => {
    setShowMasterPinDialog(false)
    setPasswordVerified(false)
    setPasswordInput('')
    setMasterPin('')
  }

  return (
    <>
      <div className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>Update Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your current password"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter your current password to verify your identity
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your new password"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Must be at least 8 characters with uppercase, lowercase, and a number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirm your new password"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Re-enter your new password to confirm
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Password'}
                </Button>
              </CardContent>
            </Card>
          </form>
        </Form>

        <Card>
          <CardHeader>
            <CardTitle>Master Pin</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              onClick={handleResetMasterPin}
            >
              Reset Master Pin
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showMasterPinDialog} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Master Pin</DialogTitle>
            <DialogDescription>
              {passwordVerified
                ? 'Enter your new 4-digit master PIN'
                : 'Enter your current password to continue'}
            </DialogDescription>
          </DialogHeader>

          {!passwordVerified ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Password</label>
                <Input
                  type="password"
                  placeholder="Enter your current password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleVerifyPassword()
                    }
                  }}
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleVerifyPassword}
                  disabled={isVerifyingPassword || !passwordInput}
                >
                  {isVerifyingPassword ? 'Verifying...' : 'Verify Password'}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center space-y-4 py-4">
                <InputOTP
                  maxLength={4}
                  value={masterPin}
                  onChange={setMasterPin}
                  disabled={isUpdatingPin}
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
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  disabled={isUpdatingPin}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSetMasterPin}
                  disabled={isUpdatingPin || masterPin.length !== 4}
                >
                  {isUpdatingPin ? 'Setting...' : 'Set Master Pin'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

