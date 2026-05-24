'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  Home, Package, Users, Building2, UserCircle, BookOpen, FileText, FolderTree, Briefcase, Users2,
  Search, ShoppingCart, Landmark, Receipt, ReceiptText, BookOpenCheck, TrendingUp, TrendingDown,
  PieChart, Banknote, Bot, ScanLine, Lightbulb, MessageSquare, Clock, DollarSign, ShieldCheck, Store, AlertTriangle, ListOrdered,
  ClipboardList, Bell, Sun, Moon, LucideIcon,
} from 'lucide-react'
import { useTheme } from '@/components/theme/theme-provider'
import { PanduanButton } from '@/components/onboarding/panduan-button'
import { cn } from '@/lib/utils'

interface MenuLink {
  href: string
  label: string
  icon: LucideIcon
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
  { label: 'Master Data', icon: FolderTree, children: [
    { href: '/dashboard/master/barang', label: 'Barang', icon: Package },
    { href: '/dashboard/master/supplier', label: 'Supplier', icon: Building2 },
    { href: '/dashboard/master/customer', label: 'Customer', icon: Users },
    { href: '/dashboard/master/pic-customer', label: 'PIC Customer', icon: UserCircle },
    { href: '/dashboard/master/coa', label: 'Chart of Accounts', icon: BookOpen },
    { href: '/dashboard/master/kontrak', label: 'Kontrak', icon: FileText },
    { href: '/dashboard/master/kategori-barang', label: 'Kategori Barang', icon: FolderTree },
    { href: '/dashboard/master/jabatan', label: 'Jabatan', icon: Briefcase },
    { href: '/dashboard/master/karyawan', label: 'Karyawan', icon: Users2 },
  ]},
  { label: 'Pre-Sales', icon: Search, children: [
    { href: '/dashboard/rfq', label: 'RFQ', icon: FileText },
    { href: '/dashboard/quotation', label: 'Quotation', icon: FileText },
    { href: '/dashboard/negoiasi', label: 'Negosiasi', icon: FileText },
  ]},
  { label: 'Sales', icon: ShoppingCart, children: [
    { href: '/dashboard/customer-po', label: 'Customer PO', icon: FileText },
    { href: '/dashboard/sales-order', label: 'Sales Order', icon: FileText },
    { href: '/dashboard/di', label: 'Delivery Instr.', icon: FileText },
    { href: '/dashboard/delivery-order', label: 'Delivery Order', icon: FileText },
    { href: '/dashboard/retur-penjualan', label: 'Retur Penjualan', icon: FileText },
  ]},
  { label: 'Procurement', icon: Package, children: [
    { href: '/dashboard/purchase-request', label: 'Purchase Request', icon: FileText },
    { href: '/dashboard/purchase-order', label: 'Purchase Order', icon: FileText },
    { href: '/dashboard/purchase-receiving', label: 'Penerimaan', icon: FileText },
    { href: '/dashboard/grn', label: 'GRN', icon: FileText },
    { href: '/dashboard/retur-pembelian', label: 'Retur Pembelian', icon: FileText },
  ]},
  { label: 'Inventory', icon: Package, children: [
    { href: '/dashboard/inventory/gudang', label: 'Gudang', icon: Building2 },
    { href: '/dashboard/inventory/stok', label: 'Stok', icon: Package },
    { href: '/dashboard/inventory/stok/masuk', label: 'Stok Masuk', icon: TrendingUp },
    { href: '/dashboard/inventory/stok/keluar', label: 'Stok Keluar', icon: TrendingDown },
  ]},
  { label: 'Finance', icon: Landmark, children: [
    { href: '/dashboard/invoice', label: 'Invoice', icon: ReceiptText },
    { href: '/dashboard/kwitansi', label: 'Kwitansi', icon: Receipt },
    { href: '/dashboard/faktur-pajak', label: 'Faktur Pajak', icon: FileText },
    { href: '/dashboard/jurnal', label: 'Jurnal Umum', icon: BookOpenCheck },
  ]},
  { label: 'Laporan', icon: PieChart, children: [
    { href: '/dashboard/laporan/ar-aging', label: 'AR Aging', icon: TrendingUp },
    { href: '/dashboard/laporan/ap-aging', label: 'AP Aging', icon: TrendingDown },
    { href: '/dashboard/laporan/laba-rugi', label: 'Laba / Rugi', icon: Banknote },
    { href: '/dashboard/laporan/neraca', label: 'Neraca', icon: PieChart },
    { href: '/dashboard/laporan/arus-kas', label: 'Arus Kas', icon: TrendingUp },
  ]},
  { label: 'AI Agent', icon: Bot, children: [
    { href: '/dashboard/ai/search-harga', label: 'Search Harga', icon: Search },
    { href: '/dashboard/ai/ocr-kontrak', label: 'OCR Kontrak', icon: ScanLine },
    { href: '/dashboard/ai/rekomendasi-harga', label: 'Rekomendasi Harga', icon: Lightbulb },
    { href: '/dashboard/ai/rekomendasi-supplier', label: 'Rekomendasi Supplier', icon: Store },
    { href: '/dashboard/ai/negosiasi-assistant', label: 'Negosiasi', icon: MessageSquare },
    { href: '/dashboard/ai/auto-suggest-barang', label: 'Auto-Suggest Barang', icon: ListOrdered },
    { href: '/dashboard/ai/price-trend', label: 'Price Trend', icon: TrendingUp },
    { href: '/dashboard/ai/anomaly-detection', label: 'Anomaly Detection', icon: AlertTriangle },
  ]},
  { label: 'HR', icon: Users2, children: [
    { href: '/dashboard/absensi', label: 'Absensi', icon: Clock },
    { href: '/dashboard/penggajian', label: 'Penggajian', icon: DollarSign },
  ]},
  { label: 'System', icon: ShieldCheck, children: [
    { href: '/dashboard/audit-log', label: 'Audit Trail', icon: ClipboardList },
    { href: '/dashboard/notifikasi', label: 'Notifikasi', icon: Bell },
  ]},
]

function isActive(href: string, pathname: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname.startsWith(href)
}

function groupHasActive(group: MenuGroup, pathname: string): boolean {
  return group.children.some(child => isActive(child.href, pathname))
}

function SidebarNavLink({ href, icon: Icon, label, collapsed }: { href: string; icon: LucideIcon; label: string; collapsed?: boolean }) {
  const pathname = usePathname()
  const active = isActive(href, pathname)
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center px-3 py-2 rounded-md text-sm transition-colors duration-200',
        active
          ? 'bg-accent font-medium text-foreground'
          : 'text-foreground/80 hover:bg-accent hover:text-accent-foreground',
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0', collapsed ? '' : 'mr-3')} />
      {!collapsed && label}
    </Link>
  )
}

export function SidebarContent({ collapsed }: { collapsed?: boolean }) {
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()

  return (
    <>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {menuItems.map((item) => {
          if (isGroup(item)) {
            const expanded = groupHasActive(item, pathname)
            return <SidebarGroup key={item.label} group={item} defaultOpen={expanded} collapsed={collapsed} />
          }
          return <SidebarNavLink key={item.href} href={item.href} icon={item.icon} label={item.label} collapsed={collapsed} />
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
          {theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
        </button>
      </div>
    </>
  )
}

function SidebarGroup({ group, defaultOpen, collapsed }: { group: MenuGroup; defaultOpen: boolean; collapsed?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)

  if (collapsed) {
    return (
      <div className="space-y-1">
        {group.children.map(child => (
          <SidebarNavLink key={child.href} href={child.href} icon={child.icon} label={child.label} collapsed />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
      >
        <group.icon className="h-3.5 w-3.5 mr-2 shrink-0" />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="ml-2 space-y-1 overflow-hidden">
          {group.children.map((child) => (
            <SidebarNavLink key={child.href} href={child.href} icon={child.icon} label={child.label} />
          ))}
        </div>
      )}
    </div>
  )
}
