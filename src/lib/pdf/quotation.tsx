import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer'

Font.register({
  family: 'Arial',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/arial@1.0.4/Arial.ttf', fontWeight: 'normal' },
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/arial-bold@1.0.4/Arial%20Bold.ttf', fontWeight: 'bold' },
  ],
})

const styles = StyleSheet.create({
  page: { padding: '40 50', fontFamily: 'Arial', fontSize: 10, lineHeight: 1.4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 3, borderBottomColor: '#000', paddingBottom: 12, marginBottom: 18 },
  logoBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1E3A5F', justifyContent: 'center', alignItems: 'center' },
  logoText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  headerRight: { alignItems: 'flex-end' },
  companyName: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  companyLine: { fontSize: 10, fontWeight: 'bold' },
  labelValueRow: { flexDirection: 'row', marginBottom: 2 },
  labelText: { fontSize: 10, width: 70 },
  colonText: { fontSize: 10, width: 10 },
  valueText: { fontSize: 10 },
  alamatSection: { marginBottom: 20 },
  alamatTitle: { fontSize: 10, marginBottom: 4 },
  alamatName: { fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
  alamatAddress: { fontSize: 10, maxWidth: 300, lineHeight: 1.3 },
  bodyText: { fontSize: 10, marginBottom: 8, textAlign: 'justify' },
  bodyBold: { fontSize: 10, fontWeight: 'bold' },
  keteranganText: { fontSize: 10, marginTop: 8 },
  penutupText: { fontSize: 10, marginTop: 16 },
  signatureSection: { marginTop: 24 },
  signatureTitle: { fontSize: 10, marginBottom: 2 },
  signatureCompany: { fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
  signatureImage: { width: 100, height: 50, marginBottom: 2, objectFit: 'contain' },
  stampImage: { width: 80, height: 80, objectFit: 'contain', position: 'absolute', left: 60, top: -10 },
  signatureWrap: { position: 'relative', marginTop: 4 },
  signatureName: { fontSize: 10, fontWeight: 'bold', textDecoration: 'underline' },
  signatureJabatan: { fontSize: 10 },
  signaturePhone: { fontSize: 10, marginTop: 2 },
  footer: { position: 'absolute', bottom: 24, left: 50, right: 50, borderTopWidth: 1.5, borderTopColor: '#000', paddingTop: 6, alignItems: 'center' },
  footerText: { fontSize: 9 },
  lampiranTitle: { fontSize: 11, fontWeight: 'bold', textDecoration: 'underline', marginBottom: 4 },
  lampiranSub: { fontSize: 10, marginBottom: 12 },
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
  keteranganFootnote: { fontSize: 9, fontStyle: 'italic', marginTop: 12, color: '#555' },
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
}

interface QuotData {
  nomor: string
  referensi: string | null
  lampiran: string | null
  perihal: string | null
  pic_customer_nama: string | null
  pic_customer_no_hp: string | null
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

export function QuotationPDF({ data }: { data: QuotData }) {
  const subtotal = data.items.reduce((s, i) => s + i.jumlah * i.hargaSatuan, 0)
  const totalDiskon = data.items.reduce((s, i) => s + (i.jumlah * i.hargaSatuan * (i.diskon || 0)) / 100, 0)
  const totalSebelumPpn = subtotal - totalDiskon
  const ppnAmount = data.ppn_enabled ? totalSebelumPpn * data.ppn_rate : 0
  const grandTotal = totalSebelumPpn + ppnAmount

  const c = data.company
  const bidangUsaha = c.company_bidang_usaha ?? ''
  const bidangLines = bidangUsaha.split(',').map(s => s.trim()).filter(Boolean)

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          {c.company_logo_url ? (
            <Image src={c.company_logo_url} style={{ width: 56, height: 56, borderRadius: 28 }} />
          ) : (
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>R</Text>
            </View>
          )}
          <View style={styles.headerRight}>
            <Text style={styles.companyName}>{c.company_nama || 'PT. RIZQI RIDHO ILAHI'}</Text>
            {bidangLines.map((line, i) => (
              <Text key={i} style={styles.companyLine}>{line}</Text>
            ))}
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 }}>
          <View>
            <View style={styles.labelValueRow}>
              <Text style={styles.labelText}>No. Surat</Text>
              <Text style={styles.colonText}>:</Text>
              <Text style={styles.valueText}>{data.nomor}</Text>
            </View>
            <View style={styles.labelValueRow}>
              <Text style={styles.labelText}>No. Ref.</Text>
              <Text style={styles.colonText}>:</Text>
              <Text style={styles.valueText}>{data.referensi || '-'}</Text>
            </View>
            <View style={styles.labelValueRow}>
              <Text style={styles.labelText}>Lampiran</Text>
              <Text style={styles.colonText}>:</Text>
              <Text style={styles.valueText}>{data.lampiran || '-'}</Text>
            </View>
            <View style={styles.labelValueRow}>
              <Text style={styles.labelText}>Perihal</Text>
              <Text style={styles.colonText}>:</Text>
              <Text style={styles.valueText}>{data.perihal || 'Penawaran Harga'}</Text>
            </View>
          </View>
          <View>
            <Text style={styles.valueText}>{data.tanggal}</Text>
          </View>
        </View>

        <View style={styles.alamatSection}>
          <Text style={styles.alamatTitle}>Kepada Yth.:</Text>
          <Text style={styles.alamatName}>{data.customer.nama}</Text>
          {data.pic_customer_nama && (
            <Text style={{ fontSize: 10, marginBottom: 2 }}>u.p. {data.pic_customer_nama}</Text>
          )}
          <View style={styles.alamatAddress}>
            <Text>{data.alamat || ''}</Text>
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={styles.bodyText}>Dengan hormat,</Text>
          <Text style={styles.bodyText}>
            Dengan ini kami bermaksud mengirimkan penawaran harga untuk melaksanakan pekerjaan tersebut.
          </Text>
          <Text style={{ ...styles.bodyText, marginTop: 4 }}>
            Harga yang kami ajukan adalah <Text style={styles.bodyBold}>Rp. {formatCurrency(grandTotal)}</Text>
          </Text>
          <Text style={styles.bodyText}>Dengan rincian sebagaimana terlampir.</Text>

          {data.keterangan && (
            <View style={styles.keteranganText}>
              <Text style={styles.bodyBold}>Keterangan:</Text>
              <Text style={{ fontSize: 10 }}>{data.keterangan}</Text>
            </View>
          )}
          {data.masa_berlaku && data.tanggal_berlaku_sampai && (
            <Text style={{ fontSize: 10, marginTop: 4 }}>
              - Informasi harga ini berlaku sampai {data.tanggal_berlaku_sampai}
            </Text>
          )}

          <Text style={styles.penutupText}>
            Demikian surat penawaran ini kami sampaikan, atas perhatian dan pertimbangannya diucapkan terimakasih.
          </Text>
        </View>

        <View style={styles.signatureSection}>
          <Text style={styles.signatureTitle}>Hormat kami</Text>
          <Text style={styles.signatureCompany}>{c.company_nama || 'PT. RIZQI RIDHO ILAHI'}</Text>
          <View style={styles.signatureWrap}>
            {c.tanda_tangan_url && (
              <Image src={c.tanda_tangan_url} style={styles.signatureImage} />
            )}
            {c.stempel_url && (
              <Image src={c.stempel_url} style={styles.stampImage} />
            )}
          </View>
          <View style={{ marginTop: c.tanda_tangan_url ? 0 : 40 }}>
            <Text style={styles.signatureName}>{c.penandatangan_nama || 'Mohamad Marzuqi'}</Text>
            <Text style={styles.signatureJabatan}>{c.penandatangan_jabatan || 'Direktur'}</Text>
            <Text style={styles.signaturePhone}>{c.penandatangan_no_hp || '0812-607-5500'}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{c.company_alamat || 'Jerukwangi - Bangsri, Jepara'} | {c.company_no_hp || '+6281 2607 5500'}{c.company_email ? `, ${c.company_email}` : ''}</Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.lampiranTitle}>LAMPIRAN RINCIAN PENAWARAN HARGA</Text>
        <Text style={styles.lampiranSub}>No. Surat : {data.nomor}</Text>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 0.6 }]}>No</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.8 }]}>Item</Text>
            <Text style={[styles.tableHeaderCell, { flex: 2.4 }]}>Spesification</Text>
            <Text style={[styles.tableHeaderCell, { flex: 2.4 }]}>Justification</Text>
            <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Pict</Text>
            <Text style={[styles.tableHeaderCell, { flex: 0.6 }]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, { flex: 0.7 }]}>UoM</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Price</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.5, borderRightWidth: 0 }]}>TotalPrice</Text>
          </View>
          {data.items.map((item, i) => {
            const totalPrice = item.jumlah * item.hargaSatuan
            const hasImage = !!item.image_url
            return (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCellCenter, { flex: 0.6 }]}>{i + 1}</Text>
                <Text style={[styles.tableCell, { flex: 1.8 }]}>{item.nama}</Text>
                <Text style={[styles.tableCell, { flex: 2.4 }]}>{item.specification || '-'}</Text>
                <Text style={[styles.tableCell, { flex: 2.4 }]}>{item.justification || '-'}</Text>
                <Text style={[styles.tableCellCenter, { flex: 0.8 }]}>
                  {hasImage ? '[Gambar]' : '-'}
                </Text>
                <Text style={[styles.tableCellCenter, { flex: 0.6 }]}>{item.jumlah}</Text>
                <Text style={[styles.tableCellCenter, { flex: 0.7 }]}>{item.satuan || '-'}</Text>
                <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{formatCurrency(item.hargaSatuan)}</Text>
                <Text style={[styles.tableCellLast, { flex: 1.5, textAlign: 'right' }]}>{formatCurrency(totalPrice)}</Text>
              </View>
            )
          })}
          <View style={styles.tableTotalRow}>
            <Text style={[styles.tableTotalLabel, { flex: 8.5 }]}>TOTAL</Text>
            <Text style={[styles.tableTotalValue, { flex: 1.5 }]}>{formatCurrency(grandTotal)}</Text>
          </View>
        </View>

        {data.keterangan && (
          <Text style={styles.keteranganFootnote}>* Keterangan: {data.keterangan}</Text>
        )}
      </Page>
    </Document>
  )
}
