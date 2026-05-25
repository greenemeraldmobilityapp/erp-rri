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

const kontrakSchema = z.object({
  customerId: z.string().min(1, { message: "Customer harus dipilih" }),
  nama: z.string().min(2, { message: "Nama kontrak harus diisi" }),
  tanggalMulai: z.string().optional(),
  tanggalSelesai: z.string().optional(),
  isActive: z.boolean().default(true),
});

type KontrakFormValues = z.input<typeof kontrakSchema>;

export default function EditKontrakPage() {
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split('/').pop();

  const { register, handleSubmit, formState: { errors, isDirty }, reset } = useForm<KontrakFormValues>({
    resolver: zodResolver(kontrakSchema),
  });
  const { confirmLeave, showDialog, handleConfirm, handleCancel } = useUnsavedChanges(isDirty);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [customerOptions, setCustomerOptions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!id) return;
      try {
        const { data: customers } = await apiFetch<Array<{ id: string; nama: string }>>('/api/v1/master/customer');

        if (cancelled) return;

        setCustomerOptions(customers.map(item => ({
          value: item.id,
          label: item.nama,
        })));

        const { data: kontrakData } = await apiFetch<{
          customer_id: string; nama: string;
          tanggal_mulai: string | null; tanggal_selesai: string | null;
          is_active: boolean;
        }>(`/api/v1/master/kontrak/${id}`);

        if (cancelled) return;

        if (kontrakData) {
          reset({
            customerId: kontrakData.customer_id,
            nama: kontrakData.nama,
            tanggalMulai: kontrakData.tanggal_mulai ? kontrakData.tanggal_mulai.split('T')[0] : '',
            tanggalSelesai: kontrakData.tanggal_selesai ? kontrakData.tanggal_selesai.split('T')[0] : '',
            isActive: kontrakData.is_active,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Gagal memuat data kontrak');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, reset]);

  const onSubmit = async (data: KontrakFormValues) => {
    if (!id) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch(`/api/v1/master/kontrak/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          customer_id: data.customerId,
          nama: data.nama,
          tanggal_mulai: data.tanggalMulai ? new Date(data.tanggalMulai).toISOString() : null,
          tanggal_selesai: data.tanggalSelesai ? new Date(data.tanggalSelesai).toISOString() : null,
          is_active: data.isActive,
        }),
      });

      setSuccess('Kontrak berhasil diperbarui!');

      setTimeout(() => {
        router.push('/dashboard/master/kontrak');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-3 text-muted-foreground">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Kontrak</h1>
        <p className="text-sm text-muted-foreground">Formulir untuk mengedit data kontrak</p>
      </div>

      {success && (
        <div className="mb-4 p-4 bg-success/10 border-l-4 border-success">
          <p className="text-success">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border-l-4 border-destructive">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="customerId" className="block text-sm font-medium mb-1">
            Customer <span className="text-destructive">*</span>
          </label>
          <select
            id="customerId"
            {...register('customerId')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring ${errors.customerId ? 'border-destructive' : ''}`}
          >
            <option value="">Pilih Customer</option>
            {customerOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.customerId && <p className="text-destructive text-sm mt-1">{errors.customerId.message}</p>}
        </div>

        <div>
          <label htmlFor="nama" className="block text-sm font-medium mb-1">
            Nama Kontrak <span className="text-destructive">*</span>
          </label>
          <input
            id="nama"
            type="text"
            {...register('nama')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring ${errors.nama ? 'border-destructive' : ''}`}
          />
          {errors.nama && <p className="text-destructive text-sm mt-1">{errors.nama.message}</p>}
        </div>

        <div>
          <label htmlFor="tanggalMulai" className="block text-sm font-medium mb-1">
            Tanggal Mulai
          </label>
          <input
            id="tanggalMulai"
            type="date"
            {...register('tanggalMulai')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring ${errors.tanggalMulai ? 'border-destructive' : ''}`}
          />
          {errors.tanggalMulai && <p className="text-destructive text-sm mt-1">{errors.tanggalMulai.message}</p>}
        </div>

        <div>
          <label htmlFor="tanggalSelesai" className="block text-sm font-medium mb-1">
            Tanggal Selesai
          </label>
          <input
            id="tanggalSelesai"
            type="date"
            {...register('tanggalSelesai')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring ${errors.tanggalSelesai ? 'border-destructive' : ''}`}
          />
          {errors.tanggalSelesai && <p className="text-destructive text-sm mt-1">{errors.tanggalSelesai.message}</p>}
        </div>

        <div className="flex items-center">
          <label htmlFor="isActive" className="flex items-center text-sm font-medium mb-0">
            <input
              id="isActive"
              type="checkbox"
              {...register('isActive')}
              className="h-4 w-4 text-primary focus-visible:ring-ring border-border rounded"
            />
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
        <div className="flex justify-between items-center">
          <Button className="bg-zinc-500/70 text-white hover:bg-zinc-500/90" onClick={() => confirmLeave(() => router.push('/dashboard/master/kontrak'))}>
            Kembali ke Daftar Kontrak
          </Button>
        </div>
      </div>
      <ConfirmLeaveDialog open={showDialog} onConfirm={handleConfirm} onCancel={handleCancel} />
    </div>
  );
}
