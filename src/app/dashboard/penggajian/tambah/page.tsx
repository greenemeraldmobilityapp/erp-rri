"use client"
import Link from 'next/link'
import { useState, useEffect } from 'react'; import { useRouter } from 'next/navigation'; import { z } from 'zod'; import { useForm } from 'react-hook-form'; import { zodResolver } from '@hookform/resolvers/zod'
import { apiFetch } from '@/lib/api/client'; import { Button } from '@/components/ui/button'; import { Input } from '@/components/ui/input'; import { Textarea } from '@/components/ui/textarea'; import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { ArrowLeft, Loader2, Calculator, Coins, MinusCircle, Sparkles } from 'lucide-react'; import { toast } from 'sonner'

const schema = z.object({ 
  karyawan_id: z.string().min(1), 
  bulan: z.string().min(1), 
  tahun: z.string(), 
  gaji_pokok: z.string(), 
  tunjangan: z.string().default('0'), 
  potongan: z.string().default('0'), 
  keterangan: z.string().optional() 
})
type FV = z.input<typeof schema>

export default function TambahPenggajianPage() {
  const router = useRouter(); 
  const [kOpts, setKOpts] = useState<Array<{ value: string; label: string }>>([]); 
  const [submitting, setSubmitting] = useState(false)
  const now = new Date(); 
  const defBulan = String(now.getMonth() + 1); 
  const defTahun = String(now.getFullYear())
  
  const form = useForm<FV>({ 
    resolver: zodResolver(schema), 
    defaultValues: { bulan: defBulan, tahun: defTahun, tunjangan: '0', potongan: '0' }, 
    mode: 'onChange' 
  })
  
  const gajiPokok = parseFloat(form.watch('gaji_pokok') || '0') || 0
  const tunjangan = parseFloat(form.watch('tunjangan') || '0') || 0
  const potongan = parseFloat(form.watch('potongan') || '0') || 0
  
  const totalGaji = gajiPokok + tunjangan
  const gajiBersih = totalGaji - potongan

  useEffect(() => { 
    apiFetch<Array<{ id: string; nama: string; nik: string }>>('/api/v1/master/karyawan').then(r => setKOpts((r.data ?? []).map(x => ({ value: x.id, label: `[${x.nik}] ${x.nama}` })))).catch(() => toast.error('Gagal memuat daftar karyawan')) 
  }, [])
  
  const onSubmit = async (data: FV) => {
    setSubmitting(true); 
    try { 
      const payload = {
        karyawan_id: data.karyawan_id,
        bulan: parseInt(data.bulan),
        tahun: parseInt(data.tahun),
        gaji_pokok: parseFloat(data.gaji_pokok),
        tunjangan: parseFloat(data.tunjangan || '0'),
        potongan: parseFloat(data.potongan || '0'),
        keterangan: data.keterangan
      }
      await apiFetch('/api/v1/penggajian', { method: 'POST', body: JSON.stringify(payload) }); 
      toast.success('Penggajian berhasil disimpan!'); 
      router.push('/dashboard/penggajian') 
    }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Error') } 
    finally { setSubmitting(false) }
  }

  const bulanNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href="/dashboard/penggajian"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <div><h1 className="text-3xl font-heading font-bold">Tambah Penggajian</h1></div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4" /> Data Karyawan</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="karyawan_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Karyawan *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih karyawan" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {kOpts.length === 0 && <SelectItem value="loading" disabled>Memuat...</SelectItem>}
                      {kOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="bulan" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bulan *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger>{bulanNames[parseInt(field.value) - 1] || 'Pilih bulan'}</SelectTrigger></FormControl>
                      <SelectContent>{bulanNames.map((n, i) => <SelectItem key={i + 1} value={String(i + 1)}>{n}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="tahun" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tahun *</FormLabel>
                    <FormControl><Input type="number" min={2020} max={2100} placeholder={defTahun} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calculator className="h-4 w-4" /> Perhitungan Gaji</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="gaji_pokok" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gaji Pokok *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
                        <Input type="number" step="1000" min={0} className="pl-8" placeholder="0" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="tunjangan" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tunjangan</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="number" step="1000" min={0} className="pl-8" placeholder="0" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="bg-muted/50 rounded-lg p-4 border">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Gaji (Gaji Pokok + Tunjangan)</span>
                  <span className="font-semibold text-lg">Rp {totalGaji.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <FormField control={form.control} name="potongan" render={({ field }) => (
                <FormItem>
                  <FormLabel>Potongan</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MinusCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="number" step="1000" min={0} className="pl-8" placeholder="0" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Gaji Bersih</p>
                  <p className="text-xs text-muted-foreground">Gaji Pokok + Tunjangan - Potongan</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">Rp {gajiBersih.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Keterangan</CardTitle></CardHeader>
            <CardContent>
              <FormField control={form.control} name="keterangan" render={({ field }) => (
                <FormItem>
                  <FormControl><Textarea placeholder="Tambahkan keterangan jika perlu..." {...field} rows={3} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="cancel" asChild><Link href="/dashboard/penggajian">Batal</Link></Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}