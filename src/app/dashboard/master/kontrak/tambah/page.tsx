"use client";

import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { FormActions } from '@/components/form-actions';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { ConfirmLeaveDialog } from '@/components/confirm-leave-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileUp, Upload, FileText, X } from 'lucide-react';

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

export default function TambahKontrakPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customerOptions, setCustomerOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [activeTab, setActiveTab] = useState('manual');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [fileUploading, setFileUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const res = await apiFetch<{ id: string }>('/api/v1/master/kontrak', {
        method: 'POST',
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

      if (uploadFile) {
        setFileUploading(true);
        toast.loading('Mengupload file...', { id: toastId });
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('jenis_dokumen', 'kontrak');
        const { apiFetchFormData } = await import('@/lib/api/client');
        await apiFetchFormData(`/api/v1/master/kontrak/${res.data.id}/documents`, formData);
      }

      toast.success('Kontrak berhasil ditambahkan!', { id: toastId });
      form.reset();
      setUploadFile(null);
      setTimeout(() => router.push('/dashboard/master/kontrak'), 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan', { id: toastId });
    } finally {
      setLoading(false);
      setFileUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Tambah Kontrak"
        description="Isi data kontrak secara manual"
        actions={
          <Button variant="back" onClick={() => confirmLeave(() => router.push('/dashboard/master/kontrak'))}>
            Kembali
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="ocr" disabled>OCR Upload</TabsTrigger>
          <TabsTrigger value="manual">Input Manual</TabsTrigger>
        </TabsList>

        <TabsContent value="ocr" className="space-y-6 mt-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileUp className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Fitur OCR dalam Pengembangan</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Ekstraksi data kontrak otomatis dari PDF menggunakan AI sedang disempurnakan. 
                Untuk saat ini, silakan gunakan formulir Input Manual untuk menambahkan kontrak baru.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Pilih customer" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customerOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nomorKontrak"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomor Kontrak</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="C-BJS-25-XXXX-XXXX" />
                      </FormControl>
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
                    <FormLabel>Nama Kontrak</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nama/kode kontrak" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="tanggalMulai"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Mulai</FormLabel>
                      <FormControl>
                        <DatePicker value={field.value} onChange={field.onChange} />
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
                        <DatePicker value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tanggalTandaTangan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tgl Tanda Tangan</FormLabel>
                      <FormControl>
                        <DatePicker value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium">Penandatangan RRI</p>
                  <FormField
                    control={form.control}
                    name="penandatanganRriNama"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nama penandatangan RRI" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="penandatanganRriJabatan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jabatan</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Jabatan" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="border rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium">Penandatangan Customer</p>
                  <FormField
                    control={form.control}
                    name="penandatanganCustomerNama"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nama penandatangan customer" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="penandatanganCustomerJabatan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jabatan</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Jabatan" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="catatan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Catatan (opsional)" rows={3} />
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

              <div className="flex items-center gap-3 rounded-lg border p-3">
                <span className="text-sm font-medium shrink-0">Dokumen Kontrak:</span>
                {uploadFile ? (
                  <span className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1 text-xs max-w-[200px]">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{uploadFile.name}</span>
                    <button type="button" onClick={() => setUploadFile(null)} className="shrink-0 text-muted-foreground hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Belum ada file</span>
                )}
                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setUploadFile(f); if (e.target) e.target.value = ''; }} />
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="ml-auto shrink-0">
                  <Upload className="h-3.5 w-3.5 mr-1" /> Pilih File
                </Button>
              </div>

              <FormActions loading={loading} onCancel={() => confirmLeave(() => router.push('/dashboard/master/kontrak'))} />
            </form>
          </Form>
        </TabsContent>
      </Tabs>

      <ConfirmLeaveDialog open={showDialog} onConfirm={handleConfirm} onCancel={handleCancel} />
    </div>
  );
}
