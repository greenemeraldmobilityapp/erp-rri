const WIB = { timeZone: 'Asia/Jakarta' } as const

function toDate(date: string | Date): Date {
  if (typeof date === 'string') {
    if (!date.endsWith('Z') && !/[\+\-]\d{2}:\d{2}$/.test(date) && !/[\+\-]\d{4}$/.test(date)) {
      return new Date(date + 'Z')
    }
  }
  return new Date(date)
}

export function formatDateTime(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return toDate(date).toLocaleString('id-ID', { ...options, ...WIB })
}

export function formatDateTimeShort(date: string | Date): string {
  return formatDateTime(date, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function formatDateOnly(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return toDate(date).toLocaleDateString('id-ID', { ...options, ...WIB })
}

export function formatDateFull(date: string | Date): string {
  return toDate(date).toLocaleDateString('id-ID', {
    year: 'numeric', month: 'long', day: 'numeric', ...WIB,
  })
}

export function formatDateShort(date: string | Date): string {
  return toDate(date).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', ...WIB,
  })
}
