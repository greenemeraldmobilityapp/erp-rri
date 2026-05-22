import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

Font.register({ family: 'Helvetica', fonts: [{ fontStyle: 'normal', fontWeight: 'normal' }, { fontStyle: 'normal', fontWeight: 'bold' }] })

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10 },
  header: { marginBottom: 30, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0F172A' },
  subtitle: { fontSize: 10, color: '#64748B', marginTop: 4 },
  amountBox: { marginVertical: 20, padding: 20, borderWidth: 2, borderColor: '#0F172A', borderRadius: 8, alignItems: 'center' },
  amountText: { fontSize: 28, fontWeight: 'bold', color: '#0F172A' },
  amountLabel: { fontSize: 9, color: '#64748B', marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  infoBox: { fontSize: 9 },
  infoLabel: { color: '#64748B', marginBottom: 2 },
  infoValue: { color: '#0F172A', fontWeight: 'bold', marginBottom: 6 },
  table: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', padding: '8 12' },
  tableHeaderCell: { flex: 1, fontSize: 8, fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', padding: '8 12' },
  tableCell: { flex: 1, fontSize: 9, color: '#0F172A' },
  terbilang: { marginTop: 20, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 4, fontSize: 9, fontStyle: 'italic', color: '#475569' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#94A3B8', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 10 },
})

interface KwitansiItem { invoice_nomor: string; jumlah: number }
interface KwitansiData { nomor: string; invoice_nomor: string; customer_nama: string; tanggal: string; keterangan: string | null; total: number; items: KwitansiItem[] }

export function KwitansiPDF({ data }: { data: KwitansiData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>KWITANSI</Text>
          <Text style={styles.subtitle}>{data.nomor}</Text>
        </View>
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Telah Terima Dari</Text>
          <Text style={[styles.amountText, { fontSize: 16 }]}>{data.customer_nama}</Text>
          <Text style={styles.amountLabel}>Uang Sejumlah</Text>
          <Text style={styles.amountText}>Rp {data.total.toLocaleString('id-ID')}</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>No. Kwitansi</Text>
            <Text style={styles.infoValue}>{data.nomor}</Text>
            <Text style={styles.infoLabel}>Ref. Invoice</Text>
            <Text style={styles.infoValue}>{data.invoice_nomor}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Tanggal</Text>
            <Text style={styles.infoValue}>{data.tanggal}</Text>
          </View>
        </View>
        {data.keterangan && <View style={styles.terbilang}><Text>{data.keterangan}</Text></View>}
        <Text style={styles.footer}>Dokumen ini sah dan diproses secara elektronik | ERP RRI - PT. Rizki Ridho Ilahi</Text>
      </Page>
    </Document>
  )
}
