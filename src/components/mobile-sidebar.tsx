'use client'

import Link from 'next/link'
import { Menu } from 'lucide-react'
import { GlobalSearch } from '@/components/global-search'
import { SidebarContent } from '@/components/sidebar-content'
import { Button } from '@/components/ui/button'
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

export function MobileSidebar() {
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
        </SheetContent>
      </Sheet>
      <Link href="/dashboard" className="text-lg font-heading font-bold text-primary">
        ERP RRI
      </Link>
    </div>
  )
}
