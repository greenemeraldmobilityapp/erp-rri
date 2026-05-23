"use client"
import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { BarcodeScanner } from '@/components/barcode-scanner'
import { QrCode, CheckCircle2, ScanBarcode, RotateCcw } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { toast } from 'sonner'

interface DOScanItem {
  kode: string
  nama: string
  matched: boolean
  timestamp: Date
}

interface DOScanPanelProps {
  doId: string
  doNomor: string
  items: Array<{
    id: string
    barang?: { nama: string; kode: string; satuan: string }
    jumlah: number
  }>
}

export function DOScanPanel({ doId, doNomor, items }: DOScanPanelProps) {
  const [scannedItems, setScannedItems] = useState<DOScanItem[]>([])
  const [confirmed, setConfirmed] = useState(false)
  const barangOptions = items.map(i => ({
    id: i.id,
    kode: i.barang?.kode ?? '',
    nama: i.barang?.nama ?? ''
  }))

  const matchedIds = new Set(scannedItems.filter(s => s.matched).map(s => {
    const item = items.find(i => i.barang?.kode.toUpperCase() === s.kode.toUpperCase())
    return item?.id
  }))

  const handleScanComplete = (scanned: DOScanItem[]) => {
    setScannedItems(scanned)
    setConfirmed(false)
  }

  const handleKonfirmasi = async () => {
    try {
      const matchedItems = scannedItems
        .filter(s => s.matched)
        .map(s => {
          const item = items.find(i => i.barang?.kode.toUpperCase() === s.kode.toUpperCase())
          return item ? { delivery_order_item_id: item.id, kode: s.kode } : null
        })
        .filter(Boolean)

      await apiFetch('/api/v1/delivery-order/' + doId + '/scan', {
        method: 'POST',
        body: JSON.stringify({ scanned_items: matchedItems })
      })
      toast.success('Scan berhasil dikonfirmasi')
      setConfirmed(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan scan')
    }
  }

  const scanProgress = scannedItems.filter(s => s.matched).length
  const totalItems = items.length

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* QR Code Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              QR Code DO
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="p-4 bg-white rounded-lg border">
              <QRCodeSVG
                value={doId}
                size={160}
                level="M"
                includeMargin
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Scan QR ini untuk membuka DO di perangkat lain
            </p>
            <p className="text-xs text-muted-foreground">{doNomor}</p>
          </CardContent>
        </Card>

        {/* Scan Progress */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ScanBarcode className="h-4 w-4" />
              Scan & Terima Barang
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {scanProgress}/{totalItems} item di-scan
              </p>
              {confirmed ? (
                <Badge variant="success">Terkonfirmasi</Badge>
              ) : (
                <Badge variant={scanProgress === totalItems ? 'success' : 'secondary'}>
                  {scanProgress < totalItems ? 'Belum lengkap' : 'Siap konfirmasi'}
                </Badge>
              )}
            </div>

            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-accent h-2 rounded-full transition-all duration-300"
                style={{ width: `${totalItems > 0 ? (scanProgress / totalItems) * 100 : 0}%` }}
              />
            </div>

            {/* Items list */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {items.map(item => {
                const isMatched = matchedIds.has(item.id)
                return (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                    {isMatched ? (
                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        [{item.barang?.kode}] {item.barang?.nama}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">x{item.jumlah}</p>
                    <Badge variant={isMatched ? 'success' : 'outline'} className="text-xs">
                      {isMatched ? 'Di-scan' : 'Belum'}
                    </Badge>
                  </div>
                )
              })}
            </div>

            <div className="flex gap-2">
              <BarcodeScanner
                barangOptions={barangOptions}
                onScanComplete={handleScanComplete}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setScannedItems([]); setConfirmed(false); }}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>

            {!confirmed && scanProgress > 0 && (
              <Button onClick={handleKonfirmasi} className="w-full" disabled={confirmed}>
                Konfirmasi Scan
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Scanned Detail */}
      {scannedItems.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Detail Scan</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead>Waktu Scan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scannedItems.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      {item.matched ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <span className="text-destructive font-bold">X</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{item.kode}</TableCell>
                    <TableCell>{item.nama}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {item.timestamp.toLocaleTimeString('id-ID')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}