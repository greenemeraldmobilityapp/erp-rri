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

const styles = StyleSheet.create({
  page: { padding: 10, fontFamily: 'Arial', fontSize: 8, lineHeight: 1.3 },
  card: { width: '50%', height: '50%', padding: 10, position: 'relative' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 1.5 },
  logoImg: { height: 28 },
  logoFallback: { width: 28, height: 28, backgroundColor: '#1E3A5F', justifyContent: 'center', alignItems: 'center' },
  logoFallbackText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  headerText: { flex: 1 },
  pengirimNama: { fontSize: 7.5, fontWeight: 'bold', textDecoration: 'underline', color: '#0000FF' },
  pengirimBidangUsaha: { fontSize: 6.5, color: '#000', fontWeight: 'bold', lineHeight: 1, marginBottom: 1 },
  pengirimAlamat: { fontSize: 6, color: '#555', lineHeight: 1 },
  title: { fontSize: 9, fontWeight: 'bold', textAlign: 'center', marginBottom: 2, letterSpacing: 0.5 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#000', marginBottom: 2 },
  nomorResi: { fontSize: 11, fontWeight: 'bold', textAlign: 'center', marginBottom: 6, letterSpacing: 1, color: '#0000FF' },
  infoRow: { flexDirection: 'row', marginBottom: 1.5 },
  infoLabel: { width: 45, fontSize: 6, color: '#000' },
  infoValue: { flex: 1, fontSize: 6.5, fontWeight: 'bold' },
  sectionLabel: { fontSize: 6.5, fontWeight: 'bold', backgroundColor: '#eee', padding: '1 3', marginBottom: 1, marginTop: 2 },
  customerNama: { fontSize: 7.5, fontWeight: 'bold', marginBottom: 1 },
  customerAlamat: { fontSize: 6, color: '#444', marginBottom: 2 },
  itemRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#ccc', paddingVertical: 1 },
  itemNo: { width: 14, fontSize: 6 },
  itemNama: { flex: 1, fontSize: 6 },
  itemQty: { width: 30, fontSize: 6, textAlign: 'right' },
  headerCellNo: { width: 14, fontSize: 6, fontWeight: 'bold' },
  headerCellNama: { flex: 1, fontSize: 6, fontWeight: 'bold' },
  headerCellQty: { width: 30, fontSize: 6, textAlign: 'right', fontWeight: 'bold' },
  barcodeWrapper: { alignItems: 'center' },
  kendaraanText: { fontSize: 6, color: '#000', textAlign: 'center' },
  cardFooter: { position: 'absolute', bottom: 6, left: 10, right: 10, alignItems: 'center' },
  footerText: { textAlign: 'center', fontSize: 5, color: '#999' },
  packingLabel: { fontSize: 6.5, fontWeight: 'bold', textAlign: 'center', color: '#0000FF', marginBottom: 1 },
  cutLineV: { position: 'absolute', left: '50%', top: 0, bottom: 0, borderLeftWidth: 1, borderLeftStyle: 'dashed', borderLeftColor: '#999' },
  cutLineH: { position: 'absolute', top: '50%', left: 0, right: 0, borderTopWidth: 1, borderTopStyle: 'dashed', borderTopColor: '#999' },
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

  // Render a single Resi card for one packing group
  const renderCard = (group: PackingGroup, groupNum: number) => {
    return H(View, { style: styles.card, key: groupNum },
      // Header within card
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
      totalPackings > 1
        ? H(Text, { style: styles.packingLabel }, `Packing ${groupNum} of ${totalPackings}`)
        : null,
      H(Text, { style: styles.sectionLabel }, 'BARANG'),
      H(View, { style: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#999', paddingVertical: 1 } },
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
      // Footer within card
      H(View, { style: styles.cardFooter },
        (data.kendaraanNama || data.kendaraanNoPolisi)
          ? H(Text, { style: styles.kendaraanText },
              `Kendaraan: ${data.kendaraanNama || '-'} (${data.kendaraanNoPolisi || '-'})`
            )
          : null,
        data.barcodeDataUri
          ? H(View, { style: styles.barcodeWrapper },
              H(Image, { src: data.barcodeDataUri, style: { width: 130, height: 28 } })
            )
          : null,
        H(Text, { style: styles.footerText }, 'Dokumen ini sah dan diproses secara elektronik | ERP RRI'),
      ),
    )
  }

  // Batch packings into groups of 4 per A4 page
  const CARDS_PER_PAGE = 4
  const batches: PackingGroup[][] = []
  for (let i = 0; i < data.packingGroups.length; i += CARDS_PER_PAGE) {
    batches.push(data.packingGroups.slice(i, i + CARDS_PER_PAGE))
  }

  if (batches.length === 0) {
    // Fallback: at least one page
    return H(Document, null,
      H(Page, { size: 'A4', style: styles.page }, null)
    )
  }

  return H(Document, null,
    ...batches.map((batch, pageIdx) => {
      const cards = batch.map((group, idx) => {
        const groupNum = pageIdx * CARDS_PER_PAGE + idx + 1
        return renderCard(group, groupNum)
      })
      return H(Page, { key: pageIdx, size: 'A4', style: styles.page },
        H(View, { style: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', height: '100%' } },
          ...cards,
          H(View, { key: 'cut-v', style: styles.cutLineV }),
          H(View, { key: 'cut-h', style: styles.cutLineH }),
        )
      )
    })
  )
}
