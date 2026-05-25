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

const supplierSchema = z.object({
  nama: z.string().min(2, { message: "Nama supplier harus diisi" }),
  kode: z.string().min(2, { message: "Kode supplier harus diisi" }),
  namaToko: z.string().optional(),
  linkToko: z.string().optional(),
  noRekening: z.string().optional(),
  kontak: z.string().optional(),
  termsOfPayment: z.enum(['Net 30', 'Net 60', 'Cash', 'Custom'], {
    message: "Pilih terms of payment yang valid",
  }).optional().or(z.literal('')),
  isMarketplace: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

type SupplierFormValues = z.input<typeof supplierSchema>;

export default function EditSupplierPage() {
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split('/').at(-2);

  const { register, handleSubmit, formState: { errors, isDirty }, reset } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
  });
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
        const { data } = await apiFetch<{
          nama: string; kode: string; nama_toko: string | null; link_toko: string | null;
          no_rekening: string | null; kontak: string | null; terms_of_payment: string | null;
          is_marketplace: boolean; is_active: boolean;
        }>(`/api/v1/master/supplier/${id}`);

        if (cancelled) return;

        if (data) {
          reset({
            nama: data.nama,
            kode: data.kode,
            namaToko: data.nama_toko || '',
            linkToko: data.link_toko || '',
            noRekening: data.no_rekening || '',
            kontak: data.kontak || '',
            termsOfPayment: (data.terms_of_payment as SupplierFormValues['termsOfPayment']) || '',
            isMarketplace: data.is_marketplace,
            isActive: data.is_active,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Gagal memuat data supplier');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [id, reset]);

  const onSubmit = async (data: SupplierFormValues) => {
    if (!id) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch(`/api/v1/master/supplier/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          nama: data.nama,
          kode: data.kode,
          nama_toko: data.namaToko || null,
          link_toko: data.linkToko || null,
          no_rekening: data.noRekening || null,
          kontak: data.kontak || null,
          terms_of_payment: data.termsOfPayment || null,
          is_marketplace: data.isMarketplace,
          is_active: data.isActive,
        }),
      });

      setSuccess('Supplier berhasil diperbarui!');

      setTimeout(() => {
        router.push('/dashboard/master/supplier');
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
        <h1 className="text-2xl font-bold">Edit Supplier</h1>
        <p className="text-sm text-muted-foreground">Formulir untuk mengedit data supplier</p>
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
          <label htmlFor="nama" className="block text-sm font-medium mb-1">
            Nama Supplier <span className="text-destructive">*</span>
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
          <label htmlFor="kode" className="block text-sm font-medium mb-1">
            Kode Supplier <span className="text-destructive">*</span>
          </label>
          <input
            id="kode"
            type="text"
            {...register('kode')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring ${errors.kode ? 'border-destructive' : ''}`}
          />
          {errors.kode && <p className="text-destructive text-sm mt-1">{errors.kode.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="namaToko" className="block text-sm font-medium mb-1">Nama Toko</label>
            <input
              id="namaToko"
              type="text"
              {...register('namaToko')}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="linkToko" className="block text-sm font-medium mb-1">Link Toko</label>
            <input
              id="linkToko"
              type="text"
              {...register('linkToko')}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="noRekening" className="block text-sm font-medium mb-1">No. Rekening</label>
            <input
              id="noRekening"
              type="text"
              {...register('noRekening')}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="kontak" className="block text-sm font-medium mb-1">Kontak</label>
            <input
              id="kontak"
              type="text"
              {...register('kontak')}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring"
            />
          </div>
        </div>

        <div>
          <label htmlFor="termsOfPayment" className="block text-sm font-medium mb-1">Terms of Payment</label>
          <select
            id="termsOfPayment"
            {...register('termsOfPayment')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring ${errors.termsOfPayment ? 'border-destructive' : ''}`}
          >
            <option value="">Pilih Terms of Payment</option>
            <option value="Net 30">Net 30</option>
            <option value="Net 60">Net 60</option>
            <option value="Cash">Cash</option>
            <option value="Custom">Custom</option>
          </select>
          {errors.termsOfPayment && <p className="text-destructive text-sm mt-1">{errors.termsOfPayment.message}</p>}
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center text-sm font-medium">
            <input
              type="checkbox"
              {...register('isMarketplace')}
              className="h-4 w-4 text-primary focus-visible:ring-ring border-border rounded"
            />
            <span className="ml-2">Marketplace</span>
          </label>
          <label className="flex items-center text-sm font-medium">
            <input
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
          <Button variant="back" onClick={() => confirmLeave(() => router.push('/dashboard/master/supplier'))}>
            Kembali ke Daftar Supplier
          </Button>
        </div>
      </div>
      <ConfirmLeaveDialog open={showDialog} onConfirm={handleConfirm} onCancel={handleCancel} />
    </div>
  );
}
