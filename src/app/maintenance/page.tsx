"use client"

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
      <div className="text-center space-y-6 p-8 max-w-md">
        <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
          <svg
            className="h-10 w-10 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Sedang Perbaikan</h1>
        <p className="text-muted-foreground text-lg">
          Sistem sedang dalam perawatan. Silakan coba lagi beberapa saat.
        </p>
        <div className="pt-4">
          <div className="w-2 h-2 bg-destructive rounded-full animate-pulse mx-auto" />
        </div>
      </div>
    </div>
  )
}
