export function formatDateWIB(date: Date): string {
  // Format date/time in WIB (Asia/Jakarta) regardless of server timezone
  return date.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' WIB'
}
