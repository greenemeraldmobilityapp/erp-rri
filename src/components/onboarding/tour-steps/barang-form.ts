import type { Step } from 'react-joyride'

export const barangFormSteps: Step[] = [
  {
    target: '[data-tour="barang-form-title"]',
    content: 'Form ini digunakan untuk menambahkan data barang baru. Ada dua cara input: manual atau import dari kontrak.',
    title: 'Tambah Barang',
    placement: 'bottom',
  },
  {
    target: '[data-tour="barang-form-tabs"]',
    content: 'Pilih "Input Manual" untuk mengisi form satu per satu, atau "Import dari Kontrak" untuk mengambil data barang dari kontrak yang sudah ada menggunakan AI.',
    title: 'Metode Input',
    placement: 'bottom',
  },
  {
    target: '[data-tour="field-nama"]',
    content: 'Isi nama barang dengan jelas dan deskriptif. Nama ini akan muncul di seluruh sistem — quotation, invoice, dan dokumen lainnya.',
    title: 'Nama Barang',
    placement: 'top',
  },
  {
    target: '[data-tour="field-kode"]',
    content: 'Kode barang bersifat unik. Gunakan kode yang konsisten, misalnya sesuai kategori atau supplier.',
    title: 'Kode Barang',
    placement: 'top',
  },
  {
    target: '[data-tour="field-kategori"]',
    content: 'Pilih kategori yang sesuai. Jika kategori belum ada, klik tombol "+" untuk membuat kategori baru langsung dari sini.',
    title: 'Kategori',
    placement: 'top',
  },
  {
    target: '[data-tour="field-harga"]',
    content: 'Isi harga beli dan harga jual default. Harga ini akan menjadi patokan saat membuat transaksi, tetapi bisa disesuaikan per transaksi.',
    title: 'Harga Default',
    placement: 'top',
  },
  {
    target: '[data-tour="field-image"]',
    content: 'Upload foto barang untuk memudahkan identifikasi. Format yang didukung: JPG, PNG, WebP — maksimal 5MB. Foto akan otomatis dikompres dan dikonversi ke WebP.',
    title: 'Foto Barang',
    placement: 'top',
  },
  {
    target: '[data-tour="btn-simpan"]',
    content: 'Pastikan semua data sudah benar, lalu klik Simpan. Data barang akan tersimpan dan muncul di halaman daftar barang.',
    title: 'Simpan',
    placement: 'top',
  },
]
