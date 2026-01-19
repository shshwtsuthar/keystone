'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { updateOrganization } from '@/app/actions/settings'
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
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const organizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(100, 'Name is too long'),
})

type OrganizationFormValues = z.infer<typeof organizationSchema>

interface OrganizationSettingsProps {
  initialName: string
}

export const OrganizationSettings = ({
  initialName,
}: OrganizationSettingsProps) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: initialName,
    },
  })

  const handleSubmit = async (values: OrganizationFormValues) => {
    setIsLoading(true)
    try {
      const result = await updateOrganization(values.name)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Organization updated successfully')
        router.refresh()
      }
    } catch (error) {
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
              <FormLabel>Organization Name</FormLabel>
              <FormControl>
                <Input placeholder="My Organization" {...field} />
              </FormControl>
              <FormDescription>
                The name of your organization as it appears throughout the application
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </Form>
  )
}

