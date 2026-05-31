'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Camera, CheckCircle, XCircle, Loader2, Upload, Trash2 } from 'lucide-react'
import { apiFetch, apiFetchFormData } from '@/lib/api/client'
import { toast } from 'sonner'
import imageCompression from 'browser-image-compression'

interface PhotoState {
  file: File | null
  preview: string
  uploading: boolean
  url: string | null
}

interface Props {
  doId: string
  status: string
  existingFotoBarang: string | null
  existingFotoSuratJalan: string | null
}

export function DOPhotoConfirmation({ doId, status, existingFotoBarang, existingFotoSuratJalan }: Props) {
  if (status !== 'awaiting_pickup') return null

  const [fotoBarang, setFotoBarang] = useState<PhotoState>({
    file: null, preview: existingFotoBarang ?? '', uploading: false, url: existingFotoBarang,
  })
  const [fotoSurat, setFotoSurat] = useState<PhotoState>({
    file: null, preview: existingFotoSuratJalan ?? '', uploading: false, url: existingFotoSuratJalan,
  })
  const [alasan, setAlasan] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showAlasan, setShowAlasan] = useState(false)

  const barangRef = useRef<HTMLInputElement>(null)
  const suratRef = useRef<HTMLInputElement>(null)

  const bothUploaded = !!fotoBarang.url && !!fotoSurat.url

  async function handleFileSelect(type: 'barang_diterima' | 'surat_jalan', file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB')
      return
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      toast.error('Gambar harus JPG, PNG, atau WebP')
      return
    }

    const setter = type === 'barang_diterima' ? setFotoBarang : setFotoSurat
    setter(prev => ({ ...prev, uploading: true }))

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/webp',
      })

      const fd = new FormData()
      fd.append('file', compressed, 'foto.webp')
      fd.append('type', type)

      const res = await apiFetchFormData<{ fileUrl: string }>(
        `/api/v1/delivery-order/${doId}/delivery-photo`,
        fd
      )

      const preview = URL.createObjectURL(compressed)
      setter({ file: compressed, preview, uploading: false, url: res.data.fileUrl })
      toast.success('Foto berhasil diupload')
    } catch (err) {
      setter(prev => ({ ...prev, uploading: false }))
      toast.error(err instanceof Error ? err.message : 'Gagal upload foto')
    }
  }

  async function handleDelete(type: 'barang_diterima' | 'surat_jalan') {
    const setter = type === 'barang_diterima' ? setFotoBarang : setFotoSurat
    setter(prev => ({ ...prev, uploading: true }))

    try {
      await apiFetch(`/api/v1/delivery-order/${doId}/delivery-photo?type=${type}`, { method: 'DELETE' })
      setter({ file: null, preview: '', uploading: false, url: null })
      toast.success('Foto berhasil dihapus')
    } catch (err) {
      setter(prev => ({ ...prev, uploading: false }))
      toast.error(err instanceof Error ? err.message : 'Gagal hapus foto')
    }
  }

  async function handleConfirm(status: 'dikirim' | 'ditolak') {
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = { status }
      if (status === 'ditolak') body.alasan_penolakan = alasan
      await apiFetch(`/api/v1/delivery-order/${doId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      })
      toast.success(status === 'dikirim'
        ? 'DO berhasil dikonfirmasi sebagai Dikirim & Diterima. Invoice draft telah dibuat.'
        : 'DO berhasil dikonfirmasi sebagai Ditolak'
      )
      setTimeout(() => window.location.reload(), 1500)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal konfirmasi')
    } finally {
      setSubmitting(false)
    }
  }

  function PhotoCard({
    label, description, state, inputRef, type,
  }: {
    label: string
    description: string
    state: PhotoState
    inputRef: React.RefObject<HTMLInputElement | null>
    type: 'barang_diterima' | 'surat_jalan'
  }) {
    return (
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          {state.url && (
            <Button variant="ghost" size="icon" onClick={() => handleDelete(type)} disabled={state.uploading}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>

        {state.preview ? (
          <div className="relative">
            <img src={state.preview} alt={label} className="w-full h-40 object-cover rounded-md" />
            <div className="absolute top-2 right-2">
              <CheckCircle className="h-5 w-5 text-green-500 bg-white rounded-full" />
            </div>
          </div>
        ) : (
          <div
            className="border-2 border-dashed rounded-md h-40 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <Camera className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Ketuk untuk upload foto</p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFileSelect(type, f)
            e.target.value = ''
          }}
        />

        {state.uploading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Mengupload...
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Upload className="h-4 w-4" /> Konfirmasi Pengiriman
        </h3>
        <p className="text-sm text-muted-foreground">
          Upload foto bukti pengiriman sebelum mengkonfirmasi status DO.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PhotoCard
            label="Foto Barang Diterima"
            description="Barang sudah sampai dan diterima customer"
            state={fotoBarang}
            inputRef={barangRef}
            type="barang_diterima"
          />
          <PhotoCard
            label="Foto Surat Jalan"
            description="Surat jalan RRI yang sudah ditandatangani kedua pihak"
            state={fotoSurat}
            inputRef={suratRef}
            type="surat_jalan"
          />
        </div>

        {showAlasan && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-destructive">Alasan Penolakan</p>
            <Textarea
              placeholder="Masukkan alasan mengapa barang ditolak..."
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              rows={3}
            />
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            size="lg"
            disabled={!bothUploaded || submitting}
            onClick={() => handleConfirm('dikirim')}
          >
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
            Dikirim & Diterima
          </Button>
          {!showAlasan ? (
            <Button
              variant="destructive"
              size="lg"
              disabled={!bothUploaded}
              onClick={() => setShowAlasan(true)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Dikirim & Ditolak
            </Button>
          ) : (
            <Button
              variant="destructive"
              size="lg"
              disabled={!bothUploaded || submitting || !alasan.trim()}
              onClick={() => handleConfirm('ditolak')}
            >
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
              Konfirmasi Penolakan
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
