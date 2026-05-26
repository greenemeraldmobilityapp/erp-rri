"use client"

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import Link from 'next/link';
import { supabase } from '@/lib/db/client';
import { apiFetch } from '@/lib/api/client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CustomerPage() {
  const router = useRouter();
  const [customerData, setCustomerData] = useState<Array<{
    id: string;
    nama: string;
    kode: string;
    alamat: string;
    kontak: string;
    terms_of_payment: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data, error } = await supabase
        .from('customer')
        .select(`
          id,
          nama,
          kode,
          alamat,
          kontak,
          terms_of_payment,
          is_active,
          created_at,
          updated_at
        `)
        .order('nama', { ascending: true });

      if (error) {
        setError(error.message);
      } else {
        setCustomerData(data || []);
      }
    };

    fetchCustomers();
  }, []);

  const handleDelete = (id: string) => async () => {
    await apiFetch(`/api/v1/master/customer/${id}`, { method: 'DELETE' });
    setCustomerData((prev) => prev.filter((item) => item.id !== id));
  };

  if (error) {
    return <div>Error: {error?.toString()}</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Daftar Customer</h1>
        <Link href="/dashboard/customer/tambah">
          <Button>Tambah Customer</Button>
        </Link>
      </div>

      {customerData.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Tidak ada data customer</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>TOP</TableHead>
                  <TableHead>Aktif</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerData.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>{customer.kode}</TableCell>
                    <TableCell>{customer.nama}</TableCell>
                    <TableCell>{customer.alamat || '-'}</TableCell>
                    <TableCell>{customer.kontak || '-'}</TableCell>
                    <TableCell>{customer.terms_of_payment || '-'}</TableCell>
                    <TableCell>
                      {customer.is_active ? (
                        <Badge variant="success">Aktif</Badge>
                      ) : (
                        <Badge variant="destructive">Nonaktif</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/master/customer/${customer.id}`)} className="hover:bg-accent">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Lihat Detail</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/master/customer/${customer.id}/edit`)} className="hover:bg-accent">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit</TooltipContent>
                        </Tooltip>
                        <DeleteConfirmationDialog
                          onConfirm={handleDelete(customer.id)}
                          itemName={customer.nama}
                          trigger={
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
