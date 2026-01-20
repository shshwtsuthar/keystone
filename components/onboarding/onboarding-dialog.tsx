'use client'

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { X, Upload, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { TimezoneSelect } from '@/components/ui/timezone-select'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTheme } from '@/hooks/use-theme'
import { type Theme } from '@/components/providers/theme-provider'
import { cn } from '@/lib/utils'
import {
  saveOnboardingMasterPin,
  saveOnboardingCompanyDetails,
  saveOnboardingTimezone,
  saveOnboardingTheme,
} from '@/app/actions/onboarding'

const masterPinSchema = z.object({
  masterPin: z.string().length(4, 'Master PIN must be exactly 4 digits'),
})

const companyDetailsSchema = z.object({
  employerBusinessName: z.string().max(200, 'Business name is too long').optional().or(z.literal('')),
  abn: z
    .string()
    .regex(/^(\d{2}\s?\d{3}\s?\d{3}\s?\d{3}|\d{11})$/, 'ABN must be 11 digits (format: XX XXX XXX XXX)')
    .optional()
    .or(z.literal('')),
  superannuationDefaultRate: z
    .string()
    .optional()
    .refine(
      (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 100),
      'Superannuation rate must be between 0 and 100'
    )
    .or(z.literal('')),
})

const timezoneSchema = z.object({
  timezone: z.string().min(1, 'Timezone is required'),
})

const themeSchema = z.object({
  theme: z.enum(['light', 'blue', 'yellow', 'orange', 'red', 'green', 'violet']),
})

type MasterPinFormValues = z.infer<typeof masterPinSchema>
type CompanyDetailsFormValues = z.infer<typeof companyDetailsSchema>
type TimezoneFormValues = z.infer<typeof timezoneSchema>
type ThemeFormValues = z.infer<typeof themeSchema>

interface OnboardingDialogProps {
  open: boolean
  userRole: 'owner' | 'manager'
  onClose?: () => void
}

export const OnboardingDialog = ({ open, userRole, onClose }: OnboardingDialogProps) => {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const masterPinForm = useForm<MasterPinFormValues>({
    resolver: zodResolver(masterPinSchema),
    defaultValues: {
      masterPin: '',
    },
  })

  const companyDetailsForm = useForm<CompanyDetailsFormValues>({
    resolver: zodResolver(companyDetailsSchema),
    defaultValues: {
      employerBusinessName: '',
      abn: '',
      superannuationDefaultRate: '',
    },
  })

  const timezoneForm = useForm<TimezoneFormValues>({
    resolver: zodResolver(timezoneSchema),
    defaultValues: {
      timezone: 'America/New_York',
    },
  })

  const themeForm = useForm<ThemeFormValues>({
    resolver: zodResolver(themeSchema),
    defaultValues: {
      theme: (theme as Theme) || 'light',
    },
  })

  // Format ABN for display (XX XXX XXX XXX)
  const formatAbn = (value: string) => {
    const digits = value.replace(/\s+/g, '')
    if (digits.length <= 2) return digits
    if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`
    if (digits.length <= 8) return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 11)}`
  }

  const handleFileAccept = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }

      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        toast.error('File size must be less than 5MB')
        return
      }

      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleFileReject = useCallback(() => {
    toast.error('Invalid file. Please upload an image file (JPG, PNG, GIF, WebP) under 5MB')
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileAccept,
    onDropRejected: handleFileReject,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  })

  const handleRemoveLogo = () => {
    setSelectedFile(null)
    setLogoPreview(null)
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      setCurrentStep(2)
      return
    }

    if (currentStep === 2) {
      const isValid = await masterPinForm.trigger()
      if (!isValid) return

      setIsLoading(true)
      try {
        const values = masterPinForm.getValues()
        const result = await saveOnboardingMasterPin(values.masterPin)
        if (result.error) {
          toast.error(result.error)
          return
        }
        // Skip step 3 (company details) for non-owners
        setCurrentStep(userRole === 'owner' ? 3 : 4)
      } catch (error) {
        toast.error('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
      return
    }

    if (currentStep === 3) {
      // Company details - optional, can skip
      if (userRole === 'owner') {
        const isValid = await companyDetailsForm.trigger()
        if (isValid) {
          setIsLoading(true)
          try {
            const values = companyDetailsForm.getValues()
            const formData = new FormData()
            formData.append('name', 'My Organization') // Default name
            formData.append('employerBusinessName', values.employerBusinessName || '')
            formData.append('abn', values.abn || '')
            formData.append('superannuationDefaultRate', values.superannuationDefaultRate || '')
            
            if (selectedFile) {
              formData.append('companyLogo', selectedFile)
            }

            const result = await saveOnboardingCompanyDetails(formData)
            if (result.error) {
              toast.error(result.error)
              setIsLoading(false)
              return
            }
          } catch (error) {
            toast.error('An unexpected error occurred')
            setIsLoading(false)
            return
          } finally {
            setIsLoading(false)
          }
        }
      }
      // For non-owners, skip company details step
      setCurrentStep(4)
      return
    }

    if (currentStep === 4) {
      const isValid = await timezoneForm.trigger()
      if (!isValid) return

      setIsLoading(true)
      try {
        const values = timezoneForm.getValues()
        const result = await saveOnboardingTimezone(values.timezone)
        if (result.error) {
          toast.error(result.error)
          return
        }
        setCurrentStep(5)
      } catch (error) {
        toast.error('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
      return
    }

    if (currentStep === 5) {
      const isValid = await themeForm.trigger()
      if (!isValid) return

      setIsLoading(true)
      try {
        const values = themeForm.getValues()
        const result = await saveOnboardingTheme(values.theme)
        if (result.error) {
          toast.error(result.error)
          return
        }
        setTheme(values.theme)
        setCurrentStep(6)
      } catch (error) {
        toast.error('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
      return
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    if (currentStep === 3) {
      setCurrentStep(4)
    }
  }

  const handleComplete = () => {
    if (onClose) {
      onClose()
    }
    // Force a full page reload to ensure server components re-fetch data
    window.location.reload()
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="flex items-center justify-center">
              <img
                src="/illustrations/onboarding_eye.png"
                alt="Onboarding illustration"
                className="max-w-56 w-full h-auto"
              />
            </div>
            <div className="text-center">
              <p className="text-base text-muted-foreground leading-relaxed">
                Hi business owner, welcome to Keystone! I'm Shashwat, and I'll take you through the initial setup so that your business can reach new heights!
              </p>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="flex flex-col items-center justify-center space-y-6 min-h-full">
            <Form {...masterPinForm}>
              <form className="space-y-6">
                <FormField
                  control={masterPinForm.control}
                  name="masterPin"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-center space-y-4">
                      <FormLabel className="text-lg font-medium">Master Key</FormLabel>
                      <FormControl>
                        <div className="flex items-center justify-center">
                          <InputOTP
                            maxLength={4}
                            value={field.value}
                            onChange={field.onChange}
                            containerClassName="justify-center"
                          >
                            <InputOTPGroup>
                              <InputOTPSlot index={0} className="h-16 w-16 text-2xl" />
                              <InputOTPSlot index={1} className="h-16 w-16 text-2xl" />
                              <InputOTPSlot index={2} className="h-16 w-16 text-2xl" />
                              <InputOTPSlot index={3} className="h-16 w-16 text-2xl" />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
            <div className="space-y-4 text-center">
              <p className="text-base text-muted-foreground leading-relaxed">
                First, let's get you set up with your Master Key. You will require this key to exit Kiosk mode. Don't forget this key or you will get locked into it! You can reset this key through the{' '}
                <span
                  className="text-primary underline cursor-not-allowed opacity-50"
                  onClick={(e) => e.preventDefault()}
                  onKeyDown={(e) => e.preventDefault()}
                >
                  Settings
                </span>
                {' '}page.
              </p>
            </div>
          </div>
        )

      case 3:
        if (userRole !== 'owner') {
          // Skip company details for non-owners
          return null
        }
        return (
          <div className="space-y-6">
            <Form {...companyDetailsForm}>
              <form className="space-y-6">
                {/* Company Logo Upload */}
                <FormItem>
                  <FormLabel>Company Logo</FormLabel>
                  <div className="space-y-4">
                    {logoPreview ? (
                      <div className="relative inline-block">
                        <img
                          src={logoPreview}
                          alt="Company logo preview"
                          className="h-32 w-32 object-contain rounded-md border border-border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                          onClick={handleRemoveLogo}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <FormControl>
                        <div
                          {...getRootProps()}
                          className={cn(
                            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                            isDragActive
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50 hover:bg-accent/50'
                          )}
                        >
                          <input {...getInputProps()} />
                          <div className="flex flex-col items-center justify-center gap-4">
                            <div className="rounded-full bg-muted p-4">
                              {isDragActive ? (
                                <Upload className="h-8 w-8 text-primary" />
                              ) : (
                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                              )}
                            </div>
                            <div className="space-y-1">
                              {isDragActive ? (
                                <p className="text-sm font-medium text-primary">
                                  Drop the image here...
                                </p>
                              ) : (
                                <>
                                  <p className="text-sm font-medium">
                                    Click to upload or drag and drop
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    PNG, JPG, GIF, WebP up to 5MB
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </FormControl>
                    )}
                    <FormDescription>
                      Upload your company logo. Maximum file size: 5MB. Supported formats: JPG, PNG, GIF, WebP.
                    </FormDescription>
                  </div>
                </FormItem>

                {/* Legal Business Name */}
                <FormField
                  control={companyDetailsForm.control}
                  name="employerBusinessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Legal Business Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Business Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ABN */}
                <FormField
                  control={companyDetailsForm.control}
                  name="abn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ABN (Australian Business Number)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="1234567890"
                          {...field}
                          onChange={(e) => {
                            const formatted = formatAbn(e.target.value)
                            field.onChange(formatted)
                          }}
                          maxLength={14}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Superannuation Default Rate */}
                <FormField
                  control={companyDetailsForm.control}
                  name="superannuationDefaultRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Superannuation Default Rate</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="10.50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <Form {...timezoneForm}>
              <form className="space-y-6">
                <FormField
                  control={timezoneForm.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select your timezone</FormLabel>
                      <FormControl>
                        <TimezoneSelect
                          value={field.value}
                          onValueChange={field.onChange}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <Form {...themeForm}>
              <form className="space-y-6">
                <FormField
                  control={themeForm.control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select your theme</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value)
                          // Immediately apply the theme when selected
                          setTheme(value as Theme)
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a theme" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="blue">Blue</SelectItem>
                          <SelectItem value="yellow">Yellow</SelectItem>
                          <SelectItem value="orange">Orange</SelectItem>
                          <SelectItem value="red">Red</SelectItem>
                          <SelectItem value="green">Green</SelectItem>
                          <SelectItem value="violet">Violet</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        )

      case 6:
        return (
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="flex items-center justify-center">
              <img
                src="/illustrations/onboarding_completed.png"
                alt="Onboarding completed illustration"
                className="max-w-56 w-full h-auto"
              />
            </div>
            <div className="text-center">
              <p className="text-base text-muted-foreground leading-relaxed">
                You're all set! You can change these settings through the{' '}
                <Link
                  href="/dashboard/settings"
                  className="text-primary underline hover:no-underline"
                >
                  Settings
                </Link>{' '}
                page anytime you want.
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const totalSteps = 6
  const canGoNext = currentStep < totalSteps
  const canGoPrevious = currentStep > 1
  const showSkip = currentStep === 3 && userRole === 'owner'

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'Welcome to Keystone'
      case 2:
        return 'Master Key'
      case 3:
        return 'Company Details'
      case 4:
        return 'Timezone'
      case 5:
        return 'Appearance'
      case 6:
        return "You're All Set"
      default:
        return 'Welcome to Keystone'
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-2xl select-none"
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{getStepTitle()}</DialogTitle>
          <DialogDescription>
            Step {currentStep} of {totalSteps}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {renderStepContent()}
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 py-4">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={cn(
                'h-2 w-2 rounded-full transition-colors',
                index + 1 <= currentStep
                  ? 'bg-primary'
                  : 'bg-muted'
              )}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            {canGoPrevious && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={isLoading}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}
            {showSkip && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleSkip}
                disabled={isLoading}
              >
                Skip
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canGoNext ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Next'}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleComplete}
                disabled={isLoading}
              >
                Get Started
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

