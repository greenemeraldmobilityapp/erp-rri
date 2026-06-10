"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/db/client"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
import {
  ArrowLeft,
  Reply,
  ReplyAll,
  Forward,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Paperclip,
  Download,
} from "lucide-react"
import { useEmail } from "@/components/email/email-context"
import { toast } from "sonner"
import { getAuthToken } from "@/lib/api/client"

interface EmailDetail {
  id: string
  messageId?: string | null
  fromEmail?: string | null
  fromNama?: string | null
  toEmail: string
  toNama?: string | null
  cc?: string | null
  subject: string
  body?: string | null
  status: string
  errorMessage?: string | null
  hasAttachments?: boolean | null
  createdAt: string
  deliveredAt?: string | null
  openedAt?: string | null
  clickedAt?: string | null
  inbound?: boolean | null
}

interface EmailAttachment {
  id: string
  fileName: string
  fileUrl: string
  fileSize: number | null
  mimeType: string | null
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  sent: { label: "Sent", icon: <Clock className="h-3 w-3" />, color: "text-muted-foreground" },
  delivered: { label: "Delivered", icon: <CheckCircle2 className="h-3 w-3" />, color: "text-success" },
  opened: { label: "Opened", icon: <CheckCircle2 className="h-3 w-3" />, color: "text-primary" },
  clicked: { label: "Clicked", icon: <CheckCircle2 className="h-3 w-3" />, color: "text-primary" },
  bounced: { label: "Bounced", icon: <AlertCircle className="h-3 w-3" />, color: "text-destructive" },
  failed: { label: "Failed", icon: <AlertCircle className="h-3 w-3" />, color: "text-destructive" },
  trashed: { label: "Trash", icon: <Trash2 className="h-3 w-3" />, color: "text-muted-foreground" },
}

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function mapEmailDetail(row: Record<string, unknown>): EmailDetail {
  return {
    id: row.id as string,
    messageId: row.message_id as string | null | undefined,
    fromEmail: row.from_email as string | null | undefined,
    fromNama: row.from_nama as string | null | undefined,
    toEmail: row.to_email as string,
    toNama: row.to_nama as string | null | undefined,
    cc: row.cc as string | null | undefined,
    subject: row.subject as string,
    body: row.body as string | null | undefined,
    status: row.status as string,
    errorMessage: row.error_message as string | null | undefined,
    hasAttachments: row.has_attachments as boolean | null | undefined,
    createdAt: row.created_at as string,
    deliveredAt: row.delivered_at as string | null | undefined,
    openedAt: row.opened_at as string | null | undefined,
    clickedAt: row.clicked_at as string | null | undefined,
    inbound: row.inbound as boolean | null | undefined,
  }
}

function formatDateTime(dateStr: string | null | undefined) {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ""
  return format(date, "dd MMM yyyy, HH:mm", { locale: idLocale })
}

function formatTrackingTime(dateStr: string | null | undefined) {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ""
  return format(date, "dd MMM HH:mm", { locale: idLocale })
}

function quoteBody(body: string | null | undefined): string {
  if (!body) return ""
  const stripped = body.replace(/<[^>]*>/g, "")
  return stripped
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n")
}

export default function EmailDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { openCompose } = useEmail()
  const [email, setEmail] = useState<EmailDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [trashOpen, setTrashOpen] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [purgeOpen, setPurgeOpen] = useState(false)
  const [purging, setPurging] = useState(false)
  const [trashing, setTrashing] = useState(false)
  const [attachments, setAttachments] = useState<EmailAttachment[]>([])
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    if (!params.id) return
    supabase
      .from("email_log")
      .select("*")
      .eq("id", params.id)
      .single()
      .then(async ({ data, error }) => {
        if (!error && data) {
          setEmail(mapEmailDetail(data))
          const attRes = await supabase
            .from("email_attachments")
            .select("id, file_name, file_url, file_size, mime_type")
            .eq("email_id", params.id)
          if (!attRes.error && attRes.data) {
            setAttachments(
              attRes.data.map((row) => ({
                id: row.id as string,
                fileName: (row.file_name ?? "") as string,
                fileUrl: (row.file_url ?? "") as string,
                fileSize: (row.file_size ?? null) as number | null,
                mimeType: (row.mime_type ?? null) as string | null,
              }))
            )
          }
        }
        setLoading(false)
      })
  }, [params.id])

  const handleReply = () => {
    if (!email) return
    openCompose({
      toEmail: email.fromEmail || email.toEmail,
      toNama: email.fromNama || email.toNama || undefined,
      subject: `Re: ${email.subject}`,
      body: `\n\n${quoteBody(email.body)}`,
      replyType: "reply",
      referenceId: email.messageId || undefined,
      referenceType: "reply",
    })
  }

  const handleReplyAll = () => {
    if (!email) return
    openCompose({
      toEmail: email.fromEmail || email.toEmail,
      toNama: email.fromNama || email.toNama || undefined,
      cc: email.cc || undefined,
      subject: `Re: ${email.subject}`,
      body: `\n\n${quoteBody(email.body)}`,
      replyType: "replyAll",
      referenceId: email.messageId || undefined,
      referenceType: "reply",
    })
  }

  const handleForward = () => {
    if (!email) return
    openCompose({
      subject: `Fwd: ${email.subject}`,
      body: `\n\n---------- Forwarded message ----------\nFrom: ${email.fromNama || email.fromEmail}\nDate: ${formatDateTime(email.createdAt)}\nSubject: ${email.subject}\n\n${quoteBody(email.body)}`,
      replyType: "forward",
      referenceId: email.messageId || undefined,
      referenceType: "forward",
    })
  }

  const handleTrash = async () => {
    if (!email) return
    setTrashing(true)
    const toastId = toast.loading("Memindahkan ke Trash...")
    try {
      const res = await fetch(`/api/v1/email/${email.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Gagal memindahkan ke Trash")
      }
      toast.success("Email dipindahkan ke Trash", { id: toastId })
      setTrashOpen(false)
      router.back()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memindahkan ke Trash", { id: toastId })
    } finally {
      setTrashing(false)
    }
  }

  const handleRestore = async () => {
    if (!email) return
    setRestoring(true)
    const toastId = toast.loading("Mengembalikan email...")
    try {
      const res = await fetch(`/api/v1/email/${email.id}/restore`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Gagal mengembalikan email")
      }
      toast.success("Email dikembalikan ke Inbox", { id: toastId })
      setEmail({ ...email, status: "sent" })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengembalikan email", { id: toastId })
    } finally {
      setRestoring(false)
    }
  }

  const handlePurge = async () => {
    if (!email) return
    setPurging(true)
    const toastId = toast.loading("Menghapus permanen...")
    try {
      const res = await fetch(`/api/v1/email/${email.id}/purge`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Gagal menghapus email")
      }
      toast.success("Email dihapus permanen", { id: toastId })
      setPurgeOpen(false)
      router.back()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus email", { id: toastId })
    } finally {
      setPurging(false)
    }
  }

  const handleDownloadAttachment = async (attachment: EmailAttachment) => {
    setDownloadingId(attachment.id)
    const toastId = toast.loading("Mengunduh lampiran...")
    try {
      const token = await getAuthToken()
      if (!token) throw new Error("Not authenticated")
      const res = await fetch(`/api/v1/email/attachments/${attachment.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Gagal mengunduh lampiran")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = window.document.createElement("a")
      a.href = url
      a.download = attachment.fileName
      window.document.body.appendChild(a)
      a.click()
      window.document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Lampiran diunduh", { id: toastId })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunduh lampiran", { id: toastId })
    } finally {
      setDownloadingId(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!email) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Email tidak ditemukan</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Kembali
        </Button>
      </div>
    )
  }

  const isTrashed = email.status === "trashed"
  const config = statusConfig[email.status] ?? { label: email.status, icon: null, color: "text-muted-foreground" }
  const trackingEvents: { status: string; time?: string | null }[] = [
    { status: "sent", time: email.createdAt },
    { status: "delivered", time: email.deliveredAt },
    { status: "opened", time: email.openedAt },
    { status: "clicked", time: email.clickedAt },
  ].filter((e) => e.time)

  return (
    <div className="p-6 space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back
      </Button>

      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-heading font-semibold tracking-tight text-foreground">
            {email.subject || "(No Subject)"}
          </h1>
          <Badge variant="outline" className={config.color}>
            {config.icon}
            <span className="ml-1">{config.label}</span>
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {isTrashed ? (
            <>
              <Button variant="ghost" size="sm" onClick={handleRestore} disabled={restoring}>
                <RotateCcw className="mr-1 h-4 w-4" />
                {restoring ? "Mengembalikan..." : "Restore"}
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setPurgeOpen(true)}>
                <Trash2 className="mr-1 h-4 w-4" /> Delete Permanently
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={handleReply}>
                <Reply className="mr-1 h-4 w-4" /> Reply
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReplyAll}>
                <ReplyAll className="mr-1 h-4 w-4" /> Reply All
              </Button>
              <Button variant="ghost" size="sm" onClick={handleForward}>
                <Forward className="mr-1 h-4 w-4" /> Forward
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => setTrashOpen(true)}>
                <Trash2 className="mr-1 h-4 w-4" /> Move to Trash
              </Button>
            </>
          )}
        </div>

        <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
          <div className="grid grid-cols-[80px_1fr] gap-x-4 gap-y-1 text-sm">
            <span className="text-muted-foreground font-medium">From:</span>
            <span className="text-foreground">{email.fromNama || email.fromEmail || "-"}</span>
            {email.fromEmail && email.fromNama && (
              <>
                <span />
                <span className="text-muted-foreground text-xs">{email.fromEmail}</span>
              </>
            )}
            <span className="text-muted-foreground font-medium">To:</span>
            <span className="text-foreground">{email.toNama || email.toEmail}</span>
            {email.cc && (
              <>
                <span className="text-muted-foreground font-medium">CC:</span>
                <span className="text-foreground">{email.cc}</span>
              </>
            )}
            <span className="text-muted-foreground font-medium">Date:</span>
            <span className="text-muted-foreground">
              {formatDateTime(email.createdAt)}
            </span>
          </div>
        </div>

        {email.body && (
          <div className="border border-border rounded-lg p-4 bg-card">
            <div className="text-sm leading-relaxed text-foreground prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: email.body }} />
          </div>
        )}

        {attachments.length > 0 && (
          <div className="border border-border rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Paperclip className="h-3 w-3" />
              Lampiran ({attachments.length})
            </div>
            <div className="space-y-1.5">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between px-3 py-2 bg-muted/30 border border-border rounded-md text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate text-foreground font-medium">{att.fileName}</p>
                      {att.fileSize && (
                        <p className="text-muted-foreground text-xs">{formatBytes(att.fileSize)}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 ml-2 h-8 w-8 p-0"
                    onClick={() => handleDownloadAttachment(att)}
                    disabled={downloadingId === att.id}
                    title="Unduh lampiran"
                  >
                    {downloadingId === att.id ? (
                      <span className="h-3 w-3 animate-spin rounded-full border border-muted-foreground border-t-foreground" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {trackingEvents.length > 0 && !isTrashed && (
          <div className="border border-border rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tracking</h3>
            <div className="space-y-2">
              {trackingEvents.map((event, i) => {
                const cfg = statusConfig[event.status]
                return (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className={cfg?.color || "text-muted-foreground"}>{cfg?.icon}</span>
                      <span className="font-medium text-foreground">{cfg?.label || event.status}</span>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {formatTrackingTime(event.time)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {!isTrashed && (
        <AlertDialog open={trashOpen} onOpenChange={setTrashOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Pindahkan ke Trash?</AlertDialogTitle>
              <AlertDialogDescription>
                Email akan dipindahkan ke Trash. Kamu bisa mengembalikannya kapan saja.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={trashing}>Batal</AlertDialogCancel>
              <AlertDialogAction disabled={trashing} onClick={handleTrash}>
                {trashing ? "Memindahkan..." : "Trash"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <AlertDialog open={purgeOpen} onOpenChange={setPurgeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Permanen?</AlertDialogTitle>
            <AlertDialogDescription>
              Email ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={purging}>Batal</AlertDialogCancel>
            <AlertDialogAction disabled={purging} onClick={handlePurge}>
              {purging ? "Menghapus..." : "Hapus Permanen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
