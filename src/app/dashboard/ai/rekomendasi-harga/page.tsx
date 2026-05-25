"use client"
import { useState, useEffect } from 'react'; import { z } from 'zod'; import { useForm } from 'react-hook-form'; import { zodResolver } from '@hookform/resolvers/zod'
import { apiFetch } from '@/lib/api/client'; import { Button } from '@/components/ui/button'; import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'; import { Loader2, Lightbulb, Search, X } from 'lucide-react'; import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

const schema = z.object({ barang_id: z.string().min(1) })
type FV = z.input<typeof schema>

interface Rekomendasi { barang_id: string; barang_nama: string; barang_kode: string; harga_beli_terendah: number | null; harga_beli_rata_rata: number | null; harga_jual_rekomendasi: number | null; margin: number; sumber: string }

export default function RekomendasiHargaPage() {
  const [barangOpts, setBarangOpts] = useState<Array<{ value: string; label: string }>>([]);
  const [rekom, setRekom] = useState<Rekomendasi | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [open, setOpen] = useState(false);

  const form = useForm<FV>({ resolver: zodResolver(schema) });

  useEffect(() => {
    apiFetch<Array<{ id: string; nama: string; kode: string }>>('/api/v1/master/barang')
      .then(r => setBarangOpts((r.data ?? []).map(x => ({ value: x.id, label: `[${x.kode}] ${x.nama}` })))).catch(() => toast.error('Gagal memuat data barang'))
  }, []);

  const onSubmit = async (data: FV) => {
    setLoading(true);
    setSearched(false);
    try {
      const r = await apiFetch<Rekomendasi>('/api/v1/ai/rekomendasi-harga', { method: 'POST', body: JSON.stringify(data) });
      setRekom(r.data);
      setSearched(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold">AI Rekomendasi Harga</h1>
        <p className="text-muted-foreground mt-1">Rekomendasi harga jual berdasarkan data pembelian & kontrak</p>
      </div>

      <div className="flex items-center justify-center py-12">
        <Button size="lg" onClick={() => setOpen(true)} className="gap-2">
          <Search className="h-5 w-5" />
          Buka Rekomendasi Harga
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Klik tombol di atas untuk mencari rekomendasi harga barang
      </p>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex flex-col overflow-y-auto">
          <SheetHeader className="space-y-0 pb-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-accent" />
                Rekomendasi Harga
              </SheetTitle>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="barang_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pilih Barang</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih barang..." />
                          </SelectTrigger>
                          <SelectContent>
                            {barangOpts.map(o => (
                              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Memproses...</> : <><Lightbulb className="h-4 w-4 mr-2" />Rekomendasi</>}
                </Button>
              </form>
            </Form>

            {loading && (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Card key={i}><CardContent className="pt-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
                ))}
              </div>
            )}

            {searched && rekom && !loading && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Harga Beli Terendah</CardTitle></CardHeader>
                    <CardContent><p className="text-xl font-bold">{rekom.harga_beli_terendah ? `Rp ${rekom.harga_beli_terendah.toLocaleString('id-ID')}` : '-'}</p>
                      <p className="text-xs text-muted-foreground">Sumber: {rekom.sumber}</p></CardContent></Card>
                  <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Rata-rata Harga Beli</CardTitle></CardHeader>
                    <CardContent><p className="text-xl font-bold">{rekom.harga_beli_rata_rata ? `Rp ${rekom.harga_beli_rata_rata.toLocaleString('id-ID')}` : '-'}</p></CardContent></Card>
                  <Card className="border-accent"><CardHeader className="pb-2"><CardTitle className="text-sm text-accent">Harga Jual Rekomendasi</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold text-accent">{rekom.harga_jual_rekomendasi ? `Rp ${rekom.harga_jual_rekomendasi.toLocaleString('id-ID')}` : '-'}</p>
                      <Badge variant="success" className="mt-1">Margin {Math.round(rekom.margin * 100)}%</Badge></CardContent></Card>
                </div>
                <Card><CardContent className="pt-4">
                  <div className="space-y-2 text-sm">
                    <p><strong>Barang:</strong> [{rekom.barang_kode}] {rekom.barang_nama}</p>
                    <p><strong>Sumber harga:</strong> {rekom.sumber}</p>
                  </div>
                </CardContent></Card>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
