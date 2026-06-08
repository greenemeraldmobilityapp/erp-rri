"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, Settings, Activity, Wrench, Archive } from 'lucide-react'
import {
  Home, Package, Users, Building2, UserCircle, BookOpen,   FileText, FileSpreadsheet, FolderTree, Briefcase, Users2,
  Search, ShoppingCart, Landmark, Receipt, ReceiptText, BookOpenCheck, TrendingUp, TrendingDown,
  PieChart, Banknote, Bot, ScanLine, Lightbulb, MessageSquare, Clock, DollarSign, ShieldCheck, Store, AlertTriangle, ListOrdered, CreditCard,
  ClipboardList, ClipboardCheck, Bell, Sun, Moon, Mail, LucideIcon,
} from 'lucide-react'
import { useTheme } from '@/components/theme/theme-provider'
import { PanduanButton } from '@/components/onboarding/panduan-button'
import { useAuth } from '@/lib/hooks/use-auth'
import { cn } from '@/lib/utils'
import { MODULE_PERMISSIONS, type Role } from '@/types/role'
import { LogOut, User } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/db/client'
import { useRouter } from 'next/navigation'

interface MenuLink {
  href: string
  label: string
  icon: LucideIcon
  disabled?: boolean
}

interface MenuGroup {
  label: string
  icon: LucideIcon
  children: MenuLink[]
}

type MenuItem = MenuLink | MenuGroup

function isGroup(item: MenuItem): item is MenuGroup {
  return 'children' in item
}

const menuItems: MenuItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/email/inbox', label: 'Mail Center', icon: Mail },
  { label: 'Master Data', icon: FolderTree, children: [
    { href: '/dashboard/master/barang', label: 'Barang', icon: Package },
    { href: '/dashboard/master/kategori-barang', label: 'Kategori Barang', icon: FolderTree },
    { href: '/dashboard/dokumen', label: 'Manajemen Dokumen', icon: Archive },
    { href: '/dashboard/master/supplier', label: 'Supplier', icon: Building2 },
    { href: '/dashboard/master/customer', label: 'Customer', icon: Users },
    { href: '/dashboard/master/pic-customer', label: 'PIC Customer', icon: UserCircle },
    { href: '/dashboard/master/payment-term', label: 'Payment Term', icon: FileText },
    { href: '/dashboard/master/coa', label: 'Chart of Accounts', icon: BookOpen, disabled: true },
    { href: '/dashboard/master/jabatan', label: 'Jabatan', icon: Briefcase, disabled: true },
    { href: '/dashboard/master/karyawan', label: 'Karyawan', icon: Users2, disabled: true },
    { href: '/dashboard/tools/bulk-import', label: 'Import Excel', icon: FileSpreadsheet, disabled: true },
  ]},
  { label: 'Pre-Sales', icon: Search, children: [
    { href: '/dashboard/master/kontrak', label: 'Kontrak', icon: FileText },
    { href: '/dashboard/rfq-customer', label: 'RFQ Customer', icon: FileText },
    { href: '/dashboard/quotation', label: 'Quotation', icon: FileText },
    { href: '/dashboard/negoiasi', label: 'Negosiasi', icon: FileText },
  ]},
  { label: 'Sales', icon: ShoppingCart, children: [
    { href: '/dashboard/customer-po', label: 'Customer PO', icon: FileText },
    { href: '/dashboard/di', label: 'Delivery Instruction', icon: FileText },
    { href: '/dashboard/sales-order', label: 'Sales Order', icon: FileText },
    { href: '/dashboard/delivery-order', label: 'Delivery Order', icon: FileText },
    { href: '/dashboard/retur-penjualan', label: 'Retur Penjualan', icon: FileText },
    { href: '/dashboard/grn-customer', label: 'Retur Barang (GRN)', icon: FileText },
  ]},
  { label: 'Procurement', icon: Package, children: [
    { href: '/dashboard/rfq', label: 'RFQ Supplier', icon: FileText, disabled: true },
    { href: '/dashboard/purchase-request', label: 'Purchase Request', icon: FileText, disabled: true },
    { href: '/dashboard/purchase-order', label: 'Purchase Order', icon: FileText, disabled: true },
    { href: '/dashboard/purchase-receiving', label: 'Penerimaan', icon: FileText, disabled: true },
    { href: '/dashboard/grn', label: 'GRN', icon: FileText, disabled: true },
    { href: '/dashboard/retur-pembelian', label: 'Retur Pembelian', icon: FileText, disabled: true },
    { href: '/dashboard/procurement/supplier-payment', label: 'Pembayaran Supplier', icon: CreditCard, disabled: true },
  ]},
  { label: 'Inventory', icon: Package, children: [
    { href: '/dashboard/inventory/gudang', label: 'Gudang', icon: Building2, disabled: true },
    { href: '/dashboard/inventory/stok', label: 'Stok', icon: Package, disabled: true },
    { href: '/dashboard/inventory/stok/masuk', label: 'Stok Masuk', icon: TrendingUp, disabled: true },
    { href: '/dashboard/inventory/stok/keluar', label: 'Stok Keluar', icon: TrendingDown, disabled: true },
    { href: '/dashboard/inventory/stock-opname', label: 'Stock Opname', icon: ClipboardCheck, disabled: true },
  ]},
  { label: 'Finance', icon: Landmark, children: [
    { href: '/dashboard/invoice', label: 'Invoice', icon: ReceiptText },
    { href: '/dashboard/kwitansi', label: 'Kwitansi', icon: Receipt },
    { href: '/dashboard/jurnal', label: 'Jurnal Umum', icon: BookOpenCheck },
  ]},
  { label: 'Laporan', icon: PieChart, children: [
    { href: '/dashboard/laporan/ar-aging', label: 'AR Aging', icon: TrendingUp, disabled: true },
    { href: '/dashboard/laporan/ap-aging', label: 'AP Aging', icon: TrendingDown, disabled: true },
    { href: '/dashboard/laporan/laba-rugi', label: 'Laba / Rugi', icon: Banknote, disabled: true },
    { href: '/dashboard/laporan/ppn-masa', label: 'PPN Masa', icon: Receipt, disabled: true },
    { href: '/dashboard/laporan/neraca', label: 'Neraca', icon: PieChart, disabled: true },
    { href: '/dashboard/laporan/arus-kas', label: 'Arus Kas', icon: TrendingUp, disabled: true },
  ]},
  { label: 'AI Agent', icon: Bot, children: [
    { href: '/dashboard/ai/search-harga', label: 'Search Harga', icon: Search, disabled: true },
    { href: '/dashboard/ai/ocr-kontrak', label: 'OCR Kontrak', icon: ScanLine, disabled: true },
    { href: '/dashboard/ai/rekomendasi-harga', label: 'Rekomendasi Harga', icon: Lightbulb, disabled: true },
    { href: '/dashboard/ai/rekomendasi-supplier', label: 'Rekomendasi Supplier', icon: Store, disabled: true },
    { href: '/dashboard/ai/negosiasi-assistant', label: 'Negosiasi', icon: MessageSquare, disabled: true },
    { href: '/dashboard/ai/auto-suggest-barang', label: 'Auto-Suggest Barang', icon: ListOrdered, disabled: true },
    { href: '/dashboard/ai/price-trend', label: 'Price Trend', icon: TrendingUp, disabled: true },
    { href: '/dashboard/ai/anomaly-detection', label: 'Anomaly Detection', icon: AlertTriangle, disabled: true },
  ]},
  { label: 'HR', icon: Users2, children: [
    { href: '/dashboard/absensi', label: 'Absensi', icon: Clock, disabled: true },
    { href: '/dashboard/penggajian', label: 'Penggajian', icon: DollarSign, disabled: true },
  ]},
  { label: 'System', icon: ShieldCheck, children: [
    { href: '/dashboard/system/users', label: 'User Management', icon: Users },
    { href: '/dashboard/system/health', label: 'System Health', icon: Activity },
    { href: '/dashboard/system/maintenance', label: 'Maintenance', icon: Wrench },
    { href: '/dashboard/system/archive', label: 'Data Archive', icon: Archive },
    { href: '/dashboard/system/profile', label: 'Profil', icon: Settings },
    { href: '/dashboard/system/company', label: 'Company Profile', icon: Building2 },
    { href: '/dashboard/audit-log', label: 'Audit Trail', icon: ClipboardList },
    { href: '/dashboard/notifikasi', label: 'Notifikasi', icon: Bell },
  ]},
]

const labelToModule: Record<string, string> = {
  Dashboard: 'system',
  'Master Data': 'master',
  'Pre-Sales': 'pre-sales',
  Sales: 'sales',
  Procurement: 'procurement',
  Inventory: 'inventory',
  Finance: 'finance',
  Laporan: 'laporan',
  'AI Agent': 'ai',
  HR: 'hr',
  System: 'system',
}

function isActive(href: string, pathname: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(href + '/')
}

function groupHasActive(group: MenuGroup, pathname: string): boolean {
  return group.children.some(child => isActive(child.href, pathname))
}

function SidebarNavLink({ href, icon: Icon, label, collapsed, disabled }: { href: string; icon: LucideIcon; label: string; collapsed?: boolean; disabled?: boolean }) {
  const pathname = usePathname()
  const active = isActive(href, pathname)

  if (disabled) {
    return (
      <button
        onClick={() => toast.info(`${label} — Fitur dalam proses pengembangan`)}
        className={cn(
          'flex items-center w-full px-3 py-2 rounded-md text-sm transition-colors duration-200',
          'opacity-50 cursor-not-allowed text-foreground/80 hover:bg-accent hover:text-accent-foreground',
        )}
      >
        <Icon className={cn('h-4 w-4 shrink-0', collapsed ? '' : 'mr-3')} />
        {!collapsed && label}
      </button>
    )
  }

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center px-3 py-2 rounded-md text-sm transition-colors duration-200',
        active
          ? 'bg-primary text-primary-foreground font-medium'
          : 'text-foreground/80 hover:bg-accent hover:text-accent-foreground',
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0', collapsed ? '' : 'mr-3')} />
      {!collapsed && label}
    </Link>
  )
}

function filterMenuByRole(items: MenuItem[], role: Role): MenuItem[] {
  return items.filter((item) => {
    if (isGroup(item)) {
      const modKey = labelToModule[item.label]
      const allowed = modKey ? MODULE_PERMISSIONS[modKey] : undefined
      if (allowed && !allowed.includes(role)) return false
      const filteredChildren = item.children.filter((child) => {
        const childModKey = labelToModule[child.label] ?? modKey
        const childAllowed = childModKey ? MODULE_PERMISSIONS[childModKey] : undefined
        return !childAllowed || childAllowed.includes(role)
      })
      return filteredChildren.length > 0
    }
    return true
  })
}

export function SidebarContent({ collapsed }: { collapsed?: boolean }) {
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()
  const { user } = useAuth()
  const router = useRouter()
  const role = (user?.role as Role) ?? 'owner'
  const visibleItems = filterMenuByRole(menuItems, role)

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }, [router])

  return (
    <>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {visibleItems.map((item) => {
          if (isGroup(item)) {
            const expanded = groupHasActive(item, pathname)
            return <SidebarGroup key={item.label} group={item} defaultOpen={expanded} collapsed={collapsed} />
          }
          return <SidebarNavLink key={item.href} href={item.href} icon={item.icon} label={item.label} collapsed={collapsed} disabled={item.disabled} />
        })}
      </nav>
      <div className="p-3 border-t space-y-1">
        <PanduanButton />
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 w-full px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
          title={theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          {!collapsed && (theme === 'light' ? 'Mode Gelap' : 'Mode Terang')}
        </button>
        <Button
          variant="destructive"
          className="flex items-center gap-2 w-full px-4 py-2 rounded-lg text-sm transition-colors duration-200"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && 'Keluar'}
        </Button>
        {user && !collapsed && (
          <div className="px-4 py-2 text-sm text-muted-foreground">
            <div className="font-medium">{user.name || 'User'}</div>
            <div className="text-xs">{user.email}</div>
          </div>
        )}
      </div>
    </>
  )
}

const groupDataTour: Record<string, string> = {
  'Master Data': 'master-data',
  'Pre-Sales': 'pre-sales',
  Sales: 'sales',
  Finance: 'finance',
  System: 'system',
}

function SidebarGroup({ group, defaultOpen, collapsed }: { group: MenuGroup; defaultOpen: boolean; collapsed?: boolean }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(defaultOpen)
  const groupActive = groupHasActive(group, pathname)

  if (collapsed) {
    return (
      <div className="space-y-1">
        {group.children.map(child => (
          <SidebarNavLink key={child.href} href={child.href} icon={child.icon} label={child.label} collapsed disabled={child.disabled} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <button
        data-tour={groupDataTour[group.label]}
        onClick={() => setOpen(!open)}
        className={cn('flex items-center w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors', groupActive ? 'text-primary' : 'text-foreground/70 hover:text-foreground')}
      >
        <group.icon className="h-3.5 w-3.5 mr-2 shrink-0" />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="ml-2 space-y-1 overflow-hidden">
          {group.children.map((child) => (
            <SidebarNavLink key={child.href} href={child.href} icon={child.icon} label={child.label} disabled={child.disabled} />
          ))}
        </div>
      )}
    </div>
  )
}
