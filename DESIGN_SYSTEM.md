# Design System — ERP RRI
## 1. Filosofi
Enterprise-grade, accessible, konsisten, dan **Premium Luxury**. Semua komponen menggunakan **shadcn/ui** + **Tailwind CSS** + **CSS variables**.
Tidak ada hardcoded color, tidak ada raw HTML element untuk UI. Kemewahan aplikasi dibangun melalui konsistensi, optimalisasi *whitespace*, tipografi yang presisi, dan transisi mikro yang halus.
### 🛠️ Aturan Emas Distribusi Warna (The 60-30-10 Rule)
Untuk menjaga impresi *high-end corporate*, distribusi visual wajib mematuhi proporsi berikut:
 * **60% (Dominan - Netral Bersih):** Didominasi oleh kanvas latar belakang (bg-background) dan kontainer utama (bg-card). Berikan ruang bernapas (*whitespace*) yang luas agar data tidak padat dan terlihat eksklusif.
 * **30% (Struktur & Tekstur):** Diisi oleh area sekunder (bg-secondary), batas pemisah (border-border), dan ketajaman teks utama (text-foreground).
 * **10% (Aksen Mewah):** Warna identitas korporat (bg-primary / #0000FF) dan aksen perak (bg-accent / #A1A1AA) **hanya boleh muncul maksimal 10%** dari total luas visual layar untuk mempertahankan elemen kejutan (*pop of color*) pada komponen kritikal (logo, tombol utama, indikator aktif).
## 2. Color Tokens
Gunakan **selalu** CSS variables, jangan hardcoded Tailwind values:
| Token | Light | Dark | Usage |
|---|---|---|---|
| bg-primary | #0000FF | #3B82F6 | Navbar, sidebar, tombol utama, aksen aktif (Maksimal 10% visual) |
| text-primary-foreground | #FFFFFF | #FFFFFF | Text on primary bg |
| bg-secondary | #F3F4F6 | #374151 | Sub-heading, latar sekunder, track area |
| text-secondary-foreground | #111827 | #F9FAFB | Text on secondary bg |
| bg-accent | #A1A1AA | #D1D5DB | Aksen silver, premium highlight, tombol sekunder |
| text-accent-foreground | #111827 | #111827 | Text on accent bg |
| bg-background | #F9FAFB | #111827 | Latar kanvas halaman (60% dominasi visual) |
| text-foreground | #111827 | #F9FAFB | Body text utama (Tajam & kontras tinggi) |
| text-muted-foreground | #6B7280 | #9CA3AF | Label, placeholder, deskripsi, teks sekunder |
| bg-muted | #F3F4F6 | #1F2937 | Seksi penunjang, alternating rows |
| bg-card | #FFFFFF | #1F2937 | Kartu, kontainer form, kontainer tabel |
| text-card-foreground | #111827 | #F9FAFB | Text on card bg |
| bg-destructive | #EF4444 | #F87171 | Hapus, error, tindakan pembatalan |
| text-destructive-foreground | #FFFFFF | #111827 | Text on destructive bg |
| border-border | #E5E7EB | #374151 | Garis pemisah ultra-tipis |
### Khusus status (tidak ada di shadcn default):
 * text-success / bg-success/10 — #22C55E (active, berhasil)
 * text-warning / bg-warning/10 — #F59E0B (pending, warning)
### Anti-patterns:
❌ bg-blue-600, text-gray-500, border-gray-200, bg-green-100 text-green-800
✅ bg-primary, text-muted-foreground, border-border, bg-success/10 text-success
## 3. Component Rules
### 3.1 Button
✅ Pakai <Button> dengan variant yang sesuai. Untuk varian default (Primary), tambahkan *micro-gradient* dan *inner shadow* halus di dalam kelas global/lokal untuk membuang kesan *flat* murahan:
 * default — Aksi utama (submit, simpan).
   *Luxury Styling:* bg-gradient-to-b from-[#0000FF] to-[#0000D9] shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_1px_2px_rgba(0,0,0,0.1)] hover:opacity-95
 * destructive — Hapus, batalkan permanen.
 * cancel — Batalkan formulir (Batal). `bg-red-500/70 text-white hover:bg-red-500/90`
 * back — Kembali ke halaman sebelumnya. `bg-zinc-500/70 text-white hover:bg-zinc-500/90`
 * outline — Aksi sekunder (batal, cancel).
 * ghost — Aksi ringan, opsi jajaran tabel (edit inline).
 * link — Navigasi tautan teks.
❌ Jangan pakai raw <button> dengan kelas Tailwind.
### 3.2 Input / Textarea
✅ Pakai <Input> dan <Textarea> dari shadcn.
❌ Jangan pakai raw <input> atau <textarea>.
### 3.3 Select
✅ Pakai <Select>, <SelectTrigger>, <SelectContent>, <SelectItem>.
❌ Jangan pakai raw <select>.
### 3.4 Checkbox
✅ Pakai <Checkbox> dari shadcn.
❌ Jangan pakai raw <input type="checkbox">.
### 3.5 Table
✅ Pakai <Table>, <TableHeader>, <TableBody>, <TableRow>, <TableHead>, <TableCell>.
✅ **TableHead** (`table.tsx`): `bg-primary/5 text-primary font-medium` — global via base component. Light: `#0000FF` at 5% bg / `#0000FF` text. Dark: `#3B82F6` at 5% bg / `#3B82F6` text.
❌ Jangan pakai raw <table>, <th>, <tr>, <td>.
### 3.6 Badge
✅ Pakai <Badge> dengan variant:
 * default — info umum / netral
 * destructive — non-active, error fatal
 * secondary — draft, pending korporat
 * outline — status entitas ringan
❌ Jangan pakai bg-green-100 text-green-800.
### 3.7 Card
✅ Pakai <Card>, <CardHeader>, <CardTitle>, <CardContent>, <CardFooter>.
*Luxury Rule:* Tambahkan efek bayangan berlapis ambyar (*soft ambient shadows*) untuk memisahkan elevasi kartu secara elegan tanpa garis tebal: shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_15px_-3px_rgba(0,0,0,0.01),0_4px_6px_-4px_rgba(0,0,0,0.01)]
❌ Jangan pakai raw <div> dengan border dan shadow manual.
### 3.8 Skeleton
✅ Pakai <Skeleton> untuk loading state (efek miring pulse mewah).
❌ Jangan pakai spinner animate-spin border-4 border-blue-500.
### 3.9 Dialog (Modal)
✅ Pakai <Dialog>, <DialogTrigger>, <DialogContent>, dll.
❌ Jangan pakai modal custom dengan state manual.
### 3.10 Form
✅ Pakai react-hook-form + Zod + shadcn <Form>, <FormField>, <FormItem>, <FormLabel>, <FormControl>, <FormMessage>.
❌ Jangan pakai useState untuk form state.
### 3.11 Sheet (Side Panel)
✅ Pakai <Sheet>, <SheetTrigger>, <SheetContent>, <SheetHeader>, <SheetTitle>, <SheetDescription>.
❌ Jangan pakai Dialog untuk content yang slides from side.
### 3.12 Tabs
✅ Pakai <Tabs>, <TabsList>, <TabsTrigger>, <TabsContent>.
❌ Jangan pakai custom tab implementation dengan state manual.
### 3.13 AlertDialog (Destructive Confirmation)
✅ Pakai <AlertDialog>, <AlertDialogTrigger>, <AlertDialogContent>, <AlertDialogHeader>, <AlertDialogFooter>, <AlertDialogCancel>, <AlertDialogAction>.
❌ Jangan pakai Dialog untuk konfirmasi sederhana.
### 3.14 DropdownMenu
✅ Pakai <DropdownMenu>, <DropdownMenuTrigger>, <DropdownMenuContent>, <DropdownMenuItem>, <DropdownMenuSeparator>.
❌ Jangan pakai Popover untuk action lists.
### 3.15 Tooltip
✅ Pakai <Tooltip>, <TooltipTrigger>, <TooltipContent> dengan <TooltipProvider> wrapper.
❌ Jangan pakai title attribute untuk tooltips.
### 3.16 Command (Searchable List)
✅ Pakai <Command>, <CommandInput>, <CommandList>, <CommandEmpty>, <CommandGroup>, <CommandItem>.
❌ Jangan pakai Input dengan custom dropdown untuk search.
### 3.17 Sidebar (Navigation)
✅ Pakai <SidebarProvider>, <Sidebar>, <SidebarHeader>, <SidebarContent>, <SidebarFooter>, <SidebarTrigger>.
✅ **Nav link active state:** `bg-primary text-primary-foreground font-medium` — global via CSS variable `--primary`.
   Light: `#0000FF` — Dark: `#3B82F6` (otomatis mengikuti `globals.css`).
❌ Jangan pakai custom sidebar implementation.
### 3.18 Chart (Data Visualization)
✅ Pakai <ChartContainer>, <ChartTooltip>, #0000FF atau #3B82F6 kustom tema pada Recharts integration.
❌ Jangan pakai Recharts components directly tanpa wrapper.
## 4. Typography
Aturan spasi huruf (*letter-spacing*) wajib diterapkan pada judul entitas utama untuk memunculkan karakteristik tata letak laporan finansial kelas atas (Premium Typography):
| Elemen | Class | Font |
|---|---|---|
| Page title | text-2xl font-heading font-bold tracking-tight | Lexend |
| Section title | text-lg font-heading font-semibold tracking-tight | Lexend |
| Card title | text-xl font-heading font-semibold tracking-tight | Lexend |
| Body | text-sm leading-relaxed | Source Sans 3 |
| Label | text-xs font-semibold uppercase tracking-wider text-muted-foreground | Source Sans 3 |
| Table Head | text-sm font-medium bg-primary/5 text-primary | Source Sans 3 |
| Muted | text-sm text-muted-foreground | Source Sans 3 |
## 5. Icons
 * Semua ikon dari **Lucide** (lucide-react)
 * Ukuran konsisten: h-4 w-4 di button, h-5 w-5 di heading
 * *Spacing Rule:* Jika berdampingan dengan teks, wajib menyertakan margin pemisah ikon yang presisi (Teks kanan: mr-2 h-4 w-4, Teks kiri: ml-2 h-4 w-4).
 * ❌ Dilarang pakai emoji sebagai ikon UI.
## 6. Interaction
 * Semua elemen interaktif: cursor-pointer
 * Hover: transition-all duration-200 ease-in-out
 * Focus ring: pakai focus-visible:ring-3 focus-visible:ring-ring (built-in shadcn)
 * ❌ Jangan pakai hover:scale-* yang menyebabkan layout shift kasar pada panel ERP.
## 7. Pattern Components (WAJIB dipakai)
### PageHeader
Header melayang premium dengan fitur *glassmorphism backdrop blur*:
```tsx
// @/components/page-header.tsx
import { PageHeader } from '@/components/page-header'

<div className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
  <PageHeader
    title="Daftar Realisasi Anggaran"
    description="Kelola dan pantau realisasi keuangan RRI"
    actions={<Button className="bg-gradient-to-b from-[#0000FF] to-[#0000D9] ...">Tambah Transaksi</Button>}
  />
</div>

```
### StatusBadge
```tsx
import { StatusBadge } from '@/components/status-badge'

<StatusBadge status="active" /> // hijau semantik #22C55E
<StatusBadge status="inactive" /> // merah semantik #EF4444
<StatusBadge status="pending" /> // kuning semantik #F59E0B

```
### FormActions
```tsx
import { FormActions } from '@/components/form-actions'

<FormActions loading={isPending} onCancel={() => router.back()} />

```
### Luxury Metric Card (Dashboard Asset & Finansial)
Komponen wajib untuk menampilkan performa metrik data dengan aksen pembatas garis atas berwarna perak (#A1A1AA) serta porsi visual warna utama yang seimbang:
```tsx
// @/components/luxury-metric-card.tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { TrendingUp, ArrowUpRight } from 'lucide-react'

export function LuxuryMetric Card() {
  return (
    <Card className="overflow-hidden border-t-2 border-t-[#A1A1AA] bg-card shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Total Pendapatan LPP RRI
        </CardTitle>
        <div className="rounded-full bg-[#0000FF]/10 p-2 text-[#0000FF] dark:bg-[#3B82F6]/10 dark:text-[#3B82F6]">
          <TrendingUp className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-heading tracking-tight text-foreground">
          Rp 1.250.000.000
        </div>
        <p className="text-xs text-success flex items-center mt-1 font-medium">
          <ArrowUpRight className="mr-1 h-3 w-3" /> +12.5% dari bulan lalu
        </p>
      </CardContent>
    </Card>
  )
}

```
## 8. Responsive Breakpoints
| Device | Class | Notes |
|---|---|---|
| Mobile | default | 375px+ |
| Tablet | md: | 768px+ |
| Desktop | lg: | 1024px+ |
| Wide | xl: | 1440px+ |
## 9. Accessibility
 * Setiap form input punya <Label> dengan htmlFor
 * Error messages pakai role="alert"
 * Focus states visible untuk keyboard navigation
 * prefers-reduced-motion dihormati (Tailwind built-in)
 * Color is NOT the only indicator (sertakan icon/text selain warna tunggal)
## 10. Dark Mode & Chromostereopsis Prevention
Semua komponen SUDAH support dark mode via CSS variables.
*Pencegahan Kelelahan Mata:* Sesuai token warna, di dalam mode gelap variabel --primary otomatis bertransisi dari biru pekat #0000FF menjadi **#3B82F6**. Hal ini dilakukan secara sengaja demi mencegah distorsi penglihatan akibat kontras warna murni ekstrem di atas permukaan gelap gulita (#111827). Jangan pernah memaksa penggunaan warna #0000FF pada teks panjang di dalam mode gelap.
## 11. Form Layout Patterns
### 11.1 Form Structure (shadcn/ui pattern)
```tsx
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const form = useForm<FormValues>({ resolver: zodResolver(schema) });

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
    <FormField
      control={form.control}
      name="fieldName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Nama Lengkap Anggota</FormLabel>
          <FormControl>
            <Input {...field} placeholder="Masukkan nama sesuai SK" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>

```
### 11.2 Number Input dengan min/step
```tsx
<Input
  type="number"
  min={0}
  step={0.01}
  value={field.value != null ? String(field.value) : ''}
  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
  onBlur={field.onBlur}
  name={field.name}
  ref={field.ref}
/>

```
### 11.3 Validation Error Display
 * Gunakan FormMessage untuk menampilkan error validation.
 * Error otomatis terhubung dengan react-hook-form via FormField context.
### 11.4 Loading State in Forms
 * Gunakan FormActions component untuk submit button dengan loading state.
## 12. Toast/Notification Patterns
### 12.0 Toaster Component (WAJIB)
```tsx
// app/layout.tsx
import { Toaster } from 'sonner'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  )
}

```
### 12.1 Toast with Loading State (sonner v2)
```tsx
import { toast } from 'sonner'

const onSubmit = async (data: FormValues) => {
  setLoading(true)
  const toastId = toast.loading('Menyimpan cetak dokumen...')
  try {
    await apiFetch('/api/v1/...', { method: 'POST', body: JSON.stringify(data) })
    toast.success('Dokumen berhasil diterbitkan!', { id: toastId })
    form.reset()
    setTimeout(() => router.push('/...'), 1500)
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan sistem', { id: toastId })
  } finally {
    setLoading(false)
  }
}

```
## 13. Page Layout Patterns
### 13.1 Standard Page Padding
```tsx
<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
  {/* konten halaman */}
</div>

```
### 13.2 Section Spacing & Card Layout
Setiap blok grup informasi wajib dibungkus dalam wadah <Card> mewah dengan struktur margin yang konsisten:
```tsx
<Card className="shadow-[0_1px_3px_rgba(0,0,0,0.05)] border-border">
  <CardHeader>
    <CardTitle>Rincian Anggaran Distribusi Program</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* isi formulir atau data berkelompok */}
  </CardContent>
</Card>

```
## 14. Table/Data Display Patterns
### 14.1 Basic Table
```tsx
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Kode Akun</TableHead>
      <TableHead>Deskripsi Mata Anggaran</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map(item => (
      <TableRow key={item.id} className="hover:bg-muted/40 transition-colors">
        <TableCell className="font-medium">{item.kode}</TableCell>
        <TableCell>{item.deskripsi}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>

```
### 14.2 Empty State Table
```tsx
{data.length === 0 ? (
  <div className="text-center py-12 border border-dashed rounded-lg bg-muted/20">
    <Inbox className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
    <p className="text-sm font-medium text-muted-foreground">Belum ada sirkulasi data terkini</p>
  </div>
) : (
  <Table>{/* Tabel berisi manifest data */}</Table>
)}

```
## 15. Loading States & Skeleton
### 15.1 Skeleton untuk Konten
```tsx
import { Skeleton } from '@/components/ui/skeleton'

<div className="space-y-3 p-4 bg-card rounded-xl border">
  <Skeleton className="h-5 w-1/3 rounded-md" /> 
  <Skeleton className="h-4 w-full rounded-md" /> 
</div>

```
## 16. Performance Guidelines
### 16.1 Import Components Individually
```tsx
// ✅ Good
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'

```
### 16.2 Lazy Load Heavy Components
```tsx
const HeavyChartDialog = lazy(() => import('./HeavyChartDialog'))

```
## 17. Common Component Patterns Summary
| Use Case | Component(s) |
|---|---|
| Form input | Form + FormField + FormControl + Input |
| Dropdown select | Select + SelectTrigger + SelectValue + SelectContent + SelectItem |
| Loading feedback | Skeleton (animate-pulse) |
| Inline confirmation | AlertDialog |
| Side panel/drawer | Sheet |
| Tabbed content | Tabs |
| Action menu / Row Option | DropdownMenu |
| Tooltip/hint | Tooltip + TooltipProvider |
| Toast notification | toast dari sonner (Toaster di root layout) |
| Data table | Table + TanStack Table |
| Metrik Analitik Utama | Luxury Metric Card |
| Searchable list | Command |
