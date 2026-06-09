"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api/client"

const composeSchema = z.object({
  toEmail: z.string().email("Email tidak valid"),
  toNama: z.string().optional(),
  subject: z.string().min(1, "Subject harus diisi"),
  body: z.string().optional(),
})

type ComposeValues = z.infer<typeof composeSchema>

interface EmailComposeSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Partial<ComposeValues>
  draftId?: string
  onSent?: () => void
}

export function EmailComposeSheet({ open, onOpenChange, initialData, draftId, onSent }: EmailComposeSheetProps) {
  const [sending, setSending] = useState(false)
  const [saving, setSaving] = useState(false)

  const form = useForm<ComposeValues>({
    resolver: zodResolver(composeSchema),
    defaultValues: initialData ?? {
      toEmail: "",
      toNama: "",
      subject: "",
      body: "",
    },
  })

  const handleSend = async (values: ComposeValues) => {
    setSending(true)
    const toastId = toast.loading("Mengirim email...")
    try {
      await apiFetch("/api/v1/email/send", {
        method: "POST",
        body: JSON.stringify(values),
      })
      toast.success("Email berhasil dikirim!", { id: toastId })
      form.reset()
      onOpenChange(false)
      onSent?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim email", { id: toastId })
    } finally {
      setSending(false)
    }
  }

  const handleSaveDraft = async () => {
    const values = form.getValues()
    if (!values.toEmail && !values.subject && !values.body) {
      toast.error("Tidak ada konten untuk disimpan")
      return
    }
    setSaving(true)
    const toastId = toast.loading("Menyimpan draft...")
    try {
      await apiFetch("/api/v1/email/send", {
        method: "POST",
        body: JSON.stringify({ ...values, status: "draft", draftId }),
      })
      toast.success("Draft tersimpan!", { id: toastId })
      onSent?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan draft", { id: toastId })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-2xl w-full">
        <SheetHeader>
          <SheetTitle className="font-heading font-semibold tracking-tight">
            {draftId ? "Edit Draft" : "Compose Email"}
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSend)} className="space-y-4 mt-6">
            <FormField
              control={form.control}
              name="toEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="customer@example.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="toNama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Penerima (opsional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="PT Customer" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Subjek email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Isi email..." className="min-h-[200px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-2 pt-4 border-t border-border">
              <Button
                type="submit"
                disabled={sending || saving}
                className="bg-gradient-to-b from-[#0000FF] to-[#0000D9] shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_1px_2px_rgba(0,0,0,0.1)]"
              >
                {sending ? "Mengirim..." : "Send"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={sending || saving}
                onClick={handleSaveDraft}
              >
                {saving ? "Menyimpan..." : "Save Draft"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Discard
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
