"use client"
import { useEffect, useState, useRef } from 'react'
import { apiFetch } from '@/lib/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/page-header'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { ROLES, ROLE_LABELS, type Role } from '@/types/role'
import { Users, ShieldCheck, UserPlus, Search } from 'lucide-react'

interface UserData {
  id: string
  email: string
  name: string
  role: Role
  is_active: boolean
  created_at: string
}

export default function UserManagementPage() {
  const [data, setData] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', password: '', name: '', role: 'sales' as Role })
  const [submitting, setSubmitting] = useState(false)
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const r = await apiFetch<UserData[]>('/api/v1/users', { method: 'GET' })
      if (mountedRef.current) {
        setData(r.data ?? [])
        if (!r.data?.length) {
          toast.warning('Data user kosong. Tambahkan user baru.')
        }
      }
    } catch (err: unknown) {
      if (mountedRef.current) {
        setData([])
        toast.error(err instanceof Error ? err.message : 'Gagal memuat data user')
      }
    }
    finally { if (mountedRef.current) setLoading(false) }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers()
  }, [])

  const handleCreate = async () => {
    setSubmitting(true)
    try {
      await apiFetch('/api/v1/users', {
        method: 'POST',
        body: JSON.stringify(newUser),
      })
      toast.success('User berhasil dibuat')
      setOpen(false)
      setNewUser({ email: '', password: '', name: '', role: 'sales' })
      fetchUsers()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat user'
      toast.error(msg)
    } finally { setSubmitting(false) }
  }

  const handleToggleActive = async (user: UserData) => {
    try {
      await apiFetch(`/api/v1/users/${user.id}`, {
        method: 'DELETE',
      })
      toast.success(`${user.is_active ? 'Menonaktifkan' : 'Mengaktifkan'} ${user.name}`)
      fetchUsers()
    } catch { toast.error('Gagal update user') }
  }

  const filtered = data.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  )

  const activeCount = data.filter((u) => u.is_active).length

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader title="Manajemen User" description="Kelola user, role, dan status aktif" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari user..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 w-60" />
          </div>
          <div className="flex gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="h-4 w-4" />{data.length} total</span>
            <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4" />{activeCount} aktif</span>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="h-4 w-4 mr-1" />Tambah User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Tambah User Baru</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nama</Label>
                <Input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="Nama lengkap" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="email@example.com" type="email" />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} type="password" placeholder="Min 6 karakter" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v as Role })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={submitting} className="w-full">
                {submitting ? 'Menyimpan...' : 'Buat User'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Daftar User</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead className="w-24">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{ROLE_LABELS[user.role] ?? user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'destructive'}>
                          {user.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('id')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(user)}
                          >
                            {user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Tidak ada user ditemukan
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
