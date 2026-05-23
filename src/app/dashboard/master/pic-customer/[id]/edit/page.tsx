"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { useRouter, usePathname } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const picSchema = z.object({
  customerId: z.string().min(1, { message: "Customer harus dipilih" }),
  nama: z.string().min(2, { message: "Nama PIC harus diisi" }),
  jabatan: z.string().optional(),
  noHp: z.string().optional(),
  email: z.string().email({ message: "Email tidak valid" }).optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

type PICFormValues = z.input<typeof picSchema>;

export default function EditPICCustomerPage() {
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split('/').pop();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<PICFormValues>({
    resolver: zodResolver(picSchema),
  });

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

        const { data: picData } = await apiFetch<{
          customer_id: string; nama: string; jabatan: string | null;
          no_hp: string | null; email: string | null; is_active: boolean;
        }>(`/api/v1/master/pic-customer/${id}`);

        if (cancelled) return;

        if (picData) {
          reset({
            customerId: picData.customer_id,
            nama: picData.nama,
            jabatan: picData.jabatan || '',
            noHp: picData.no_hp || '',
            email: picData.email || '',
            isActive: picData.is_active,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Gagal memuat data PIC customer');
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

  const onSubmit = async (data: PICFormValues) => {
    if (!id) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch(`/api/v1/master/pic-customer/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          customer_id: data.customerId,
          nama: data.nama,
          jabatan: data.jabatan || null,
          no_hp: data.noHp || null,
          email: data.email || null,
          is_active: data.isActive,
        }),
      });

      setSuccess('PIC Customer berhasil diperbarui!');

      setTimeout(() => {
        router.push('/dashboard/master/pic-customer');
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
        <h1 className="text-2xl font-bold">Edit PIC Customer</h1>
        <p className="text-sm text-muted-foreground">Formulir untuk mengedit data PIC customer</p>
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
            Nama PIC <span className="text-destructive">*</span>
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
          <label htmlFor="jabatan" className="block text-sm font-medium mb-1">
            Jabatan
          </label>
          <input
            id="jabatan"
            type="text"
            {...register('jabatan')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring ${errors.jabatan ? 'border-destructive' : ''}`}
          />
          {errors.jabatan && <p className="text-destructive text-sm mt-1">{errors.jabatan.message}</p>}
        </div>

        <div>
          <label htmlFor="noHp" className="block text-sm font-medium mb-1">
            No. HP
          </label>
          <input
            id="noHp"
            type="text"
            {...register('noHp')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring ${errors.noHp ? 'border-destructive' : ''}`}
          />
          {errors.noHp && <p className="text-destructive text-sm mt-1">{errors.noHp.message}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring ${errors.email ? 'border-destructive' : ''}`}
          />
          {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
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
          <Button variant="link" asChild>
            <Link href="/dashboard/master/pic-customer">
              Kembali ke Daftar PIC Customer
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
