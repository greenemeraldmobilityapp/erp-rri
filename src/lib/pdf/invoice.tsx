import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

Font.register({ family: 'Helvetica', fonts: [{ fontStyle: 'normal', fontWeight: 'normal' }, { fontStyle: 'normal', fontWeight: 'bold' }] })

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10 },
  header: { marginBottom: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0F172A' },
  subtitle: { fontSize: 10, color: '#64748B', marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  infoBox: { fontSize: 9 },
  infoLabel: { color: '#64748B', marginBottom: 2 },
  infoValue: { color: '#0F172A', fontWeight: 'bold', marginBottom: 6 },
  table: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', padding: '8 12' },
  tableHeaderCell: { flex: 1, fontSize: 8, fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', padding: '8 12' },
  tableCell: { flex: 1, fontSize: 9, color: '#0F172A' },
  totalSection: { marginTop: 20, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', padding: '4 0' },
  totalLabel: { fontSize: 10, color: '#64748B', width: 100 },
  totalValue: { fontSize: 10, fontWeight: 'bold', width: 120, textAlign: 'right' },
  grandTotal: { fontSize: 14, fontWeight: 'bold', color: '#0F172A', marginTop: 8, borderTopWidth: 2, borderTopColor: '#0F172A', paddingTop: 8 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#94A3B8', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 10 },
})

interface InvoiceItem { nama: string; kode: string; satuan: string; jumlah: number; harga: number; diskon: number; ppn: number | null; pph: number | null }
interface InvoiceData { nomor: string; customer: { nama: string; kode: string }; tanggal: string; top: string; ppn_rate: number; pph_rate: number | null; items: InvoiceItem[] }

export function InvoicePDF({ data }: { data: InvoiceData }) {
  const totalSebelumPajak = data.items.reduce((sum, i) => sum + (i.harga * i.jumlah - i.diskon), 0)
  const totalPPN = data.items.reduce((sum, i) => sum + (i.ppn ?? 0), 0)
  const totalPPh = data.items.reduce((sum, i) => sum + (i.pph ?? 0), 0)
  const grandTotal = totalSebelumPajak + totalPPN - totalPPh

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>INVOICE</Text>
          <Text style={styles.subtitle}>{data.nomor}</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Kepada</Text>
            <Text style={styles.infoValue}>{data.customer.nama}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Tanggal</Text>
            <Text style={styles.infoValue}>{data.tanggal}</Text>
            <Text style={styles.infoLabel}>TOP</Text>
            <Text style={styles.infoValue}>{data.top}</Text>
          </View>
        </View>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 0.4 }]}>Kode</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Barang</Text>
            <Text style={[styles.tableHeaderCell, { flex: 0.3 }]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Harga</Text>
            <Text style={[styles.tableHeaderCell, { flex: 0.6 }]}>Diskon</Text>
            <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Subtotal</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 0.4 }]}>{item.kode}</Text>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>{item.nama}</Text>
              <Text style={[styles.tableCell, { flex: 0.3 }]}>{item.jumlah} {item.satuan}</Text>
              <Text style={[styles.tableCell, { flex: 0.8 }]}>{item.harga.toLocaleString('id-ID')}</Text>
              <Text style={[styles.tableCell, { flex: 0.6 }]}>{item.diskon.toLocaleString('id-ID')}</Text>
              <Text style={[styles.tableCell, { flex: 0.8 }]}>{(item.harga * item.jumlah - item.diskon).toLocaleString('id-ID')}</Text>
            </View>
          ))}
        </View>
        <View style={styles.totalSection}>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Subtotal</Text><Text style={styles.totalValue}>{totalSebelumPajak.toLocaleString('id-ID')}</Text></View>
          {totalPPN > 0 && <View style={styles.totalRow}><Text style={styles.totalLabel}>PPN ({data.ppn_rate * 100}%)</Text><Text style={styles.totalValue}>{totalPPN.toLocaleString('id-ID')}</Text></View>}
          {totalPPh > 0 && <View style={styles.totalRow}><Text style={styles.totalLabel}>PPh {data.pph_rate ? `(${data.pph_rate * 100}%)` : ''}</Text><Text style={styles.totalValue}>-{totalPPh.toLocaleString('id-ID')}</Text></View>}
          <View style={styles.grandTotal}><Text style={[styles.totalLabel, { fontWeight: 'bold', fontSize: 14 }]}>Total</Text><Text style={styles.totalValue}>{grandTotal.toLocaleString('id-ID')}</Text></View>
        </View>
        <Text style={styles.footer}>Dokumen ini sah dan diproses secara elektronik | ERP RRI - PT. Rizki Ridho Ilahi</Text>
      </Page>
    </Document>
  )
}
