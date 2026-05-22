import type { Step } from 'react-joyride'

export const tourSteps: Step[] = [
  {
    target: '[data-tour="dashboard-link"]',
    content: 'Halaman ini adalah Dashboard — ringkasan bisnis Anda: revenue, pipeline, keuangan, stok, dan aktivitas terbaru dalam satu layar.',
    title: 'Dashboard',
    placement: 'right',
  },
  {
    target: '[data-tour="global-search"]',
    content: 'Cari data apa saja — barang, customer, invoice, PO — cukup tekan `/` atau `Ctrl+K`. Hasil pencarian muncul instan.',
    title: 'Pencarian Global',
    placement: 'bottom',
  },
  {
    target: '[data-tour="master-data"]',
    content: 'Kelola data referensi di sini: Barang, Supplier, Customer, COA, Karyawan, dan lainnya. Data master adalah fondasi seluruh sistem.',
    title: 'Master Data',
    placement: 'right',
  },
  {
    target: '[data-tour="pre-sales"]',
    content: 'Proses pra-penjualan: terima RFQ dari customer, buat Quotation (penawaran harga), dan lakukan Negosiasi sampai deal.',
    title: 'Pre-Sales',
    placement: 'right',
  },
  {
    target: '[data-tour="sales"]',
    content: 'Kelola penjualan: dari Customer PO, Sales Order, Delivery Instruction, sampai Delivery Order dan Retur Penjualan.',
    title: 'Sales',
    placement: 'right',
  },
  {
    target: '[data-tour="procurement"]',
    content: 'Proses pengadaan barang: Purchase Request, Purchase Order (ke supplier), Penerimaan, GRN, dan Retur Pembelian.',
    title: 'Procurement',
    placement: 'right',
  },
  {
    target: '[data-tour="finance"]',
    content: 'Modul keuangan: Invoice, Kwitansi, Faktur Pajak, dan Jurnal Umum. Auto-kalkulasi PPN 11% dan PPh.',
    title: 'Finance',
    placement: 'right',
  },
  {
    target: '[data-tour="laporan"]',
    content: 'Pantau kesehatan bisnis: AR/AP Aging, Laba Rugi, Neraca, dan Arus Kas. Semua laporan bisa di-export ke Excel.',
    title: 'Laporan',
    placement: 'right',
  },
  {
    target: '[data-tour="ai-agent"]',
    content: 'Gunakan kecerdasan AI: cari harga pasar otomatis, OCR kontrak, rekomendasi harga jual, dan bantuan negosiasi.',
    title: 'AI Agent',
    placement: 'right',
  },
  {
    target: '[data-tour="hr"]',
    content: 'Kelola SDM: catat absensi karyawan dan proses penggajian bulanan dengan slip gaji PDF.',
    title: 'HR',
    placement: 'right',
  },
  {
    target: '[data-tour="system"]',
    content: 'Lihat riwayat notifikasi WhatsApp yang dikirim ke customer & supplier, dan audit trail — semua perubahan data tercatat.',
    title: 'System',
    placement: 'right',
  },
  {
    target: '[data-tour="sidebar-header"]',
    content: 'Anda sudah mengenali semua modul ERP RRI. Mulai kelola bisnis Anda! Klik "Selesai" untuk menutup panduan, atau klik "Panduan" di header kapan saja untuk mengulang.',
    title: 'Selesai',
    placement: 'bottom',
  },
]
