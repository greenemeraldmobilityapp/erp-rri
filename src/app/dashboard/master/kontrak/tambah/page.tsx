"use client";

import { useState, useEffect, useRef } from 'react';
import { apiFetch, apiFetchFormData } from '@/lib/api/client';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { FormActions } from '@/components/form-actions';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { ConfirmLeaveDialog } from '@/components/confirm-leave-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, FileUp, X } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

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

interface OcrItem {
  kode: string
  uom: string
  nama: string
  harga: number
}

interface OcrResult {
  nomor_kontrak: string | null
  nama_kontrak: string | null
  nama_customer: string | null
  rri_signatory: { nama: string; jabatan: string } | null
  customer_signatory: { nama: string; jabatan: string } | null
  tanggal_mulai: string | null
  tanggal_selesai: string | null
  tanggal_tanda_tangan: string | null
  items: OcrItem[]
}

function parseOcrDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`
  }
  return dateStr
}

export default function TambahKontrakPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customerOptions, setCustomerOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [activeTab, setActiveTab] = useState('ocr');

  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [createAsBarang, setCreateAsBarang] = useState<Record<number, boolean>>({});
  const [ocrCustomerId, setOcrCustomerId] = useState('');
  const [ocrNamaKontrak, setOcrNamaKontrak] = useState('');
  const [ocrNomorKontrak, setOcrNomorKontrak] = useState('');
  const [ocrRriNama, setOcrRriNama] = useState('');
  const [ocrRriJabatan, setOcrRriJabatan] = useState('');
  const [ocrCustomerNama, setOcrCustomerNama] = useState('');
  const [ocrCustomerJabatan, setOcrCustomerJabatan] = useState('');
  const [ocrTglMulai, setOcrTglMulai] = useState('');
  const [ocrTglSelesai, setOcrTglSelesai] = useState('');
  const [ocrTglTandaTangan, setOcrTglTandaTangan] = useState('');
  const [ocrCatatan, setOcrCatatan] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

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
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  const handleOcrUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Hanya file PDF yang didukung');
      return;
    }
    setOcrProcessing(true);
    setOcrResult(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const r = await apiFetchFormData<OcrResult>('/api/v1/ai/ocr-kontrak', formData);
      const result = r.data;
      setOcrResult(result);
      setOcrNamaKontrak(result.nama_kontrak || '');
      setOcrNomorKontrak(result.nomor_kontrak || '');
      setOcrTglMulai(parseOcrDate(result.tanggal_mulai));
      setOcrTglSelesai(parseOcrDate(result.tanggal_selesai));
      setOcrTglTandaTangan(parseOcrDate(result.tanggal_tanda_tangan));
      setOcrRriNama(result.rri_signatory?.nama || '');
      setOcrRriJabatan(result.rri_signatory?.jabatan || '');
      setOcrCustomerNama(result.customer_signatory?.nama || '');
      setOcrCustomerJabatan(result.customer_signatory?.jabatan || '');
      if (result.nama_customer) {
        const match = customerOptions.find(c =>
          c.label.toLowerCase().includes(result.nama_customer!.toLowerCase())
        );
        if (match) setOcrCustomerId(match.value);
      }
      const defaultChecked: Record<number, boolean> = {};
      result.items.forEach((_, i) => { defaultChecked[i] = true; });
      setCreateAsBarang(defaultChecked);
      toast.success('OCR berhasil! Silakan review data.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memproses OCR');
    } finally {
      setOcrProcessing(false);
    }
  };

  const handleOcrDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleOcrUpload(file);
  };

  const handleOcrConfirm = async () => {
    if (!ocrCustomerId) {
      toast.error('Pilih customer terlebih dahulu');
      return;
    }
    if (!ocrNamaKontrak) {
      toast.error('Nama kontrak harus diisi');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Menyimpan kontrak...');
    try {
      await apiFetch('/api/v1/master/kontrak/from-ocr', {
        method: 'POST',
        body: JSON.stringify({
          customerId: ocrCustomerId,
          nomorKontrak: ocrNomorKontrak || undefined,
          nama: ocrNamaKontrak,
          tanggalMulai: ocrTglMulai || undefined,
          tanggalSelesai: ocrTglSelesai || undefined,
          tanggalTandaTangan: ocrTglTandaTangan || undefined,
          penandatanganRriNama: ocrRriNama || undefined,
          penandatanganRriJabatan: ocrRriJabatan || undefined,
          penandatanganCustomerNama: ocrCustomerNama || undefined,
          penandatanganCustomerJabatan: ocrCustomerJabatan || undefined,
          catatan: ocrCatatan || undefined,
          items: (ocrResult?.items || []).map((item, i) => ({
            kode: item.kode,
            uom: item.uom,
            nama: item.nama,
            harga: item.harga,
            createAsBarang: createAsBarang[i] ?? false,
          })),
        }),
      });
      toast.success('Kontrak berhasil dibuat!', { id: toastId });
      setTimeout(() => router.push('/dashboard/master/kontrak'), 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const clearOcr = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setOcrResult(null);
    setOcrNamaKontrak('');
    setOcrNomorKontrak('');
    setOcrTglMulai('');
    setOcrTglSelesai('');
    setOcrTglTandaTangan('');
    setOcrRriNama('');
    setOcrRriJabatan('');
    setOcrCustomerNama('');
    setOcrCustomerJabatan('');
    setOcrCustomerId('');
    setOcrCatatan('');
    setCreateAsBarang({});
  };

  const onSubmit = async (data: KontrakFormValues) => {
    setLoading(true);
    const toastId = toast.loading('Menyimpan kontrak...');
    try {
      await apiFetch('/api/v1/master/kontrak', {
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
      toast.success('Kontrak berhasil ditambahkan!', { id: toastId });
      form.reset();
      setTimeout(() => router.push('/dashboard/master/kontrak'), 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => 'Rp ' + val.toLocaleString('id-ID');

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Tambah Kontrak"
        description="Upload PDF kontrak untuk OCR atau input manual"
        actions={
          <Button variant="back" onClick={() => confirmLeave(() => router.push('/dashboard/master/kontrak'))}>
            Kembali
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="ocr">OCR Upload</TabsTrigger>
          <TabsTrigger value="manual">Input Manual</TabsTrigger>
        </TabsList>

        <TabsContent value="ocr" className="space-y-6 mt-6">
          {!ocrResult ? (
            <Card>
              <CardContent className="pt-6">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleOcrDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 cursor-pointer transition-colors hover:border-accent/50 hover:bg-muted/50"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleOcrUpload(file);
                    }}
                  />
                  {ocrProcessing ? (
                    <>
                      <Loader2 className="h-10 w-10 text-accent animate-spin mb-3" />
                      <p className="text-sm text-muted-foreground">Memproses OCR dengan AI...</p>
                    </>
                  ) : (
                    <>
                      <FileUp className="h-10 w-10 text-muted-foreground mb-3" />
                      <p className="text-sm font-medium">Drag & drop file PDF kontrak di sini</p>
                      <p className="text-xs text-muted-foreground mt-1">atau klik untuk pilih file</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Hasil Ekstraksi OCR</h2>
                <Button variant="outline" size="sm" onClick={clearOcr}>
                  <X className="h-4 w-4 mr-1" /> Reset
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Customer</label>
                    <Select value={ocrCustomerId} onValueChange={setOcrCustomerId}>
                      <SelectTrigger><SelectValue placeholder="Pilih customer" /></SelectTrigger>
                      <SelectContent>
                        {customerOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Nomor Kontrak</label>
                    <Input value={ocrNomorKontrak} onChange={e => setOcrNomorKontrak(e.target.value)} placeholder="Dari OCR" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Nama Kontrak *</label>
                    <Input value={ocrNamaKontrak} onChange={e => setOcrNamaKontrak(e.target.value)} placeholder="Dari OCR" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm font-medium">Tgl Mulai</label>
                      <DatePicker value={ocrTglMulai} onChange={setOcrTglMulai} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Tgl Selesai</label>
                      <DatePicker value={ocrTglSelesai} onChange={setOcrTglSelesai} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tgl Tanda Tangan</label>
                    <DatePicker value={ocrTglTandaTangan} onChange={setOcrTglTandaTangan} />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="border rounded-lg p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Penandatangan RRI</p>
                    <Input value={ocrRriNama} onChange={e => setOcrRriNama(e.target.value)} placeholder="Nama" className="mb-2" />
                    <Input value={ocrRriJabatan} onChange={e => setOcrRriJabatan(e.target.value)} placeholder="Jabatan" />
                  </div>
                  <div className="border rounded-lg p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Penandatangan Customer</p>
                    <Input value={ocrCustomerNama} onChange={e => setOcrCustomerNama(e.target.value)} placeholder="Nama" className="mb-2" />
                    <Input value={ocrCustomerJabatan} onChange={e => setOcrCustomerJabatan(e.target.value)} placeholder="Jabatan" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Catatan</label>
                    <Textarea value={ocrCatatan} onChange={e => setOcrCatatan(e.target.value)} rows={2} />
                  </div>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Item Barang</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">Buat</TableHead>
                        <TableHead>Kode</TableHead>
                        <TableHead>Nama Barang</TableHead>
                        <TableHead>Satuan</TableHead>
                        <TableHead className="text-right">Harga</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ocrResult.items.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Checkbox
                              checked={createAsBarang[i] ?? false}
                              onCheckedChange={(v) => setCreateAsBarang(prev => ({ ...prev, [i]: !!v }))}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs">{item.kode}</TableCell>
                          <TableCell>{item.nama}</TableCell>
                          <TableCell>{item.uom}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.harga)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={clearOcr}>Batal</Button>
                <Button onClick={handleOcrConfirm} disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Buat Kontrak dari OCR
                </Button>
              </div>
            </div>
          )}

          {previewUrl && !ocrResult && (
            <Card>
              <CardContent className="pt-4">
                <iframe src={previewUrl} className="w-full h-64 rounded-md border" title="PDF Preview" />
              </CardContent>
            </Card>
          )}
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

              <FormActions loading={loading} onCancel={() => confirmLeave(() => router.push('/dashboard/master/kontrak'))} />
            </form>
          </Form>
        </TabsContent>
      </Tabs>

      <ConfirmLeaveDialog open={showDialog} onConfirm={handleConfirm} onCancel={handleCancel} />
    </div>
  );
}
