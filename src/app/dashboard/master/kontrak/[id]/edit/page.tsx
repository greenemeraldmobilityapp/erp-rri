"use client";

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useRouter, usePathname } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { ConfirmLeaveDialog } from '@/components/confirm-leave-dialog';
import { FormActions } from '@/components/form-actions';
import { PageHeader } from '@/components/page-header';

const kontrakSchema = z.object({
  customerId: z.string().min(1, { message: "Customer harus dipilih" }),
  nomorKontrak: z.string().optional(),
  nama: z.string().min(2, { message: "Nama kontrak harus diisi" }),
  tanggalMulai: z.string().optional(),
  tanggalSelesai: z.string().optional(),
  tanggalTandaTangan: z.string().optional(),
  penandatanganRriNama: z.string().optional(),
  penandatanganRriJabatan: z.string().optional(),
  penandatanganCustomerNama: z.string().optional(),
  penandatanganCustomerJabatan: z.string().optional(),
  catatan: z.string().optional(),
  isActive: z.boolean().default(true),
});

type KontrakFormValues = z.input<typeof kontrakSchema>;

export default function EditKontrakPage() {
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split('/').at(-2);

  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customerOptions, setCustomerOptions] = useState<Array<{ value: string; label: string }>>([]);

  const form = useForm<KontrakFormValues>({
    resolver: zodResolver(kontrakSchema),
  });
  const { confirmLeave, showDialog, handleConfirm, handleCancel } = useUnsavedChanges(form.formState.isDirty);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      try {
        const { data: customers } = await apiFetch<Array<{ id: string; nama: string }>>('/api/v1/master/customer');
        if (cancelled) return;
        setCustomerOptions(customers.map(item => ({ value: item.id, label: item.nama })));

        const { data: kontrakData } = await apiFetch<{
          customer_id: string; nama: string; nomor_kontrak: string | null;
          tanggal_mulai: string | null; tanggal_selesai: string | null;
          tanggal_tanda_tangan: string | null;
          penandatangan_rri_nama: string | null; penandatangan_rri_jabatan: string | null;
          penandatangan_customer_nama: string | null; penandatangan_customer_jabatan: string | null;
          catatan: string | null;
          is_active: boolean;
        }>(`/api/v1/master/kontrak/${id}`);

        if (cancelled) return;
        if (kontrakData) {
          form.reset({
            customerId: kontrakData.customer_id,
            nomorKontrak: kontrakData.nomor_kontrak || '',
            nama: kontrakData.nama,
            tanggalMulai: kontrakData.tanggal_mulai || '',
            tanggalSelesai: kontrakData.tanggal_selesai || '',
            tanggalTandaTangan: kontrakData.tanggal_tanda_tangan || '',
            penandatanganRriNama: kontrakData.penandatangan_rri_nama || '',
            penandatanganRriJabatan: kontrakData.penandatangan_rri_jabatan || '',
            penandatanganCustomerNama: kontrakData.penandatangan_customer_nama || '',
            penandatanganCustomerJabatan: kontrakData.penandatangan_customer_jabatan || '',
            catatan: kontrakData.catatan || '',
            isActive: kontrakData.is_active,
          });
        }
      } catch (err) {
        if (!cancelled) toast.error(err instanceof Error ? err.message : 'Gagal memuat data kontrak');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, form]);

  const onSubmit = async (data: KontrakFormValues) => {
    if (!id) return;
    setLoading(true);
    const toastId = toast.loading('Memperbarui kontrak...');
    try {
      await apiFetch(`/api/v1/master/kontrak/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          customer_id: data.customerId,
          nomor_kontrak: data.nomorKontrak || null,
          nama: data.nama,
          tanggal_mulai: data.tanggalMulai || null,
          tanggal_selesai: data.tanggalSelesai || null,
          tanggal_tanda_tangan: data.tanggalTandaTangan || null,
          penandatangan_rri_nama: data.penandatanganRriNama || null,
          penandatangan_rri_jabatan: data.penandatanganRriJabatan || null,
          penandatangan_customer_nama: data.penandatanganCustomerNama || null,
          penandatangan_customer_jabatan: data.penandatanganCustomerJabatan || null,
          catatan: data.catatan || null,
          is_active: data.isActive,
        }),
      });
      toast.success('Kontrak berhasil diperbarui!', { id: toastId });
      setTimeout(() => router.push('/dashboard/master/kontrak'), 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return (
    <div className="mx-auto max-w-xl py-8">
      <PageHeader title="Edit Kontrak" />
      <div className="min-h-[200px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Edit Kontrak"
        description="Formulir untuk mengedit data kontrak"
        actions={
          <Button variant="back" onClick={() => confirmLeave(() => router.push('/dashboard/master/kontrak'))}>
            Kembali
          </Button>
        }
      />

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
        <div>
          <label className="block text-sm font-medium mb-1">Customer *</label>
          <select {...form.register('customerId')} className="w-full px-3 py-2 border rounded-md">
            <option value="">Pilih Customer</option>
            {customerOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {form.formState.errors.customerId && (
            <p className="text-sm text-destructive mt-1">{form.formState.errors.customerId.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Nomor Kontrak</label>
          <input type="text" {...form.register('nomorKontrak')} className="w-full px-3 py-2 border rounded-md" placeholder="C-BJS-25-XXXX-XXXX" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Nama Kontrak *</label>
          <input type="text" {...form.register('nama')} className="w-full px-3 py-2 border rounded-md" />
          {form.formState.errors.nama && (
            <p className="text-sm text-destructive mt-1">{form.formState.errors.nama.message}</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tanggal Mulai</label>
            <DatePicker value={form.watch('tanggalMulai')} onChange={(v) => form.setValue('tanggalMulai', v)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tanggal Selesai</label>
            <DatePicker value={form.watch('tanggalSelesai')} onChange={(v) => form.setValue('tanggalSelesai', v)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tgl Tanda Tangan</label>
            <DatePicker value={form.watch('tanggalTandaTangan')} onChange={(v) => form.setValue('tanggalTandaTangan', v)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-lg p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Penandatangan RRI</p>
            <input type="text" {...form.register('penandatanganRriNama')} className="w-full px-3 py-2 border rounded-md mb-2" placeholder="Nama" />
            <input type="text" {...form.register('penandatanganRriJabatan')} className="w-full px-3 py-2 border rounded-md" placeholder="Jabatan" />
          </div>
          <div className="border rounded-lg p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Penandatangan Customer</p>
            <input type="text" {...form.register('penandatanganCustomerNama')} className="w-full px-3 py-2 border rounded-md mb-2" placeholder="Nama" />
            <input type="text" {...form.register('penandatanganCustomerJabatan')} className="w-full px-3 py-2 border rounded-md" placeholder="Jabatan" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Catatan</label>
          <textarea {...form.register('catatan')} className="w-full px-3 py-2 border rounded-md" rows={3} placeholder="Catatan (opsional)" />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            checked={form.watch('isActive')}
            onCheckedChange={(v) => form.setValue('isActive', !!v)}
          />
          <label className="text-sm font-medium">Aktif</label>
        </div>

        <FormActions loading={loading} onCancel={() => confirmLeave(() => router.push('/dashboard/master/kontrak'))} />
      </form>

      <ConfirmLeaveDialog open={showDialog} onConfirm={handleConfirm} onCancel={handleCancel} />
    </div>
  );
}
