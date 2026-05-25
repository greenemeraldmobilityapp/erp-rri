"use client"

import { useState } from 'react'
import Image from 'next/image'
// import Link from 'next/link' // Used in JSX
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/db/client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Mail, Lock, ShieldCheck } from 'lucide-react'
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

// Shimmer animation + dot pattern + floating particles
const shimmerStyle = `
  .shimmer {
    background: linear-gradient(90deg, bg-white/10 0%, bg-white/20 20%, bg-white/10 40%, bg-white/10 100%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  .dot-pattern {
    background-image: radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px);
    background-size: 24px 24px;
  }

  .float-1 {
    animation: floatUpDown 6s ease-in-out infinite;
  }
  .float-2 {
    animation: floatUpDown 8s ease-in-out infinite reverse;
  }
  .float-3 {
    animation: floatUpDown 7s ease-in-out infinite 2s;
  }

  @keyframes floatUpDown {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }

  .glow-pulse {
    animation: glowPulse 4s ease-in-out infinite;
  }
  @keyframes glowPulse {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.1); }
  }
`

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showSkeleton, setShowSkeleton] = useState(false)
  const mounted = true // Remove mounted state to avoid setState in useEffect

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
     <>
       <style jsx global>{shimmerStyle}</style>
        <div className="min-h-screen bg-gradient-to-br from-[#0000FF] via-[#0000D9] to-[#0A0E27] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Dot pattern overlay */}
        <div className="absolute inset-0 dot-pattern pointer-events-none" />

        {/* Decorative elements */}
        {mounted && (
          <>
            {/* Large radial glow behind card */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0000FF]/20 rounded-full blur-[120px] glow-pulse pointer-events-none" />

            {/* Floating shapes */}
            <div className="absolute top-16 left-16 w-20 h-20 border border-[#A1A1AA]/20 rounded-full float-1 pointer-events-none" />
            <div className="absolute top-1/4 right-20 w-3 h-3 bg-[#A1A1AA]/30 rounded-full float-2 pointer-events-none" />
            <div className="absolute bottom-1/3 left-1/5 w-4 h-4 bg-[#A1A1AA]/20 rounded-full float-3 pointer-events-none" />
            <div className="absolute bottom-20 right-1/4 w-16 h-16 border border-[#A1A1AA]/10 rounded-lg rotate-45 float-2 pointer-events-none" />
            <div className="absolute top-2/3 right-12 w-2 h-2 bg-[#A1A1AA]/40 rounded-full float-1 pointer-events-none" />
            <div className="absolute top-1/3 left-12 w-1 h-1 bg-white/30 rounded-full float-3 pointer-events-none" />
          </>
        )}
       
         {/* Luxury header */}
         <div className="absolute top-8 left-0 right-0 flex justify-center">
           <div className="flex items-center gap-3 bg-card/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-border/50">
             <img
               src="/logo/logo-rri-bg-transparan.png"
               alt="RRI"
               className="h-8 w-auto"
             />
             <span className="text-xl font-heading font-bold text-primary">ERP RRI</span>
           </div>
         </div>
       
       {/* Login card */}
        <Card className="w-full max-w-md border-l-4 border-l-[#A1A1AA] bg-card/70 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)]">
         <CardHeader className="space-y-3 pb-6 text-center">
            <div className="flex justify-center mb-4">
                <div className="p-3 bg-accent/10 rounded-full">
                  <Image
                    src="/logo/logo-rri-bg-transparan.png"
                    alt="Logo"
                    className="h-16 w-auto"
                    width={64}
                    height={64}
                  />
                </div>
            </div>
            <CardTitle className="text-3xl font-heading font-bold text-primary tracking-tight">Selamat Datang</CardTitle>
            <CardDescription className="text-muted-foreground">
              Masukkan kredensial untuk mengakses dashboard profesional
            </CardDescription>
         </CardHeader>
         <CardContent>
           {showSkeleton ? (
             <div className="space-y-5">
               <div className="space-y-2">
                 <Skeleton className="h-4 w-20 shimmer" />
                 <Skeleton className="h-12 w-full rounded-lg shimmer" />
               </div>
               <div className="space-y-2">
                 <Skeleton className="h-4 w-24 shimmer" />
                 <Skeleton className="h-12 w-full rounded-lg shimmer" />
               </div>
               <Skeleton className="h-12 w-full rounded-lg shimmer" />
             </div>
           ) : (
             <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
               {error && (
                 <div
                   role="alert"
                   className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20 flex items-center gap-2"
                 >
                   <ShieldCheck className="h-4 w-4" />
                   {error}
                 </div>
               )}

           <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
             <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@perusahaan.com"
                  autoComplete="email"
                  autoFocus
                  {...register('email')}
                  aria-invalid={!!errors.email}
                  className="h-12 pl-10 rounded-lg border border-border bg-muted/50 hover:border-accent/50 focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Mail className="h-5 w-5" />
                </div>
             </div>
             {errors.email && (
               <p className="text-sm font-medium text-destructive flex items-center gap-1" role="alert">
                 <ShieldCheck className="h-3 w-3" /> {errors.email.message}
               </p>
             )}
           </div>

           <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</Label>
             <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  {...register('password')}
                  aria-invalid={!!errors.password}
                  className="h-12 pl-10 rounded-lg border border-border bg-muted/50 hover:border-accent/50 focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Lock className="h-5 w-5" />
                </div>
               <button
                 type="button"
                 onClick={() => setShowPassword(!showPassword)}
                 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                 tabIndex={-1}
                 aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
               >
                 {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
               </button>
             </div>
             {errors.password && (
               <p className="text-sm font-medium text-destructive flex items-center gap-1" role="alert">
                 <ShieldCheck className="h-3 w-3" /> {errors.password.message}
               </p>
             )}
           </div>

               <Button
                 type="submit"
                 disabled={loading || showSkeleton}
                  className="w-full h-12 text-base font-semibold text-white rounded-lg bg-gradient-to-b from-[#0000FF] to-[#0000D9] shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_1px_2px_rgba(0,0,0,0.1)] hover:opacity-95 transition-all duration-200"
               >
                {loading ? 'Memproses...' : 'Masuk'}
              </Button>
           </form>
         )}
       </CardContent>
        <CardFooter className="flex-col space-y-4 pt-2">
          {!showSkeleton && (
            <>
              <div className="text-sm text-muted-foreground text-center w-full flex items-center justify-center gap-1">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                Sistem terlindungi dengan enkripsi end-to-end
              </div>
              <div className="text-xs text-muted-foreground/60 text-center">
                Sistem ERP LPP RRI — Terintegrasi & Aman
              </div>
            </>
          )}
        </CardFooter>
     </Card>
    </div>
       </>
    )
}
