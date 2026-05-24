'use client'

import Link from 'next/link'
import { Menu, LogOut } from 'lucide-react'
import { GlobalSearch } from '@/components/global-search'
import { SidebarContent } from '@/components/sidebar-content'
import { Button } from '@/components/ui/button'
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { supabase } from '@/lib/db/client'
import { useRouter } from 'next/navigation'

export function MobileSidebar() {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 border-b bg-card px-4 h-14">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <SheetHeader className="border-b">
            <SheetTitle className="text-left">
              <span className="text-xl font-heading font-bold text-primary">ERP RRI</span>
            </SheetTitle>
          </SheetHeader>
       <div className="p-3 border-b">
        <GlobalSearch />
      </div>
      <SidebarContent />
      <div className="p-3 border-t space-y-2">
        <Button
          variant="ghost"
          className="flex items-center gap-2 w-full px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </Button>
      </div>
        </SheetContent>
      </Sheet>
      <Link href="/dashboard" className="text-lg font-heading font-bold text-primary">
        ERP RRI
      </Link>
    </div>
  )
}
