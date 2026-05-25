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

const schema = z.object({ nama: z.string().min(2, { message: "Nama jabatan harus diisi" }), keterangan: z.string().optional() });
type FormValues = z.input<typeof schema>;

export default function EditJabatanPage() {
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split('/').pop();
  const { register, handleSubmit, formState: { errors, isDirty }, reset } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const { confirmLeave, showDialog, handleConfirm, handleCancel } = useUnsavedChanges(isDirty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      try {
        const { data } = await apiFetch<{ nama: string; keterangan: string | null }>(`/api/v1/master/jabatan/${id}`);
        if (cancelled) return;
        if (data) reset({ nama: data.nama, keterangan: data.keterangan || '' });
      } catch { if (!cancelled) setError('Gagal memuat data'); }
      finally { if (!cancelled) setIsLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [id, reset]);

  const onSubmit = async (data: FormValues) => {
    if (!id) return;
    setLoading(true); setError(null); setSuccess(null);
    try {
      await apiFetch(`/api/v1/master/jabatan/${id}`, { method: 'PUT', body: JSON.stringify({ nama: data.nama, keterangan: data.keterangan || null }) });
      setSuccess('Jabatan berhasil diperbarui!');
      setTimeout(() => router.push('/dashboard/master/jabatan'), 2000);
    } catch { setError('Terjadi kesalahan'); }
    finally { setLoading(false); }
  };

  if (isLoading) return <div className="min-h-[200px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /><p className="ml-3 text-muted-foreground">Memuat data...</p></div>;

  return (
    <div className="max-w-xl">
      <div className="mb-6"><h1 className="text-2xl font-bold">Edit Jabatan</h1></div>
      {success && <div className="mb-4 p-4 bg-success/10 border-l-4 border-success"><p className="text-success">{success}</p></div>}
      {error && <div className="mb-4 p-4 bg-destructive/10 border-l-4 border-destructive"><p className="text-destructive">{error}</p></div>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nama Jabatan <span className="text-destructive">*</span></label>
          <input type="text" {...register('nama')} className={`w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring ${errors.nama ? 'border-destructive' : ''}`} />
          {errors.nama && <p className="text-destructive text-sm mt-1">{errors.nama.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Keterangan</label>
          <textarea {...register('keterangan')} rows={3} className="w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring" />
        </div>
        <div className="pt-4">
          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Memperbarui...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
      <div className="mt-6">
        <Button className="bg-zinc-500/70 text-white hover:bg-zinc-500/90" onClick={() => confirmLeave(() => router.push('/dashboard/master/jabatan'))}>Kembali ke Daftar Jabatan</Button>
      </div>
      <ConfirmLeaveDialog open={showDialog} onConfirm={handleConfirm} onCancel={handleCancel} />
    </div>
  );
}
