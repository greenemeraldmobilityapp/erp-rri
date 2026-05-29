"use client";

import { useState, useEffect } from 'react';
import { apiFetch, apiFetchFormData } from '@/lib/api/client';
import { useRouter, usePathname } from 'next/navigation';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Loader2, Plus, Trash2, Upload, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { ConfirmLeaveDialog } from '@/components/confirm-leave-dialog';
import { FormActions } from '@/components/form-actions';
import { PageHeader } from '@/components/page-header';

const kontrakSchema = z.object({
  customerId: z.string().min(1, { message: "Customer harus dipilih" }),
  nomorKontrak: z.string().optional(),
  nama: z.string().min(2, { message: "Nama kontrak harus diisi" }),
  tanggalMulai: z.string().optional(),
  tanggalSelesai: z.string().optional(),
  tanggalTandaTangan: z.string().optional(),
  penandatanganRriNama: z.string().optional(),
  penandatanganRriJabatan: z.string().optional(),
  penandatanganCustomerNama: z.string().optional(),
  penandatanganCustomerJabatan: z.string().optional(),
  catatan: z.string().optional(),
  isActive: z.boolean().default(true),
  items: z.array(z.object({
    barang_id: z.string().nullable().optional(),
    kode_barang: z.string().min(1, "Kode barang harus diisi"),
    nama_barang: z.string().min(1, "Nama barang harus diisi"),
    satuan: z.string().min(1, "Satuan harus diisi"),
    harga_satuan: z.coerce.number().nonnegative("Harga harus >= 0"),
  })).optional(),
});

type KontrakFormValues = z.input<typeof kontrakSchema>;

interface KontrakItem {
  id: string
  barang_id: string | null
  kode_barang: string | null
  nama_barang: string | null
  satuan: string | null
  harga_satuan: number
}

export default function EditKontrakPage() {
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split('/').at(-2);

  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customerOptions, setCustomerOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [barangOptions, setBarangOptions] = useState<Array<{ value: string; label: string; satuan: string }>>([]);
  const [documents, setDocuments] = useState<Array<{ id: string; file_name: string; file_url: string }>>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const form = useForm<KontrakFormValues>({
    resolver: zodResolver(kontrakSchema),
    defaultValues: {
      nomorKontrak: '',
      tanggalMulai: '',
      tanggalSelesai: '',
      tanggalTandaTangan: '',
      penandatanganRriNama: '',
      penandatanganRriJabatan: '',
      penandatanganCustomerNama: '',
      penandatanganCustomerJabatan: '',
      catatan: '',
      isActive: true,
      items: [],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });
  const { confirmLeave, showDialog, handleConfirm, handleCancel } = useUnsavedChanges(form.formState.isDirty);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      try {
        const [customersRes, barangRes] = await Promise.all([
          apiFetch<Array<{ id: string; kode: string; nama: string }>>('/api/v1/master/customer'),
          apiFetch<Array<{ id: string; kode: string; nama: string; satuan: string }>>('/api/v1/master/barang'),
        ])
        if (cancelled) return;
        setCustomerOptions((customersRes.data ?? []).map(c => ({ value: c.id, label: `[${c.kode}] ${c.nama}` })));
        setBarangOptions((barangRes.data ?? []).map(b => ({ value: b.id, label: `[${b.kode}] ${b.nama}`, satuan: b.satuan })));

        const [kontrakRes, itemsRes, docsRes] = await Promise.all([
          apiFetch<{
            customer_id: string; nama: string; nomor_kontrak: string | null;
            tanggal_mulai: string | null; tanggal_selesai: string | null;
            tanggal_tanda_tangan: string | null;
            penandatangan_rri_nama: string | null; penandatangan_rri_jabatan: string | null;
            penandatangan_customer_nama: string | null; penandatangan_customer_jabatan: string | null;
            catatan: string | null;
            is_active: boolean;
          }>(`/api/v1/master/kontrak/${id}`),
          apiFetch<KontrakItem[]>(`/api/v1/master/kontrak/${id}/items`),
          apiFetch<Array<{ id: string; file_name: string; file_url: string }>>(`/api/v1/master/kontrak/${id}/documents?jenis=kontrak`),
        ])

        if (cancelled) return;
        const kontrak = kontrakRes.data
        const kontrakItems = itemsRes.data ?? []
        setDocuments(docsRes.data ?? [])

        if (kontrak) {
          form.reset({
            customerId: kontrak.customer_id,
            nomorKontrak: kontrak.nomor_kontrak || '',
            nama: kontrak.nama,
            tanggalMulai: kontrak.tanggal_mulai || '',
            tanggalSelesai: kontrak.tanggal_selesai || '',
            tanggalTandaTangan: kontrak.tanggal_tanda_tangan || '',
            penandatanganRriNama: kontrak.penandatangan_rri_nama || '',
            penandatanganRriJabatan: kontrak.penandatangan_rri_jabatan || '',
            penandatanganCustomerNama: kontrak.penandatangan_customer_nama || '',
            penandatanganCustomerJabatan: kontrak.penandatangan_customer_jabatan || '',
            catatan: kontrak.catatan || '',
            isActive: kontrak.is_active,
            items: kontrakItems.map(item => ({
              barang_id: item.barang_id,
              kode_barang: item.kode_barang || '',
              nama_barang: item.nama_barang || '',
              satuan: item.satuan || '',
              harga_satuan: item.harga_satuan,
            })),
          });
        }
      } catch (err) {
        if (!cancelled) toast.error(err instanceof Error ? err.message : 'Gagal memuat data kontrak');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, form]);

  async function handleUploadDoc(file: File) {
    setUploadingDoc(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('jenis_dokumen', 'kontrak')
      const res = await apiFetchFormData<{ id: string; file_name: string; file_url: string }>(`/api/v1/master/kontrak/${id}/documents`, formData)
      setDocuments(prev => [res.data, ...prev])
      toast.success('File berhasil diupload')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal upload file')
    } finally {
      setUploadingDoc(false)
    }
  }

  async function handleDeleteDoc(docId: string) {
    try {
      await apiFetch(`/api/v1/master/kontrak/${id}/documents?docId=${docId}`, { method: 'DELETE' })
      setDocuments(prev => prev.filter(d => d.id !== docId))
      toast.success('File berhasil dihapus')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal hapus file')
    }
  }

  const onSubmit = async (data: KontrakFormValues) => {
    if (!id) return;
    setLoading(true);
    const toastId = toast.loading('Memperbarui kontrak...');
    try {
      await apiFetch(`/api/v1/master/kontrak/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          customer_id: data.customerId,
          nomor_kontrak: data.nomorKontrak || null,
          nama: data.nama,
          tanggal_mulai: data.tanggalMulai || null,
          tanggal_selesai: data.tanggalSelesai || null,
          tanggal_tanda_tangan: data.tanggalTandaTangan || null,
          penandatangan_rri_nama: data.penandatanganRriNama || null,
          penandatangan_rri_jabatan: data.penandatanganRriJabatan || null,
          penandatangan_customer_nama: data.penandatanganCustomerNama || null,
          penandatangan_customer_jabatan: data.penandatanganCustomerJabatan || null,
          catatan: data.catatan || null,
          is_active: data.isActive,
          items: (data.items ?? []).map(item => ({
            barang_id: item.barang_id || null,
            kode_barang: item.kode_barang,
            nama_barang: item.nama_barang,
            satuan: item.satuan,
            harga_satuan: item.harga_satuan,
          })),
        }),
      });
      toast.success('Kontrak berhasil diperbarui!', { id: toastId });
      setTimeout(() => router.push(`/dashboard/master/kontrak/${id}`), 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return (
    <div className="mx-auto max-w-3xl py-8">
      <PageHeader title="Edit Kontrak" />
      <div className="min-h-[200px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Edit Kontrak"
        description="Formulir untuk mengedit data kontrak"
        actions={
          <Button variant="back" onClick={() => confirmLeave(() => router.push(`/dashboard/master/kontrak/${id}`))}>
            Kembali
          </Button>
        }
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-4">
            <FormField control={form.control} name="customerId" render={({ field }) => (
              <FormItem><FormLabel>Customer *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Pilih customer" /></SelectTrigger></FormControl>
                  <SelectContent>{customerOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="nomorKontrak" render={({ field }) => (
              <FormItem><FormLabel>Nomor Kontrak</FormLabel><FormControl><Input {...field} placeholder="C-BJS-25-XXXX-XXXX" /></FormControl><FormMessage /></FormItem>
            )} />
          </div>

          <FormField control={form.control} name="nama" render={({ field }) => (
            <FormItem><FormLabel>Nama Kontrak *</FormLabel><FormControl><Input {...field} placeholder="Nama/kode kontrak" /></FormControl><FormMessage /></FormItem>
          )} />

          <div className="grid md:grid-cols-3 gap-4">
            <FormField control={form.control} name="tanggalMulai" render={({ field }) => (
              <FormItem><FormLabel>Tanggal Mulai</FormLabel><FormControl><DatePicker value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="tanggalSelesai" render={({ field }) => (
              <FormItem><FormLabel>Tanggal Selesai</FormLabel><FormControl><DatePicker value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="tanggalTandaTangan" render={({ field }) => (
              <FormItem><FormLabel>Tgl Tanda Tangan</FormLabel><FormControl><DatePicker value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium">Penandatangan RRI</p>
              <FormField control={form.control} name="penandatanganRriNama" render={({ field }) => (
                <FormItem><FormLabel>Nama</FormLabel><FormControl><Input {...field} placeholder="Nama penandatangan RRI" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="penandatanganRriJabatan" render={({ field }) => (
                <FormItem><FormLabel>Jabatan</FormLabel><FormControl><Input {...field} placeholder="Jabatan" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="border rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium">Penandatangan Customer</p>
              <FormField control={form.control} name="penandatanganCustomerNama" render={({ field }) => (
                <FormItem><FormLabel>Nama</FormLabel><FormControl><Input {...field} placeholder="Nama penandatangan customer" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="penandatanganCustomerJabatan" render={({ field }) => (
                <FormItem><FormLabel>Jabatan</FormLabel><FormControl><Input {...field} placeholder="Jabatan" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
          </div>

          <FormField control={form.control} name="catatan" render={({ field }) => (
            <FormItem><FormLabel>Catatan</FormLabel><FormControl><Textarea {...field} placeholder="Catatan (opsional)" rows={3} /></FormControl><FormMessage /></FormItem>
          )} />

          <FormField control={form.control} name="isActive" render={({ field }) => (
            <FormItem><div className="flex items-center gap-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="mb-0">Aktif</FormLabel></div><FormMessage /></FormItem>
          )} />

          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Item Barang ({fields.length})</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ kode_barang: '', nama_barang: '', satuan: '', harga_satuan: 0 })}>
                <Plus className="h-4 w-4 mr-1" />Tambah Item
              </Button>
            </div>
            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Belum ada item. Tambahkan item atau gunakan Import dari Kontrak di halaman Barang.
              </p>
            )}
            {fields.map((field, index) => (
              <div key={field.id} className="p-3 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Item #{index + 1}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Barang (Master)</label>
                    <select
                      {...form.register(`items.${index}.barang_id`)}
                      onChange={(e) => {
                        const selected = barangOptions.find(b => b.value === e.target.value)
                        if (selected) {
                          form.setValue(`items.${index}.barang_id`, selected.value)
                          form.setValue(`items.${index}.kode_barang`, selected.label.replace(/^\[(\w+)\].*$/, '$1'))
                          form.setValue(`items.${index}.nama_barang`, selected.label.replace(/^\[\w+\]\s*/, ''))
                          if (selected.satuan) form.setValue(`items.${index}.satuan`, selected.satuan)
                        }
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">- Pilih Barang -</option>
                      {barangOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Nama Barang (Manual)</label>
                    <Input {...form.register(`items.${index}.nama_barang`)} placeholder="Jika tidak ada di master" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2"><label className="text-xs font-medium">Kode</label><Input {...form.register(`items.${index}.kode_barang`)} placeholder="Kode" /></div>
                  <div className="space-y-2"><label className="text-xs font-medium">Satuan</label><Input {...form.register(`items.${index}.satuan`)} placeholder="pcs" /></div>
                  <div className="space-y-2"><label className="text-xs font-medium">Harga Satuan</label><Input type="number" min="0" {...form.register(`items.${index}.harga_satuan`)} /></div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="text-sm font-semibold">Dokumen Kontrak</h3>
            <div
              className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer bg-muted/30 hover:bg-muted/50"
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = '.pdf,.jpg,.jpeg,.png,.webp'
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) handleUploadDoc(file)
                }
                input.click()
              }}
            >
              <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Klik untuk upload dokumen kontrak</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, WebP (maks. 10MB)</p>
            </div>
            {uploadingDoc && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Mengupload...
              </div>
            )}
            {documents.length > 0 && (
              <div className="space-y-2">
                {documents.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium truncate hover:underline">{d.file_name}</a>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteDoc(d.id)} type="button">
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {documents.length === 0 && !uploadingDoc && (
              <p className="text-sm text-muted-foreground text-center py-2">Belum ada dokumen</p>
            )}
          </div>

          <FormActions loading={loading} onCancel={() => confirmLeave(() => router.push(`/dashboard/master/kontrak/${id}`))} />
        </form>
      </Form>

      <ConfirmLeaveDialog open={showDialog} onConfirm={handleConfirm} onCancel={handleCancel} />
    </div>
  );
}
