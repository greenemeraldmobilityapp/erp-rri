"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty, CommandGroup } from "@/components/ui/command"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api/client"
import { X, Send, Reply, Forward, Paperclip, BookUser } from "lucide-react"

const composeSchema = z.object({
  toEmail: z.string().email("Email tidak valid"),
  toNama: z.string().optional(),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  subject: z.string().min(1, "Subject harus diisi"),
  body: z.string().optional(),
})

type ComposeValues = z.infer<typeof composeSchema>

interface EmailComposeSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Partial<ComposeValues> & { replyType?: "reply" | "replyAll" | "forward" }
  onSent?: () => void
}

interface AttachmentFile {
  name: string
  size: number
  file: File
}

export function EmailComposeSheet({ open, onOpenChange, initialData, onSent }: EmailComposeSheetProps) {
  const [sending, setSending] = useState(false)
  const [showCc, setShowCc] = useState(!!initialData?.cc)
  const [showBcc, setShowBcc] = useState(!!initialData?.bcc)
  const [attachments, setAttachments] = useState<AttachmentFile[]>([])
  const [contactsOpen, setContactsOpen] = useState(false)
  const [contactQuery, setContactQuery] = useState("")
  const [contactResults, setContactResults] = useState<ContactResult[]>([])
  const [contactLoading, setContactLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const replyType = initialData?.replyType
  const isReply = replyType === "reply" || replyType === "replyAll"
  const isForward = replyType === "forward"

  const bannerTitle = isForward
    ? "Forwarded message"
    : isReply
      ? `Reply to: ${initialData?.subject || "Original message"}`
      : null

  const sheetTitle = isForward
    ? "Forward Email"
    : isReply
      ? "Reply Email"
      : "Compose Email"

  const form = useForm<ComposeValues>({
    resolver: zodResolver(composeSchema),
    defaultValues: {
      toEmail: initialData?.toEmail ?? "",
      toNama: initialData?.toNama ?? "",
      cc: initialData?.cc ?? "",
      bcc: initialData?.bcc ?? "",
      subject: initialData?.subject ?? "",
      body: initialData?.body ?? "",
    },
  })

  interface ContactResult {
    id: string
    nama: string
    email: string
    noHp?: string | null
    customerNama?: string | null
    customerKode?: string | null
  }

  useEffect(() => {
    if (contactQuery.length < 2) {
      setContactResults([])
      return
    }
    const timer = setTimeout(async () => {
      setContactLoading(true)
      try {
        const res = await apiFetch<ContactResult[]>(
          `/api/v1/email/contacts/search?q=${encodeURIComponent(contactQuery)}`,
        )
        setContactResults(res.data)
      } catch {
        setContactResults([])
      }
      setContactLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [contactQuery])

  const handleSelectContact = useCallback(
    (contact: ContactResult) => {
      form.setValue("toEmail", contact.email)
      form.setValue("toNama", contact.nama)
      setContactsOpen(false)
      setContactQuery("")
      setContactResults([])
    },
    [form],
  )

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
      setAttachments([])
      setShowCc(false)
      setShowBcc(false)
      onOpenChange(false)
      onSent?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim email", { id: toastId })
    } finally {
      setSending(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newFiles: AttachmentFile[] = files.map((f) => ({
      name: f.name,
      size: f.size,
      file: f,
    }))
    setAttachments((prev) => [...prev, ...newFiles])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        key={initialData ? `${initialData.toEmail}-${initialData.subject}` : "new"}
        side="right"
        className="sm:max-w-3xl w-full p-0 flex flex-col"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                {isForward ? (
                  <Forward className="h-4 w-4" />
                ) : isReply ? (
                  <Reply className="h-4 w-4" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </div>
              <SheetTitle className="font-heading font-semibold tracking-tight text-lg">
                {sheetTitle}
              </SheetTitle>
            </div>
            <SheetClose className="rounded-full p-2 hover:bg-muted transition-colors">
              <X className="h-4 w-4" />
            </SheetClose>
          </div>
        </SheetHeader>

        {bannerTitle && (
          <div className="mx-6 mt-4 px-4 py-2.5 bg-muted/50 border border-border rounded-lg flex items-center gap-2 animate-fade-in-up">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 uppercase tracking-wider shrink-0">
              {isForward ? "Fwd" : "Re"}
            </Badge>
            <span className="text-xs text-muted-foreground truncate">{bannerTitle}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSend)} className="space-y-4">
              <FormField
                control={form.control}
                name="toEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      To
                    </FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input {...field} placeholder="customer@example.com" className="h-10 flex-1" />
                      </FormControl>
                      <Popover open={contactsOpen} onOpenChange={setContactsOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 shrink-0"
                            title="Cari kontak dari database"
                          >
                            <BookUser className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="end">
                          <Command>
                            <CommandInput
                              placeholder="Cari kontak..."
                              value={contactQuery}
                              onValueChange={setContactQuery}
                            />
                            <CommandList>
                              {contactLoading && (
                                <div className="px-4 py-2 text-xs text-muted-foreground">Mencari...</div>
                              )}
                              <CommandEmpty>Tidak ada kontak ditemukan</CommandEmpty>
                              <CommandGroup>
                                {contactResults.map((contact) => (
                                  <CommandItem
                                    key={contact.id}
                                    value={`${contact.nama} ${contact.email}`}
                                    onSelect={() => handleSelectContact(contact)}
                                    className="flex flex-col items-start gap-0.5 py-2.5"
                                  >
                                    <span className="font-medium text-sm">{contact.nama}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {contact.email}
                                      {contact.customerNama && ` · ${contact.customerNama}`}
                                    </span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(initialData?.toNama || form.watch("toNama")) && (
                <p className="text-xs text-muted-foreground -mt-3 ml-1">
                  {initialData?.toNama || form.watch("toNama")}
                </p>
              )}

              <div className="flex items-center gap-3">
                {!showCc && !showBcc && (
                  <button
                    type="button"
                    onClick={() => setShowCc(true)}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                  >
                    CC
                  </button>
                )}
                {!showBcc && (
                  <button
                    type="button"
                    onClick={() => setShowBcc(true)}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                  >
                    BCC
                  </button>
                )}
              </div>

              <div className="space-y-3 overflow-hidden transition-all duration-200">
                {showCc && (
                  <FormField
                    control={form.control}
                    name="cc"
                    render={({ field }) => (
                      <FormItem className="animate-fade-in-up">
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          CC
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="cc@example.com" className="h-10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {showBcc && (
                  <FormField
                    control={form.control}
                    name="bcc"
                    render={({ field }) => (
                      <FormItem className="animate-fade-in-up">
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          BCC
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="bcc@example.com" className="h-10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Subject
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Subjek email" className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Attachments
                </FormLabel>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="mr-1.5 h-3.5 w-3.5" />
                    Choose Files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
                {attachments.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {attachments.map((att, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border border-border rounded-md text-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="truncate text-foreground font-medium">{att.name}</span>
                          <span className="text-muted-foreground text-xs shrink-0">
                            {formatFileSize(att.size)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(i)}
                          className="text-muted-foreground hover:text-destructive transition-colors shrink-0 ml-2"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Body
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Isi email..."
                        className="min-h-[280px] resize-y leading-relaxed"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/10 shrink-0">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              disabled={sending}
              className="btn-primary-gradient h-10 px-6"
              onClick={form.handleSubmit(handleSend)}
            >
              <Send className="mr-2 h-4 w-4" />
              {sending ? "Mengirim..." : "Send"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-10 text-muted-foreground"
            >
              Discard
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
