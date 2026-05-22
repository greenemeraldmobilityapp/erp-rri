import { ReactNode } from 'react'
import Link from 'next/link'
import { Home, Package, Users, Building2, UserCircle, BookOpen, FileText, FolderTree, Briefcase, Users2, Search, ShoppingCart, Landmark, Receipt, ReceiptText, BookOpenCheck, TrendingUp, TrendingDown, PieChart, Banknote, Bot, ScanLine, Lightbulb, MessageSquare, Clock, DollarSign, FileSearch, ShieldCheck, ClipboardList } from 'lucide-react'
import { GlobalSearch } from '@/components/global-search'

const menuItems = [
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
    { href: '/dashboard/ai/negosiasi-assistant', label: 'Negosiasi', icon: MessageSquare },
  ]},
  { label: 'HR', icon: Users2, children: [
    { href: '/dashboard/absensi', label: 'Absensi', icon: Clock },
    { href: '/dashboard/penggajian', label: 'Penggajian', icon: DollarSign },
  ]},
  { label: 'System', icon: ShieldCheck, children: [
    { href: '/dashboard/audit-log', label: 'Audit Trail', icon: ClipboardList },
  ]},
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex w-64 flex-col border-r bg-card">
        <div className="p-4 border-b space-y-3">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <span className="text-xl font-heading font-bold text-primary">ERP RRI</span>
          </Link>
          <GlobalSearch />
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {menuItems.map((item) => {
            if ('children' in item && item.children) {
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <item.icon className="h-3.5 w-3.5 mr-2" />
                    {item.label}
                  </div>
                  <div className="ml-2 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="flex items-center px-3 py-2 rounded-md text-sm text-foreground/80 hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                      >
                        <child.icon className="h-4 w-4 mr-3 text-muted-foreground" />
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )
            }
            return (
              <Link
                key={item.href}
                href={item.href!}
                className="flex items-center px-3 py-2 rounded-md text-sm text-foreground/80 hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
              >
                <item.icon className="h-4 w-4 mr-3 text-muted-foreground" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
      <main className="flex-1">
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
