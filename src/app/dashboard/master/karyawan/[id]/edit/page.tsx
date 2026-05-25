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

const schema = z.object({
  nik: z.string().min(2, { message: "NIK harus diisi" }),
  nama: z.string().min(2, { message: "Nama harus diisi" }),
  email: z.string().email({ message: "Email tidak valid" }),
  noHp: z.string().optional(),
  jabatanId: z.string().min(1, { message: "Jabatan harus dipilih" }),
  gajiPokok: z.coerce.number().nonnegative().optional(),
  tanggalMasuk: z.string().optional(),
  isActive: z.boolean().default(true),
});
type FormValues = z.input<typeof schema>;

export default function EditKaryawanPage() {
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split('/').at(-2);
  const { register, handleSubmit, formState: { errors, isDirty }, reset } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const { confirmLeave, showDialog, handleConfirm, handleCancel } = useUnsavedChanges(isDirty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [jabatanOptions, setJabatanOptions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      try {
        const { data: jabatan } = await apiFetch<Array<{ id: string; nama: string }>>('/api/v1/master/jabatan');
        if (cancelled) return;
        setJabatanOptions(jabatan.map(item => ({ value: item.id, label: item.nama })));

        const { data } = await apiFetch<{
          nik: string; nama: string; email: string; no_hp: string | null;
          jabatan_id: string; gaji_pokok: number | null;
          tanggal_masuk: string | null; is_active: boolean;
        }>(`/api/v1/master/karyawan/${id}`);
        if (cancelled) return;
        if (data) {
          reset({
            nik: data.nik, nama: data.nama, email: data.email,
            noHp: data.no_hp || '', jabatanId: data.jabatan_id,
            gajiPokok: data.gaji_pokok || undefined,
            tanggalMasuk: data.tanggal_masuk ? data.tanggal_masuk.split('T')[0] : '',
            isActive: data.is_active,
          });
        }
      } catch (err) { if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuat data karyawan'); }
      finally { if (!cancelled) setIsLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [id, reset]);

  const onSubmit = async (data: FormValues) => {
    if (!id) return;
    setLoading(true); setError(null); setSuccess(null);
    try {
      await apiFetch(`/api/v1/master/karyawan/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          nik: data.nik, nama: data.nama, email: data.email,
          no_hp: data.noHp || null, jabatan_id: data.jabatanId,
          gaji_pokok: data.gajiPokok || null,
          tanggal_masuk: data.tanggalMasuk ? new Date(data.tanggalMasuk).toISOString() : null,
          is_active: data.isActive,
        }),
      });
      setSuccess('Karyawan berhasil diperbarui!');
      setTimeout(() => router.push('/dashboard/master/karyawan'), 2000);
    } catch (err) { setError(err instanceof Error ? err.message : 'Terjadi kesalahan'); }
    finally { setLoading(false); }
  };

  if (isLoading) return <div className="min-h-[200px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /><p className="ml-3 text-muted-foreground">Memuat data...</p></div>;

  return (
    <div className="max-w-xl">
      <div className="mb-6"><h1 className="text-2xl font-bold">Edit Karyawan</h1></div>
      {success && <div className="mb-4 p-4 bg-success/10 border-l-4 border-success"><p className="text-success">{success}</p></div>}
      {error && <div className="mb-4 p-4 bg-destructive/10 border-l-4 border-destructive"><p className="text-destructive">{error}</p></div>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">NIK <span className="text-destructive">*</span></label>
            <input type="text" {...register('nik')} className={`w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring ${errors.nik ? 'border-destructive' : ''}`} />
            {errors.nik && <p className="text-destructive text-sm mt-1">{errors.nik.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nama <span className="text-destructive">*</span></label>
            <input type="text" {...register('nama')} className={`w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring ${errors.nama ? 'border-destructive' : ''}`} />
            {errors.nama && <p className="text-destructive text-sm mt-1">{errors.nama.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email <span className="text-destructive">*</span></label>
            <input type="email" {...register('email')} className={`w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring ${errors.email ? 'border-destructive' : ''}`} />
            {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">No. HP</label>
            <input type="text" {...register('noHp')} className="w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Jabatan <span className="text-destructive">*</span></label>
            <select {...register('jabatanId')} className={`w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring ${errors.jabatanId ? 'border-destructive' : ''}`}>
              <option value="">Pilih Jabatan</option>
              {jabatanOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            {errors.jabatanId && <p className="text-destructive text-sm mt-1">{errors.jabatanId.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Gaji Pokok</label>
            <input type="number" min="0" step="0.01" {...register('gajiPokok')} className="w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tanggal Masuk</label>
          <input type="date" {...register('tanggalMasuk')} className="w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring" />
        </div>
        <div className="flex items-center">
          <label className="flex items-center text-sm font-medium">
            <input type="checkbox" {...register('isActive')} className="h-4 w-4 text-primary focus-visible:ring-ring border-border rounded" />
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
        <Button variant="back" onClick={() => confirmLeave(() => router.push('/dashboard/master/karyawan'))}>Kembali ke Daftar Karyawan</Button>
      </div>
      <ConfirmLeaveDialog open={showDialog} onConfirm={handleConfirm} onCancel={handleCancel} />
    </div>
  );
}
