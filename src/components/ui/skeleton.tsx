import { cn } from '@/lib/utils'

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  )
}

export function TableSkeleton({ 
  rows = 5, 
  cols = 5,
  headerHidden = false,
  actionsCols = 0,
  colWidths = [] as number[]
}) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {!headerHidden && (
        <div className="border-b bg-muted/50 p-3 flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton 
              key={i} 
              className={cn('h-4', colWidths[i] ? `w-${colWidths[i]}` : 'flex-1')} 
            />
          ))}
          {actionsCols > 0 && <div className="ml-auto flex gap-1">{Array.from({ length: actionsCols }).map((_, i) => (<Skeleton key={i} className="h-8 w-8 rounded" />))}</div>}
        </div>
      )}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={cn('border-b last:border-b-0 p-3 flex gap-4', headerHidden && 'first:pt-4')}>
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton 
              key={i} 
              className={cn('h-4', colWidths[i] ? `w-${colWidths[i]}` : 'flex-1')} 
            />
          ))}
          {actionsCols > 0 && <div className="ml-auto flex gap-1">{Array.from({ length: actionsCols }).map((_, i) => (<Skeleton key={i} className="h-8 w-8 rounded" />))}</div>}
        </div>
      ))}
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="flex justify-between items-start">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded" />
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32 mt-1" />
        </div>
      </div>
      <div className="border rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={i === 5 ? 'col-span-2' : ''}>
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-5 w-32" />
            </div>
          ))}
        </div>
      </div>
      <div className="border rounded-lg p-6 space-y-4">
        <Skeleton className="h-5 w-24" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
      <div className="border rounded-lg p-6 space-y-4">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  )
}

export function InvoiceDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
      <div className="border rounded-lg p-6 space-y-4">
        <Skeleton className="h-5 w-32" />
        <div className="flex gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-3 w-12 mt-1" />
            </div>
          ))}
        </div>
      </div>
      <div className="border rounded-lg p-6 space-y-4">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-2 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-5 w-40" />
            </div>
          ))}
        </div>
      </div>
      <div className="border rounded-lg p-6 space-y-4">
        <Skeleton className="h-5 w-40" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
      <div className="border rounded-lg p-6 space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <div className="border rounded-lg p-6 space-y-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  )
}

export function CalendarSkeleton() {
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => (
          <Skeleton key={d} className="h-8 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-md" />
        ))}
      </div>
    </div>
  )
}