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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { FormActions } from '@/components/form-actions';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { ConfirmLeaveDialog } from '@/components/confirm-leave-dialog';

const supplierSchema = z.object({
  nama: z.string().min(2, { message: "Nama supplier harus diisi" }),
  kode: z.string().min(2, { message: "Kode supplier harus diisi" }),
  namaToko: z.string().optional(),
  linkToko: z.string().optional(),
  noRekening: z.string().optional(),
  kontak: z.string().optional(),
  termsOfPayment: z.string().optional(),
  isMarketplace: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

type SupplierFormValues = z.input<typeof supplierSchema>;

const TERMS_OPTIONS = [
  { value: 'Net 30', label: 'Net 30' },
  { value: 'Net 60', label: 'Net 60' },
  { value: 'Cash', label: 'Cash' },
  { value: 'Custom', label: 'Custom' },
];

export default function TambahSupplierPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      isMarketplace: false,
      isActive: true,
    },
  });
  const { confirmLeave, showDialog, handleConfirm, handleCancel } = useUnsavedChanges(form.formState.isDirty);

  const onSubmit = async (data: SupplierFormValues) => {
    setLoading(true);
    const toastId = toast.loading('Menyimpan supplier...');
    try {
      await apiFetch('/api/v1/master/supplier', {
        method: 'POST',
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
      toast.success('Supplier berhasil ditambahkan!', { id: toastId });
      form.reset();
      setTimeout(() => router.push('/dashboard/master/supplier'), 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Tambah Supplier"
        description="Input data supplier baru"
        actions={
          <Button variant="back" onClick={() => confirmLeave(() => router.push('/dashboard/master/supplier'))}>
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
                <FormLabel>Nama Supplier</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Masukkan nama supplier" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="kode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kode Supplier</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Masukkan kode supplier" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="namaToko"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Toko (Marketplace)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nama toko di marketplace" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="linkToko"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link Toko (Marketplace)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="https://shopee.co.id/..." type="url" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="noRekening"
            render={({ field }) => (
              <FormItem>
                <FormLabel>No. Rekening</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nomor rekening" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="kontak"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kontak</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nomor telepon" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="termsOfPayment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Terms of Payment</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih terms of payment" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TERMS_OPTIONS.map(opt => (
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
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="isMarketplace"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="mb-0">Supplier Marketplace (Shopee/Tokopedia)</FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
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
          </div>
          <FormActions loading={loading} onCancel={() => confirmLeave(() => router.push('/dashboard/master/supplier'))} />
        </form>
      </Form>
      <ConfirmLeaveDialog open={showDialog} onConfirm={handleConfirm} onCancel={handleCancel} />
    </div>
  );
}