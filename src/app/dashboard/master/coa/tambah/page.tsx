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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { FormActions } from '@/components/form-actions';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { ConfirmLeaveDialog } from '@/components/confirm-leave-dialog';

const coaSchema = z.object({
  kode: z.string().min(1, { message: "Kode akun harus diisi" }),
  nama: z.string().min(2, { message: "Nama akun harus diisi" }),
  tipe: z.string().min(1, { message: "Tipe akun harus dipilih" }),
  indukId: z.string().optional(),
  keterangan: z.string().optional(),
});

type COAFormValues = z.input<typeof coaSchema>;

const TIPE_OPTIONS = [
  { value: 'Asset', label: 'Asset' },
  { value: 'Liability', label: 'Liability' },
  { value: 'Equity', label: 'Equity' },
  { value: 'Revenue', label: 'Revenue' },
  { value: 'Expense', label: 'Expense' },
];

export default function TambahCOAPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [parentOptions, setParentOptions] = useState<Array<{ value: string; label: string }>>([]);

  const form = useForm<COAFormValues>({
    resolver: zodResolver(coaSchema),
  });
  const { confirmLeave, showDialog, handleConfirm, handleCancel } = useUnsavedChanges(form.formState.isDirty);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiFetch<Array<{ id: string; kode: string; nama: string }>>('/api/v1/master/coa');
        setParentOptions(data.map(item => ({
          value: item.id,
          label: `${item.kode} - ${item.nama}`,
        })));
      } catch (err) {
        console.error('Error loading COA:', err);
      }
    })();
  }, []);

  const onSubmit = async (data: COAFormValues) => {
    setLoading(true);
    const toastId = toast.loading('Menyimpan akun...');
    try {
      await apiFetch('/api/v1/master/coa', {
        method: 'POST',
        body: JSON.stringify({
          kode: data.kode,
          nama: data.nama,
          tipe: data.tipe,
          induk_id: data.indukId || null,
          keterangan: data.keterangan || null,
        }),
      });
      toast.success('Akun berhasil ditambahkan!', { id: toastId });
      form.reset();
      setTimeout(() => router.push('/dashboard/master/coa'), 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Tambah Akun (COA)"
        description="Input data akun baru"
        actions={
          <Button variant="back" onClick={() => confirmLeave(() => router.push('/dashboard/master/coa'))}>
            Kembali
          </Button>
        }
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="kode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kode Akun</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Contoh: 1-1100" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tipe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipe Akun</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tipe akun" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIPE_OPTIONS.map(opt => (
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
          </div>
          <FormField
            control={form.control}
            name="nama"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Akun</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nama lengkap akun" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="indukId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Akun Induk</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Tidak ada (Akun Utama)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Tidak Ada (Akun Utama)</SelectItem>
                    {parentOptions.map(opt => (
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
            name="keterangan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Keterangan</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={3} placeholder="Keterangan tambahan" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormActions loading={loading} onCancel={() => confirmLeave(() => router.push('/dashboard/master/coa'))} />
        </form>
      </Form>
      <ConfirmLeaveDialog open={showDialog} onConfirm={handleConfirm} onCancel={handleCancel} />
    </div>
  );
}