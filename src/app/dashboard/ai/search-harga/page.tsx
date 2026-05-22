"use client"
import { useState } from 'react'; import { useRouter } from 'next/navigation'; import { z } from 'zod'; import { useForm } from 'react-hook-form'; import { zodResolver } from '@hookform/resolvers/zod'
import { apiFetch } from '@/lib/api/client'; import { Button } from '@/components/ui/button'; import { Input } from '@/components/ui/input'; import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; import { Badge } from '@/components/ui/badge'
import { Search, Loader2, ExternalLink, Star } from 'lucide-react'; import { toast } from 'sonner'

const schema = z.object({ query: z.string().min(1, 'Barang harus diisi') })
type FV = z.input<typeof schema>

interface SearchResult { nama: string; harga: number; toko: string; link: string; marketplace: string; rating: number | null }

export default function SearchHargaPage() {
  const router = useRouter(); const [results, setResults] = useState<SearchResult[]>([]); const [searching, setSearching] = useState(false); const [searched, setSearched] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FV>({ resolver: zodResolver(schema) })
  const onSubmit = async (data: FV) => {
    setSearching(true); setSearched(false)
    try { const r = await apiFetch<{ results: SearchResult[] }>('/api/v1/ai/search-harga', { method: 'POST', body: JSON.stringify(data) }); setResults(r.data.results); setSearched(true) }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Error') } finally { setSearching(false) }
  }
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-heading font-bold">AI Search Harga</h1><p className="text-muted-foreground mt-1">Cari harga barang di marketplace</p></div>
      <Card><CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex gap-3">
          <div className="flex-1"><Input {...register('query')} placeholder="Cari barang... (e.g., Kabel NYM 2x1.5)" className="text-base" /></div>
          <Button type="submit" disabled={searching}>{searching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}{searching ? 'Mencari...' : 'Search'}</Button>
        </form>
      </CardContent></Card>
      {searched && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Ditemukan {results.length} hasil</p>
          {results.map((item, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow"><CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.nama}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{item.marketplace}</Badge>
                    <span className="text-sm text-muted-foreground truncate">{item.toko}</span>
                    {item.rating && <span className="text-xs text-amber-500 flex items-center"><Star className="h-3 w-3 mr-0.5" />{item.rating}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-bold text-primary">Rp {item.harga.toLocaleString('id-ID')}</p>
                  <Button variant="link" size="sm" className="p-0 h-auto" asChild><a href={item.link} target="_blank" rel="noopener"><ExternalLink className="h-3 w-3 mr-1" />Lihat</a></Button>
                </div>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  )
}
