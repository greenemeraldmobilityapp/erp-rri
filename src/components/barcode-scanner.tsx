"use client"
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { QrCode, Camera, X, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ScannedItem {
  kode: string
  nama: string
  matched: boolean
  timestamp: Date
}

interface BarcodeScannerProps {
  barangOptions: Array<{ kode: string; nama: string; id: string }>
  onScanComplete?: (scanned: ScannedItem[]) => void
  trigger?: React.ReactNode
}

export function BarcodeScanner({ barangOptions, onScanComplete, trigger }: BarcodeScannerProps) {
  const [open, setOpen] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [manualInput, setManualInput] = useState('')
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([])
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scannerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopCamera = () => {
    if (scannerIntervalRef.current) {
      clearInterval(scannerIntervalRef.current)
      scannerIntervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t: MediaStreamTrack) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }

  const startCamera = async () => {
    if (cameraActive) return
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      const win = window as unknown as Record<string, unknown>
      if ('BarcodeDetector' in win && typeof win.BarcodeDetector === 'function') {
        const detector = new (win.BarcodeDetector as new (opts: { formats: string[] }) => {
          detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>
        })({ formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e'] })

        scannerIntervalRef.current = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === 4) {
            try {
              const barcodes = await detector.detect(videoRef.current)
              if (barcodes.length > 0) {
                handleScannedCode(barcodes[0].rawValue)
                stopCamera()
              }
            } catch {
              // ignore
            }
          }
        }, 500)
      }

      setCameraActive(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Tidak dapat mengakses kamera'
      setCameraError(
        msg.includes('Permission') || msg.includes('denied')
          ? 'Izin kamera ditolak. Gunakan input manual.'
          : 'Kamera tidak tersedia di perangkat ini.'
      )
      toast.error('Tidak dapat mengakses kamera')
    }
  }

  const handleScannedCode = (kode: string) => {
    const normalized = kode.trim().toUpperCase()
    const barang = barangOptions.find(b => b.kode.toUpperCase() === normalized)

    if (barang) {
      setScannedItems(prev => {
        if (prev.some(s => s.kode === normalized)) return prev
        return [...prev, { kode: normalized, nama: barang.nama, matched: true, timestamp: new Date() }]
      })
      toast.success('Item ditemukan: ' + barang.nama)
    } else {
      setScannedItems(prev => {
        if (prev.some(s => s.kode === normalized)) return prev
        return [...prev, { kode: normalized, nama: 'Tidak dikenali', matched: false, timestamp: new Date() }]
      })
      toast.warning('Kode tidak ditemukan: ' + normalized)
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualInput.trim()) {
      handleScannedCode(manualInput.trim())
      setManualInput('')
    }
  }

  const handleClearScanned = () => setScannedItems([])

  const handleDone = () => {
    onScanComplete?.(scannedItems)
    setOpen(false)
  }

  const scannedCount = scannedItems.filter(s => s.matched).length
  const totalCount = scannedItems.length

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) stopCamera(); setOpen(v) }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <QrCode className="h-4 w-4 mr-2" />
            Scan Barang
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-0 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg flex items-center gap-2">
              <Camera className="h-5 w-5 text-accent" />
              Scan Barcode / QR Code
            </DialogTitle>
            {cameraActive && (
              <Button variant="ghost" size="sm" onClick={stopCamera}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {cameraError && (
            <Card className="border-destructive">
              <CardContent className="pt-4">
                <p className="text-sm text-destructive flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  {cameraError}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Camera Scanner */}
          <div className="space-y-2">
            <Button onClick={startCamera} disabled={cameraActive} className="w-full">
              {cameraActive ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
                  Kamera Aktif - Arahkan ke barcode...
                </span>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Buka Kamera
                </>
              )}
            </Button>

            {cameraActive && (
              <div className="relative rounded-lg overflow-hidden border border-border bg-black aspect-video">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-32 border-2 border-accent rounded-lg" />
                </div>
              </div>
            )}

            {!cameraActive && (
              <p className="text-xs text-muted-foreground text-center">
                Kamera digunakan untuk scan barcode atau QR code. Jika tidak tersedia, gunakan input manual.
              </p>
            )}
          </div>

          {/* Manual Input */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <Input
              placeholder="Masukkan kode barang..."
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="secondary">Cari</Button>
          </form>

          {/* Scanned Items */}
          {scannedItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Item Ter-Scan ({scannedCount}/{totalCount})
                </p>
                <Button variant="ghost" size="sm" onClick={handleClearScanned}>
                  Reset
                </Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {scannedItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                    {item.matched ? (
                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${item.matched ? '' : 'text-destructive'}`}>
                        [{item.kode}] {item.nama}
                      </p>
                      {!item.matched && (
                        <p className="text-xs text-muted-foreground">Barang tidak ditemukan dalam DO</p>
                      )}
                    </div>
                    <Badge
                      variant={item.matched ? 'success' : 'destructive'}
                      className="text-xs flex-shrink-0"
                    >
                      {item.matched ? 'Ditemukan' : 'Tidak dikenali'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {scannedItems.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Scan barcode barang atau input kode manual untuk validasi
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button className="bg-red-500/70 text-white hover:bg-red-500/90" onClick={() => setOpen(false)}>Batal</Button>
          <Button onClick={handleDone} disabled={scannedItems.length === 0}>
            Selesai ({scannedCount} item)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}