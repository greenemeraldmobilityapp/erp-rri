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

const picSchema = z.object({
  customerId: z.string().min(1, { message: "Customer harus dipilih" }),
  nama: z.string().min(2, { message: "Nama PIC harus diisi" }),
  jenisKelamin: z.enum(['L', 'P'], { message: 'Jenis kelamin harus dipilih' }),
  jabatan: z.string().optional(),
  noHp: z.string().optional(),
  email: z.string().email({ message: "Email tidak valid" }).optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

type PICFormValues = z.input<typeof picSchema>;

export default function TambahPICCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customerOptions, setCustomerOptions] = useState<Array<{ value: string; label: string }>>([]);

  const form = useForm<PICFormValues>({
    resolver: zodResolver(picSchema),
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

  const onSubmit = async (data: PICFormValues) => {
    setLoading(true);
    const toastId = toast.loading('Menyimpan PIC...');
    try {
      await apiFetch('/api/v1/master/pic-customer', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: data.customerId,
          nama: data.nama,
          jenis_kelamin: data.jenisKelamin,
          jabatan: data.jabatan || null,
          no_hp: data.noHp || null,
          email: data.email || null,
          is_active: data.isActive,
        }),
      });
      toast.success('PIC Customer berhasil ditambahkan!', { id: toastId });
      form.reset();
      setTimeout(() => router.push('/dashboard/master/pic-customer'), 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Tambah PIC Customer"
        description="Input data PIC customer baru"
        actions={
          <Button variant="back" onClick={() => confirmLeave(() => router.push('/dashboard/master/pic-customer'))}>
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
                <FormLabel>Nama PIC</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Masukkan nama PIC" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="jenisKelamin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jenis Kelamin <span className="text-destructive">*</span></FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis kelamin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="L">Laki-laki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="jabatan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jabatan</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Jabatan PIC" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="noHp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>No. HP</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="08xxxxxxxxxx" type="tel" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="email@example.com" type="email" />
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
          <FormActions loading={loading} onCancel={() => confirmLeave(() => router.push('/dashboard/master/pic-customer'))} />
        </form>
      </Form>
      <ConfirmLeaveDialog open={showDialog} onConfirm={handleConfirm} onCancel={handleCancel} />
    </div>
  );
}