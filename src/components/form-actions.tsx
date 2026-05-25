"use client"

import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FormActionsProps {
  loading?: boolean
  loadingText?: string
  submitText?: string
  onCancel?: () => void
  cancelText?: string
  className?: string
}

export function FormActions({
  loading = false,
  loadingText = 'Menyimpan...',
  submitText = 'Simpan',
  onCancel,
  cancelText = 'Batal',
  className,
}: FormActionsProps) {
  return (
    <div className={`flex items-center justify-end gap-3 pt-4 border-t ${className ?? ''}`}>
      {onCancel && (
        <Button type="button" className="bg-red-500/70 text-white hover:bg-red-500/90" onClick={onCancel} disabled={loading}>
          {cancelText}
        </Button>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingText}
          </>
        ) : (
          submitText
        )}
      </Button>
    </div>
  )
}
