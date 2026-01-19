'use client'

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useDropzone } from 'react-dropzone'
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
import { X, Upload, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const organizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(100, 'Name is too long'),
  employerBusinessName: z.string().max(200, 'Business name is too long').optional().or(z.literal('')),
  abn: z
    .string()
    .regex(/^(\d{2}\s?\d{3}\s?\d{3}\s?\d{3}|\d{11})$/, 'ABN must be 11 digits (format: XX XXX XXX XXX)')
    .optional()
    .or(z.literal('')),
})

type OrganizationFormValues = z.infer<typeof organizationSchema>

interface OrganizationSettingsProps {
  initialName: string
  initialCompanyLogoUrl?: string | null
  initialEmployerBusinessName?: string | null
  initialAbn?: string | null
}

export const OrganizationSettings = ({
  initialName,
  initialCompanyLogoUrl,
  initialEmployerBusinessName,
  initialAbn,
}: OrganizationSettingsProps) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(initialCompanyLogoUrl || null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [removeLogo, setRemoveLogo] = useState(false)

  // Format ABN for display (XX XXX XXX XXX)
  const formatAbn = (value: string) => {
    const digits = value.replace(/\s+/g, '')
    if (digits.length <= 2) return digits
    if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`
    if (digits.length <= 8) return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 11)}`
  }

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: initialName,
      employerBusinessName: initialEmployerBusinessName || '',
      abn: initialAbn ? formatAbn(initialAbn) : '',
    },
  })

  const handleFileAccept = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }

      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        toast.error('File size must be less than 5MB')
        return
      }

      setSelectedFile(file)
      setRemoveLogo(false)

      // Create preview
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
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
  })

  const handleRemoveLogo = () => {
    setSelectedFile(null)
    setLogoPreview(null)
    setRemoveLogo(true)
  }

  const handleSubmit = async (values: OrganizationFormValues) => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', values.name)
      formData.append('employerBusinessName', values.employerBusinessName || '')
      formData.append('abn', values.abn || '')
      
      if (selectedFile) {
        formData.append('companyLogo', selectedFile)
      }
      
      if (removeLogo) {
        formData.append('removeLogo', 'true')
      }

      const result = await updateOrganization(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Organization updated successfully')
        setSelectedFile(null)
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
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Company Logo Upload - First */}
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

        {/* Organization Name - Second */}
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

        {/* Legal Business Name - Third */}
        <FormField
          control={form.control}
          name="employerBusinessName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Legal Business Name</FormLabel>
              <FormControl>
                <Input placeholder="Your Business Name" {...field} />
              </FormControl>
              <FormDescription>
                The legal business name for employer records and documentation
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ABN - Fourth */}
        <FormField
          control={form.control}
          name="abn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ABN (Australian Business Number)</FormLabel>
              <FormControl>
                <Input
                  placeholder="XX XXX XXX XXX"
                  {...field}
                  onChange={(e) => {
                    const formatted = formatAbn(e.target.value)
                    field.onChange(formatted)
                  }}
                  maxLength={14}
                />
              </FormControl>
              <FormDescription>
                Your 11-digit Australian Business Number (format: XX XXX XXX XXX)
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

