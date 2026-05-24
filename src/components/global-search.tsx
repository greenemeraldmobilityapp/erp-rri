"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, Package, Users, FileText, ShoppingCart, Truck, DollarSign, Building2, ClipboardList, BookOpen, Receipt, ArrowLeftRight, Warehouse, KanbanSquare, Landmark, Handshake, UserCheck, GitBranch, Calculator } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator } from '@/components/ui/command'

interface SearchResult { table: string; id: string; label: string; href: string }

const tableIcons: Record<string, React.ElementType> = {
  barang: Package,
  customer: Building2,
  supplier: Truck,
  karyawan: Users,
  purchase_order: ShoppingCart,
  purchase_request: ClipboardList,
  sales_order: FileText,
  customer_po: ShoppingCart,
  delivery_order: Truck,
  invoice: DollarSign,
  quotation: ClipboardList,
  rfq: BookOpen,
  di: KanbanSquare,
  grn: Warehouse,
  faktur_pajak: Receipt,
  kwitansi: Receipt,
  retur_penjualan: ArrowLeftRight,
  retur_pembelian: ArrowLeftRight,
  jurnal: BookOpen,
  negoiasi: Handshake,
  kontrak: FileText,
  absensi: UserCheck,
  coa: Landmark,
  jabatan: GitBranch,
  kategori_barang: KanbanSquare,
  gudang: Warehouse,
  customer_pic: Users,
  stock_opname: ClipboardList,
  supplier_payment: DollarSign,
  penggajian: Calculator,
}

const tableLabels: Record<string, string> = {
  barang: 'Barang',
  customer: 'Customer',
  supplier: 'Supplier',
  karyawan: 'Karyawan',
  purchase_order: 'Purchase Order',
  purchase_request: 'Purchase Request',
  sales_order: 'Sales Order',
  customer_po: 'Customer PO',
  delivery_order: 'Delivery Order',
  invoice: 'Invoice',
  quotation: 'Quotation',
  rfq: 'RFQ',
  di: 'Delivery Instruction',
  grn: 'Goods Receipt Note',
  faktur_pajak: 'Faktur Pajak',
  kwitansi: 'Kwitansi',
  retur_penjualan: 'Retur Penjualan',
  retur_pembelian: 'Retur Pembelian',
  jurnal: 'Jurnal',
  negoiasi: 'Negosiasi',
  kontrak: 'Kontrak',
  absensi: 'Absensi',
  coa: 'Chart of Account',
  jabatan: 'Jabatan',
  kategori_barang: 'Kategori Barang',
  gudang: 'Gudang',
  customer_pic: 'PIC Customer',
  stock_opname: 'Stock Opname',
  supplier_payment: 'Pembayaran Supplier',
  penggajian: 'Penggajian',
  general: 'Lainnya',
}

function groupByModule(results: SearchResult[]): Record<string, SearchResult[]> {
  const groups: Record<string, SearchResult[]> = {}
  for (const r of results) {
    const key = tableLabels[r.table] || tableLabels.general
    if (!groups[key]) groups[key] = []
    groups[key].push(r)
  }
  return groups
}

export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { 
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { 
        e.preventDefault(); 
        setOpen(true)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (!open) return
    const fetchData = async () => {
      if (!query || query.length < 2) { setResults([]); return }
      setSearching(true)
      try { 
        const r = await apiFetch<SearchResult[]>('/api/v1/search', { method: 'POST', body: JSON.stringify({ q: query }) }); 
        setResults(r.data ?? []) 
      }
      catch { setResults([]) }
      finally { setSearching(false) }
    }
    const debounce = setTimeout(fetchData, 300)
    return () => clearTimeout(debounce)
  }, [query, open])

  const handleSelect = (href: string) => {
    router.push(href)
    setOpen(false)
    setQuery('')
  }

  const groupedResults = groupByModule(results)

  return (
    <>
      <button 
        onClick={() => setOpen(true)} 
        data-search-trigger 
        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground bg-muted/30 border rounded-md hover:bg-muted/50 transition-colors"
      >
        <Search className="h-4 w-4" /><span className="flex-1 text-left">Cari...</span><kbd className="hidden sm:inline-flex text-xs px-1.5 py-0.5 bg-muted border rounded">⌘K</kbd>
      </button>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          value={query} 
          onValueChange={setQuery} 
          placeholder="Ketik untuk mencari..." 
        />
        <CommandList>
          {searching && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              Mencari...
            </div>
          )}
          {!searching && query.length >= 2 && results.length === 0 && (
            <CommandEmpty>Tidak ada hasil untuk &ldquo;{query}&rdquo;</CommandEmpty>
          )}
          {!searching && results.length > 0 && (
            <>
              {Object.entries(groupedResults).map(([module, items]) => (
                <CommandGroup key={module} heading={module} className="capitalize">
                  {items.map((item, i) => {
                    const Icon = tableIcons[item.table] || FileText
                    return (
                      <CommandItem 
                        key={`${item.id}-${i}`} 
                        value={item.href}
                        onSelect={() => handleSelect(item.href)}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.table}</p>
                        </div>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              ))}
              <CommandSeparator />
              <div className="p-2 text-xs text-muted-foreground text-center">
                Tekan Enter untuk memilih, Esc untuk menutup
              </div>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
