"use client";

import { useState, useEffect } from 'react';
import { apiFetch, apiFetchFormData } from '@/lib/api/client';
import { useRouter, usePathname } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, X } from 'lucide-react';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { ConfirmLeaveDialog } from '@/components/confirm-leave-dialog';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

const barangSchema = z.object({
  nama: z.string().min(2, { message: "Nama barang harus diisi" }),
  kode: z.string().min(2, { message: "Kode barang harus diisi" }),
  kategori_id: z.string().min(1, { message: "Kategori harus dipilih" }),
  satuan: z.string().min(1, { message: "Satuan harus diisi" }),
  spesifikasi: z.string().optional(),
  justification: z.string().optional(),
  image_url: z.string().optional(),
  barcode: z.string().optional(),
  harga_beli_default: z.coerce.number().nonnegative().optional(),
  harga_jual_default: z.coerce.number().nonnegative().optional(),
  stok_minimum: z.coerce.number().nonnegative().default(0),
  is_active: z.boolean().default(true),
});
type BarangFormValues = z.input<typeof barangSchema>;

export default function EditBarangPage() {
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split('/').at(-2);
  const { register, handleSubmit, formState: { errors, isDirty }, reset, watch, setValue } = useForm<BarangFormValues>({ resolver: zodResolver(barangSchema) });
  const { confirmLeave, showDialog, handleConfirm, handleCancel } = useUnsavedChanges(isDirty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [kategoriOptions, setKategoriOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      try {
        const { data: kategoriData } = await apiFetch<Array<{ id: string; nama: string }>>('/api/v1/master/kategori-barang');
        if (cancelled) return;
        setKategoriOptions(kategoriData.map(item => ({ value: item.id, label: item.nama })));

        const { data } = await apiFetch<Record<string, unknown>>(`/api/v1/master/barang/${id}`);
        if (cancelled) return;
        if (data) reset(data as BarangFormValues);
      } catch { if (!cancelled) setError('Gagal memuat data barang'); }
      finally { if (!cancelled) setIsLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [id, reset]);

  const handlePickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) { toast.error('Hanya JPG, PNG, atau WebP'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Maksimal 5MB'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    if (e.target) e.target.value = ''
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    setValue('image_url', '')
  }

  const handleDeleteImage = async () => {
    if (!id) return
    const toastId = toast.loading('Menghapus gambar...')
    try {
      await apiFetch(`/api/v1/master/barang/${id}/image`, { method: 'DELETE' })
      setValue('image_url', '')
      toast.success('Gambar berhasil dihapus', { id: toastId })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal hapus gambar', { id: toastId })
    }
  }

  const onSubmit = async (data: BarangFormValues) => {
    if (!id) return;
    setLoading(true); setError(null); setSuccess(null);
    const toastId = toast.loading('Memperbarui barang...');
    try {
      await apiFetch(`/api/v1/master/barang/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      if (imageFile) {
        const compressed = await imageCompression(imageFile, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: 'image/webp',
        })
        const formData = new FormData()
        formData.append('file', compressed, 'foto-1.webp')
        await apiFetchFormData(`/api/v1/master/barang/${id}/image`, formData)
      }
      setSuccess('Barang berhasil diperbarui!');
      toast.success('Barang berhasil diperbarui!', { id: toastId });
      setTimeout(() => router.push('/dashboard/master/barang'), 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      setError(msg)
      toast.error(msg, { id: toastId });
    }
    finally { setLoading(false); }
  };

  if (isLoading) return <div className="min-h-[200px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /><p className="ml-3 text-muted-foreground">Memuat data...</p></div>;

  const currentUrl = watch('image_url')

  return (
    <div className="max-w-xl">
      <div className="mb-6"><h1 className="text-2xl font-bold">Edit Barang</h1></div>
      {success && <div className="mb-4 p-4 bg-success/10 border-l-4 border-success"><p className="text-success">{success}</p></div>}
      {error && <div className="mb-4 p-4 bg-destructive/10 border-l-4 border-destructive"><p className="text-destructive">{error}</p></div>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nama Barang <span className="text-destructive">*</span></label>
            <input type="text" {...register('nama')} className={`w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring ${errors.nama ? 'border-destructive' : ''}`} />
            {errors.nama && <p className="text-destructive text-sm mt-1">{errors.nama.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Kode Barang <span className="text-destructive">*</span></label>
            <input type="text" {...register('kode')} className={`w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring ${errors.kode ? 'border-destructive' : ''}`} />
            {errors.kode && <p className="text-destructive text-sm mt-1">{errors.kode.message}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Barcode</label>
          <input type="text" {...register('barcode')} placeholder="Opsional — scan barcode barang" className="w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Kategori <span className="text-destructive">*</span></label>
          <select {...register('kategori_id')} className={`w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring ${errors.kategori_id ? 'border-destructive' : ''}`}>
            <option value="">Pilih Kategori</option>
            {kategoriOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          {errors.kategori_id && <p className="text-destructive text-sm mt-1">{errors.kategori_id.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Satuan <span className="text-destructive">*</span></label>
            <input type="text" {...register('satuan')} placeholder="pcs, kg, liter" className={`w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring ${errors.satuan ? 'border-destructive' : ''}`} />
            {errors.satuan && <p className="text-destructive text-sm mt-1">{errors.satuan.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Stok Minimum</label>
            <input type="number" min="0" {...register('stok_minimum')} className="w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Spesifikasi</label>
          <textarea {...register('spesifikasi')} rows={2} className="w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Justification</label>
          <textarea {...register('justification')} rows={2} className="w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring" />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium">Foto Barang</label>
          {imagePreview ? (
            <div className="relative inline-block rounded-lg border overflow-hidden">
              <img src={imagePreview} alt="Preview" className="max-h-48 object-contain" />
              <button type="button" onClick={handleRemoveImage} className="absolute top-1 right-1 bg-background/80 rounded-full p-1 hover:bg-destructive hover:text-destructive-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : currentUrl ? (
            <div className="relative inline-block rounded-lg border overflow-hidden">
              <img src={currentUrl} alt="Current" className="max-h-48 object-contain" />
              <button type="button" onClick={handleDeleteImage} className="absolute top-1 right-1 bg-background/80 rounded-full p-1 hover:bg-destructive hover:text-destructive-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}
          <div
            className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer bg-muted/30 hover:bg-muted/50"
            onClick={() => document.getElementById('barang-edit-image-input')?.click()}
          >
            <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">Klik untuk upload foto barang</p>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP — maks. 5MB, 1920px</p>
            <input id="barang-edit-image-input" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePickImage} />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Atau URL manual</label>
            <input type="text" {...register('image_url')} placeholder="https://..." className="w-full px-3 py-2 border rounded-md text-xs focus:outline-none focus-visible:ring-3 focus-visible:ring-ring" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Harga Beli Default</label>
            <input type="number" min="0" step="0.01" {...register('harga_beli_default')} className="w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Harga Jual Default</label>
            <input type="number" min="0" step="0.01" {...register('harga_jual_default')} className="w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring" />
          </div>
        </div>
        <div className="flex items-center">
          <label className="flex items-center text-sm font-medium">
            <input type="checkbox" {...register('is_active')} className="h-4 w-4 text-primary focus-visible:ring-ring border-border rounded" />
            <span className="ml-2">Aktif</span>
          </label>
        </div>
        <div className="pt-4">
          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Memperbarui...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
      <div className="mt-6">
        <Button variant="back" onClick={() => confirmLeave(() => router.push('/dashboard/master/barang'))}>Kembali ke Daftar Barang</Button>
      </div>
      <ConfirmLeaveDialog open={showDialog} onConfirm={handleConfirm} onCancel={handleCancel} />
    </div>
  );
}
