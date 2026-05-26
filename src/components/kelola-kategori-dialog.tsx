"use client";

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api/client';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Pencil, Trash2, Inbox } from 'lucide-react';

const kategoriSchema = z.object({
  nama: z.string().min(2, { message: 'Nama kategori harus diisi' }),
  keterangan: z.string().optional(),
});

type KategoriFormValues = z.input<typeof kategoriSchema>;

interface KategoriItem {
  id: string;
  nama: string;
  keterangan?: string | null;
}

interface KelolaKategoriDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function KelolaKategoriDialog({ open, onOpenChange, onSuccess }: KelolaKategoriDialogProps) {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [selectedKategori, setSelectedKategori] = useState<KategoriItem | null>(null);
  const [kategoriList, setKategoriList] = useState<KategoriItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<KategoriItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const form = useForm<KategoriFormValues>({
    resolver: zodResolver(kategoriSchema),
    defaultValues: { nama: '', keterangan: '' },
  });

  const fetchKategori = useCallback(async () => {
    setFetchLoading(true);
    try {
      const { data } = await apiFetch<KategoriItem[]>('/api/v1/master/kategori-barang');
      setKategoriList(data ?? []);
    } catch {
      toast.error('Gagal memuat daftar kategori');
    } finally {
      setFetchLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) {
      fetchKategori();
      setView('list');
      setSelectedKategori(null);
      form.reset({ nama: '', keterangan: '' });
    }
  }, [open, fetchKategori, form]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleAdd = () => {
    setFormMode('add');
    setSelectedKategori(null);
    form.reset({ nama: '', keterangan: '' });
    setView('form');
  };

  const handleEdit = (kategori: KategoriItem) => {
    setFormMode('edit');
    setSelectedKategori(kategori);
    form.reset({ nama: kategori.nama, keterangan: kategori.keterangan ?? '' });
    setView('form');
  };

  const handleCancelForm = () => {
    setView('list');
    form.reset({ nama: '', keterangan: '' });
  };

  const handleSubmit = async (data: KategoriFormValues) => {
    setLoading(true);
    const toastId = toast.loading(formMode === 'add' ? 'Menyimpan kategori...' : 'Memperbarui kategori...');
    try {
      if (formMode === 'add') {
        await apiFetch('/api/v1/master/kategori-barang', {
          method: 'POST',
          body: JSON.stringify({ nama: data.nama, keterangan: data.keterangan || null }),
        });
        toast.success('Kategori berhasil ditambahkan!', { id: toastId });
      } else if (selectedKategori) {
        await apiFetch(`/api/v1/master/kategori-barang/${selectedKategori.id}`, {
          method: 'PUT',
          body: JSON.stringify({ nama: data.nama, keterangan: data.keterangan || null }),
        });
        toast.success('Kategori berhasil diperbarui!', { id: toastId });
      }
      form.reset();
      await fetchKategori();
      onSuccess();
      setView('list');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const toastId = toast.loading('Menghapus kategori...');
    try {
      await apiFetch(`/api/v1/master/kategori-barang/${deleteTarget.id}`, { method: 'DELETE' });
      toast.success('Kategori berhasil dihapus!', { id: toastId });
      setDeleteTarget(null);
      await fetchKategori();
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan', { id: toastId });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {view === 'list' ? 'Kelola Kategori Barang' : formMode === 'add' ? 'Tambah Kategori Baru' : 'Edit Kategori'}
            </DialogTitle>
            <DialogDescription>
              {view === 'list'
                ? 'Kelola daftar kategori barang'
                : formMode === 'add'
                  ? 'Masukkan data kategori baru'
                  : 'Ubah data kategori'}
            </DialogDescription>
          </DialogHeader>

          {view === 'list' ? (
            <div className="space-y-4">
              <Button onClick={handleAdd} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Kategori Baru
              </Button>

              {fetchLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : kategoriList.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-lg bg-muted/20">
                  <Inbox className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
                  <p className="text-sm text-muted-foreground">Belum ada kategori</p>
                </div>
              ) : (
                <div className="space-y-1 max-h-72 overflow-y-auto">
                  {kategoriList.map((k) => (
                    <div
                      key={k.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{k.nama}</p>
                        {k.keterangan && (
                          <p className="text-xs text-muted-foreground truncate">{k.keterangan}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(k)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(k)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nama"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Kategori</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Masukkan nama kategori" />
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
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="cancel" onClick={handleCancelForm} disabled={loading}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Menyimpan...
                      </>
                    ) : (
                      'Simpan'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kategori</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus kategori &ldquo;{deleteTarget?.nama}&rdquo;? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
