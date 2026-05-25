"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConfirmLeaveDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmLeaveDialog({ open, onConfirm, onCancel }: ConfirmLeaveDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) onCancel() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Perubahan Belum Disimpan</AlertDialogTitle>
          <AlertDialogDescription>
            Anda memiliki perubahan yang belum disimpan. Apakah Anda yakin ingin meninggalkan halaman ini?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-red-500/70 text-white hover:bg-red-500/90 border-0" onClick={onCancel}>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Ya, Tinggalkan</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
