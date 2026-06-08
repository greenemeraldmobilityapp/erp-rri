import { ReactNode } from 'react'
import { Building2, ShieldCheck, HeadphonesIcon, BarChart3, LayoutDashboard, Package, TrendingUp } from 'lucide-react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#3B82F6] via-[#2563EB] to-[#0A0E27] relative overflow-hidden">
        {/* Enhanced mesh gradient overlay */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -top-1/3 -left-1/4 w-1/2 h-1/2 rounded-full bg-[#60A5FA] blur-[120px] animate-mesh-shift" />
          <div className="absolute top-1/3 left-1/3 w-1/3 h-1/3 rounded-full bg-[#93C5FD] blur-[100px] animate-mesh-shift" style={{ animationDelay: '-7s', animationDuration: '25s' }} />
          <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-[#818CF8] blur-[120px] animate-mesh-shift" style={{ animationDelay: '-14s' }} />
        </div>
        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <div className="relative flex flex-col justify-between p-12 w-full z-10">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-12">
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-heading font-bold text-white">ERP RRI</h1>
                <p className="text-sm text-white/70">Enterprise Resource Planning</p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-medium text-white/90">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Platform ERP Enterprise
            </div>

            <div className="space-y-2 mt-6">
              <h2 className="text-4xl font-heading font-bold text-white leading-tight">
                Kelola Bisnis Anda
              </h2>
              <h2 className="text-4xl font-heading font-bold text-white/80">
                Dalam Satu Platform
              </h2>
            </div>
          </div>

          {/* Value proposition cards */}
          <div className="grid grid-cols-1 gap-3 my-12">
            {[
              { icon: LayoutDashboard, label: 'Sales & Procurement', desc: 'Kelola penjualan & pembelian terpadu' },
              { icon: Package, label: 'Inventory & Warehouse', desc: 'Pantau stok barang real-time' },
              { icon: BarChart3, label: 'Finance & HR', desc: 'Integrasi akuntansi & data karyawan' },
            ].map((item, i) => (
              <div
                key={item.label}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 transition-all duration-200 hover:bg-white/10 hover:-translate-y-0.5"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <item.icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-white/60">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Trust signals */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-3">
              {[
                { icon: ShieldCheck, label: 'Aman & Terpercaya', sub: 'Enkripsi end-to-end', color: 'text-green-400' },
                { icon: TrendingUp, label: 'Real-time Analytics', sub: 'Laporan & dashboard interaktif', color: 'text-blue-400' },
                { icon: HeadphonesIcon, label: 'Dukungan 24/7', sub: 'Tim siap membantu kapanpun', color: 'text-blue-400' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 group transition-all duration-200 hover:-translate-y-0.5">
                  <div className="h-9 w-9 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-white/60">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-white/40 pt-4 border-t border-white/10">
              &copy; 2026 PT. Rizki Ridho Ilahi. All rights reserved.
            </p>
          </div>
        </div>
      </div>
      {/* Form Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-fade-in-up">
          {children}
        </div>
      </div>
    </div>
  )
}
