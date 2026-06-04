import type { Step } from 'react-joyride'

export const barangListSteps: Step[] = [
  {
    target: '[data-tour="barang-title"]',
    content: 'Halaman ini menampilkan seluruh data barang yang terdaftar di sistem. Dari sini kamu bisa mencari, menambah, mengedit, dan menghapus data barang.',
    title: 'Data Barang',
    placement: 'bottom',
  },
  {
    target: '[data-tour="barang-search"]',
    content: 'Ketik nama atau kode barang di sini untuk mencari. Hasil akan terfilter otomatis saat kamu mengetik.',
    title: 'Pencarian Barang',
    placement: 'bottom',
  },
  {
    target: '[data-tour="barang-table"]',
    content: 'Tabel menampilkan Kode, Nama, Kategori, No. Kontrak, Satuan, Harga Beli, Harga Jual, Stok Minimum, dan Status. Klik header kolom untuk mengurutkan data.',
    title: 'Tabel Barang',
    placement: 'top',
  },
  {
    target: '[data-tour="btn-tambah-barang"]',
    content: 'Klik tombol ini untuk menambahkan data barang baru ke dalam sistem.',
    title: 'Tambah Barang',
    placement: 'left',
  },
  {
    target: '[data-tour="barang-actions"]',
    content: 'Setiap baris barang memiliki tombol aksi: Lihat Detail (ikon mata), Edit (ikon pensil), dan Hapus (ikon tempat sampah). Hati-hati — data yang dihapus tidak bisa dikembalikan.',
    title: 'Aksi Barang',
    placement: 'left',
  },
]
