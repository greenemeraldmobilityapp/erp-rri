import { ReactNode } from 'react'
import Link from 'next/link'
import { GlobalSearch } from '@/components/global-search'
import { OnboardingProvider } from '@/components/onboarding/onboarding-provider'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { KeyboardShortcuts } from '@/components/keyboard/keyboard-shortcuts'
import { SidebarContent } from '@/components/sidebar-content'
import { MobileSidebar } from '@/components/mobile-sidebar'
import { AuthGuardClient } from './auth-guard-client'

export const dynamic = "force-dynamic"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <KeyboardShortcuts />
      <OnboardingProvider>
        <AuthGuardClient>
          <div className="flex min-h-screen bg-background">
            <aside className="hidden md:flex w-64 flex-col border-r bg-card">
              <div className="p-4 border-b space-y-3" data-tour="sidebar-header">
                <Link href="/dashboard" className="flex items-center space-x-3" data-tour="dashboard-link">
                  <span className="text-xl font-heading font-bold text-primary">ERP RRI</span>
                </Link>
                <div data-tour="global-search"><GlobalSearch /></div>
              </div>
              <SidebarContent />
            </aside>
            <MobileSidebar />
            <main className="flex-1 md:ml-0 mt-14 md:mt-0">
              <div className="p-4 md:p-6 max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </div>
        </AuthGuardClient>
      </OnboardingProvider>
    </ThemeProvider>
  )
}
