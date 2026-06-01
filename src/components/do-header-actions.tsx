"use client"

import { useState } from 'react'
import { DOPdfDownload } from '@/components/do-pdf-download'
import { ResiPackingDialog } from '@/components/resi-packing-dialog'
import { Button } from '@/components/ui/button'
import { Receipt } from 'lucide-react'

interface Props {
  doId: string
  nomor: string
}

export function DOHeaderActions({ doId, nomor }: Props) {
  const [resiOpen, setResiOpen] = useState(false)

  return (
    <div className="flex items-center gap-2">
      <DOPdfDownload doId={doId} nomor={nomor} />
      <Button variant="outline" size="sm" onClick={() => setResiOpen(true)}>
        <Receipt className="h-3.5 w-3.5 mr-1" />
        Resi Packing
      </Button>
      <ResiPackingDialog doId={doId} nomor={nomor} open={resiOpen} onOpenChange={setResiOpen} />
    </div>
  )
}
