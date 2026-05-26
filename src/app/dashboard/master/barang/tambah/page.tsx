"use client";

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { FormActions } from '@/components/form-actions';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { ConfirmLeaveDialog } from '@/components/confirm-leave-dialog';
import { KelolaKategoriDialog } from '@/components/kelola-kategori-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Loader2, FileDown, Copy, Check, Plus } from 'lucide-react';

const barangSchema = z.object({
  nama: z.string().min(2, { message: "Nama barang harus diisi" }),
  kode: z.string().min(2, { message: "Kode barang harus diisi" }),
  kategori_id: z.string().min(1, { message: "Kategori harus dipilih" }),
  satuan: z.string().min(1, { message: "Satuan harus diisi" }),
  spesifikasi: z.string().optional(),
  justification: z.string().optional(),
  image_url: z.string().optional(),
  harga_beli_default: z.coerce.number().nonnegative().optional(),
  harga_jual_default: z.coerce.number().nonnegative().optional(),
  stok_minimum: z.coerce.number().nonnegative().default(0),
  is_active: z.boolean().default(true),
});
type BarangFormValues = z.input<typeof barangSchema>;

interface ImportItem {
  kode: string;
  nama: string;
  satuan: string;
  harga: number;
}

const GEMINI_PROMPT = `Extract all item data from this contract PDF as a JSON array. Each item must have these exact fields:
- "kode": string (item code, e.g. "CLT005")
- "nama": string (item name, e.g. "Lion Star Floor Brush with handle")
- "satuan": string (unit of measure, e.g. "pcs", "pack", "bottle")
- "harga": number (price in IDR per unit, e.g. 28000)

Return ONLY a valid JSON array, no markdown formatting, no explanation.
Example:
[{"kode":"CLT005","nama":"Lion Star Floor Brush with handle","satuan":"pcs","harga":28000}]`

export default function TambahBarangPage() {
  const router = useRouter();
  const form = useForm<BarangFormValues>({ resolver: zodResolver(barangSchema) });
  const { confirmLeave, showDialog, handleConfirm, handleCancel } = useUnsavedChanges(form.formState.isDirty);
  const [loading, setLoading] = useState(false);
  const [kategoriOptions, setKategoriOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [activeTab, setActiveTab] = useState('manual');
  const [kelolaDialogOpen, setKelolaDialogOpen] = useState(false);

  const [kontrakOptions, setKontrakOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedKontrakId, setSelectedKontrakId] = useState('');
  const [importKategoriId, setImportKategoriId] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [parsedItems, setParsedItems] = useState<ImportItem[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchKategoriOptions = useCallback(async () => {
    try {
      const { data } = await apiFetch<Array<{ id: string; nama: string }>>('/api/v1/master/kategori-barang');
      setKategoriOptions((data ?? []).map(item => ({ value: item.id, label: item.nama })));
    } catch { /* ignore */ }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchKategoriOptions() }, [fetchKategoriOptions]);

  useEffect(() => {
    if (activeTab !== 'import') return;
    (async () => {
      try {
        const { data } = await apiFetch<Array<{ id: string; nomor_kontrak: string; nama: string }>>('/api/v1/master/kontrak');
        setKontrakOptions((data ?? []).map(item => ({
          value: item.id,
          label: item.nomor_kontrak ? `${item.nomor_kontrak} - ${item.nama}` : item.nama,
        })));
      } catch { /* ignore */ }
    })();
  }, [activeTab]);

  const onSubmit = async (data: BarangFormValues) => {
    setLoading(true);
    const toastId = toast.loading('Menyimpan barang...');
    try {
      await apiFetch('/api/v1/master/barang', { method: 'POST', body: JSON.stringify(data) });
      toast.success('Barang berhasil ditambahkan!', { id: toastId });
      form.reset();
      setTimeout(() => router.push('/dashboard/master/barang'), 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    const trimmed = jsonInput.trim();
    if (!trimmed) {
      toast.error('Tempel JSON dari Gemini AI terlebih dahulu');
      return;
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (!Array.isArray(parsed)) {
        toast.error('JSON harus berupa array');
        return;
      }
      const items: ImportItem[] = parsed.map((item: Record<string, unknown>, i: number) => {
        if (!item.kode || !item.nama || !item.satuan || typeof item.harga !== 'number') {
          throw new Error(`Item ke-${i + 1}: field kode, nama, satuan (string) dan harga (number) wajib diisi`);
        }
        return {
          kode: String(item.kode),
          nama: String(item.nama),
          satuan: String(item.satuan),
          harga: Number(item.harga),
        };
      });
      setParsedItems(items);
      toast.success(`${items.length} item berhasil diparse`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Format JSON tidak valid');
      setParsedItems([]);
    }
  };

  const handleImport = async () => {
    if (!selectedKontrakId) {
      toast.error('Pilih kontrak terlebih dahulu');
      return;
    }
    if (!importKategoriId) {
      toast.error('Pilih kategori barang');
      return;
    }
    if (parsedItems.length === 0) {
      toast.error('Tidak ada item untuk diimport. Preview data terlebih dahulu.');
      return;
    }

    setImportLoading(true);
    const toastId = toast.loading(`Mengimport ${parsedItems.length} barang...`);

    try {
      const res = await apiFetch<{
        success: boolean;
        imported: number;
        items: Array<{ kode: string; barangId: string; kontrakItemId: string }>;
        errors?: Array<{ kode: string; error: string }>;
      }>('/api/v1/master/barang/import-from-kontrak', {
        method: 'POST',
        body: JSON.stringify({
          kontrakId: selectedKontrakId,
          kategoriId: importKategoriId,
          items: parsedItems,
        }),
      });

      const result = res.data;

      if (result.errors && result.errors.length > 0) {
        const errorList = result.errors.map(e => `${e.kode}: ${e.error}`).join('\n');
        toast.error(`${result.errors.length} item gagal:\n${errorList}`, { id: toastId, duration: 5000 });
      }

      if (result.imported > 0) {
        toast.success(`${result.imported} barang berhasil diimport dari kontrak!`, { id: result.imported > (result.errors?.length ?? 0) ? toastId : undefined });
        setTimeout(() => router.push('/dashboard/master/barang'), 1500);
      } else {
        if (!result.errors || result.errors.length === 0) {
          toast.error('Tidak ada barang yang diimport', { id: toastId });
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengimport barang', { id: toastId });
    } finally {
      setImportLoading(false);
    }
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(GEMINI_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Gagal menyalin prompt');
    }
  };

  const formatCurrency = (val: number) => 'Rp ' + val.toLocaleString('id-ID');

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Tambah Barang"
        description="Input barang baru atau import dari data kontrak"
        actions={
          <Button variant="back" onClick={() => confirmLeave(() => router.push('/dashboard/master/barang'))}>
            Kembali
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="manual">Input Manual</TabsTrigger>
          <TabsTrigger value="import">Import dari Kontrak</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-6">
          <div className="mx-auto max-w-xl">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="nama"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Barang</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Masukkan nama barang" />
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
                      <FormLabel>Kode Barang</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Masukkan kode barang" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="kategori_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori</FormLabel>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih kategori" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {kategoriOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setKelolaDialogOpen(true)}
                          className="shrink-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="satuan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Satuan</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="pcs, kg, liter" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stok_minimum"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stok Minimum</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
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
                  name="spesifikasi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Spesifikasi</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} placeholder="Masukkan spesifikasi barang" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="justification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Justification</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} placeholder="Penjelasan penggunaan barang" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="harga_beli_default"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Harga Beli Default</FormLabel>
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
                  <FormField
                    control={form.control}
                    name="harga_jual_default"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Harga Jual Default</FormLabel>
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
                  name="is_active"
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
                <FormActions loading={loading} onCancel={() => confirmLeave(() => router.push('/dashboard/master/barang'))} />
              </form>
            </Form>
          </div>
        </TabsContent>

        <TabsContent value="import" className="mt-6 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pilih Kontrak</label>
                  <Select value={selectedKontrakId} onValueChange={setSelectedKontrakId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kontrak..." />
                    </SelectTrigger>
                    <SelectContent>
                      {kontrakOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Barang akan terhubung ke kontrak ini. Jika kontrak dihapus, barang juga ikut terhapus.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kategori Barang</label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Select value={importKategoriId} onValueChange={setImportKategoriId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori..." />
                        </SelectTrigger>
                        <SelectContent>
                          {kategoriOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setKelolaDialogOpen(true)}
                      className="shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Kategori yang sama akan diterapkan ke semua item.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Prompt untuk Gemini AI</label>
                  <Button variant="outline" size="sm" onClick={handleCopyPrompt}>
                    {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                    {copied ? 'Tersalin' : 'Salin Prompt'}
                  </Button>
                </div>
                <div className="relative">
                  <Textarea
                    readOnly
                    value={GEMINI_PROMPT}
                    rows={6}
                    className="text-xs font-mono bg-muted resize-none"
                  />
                  <FileDown className="absolute top-2 right-2 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  1. Upload PDF kontrak ke chat Gemini AI. 2. Kirim prompt di atas. 3. Copy JSON hasil ekstraksi.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tempel JSON dari Gemini AI</label>
                <Textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder={`[{"kode":"CLT005","nama":"Lion Star Floor Brush with handle","satuan":"pcs","harga":28000}]`}
                  rows={5}
                  className="text-xs font-mono"
                />
                <div className="flex justify-end">
                  <Button
                    variant="secondary"
                    onClick={handlePreview}
                    disabled={!jsonInput.trim()}
                  >
                    Preview Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {parsedItems.length > 0 && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">
                    Pratinjau Data ({parsedItems.length} item)
                  </h3>
                  <Button onClick={handleImport} disabled={importLoading}>
                    {importLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Import {parsedItems.length} Barang
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">#</TableHead>
                        <TableHead>Kode</TableHead>
                        <TableHead>Nama Barang</TableHead>
                        <TableHead>Satuan</TableHead>
                        <TableHead className="text-right">Harga</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedItems.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="font-mono text-xs">{item.kode}</TableCell>
                          <TableCell>{item.nama}</TableCell>
                          <TableCell>{item.satuan}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.harga)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <KelolaKategoriDialog
        open={kelolaDialogOpen}
        onOpenChange={setKelolaDialogOpen}
        onSuccess={fetchKategoriOptions}
      />
      <ConfirmLeaveDialog open={showDialog} onConfirm={handleConfirm} onCancel={handleCancel} />
    </div>
  );
}
