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
  alamatSection: { marginBottom: 20 },
  alamatTitle: { fontSize: 11, marginBottom: 4 },
  alamatName: { fontSize: 11, fontWeight: 'bold', marginBottom: 2 },
  alamatAddress: { fontSize: 11, maxWidth: 350, lineHeight: 1.3 },
  bodyText: { fontSize: 11, marginBottom: 8, textAlign: 'justify' },
  bodyBold: { fontSize: 11, fontWeight: 'bold' },
  keteranganText: { fontSize: 11, marginTop: 8 },
  penutupText: { fontSize: 11, marginTop: 14 },
  signatureSection: { marginTop: 16 },
  signatureTitle: { fontSize: 11, marginBottom: 2 },
  signatureCompany: { fontSize: 11, fontWeight: 'bold', marginBottom: 2 },
  signatureImage: { width: 100, height: 50, marginBottom: 2, objectFit: 'contain' },
  stampImage: { width: 80, height: 80, objectFit: 'contain', position: 'absolute', left: 60, top: -10 },
  signatureWrap: { position: 'relative', marginTop: 4, minHeight: 105 },
  signatureName: { fontSize: 11, fontWeight: 'bold', textDecoration: 'underline' },
  signatureJabatan: { fontSize: 11 },
  signaturePhone: { fontSize: 11, marginTop: 2 },
  footer: { position: 'absolute', bottom: 24, left: 50, right: 50, borderTopWidth: 1.5, borderTopColor: '#000', paddingTop: 6, alignItems: 'center' },
  footerText: { fontSize: 10 },
  pageNum: { position: 'absolute', bottom: 28, right: 50, fontSize: 10, color: '#0000FF' },
  lampiranTitle: { fontSize: 11, fontWeight: 'bold', textDecoration: 'underline', marginBottom: 4 },
  lampiranSub: { fontSize: 11, marginBottom: 12 },
  table: { width: '100%', borderStyle: 'solid', borderWidth: 1, borderColor: '#000' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderBottomWidth: 1, borderBottomColor: '#000' },
  tableCell: { fontSize: 9, padding: 4, borderRightWidth: 1, borderRightColor: '#000' },
  tableHeaderCell: { fontSize: 9, fontWeight: 'bold', padding: 4, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000' },
  tableCellRight: { fontSize: 9, padding: 4, textAlign: 'right', borderRightWidth: 1, borderRightColor: '#000' },
  tableCellCenter: { fontSize: 9, padding: 4, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000' },
  tableCellLast: { fontSize: 9, padding: 4, textAlign: 'right' },
  tableCellCenterLast: { fontSize: 9, padding: 4, textAlign: 'center' },
  tableTotalRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#000' },
  tableTotalLabel: { fontSize: 9, fontWeight: 'bold', padding: 4, textAlign: 'right' },
  tableTotalValue: { fontSize: 9, fontWeight: 'bold', padding: 4, textAlign: 'right' },
  keteranganFootnote: { fontSize: 10, fontStyle: 'italic', color: '#555' },
})

interface QuotItem {
  nama: string
  kode: string
  specification: string | null
  justification: string | null
  image_url: string | null
  satuan: string | null
  jumlah: number
  hargaSatuan: number
  diskon: number
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
  tanda_tangan_url: string | null
  stempel_url: string | null
  tanda_tangan_stempel_url: string | null
}

interface QuotData {
  nomor: string
  referensi: string | null
  lampiran: string | null
  perihal: string | null
  pic_customer_nama: string | null
  pic_customer_no_hp: string | null
  pic_jenis_kelamin: string | null
  customer: { nama: string; kode: string }
  alamat: string | null
  tanggal: string
  masa_berlaku: string | null
  tanggal_berlaku_sampai: string | null
  ppn_rate: number
  ppn_enabled: boolean
  total_harga: number | null
  keterangan: string | null
  items: QuotItem[]
  company: CompanyData
}

function formatCurrency(v: number | null | undefined): string {
  if (v == null) return '0'
  return v.toLocaleString('id-ID')
}

function formatDateWithCity(dateStr: string): string {
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 'Jepara, ' + dateStr
  return `Jepara, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
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

export function QuotationPDF({ data }: { data: QuotData }) {
  const subtotal = data.items.reduce((s, i) => s + i.jumlah * i.hargaSatuan, 0)
  const totalDiskon = data.items.reduce((s, i) => s + (i.jumlah * i.hargaSatuan * (i.diskon || 0)) / 100, 0)
  const totalSebelumPpn = subtotal - totalDiskon
  const ppnAmount = data.ppn_enabled ? totalSebelumPpn * data.ppn_rate : 0
  const grandTotal = totalSebelumPpn + ppnAmount

  const c = data.company
  const bidangUsaha = c.company_bidang_usaha || 'Furniture, Welding, General Trading, Services'
  const bidangLines = bidangUsaha.includes('\n')
    ? bidangUsaha.split('\n').map(s => s.trim()).filter(Boolean)
    : bidangUsaha.split(',').map(s => s.trim()).filter(Boolean)

  const hasSpec = data.items.some(i => i.specification)
  const ROWS_PER_PAGE = 10
  const totalLampiranPages = Math.ceil(data.items.length / ROWS_PER_PAGE)
  const totalPages = 1 + totalLampiranPages

  const H = createEl

  return H(Document, null,
    H(Page, { size: 'A4', style: styles.page, wrap: true },
      H(View, { style: { marginBottom: 18 } },
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
      ),

      H(View, { style: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 } },
        H(View, null,
          H(View, { style: styles.labelValueRow },
            H(Text, { style: styles.labelText }, 'No. Surat'),
            H(Text, { style: styles.colonText }, ':'),
            H(Text, { style: styles.valueText }, data.nomor)
          ),
          H(View, { style: styles.labelValueRow },
            H(Text, { style: styles.labelText }, 'No. Ref.'),
            H(Text, { style: styles.colonText }, ':'),
            H(Text, { style: styles.valueText }, data.referensi || '-')
          ),
          H(View, { style: styles.labelValueRow },
            H(Text, { style: styles.labelText }, 'Lampiran'),
            H(Text, { style: styles.colonText }, ':'),
            H(Text, { style: styles.valueText }, data.lampiran || '-')
          ),
          H(View, { style: styles.labelValueRow },
            H(Text, { style: styles.labelText }, 'Perihal'),
            H(Text, { style: styles.colonText }, ':'),
            H(Text, { style: styles.valueText }, data.perihal || 'Penawaran Harga')
          )
        ),
        H(View, null,
          H(Text, { style: styles.valueText }, formatDateWithCity(data.tanggal))
        )
      ),

      H(View, { style: styles.alamatSection },
        H(Text, { style: styles.alamatTitle }, 'Kepada Yth.:'),
        H(Text, { style: styles.alamatName }, data.customer.nama),
        data.pic_customer_nama ? H(Text, { style: { fontSize: 11, marginBottom: 2 } }, 'u.p. ' + (data.pic_jenis_kelamin === 'L' ? 'Bapak' : 'Ibu') + ' ' + data.pic_customer_nama) : null,
        H(View, { style: styles.alamatAddress },
          H(Text, null, data.alamat || '')
        )
      ),

      H(View, { style: { marginBottom: 18 } },
        H(Text, { style: styles.bodyText }, 'Dengan hormat,'),
        H(Text, { style: styles.bodyText }, 'Dengan ini kami bermaksud mengirimkan penawaran harga untuk melaksanakan pekerjaan tersebut.'),
        H(Text, { style: { ...styles.bodyText, marginTop: 4 } },
          'Harga yang kami ajukan adalah ',
          H(Text, { style: styles.bodyBold }, 'Rp. ' + formatCurrency(grandTotal))
        ),
        H(Text, { style: styles.bodyText }, 'Dengan rincian sebagaimana terlampir.'),

        (data.masa_berlaku && data.tanggal_berlaku_sampai || data.keterangan) && H(View, { style: styles.keteranganText },
          H(Text, { style: styles.bodyBold }, 'Keterangan:'),
          data.masa_berlaku && data.tanggal_berlaku_sampai && H(Text, { style: { fontSize: 11 } }, '- Informasi harga ini berlaku sampai ' + data.tanggal_berlaku_sampai),
          data.keterangan && H(Text, { style: { fontSize: 11 } }, '- ' + data.keterangan),
        ),
        H(Text, { style: styles.penutupText },
          'Demikian surat penawaran ini kami sampaikan, atas perhatian dan pertimbangannya diucapkan terimakasih.'
        )
      ),

      H(View, { style: styles.signatureSection },
        H(Text, { style: styles.signatureTitle }, 'Hormat kami'),
        H(Text, { style: styles.signatureCompany }, c.company_nama || 'PT. RIZQI RIDHO ILAHI'),
        H(View, { style: styles.signatureWrap },
          c.tanda_tangan_stempel_url
            ? H(Image, { src: c.tanda_tangan_stempel_url, style: { height: 100, marginBottom: 2, objectFit: 'contain', position: 'absolute', left: -10 } })
            : [c.tanda_tangan_url && H(Image, { src: c.tanda_tangan_url, style: styles.signatureImage }),
               c.stempel_url && H(Image, { src: c.stempel_url, style: styles.stampImage })]
        ),
        H(View, { style: { marginTop: (c.tanda_tangan_stempel_url || c.tanda_tangan_url) ? 0 : 40 } },
          H(Text, { style: styles.signatureName }, c.penandatangan_nama || 'Mohamad Marzuqi'),
          H(Text, { style: styles.signatureJabatan }, c.penandatangan_jabatan || 'Direktur')
        )
      ),

      H(View, { style: styles.footer },
        H(Text, { style: styles.footerText }, c.company_alamat || 'Jerukwangi - Bangsri, Jepara'),
        H(Text, { style: styles.footerText },
          (c.company_no_hp || '+6281 2607 5500') + ', ' + (c.company_email || 'mazzjoeq@gmail.com')
        )
      ),
      H(Text, { style: styles.pageNum }, `Page 1 of ${totalPages}`)
    ),

    ...Array.from({ length: totalLampiranPages }, (_, pageIdx) => {
      const pageItems = data.items.slice(pageIdx * ROWS_PER_PAGE, (pageIdx + 1) * ROWS_PER_PAGE)
      const pageNumber = 2 + pageIdx
      const isLast = pageIdx === totalLampiranPages - 1

      return H(Page, { key: pageIdx, size: 'A4', style: styles.page, wrap: true },
        H(Text, { style: styles.lampiranTitle }, 'LAMPIRAN RINCIAN PENAWARAN HARGA'),
        H(Text, { style: styles.lampiranSub }, 'No. Surat : ' + data.nomor),

        H(View, { style: styles.table },
          (() => {
            const headerCells = [
              H(Text, { style: [styles.tableHeaderCell, { width: 25 }] }, 'No'),
              H(Text, { style: [styles.tableHeaderCell, { flex: 1 }] }, 'Item'),
            ]
            if (hasSpec) {
              headerCells.push(H(Text, { style: [styles.tableHeaderCell, { flex: 1 }] }, 'Specification'))
            }
            headerCells.push(
              H(Text, { style: [styles.tableHeaderCell, { width: 65 }] }, 'Picture'),
              H(Text, { style: [styles.tableHeaderCell, { width: 40 }] }, 'Qty'),
              H(Text, { style: [styles.tableHeaderCell, { width: 45 }] }, 'UoM'),
              H(Text, { style: [styles.tableHeaderCell, { width: 65 }] }, 'Price'),
              H(Text, { style: [styles.tableHeaderCell, { width: 65, borderRightWidth: 0 }] }, 'Total Price')
            )
            return H(View, { style: styles.tableHeader }, ...headerCells)
          })(),
          ...pageItems.map((item, i) => {
            const totalPrice = item.jumlah * item.hargaSatuan
            const hasImage = !!item.image_url
            const v = (child: any, style: any) => H(View, { style: { justifyContent: 'center', ...style } }, child)
            const cells = [
              v(H(Text, { style: { fontSize: 9, textAlign: 'center' } }, String(pageIdx * ROWS_PER_PAGE + i + 1)), { width: 25, padding: 4, borderRightWidth: 1, borderRightColor: '#000' }),
              v(H(Text, { style: { fontSize: 9 } }, item.nama), { flex: 1, padding: 4, borderRightWidth: 1, borderRightColor: '#000' }),
            ]
            if (hasSpec) {
              cells.push(v(H(Text, { style: { fontSize: 9 } }, item.specification || '-'), { flex: 1, padding: 4, borderRightWidth: 1, borderRightColor: '#000' }))
            }
            cells.push(
              H(View, { style: { width: 65, padding: 4, borderRightWidth: 1, borderRightColor: '#000', alignItems: 'center', justifyContent: 'center' } },
                hasImage
                  ? H(Image, { src: item.image_url, style: { width: 50, height: 50, objectFit: 'contain' } })
                  : H(Text, { style: { fontSize: 9, textAlign: 'center' } }, '-')
              ),
              v(H(Text, { style: { fontSize: 9, textAlign: 'center' } }, String(item.jumlah)), { width: 40, padding: 4, borderRightWidth: 1, borderRightColor: '#000' }),
              v(H(Text, { style: { fontSize: 9, textAlign: 'center' } }, item.satuan || '-'), { width: 45, padding: 4, borderRightWidth: 1, borderRightColor: '#000' }),
              v(H(Text, { style: { fontSize: 9, textAlign: 'right' } }, formatCurrency(item.hargaSatuan)), { width: 65, padding: 4, borderRightWidth: 1, borderRightColor: '#000' }),
              v(H(Text, { style: { fontSize: 9, textAlign: 'right' } }, formatCurrency(totalPrice)), { width: 65, padding: 4, textAlign: 'right' })
            )
            return H(View, { key: i, style: styles.tableRow }, ...cells)
          }),
          isLast ? (() => {
            return H(View, { style: styles.tableTotalRow },
              H(View, { style: { flex: 1, padding: 4, justifyContent: 'center' } },
                H(Text, { style: { fontSize: 9, fontWeight: 'bold', textAlign: 'right' } }, 'TOTAL')
              ),
              H(View, { style: { width: 65, padding: 4, justifyContent: 'center' } },
                H(Text, { style: { fontSize: 9, fontWeight: 'bold', textAlign: 'right' } }, formatCurrency(grandTotal))
              )
            )
          })() : null,
        ),

        isLast && (data.keterangan || (data.masa_berlaku && data.tanggal_berlaku_sampai)) ? H(View, { style: { marginTop: 12 } },
          H(Text, { style: styles.keteranganFootnote }, '* Keterangan:'),
          data.masa_berlaku && data.tanggal_berlaku_sampai ? H(Text, { style: styles.keteranganFootnote }, '- Informasi harga ini berlaku sampai ' + data.tanggal_berlaku_sampai) : null,
          data.keterangan ? H(Text, { style: styles.keteranganFootnote }, '- ' + data.keterangan) : null,
        ) : null,
        H(View, { style: styles.footer },
          H(Text, { style: styles.footerText }, c.company_alamat || 'Jerukwangi - Bangsri, Jepara'),
          H(Text, { style: styles.footerText },
            (c.company_no_hp || '+6281 2607 5500') + ', ' + (c.company_email || 'mazzjoeq@gmail.com')
          )
        ),
        H(Text, { style: styles.pageNum }, `Page ${pageNumber} of ${totalPages}`)
      )
    })
  )
}
