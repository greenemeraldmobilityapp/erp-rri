/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ReactElement } from 'react'
import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer'

Font.register({
  family: 'Arial',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/arial@1.0.4/Arial.ttf', fontWeight: 'normal', fontStyle: 'normal' },
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/arial-bold@1.0.4/Arial%20Bold.ttf', fontWeight: 'bold', fontStyle: 'normal' },
  ],
})

Font.registerHyphenationCallback((word) => [word])

const A6: [number, number] = [297.638, 419.528]

const styles = StyleSheet.create({
  page: { padding: '14 16', fontFamily: 'Arial', fontSize: 8, lineHeight: 1.3 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  logoImg: { height: 40 },
  logoFallback: { width: 40, height: 40, backgroundColor: '#1E3A5F', justifyContent: 'center', alignItems: 'center' },
  logoFallbackText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  headerText: { flex: 1 },
  pengirimNama: { fontSize: 9, fontWeight: 'bold', textDecoration: 'underline', color: '#0000FF' },
  pengirimBidangUsaha: { fontSize: 8, color: '#000', fontWeight: 'bold', lineHeight: 1, marginBottom: 1.3 },
  pengirimAlamat: { fontSize: 7, color: '#555', lineHeight: 1 },
  title: { fontSize: 11, fontWeight: 'bold', textAlign: 'center', marginBottom: 3, letterSpacing: 1 },
  divider: { borderBottomWidth: 1.5, borderBottomColor: '#000', marginBottom: 3 },
  nomorResi: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 10, letterSpacing: 1.5, color: '#0000FF' },
  infoRow: { flexDirection: 'row', marginBottom: 2 },
  infoLabel: { width: 55, fontSize: 7, color: '#000' },
  infoValue: { flex: 1, fontSize: 8, fontWeight: 'bold' },
  sectionLabel: { fontSize: 8, fontWeight: 'bold', backgroundColor: '#eee', padding: '2 4', marginBottom: 2, marginTop: 3 },
  customerNama: { fontSize: 9, fontWeight: 'bold', marginBottom: 1 },
  customerAlamat: { fontSize: 7, color: '#444', marginBottom: 3 },
  itemRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#ccc', paddingVertical: 1.5 },
  itemNo: { width: 16, fontSize: 7 },
  itemNama: { flex: 1, fontSize: 7 },
  itemQty: { width: 40, fontSize: 7, textAlign: 'right' },
  headerCellNo: { width: 16, fontSize: 7, fontWeight: 'bold' },
  headerCellNama: { flex: 1, fontSize: 7, fontWeight: 'bold' },
  headerCellQty: { width: 40, fontSize: 7, textAlign: 'right', fontWeight: 'bold' },
  barcodeWrapper: { alignItems: 'center' },
  kendaraanText: { fontSize: 7, color: '#000', textAlign: 'center' },
  footerStyle: { position: 'absolute', bottom: 8, left: 16, right: 16, alignItems: 'center', gap: 0 },
  footerText: { textAlign: 'center', fontSize: 6, color: '#999' },
  packingLabel: { fontSize: 8, fontWeight: 'bold', textAlign: 'center', color: '#0000FF', marginBottom: 2 },
})

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

interface ResiItem {
  nama: string
  jumlah: number
  urutan: number
}

interface PackingGroup {
  packingNumber: number
  items: ResiItem[]
}

interface ResiData {
  nomor: string
  hariTanggal: string
  customerNama: string
  customerAlamat: string | null
  packingGroups: PackingGroup[]
  kendaraanNama: string | null
  kendaraanNoPolisi: string | null
  pengirimNama: string
  pengirimBidangUsaha: string
  pengirimAlamat: string
  barcodeDataUri: string | null
  logoUrl: string | null
  companyNama: string
}

export function ResiPengirimanPDF({ data }: { data: ResiData }): ReactElement {
  const H = createEl

  const totalPackings = data.packingGroups.length

  // --- Fixed header (repeated on every page) ---
  const headerView = H(View, { fixed: true },
    H(View, { style: styles.headerRow },
      data.logoUrl
        ? H(Image, { src: data.logoUrl, style: styles.logoImg })
        : H(View, { style: styles.logoFallback },
            H(Text, { style: styles.logoFallbackText }, 'R')
          ),
      H(View, { style: styles.headerText },
        H(Text, { style: styles.pengirimNama }, data.companyNama || data.pengirimNama),
        data.pengirimBidangUsaha
          ? H(Text, { style: styles.pengirimBidangUsaha }, data.pengirimBidangUsaha)
          : null,
        H(Text, { style: styles.pengirimAlamat }, data.pengirimAlamat)
      )
    ),
    H(Text, { style: styles.title }, 'RESI PENGIRIMAN'),
    H(View, { style: styles.divider }),
    H(Text, { style: styles.nomorResi }, data.nomor),
    H(View, { style: styles.infoRow },
      H(Text, { style: styles.infoLabel }, 'Hari/Tanggal'),
      H(Text, { style: styles.infoValue }, data.hariTanggal)
    ),
    H(Text, { style: styles.sectionLabel }, 'PENERIMA'),
    H(Text, { style: styles.customerNama }, data.customerNama),
    H(Text, { style: styles.customerAlamat }, data.customerAlamat || '-'),
  )

  // --- Fixed footer (repeated on every page) ---
  const footerView = H(View, { style: styles.footerStyle, fixed: true },
    (data.kendaraanNama || data.kendaraanNoPolisi)
      ? H(Text, { style: styles.kendaraanText },
          `Kendaraan: ${data.kendaraanNama || '-'} (${data.kendaraanNoPolisi || '-'})`
        )
      : null,
    data.barcodeDataUri
      ? H(View, { style: styles.barcodeWrapper },
          H(Image, { src: data.barcodeDataUri, style: { width: 170, height: 35 } })
        )
      : null,
    H(Text, { style: styles.footerText }, 'Dokumen ini sah dan diproses secara elektronik | ERP RRI'),
  )

  return H(Document, null,
    ...data.packingGroups.map((group, idx) => {
      const groupNum = idx + 1
      return H(Page, { key: idx, size: A6, style: styles.page },
        headerView,
        group.items.length > 0 && totalPackings > 1
          ? H(Text, { style: styles.packingLabel }, `Packing ${groupNum} of ${totalPackings}`)
          : null,
        H(Text, { style: styles.sectionLabel }, 'BARANG'),
        H(View, { style: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#999', paddingVertical: 1.5 } },
          H(Text, { style: styles.headerCellNo }, '#'),
          H(Text, { style: styles.headerCellNama }, 'Nama Barang'),
          H(Text, { style: styles.headerCellQty }, 'Jumlah')
        ),
        ...group.items.map((item, i) => {
          return H(View, { key: i, style: styles.itemRow },
            H(Text, { style: styles.itemNo }, String(item.urutan)),
            H(Text, { style: styles.itemNama }, item.nama),
            H(Text, { style: styles.itemQty }, String(item.jumlah))
          )
        }),
        footerView,
      )
    })
  )
}
