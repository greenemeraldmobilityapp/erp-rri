import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import Link from 'next/link';
import { supabase } from '@/lib/db/client';

export default async function SupplierPage() {
  // Fetch supplier data from database
  const { data: supplierData, error } = await supabase
    .from('supplier')
    .select(`
      id,
      nama,
      kode,
      nama_toko,
      link_toko,
      no_rekening,
      kontak,
      terms_of_payment,
      is_marketplace,
      is_active,
      created_at
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching supplier:', error);
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Data Supplier</h1>
        <p className="text-red-500">Error loading data: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Data Supplier</h1>
        <Link href="/dashboard/supplier/tambah" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
          Tambah Supplier
        </Link>
      </div>

      {!supplierData || supplierData.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Belum ada data supplier. Silakan tambah supplier pertama.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  Kode
                </TableHead>
                <TableHead>
                  Nama Supplier
                </TableHead>
                <TableHead>
                  Nama Toko
                </TableHead>
                <TableHead>
                  No. Rekening
                </TableHead>
                <TableHead>
                  Kontak
                </TableHead>
                <TableHead>
                  Terms of Payment
                </TableHead>
                <TableHead>
                  Marketplace
                </TableHead>
                <TableHead>
                  Status
                </TableHead>
                <TableHead>
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supplierData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.kode}</TableCell>
                  <TableCell>{item.nama}</TableCell>
                  <TableCell>{item.nama_toko || '-'}</TableCell>
                  <TableCell>{item.no_rekening || '-'}</TableCell>
                  <TableCell>{item.kontak || '-'}</TableCell>
                  <TableCell>{item.terms_of_payment || '-'}</TableCell>
                  <TableCell>
                    {item.is_marketplace ? 'Ya' : 'Tidak'}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.is_active ? 'Active' : 'Non-Active'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link 
                      href={`/dashboard/supplier/${item.id}/edit`} 
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </Link>
                    <button 
                      onClick={() => handleDelete()} 
                      className="text-red-600 hover:text-red-900"
                    >
                      Hapus
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody></Table>
        </div>
      )}
    </div>
  );
}

// Placeholder function for delete
async function handleDelete() {
  if (window.confirm('Apakah Anda yakin ingin menghapus supplier ini?')) {
    alert('Delete functionality will be implemented with Server Actions');
    window.location.reload();
  }
}