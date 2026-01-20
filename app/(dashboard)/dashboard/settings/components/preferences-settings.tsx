'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { updatePreferences } from '@/app/actions/settings'
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
import { TimezoneSelect } from '@/components/ui/timezone-select'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const preferencesSchema = z.object({
  timezone: z.string().min(1, 'Timezone is required'),
})

type PreferencesFormValues = z.infer<typeof preferencesSchema>

interface PreferencesSettingsProps {
  initialTimezone: string
}

export const PreferencesSettings = ({
  initialTimezone,
}: PreferencesSettingsProps) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      timezone: initialTimezone,
    },
  })

  const handleSubmit = async (values: PreferencesFormValues) => {
    setIsLoading(true)
    try {
      const result = await updatePreferences({
        timezone: values.timezone,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Preferences updated successfully')
        router.refresh()
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
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
                  Your preferred timezone for viewing times and dates
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </Form>
  )
}

