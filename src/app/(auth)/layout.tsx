import { ReactNode } from 'react'
import { Building2, ShieldCheck, HeadphonesIcon } from 'lucide-react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary to-accent/80 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative flex flex-col justify-between p-12 w-full">
          <div>
            <div className="flex items-center gap-3 mb-16">
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-heading font-bold text-white">ERP RRI</h1>
                <p className="text-sm text-white/70">Enterprise Resource Planning</p>
              </div>
            </div>
            <div className="space-y-8">
              <h2 className="text-4xl font-heading font-bold text-white leading-tight">
                Kelola Bisnis Anda<br />
                <span className="text-white/80">Dalam Satu Platform</span>
              </h2>
              <p className="text-lg text-white/70 max-w-md leading-relaxed">
                Sistem ERP terintegrasi untuk PT. Rizki Ridho Ilahi — 
                mengelola sales, procurement, inventory, finance, dan HR 
                secara real-time.
              </p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Aman & Terpercaya</p>
                <p className="text-xs text-white/60">Data bisnis Anda terlindungi</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center">
                <HeadphonesIcon className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Dukungan 24/7</p>
                <p className="text-xs text-white/60">Tim siap membantu kapanpun</p>
              </div>
            </div>
            <p className="text-xs text-white/40 pt-4 border-t border-white/10">
              &copy; 2026 PT. Rizki Ridho Ilahi. All rights reserved.
            </p>
          </div>
        </div>
      </div>
      {/* Form Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
