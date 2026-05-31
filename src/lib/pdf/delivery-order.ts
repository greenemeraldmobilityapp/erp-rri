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
  bodyText: { fontSize: 11, marginBottom: 8, textAlign: 'justify' },
  penutupText: { fontSize: 11, marginTop: 14 },
  signatureSection: { marginTop: 16, flexDirection: 'row', justifyContent: 'space-between' },
  signatureBox: { width: '45%', alignItems: 'center' },
  signatureTitle: { fontSize: 11, marginBottom: 2 },
  signatureCompany: { fontSize: 11, fontWeight: 'bold', marginBottom: 2 },
  signatureWrap: { position: 'relative', marginTop: 4, minHeight: 105, alignItems: 'center' },
  signatureName: { fontSize: 11, fontWeight: 'bold', textDecoration: 'underline' },
  signatureJabatan: { fontSize: 11 },
  footer: { position: 'absolute', bottom: 24, left: 50, right: 50, borderTopWidth: 1.5, borderTopColor: '#000', paddingTop: 6, alignItems: 'center' },
  footerText: { fontSize: 10 },
  pageNum: { position: 'absolute', bottom: 28, right: 50, fontSize: 10, color: '#0000FF' },
  table: { width: '100%', borderStyle: 'solid', borderWidth: 1, borderColor: '#000' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderBottomWidth: 1, borderBottomColor: '#000' },
  tableCell: { fontSize: 9, padding: 4, borderRightWidth: 1, borderRightColor: '#000' },
  tableHeaderCell: { fontSize: 9, fontWeight: 'bold', padding: 4, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000' },
  tableCellLast: { fontSize: 9, padding: 4, textAlign: 'right' },
  tableCellCenter: { fontSize: 9, padding: 4, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000' },
  tableCellCenterLast: { fontSize: 9, padding: 4, textAlign: 'center' },
  infoSection: { fontSize: 11, marginTop: 8, marginBottom: 12 },
  infoRow: { flexDirection: 'row', marginBottom: 2 },
  infoLabel: { width: 100 },
  infoValue: { flex: 1 },
})

interface DOItem {
  nama: string
  kode: string
  satuan: string
  jumlah: number
  keterangan: string | null
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

interface DOData {
  nomor: string
  ref: string | null
  customerNama: string
  tanggal: string
  keterangan: string | null
  items: DOItem[]
  kendaraanNama: string | null
  kendaraanNoPolisi: string | null
  company: CompanyData
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
  } as ReactElement
}

export function DeliveryOrderPDF({ data }: { data: DOData }): ReactElement {
  const c = data.company
  const bidangUsaha = c.company_bidang_usaha || 'Furniture, Welding, General Trading, Services'
  const bidangLines = bidangUsaha.includes('\n')
    ? bidangUsaha.split('\n').map(s => s.trim()).filter(Boolean)
    : bidangUsaha.split(',').map(s => s.trim()).filter(Boolean)

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
            H(Text, { style: styles.valueText }, data.ref || '-')
          ),
          H(View, { style: styles.labelValueRow },
            H(Text, { style: styles.labelText }, 'Perihal'),
            H(Text, { style: styles.colonText }, ':'),
            H(Text, { style: [styles.valueText, { textDecoration: 'underline' }] }, 'Surat Jalan')
          )
        ),
        H(View, null,
          H(Text, { style: styles.valueText }, formatDateWithCity(data.tanggal))
        )
      ),

      H(Text, { style: styles.bodyText }, 'Harap diterima dengan baik Barang-barang dibawah Ini:'),

      H(View, { style: styles.table },
        H(View, { style: styles.tableHeader },
          H(Text, { style: [styles.tableHeaderCell, { width: 25 }] }, 'No'),
          H(Text, { style: [styles.tableHeaderCell, { width: 90 }] }, 'Code'),
          H(Text, { style: [styles.tableHeaderCell, { flex: 1 }] }, 'Item Description'),
          H(Text, { style: [styles.tableHeaderCell, { width: 50 }] }, 'Unit'),
          H(Text, { style: [styles.tableHeaderCell, { width: 40 }] }, 'Qty'),
          H(Text, { style: [styles.tableHeaderCell, { width: 100, borderRightWidth: 0 }] }, 'Keterangan')
        ),
        ...data.items.map((item, i) => {
          const v = (child: any, style: any) => H(View, { style: { justifyContent: 'center', ...style } }, child)
          return H(View, { key: i, style: styles.tableRow },
            v(H(Text, { style: { fontSize: 9, textAlign: 'center' } }, String(i + 1)), { width: 25, padding: 4, borderRightWidth: 1, borderRightColor: '#000' }),
            v(H(Text, { style: { fontSize: 9, textAlign: 'center' } }, item.kode), { width: 90, padding: 4, borderRightWidth: 1, borderRightColor: '#000' }),
            v(H(Text, { style: { fontSize: 9 } }, item.nama), { flex: 1, padding: 4, borderRightWidth: 1, borderRightColor: '#000' }),
            v(H(Text, { style: { fontSize: 9, textAlign: 'center' } }, item.satuan), { width: 50, padding: 4, borderRightWidth: 1, borderRightColor: '#000' }),
            v(H(Text, { style: { fontSize: 9, textAlign: 'center' } }, String(item.jumlah)), { width: 40, padding: 4, borderRightWidth: 1, borderRightColor: '#000' }),
            v(H(Text, { style: { fontSize: 9 } }, item.keterangan || ''), { width: 100, padding: 4, textAlign: 'left' }),
          )
        }),
      ),

      H(View, { style: styles.infoSection },
        H(View, { style: styles.infoRow },
          H(Text, { style: styles.infoLabel }, 'Kendaraan'),
          H(Text, { style: { width: 10 } }, ':'),
          H(Text, { style: styles.infoValue }, data.kendaraanNama || '.....................................................')
        ),
        H(View, { style: styles.infoRow },
          H(Text, { style: styles.infoLabel }, 'No. Polisi'),
          H(Text, { style: { width: 10 } }, ':'),
          H(Text, { style: styles.infoValue }, data.kendaraanNoPolisi || '.....................................................')
        ),
      ),

      H(Text, { style: styles.penutupText }, 'Demikian yang kita sampaikan atas kerjasamanya kami ucapkan terima kasih.'),

      H(View, { style: styles.signatureSection },
        H(View, { style: styles.signatureBox },
          H(Text, { style: styles.signatureTitle }, 'Yang Menyerahkan,'),
          H(Text, { style: styles.signatureCompany }, c.company_nama || 'PT. RIZQI RIDHO ILAHI'),
          H(View, { style: styles.signatureWrap },
            c.tanda_tangan_stempel_url
              ? H(Image, { src: c.tanda_tangan_stempel_url, style: { height: 100, marginBottom: 2, objectFit: 'contain', position: 'absolute', left: -10 } })
              : null
          ),
          H(Text, { style: styles.signatureName }, c.penandatangan_nama || 'Mohamad Marzuqi'),
          H(Text, { style: styles.signatureJabatan }, c.penandatangan_jabatan || 'Direktur')
        ),
        H(View, { style: styles.signatureBox },
          H(Text, { style: styles.signatureTitle }, 'Diterima Oleh,'),
          H(Text, { style: styles.signatureCompany }, data.customerNama),
          H(View, { style: styles.signatureWrap }),
          H(Text, { style: styles.signatureName }, '..................................................'),
          H(Text, { style: styles.signatureJabatan }, '')
        )
      ),

      H(View, { style: styles.footer },
        H(Text, { style: styles.footerText }, c.company_alamat || 'Jerukwangi - Bangsri, Jepara'),
        H(Text, { style: styles.footerText },
          (c.company_no_hp || '+6281 2607 5500') + ', ' + (c.company_email || 'mazzjoeq@gmail.com')
        )
      ),
      H(Text, { style: styles.pageNum }, 'Page 1 of 1')
    )
  )
}
