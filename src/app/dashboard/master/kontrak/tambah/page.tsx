"use client";

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { FormActions } from '@/components/form-actions';
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

export default function TambahKontrakPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customerOptions, setCustomerOptions] = useState<Array<{ value: string; label: string }>>([]);

  const form = useForm<KontrakFormValues>({
    resolver: zodResolver(kontrakSchema),
    defaultValues: { isActive: true },
  });
  const { confirmLeave, showDialog, handleConfirm, handleCancel } = useUnsavedChanges(form.formState.isDirty);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiFetch<Array<{ id: string; nama: string }>>('/api/v1/master/customer');
        setCustomerOptions(data.map(item => ({
          value: item.id,
          label: item.nama,
        })));
      } catch (err) {
        console.error('Error loading customers:', err);
      }
    })();
  }, []);

  const onSubmit = async (data: KontrakFormValues) => {
    setLoading(true);
    const toastId = toast.loading('Menyimpan kontrak...');
    try {
      await apiFetch('/api/v1/master/kontrak', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: data.customerId,
          nama: data.nama,
          tanggal_mulai: data.tanggalMulai ? new Date(data.tanggalMulai).toISOString() : null,
          tanggal_selesai: data.tanggalSelesai ? new Date(data.tanggalSelesai).toISOString() : null,
          is_active: data.isActive,
        }),
      });
      toast.success('Kontrak berhasil ditambahkan!', { id: toastId });
      form.reset();
      setTimeout(() => router.push('/dashboard/master/kontrak'), 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Tambah Kontrak"
        description="Input data kontrak baru"
        actions={
          <Button variant="back" onClick={() => confirmLeave(() => router.push('/dashboard/master/kontrak'))}>
            Kembali
          </Button>
        }
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih customer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customerOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nama"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Kontrak</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nama/kode kontrak" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="tanggalMulai"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Mulai</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tanggalSelesai"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Selesai</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="mb-0">Aktif</FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormActions loading={loading} onCancel={() => confirmLeave(() => router.push('/dashboard/master/kontrak'))} />
        </form>
      </Form>
      <ConfirmLeaveDialog open={showDialog} onConfirm={handleConfirm} onCancel={handleCancel} />
    </div>
  );
}