import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

const menuItems = [
  { href: '/dashboard/master/barang', label: 'Master Barang', desc: 'Kelola data barang dan inventaris' },
  { href: '/dashboard/master/supplier', label: 'Master Supplier', desc: 'Kelola data supplier' },
  { href: '/dashboard/master/customer', label: 'Master Customer', desc: 'Kelola data customer' },
  { href: '/dashboard/master/kontrak', label: 'Master Kontrak', desc: 'Kelola data kontrak' },
  { href: '/dashboard/master/coa', label: 'Chart of Accounts', desc: 'Kelola akun akuntansi' },
  { href: '/dashboard/master/jabatan', label: 'Master Jabatan', desc: 'Kelola data jabatan' },
  { href: '/dashboard/master/karyawan', label: 'Master Karyawan', desc: 'Kelola data karyawan' },
  { href: '/dashboard/master/kategori-barang', label: 'Kategori Barang', desc: 'Kelola kategori barang' },
  { href: '/dashboard/master/pic-customer', label: 'PIC Customer', desc: 'Kelola PIC customer' },
  { href: '/dashboard/rfq', label: 'RFQ', desc: 'Request for Quotation' },
  { href: '/dashboard/quotation', label: 'Quotation', desc: 'Buat dan kelola penawaran harga' },
  { href: '/api-docs', label: 'API Documentation', desc: 'Dokumentasi API dengan Scalar UI' },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Selamat datang di ERP RRI</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="h-full hover:border-accent/50 hover:shadow-md transition-all duration-200 cursor-pointer">
              <CardHeader>
                <CardTitle className="text-base">{item.label}</CardTitle>
                <CardDescription>{item.desc}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
