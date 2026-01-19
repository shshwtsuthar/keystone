'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createEmployee, updateEmployee } from '@/app/actions/employees'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const employeeSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  payRate: z.string().optional(),
  defaultLocationId: z.string().optional(),
})

type EmployeeFormValues = z.infer<typeof employeeSchema>

interface Location {
  id: string
  name: string
}

interface EmployeeFormProps {
  employee?: {
    id: string
    full_name: string
    pay_rate: number | null
    default_location_id: string | null
    is_active: boolean
  }
  locations: Location[]
  onSuccess?: () => void
}

export function EmployeeForm({ employee, locations, onSuccess }: EmployeeFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPinDialog, setShowPinDialog] = useState(false)
  const [generatedPin, setGeneratedPin] = useState<string | null>(null)

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      fullName: employee?.full_name || '',
      payRate: employee?.pay_rate?.toString() || '',
      defaultLocationId: employee?.default_location_id || '',
    },
  })

  const handleSubmit = async (values: EmployeeFormValues) => {
    setIsLoading(true)
    try {
      if (employee) {
        const result = await updateEmployee(
          employee.id,
          values.fullName,
          values.payRate ? parseFloat(values.payRate) : null,
          values.defaultLocationId || null,
          employee.is_active
        )
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('Employee updated successfully')
          onSuccess?.()
          router.refresh()
        }
      } else {
        const result = await createEmployee(
          values.fullName,
          values.payRate ? parseFloat(values.payRate) : null,
          values.defaultLocationId || null
        )
        if (result.error) {
          toast.error(result.error)
        } else {
          setGeneratedPin(result.pin || null)
          setShowPinDialog(true)
          form.reset()
          onSuccess?.()
          router.refresh()
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormDescription>
                  Employee's full name
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="payRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pay Rate (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="15.00"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Hourly pay rate in dollars
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="defaultLocationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default Location (Optional)</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    // Convert "__none__" to empty string for form state
                    field.onChange(value === "__none__" ? "" : value)
                  }} 
                  value={field.value || "__none__"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Default location for this employee
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading
              ? 'Saving...'
              : employee
                ? 'Update Employee'
                : 'Create Employee'}
          </Button>
        </form>
      </Form>

      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Employee PIN Generated</DialogTitle>
            <DialogDescription>
              Share this PIN with the employee. It will not be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">PIN:</p>
              <p className="text-4xl font-bold tracking-wider font-mono">
                {generatedPin}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowPinDialog(false)}
            className="w-full"
          >
            I've Saved This PIN
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}

