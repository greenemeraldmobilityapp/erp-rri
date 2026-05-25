"use client"
import { useState } from 'react'; import { z } from 'zod'; import { useForm } from 'react-hook-form'; import { zodResolver } from '@hookform/resolvers/zod'
import { apiFetch } from '@/lib/api/client'; import { Button } from '@/components/ui/button'; import { Input } from '@/components/ui/input'; import { Card, CardHeader, CardContent } from '@/components/ui/card'; import { Badge } from '@/components/ui/badge'
import { Search, Loader2, ExternalLink, Star, DollarSign } from 'lucide-react'; import { toast } from 'sonner'; import { Skeleton } from '@/components/ui/skeleton'

const schema = z.object({ query: z.string().min(1, 'Barang harus diisi') })
type FV = z.input<typeof schema>

interface SearchResult { 
  nama: string; 
  harga: number; 
  toko: string; 
  link: string; 
  marketplace: string; 
  rating: number | null;
  hargaRataRata?: number;
}

interface PriceComparison {
  hargaTerendah: number;
  hargaTertinggi: number;
  hargaRataRata: number;
  jumlahSeller: number;
}

export default function SearchHargaPage() {
  const [results, setResults] = useState<SearchResult[]>([]); 
  const [searching, setSearching] = useState(false); 
  const [searched, setSearched] = useState(false);
  const [priceComparison, setPriceComparison] = useState<PriceComparison | null>(null);
  const { register, handleSubmit } = useForm<FV>({ resolver: zodResolver(schema) })
  
  const onSubmit = async (data: FV) => {
    setSearching(true); 
    setSearched(false);
    setPriceComparison(null);
    try { 
      const r = await apiFetch<{ 
        results: SearchResult[]; 
        priceComparison?: PriceComparison 
      }>('/api/v1/ai/search-harga', { 
        method: 'POST', 
        body: JSON.stringify(data) 
      });
      setResults(r.data.results);
      setPriceComparison(r.data.priceComparison ?? null);
      setSearched(true)
    }
    catch (err) { 
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan') 
    } 
    finally { 
      setSearching(false) 
    }
  }

  // Determine if price is above or below average
  const getPriceStatus = (harga: number) => {
    if (!priceComparison) return 'neutral';
    const diffPercent = ((harga - priceComparison.hargaRataRata) / priceComparison.hargaRataRata) * 100;
    if (diffPercent > 10) return 'high';
    if (diffPercent < -10) return 'low';
    return 'neutral';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold">AI Search Harga</h1>
        <p className="text-muted-foreground mt-1">Cari harga barang di marketplace dengan perbandingan visual</p>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="flex gap-3">
            <div className="flex-1">
              <Input 
                {...register('query')} 
                placeholder="Cari barang... (e.g., Kabel NYM 2x1.5)" 
                className="text-base" 
              />
            </div>
            <Button type="submit" disabled={searching}>
              {searching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span className="hidden md:inline-block">Mencari...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline-block">Search</span>
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Price Comparison Section */}
      {priceComparison && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Perbandingan Harga</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Harga Terendah</p>
                <p className="font-bold text-success">Rp {priceComparison.hargaTerendah.toLocaleString('id-ID')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Harga Tertinggi</p>
                <p className="font-bold text-destructive">Rp {priceComparison.hargaTertinggi.toLocaleString('id-ID')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Harga Rata-rata</p>
                <p className="font-bold">Rp {priceComparison.hargaRataRata.toLocaleString('id-ID')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Jumlah Seller</p>
                <p className="font-bold">{priceComparison.jumlahSeller}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground mr-2" />
              <div className="flex-1">
                <div className="flex h-2 w-full bg-muted/50 rounded overflow-hidden">
                  <div 
                    className="bg-primary h-full" 
                    style={{ width: `${Math.min((priceComparison.hargaTerendah / priceComparison.hargaTertinggi) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="ml-2">Rentang harga: {(priceComparison.hargaTertinggi - priceComparison.hargaTerendah).toLocaleString('id-ID')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {searched && (
        <>
          <p className="text-sm text-muted-foreground">
            Ditemukan {results.length} hasil
          </p>
          
          {/* Loading Skeleton for Results */}
          {!results.length && searching && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <Skeleton className="h-4 w-32" />
                    <div className="flex items-center gap-2 mt-1">
                      <Skeleton className="h-3 w-8" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Actual Results */}
          {results.length > 0 && (
            <div className="space-y-3">
              {results.map((item, i) => (
                <Card key={i} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.nama}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{item.marketplace}</Badge>
                          <span className="text-sm text-muted-foreground truncate">{item.toko}</span>
                          {item.rating && (
                            <span className="text-xs text-amber-500 flex items-center">
                              <Star className="h-3 w-3 mr-0.5" />{item.rating}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-xl font-bold ${getPriceStatus(item.harga) === 'high' ? 'text-destructive' : getPriceStatus(item.harga) === 'low' ? 'text-success' : 'text-foreground'}`}>
                          Rp {item.harga.toLocaleString('id-ID')}
                        </p>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0 h-auto" 
                          asChild
                        >
                          <a href={item.link} target="_blank" rel="noopener">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Lihat
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}