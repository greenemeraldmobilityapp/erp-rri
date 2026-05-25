"use client"

import Link from 'next/link'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/db/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ArrowLeft, Pencil, Printer } from 'lucide-react'

const statusMap: Record<string, { label: string; variant: 'secondary' | 'success' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  approved: { label: 'Disetujui', variant: 'success' },
}

function rupiah(v: number) {
  return `Rp ${v.toLocaleString('id-ID')}`
}

export default function FakturPajakDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>('');

  useEffect(() => {
    params.then((resolvedParams) => {
      setId(resolvedParams.id);
    });
  }, [params]);
  const [fakturPajak, setFakturPajak] = useState<{
    id: string;
    nomor: string;
    nomor_faktur: string;
    tanggal: string;
    status: string;
    dpp: number;
    ppn: number;
    pph: number;
    invoice: {
      nomor: string;
      customer_id: string;
      customer: {
        nama: string;
        alamat: string | null;
        kode: string;
      };
    };
  } | null>(null);
  const [items, setItems] = useState<Array<{
    id: string;
    faktur_pajak_id: string;
    invoice_item_id: string;
    dpp: number;
    ppn: number;
    pph: number;
    invoice_item: {
      harga: number;
      barang_id: string;
      barang: {
        nama: string;
        kode: string;
        satuan: string;
      };
    };
  }>>([]);
  
  const ppnRate = items && items.length > 0 && items[0].dpp > 0
    ? Math.round((items[0].ppn / items[0].dpp) * 100)
    : 11;

  const pphRate = (() => {
    if (!items?.length) return null;
    const totalPph = items.reduce((s, i) => s + (i.pph ?? 0), 0);
    const totalDpp = items.reduce((s, i) => s + (i.dpp ?? 0), 0);
    if (totalDpp > 0 && totalPph > 0) return Math.round((totalPph / totalDpp) * 100);
    return null;
  })();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      const { data: fpData, error: fpError } = await supabase
        .from('faktur_pajak')
        .select('*, invoice!invoice_id(nomor, customer_id, customer!customer_id(nama, alamat, kode))')
        .eq('id', id)
        .single();

      if (fpError || !fpData) {
        setError("Faktur Pajak tidak ditemukan");
        setIsLoading(false);
        return;
      }

      const { data: items } = await supabase
        .from('faktur_pajak_item')
        .select('*, invoice_item!invoice_item_id(harga, barang_id, barang!barang_id(nama, kode, satuan))')
        .eq('faktur_pajak_id', id)
        .order('created_at', { ascending: true });

      setFakturPajak(fpData);
      setItems(items || []);
      setIsLoading(false);
    };

    fetchData();
  }, [id]);

  if (isLoading) {
    return <div className="text-center py-20 text-muted-foreground">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-20 text-muted-foreground">{error}</div>;
  }

  if (!fakturPajak) {
    return <div className="text-center py-20 text-muted-foreground">Faktur Pajak tidak ditemukan</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/faktur-pajak">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-heading font-bold">Faktur Pajak</h1>
            <p className="text-muted-foreground mt-1">{fakturPajak.nomor}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />Cetak
          </Button>
          <Button variant="outline" asChild>
           <Link href={`/dashboard/faktur-pajak/${id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />Edit
            </Link>
          </Button>
        </div>
      </div>

      <Card className="print:shadow-none print:border">
        <CardContent className="pt-8 pb-8 space-y-8">
          {/* Header */}
          <div className="text-center border-b pb-6">
            <h2 className="text-2xl font-bold tracking-tight">FAKTUR PAJAK</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Sesuai Peraturan Direktur Jenderal Pajak
            </p>
          </div>

          {/* Kode & Nomor */}
          <div className="bg-muted/30 border rounded-lg p-4 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Kode dan Nomor Seri Faktur Pajak</span>
              <span className="font-mono font-bold text-base">{fakturPajak.nomor_faktur}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Tanggal</span>
              <span className="font-medium">{new Date(fakturPajak.tanggal).toLocaleDateString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={statusMap[fakturPajak.status]?.variant ?? 'outline'}>
                {statusMap[fakturPajak.status]?.label ?? fakturPajak.status}
              </Badge>
            </div>
          </div>

          {/* PKP Penjual & Pembeli */}
      <div className="grid grid-cols-2 gap-6">
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                PKP Penjual
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Nama</p>
                  <p className="font-medium">Radio Republik Indonesia</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">NPWP</p>
                  <p className="font-mono text-muted-foreground">—</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Alamat</p>
                  <p className="text-muted-foreground">—</p>
                </div>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Pembeli
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Nama</p>
                  <p className="font-medium">{fakturPajak.invoice?.customer?.nama ?? '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">NPWP</p>
                  <p className="font-mono text-muted-foreground">—</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Alamat</p>
                  <p className="text-muted-foreground">{fakturPajak.invoice?.customer?.alamat ?? '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ref Invoice */}
          <div className="text-xs text-muted-foreground border rounded-lg p-3">
             Referensi: Invoice <span className="font-medium">{fakturPajak.invoice?.nomor ?? '-'}</span>
            {' · '}Kode Customer: <span className="font-medium">{fakturPajak.invoice?.customer?.kode ?? '-'}</span>
          </div>

          {/* Items Table */}
          <div>
            <Table>
              <TableHeader>
                <TableRow className="border-b-2">
                  <TableHead className="text-center w-8">No</TableHead>
                  <TableHead>Nama Barang/Jasa</TableHead>
                  <TableHead className="text-right w-28">Harga Satuan</TableHead>
                  <TableHead className="text-right w-16">Jml</TableHead>
                  <TableHead className="text-right w-28">Diskon</TableHead>
                  <TableHead className="text-right w-32">DPP</TableHead>
                  <TableHead className="text-center w-16">%PPN</TableHead>
                  <TableHead className="text-right w-28">PPN</TableHead>
                  {pphRate && (
                    <>
                      <TableHead className="text-center w-16">%PPh</TableHead>
                      <TableHead className="text-right w-28">PPh</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!items || items.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={pphRate ? 10 : 8} className="text-center text-muted-foreground py-8">
                      Belum ada item
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, i) => {
                    const invItem = item.invoice_item as { harga: number; barang_id: string; barang: { nama: string; kode: string; satuan: string } | null } | null
                    const brg = invItem?.barang
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="text-center text-muted-foreground">{i + 1}</TableCell>
                        <TableCell>
                          <p className="font-medium">{brg?.nama ?? '-'}</p>
                          <p className="text-xs text-muted-foreground">{brg?.kode}</p>
                        </TableCell>
                         <TableCell className="text-right font-mono">{rupiah(item.invoice_item.harga)}</TableCell>
                        <TableCell className="text-right">—</TableCell>
                        <TableCell className="text-right">—</TableCell>
                        <TableCell className="text-right font-mono">{rupiah(item.dpp)}</TableCell>
                        <TableCell className="text-center">{ppnRate}%</TableCell>
                        <TableCell className="text-right font-mono">{rupiah(item.ppn)}</TableCell>
                        {pphRate && (
                          <>
                            <TableCell className="text-center">{pphRate}%</TableCell>
                            <TableCell className="text-right font-mono">{rupiah(item.pph ?? 0)}</TableCell>
                          </>
                        )}
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>

            {/* Totals */}
            <div className="border-t-2 mt-4 pt-4 space-y-2">
              <div className="flex justify-end items-center gap-8 text-sm">
                <span className="text-muted-foreground w-24 text-right">DPP</span>
                <span className="font-semibold w-36 text-right font-mono">{rupiah(fakturPajak.dpp)}</span>
              </div>
              <div className="flex justify-end items-center gap-8 text-sm">
                <span className="text-muted-foreground w-24 text-right">PPN {ppnRate}%</span>
                <span className="font-semibold w-36 text-right font-mono">{rupiah(fakturPajak.ppn)}</span>
              </div>
              {fakturPajak.pph && fakturPajak.pph > 0 && (
                <div className="flex justify-end items-center gap-8 text-sm">
                  <span className="text-muted-foreground w-24 text-right">PPh{pphRate ? ` ${pphRate}%` : ''}</span>
                  <span className="font-semibold w-36 text-right font-mono">{rupiah(fakturPajak.pph)}</span>
                </div>
              )}
              <div className="flex justify-end items-center gap-8 border-t pt-2 mt-2">
                <span className="font-bold w-24 text-right">Total</span>
                <span className="font-bold text-base w-36 text-right font-mono">
                  {rupiah(fakturPajak.dpp + fakturPajak.ppn - (fakturPajak.pph ?? 0))}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t pt-4 text-center">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dokumen ini dibuat secara elektronik dan tidak memerlukan tanda tangan basah.{'\n'}
              Faktur Pajak ini sah menurut ketentuan peraturan perundang-undangan perpajakan.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="back" asChild>
          <Link href="/dashboard/faktur-pajak">Kembali</Link>
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />Cetak
        </Button>
        <Button asChild>
            <Link href={`/dashboard/faktur-pajak/${id}/edit`}>
            <Pencil className="h-4 w-4 mr-2" />Edit
          </Link>
        </Button>
      </div>
    </div>
  )
};
