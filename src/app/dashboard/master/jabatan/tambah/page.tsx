"use client";

import { useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { FormActions } from '@/components/form-actions';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { ConfirmLeaveDialog } from '@/components/confirm-leave-dialog';

const schema = z.object({
  nama: z.string().min(2, { message: "Nama jabatan harus diisi" }),
  keterangan: z.string().optional(),
});

type FormValues = z.input<typeof schema>;

export default function TambahJabatanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
  });
  const { confirmLeave, showDialog, handleConfirm, handleCancel } = useUnsavedChanges(form.formState.isDirty);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    const toastId = toast.loading('Menyimpan jabatan...');
    try {
      await apiFetch('/api/v1/master/jabatan', {
        method: 'POST',
        body: JSON.stringify({
          nama: data.nama,
          keterangan: data.keterangan || null,
        }),
      });
      toast.success('Jabatan berhasil ditambahkan!', { id: toastId });
      form.reset();
      setTimeout(() => router.push('/dashboard/master/jabatan'), 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Tambah Jabatan"
        description="Input data jabatan baru"
        actions={
          <Button variant="back" onClick={() => confirmLeave(() => router.push('/dashboard/master/jabatan'))}>
            Kembali
          </Button>
        }
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="nama"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Jabatan</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Masukkan nama jabatan" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="keterangan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Keterangan</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={3} placeholder="Keterangan tambahan (opsional)" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormActions loading={loading} onCancel={() => confirmLeave(() => router.push('/dashboard/master/jabatan'))} />
        </form>
      </Form>
      <ConfirmLeaveDialog open={showDialog} onConfirm={handleConfirm} onCancel={handleCancel} />
    </div>
  );
}