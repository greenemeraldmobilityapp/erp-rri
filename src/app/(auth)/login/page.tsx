"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/db/client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Eye, EyeOff, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const loginSchema = z.object({
  email: z.string().email({ message: 'Email tidak valid' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter' }),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showSkeleton, setShowSkeleton] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true)
    setShowSkeleton(true)
    setError(null)

    // Set minimum loading time
    const timer = setTimeout(() => {
      setShowSkeleton(false)
    }, 800) // 800ms minimum loading time

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authError) {
        setError(authError.message === 'Invalid login credentials'
          ? 'Email atau password salah'
          : authError.message
        )
        return
      }

      router.push('/dashboard')
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      clearTimeout(timer)
      setLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-lg sm:border sm:shadow-sm">
      <CardHeader className="space-y-1 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center lg:hidden">
            <LogIn className="h-4 w-4 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-heading font-bold">Masuk</CardTitle>
        </div>
        <CardDescription>
          Masukkan email dan password untuk mengakses dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showSkeleton ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20"
              >
                {error}
              </div>
            )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="nama@email.com"
              autoComplete="email"
              autoFocus
              {...register('email')}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-sm font-medium text-destructive" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password')}
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                tabIndex={-1}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm font-medium text-destructive" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

            <Button type="submit" disabled={loading || showSkeleton} className="w-full" size="lg">
              Masuk
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex-col space-y-3">
        {!showSkeleton && (
          <div className="text-sm text-muted-foreground text-center w-full">
            Belum punya akun?{' '}
            <Link href="/register" className="text-accent font-medium hover:underline underline-offset-4">
              Daftar disini
            </Link>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
