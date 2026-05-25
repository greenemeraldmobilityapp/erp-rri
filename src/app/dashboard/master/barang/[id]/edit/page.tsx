"use client";

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useRouter, usePathname } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { ConfirmLeaveDialog } from '@/components/confirm-leave-dialog';

const barangSchema = z.object({
  nama: z.string().min(2, { message: "Nama barang harus diisi" }),
  kode: z.string().min(2, { message: "Kode barang harus diisi" }),
  kategori_id: z.string().min(1, { message: "Kategori harus dipilih" }),
  satuan: z.string().min(1, { message: "Satuan harus diisi" }),
  spesifikasi: z.string().optional(),
  harga_beli_default: z.coerce.number().nonnegative().optional(),
  harga_jual_default: z.coerce.number().nonnegative().optional(),
  stok_minimum: z.coerce.number().nonnegative().default(0),
  is_active: z.boolean().default(true),
});
type BarangFormValues = z.input<typeof barangSchema>;

export default function EditBarangPage() {
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split('/').pop();
  const { register, handleSubmit, formState: { errors, isDirty }, reset } = useForm<BarangFormValues>({ resolver: zodResolver(barangSchema) });
  const { confirmLeave, showDialog, handleConfirm, handleCancel } = useUnsavedChanges(isDirty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [kategoriOptions, setKategoriOptions] = useState<Array<{ value: string; label: string }>>([]);

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

  const onSubmit = async (data: BarangFormValues) => {
    if (!id) return;
    setLoading(true); setError(null); setSuccess(null);
    try {
      await apiFetch(`/api/v1/master/barang/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      setSuccess('Barang berhasil diperbarui!');
      setTimeout(() => router.push('/dashboard/master/barang'), 2000);
    } catch { setError('Terjadi kesalahan'); }
    finally { setLoading(false); }
  };

  if (isLoading) return <div className="min-h-[200px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /><p className="ml-3 text-muted-foreground">Memuat data...</p></div>;

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
        <Button className="bg-zinc-500/70 text-white hover:bg-zinc-500/90" onClick={() => confirmLeave(() => router.push('/dashboard/master/barang'))}>Kembali ke Daftar Barang</Button>
      </div>
      <ConfirmLeaveDialog open={showDialog} onConfirm={handleConfirm} onCancel={handleCancel} />
    </div>
  );
}
