"use client"

import { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Eye, Download, Plus, Save, Receipt, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { getAuthToken } from '@/lib/api/client'
import { toast } from 'sonner'

interface BarangInfo {
  nama: string
  kode: string
  satuan: string
}

interface DOItem {
  id: string
  jumlah: number
  packing_number: number | null
  barang: BarangInfo | null
}

interface Props {
  doId: string
  nomor: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ResiPackingDialog({ doId, nomor, open, onOpenChange }: Props) {
  const [items, setItems] = useState<DOItem[]>([])
  const [assignments, setAssignments] = useState<Map<string, number | null>>(new Map())
  const [activePacking, setActivePacking] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [search, setSearch] = useState('')

  // Fetch items on open
  useEffect(() => {
    if (!open) return

    const fetchItems = async () => {
      setLoading(true)
      setSaved(false)
      const token = await getAuthToken()
      const res = await fetch(`/api/v1/delivery-order/${doId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        toast.error('Gagal memuat data item')
        setLoading(false)
        return
      }
      const json = await res.json()
      const dataItems: DOItem[] = json.data?.items ?? []
      setItems(dataItems)

      // Build assignments from existing packing data
      const map = new Map<string, number | null>()
      for (const item of dataItems) {
        map.set(item.id, item.packing_number ?? null)
      }
      setAssignments(map)

      // Determine highest existing packing number
      const maxPacking = dataItems.reduce((max, i) => {
        const p = i.packing_number ?? 0
        return p > max ? p : max
      }, 0)
      setActivePacking(maxPacking || 1)
      setLoading(false)
    }

    fetchItems()
  }, [doId, open])

  // Compute available packings and their counts
  const packingCounts = new Map<number, number>()
  for (const [, pn] of assignments) {
    if (pn != null) {
      packingCounts.set(pn, (packingCounts.get(pn) ?? 0) + 1)
    }
  }
  const existingPackings = Array.from(packingCounts.entries())
    .sort(([a], [b]) => a - b)
  const highestPacking = existingPackings.length > 0
    ? existingPackings[existingPackings.length - 1][0]
    : 0

  const activeCount = packingCounts.get(activePacking) ?? 0

  // Toggle item in/out of active packing
  const toggleItem = (itemId: string, checked: boolean) => {
    setAssignments(prev => {
      const currCount = packingCounts.get(activePacking) ?? 0
      const next = new Map(prev)
      if (checked) {
        if (currCount >= 10) {
          toast.error('Maksimal 10 items per packing')
          return prev
        }
        next.set(itemId, activePacking)
      } else {
        next.set(itemId, null)
      }
      return next
    })
  }

  // Add a new packing
  const addPacking = () => {
    const newPacking = highestPacking + 1
    setActivePacking(newPacking)
  }

  // Items with original index for fixed numbering
  const itemsWithIndex = items.map((item, idx) => ({ ...item, originalIndex: idx }))

  // Unassigned items (not in any packing), filtered by search
  const unassignedItems = itemsWithIndex.filter(i => {
    const pn = assignments.get(i.id)
    if (pn != null) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      i.barang?.kode?.toLowerCase().includes(q) ||
      i.barang?.nama?.toLowerCase().includes(q)
    )
  })

  // Items in the active packing
  const activePackingItems = itemsWithIndex.filter(i => assignments.get(i.id) === activePacking)

  // Save to API
  const handleSave = async () => {
    setSaving(true)
    const token = await getAuthToken()
    const payload = {
      items: items.map(i => ({
        id: i.id,
        packing_number: assignments.get(i.id) ?? null,
      })),
    }
    const res = await fetch(`/api/v1/delivery-order/${doId}/packing`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      toast.error(err?.error || 'Gagal menyimpan packing')
      setSaving(false)
      return
    }
    toast.success('Packing berhasil disimpan')
    setSaved(true)
    setSaving(false)
  }

  // Fetch PDF preview/download
  const [pdfLoading, setPdfLoading] = useState(false)

  const fetchPdfBlob = async () => {
    const token = await getAuthToken()
    const res = await fetch(`/api/v1/delivery-order/${doId}/resi-pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      throw new Error(err?.error || 'Gagal memuat PDF')
    }
    return res.blob()
  }

  const handlePdfPreview = async () => {
    setPdfLoading(true)
    try {
      const blob = await fetchPdfBlob()
      window.open(URL.createObjectURL(blob), '_blank')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  const handlePdfDownload = async () => {
    setPdfLoading(true)
    try {
      const blob = await fetchPdfBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `RESI-${nomor}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal download PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Resi Pengiriman - Packing Barang
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{nomor}</p>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Packing tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b pb-3 mb-4">
              {existingPackings.map(([pn]) => (
                <Button
                  key={pn}
                  variant={activePacking === pn ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActivePacking(pn)}
                >
                  Packing {pn}
                  <span className="ml-1.5 text-xs opacity-70">
                    [{packingCounts.get(pn) ?? 0}/10]
                  </span>
                </Button>
              ))}
              <Button variant="ghost" size="sm" onClick={addPacking} disabled={unassignedItems.length === 0}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Packing baru
              </Button>
            </div>

            {/* Active packing items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">
                  Packing {activePacking}
                  <span className="ml-2 text-muted-foreground font-normal">
                    ({activeCount}/10 items)
                  </span>
                </h4>
              </div>

              {activePackingItems.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Belum ada item. Centang item dari daftar &quot;Item Tersedia&quot; di bawah.
                </p>
              ) : (
                <div className="border rounded-md">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-2 font-medium w-10">#</th>
                        <th className="text-left p-2 font-medium">Nama Barang</th>
                        <th className="text-right p-2 font-medium w-20">Jumlah</th>
                        <th className="text-center p-2 font-medium w-10"> </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activePackingItems.map((item) => (
                        <tr key={item.id} className="border-b last:border-b-0">
                          <td className="p-2 text-muted-foreground">{item.originalIndex + 1}</td>
                          <td className="p-2 font-medium">{item.barang?.nama ?? '-'}</td>
                          <td className="p-2 text-right">{item.jumlah}</td>
                          <td className="p-2 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-destructive"
                              onClick={() => toggleItem(item.id, false)}
                            >
                              Hapus
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Unassigned items — available to add */}
            {itemsWithIndex.filter(i => assignments.get(i.id) == null).length > 0 && (
              <div className="space-y-2 mt-4">
                <h4 className="text-sm font-semibold">
                  Item Tersedia
                </h4>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari berdasarkan kode atau nama barang..."
                    className="pl-8 h-9 text-sm"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <div className="border rounded-md max-h-48 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-2 font-medium w-10"> </th>
                        <th className="text-left p-2 font-medium w-16">No. Urut</th>
                        <th className="text-left p-2 font-medium w-24">Kode Barang</th>
                        <th className="text-left p-2 font-medium">Nama Barang</th>
                        <th className="text-right p-2 font-medium w-20">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unassignedItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-sm text-muted-foreground">
                            Tidak ada item yang cocok
                          </td>
                        </tr>
                      ) : (
                        unassignedItems.map((item) => (
                          <tr key={item.id} className="border-b last:border-b-0 hover:bg-muted/30">
                            <td className="p-2 text-center">
                              <Checkbox
                                checked={false}
                                disabled={activeCount >= 10}
                                onCheckedChange={(checked) => toggleItem(item.id, checked === true)}
                              />
                            </td>
                            <td className="p-2 text-muted-foreground">{item.originalIndex + 1}</td>
                            <td className="p-2 font-mono text-xs">{item.barang?.kode ?? '-'}</td>
                            <td className="p-2 font-medium">{item.barang?.nama ?? '-'}</td>
                            <td className="p-2 text-right">{item.jumlah}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {activeCount >= 10 && (
                  <p className="text-xs text-destructive">Packing {activePacking} sudah penuh (maks 10 items). Buat packing baru.</p>
                )}
              </div>
            )}
          </>
        )}

        <DialogFooter className="flex items-center justify-between sm:justify-between gap-2">
          <div className="flex gap-2">
            {saved && (
              <>
                <Button variant="outline" size="sm" onClick={handlePdfPreview} disabled={pdfLoading}>
                  {pdfLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
                  Preview Resi
                </Button>
                <Button variant="default" size="sm" onClick={handlePdfDownload} disabled={pdfLoading}>
                  {pdfLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1" />}
                  Download Resi
                </Button>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Tutup</Button>
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Simpan
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
