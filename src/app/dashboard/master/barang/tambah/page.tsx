"use client";

import { useState, useEffect, useCallback } from 'react';
import { apiFetch, apiFetchFormData } from '@/lib/api/client';
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
import { Loader2, FileDown, Copy, Check, Plus, Upload, X } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { PageTour } from '@/components/onboarding/page-tour';
import { barangFormSteps } from '@/components/onboarding/tour-steps/barang-form';

const barangSchema = z.object({
  nama: z.string().min(2, { message: "Nama barang harus diisi" }),
  kode: z.string().min(2, { message: "Kode barang harus diisi" }),
  kategori_id: z.string().min(1, { message: "Kategori harus dipilih" }),
  satuan: z.string().min(1, { message: "Satuan harus diisi" }),
  spesifikasi: z.string().optional(),
  justification: z.string().optional(),
  image_url: z.string().optional(),
  barcode: z.string().optional(),
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

interface PoImportItem {
  nama_barang: string;
  satuan: string;
  qty: number;
  harga_satuan: number;
}

interface PoImportJson {
  nama_customer: string;
  nama_pic: string;
  jabatan_pic: string;
  nomor_po_customer: string;
  nomor_pr_customer: string;
  nomor_quotation_rri: string;
  tanggal_po: string;
  revisi_ke: number;
  time_for_delivery_hari: number;
  durasi_payment_hari: number;
  catatan: string;
  nama_penandatangan: string;
  jabatan_penandatangan: string;
  items: PoImportItem[];
}

interface DiImportItem {
  kode: string;
  nama_barang: string;
  satuan: string;
  qty: number;
  harga_satuan: number;
}

interface DiImportJson {
  nomor_di: string;
  tanggal_di: string;
  revisi_ke: number;
  department: string;
  nama_pic: string;
  jabatan_pic: string;
  nomor_kontrak: string;
  requestor: string;
  time_for_delivery_hari: number;
  durasi_payment_hari: number;
  catatan: string;
  nama_penandatangan: string;
  jabatan_penandatangan: string;
  items: DiImportItem[];
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  const [poCustomerOptions, setPoCustomerOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedPoCustomerId, setSelectedPoCustomerId] = useState('');
  const [poPrompt, setPoPrompt] = useState('');
  const [poCopied, setPoCopied] = useState(false);
  const [poJsonInput, setPoJsonInput] = useState('');
  const [poParsedData, setPoParsedData] = useState<PoImportJson | null>(null);
  const [poImportLoading, setPoImportLoading] = useState(false);
  const [poPdfFile, setPoPdfFile] = useState<File | null>(null);
  const [poLoadingPrompt, setPoLoadingPrompt] = useState(false);

  const [diCustomerOptions, setDiCustomerOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedDiCustomerId, setSelectedDiCustomerId] = useState('');
  const [diPrompt, setDiPrompt] = useState('');
  const [diCopied, setDiCopied] = useState(false);
  const [diJsonInput, setDiJsonInput] = useState('');
  const [diParsedData, setDiParsedData] = useState<DiImportJson | null>(null);
  const [diImportLoading, setDiImportLoading] = useState(false);
  const [diPdfFile, setDiPdfFile] = useState<File | null>(null);
  const [diLoadingPrompt, setDiLoadingPrompt] = useState(false);

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

  useEffect(() => {
    if (activeTab !== 'import-po') return;
    setPoParsedData(null);
    setPoJsonInput('');
    setPoPrompt('');
    setSelectedPoCustomerId('');
    setPoPdfFile(null);
    (async () => {
      try {
        const { data } = await apiFetch<Array<{ id: string; nama: string }>>('/api/v1/master/customer');
        const validIds = new Set<string>()
        const prompts = await Promise.allSettled(
          (data ?? []).map(c =>
            apiFetch<{ customer_id: string }>(`/api/v1/master/customer/${c.id}/prompt`)
              .then(() => c.id)
              .catch(() => null)
          )
        );
        prompts.forEach(p => { if (p.status === 'fulfilled' && p.value) validIds.add(p.value) });
        setPoCustomerOptions(
          (data ?? [])
            .filter(c => validIds.has(c.id))
            .map(c => ({ value: c.id, label: c.nama }))
        );
      } catch { /* ignore */ }
    })();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'import-di') return;
    setDiParsedData(null);
    setDiJsonInput('');
    setDiPrompt('');
    setSelectedDiCustomerId('');
    setDiPdfFile(null);
    (async () => {
      try {
        const { data } = await apiFetch<Array<{ id: string; nama: string }>>('/api/v1/master/customer');
        const validIds = new Set<string>()
        const prompts = await Promise.allSettled(
          (data ?? []).map(c =>
            apiFetch<{ customer_id: string }>(`/api/v1/master/customer/${c.id}/prompt-di`)
              .then(() => c.id)
              .catch(() => null)
          )
        );
        prompts.forEach(p => { if (p.status === 'fulfilled' && p.value) validIds.add(p.value) });
        setDiCustomerOptions(
          (data ?? [])
            .filter(c => validIds.has(c.id))
            .map(c => ({ value: c.id, label: c.nama }))
        );
      } catch { /* ignore */ }
    })();
  }, [activeTab]);

  const handlePoCustomerChange = async (customerId: string) => {
    setSelectedPoCustomerId(customerId);
    setPoPrompt('');
    setPoParsedData(null);
    setPoJsonInput('');
    if (!customerId) return;
    setPoLoadingPrompt(true);
    try {
      const { data } = await apiFetch<{ prompt_template: string }>(`/api/v1/master/customer/${customerId}/prompt`);
      if (!data?.prompt_template) {
        toast.error('Prompt untuk customer ini belum tersedia. Hubungi admin untuk menambahkan prompt di Supabase.');
        setPoLoadingPrompt(false);
        return;
      }
      setPoPrompt(data.prompt_template ?? '');
    } catch {
      toast.error('Gagal memuat prompt customer');
    } finally {
      setPoLoadingPrompt(false);
    }
  };

  const handleDiCustomerChange = async (customerId: string) => {
    setSelectedDiCustomerId(customerId);
    setDiPrompt('');
    setDiParsedData(null);
    setDiJsonInput('');
    if (!customerId) return;
    setDiLoadingPrompt(true);
    try {
      const { data } = await apiFetch<{ prompt_template: string }>(`/api/v1/master/customer/${customerId}/prompt-di`);
      if (!data?.prompt_template) {
        toast.error('Prompt DI untuk customer ini belum tersedia. Hubungi admin untuk menambahkan prompt DI di Supabase.');
        setDiLoadingPrompt(false);
        return;
      }
      setDiPrompt(data.prompt_template ?? '');
    } catch {
      toast.error('Gagal memuat prompt DI customer');
    } finally {
      setDiLoadingPrompt(false);
    }
  };

  const uploadImageAndUpdate = async (barangId: string) => {
    if (!imageFile || !barangId) return
    setImageUploading(true)
    try {
      const compressed = await imageCompression(imageFile, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/webp',
      })
      const formData = new FormData()
      formData.append('file', compressed, 'foto-1.webp')
      await apiFetch(`/api/v1/master/barang/${barangId}/image`, {
        method: 'POST',
        body: formData,
      })
    } catch { /* image optional, skip silently */ }
    finally { setImageUploading(false) }
  }

  const handlePickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) { toast.error('Hanya JPG, PNG, atau WebP'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Maksimal 5MB'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    if (e.target) e.target.value = ''
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    form.setValue('image_url', '')
  }

  const onSubmit = async (data: BarangFormValues) => {
    setLoading(true);
    const toastId = toast.loading('Menyimpan barang...');
    try {
      const res = await apiFetch<{ id: string }>('/api/v1/master/barang', { method: 'POST', body: JSON.stringify({ ...data, image_url: '' }) });
      toast.success('Barang berhasil ditambahkan!', { id: toastId });
      form.reset();
      const newId = res.data?.id
      if (newId) await uploadImageAndUpdate(newId)
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
        items: Array<{ kode: string; barangId: string; kontrakItemId: string; status: string }>;
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
        const linkedCount = result.items.filter(i => i.status === 'linked').length
        const createdCount = result.items.filter(i => i.status === 'created').length
        const detailParts: string[] = []
        if (createdCount > 0) detailParts.push(`${createdCount} baru`)
        if (linkedCount > 0) detailParts.push(`${linkedCount} ditautkan`)
        toast.success(`${result.imported} barang berhasil diimport (${detailParts.join(', ')})`, { id: result.imported > (result.errors?.length ?? 0) ? toastId : undefined });
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

  const handlePoCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(poPrompt);
      setPoCopied(true);
      setTimeout(() => setPoCopied(false), 2000);
    } catch {
      toast.error('Gagal menyalin prompt');
    }
  };

  const handleDiCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(diPrompt);
      setDiCopied(true);
      setTimeout(() => setDiCopied(false), 2000);
    } catch {
      toast.error('Gagal menyalin prompt');
    }
  };

  const handlePoPreview = () => {
    const trimmed = poJsonInput.trim();
    if (!trimmed) {
      toast.error('Tempel JSON dari Gemini AI terlebih dahulu');
      return;
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (!parsed.nama_customer) throw new Error('Field "nama_customer" wajib diisi');
      if (!parsed.nomor_po_customer) throw new Error('Field "nomor_po_customer" wajib diisi');
      if (!parsed.tanggal_po) throw new Error('Field "tanggal_po" wajib diisi');
      if (!Array.isArray(parsed.items) || parsed.items.length === 0) {
        throw new Error('Field "items" harus berupa array dengan minimal 1 item');
      }
      parsed.items.forEach((item: Record<string, unknown>, i: number) => {
        if (!item.nama_barang || !item.satuan || typeof item.qty !== 'number' || typeof item.harga_satuan !== 'number') {
          throw new Error(`Item ke-${i + 1}: field nama_barang, satuan (string), qty, harga_satuan (number) wajib diisi`);
        }
      });
      const data: PoImportJson = {
        nama_customer: String(parsed.nama_customer),
        nama_pic: String(parsed.nama_pic ?? '-'),
        jabatan_pic: String(parsed.jabatan_pic ?? '-'),
        nomor_po_customer: String(parsed.nomor_po_customer),
        nomor_pr_customer: String(parsed.nomor_pr_customer ?? '-'),
        nomor_quotation_rri: String(parsed.nomor_quotation_rri ?? '-'),
        tanggal_po: String(parsed.tanggal_po),
        revisi_ke: Number(parsed.revisi_ke ?? 0),
        time_for_delivery_hari: Number(parsed.time_for_delivery_hari ?? 0),
        durasi_payment_hari: Number(parsed.durasi_payment_hari ?? 0),
        catatan: String(parsed.catatan ?? ''),
        nama_penandatangan: String(parsed.nama_penandatangan ?? '-'),
        jabatan_penandatangan: String(parsed.jabatan_penandatangan ?? '-'),
        items: parsed.items.map((item: Record<string, unknown>) => ({
          nama_barang: String(item.nama_barang),
          satuan: String(item.satuan),
          qty: Number(item.qty),
          harga_satuan: Number(item.harga_satuan),
        })),
      };
      setPoParsedData(data);
      toast.success(`${data.items.length} item berhasil diparse`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Format JSON tidak valid');
      setPoParsedData(null);
    }
  };

  const handlePoImport = async () => {
    if (!poPdfFile) {
      toast.error('Upload file PDF PO terlebih dahulu sebelum mengimport');
      return;
    }
    if (!poParsedData) {
      toast.error('Preview data terlebih dahulu');
      return;
    }

    setPoImportLoading(true);
    const toastId = toast.loading(`Mengimport ${poParsedData.items.length} barang dari PO...`);

    try {
      const formData = new FormData();
      formData.append('jsonData', JSON.stringify(poParsedData));
      if (poPdfFile) {
        formData.append('pdfFile', poPdfFile);
      }

      const res = await apiFetchFormData<{
        success: boolean;
        imported_count: number;
        skipped_count: number;
        po_id: string;
        nomor_po: string;
        errors?: Array<{ nama_barang: string; error: string }>;
      }>('/api/v1/master/barang/import-from-po', formData);

      const result = res.data;

      if (result.errors && result.errors.length > 0) {
        const errorList = result.errors.map(e => `${e.nama_barang}: ${e.error}`).join('\n');
        toast.error(`${result.errors.length} error:\n${errorList}`, { id: toastId, duration: 5000 });
      }

      if (result.imported_count > 0 || result.skipped_count > 0) {
        const msg = `${result.imported_count} barang baru, ${result.skipped_count} sudah ada (skip)`;
        toast.success(`Import berhasil! PO: ${result.nomor_po}. ${msg}`, {
          id: result.imported_count > 0 ? toastId : undefined,
        });
        setTimeout(() => router.push('/dashboard/master/barang'), 1500);
      } else if (result.errors && result.errors.length > 0) {
        // Errors occurred but nothing imported/skipped — show first error detail
        const firstError = result.errors.find(e => e.nama_barang !== 'system');
        toast.error(firstError ? `${firstError.nama_barang}: ${firstError.error}` : 'Import gagal - cek detail di console', { id: toastId, duration: 8000 });
      } else {
        toast.error('Tidak ada barang yang diimport', { id: toastId });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengimport PO', { id: toastId });
    } finally {
      setPoImportLoading(false);
    }
  };

  const handleDiPreview = () => {
    const trimmed = diJsonInput.trim();
    if (!trimmed) {
      toast.error('Tempel JSON dari Gemini AI terlebih dahulu');
      return;
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (!parsed.nomor_di) throw new Error('Field "nomor_di" wajib diisi');
      if (!parsed.tanggal_di) throw new Error('Field "tanggal_di" wajib diisi');
      if (!parsed.nomor_kontrak) throw new Error('Field "nomor_kontrak" wajib diisi');
      if (!Array.isArray(parsed.items) || parsed.items.length === 0) {
        throw new Error('Field "items" harus berupa array dengan minimal 1 item');
      }
      parsed.items.forEach((item: Record<string, unknown>, i: number) => {
        if (!item.kode || !item.nama_barang || !item.satuan || typeof item.qty !== 'number' || typeof item.harga_satuan !== 'number') {
          throw new Error(`Item ke-${i + 1}: field kode, nama_barang, satuan (string), qty, harga_satuan (number) wajib diisi`);
        }
      });
      const data: DiImportJson = {
        nomor_di: String(parsed.nomor_di),
        tanggal_di: String(parsed.tanggal_di),
        revisi_ke: Number(parsed.revisi_ke ?? 0),
        department: String(parsed.department ?? '-'),
        nama_pic: String(parsed.nama_pic ?? '-'),
        jabatan_pic: String(parsed.jabatan_pic ?? '-'),
        nomor_kontrak: String(parsed.nomor_kontrak),
        requestor: String(parsed.requestor ?? '-'),
        time_for_delivery_hari: Number(parsed.time_for_delivery_hari ?? 0),
        durasi_payment_hari: Number(parsed.durasi_payment_hari ?? 0),
        catatan: String(parsed.catatan ?? ''),
        nama_penandatangan: String(parsed.nama_penandatangan ?? '-'),
        jabatan_penandatangan: String(parsed.jabatan_penandatangan ?? '-'),
        items: parsed.items.map((item: Record<string, unknown>) => ({
          kode: String(item.kode),
          nama_barang: String(item.nama_barang),
          satuan: String(item.satuan),
          qty: Number(item.qty),
          harga_satuan: Number(item.harga_satuan),
        })),
      };
      setDiParsedData(data);
      toast.success(`${data.items.length} item berhasil diparse`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Format JSON tidak valid');
      setDiParsedData(null);
    }
  };

  const handleDiImport = async () => {
    if (!diPdfFile) {
      toast.error('Upload file PDF DI terlebih dahulu sebelum mengimport');
      return;
    }
    if (!diParsedData) {
      toast.error('Preview data terlebih dahulu');
      return;
    }
    if (!selectedDiCustomerId) {
      toast.error('Pilih customer terlebih dahulu');
      return;
    }

    setDiImportLoading(true);
    const toastId = toast.loading(`Mengimport ${diParsedData.items.length} barang dari DI...`);

    try {
      const formData = new FormData();
      formData.append('customerId', selectedDiCustomerId);
      formData.append('jsonData', JSON.stringify(diParsedData));
      formData.append('pdfFile', diPdfFile);

      const res = await apiFetchFormData<{
        success: boolean;
        imported_count: number;
        from_kontrak_count: number;
        from_master_count: number;
        di_id: string;
        nomor_di: string;
        errors?: Array<{ nama_barang: string; error: string }>;
      }>('/api/v1/master/barang/import-from-di', formData);

      const result = res.data;

      if (result.errors && result.errors.length > 0) {
        const errorList = result.errors.map(e => `${e.nama_barang}: ${e.error}`).join('\n');
        toast.error(`${result.errors.length} error:\n${errorList}`, { id: toastId, duration: 5000 });
      }

      if (result.imported_count > 0 || result.from_kontrak_count > 0 || result.from_master_count > 0) {
        const msg = `${result.imported_count} barang baru, ${result.from_kontrak_count} dari kontrak, ${result.from_master_count} dari master`;
        toast.success(`Import berhasil! DI: ${result.nomor_di}. ${msg}`, {
          id: result.imported_count > 0 ? toastId : undefined,
        });
        setTimeout(() => router.push('/dashboard/master/barang'), 1500);
      } else if (result.errors && result.errors.length > 0) {
        const firstError = result.errors.find(e => e.nama_barang !== 'system');
        toast.error(firstError ? `${firstError.nama_barang}: ${firstError.error}` : 'Import gagal', { id: toastId, duration: 8000 });
      } else {
        toast.error('Tidak ada barang yang diimport', { id: toastId });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengimport DI', { id: toastId });
    } finally {
      setDiImportLoading(false);
    }
  };

  const formatCurrency = (val: number) => 'Rp ' + val.toLocaleString('id-ID');

  return (
    <div className="mx-auto max-w-4xl" data-tour="barang-form-title">
      <div data-tour="barang-form-header">
      <PageHeader
        title="Tambah Barang"
        description="Input barang baru atau import dari data kontrak"
        actions={
          <>
            <PageTour pageKey="barang-form" steps={barangFormSteps} />
            <Button variant="back" onClick={() => confirmLeave(() => router.push('/dashboard/master/barang'))}>
              Kembali
            </Button>
          </>
        }
      />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList data-tour="barang-form-tabs">
          <TabsTrigger value="manual">Input Manual</TabsTrigger>
          <TabsTrigger value="import">Import dari Kontrak</TabsTrigger>
          <TabsTrigger value="import-po">Import dari PO</TabsTrigger>
          <TabsTrigger value="import-di">Import dari DI</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-6">
          <div className="mx-auto max-w-xl">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div data-tour="field-nama">
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
                </div>
                <div data-tour="field-kode">
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
                </div>
                <FormField
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barcode</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Opsional — scan barcode barang" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div data-tour="field-kategori">
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
                </div>
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
                <div className="space-y-3" data-tour="field-image">
                  <FormLabel>Foto Barang</FormLabel>
                  {imagePreview ? (
                    <div className="relative inline-block rounded-lg border overflow-hidden">
                      <img src={imagePreview} alt="Preview" className="max-h-48 object-contain" />
                      <button type="button" onClick={handleRemoveImage} className="absolute top-1 right-1 bg-background/80 rounded-full p-1 hover:bg-destructive hover:text-destructive-foreground transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : form.watch('image_url') ? (
                    <div className="relative inline-block rounded-lg border overflow-hidden">
                      <img src={form.watch('image_url')} alt="Current" className="max-h-48 object-contain" />
                    </div>
                  ) : null}
                  <div
                    className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer bg-muted/30 hover:bg-muted/50"
                    onClick={() => document.getElementById('barang-image-input')?.click()}
                  >
                    <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Klik untuk upload foto barang</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP — maks. 5MB, 1920px</p>
                    <input id="barang-image-input" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePickImage} />
                  </div>
                  {imageUploading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Mengupload...
                    </div>
                  )}
                  <FormField
                    control={form.control}
                    name="image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Atau URL manual</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://..." className="text-xs" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4" data-tour="field-harga">
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
                <div data-tour="btn-simpan">
                <FormActions loading={loading} onCancel={() => confirmLeave(() => router.push('/dashboard/master/barang'))} />
                </div>
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

        <TabsContent value="import-po" className="mt-6 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Pilih Customer</label>
                {poCustomerOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Tidak ada customer dengan prompt tersedia. Hubungi admin untuk menambahkan prompt di Supabase.
                  </p>
                ) : (
                  <Select value={selectedPoCustomerId} onValueChange={handlePoCustomerChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih customer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {poCustomerOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {selectedPoCustomerId && poPrompt && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Prompt untuk Gemini AI</label>
                      <Button variant="outline" size="sm" onClick={handlePoCopyPrompt} disabled={!poPrompt || poLoadingPrompt}>
                        {poCopied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                        {poCopied ? 'Tersalin' : 'Salin Prompt'}
                      </Button>
                    </div>
                    {poLoadingPrompt ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="relative">
                        <Textarea
                          readOnly
                          value={poPrompt}
                          rows={8}
                          className="text-xs font-mono bg-muted resize-none"
                        />
                        <FileDown className="absolute top-2 right-2 h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      1. Upload PDF PO ke chat Gemini AI. 2. Kirim prompt di atas. 3. Copy JSON hasil ekstraksi.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Upload File PDF PO <span className="text-destructive">*</span></label>
                    <div
                      className="flex items-center gap-3 rounded-lg border-2 border-dashed p-4 transition-colors cursor-pointer bg-muted/30 hover:bg-muted/50"
                      onClick={() => document.getElementById('po-pdf-input')?.click()}
                    >
                      <Upload className="h-6 w-6 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        {poPdfFile ? (
                          <p className="text-sm font-medium truncate">{poPdfFile.name}</p>
                        ) : (
                          <>
                            <p className="text-sm font-medium">Klik untuk upload PDF PO</p>
                            <p className="text-xs text-muted-foreground mt-0.5">PDF — maks. 10MB</p>
                          </>
                        )}
                      </div>
                      {poPdfFile && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setPoPdfFile(null); }}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <input
                      id="po-pdf-input"
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            toast.error('Ukuran file maksimal 10MB');
                            return;
                          }
                          setPoPdfFile(file);
                        }
                        if (e.target) e.target.value = '';
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tempel JSON dari Gemini AI</label>
                    <Textarea
                      value={poJsonInput}
                      onChange={(e) => setPoJsonInput(e.target.value)}
                      placeholder={'{\n  "nama_customer": "...",\n  "nomor_po_customer": "...",\n  "tanggal_po": "YYYY-MM-DD",\n  "items": [...]\n}'}
                      rows={5}
                      className="text-xs font-mono"
                    />
                    <div className="flex justify-end">
                      <Button
                        variant="secondary"
                        onClick={handlePoPreview}
                        disabled={!poJsonInput.trim()}
                      >
                        Preview Data
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {poParsedData && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4">
                  <div>
                    <span className="text-muted-foreground">Customer:</span>{' '}
                    <span className="font-medium">{poParsedData.nama_customer}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">No. PO:</span>{' '}
                    <span className="font-medium">{poParsedData.nomor_po_customer}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tanggal PO:</span>{' '}
                    <span className="font-medium">{poParsedData.tanggal_po}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Revisi:</span>{' '}
                    <span className="font-medium">{poParsedData.revisi_ke}</span>
                  </div>
                  {poParsedData.nomor_quotation_rri !== '-' && (
                    <div>
                      <span className="text-muted-foreground">No. Quotation:</span>{' '}
                      <span className="font-medium">{poParsedData.nomor_quotation_rri}</span>
                    </div>
                  )}
                  {poParsedData.nomor_pr_customer !== '-' && (
                    <div>
                      <span className="text-muted-foreground">No. PR:</span>{' '}
                      <span className="font-medium">{poParsedData.nomor_pr_customer}</span>
                    </div>
                  )}
                  {poParsedData.nama_pic !== '-' && (
                    <div>
                      <span className="text-muted-foreground">PIC:</span>{' '}
                      <span className="font-medium">{poParsedData.nama_pic} ({poParsedData.jabatan_pic})</span>
                    </div>
                  )}
                  {poParsedData.nama_penandatangan !== '-' && (
                    <div>
                      <span className="text-muted-foreground">Penandatangan:</span>{' '}
                      <span className="font-medium">{poParsedData.nama_penandatangan}{poParsedData.jabatan_penandatangan !== '-' ? ` (${poParsedData.jabatan_penandatangan})` : ''}</span>
                    </div>
                  )}
                  {poParsedData.time_for_delivery_hari > 0 && (
                    <div>
                      <span className="text-muted-foreground">Delivery:</span>{' '}
                      <span className="font-medium">{poParsedData.time_for_delivery_hari} hari</span>
                    </div>
                  )}
                  {poParsedData.durasi_payment_hari > 0 && (
                    <div>
                      <span className="text-muted-foreground">Payment:</span>{' '}
                      <span className="font-medium">{poParsedData.durasi_payment_hari} hari</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">
                    Pratinjau Items ({poParsedData.items.length} item)
                  </h3>
                  <Button onClick={handlePoImport} disabled={poImportLoading}>
                    {poImportLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Import {poParsedData.items.length} Barang
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">#</TableHead>
                        <TableHead>Nama Barang</TableHead>
                        <TableHead>Satuan</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Harga Satuan</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {poParsedData.items.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                          <TableCell>{item.nama_barang}</TableCell>
                          <TableCell>{item.satuan}</TableCell>
                          <TableCell className="text-right">{item.qty}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.harga_satuan)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.qty * item.harga_satuan)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end border-t pt-4 mt-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">GRAND TOTAL</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(poParsedData.items.reduce((s, i) => s + i.qty * i.harga_satuan, 0))}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {poParsedData.items.length} item
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="import-di" className="mt-6 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Pilih Customer</label>
                {diCustomerOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Tidak ada customer dengan prompt DI tersedia. Hubungi admin untuk menambahkan prompt DI di Supabase.
                  </p>
                ) : (
                  <Select value={selectedDiCustomerId} onValueChange={handleDiCustomerChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih customer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {diCustomerOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {selectedDiCustomerId && diPrompt && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Prompt untuk Gemini AI</label>
                      <Button variant="outline" size="sm" onClick={handleDiCopyPrompt} disabled={!diPrompt || diLoadingPrompt}>
                        {diCopied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                        {diCopied ? 'Tersalin' : 'Salin Prompt'}
                      </Button>
                    </div>
                    {diLoadingPrompt ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="relative">
                        <Textarea
                          readOnly
                          value={diPrompt}
                          rows={8}
                          className="text-xs font-mono bg-muted resize-none"
                        />
                        <FileDown className="absolute top-2 right-2 h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      1. Upload PDF DI ke chat Gemini AI. 2. Kirim prompt di atas. 3. Copy JSON hasil ekstraksi.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Upload File PDF DI <span className="text-destructive">*</span></label>
                    <div
                      className="flex items-center gap-3 rounded-lg border-2 border-dashed p-4 transition-colors cursor-pointer bg-muted/30 hover:bg-muted/50"
                      onClick={() => document.getElementById('di-pdf-input')?.click()}
                    >
                      <Upload className="h-6 w-6 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        {diPdfFile ? (
                          <p className="text-sm font-medium truncate">{diPdfFile.name}</p>
                        ) : (
                          <>
                            <p className="text-sm font-medium">Klik untuk upload PDF DI</p>
                            <p className="text-xs text-muted-foreground mt-0.5">PDF — maks. 10MB</p>
                          </>
                        )}
                      </div>
                      {diPdfFile && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setDiPdfFile(null); }}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <input
                      id="di-pdf-input"
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            toast.error('Ukuran file maksimal 10MB');
                            return;
                          }
                          setDiPdfFile(file);
                        }
                        if (e.target) e.target.value = '';
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tempel JSON dari Gemini AI</label>
                    <Textarea
                      value={diJsonInput}
                      onChange={(e) => setDiJsonInput(e.target.value)}
                      placeholder={'{\n  "nomor_di": "...",\n  "tanggal_di": "YYYY-MM-DD",\n  "nomor_kontrak": "...",\n  "items": [...]\n}'}
                      rows={5}
                      className="text-xs font-mono"
                    />
                    <div className="flex justify-end">
                      <Button
                        variant="secondary"
                        onClick={handleDiPreview}
                        disabled={!diJsonInput.trim()}
                      >
                        Preview Data
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {diParsedData && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4">
                  <div>
                    <span className="text-muted-foreground">No. DI:</span>{' '}
                    <span className="font-medium">{diParsedData.nomor_di}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tanggal DI:</span>{' '}
                    <span className="font-medium">{diParsedData.tanggal_di}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">No. Kontrak:</span>{' '}
                    <span className="font-medium">{diParsedData.nomor_kontrak}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Revisi:</span>{' '}
                    <span className="font-medium">{diParsedData.revisi_ke}</span>
                  </div>
                  {diParsedData.department !== '-' && (
                    <div>
                      <span className="text-muted-foreground">Department:</span>{' '}
                      <span className="font-medium">{diParsedData.department}</span>
                    </div>
                  )}
                  {diParsedData.requestor !== '-' && (
                    <div>
                      <span className="text-muted-foreground">Requestor:</span>{' '}
                      <span className="font-medium">{diParsedData.requestor}</span>
                    </div>
                  )}
                  {diParsedData.nama_pic !== '-' && (
                    <div>
                      <span className="text-muted-foreground">PIC:</span>{' '}
                      <span className="font-medium">{diParsedData.nama_pic} ({diParsedData.jabatan_pic})</span>
                    </div>
                  )}
                  {diParsedData.nama_penandatangan !== '-' && (
                    <div>
                      <span className="text-muted-foreground">Penandatangan:</span>{' '}
                      <span className="font-medium">{diParsedData.nama_penandatangan}{diParsedData.jabatan_penandatangan !== '-' ? ` (${diParsedData.jabatan_penandatangan})` : ''}</span>
                    </div>
                  )}
                  {diParsedData.time_for_delivery_hari > 0 && (
                    <div>
                      <span className="text-muted-foreground">Delivery:</span>{' '}
                      <span className="font-medium">{diParsedData.time_for_delivery_hari} hari</span>
                    </div>
                  )}
                  {diParsedData.durasi_payment_hari > 0 && (
                    <div>
                      <span className="text-muted-foreground">Payment:</span>{' '}
                      <span className="font-medium">{diParsedData.durasi_payment_hari} hari</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">
                    Pratinjau Items ({diParsedData.items.length} item)
                  </h3>
                  <Button onClick={handleDiImport} disabled={diImportLoading}>
                    {diImportLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Import {diParsedData.items.length} Barang
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
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Harga Satuan</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {diParsedData.items.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="font-mono text-xs">{item.kode}</TableCell>
                          <TableCell>{item.nama_barang}</TableCell>
                          <TableCell>{item.satuan}</TableCell>
                          <TableCell className="text-right">{item.qty}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.harga_satuan)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.qty * item.harga_satuan)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end border-t pt-4 mt-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">GRAND TOTAL</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(diParsedData.items.reduce((s, i) => s + i.qty * i.harga_satuan, 0))}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {diParsedData.items.length} item
                    </p>
                  </div>
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
