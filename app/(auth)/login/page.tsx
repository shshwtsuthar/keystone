'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { signIn } from '@/app/actions/auth'
import { LoginForm } from '@/components/login-form'
import { FloatingPaths } from '@/components/kokonutui/background-paths'

function LoginPageContent() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(searchParams.get('message') || null)
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsPending(true)

    const formData = new FormData(e.currentTarget)
    
    try {
      const result = await signIn(
        formData.get('email') as string,
        formData.get('password') as string
      )

      if (result?.error) {
        setError(result.error)
        setIsPending(false)
      }
      // If no error, redirect will happen (redirect() throws a special error in Next.js)
    } catch (err: any) {
      // Next.js redirect() throws a special error - don't catch it, let it propagate
      // Only catch actual errors
      if (err?.digest && !err.digest.startsWith('NEXT_REDIRECT')) {
        setError(err?.message || 'An unexpected error occurred')
        setIsPending(false)
      }
      // Re-throw redirect errors
      throw err
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10 border-r border-border">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <Image
              src="/illustrations/keystone.png"
              alt="Keystone"
              width={24}
              height={24}
              className="h-6 w-6"
            />
            Keystone
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm
              onSubmit={handleSubmit}
              error={error}
              successMessage={successMessage}
              isPending={isPending}
            />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block overflow-hidden">
        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center">
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}
