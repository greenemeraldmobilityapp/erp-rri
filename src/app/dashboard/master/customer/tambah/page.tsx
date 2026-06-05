"use client";

import { useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { ConfirmLeaveDialog } from '@/components/confirm-leave-dialog';

const allTopOptions = ['Net 14', 'Net 20', 'Net 30', 'Net 60', 'Net 90', 'Cash', 'Custom'] as const;

const customerSchema = z.object({
  nama: z.string().min(2, { message: "Nama customer harus diisi" }),
  kode: z.string().min(2, { message: "Kode customer harus diisi" }),
  alamat: z.string().optional(),
  kontak: z.string().optional(),
  selectedTops: z.array(z.string()).min(1, { message: "Pilih minimal 1 Terms of Payment" }),
  isActive: z.boolean().default(true),
});

type CustomerFormValues = z.input<typeof customerSchema>;

export default function TambahCustomerPage() {
  const router = useRouter();

  const { register, handleSubmit, formState: { errors, isDirty }, setValue, watch } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: { selectedTops: [], isActive: true },
  });
  const { confirmLeave, showDialog, handleConfirm, handleCancel } = useUnsavedChanges(isDirty);

  const selectedTops = watch('selectedTops', []);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTop = (opt: string) => {
    const current = selectedTops ?? []
    const next = current.includes(opt)
      ? current.filter(v => v !== opt)
      : [...current, opt]
    setValue('selectedTops', next, { shouldDirty: true })
  }

  const onSubmit = async (data: CustomerFormValues) => {
    setSubmitting(true);
    setError(null);

    try {
      await apiFetch('/api/v1/master/customer', {
        method: 'POST',
        body: JSON.stringify({
          nama: data.nama,
          kode: data.kode,
          alamat: data.alamat,
          kontak: data.kontak,
          terms_of_payment: data.selectedTops[0] ?? '',
          is_active: data.isActive,
          customer_tops: data.selectedTops,
        }),
      });

      router.push('/dashboard/master/customer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Tambah Customer</h1>
        <p className="text-sm text-muted-foreground">Formulir untuk menambahkan customer baru</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border-l-4 border-destructive">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="nama" className="block text-sm font-medium mb-1">
            Nama Customer <span className="text-destructive">*</span>
          </label>
          <input
            id="nama"
            type="text"
            {...register('nama')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring ${
              errors.nama ? 'border-destructive' : ''
            }`}
          />
          {errors.nama && <p className="text-destructive text-sm mt-1">{errors.nama.message}</p>}
        </div>

        <div>
          <label htmlFor="kode" className="block text-sm font-medium mb-1">
            Kode Customer <span className="text-destructive">*</span>
          </label>
          <input
            id="kode"
            type="text"
            {...register('kode')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring ${
              errors.kode ? 'border-destructive' : ''
            }`}
          />
          {errors.kode && <p className="text-destructive text-sm mt-1">{errors.kode.message}</p>}
        </div>

        <div>
          <label htmlFor="alamat" className="block text-sm font-medium mb-1">
            Alamat
          </label>
          <input
            id="alamat"
            type="text"
            {...register('alamat')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring ${
              errors.alamat ? 'border-destructive' : ''
            }`}
          />
          {errors.alamat && <p className="text-destructive text-sm mt-1">{errors.alamat.message}</p>}
        </div>

        <div>
          <label htmlFor="kontak" className="block text-sm font-medium mb-1">
            Kontak
          </label>
          <input
            id="kontak"
            type="text"
            {...register('kontak')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring ${
              errors.kontak ? 'border-destructive' : ''
            }`}
          />
          {errors.kontak && <p className="text-destructive text-sm mt-1">{errors.kontak.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Terms of Payment <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {allTopOptions.map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={(selectedTops ?? []).includes(opt)}
                  onCheckedChange={() => toggleTop(opt)}
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
          {errors.selectedTops && <p className="text-destructive text-sm mt-1">{errors.selectedTops.message}</p>}
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
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitting ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </form>

      <div className="mt-6">
        <div className="flex justify-between items-center">
          <Button variant="back" onClick={() => confirmLeave(() => router.push('/dashboard/master/customer'))}>
            Kembali ke Daftar Customer
          </Button>
        </div>
      </div>
      <ConfirmLeaveDialog open={showDialog} onConfirm={handleConfirm} onCancel={handleCancel} />
    </div>
  );
}
