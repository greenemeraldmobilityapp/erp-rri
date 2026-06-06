"use client";

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api/client';
import { supabase } from '@/lib/db/client';
import { useRouter, usePathname } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { ConfirmLeaveDialog } from '@/components/confirm-leave-dialog';

interface PaymentTermItem {
  id: string
  nama: string
  is_active: boolean
}

const allTopOptions = ['Net 14', 'Net 20', 'Net 30', 'Net 60', 'Net 90', 'Cash', 'Custom'] as const;

const customerSchema = z.object({
  nama: z.string().min(2, { message: "Nama customer harus diisi" }),
  kode: z.string().min(2, { message: "Kode customer harus diisi" }),
  alamat: z.string().optional(),
  kontak: z.string().optional(),
  selectedTops: z.array(z.string()).min(1, { message: "Pilih minimal 1 Terms of Payment" }),
  paymentTermId: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CustomerFormValues = z.input<typeof customerSchema>;

export default function EditCustomerPage() {
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split('/').at(-2);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTermItem[]>([]);

  const { register, handleSubmit, formState: { errors, isDirty }, reset, setValue, watch } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: { selectedTops: [], paymentTermId: undefined, isActive: true },
  });
  const { confirmLeave, showDialog, handleConfirm, handleCancel } = useUnsavedChanges(isDirty);

  const selectedTops = watch('selectedTops', []);
  const paymentTermId = watch('paymentTermId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('payment_term').select('id, nama, is_active').eq('is_active', true).order('nama')
      setPaymentTerms(data ?? [])
    })()
  }, [])

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!id) return;
      try {
        const [customerRes, topsRes] = await Promise.all([
          apiFetch<{
            nama: string; kode: string; alamat: string | null;
            kontak: string | null; terms_of_payment: string; is_active: boolean;
            payment_term_id: string | null;
          }>(`/api/v1/master/customer/${id}`),
          apiFetch<Array<{ top: string }>>(`/api/v1/master/customer-top?customer_id=${id}`),
        ])

        if (cancelled) return;

        if (customerRes.data) {
          const existingTops = (topsRes.data ?? []).map(t => t.top)
          reset({
            nama: customerRes.data.nama,
            kode: customerRes.data.kode,
            alamat: customerRes.data.alamat || '',
            kontak: customerRes.data.kontak || '',
            selectedTops: existingTops,
            paymentTermId: customerRes.data.payment_term_id || undefined,
            isActive: customerRes.data.is_active,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Gagal memuat data customer');
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

  const toggleTop = (opt: string) => {
    const current = selectedTops ?? []
    const next = current.includes(opt)
      ? current.filter(v => v !== opt)
      : [...current, opt]
    setValue('selectedTops', next, { shouldDirty: true })
  }

  const onSubmit = async (data: CustomerFormValues) => {
    if (!id) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch(`/api/v1/master/customer/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          nama: data.nama,
          kode: data.kode,
          alamat: data.alamat,
          kontak: data.kontak,
          terms_of_payment: data.selectedTops[0] ?? '',
          payment_term_id: data.paymentTermId || undefined,
          is_active: data.isActive,
          customer_tops: data.selectedTops,
        }),
      });

      setSuccess('Customer berhasil diperbarui!');

      setTimeout(() => {
        router.push('/dashboard/master/customer');
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
        <h1 className="text-2xl font-bold">Edit Customer</h1>
        <p className="text-sm text-muted-foreground">Formulir untuk mengedit data customer</p>
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

        <div>
          <label className="block text-sm font-medium mb-1">
            Payment Term (Multi-Termin)
          </label>
          <select
            value={paymentTermId ?? ''}
            onChange={(e) => setValue('paymentTermId', e.target.value || undefined, { shouldDirty: true })}
            className="w-full h-10 px-3 border rounded-md bg-background text-sm"
          >
            <option value="">- Tidak menggunakan multi-termin -</option>
            {paymentTerms.map((pt) => (
              <option key={pt.id} value={pt.id}>{pt.nama}</option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Biarkan kosong jika hanya menggunakan TOP sederhana
          </p>
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
          <Button variant="back" onClick={() => confirmLeave(() => router.push('/dashboard/master/customer'))}>
            Kembali ke Daftar Customer
          </Button>
        </div>
      </div>
      <ConfirmLeaveDialog open={showDialog} onConfirm={handleConfirm} onCancel={handleCancel} />
    </div>
  );
}
