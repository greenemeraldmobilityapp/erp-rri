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
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { FormActions } from '@/components/form-actions';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { ConfirmLeaveDialog } from '@/components/confirm-leave-dialog';

const schema = z.object({
  nik: z.string().min(2, { message: "NIK harus diisi" }),
  nama: z.string().min(2, { message: "Nama harus diisi" }),
  email: z.string().email({ message: "Email tidak valid" }),
  noHp: z.string().optional(),
  jabatanId: z.string().min(1, { message: "Jabatan harus dipilih" }),
  gajiPokok: z.coerce.number().nonnegative().optional(),
  tanggalMasuk: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FormValues = z.input<typeof schema>;

export default function TambahKaryawanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [jabatanOptions, setJabatanOptions] = useState<Array<{ value: string; label: string }>>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { isActive: true },
  });
  const { confirmLeave, showDialog, handleConfirm, handleCancel } = useUnsavedChanges(form.formState.isDirty);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiFetch<Array<{ id: string; nama: string }>>('/api/v1/master/jabatan');
        setJabatanOptions(data.map(item => ({ value: item.id, label: item.nama })));
      } catch (err) {
        console.error('Error loading jabatan:', err);
      }
    })();
  }, []);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    const toastId = toast.loading('Menyimpan karyawan...');
    try {
      await apiFetch('/api/v1/master/karyawan', {
        method: 'POST',
        body: JSON.stringify({
          nik: data.nik,
          nama: data.nama,
          email: data.email,
          no_hp: data.noHp || null,
          jabatan_id: data.jabatanId,
          gaji_pokok: data.gajiPokok || null,
          tanggal_masuk: data.tanggalMasuk ? new Date(data.tanggalMasuk).toISOString() : null,
          is_active: data.isActive,
        }),
      });
      toast.success('Karyawan berhasil ditambahkan!', { id: toastId });
      form.reset();
      setTimeout(() => router.push('/dashboard/master/karyawan'), 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Tambah Karyawan"
        description="Input data karyawan baru"
        actions={
          <Button variant="back" onClick={() => confirmLeave(() => router.push('/dashboard/master/karyawan'))}>
            Kembali
          </Button>
        }
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="nik"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIK</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nomor Induk Karyawan" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nama lengkap" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="email@contoh.com" type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="jabatanId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jabatan</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jabatan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {jabatanOptions.map(opt => (
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
              name="gajiPokok"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gaji Pokok</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={field.value != null ? String(field.value) : ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="tanggalMasuk"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal Masuk</FormLabel>
                <FormControl>
                  <DatePicker value={field.value} onChange={field.onChange} />
                </FormControl>
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
          <FormActions loading={loading} onCancel={() => confirmLeave(() => router.push('/dashboard/master/karyawan'))} />
        </form>
      </Form>
      <ConfirmLeaveDialog open={showDialog} onConfirm={handleConfirm} onCancel={handleCancel} />
    </div>
  );
}