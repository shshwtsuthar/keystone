'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createLocation, updateLocation } from '@/app/actions/locations'
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
import { Textarea } from '@/components/ui/textarea'
import { TimezoneSelect } from '@/components/ui/timezone-select'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const locationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().optional(),
  timezone: z.string().min(1, 'Timezone is required'),
})

type LocationFormValues = z.infer<typeof locationSchema>

interface LocationFormProps {
  location?: {
    id: string
    name: string
    address: string | null
    timezone: string
  }
  onSuccess?: () => void
}

export function LocationForm({ location, onSuccess }: LocationFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: location?.name || '',
      address: location?.address || '',
      timezone: location?.timezone || 'America/New_York',
    },
  })

  const handleSubmit = async (values: LocationFormValues) => {
    setIsLoading(true)
    try {
      if (location) {
        const result = await updateLocation(
          location.id,
          values.name,
          values.address || null,
          values.timezone
        )
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('Location updated successfully')
          onSuccess?.()
          router.refresh()
        }
      } else {
        const result = await createLocation(
          values.name,
          values.address || null,
          values.timezone
        )
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('Location created successfully')
          form.reset()
          onSuccess?.()
          router.refresh()
        }
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location Name</FormLabel>
              <FormControl>
                <Input placeholder="Downtown Branch" {...field} />
              </FormControl>
              <FormDescription>
                A descriptive name for this location
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="123 Main St, City, State 12345"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Physical address of this location
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timezone</FormLabel>
              <FormControl>
                <TimezoneSelect
                  value={field.value}
                  onValueChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                Timezone for this location (used for accurate time tracking)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading
            ? 'Saving...'
            : location
              ? 'Update Location'
              : 'Create Location'}
        </Button>
      </form>
    </Form>
  )
}

