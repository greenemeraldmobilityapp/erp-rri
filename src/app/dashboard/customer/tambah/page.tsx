"use client";

import { useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const customerSchema = z.object({
  nama: z.string().min(2, { message: "Nama customer harus diisi" }),
  kode: z.string().min(2, { message: "Kode customer harus diisi" }),
  alamat: z.string().optional(),
  kontak: z.string().optional(),
  termsOfPayment: z.enum(['Net 30', 'Net 60', 'Cash', 'Custom'], {
    message: "Pilih terms of payment yang valid",
  }),
  isActive: z.boolean().default(true),
});

type CustomerFormValues = z.input<typeof customerSchema>;

export default function TambahCustomerPage() {
  const router = useRouter();
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (data: CustomerFormValues) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch('/api/v1/master/customer', {
        method: 'POST',
        body: JSON.stringify({
          nama: data.nama,
          kode: data.kode,
          alamat: data.alamat,
          kontak: data.kontak,
          terms_of_payment: data.termsOfPayment,
          is_active: data.isActive,
        }),
      });

      setSuccess('Customer berhasil ditambahkan!');
      form.reset();
      
      setTimeout(() => {
        router.push('/dashboard/customer');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Tambah Customer Baru</h1>
        <p className="text-sm text-muted-foreground">Formulir untuk menambahkan data customer baru</p>
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="nama" render={({ field }) => (
            <FormItem><FormLabel>Nama Customer</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="kode" render={({ field }) => (
            <FormItem><FormLabel>Kode Customer</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="alamat" render={({ field }) => (
            <FormItem><FormLabel>Alamat</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="kontak" render={({ field }) => (
            <FormItem><FormLabel>Kontak</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="termsOfPayment" render={({ field }) => (
            <FormItem><FormLabel>Terms of Payment</FormLabel><Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Pilih Terms of Payment" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="Net 30">Net 30</SelectItem>
                <SelectItem value="Net 60">Net 60</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="isActive" render={({ field }) => (
            <FormItem><div className="flex items-center gap-2 pt-2"><FormControl><input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4 text-primary focus-visible:ring-ring border-border rounded" /></FormControl><FormLabel className="mb-0">Aktif</FormLabel></div><FormMessage /></FormItem>
          )} />
          <div className="pt-4">
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Menyimpan...' : 'Simpan Customer'}
            </Button>
          </div>
        </form>
      </Form>

      <div className="mt-6">
        <div className="flex justify-between items-center">
          <Button variant="link" asChild>
            <Link href="/dashboard/customer">
              Kembali ke Daftar Customer
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
