/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ReactElement } from 'react'
import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer'

Font.register({
  family: 'Arial',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/arial@1.0.4/Arial.ttf', fontWeight: 'normal', fontStyle: 'normal' },
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/arial-bold@1.0.4/Arial%20Bold.ttf', fontWeight: 'bold', fontStyle: 'normal' },
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/arial-italic@1.0.4/Arial%20Italic.ttf', fontWeight: 'normal', fontStyle: 'italic' },
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/arial-bold-italic@1.0.4/Arial%20Bold%20Italic.ttf', fontWeight: 'bold', fontStyle: 'italic' },
  ],
})

Font.registerHyphenationCallback((word) => [word])

const styles = StyleSheet.create({
  page: { padding: '40 50', fontFamily: 'Arial', fontSize: 11, lineHeight: 1.4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 1 },
  logoBox: { width: 90, height: 90, backgroundColor: '#1E3A5F', justifyContent: 'center', alignItems: 'center' },
  logoText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  headerRight: { alignItems: 'flex-end' },
  companyName: { fontSize: 16, fontWeight: 'bold', marginBottom: 6, color: '#0000FF', textDecoration: 'underline' },
  companyLine: { fontSize: 13, fontWeight: 'bold', marginBottom: 2 },
  labelValueRow: { flexDirection: 'row', marginBottom: 2 },
  labelText: { fontSize: 11, width: 80 },
  colonText: { fontSize: 11, width: 10 },
  valueText: { fontSize: 11 },
  alamatSection: { marginBottom: 15 },
  alamatTitle: { fontSize: 11, marginBottom: 4 },
  alamatName: { fontSize: 11, fontWeight: 'bold', marginBottom: 2 },
  alamatAddress: { fontSize: 11, maxWidth: 350, lineHeight: 1.3 },
  bodyText: { fontSize: 11, marginBottom: 5, textAlign: 'justify' },
  penutupText: { fontSize: 11, marginTop: 14, marginBottom: 4 },
  signatureSection: { marginTop: 16 },
  signatureTitle: { fontSize: 11, marginBottom: 2 },
  signatureCompany: { fontSize: 11, fontWeight: 'bold', marginBottom: 2 },
  signatureName: { fontSize: 11, fontWeight: 'bold', textDecoration: 'underline' },
  signatureJabatan: { fontSize: 11 },
  footer: { position: 'absolute', bottom: 24, left: 50, right: 50, borderTopWidth: 1.5, borderTopColor: '#000', paddingTop: 6, alignItems: 'center' },
  footerText: { fontSize: 10 },
  pageNum: { position: 'absolute', bottom: 28, right: 50, fontSize: 10, color: '#0000FF' },
  table: { width: '100%', borderStyle: 'solid', borderWidth: 1, borderColor: '#000', marginTop: 0 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderBottomWidth: 1, borderBottomColor: '#000' },
  tableHeaderCell: { fontSize: 9, fontWeight: 'bold', padding: 4, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
  tableTotalRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#000' },
  keteranganSection: { marginTop: 12, marginBottom: 12 },
  keteranganTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 6 },
  keteranganLine: { fontSize: 11, marginBottom: 2, marginLeft: 10 },
  paymentSection: { marginTop: 14, marginBottom: 12 },
  paymentText: { fontSize: 11, marginBottom: 6 },
  paymentRow: { flexDirection: 'row', marginBottom: 2 },
  paymentLabel: { fontSize: 11, width: 120 },
  paymentColon: { fontSize: 11, width: 10 },
  paymentValue: { fontSize: 11, fontWeight: 'bold' },
})

interface InvoiceItem {
  nama: string
  kode: string
  satuan: string
  jumlah: number
  hargaSatuan: number
  diskon: number
  urutan: number
}

interface CompanyData {
  company_nama: string | null
  company_bidang_usaha: string | null
  company_alamat: string | null
  company_no_hp: string | null
  company_email: string | null
  company_logo_url: string | null
  penandatangan_nama: string | null
  penandatangan_jabatan: string | null
  penandatangan_no_hp: string | null
  company_bank_name: string | null
  company_rekening_nama: string | null
  company_rekening_nomor: string | null
}

interface InvoiceData {
  nomor: string
  customerNama: string
  customerAlamat: string | null
  picNama: string | null
  picJenisKelamin: string | null
  tanggal: string
  customerRef: string | null
  refLabel: string
  grandTotal: number
  items: InvoiceItem[]
  keteranganInvoice: string | null
  company: CompanyData
}

function formatCurrency(v: number | null | undefined): string {
  if (v == null) return '0'
  return v.toLocaleString('id-ID')
}

const REACT_ELEMENT_TYPE = Symbol.for('react.element')

function createEl(type: any, props: Record<string, unknown> | null, ...children: unknown[]): ReactElement {
  const merged: Record<string, unknown> = { ...props }
  const childArr = children.flat(Infinity).filter(c => c !== false && c !== null && c !== undefined)
  if (childArr.length === 0) {
    merged.children = undefined
  } else if (childArr.length === 1) {
    merged.children = childArr[0]
  } else {
    merged.children = childArr
  }
  const key = (merged.key as string | null) ?? null
  delete merged.key
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    ref: null,
    props: merged,
    _owner: null,
    _store: {},
  } as ReactElement
}

export function InvoicePDF({ data }: { data: InvoiceData }) {
  const H = createEl
  const c = data.company
  const bidangUsaha = c.company_bidang_usaha || 'Furniture, Welding, General Trading, Services'
  const bidangLines = bidangUsaha.includes('\n')
    ? bidangUsaha.split('\n').map(s => s.trim()).filter(Boolean)
    : bidangUsaha.split(',').map(s => s.trim()).filter(Boolean)

  function getItemSlices(total: number): number[] {
    const slices: number[] = []
    let remaining = total
    let pageIdx = 0
    while (remaining > 0) {
      const limit = pageIdx === 0 ? 16 : 24
      slices.push(Math.min(limit, remaining))
      remaining -= slices[slices.length - 1]
      pageIdx++
    }
    return slices
  }
  const itemSlices = getItemSlices(data.items.length)
  const totalPages = itemSlices.length || 1

  const v = (child: any, style: any) => H(View, { style: { justifyContent: 'center', ...style } }, child)

  const tableHeaderCells = [
    H(Text, { style: [styles.tableHeaderCell, { width: 25 }] }, 'No'),
    H(Text, { style: [styles.tableHeaderCell, { flex: 1 }] }, 'Description'),
    H(Text, { style: [styles.tableHeaderCell, { width: 75 }] }, 'Unit'),
    H(Text, { style: [styles.tableHeaderCell, { width: 35 }] }, 'QTY'),
    H(Text, { style: [styles.tableHeaderCell, { width: 65 }] }, 'Unit Price'),
    H(Text, { style: [styles.tableHeaderCell, { width: 75, borderRightWidth: 0 }] }, 'Total'),
  ]

  const headerSection = H(View, { style: { marginBottom: 15 } },
    H(View, { style: styles.header },
      c.company_logo_url
        ? H(Image, { src: c.company_logo_url, style: { width: 80, height: 80, marginTop: -5 } })
        : H(View, { style: styles.logoBox },
            H(Text, { style: styles.logoText }, 'R')
          ),
      H(View, { style: styles.headerRight },
        H(Text, { style: styles.companyName }, c.company_nama || 'PT. RIZQI RIDHO ILAHI'),
        ...bidangLines.map((line, i) =>
          H(Text, { key: i, style: styles.companyLine }, line)
        )
      )
    ),
    H(View, { style: { borderBottomWidth: 2, borderBottomColor: '#000', marginTop: 3 } }),
    H(View, { style: { height: 3 } }),
    H(View, { style: { borderBottomWidth: 0.5, borderBottomColor: '#000' } }),
  )

  const docInfoSection = H(View, { style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 } },
    H(View, null,
      H(View, { style: styles.labelValueRow },
        H(Text, { style: styles.labelText }, 'No'),
        H(Text, { style: styles.colonText }, ':'),
        H(Text, { style: styles.valueText }, data.nomor)
      ),
      ...(data.customerRef
        ? [H(View, { style: styles.labelValueRow },
            H(Text, { style: styles.labelText }, data.refLabel),
            H(Text, { style: styles.colonText }, ':'),
            H(Text, { style: styles.valueText }, data.customerRef)
          )]
        : []
      ),
      H(View, { style: styles.labelValueRow },
        H(Text, { style: styles.labelText }, 'Perihal'),
        H(Text, { style: styles.colonText }, ':'),
        H(Text, { style: { fontSize: 11, fontWeight: 'bold' } }, 'Tagihan')
      ),
    ),
    H(Text, { style: styles.valueText }, data.tanggal)
  )

  const alamatSection = H(View, { style: styles.alamatSection },
    H(Text, { style: styles.alamatTitle }, 'Kepada Yth.'),
    H(Text, { style: styles.alamatName }, data.customerNama),
    data.picNama ? H(Text, { style: { fontSize: 11, marginBottom: 2 } }, 'u.p. ' + (data.picJenisKelamin === 'L' ? 'Bapak' : 'Ibu') + ' ' + data.picNama) : null,
    data.customerAlamat ? H(View, { style: styles.alamatAddress },
      H(Text, null, data.customerAlamat)
    ) : null,
  )

  const bodySection = H(View, null,
    H(Text, { style: styles.bodyText }, 'Dengan hormat,'),
    H(Text, { style: styles.bodyText }, 'Dengan ini kami bermaksud untuk meminta pembayaran atas pembelian barang sebagai berikut:'),
  )

  const paymentSection = H(View, { style: styles.paymentSection },
    H(Text, { style: styles.paymentText }, 'Pembayaran untuk dapat dilakukan kepada:'),
    H(View, { style: styles.paymentRow },
      H(Text, { style: styles.paymentLabel }, 'Nama'),
      H(Text, { style: styles.paymentColon }, ':'),
      H(Text, { style: styles.paymentValue }, c.company_rekening_nama || 'RIZQI RIDHO ILAHI PT'),
    ),
    H(View, { style: styles.paymentRow },
      H(Text, { style: styles.paymentLabel }, 'Bank'),
      H(Text, { style: styles.paymentColon }, ':'),
      H(Text, { style: styles.paymentValue }, c.company_bank_name || 'BCA KCP JEPARA'),
    ),
    H(View, { style: styles.paymentRow },
      H(Text, { style: styles.paymentLabel }, 'Nomor Rekening'),
      H(Text, { style: styles.paymentColon }, ':'),
      H(Text, { style: styles.paymentValue }, c.company_rekening_nomor || '2471266266'),
    ),
  )

  const keteranganLines = data.keteranganInvoice
    ? data.keteranganInvoice.split('\n').filter(Boolean)
    : []

  const keteranganSection = keteranganLines.length > 0 ? H(View, { style: styles.keteranganSection },
    H(Text, { style: styles.keteranganTitle }, 'Keterangan:'),
    ...keteranganLines.map((line, i) =>
      H(Text, { key: i, style: styles.keteranganLine }, '\u2022 ' + line)
    ),
  ) : null

  const penutupSection = H(Text, { style: styles.penutupText }, 'Demikian permintaan pembayaran ini kami kirimkan untuk dapat dibayarkan, atas perhatian dan kerjasamanya kami ucapkan terima kasih.')

  const signatureSection = H(View, { style: styles.signatureSection },
    H(Text, { style: styles.signatureTitle }, 'Hormat kami'),
    H(Text, { style: styles.signatureCompany }, c.company_nama || 'PT. RIZQI RIDHO ILAHI'),
    H(View, { style: { marginTop: 90 } },
      H(Text, { style: styles.signatureName }, c.penandatangan_nama || 'Mohamad Marzuqi'),
      H(Text, { style: styles.signatureJabatan }, c.penandatangan_jabatan || 'Direktur'),
    ),
  )

  const footerView = H(View, { style: styles.footer },
    H(Text, { style: styles.footerText }, c.company_alamat || 'Jerukwangi - Bangsri, Jepara'),
    H(Text, { style: styles.footerText },
      (c.company_no_hp || '+6281 2607 5500') + ', ' + (c.company_email || 'mazzjoeq@gmail.com')
    ),
  )

  return H(Document, null,
    ...Array.from({ length: totalPages }, (_, pageIdx) => {
      const pageItemCount = itemSlices[pageIdx]
      const startIdx = itemSlices.slice(0, pageIdx).reduce((a, b) => a + b, 0)
      const pageItems = data.items.slice(startIdx, startIdx + pageItemCount)
      const pageNumber = pageIdx + 1
      const isLastPage = pageIdx === totalPages - 1

      return H(Page, { key: pageIdx, size: 'A4', style: styles.page, wrap: true },
        headerSection,
        pageIdx === 0 ? docInfoSection : null,
        pageIdx === 0 ? alamatSection : null,
        pageIdx === 0 ? bodySection : null,

        H(View, { style: styles.table },
          H(View, { style: styles.tableHeader }, ...tableHeaderCells),
          ...pageItems.map((item) => {
            const lineTotal = item.hargaSatuan * item.jumlah - item.diskon
            return H(View, { key: item.urutan, style: styles.tableRow },
              v(H(Text, { style: { fontSize: 9, textAlign: 'center' } }, String(item.urutan)), { width: 25, padding: 4, borderRightWidth: 1, borderRightColor: '#000' }),
              v(H(Text, { style: { fontSize: 9 } }, item.nama), { flex: 1, padding: 4, borderRightWidth: 1, borderRightColor: '#000' }),
              v(H(Text, { style: { fontSize: 9, textAlign: 'center' } }, item.satuan || '-'), { width: 75, padding: 4, borderRightWidth: 1, borderRightColor: '#000' }),
              v(H(Text, { style: { fontSize: 9, textAlign: 'center' } }, String(item.jumlah)), { width: 35, padding: 4, borderRightWidth: 1, borderRightColor: '#000' }),
              v(H(Text, { style: { fontSize: 9, textAlign: 'right' } }, 'Rp ' + formatCurrency(item.hargaSatuan)), { width: 65, padding: 4, borderRightWidth: 1, borderRightColor: '#000' }),
              v(H(Text, { style: { fontSize: 9, textAlign: 'right' } }, 'Rp ' + formatCurrency(lineTotal)), { width: 75, padding: 4 }),
            )
          }),
          isLastPage ? H(View, { style: styles.tableTotalRow },
            H(View, { style: { flex: 1, padding: 4, justifyContent: 'center' } },
              H(Text, { style: { fontSize: 9, fontWeight: 'bold', textAlign: 'right' } }, 'GRAND TOTAL')
            ),
            H(View, { style: { width: 75, padding: 4, justifyContent: 'center' } },
              H(Text, { style: { fontSize: 9, fontWeight: 'bold', textAlign: 'right' } }, 'Rp ' + formatCurrency(data.grandTotal))
            ),
          ) : null,
        ),

        isLastPage && keteranganSection ? keteranganSection : null,
        isLastPage ? paymentSection : null,
        isLastPage ? penutupSection : null,
        isLastPage ? signatureSection : null,

        footerView,
        H(Text, { style: styles.pageNum }, `Page ${pageNumber} of ${totalPages}`)
      )
    }),
  )
}
