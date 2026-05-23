# Design System — ERP RRI

## 1. Filosofi

Enterprise-grade, accessible, konsisten. Semua komponen menggunakan **shadcn/ui** + **Tailwind CSS** + **CSS variables**.
Tidak ada hardcoded color, tidak ada raw HTML element untuk UI.

## 2. Color Tokens

Gunakan **selalu** CSS variables, jangan hardcoded Tailwind values:

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `bg-primary` | `#0F172A` | `#F8FAFC` | Navbar, sidebar, heading utama |
| `bg-secondary` | `#334155` | `#94A3B8` | Sub-heading |
| `bg-accent` | `#0369A1` | `#38BDF8` | Tombol submit, link, aksi utama |
| `bg-background` | `#F8FAFC` | `#0F172A` | Latar halaman |
| `bg-card` | `#FFFFFF` | `#1E293B` | Kartu, tabel, form |
| `text-foreground` | `#020617` | `#F1F5F9` | Body text |
| `text-muted-foreground` | `#475569` | `#94A3B8` | Label, placeholder |
| `bg-destructive` | `#DC2626` | `#F87171` | Hapus, error |
| `bg-muted` | `#F1F5F9` | `#1E293B` | Table header, section bg |
| `border-border` | `#E2E8F0` | `#334155` | Garis pemisah |

### Khusus status (tidak ada di shadcn default):
- `text-success` / `bg-success/10` — `#22C55E` (active, berhasil)
- `text-warning` / `bg-warning/10` — `#F59E0B` (pending, warning)

### Anti-patterns:
❌ `bg-blue-600`, `text-gray-500`, `border-gray-200`, `bg-green-100 text-green-800`
✅ `bg-primary`, `text-muted-foreground`, `border-border`, `bg-success/10 text-success`

## 3. Component Rules

### 3.1 Button
✅ Pakai `<Button>` dengan variant yang sesuai:
- `default` — aksi utama (submit, simpan)
- `destructive` — hapus, batalkan
- `outline` — aksi sekunder (batal, cancel)
- `ghost` — aksi ringan (edit inline)
- `link` — navigasi link

❌ Jangan pakai raw `<button>` dengan kelas Tailwind.

### 3.2 Input / Textarea
✅ Pakai `<Input>` dan `<Textarea>` dari shadcn.
❌ Jangan pakai raw `<input>` atau `<textarea>`.

### 3.3 Select
✅ Pakai `<Select>`, `<SelectTrigger>`, `<SelectContent>`, `<SelectItem>`.
❌ Jangan pakai raw `<select>` (tidak accessible, tidak konsisten styling).

### 3.4 Checkbox
✅ Pakai `<Checkbox>` dari shadcn.
❌ Jangan pakai raw `<input type="checkbox">`.

### 3.5 Table
✅ Pakai `<Table>`, `<TableHeader>`, `<TableBody>`, `<TableRow>`, `<TableHead>`, `<TableCell>`.
❌ Jangan pakai raw `<table>`, `<th>`, `<tr>`, `<td>`.

### 3.6 Badge
✅ Pakai `<Badge>` dengan variant:
- `default` — info umum
- `destructive` — non-active, error
- `secondary` — draft, pending
- `outline` — status ringan

❌ Jangan pakai `bg-green-100 text-green-800`.

### 3.7 Card
✅ Pakai `<Card>`, `<CardHeader>`, `<CardTitle>`, `<CardContent>`, `<CardFooter>`.
❌ Jangan pakai raw `<div>` dengan border dan shadow manual.

### 3.8 Skeleton
✅ Pakai `<Skeleton>` untuk loading state.
❌ Jangan pakai spinner `animate-spin border-4 border-blue-500`.

### 3.9 Dialog (Modal)
✅ Pakai `<Dialog>`, `<DialogTrigger>`, `<DialogContent>`, dll.
❌ Jangan pakai modal custom dengan state manual.

### 3.10 Form
✅ Pakai react-hook-form + Zod + shadcn `<Form>`, `<FormField>`, `<FormItem>`, `<FormLabel>`, `<FormControl>`, `<FormMessage>`.
❌ Jangan pakai `useState` untuk form state.

## 4. Typography

| Elemen | Class | Font |
|--------|-------|------|
| Page title | `text-2xl font-heading font-bold` | Lexend |
| Section title | `text-lg font-heading font-semibold` | Lexend |
| Card title | `text-xl font-heading font-semibold` | Lexend |
| Body | `text-sm` | Source Sans 3 |
| Label | `text-sm font-medium` | Source Sans 3 |
| Muted | `text-sm text-muted-foreground` | Source Sans 3 |

## 5. Icons

- Semua ikon dari **Lucide** (`lucide-react`)
- Ukuran konsisten: `h-4 w-4` di button, `h-5 w-5` di heading
- ❌ Dilarang pakai emoji sebagai ikon UI

## 6. Interaction

- Semua elemen interaktif: `cursor-pointer`
- Hover: `transition-colors duration-200`
- Focus ring: pakai `focus-visible:ring-3 focus-visible:ring-ring` (built-in shadcn)
- ❌ Jangan pakai `hover:scale-*` yang menyebabkan layout shift

## 7. Pattern Components (WAJIB dipakai)

### PageHeader
Untuk judul halaman + breadcrumb + tombol aksi:
```tsx
import { PageHeader } from '@/components/page-header'

<PageHeader
  title="Daftar Barang"
  description="Kelola data barang"
  actions={<Button>Tambah Barang</Button>}
/>
```

### StatusBadge
Untuk status dengan warna otomatis:
```tsx
import { StatusBadge } from '@/components/status-badge'

<StatusBadge status="active" />    // hijau
<StatusBadge status="inactive" />  // merah
<StatusBadge status="pending" />   // kuning
```

### FormActions
Untuk tombol submit + cancel konsisten:
```tsx
import { FormActions } from '@/components/form-actions'

<FormActions loading={isPending} onCancel={() => router.back()} />
```

## 8. Responsive Breakpoints

| Device | Class | Notes |
|--------|-------|-------|
| Mobile | default | 375px+ |
| Tablet | `md:` | 768px+ |
| Desktop | `lg:` | 1024px+ |
| Wide | `xl:` | 1440px+ |

## 9. Accessibility

- Setiap form input punya `<Label>` dengan `htmlFor`
- Error messages pakai `role="alert"`
- Focus states visible untuk keyboard navigation
- `prefers-reduced-motion` dihormati (Tailwind built-in)
- Color is NOT the only indicator (sertakan icon/text selain warna)

## 10. Dark Mode

Semua komponen SUDAH support dark mode via CSS variables.
Tidak perlu kode spesial — cukup pakai token seperti `bg-card`, `text-foreground`, dll.

## 11. Form Layout Patterns

### 11.1 Form Structure (shadcn/ui pattern)
Import dari single file:
```tsx
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

const form = useForm<FormValues>({ resolver: zodResolver(schema) });

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
    <FormField
      control={form.control}
      name="fieldName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Label</FormLabel>
          <FormControl>
            <Input {...field} placeholder="placeholder" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

### 11.2 Number Input dengan min/step
Untuk input type="number", jangan spread `field` langsung. Gunakan:
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
- Gunakan `FormMessage` untuk menampilkan error validation
- Error otomatis terhubung dengan `react-hook-form` via FormField context
- Hapus manual error passing - `FormMessage` sudah membaca dari form state

### 11.4 Loading State in Forms
- Gunakan `Button` dengan variant `default` dan prop `disabled={loading}`
- Tambah `Loader2` icon di dalam button saat loading
- Form actions pattern:
```tsx
<Button type="submit" disabled={loading}>
  {loading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Menyimpan...
    </>
  ) : (
    'Simpan'
  )}
</Button>
```

## 12. Toast/Notification Patterns

### 12.1 Success Toast
```tsx
import { toast } from 'sonner'

toast.success('Barang berhasil ditambahkan!')
```

### 12.2 Error Toast
```tsx
toast.error('Gagal menyimpan data')
```

### 12.3 Loading Toast (untuk operasi async)
```tsx
const toastId = toast.loading('Memproses...')
// setelah selesai
toast.success(toastId, 'Berhasil!')
// atau
toast.error(toastId, 'Gagal!')
```

### 12.4 Position dan Durasi
- Position: top-right (default sonner config)
- Duration: 3000ms untuk success/error, auto-dismiss untuk loading
- Gunakan `toast.dismiss()` untuk menutup secara manual

## 13. Page Layout Patterns

### 13.1 Standard Page Padding
```tsx
<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
  {/* konten halaman */}
</div>
```

### 13.2 Section Spacing
- Antar section: `mb-8` (section bawah) atau `space-y-8` (dalam container)
- Antar elemen dalam form: `space-y-4` atau `mb-4`
- Antar baris grid: `gap-4` atau `gap-6`

### 13.3 Card Layout
```tsx
<Card className="mb-6">
  <CardHeader>
    <CardTitle>Judul Seksi</CardTitle>
  </CardHeader>
  <CardContent>
    {/* isi konten */}
  </CardContent>
</Card>
```

## 14. Table/Data Display Patterns

### 14.1 Basic Table
```tsx
import { Table } from '@/components/ui/table'
import { TableHeader } from '@/components/ui/table-header'
import { TableBody } from '@/components/ui/table-body'
import { TableHead } from '@/components/ui/table-head'
import { TableRow } from '@/components/ui/table-row'
import { TableCell } from '@/components/ui/table-cell'

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nama Kolom</TableHead>
      {/* lebih banyak kolom */}
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map(item => (
      <TableRow key={item.id}>
        <TableCell>{item.nama}</TableCell>
        {/* lebih banyak sel */}
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### 14.2 Table Variants
- Table biasa: tanpa prop khusus
- Table dengan garis: tambah `className="border"`
- Table striped: tambah `className="bg-muted/50"` pada baris genap
- Table kompakt: gunakan `TableCell` dengan padding lebih kecil (`px-3 py-2`)

### 14.3 Empty State Table
```tsx
{data.length === 0 ? (
  <div className="text-center py-8">
    <p className="text-muted-foreground">Belum ada data</p>
  </div>
) : (
  <Table>
    {/* tabel dengan data */}
  </Table>
)}
```

## 15. Loading States & Skeleton

### 15.1 Skeleton untuk Konten
```tsx
import { Skeleton } from '@/components/ui/skeleton'

<div className="space-y-4">
  <Skeleton className="h-4 w-full" /> {/* untuk baris teks */}
  <Skeleton className="h-8 w-full" /> {/* untuk konten lebih tinggi */}
</div>
```

### 15.2 Page Loading
- Gunakan halaman loading skeleton saat data sedang di-fetch
- Tampilkan konten sesaat setelah data siap
- Hindari flashing dengan menunda tampilan konten minimal 300ms
