"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Upload, FileText, Trash2, ExternalLink, Eye } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatDateTime } from "@/lib/utils/date"

export interface DocumentFile {
  id: string
  file_name: string
  file_url: string
  drive_file_id?: string | null
  uploaded_at: string
}

interface FileUploadProps {
  documents: DocumentFile[]
  onUpload: (file: File) => Promise<void>
  onDelete: (docId: string) => Promise<void>
  uploading?: boolean
  accept?: string
  maxSizeMB?: number
}

const OFFICE_EXTS = ['.xlsx', '.xls', '.doc', '.docx', '.ppt', '.pptx']

function isOfficeFile(name: string) {
  const ext = '.' + name.split('.').pop()?.toLowerCase()
  return OFFICE_EXTS.includes(ext)
}

function getViewerUrl(fileUrl: string, fileName: string) {
  if (isOfficeFile(fileName)) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`
  }
  return fileUrl
}

export function FileUpload({ documents, onUpload, onDelete, uploading = false, accept = ".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls", maxSizeMB = 10 }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase()
    const allowed = accept.split(",").map((s) => s.trim().toLowerCase())
    if (!allowed.some((a) => ext === a || file.type.startsWith("application/" + a.replace(".", "")) || file.type.startsWith("image/" + a.replace(".", "")))) {
      setError(`Tipe file ${file.type || ext} tidak didukung`)
      return
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Ukuran file maksimal ${maxSizeMB}MB`)
      return
    }
    setError(null)
    onUpload(file)
  }, [onUpload, accept, maxSizeMB])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    if (inputRef.current) inputRef.current.value = ""
  }, [handleFile])

  return (
    <div className="space-y-3">
      <div
        className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer ${
          dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleInput} />
        <Upload className={`h-8 w-8 mb-2 ${dragOver ? "text-primary" : "text-muted-foreground"}`} />
        <p className="text-sm font-medium">
          {dragOver ? "Lepaskan file di sini" : "Seret file ke sini atau klik untuk upload"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          PDF, JPG, PNG, WebP, Excel (maks. {maxSizeMB}MB)
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Mengupload...
        </div>
      )}

      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{doc.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(doc.uploaded_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {isOfficeFile(doc.file_name) ? (
                  <>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" asChild>
                            <a href={getViewerUrl(doc.file_url, doc.file_name)} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Preview</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" asChild>
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Download</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" asChild>
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Buka file</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <Button variant="ghost" size="icon" onClick={() => onDelete(doc.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
