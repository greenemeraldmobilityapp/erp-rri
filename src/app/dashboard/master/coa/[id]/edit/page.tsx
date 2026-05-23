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

const coaSchema = z.object({
  kode: z.string().min(1, { message: "Kode akun harus diisi" }),
  nama: z.string().min(2, { message: "Nama akun harus diisi" }),
  tipe: z.string().min(1, { message: "Tipe akun harus dipilih" }),
  indukId: z.string().optional(),
  keterangan: z.string().optional(),
});

type COAFormValues = z.infer<typeof coaSchema>;

const TIPE_OPTIONS = [
  { value: 'Asset', label: 'Asset' },
  { value: 'Liability', label: 'Liability' },
  { value: 'Equity', label: 'Equity' },
  { value: 'Revenue', label: 'Revenue' },
  { value: 'Expense', label: 'Expense' },
];

export default function EditCOAPage() {
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split('/').pop();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<COAFormValues>({
    resolver: zodResolver(coaSchema),
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [parentOptions, setParentOptions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!id) return;
      try {
        const { data: parents } = await apiFetch<Array<{ id: string; kode: string; nama: string }>>('/api/v1/master/coa');

        if (cancelled) return;

        setParentOptions(parents
          .filter(item => item.id !== id)
          .map(item => ({
            value: item.id,
            label: `${item.kode} - ${item.nama}`,
          }))
        );

        const { data: coaData } = await apiFetch<{
          kode: string; nama: string; tipe: string;
          induk_id: string | null; keterangan: string | null;
        }>(`/api/v1/master/coa/${id}`);

        if (cancelled) return;

        if (coaData) {
          reset({
            kode: coaData.kode,
            nama: coaData.nama,
            tipe: coaData.tipe,
            indukId: coaData.induk_id || '',
            keterangan: coaData.keterangan || '',
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Gagal memuat data akun');
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

  const onSubmit = async (data: COAFormValues) => {
    if (!id) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch(`/api/v1/master/coa/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          kode: data.kode,
          nama: data.nama,
          tipe: data.tipe,
          induk_id: data.indukId || null,
          keterangan: data.keterangan || null,
        }),
      });

      setSuccess('Akun berhasil diperbarui!');

      setTimeout(() => {
        router.push('/dashboard/master/coa');
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
        <h1 className="text-2xl font-bold">Edit Akun</h1>
        <p className="text-sm text-muted-foreground">Formulir untuk mengedit data akun (COA)</p>
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
          <label htmlFor="kode" className="block text-sm font-medium mb-1">
            Kode Akun <span className="text-destructive">*</span>
          </label>
          <input
            id="kode"
            type="text"
            {...register('kode')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring ${errors.kode ? 'border-destructive' : ''}`}
          />
          {errors.kode && <p className="text-destructive text-sm mt-1">{errors.kode.message}</p>}
        </div>

        <div>
          <label htmlFor="nama" className="block text-sm font-medium mb-1">
            Nama Akun <span className="text-destructive">*</span>
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
          <label htmlFor="tipe" className="block text-sm font-medium mb-1">
            Tipe Akun <span className="text-destructive">*</span>
          </label>
          <select
            id="tipe"
            {...register('tipe')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring ${errors.tipe ? 'border-destructive' : ''}`}
          >
            <option value="">Pilih Tipe Akun</option>
            {TIPE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.tipe && <p className="text-destructive text-sm mt-1">{errors.tipe.message}</p>}
        </div>

        <div>
          <label htmlFor="indukId" className="block text-sm font-medium mb-1">
            Akun Induk
          </label>
          <select
            id="indukId"
            {...register('indukId')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring ${errors.indukId ? 'border-destructive' : ''}`}
          >
            <option value="">Tidak Ada (Akun Utama)</option>
            {parentOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.indukId && <p className="text-destructive text-sm mt-1">{errors.indukId.message}</p>}
        </div>

        <div>
          <label htmlFor="keterangan" className="block text-sm font-medium mb-1">
            Keterangan
          </label>
          <textarea
            id="keterangan"
            {...register('keterangan')}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus-visible:ring-3 focus-visible:ring-ring ${errors.keterangan ? 'border-destructive' : ''}`}
          />
          {errors.keterangan && <p className="text-destructive text-sm mt-1">{errors.keterangan.message}</p>}
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
            <Link href="/dashboard/master/coa">
              Kembali ke Daftar Akun
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
